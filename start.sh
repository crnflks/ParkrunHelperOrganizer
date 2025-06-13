#!/bin/bash

# Parkrun Helper Organizer - Quick Start Script
# This script sets up and starts the entire application stack

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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
    echo -e "\n${BLUE}==========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}==========================================${NC}\n"
}

# Check if required tools are installed
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    local missing_tools=()
    
    if ! command -v node &> /dev/null; then
        missing_tools+=("Node.js (v16+ required)")
    else
        NODE_VERSION=$(node --version)
        print_status "Node.js version: $NODE_VERSION"
    fi
    
    if ! command -v npm &> /dev/null; then
        missing_tools+=("npm")
    else
        NPM_VERSION=$(npm --version)
        print_status "npm version: $NPM_VERSION"
    fi
    
    if ! command -v docker &> /dev/null; then
        missing_tools+=("Docker")
    else
        DOCKER_VERSION=$(docker --version)
        print_status "Docker version: $DOCKER_VERSION"
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        missing_tools+=("Docker Compose")
    else
        COMPOSE_VERSION=$(docker-compose --version)
        print_status "Docker Compose version: $COMPOSE_VERSION"
    fi
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        print_error "Missing required tools:"
        for tool in "${missing_tools[@]}"; do
            echo "  - $tool"
        done
        echo ""
        echo "Please install the missing tools and run this script again."
        echo ""
        echo "Installation guides:"
        echo "  - Node.js: https://nodejs.org/"
        echo "  - Docker: https://docs.docker.com/get-docker/"
        echo "  - Docker Compose: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    print_success "All prerequisites are installed"
}

# Check environment files
check_environment() {
    print_header "Checking Environment Configuration"
    
    if [ ! -f ".env" ]; then
        print_warning ".env file not found. Creating from template..."
        
        cat > .env << EOF
# Environment Configuration
NODE_ENV=development

# Azure AD Configuration (Required)
AZURE_AD_CLIENT_ID=your-client-id-here
AZURE_AD_CLIENT_SECRET=your-client-secret-here
AZURE_AD_TENANT_ID=your-tenant-id-here

# Cosmos DB Configuration (Required)
COSMOS_DB_ENDPOINT=https://your-account.documents.azure.com:443/
COSMOS_DB_KEY=your-primary-key-here
COSMOS_DB_DATABASE_NAME=parkrun-helper

# JWT Configuration
JWT_SECRET=your-jwt-secret-here

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Backup Configuration
ENABLE_AUTOMATED_BACKUPS=true
BACKUP_RETENTION_DAYS=30
BACKUP_DIRECTORY=./backups

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Monitoring
PROMETHEUS_METRICS_PORT=9090
PROMETHEUS_METRICS_PATH=/metrics
EOF
        
        print_warning "Created .env file with template values."
        print_warning "Please edit .env and add your actual Azure AD and Cosmos DB credentials before proceeding."
        read -p "Press Enter when you have updated the .env file, or Ctrl+C to exit..."
    else
        print_success ".env file exists"
    fi
    
    # Check if critical values are still template values
    if grep -q "your-client-id-here\|your-tenant-id-here\|your-primary-key-here" .env; then
        print_error "Environment file contains template values. Please update with your actual credentials:"
        echo "  - AZURE_AD_CLIENT_ID"
        echo "  - AZURE_AD_CLIENT_SECRET" 
        echo "  - AZURE_AD_TENANT_ID"
        echo "  - COSMOS_DB_ENDPOINT"
        echo "  - COSMOS_DB_KEY"
        echo ""
        read -p "Continue anyway for demo purposes? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
        print_warning "Continuing with template values - some features may not work"
    fi
}

# Install dependencies
install_dependencies() {
    print_header "Installing Dependencies"
    
    # Backend dependencies
    print_status "Installing backend dependencies..."
    cd backend
    if [ ! -d "node_modules" ]; then
        npm install --legacy-peer-deps
    else
        print_status "Backend dependencies already installed"
    fi
    cd ..
    
    # Frontend dependencies
    print_status "Installing frontend dependencies..."
    cd frontend
    if [ ! -d "node_modules" ]; then
        npm install --legacy-peer-deps
    else
        print_status "Frontend dependencies already installed"
    fi
    cd ..
    
    print_success "Dependencies installed"
}

# Build applications
build_applications() {
    print_header "Building Applications"
    
    # Build backend
    print_status "Building backend..."
    cd backend
    npm run build
    cd ..
    
    # Build frontend
    print_status "Building frontend..."
    cd frontend
    npm run build
    cd ..
    
    print_success "Applications built successfully"
}

