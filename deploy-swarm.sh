#!/bin/bash

# Parkrun Helper Organizer - Docker Swarm Deployment Script
# This script deploys the entire application stack to Docker Swarm

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
STACK_NAME="parkrun-helper"
NETWORK_NAME="parkrun-network"
REGISTRY_PREFIX="parkrun-helper"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "\n${PURPLE}==========================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}==========================================${NC}\n"
}

# Check if Docker Swarm is initialized
check_swarm() {
    print_header "Checking Docker Swarm Status"
    
    if ! docker info --format '{{.Swarm.LocalNodeState}}' | grep -q "active"; then
        print_warning "Docker Swarm is not initialized. Initializing now..."
        docker swarm init --advertise-addr 127.0.0.1
        print_success "Docker Swarm initialized"
    else
        print_success "Docker Swarm is already active"
    fi
    
    # Show swarm info
    print_status "Swarm nodes:"
    docker node ls
}

# Build all Docker images
build_images() {
    print_header "Building Docker Images"
    
    # Build backend
    print_status "Building backend image..."
    docker build -t ${REGISTRY_PREFIX}/backend:latest ./backend
    
    # Build frontend
    print_status "Building frontend image..."
    docker build -t ${REGISTRY_PREFIX}/frontend:latest ./frontend
    
    # Build database (if exists)
    if [ -d "./database" ]; then
        print_status "Building database image..."
        docker build -t ${REGISTRY_PREFIX}/database:latest ./database
    fi
    
    print_success "All images built successfully"
    
    # Show built images
    print_status "Built images:"
    docker images | grep ${REGISTRY_PREFIX}
}

# Create overlay network
create_network() {
    print_header "Creating Overlay Network"
    
    if docker network ls | grep -q ${NETWORK_NAME}; then
        print_status "Network ${NETWORK_NAME} already exists"
    else
        docker network create \
            --driver overlay \
            --attachable \
            ${NETWORK_NAME}
        print_success "Created overlay network: ${NETWORK_NAME}"
    fi
}

# Create Docker secrets from environment
create_secrets() {
    print_header "Creating Docker Secrets"
    
    # Check if .env file exists
    if [ ! -f ".env" ]; then
        print_error ".env file not found. Please create it first with your configuration."
        print_status "You can run: ./start.sh --env to create a template"
        exit 1
    fi
    
    # Source environment variables
    set -a  # automatically export all variables
    source .env
    set +a
    
    # List of secrets to create
    declare -A secrets=(
        ["azure_ad_client_id"]="${AZURE_AD_CLIENT_ID}"
        ["azure_ad_client_secret"]="${AZURE_AD_CLIENT_SECRET}"
        ["azure_ad_tenant_id"]="${AZURE_AD_TENANT_ID}"
        ["cosmos_db_endpoint"]="${COSMOS_DB_ENDPOINT}"
        ["cosmos_db_key"]="${COSMOS_DB_KEY}"
        ["cosmos_db_database_name"]="${COSMOS_DB_DATABASE_NAME}"
        ["jwt_secret"]="${JWT_SECRET}"
        ["cors_origin"]="${CORS_ORIGIN:-http://localhost:3000}"
    )
    
    # Create secrets
    for secret_name in "${!secrets[@]}"; do
        secret_value="${secrets[$secret_name]}"
        
        if [ -z "$secret_value" ] || [ "$secret_value" = "your-client-id-here" ] || [ "$secret_value" = "your-client-secret-here" ] || [ "$secret_value" = "your-tenant-id-here" ] || [ "$secret_value" = "your-primary-key-here" ] || [ "$secret_value" = "your-jwt-secret-here" ]; then
            print_warning "Secret ${secret_name} has a template/empty value. Using placeholder."
            secret_value="placeholder-${secret_name}-value"
        fi
        
        # Remove existing secret if it exists
        if docker secret ls --format "{{.Name}}" | grep -q "^${secret_name}$"; then
            print_status "Removing existing secret: ${secret_name}"
            docker secret rm ${secret_name} || true
        fi
        
        # Create new secret
        echo -n "${secret_value}" | docker secret create ${secret_name} -
        print_status "Created secret: ${secret_name}"
    done
    
    print_success "All secrets created successfully"
}