# Start services with Docker Compose
start_services() {
    print_header "Starting Services"
    
    # Copy environment file for docker-compose
    if [ -f ".env" ]; then
        cp .env backend/.env
        cp .env frontend/.env
    fi
    
    # Start the application stack
    print_status "Starting application stack with Docker Compose..."
    docker-compose -f docker-compose.dev.yml up -d
    
    # Wait for services to be ready
    print_status "Waiting for services to start..."
    sleep 10
    
    # Check if services are running
    print_status "Checking service health..."
    
    # Check backend health
    for i in {1..30}; do
        if curl -s http://localhost:3001/health > /dev/null 2>&1; then
            print_success "Backend is healthy"
            break
        fi
        if [ $i -eq 30 ]; then
            print_warning "Backend health check timeout - it may still be starting"
        fi
        sleep 2
    done
    
    # Check frontend
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        print_success "Frontend is accessible"
    else
        print_warning "Frontend may still be starting"
    fi
    
    print_success "Services started successfully"
}

# Start monitoring stack (optional)
start_monitoring() {
    print_header "Starting Monitoring Stack (Optional)"
    
    read -p "Do you want to start the monitoring stack (Prometheus, Grafana)? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Starting monitoring stack..."
        docker-compose -f monitoring/docker-compose.monitoring.yml up -d
        
        print_status "Waiting for monitoring services..."
        sleep 15
        
        # Check monitoring services
        if curl -s http://localhost:9090 > /dev/null 2>&1; then
            print_success "Prometheus is accessible at http://localhost:9090"
        fi
        
        if curl -s http://localhost:3001 > /dev/null 2>&1; then
            print_success "Grafana is accessible at http://localhost:3001 (admin/admin)"
        fi
    else
        print_status "Skipping monitoring stack"
    fi
}

# Display final information
show_final_info() {
    print_header "🎉 Parkrun Helper Organizer Started Successfully!"
    
    echo -e "Application URLs:"
    echo -e "  ${GREEN}Frontend:${NC}  http://localhost:3000"
    echo -e "  ${GREEN}Backend API:${NC} http://localhost:3001"
    echo -e "  ${GREEN}API Docs:${NC} http://localhost:3001/api"
    echo ""
    
    echo -e "Health Check URLs:"
    echo -e "  ${BLUE}Basic Health:${NC} http://localhost:3001/health"
    echo -e "  ${BLUE}Deep Health:${NC}  http://localhost:3001/health/deep"
    echo -e "  ${BLUE}Metrics:${NC}      http://localhost:3001/metrics"
    echo ""
    
    if docker-compose -f monitoring/docker-compose.monitoring.yml ps | grep -q "Up"; then
        echo -e "Monitoring URLs:"
        echo -e "  ${YELLOW}Prometheus:${NC} http://localhost:9090"
        echo -e "  ${YELLOW}Grafana:${NC}    http://localhost:3001 (admin/admin)"
        echo ""
    fi
    
    echo -e "Useful Commands:"
    echo -e "  ${BLUE}View logs:${NC}        docker-compose -f docker-compose.dev.yml logs -f"
    echo -e "  ${BLUE}Stop services:${NC}    docker-compose -f docker-compose.dev.yml down"
    echo -e "  ${BLUE}Restart:${NC}          docker-compose -f docker-compose.dev.yml restart"
    echo -e "  ${BLUE}Backend shell:${NC}    docker-compose -f docker-compose.dev.yml exec backend bash"
    echo ""
    
    echo -e "Development Commands:"
    echo -e "  ${BLUE}Backend dev:${NC}      cd backend && npm run start:dev"
    echo -e "  ${BLUE}Frontend dev:${NC}     cd frontend && npm start"
    echo -e "  ${BLUE}Run tests:${NC}        cd backend && npm test"
    echo ""
    
    print_warning "Note: If you're using template credentials, some features may not work properly."
    print_warning "Update your .env file with real Azure AD and Cosmos DB credentials for full functionality."
}

# Cleanup function for graceful exit
cleanup() {
    print_status "Cleaning up..."
    # Could add cleanup tasks here if needed
}

# Trap for cleanup on exit
trap cleanup EXIT

# Main execution
main() {
    print_header "🚀 Parkrun Helper Organizer - Quick Start"
    
    echo "This script will:"
    echo "  1. Check prerequisites"
    echo "  2. Set up environment configuration"
    echo "  3. Install dependencies"
    echo "  4. Build applications"
    echo "  5. Start services with Docker"
    echo "  6. Optionally start monitoring"
    echo ""
    
    read -p "Continue? (Y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        print_status "Aborted by user"
        exit 0
    fi
    
    check_prerequisites
    check_environment
    install_dependencies
    build_applications
    start_services
    start_monitoring
    show_final_info
    
    print_success "Setup complete! 🎉"
}

# Script options
case "${1:-}" in
    --help|-h)
        echo "Parkrun Helper Organizer Quick Start Script"
        echo ""
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --check        Only check prerequisites"
        echo "  --env          Only setup environment"
        echo "  --deps         Only install dependencies"
        echo "  --build        Only build applications"
        echo "  --start        Only start services"
        echo ""
        echo "With no options, runs the full setup process."
        exit 0
        ;;
    --check)
        check_prerequisites
        exit 0
        ;;
    --env)
        check_environment
        exit 0
        ;;
    --deps)
        install_dependencies
        exit 0
        ;;
    --build)
        build_applications
        exit 0
        ;;
    --start)
        start_services
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