# Create Docker stack file
create_stack_file() {
    print_header "Creating Docker Stack Configuration"
    
    cat > docker-stack.yml << 'EOF'
version: '3.8'

services:
  # Traefik Load Balancer
  traefik:
    image: traefik:v2.10
    command:
      - "--api.insecure=true"
      - "--providers.docker=true"
      - "--providers.docker.swarmMode=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--metrics.prometheus=true"
      - "--metrics.prometheus.addEntryPointsLabels=true"
      - "--metrics.prometheus.addServicesLabels=true"
    ports:
      - "80:80"
      - "443:443"
      - "8080:8080"  # Traefik dashboard
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    networks:
      - parkrun-network
    deploy:
      placement:
        constraints:
          - node.role == manager
      labels:
        - "traefik.enable=true"
        - "traefik.http.routers.traefik.rule=Host(`traefik.localhost`)"
        - "traefik.http.services.traefik.loadbalancer.server.port=8080"

  # Backend API
  backend:
    image: parkrun-helper/backend:latest
    environment:
      - NODE_ENV=production
      - PORT=3000
    secrets:
      - azure_ad_client_id
      - azure_ad_client_secret
      - azure_ad_tenant_id
      - cosmos_db_endpoint
      - cosmos_db_key
      - cosmos_db_database_name
      - jwt_secret
      - cors_origin
    networks:
      - parkrun-network
    deploy:
      replicas: 2
      update_config:
        parallelism: 1
        delay: 10s
        order: start-first
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'
      labels:
        - "traefik.enable=true"
        - "traefik.http.routers.backend.rule=Host(`api.localhost`) || PathPrefix(`/api`)"
        - "traefik.http.routers.backend.entrypoints=web"
        - "traefik.http.services.backend.loadbalancer.server.port=3000"
        - "traefik.http.middlewares.backend-stripprefix.stripprefix.prefixes=/api"
        - "traefik.http.routers.backend.middlewares=backend-stripprefix"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Frontend
  frontend:
    image: parkrun-helper/frontend:latest
    networks:
      - parkrun-network
    deploy:
      replicas: 2
      update_config:
        parallelism: 1
        delay: 10s
        order: start-first
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
      resources:
        limits:
          memory: 256M
          cpus: '0.25'
        reservations:
          memory: 128M
          cpus: '0.1'
      labels:
        - "traefik.enable=true"
        - "traefik.http.routers.frontend.rule=Host(`localhost`)"
        - "traefik.http.routers.frontend.entrypoints=web"
        - "traefik.http.services.frontend.loadbalancer.server.port=80"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s

  # MongoDB (fallback database)
  database:
    image: mongo:7.0
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password123
      MONGO_INITDB_DATABASE: parkrunhelper
    volumes:
      - mongo_data:/data/db
      - ./database/init:/docker-entrypoint-initdb.d
    networks:
      - parkrun-network
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.role == manager
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Prometheus (metrics collection)
  prometheus:
    image: prom/prometheus:latest
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=168h'
      - '--web.enable-lifecycle'
    configs:
      - source: prometheus_config
        target: /etc/prometheus/prometheus.yml
    volumes:
      - prometheus_data:/prometheus
    networks:
      - parkrun-network
    ports:
      - "9090:9090"
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.role == manager
      labels:
        - "traefik.enable=true"
        - "traefik.http.routers.prometheus.rule=Host(`prometheus.localhost`)"
        - "traefik.http.services.prometheus.loadbalancer.server.port=9090"

  # Grafana (metrics visualization)
  grafana:
    image: grafana/grafana:latest
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana_data:/var/lib/grafana
    networks:
      - parkrun-network
    ports:
      - "3001:3000"
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.role == manager
      labels:
        - "traefik.enable=true"
        - "traefik.http.routers.grafana.rule=Host(`grafana.localhost`)"
        - "traefik.http.services.grafana.loadbalancer.server.port=3000"

networks:
  parkrun-network:
    external: true

volumes:
  mongo_data:
  prometheus_data:
  grafana_data:

secrets:
  azure_ad_client_id:
    external: true
  azure_ad_client_secret:
    external: true
  azure_ad_tenant_id:
    external: true
  cosmos_db_endpoint:
    external: true
  cosmos_db_key:
    external: true
  cosmos_db_database_name:
    external: true
  jwt_secret:
    external: true
  cors_origin:
    external: true

configs:
  prometheus_config:
    external: true
EOF

    print_success "Docker stack configuration created"
}

# Create Prometheus configuration
create_prometheus_config() {
    print_header "Creating Prometheus Configuration"
    
    # Remove existing config if it exists
    if docker config ls --format "{{.Name}}" | grep -q "^prometheus_config$"; then
        print_status "Removing existing Prometheus config"
        docker config rm prometheus_config || true
        sleep 2  # Wait for removal to complete
    fi
    
    # Create temporary prometheus config
    cat > /tmp/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'parkrun-backend'
    static_configs:
      - targets: ['backend:3000']
    metrics_path: '/metrics'
    scrape_interval: 10s

  - job_name: 'traefik'
    static_configs:
      - targets: ['traefik:8080']
    metrics_path: '/metrics'

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
EOF

    # Create config
    docker config create prometheus_config /tmp/prometheus.yml
    rm /tmp/prometheus.yml
    
    print_success "Prometheus configuration created"
}

# Deploy the stack
deploy_stack() {
    print_header "Deploying Docker Stack"
    
    # Deploy the stack
    docker stack deploy -c docker-stack.yml ${STACK_NAME}
    
    print_success "Stack deployment initiated"
    
    # Wait for services to start
    print_status "Waiting for services to start..."
    sleep 10
    
    # Show stack status
    print_status "Stack services:"
    docker stack services ${STACK_NAME}
    
    print_status "Service tasks:"
    docker stack ps ${STACK_NAME} --no-trunc
}

# Wait for services to be healthy
wait_for_services() {
    print_header "Waiting for Services to be Ready"
    
    local max_attempts=60
    local attempt=1
    
    print_status "Checking service health (this may take a few minutes)..."
    
    while [ $attempt -le $max_attempts ]; do
        local healthy_services=0
        local total_services=0
        
        # Check backend health
        if curl -s http://localhost/api/health > /dev/null 2>&1; then
            healthy_services=$((healthy_services + 1))
        fi
        total_services=$((total_services + 1))
        
        # Check frontend
        if curl -s http://localhost > /dev/null 2>&1; then
            healthy_services=$((healthy_services + 1))
        fi
        total_services=$((total_services + 1))
        
        # Check Prometheus
        if curl -s http://localhost:9090/-/healthy > /dev/null 2>&1; then
            healthy_services=$((healthy_services + 1))
        fi
        total_services=$((total_services + 1))
        
        # Check Grafana
        if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
            healthy_services=$((healthy_services + 1))
        fi
        total_services=$((total_services + 1))
        
        print_status "Health check attempt $attempt/$max_attempts: $healthy_services/$total_services services healthy"
        
        if [ $healthy_services -eq $total_services ]; then
            print_success "All services are healthy!"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            print_warning "Some services may still be starting. Check logs if needed."
            break
        fi
        
        sleep 10
        attempt=$((attempt + 1))
    done
}

# Show deployment information
show_deployment_info() {
    print_header "🎉 Deployment Complete!"
    
    echo -e "Application URLs:"
    echo -e "  ${GREEN}Frontend:${NC}       http://localhost"
    echo -e "  ${GREEN}Backend API:${NC}     http://localhost/api"
    echo -e "  ${GREEN}API Docs:${NC}        http://localhost/api/docs"
    echo -e "  ${GREEN}Health Check:${NC}    http://localhost/api/health"
    echo ""
    
    echo -e "Monitoring URLs:"
    echo -e "  ${YELLOW}Traefik Dashboard:${NC} http://localhost:8080"
    echo -e "  ${YELLOW}Prometheus:${NC}       http://localhost:9090"
    echo -e "  ${YELLOW}Grafana:${NC}          http://localhost:3001 (admin/admin)"
    echo ""
    
    echo -e "Alternative URLs (using subdomains):"
    echo -e "  ${BLUE}Frontend:${NC}         http://localhost"
    echo -e "  ${BLUE}Backend:${NC}          http://api.localhost"
    echo -e "  ${BLUE}Traefik:${NC}          http://traefik.localhost"
    echo -e "  ${BLUE}Prometheus:${NC}       http://prometheus.localhost"
    echo -e "  ${BLUE}Grafana:${NC}          http://grafana.localhost"
    echo ""
    
    echo -e "Management Commands:"
    echo -e "  ${BLUE}View stack:${NC}       docker stack ls"
    echo -e "  ${BLUE}View services:${NC}    docker stack services ${STACK_NAME}"
    echo -e "  ${BLUE}View logs:${NC}        docker service logs ${STACK_NAME}_backend"
    echo -e "  ${BLUE}Scale service:${NC}    docker service scale ${STACK_NAME}_backend=3"
    echo -e "  ${BLUE}Update service:${NC}   docker service update ${STACK_NAME}_backend"
    echo -e "  ${BLUE}Remove stack:${NC}     docker stack rm ${STACK_NAME}"
    echo ""
    
    echo -e "Useful Docker Commands:"
    echo -e "  ${BLUE}Service tasks:${NC}    docker stack ps ${STACK_NAME}"
    echo -e "  ${BLUE}Service logs:${NC}     docker service logs -f ${STACK_NAME}_backend"
    echo -e "  ${BLUE}Node info:${NC}        docker node ls"
    echo -e "  ${BLUE}Network info:${NC}     docker network ls"
    echo ""
    
    print_warning "Note: If using template credentials, some features may not work properly."
    print_warning "Update your .env file with real Azure AD and Cosmos DB credentials."
}

# Cleanup function
cleanup() {
    print_status "Cleaning up temporary files..."
    rm -f docker-stack.yml
}

# Handle script termination
trap cleanup EXIT

# Main execution function
main() {
    print_header "🐳 Parkrun Helper Organizer - Docker Swarm Deployment"
    
    echo "This script will deploy the entire application stack to Docker Swarm including:"
    echo "  • Traefik Load Balancer with automatic service discovery"
    echo "  • Backend API (NestJS) with health checks and metrics"
    echo "  • Frontend (React) with nginx"
    echo "  • MongoDB database with persistence"
    echo "  • Prometheus metrics collection"
    echo "  • Grafana dashboards"
    echo "  • Automatic scaling and rolling updates"
    echo ""
    
    read -p "Continue with deployment? (Y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        print_status "Deployment cancelled by user"
        exit 0
    fi
    
    check_swarm
    build_images
    create_network
    create_secrets
    create_prometheus_config
    create_stack_file
    deploy_stack
    wait_for_services
    show_deployment_info
    
    print_success "Docker Swarm deployment completed successfully! 🎉"
}

# Script options handling
case "${1:-}" in
    --help|-h)
        echo "Parkrun Helper Organizer - Docker Swarm Deployment Script"
        echo ""
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --build        Only build images"
        echo "  --deploy       Only deploy stack (assumes images exist)"
        echo "  --remove       Remove the deployed stack"
        echo "  --status       Show stack status"
        echo "  --logs         Show service logs"
        echo "  --scale        Scale services"
        echo ""
        echo "Examples:"
        echo "  $0              # Full deployment"
        echo "  $0 --build      # Only build images"
        echo "  $0 --status     # Show current status"
        echo "  $0 --remove     # Remove deployment"
        exit 0
        ;;
    --build)
        print_header "Building Images Only"
        build_images
        exit 0
        ;;
    --deploy)
        print_header "Deploying Stack Only"
        check_swarm
        create_network
        create_secrets
        create_prometheus_config
        create_stack_file
        deploy_stack
        wait_for_services
        show_deployment_info
        exit 0
        ;;
    --remove)
        print_header "Removing Stack"
        print_warning "This will remove the entire ${STACK_NAME} stack"
        read -p "Are you sure? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker stack rm ${STACK_NAME}
            print_success "Stack removed successfully"
            
            # Clean up secrets
            print_status "Cleaning up secrets..."
            docker secret rm azure_ad_client_id azure_ad_client_secret azure_ad_tenant_id \
                cosmos_db_endpoint cosmos_db_key cosmos_db_database_name jwt_secret cors_origin 2>/dev/null || true
            docker config rm prometheus_config 2>/dev/null || true
            
            print_success "Cleanup completed"
        else
            print_status "Removal cancelled"
        fi
        exit 0
        ;;
    --status)
        print_header "Stack Status"
        if docker stack ls | grep -q ${STACK_NAME}; then
            echo "Stack services:"
            docker stack services ${STACK_NAME}
            echo ""
            echo "Service tasks:"
            docker stack ps ${STACK_NAME}
        else
            print_warning "Stack ${STACK_NAME} is not deployed"
        fi
        exit 0
        ;;
    --logs)
        print_header "Service Logs"
        if docker stack ls | grep -q ${STACK_NAME}; then
            echo "Available services:"
            docker stack services ${STACK_NAME} --format "table {{.Name}}"
            echo ""
            read -p "Enter service name (e.g., ${STACK_NAME}_backend): " service_name
            if [ -n "$service_name" ]; then
                docker service logs -f "$service_name"
            fi
        else
            print_warning "Stack ${STACK_NAME} is not deployed"
        fi
        exit 0
        ;;
    --scale)
        print_header "Scale Services"
        if docker stack ls | grep -q ${STACK_NAME}; then
            echo "Current services:"
            docker stack services ${STACK_NAME}
            echo ""
            read -p "Enter service name: " service_name
            read -p "Enter number of replicas: " replicas
            if [ -n "$service_name" ] && [ -n "$replicas" ]; then
                docker service scale ${service_name}=${replicas}
                print_success "Service scaled successfully"
            fi
        else
            print_warning "Stack ${STACK_NAME} is not deployed"
        fi
        exit 0
        ;;
    "")
        main
        ;;
    *)
        print_error "Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac