# Parkrun Helper Organizer

A modern, container-first web application for managing Parkrun volunteer schedules with Microsoft Entra ID authentication and Azure cloud integration.

## 🏗️ Architecture Overview

This application follows a microservices architecture deployed with Docker Swarm:

- **Frontend**: React SPA with MSAL authentication
- **Backend**: NestJS API with JWT validation
- **Database**: Azure Cosmos DB (primary) with MongoDB fallback
- **Authentication**: Microsoft Entra ID (Azure AD)
- **Orchestration**: Docker Swarm with Traefik load balancer

For detailed architecture information, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## 🔧 Prerequisites

### Required Software
- **Docker** ≥ 20.10 with Docker Swarm support
- **Terraform** ≥ 1.6
- **Azure subscription** with appropriate permissions
- **Node.js** ≥ 18 (for local development)

### Azure Permissions Required
- Create App Registrations in Azure Entra ID
- Create Cosmos DB accounts
- Create Resource Groups

## 🚀 Quick Start

The fastest way to get the Parkrun Helper Organizer running locally:

### One-Command Start

```bash
# Clone the repository
git clone <repository-url>
cd ParkrunHelperOrganizer

# Run the quick start script
./start.sh
```

This script will:
1. ✅ Check prerequisites (Node.js, Docker, etc.)
2. ⚙️ Set up environment configuration
3. 📦 Install dependencies
4. 🔨 Build applications  
5. 🚀 Start services with Docker
6. 📊 Optionally start monitoring

### Manual Setup (Alternative)

If you prefer manual setup:

```bash
# 1. Install dependencies
cd backend && npm install --legacy-peer-deps
cd ../frontend && npm install --legacy-peer-deps

# 2. Create environment file
cp .env.example .env
# Edit .env with your Azure AD and Cosmos DB credentials

# 3. Build applications
cd backend && npm run build
cd ../frontend && npm run build

# 4. Start with Docker Compose
docker-compose -f docker-compose.dev.yml up -d
```

### Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api
- **Health Checks**: http://localhost:3001/health
- **Metrics**: http://localhost:3001/metrics

### Production Deployment

Choose your preferred deployment method:

#### Option 1: Docker Swarm (Recommended for Local/Small Scale)
```bash
# Deploy entire stack to Docker Swarm with load balancing
./deploy-swarm.sh
```

#### Option 2: Kubernetes (Recommended for Production)
```bash
# Deploy to Kubernetes with scaling and monitoring
kubectl apply -k k8s/
```

#### Option 3: Azure Infrastructure with Terraform
```bash
# Deploy Azure infrastructure first
cd infra/terraform
terraform init && terraform apply

# Then deploy application
./scripts/deploy-stack.sh
```

## 📋 Detailed Deployment Guide

### Docker Swarm Deployment (Local/Production)

The `deploy-swarm.sh` script provides a complete Docker Swarm deployment with:

#### Features
- **Traefik Load Balancer** with automatic service discovery
- **High Availability** with service replication and health checks
- **Monitoring Stack** (Prometheus, Grafana, AlertManager)
- **Automatic Scaling** and rolling updates
- **Secret Management** for sensitive data
- **Persistent Storage** for databases and metrics

#### Quick Deploy
```bash
# One-command deployment
./deploy-swarm.sh

# Available options
./deploy-swarm.sh --help    # Show help
./deploy-swarm.sh --build   # Only build images
./deploy-swarm.sh --deploy  # Only deploy (assumes images exist)
./deploy-swarm.sh --status  # Show stack status
./deploy-swarm.sh --remove  # Remove entire stack
./deploy-swarm.sh --scale   # Scale services
```

#### Access URLs
After deployment, access your services at:
- **Frontend**: http://localhost
- **Backend API**: http://localhost/api
- **Traefik Dashboard**: http://localhost:8080
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin)

#### Management Commands
```bash
# View stack status
docker stack services parkrun-helper

# View service logs  
docker service logs -f parkrun-helper_backend

# Scale a service
docker service scale parkrun-helper_backend=3

# Update a service
docker service update parkrun-helper_backend

# Remove entire stack
docker stack rm parkrun-helper
```

### Step 1: Azure Infrastructure

The Terraform configuration creates:
- Azure Entra ID application registration
- OAuth client secret and API scopes
- Cosmos DB account with containers
- Resource group for all resources

#### Configure Terraform Variables

Create `infra/terraform/terraform.tfvars`:

```hcl
project_name = "parkrun-helper"
environment  = "prod"
location     = "West Europe"

# Optional: customize URLs for production
frontend_url = "https://your-domain.com"
backend_url  = "https://api.your-domain.com"

tags = {
  Project     = "parkrun-helper"
  Environment = "production"
  ManagedBy   = "terraform"
}
```

#### Deploy Infrastructure

```bash
cd infra/terraform
terraform init
terraform apply -var-file="terraform.tfvars"
```

Save the outputs for secret creation:
```bash
terraform output -json > ../../terraform-outputs.json
```

### Step 2: Docker Configuration

#### Environment Variables

For local development, create environment files:

**Backend (.env)**:
```env
NODE_ENV=development
PORT=8080

# Azure AD Configuration
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
AZURE_AUTHORITY=https://login.microsoftonline.com/your-tenant-id

# Database Configuration
COSMOS_ENDPOINT=https://your-cosmos.documents.azure.com:443/
COSMOS_KEY=your-cosmos-key
COSMOS_DATABASE_NAME=parkrunhelper

# MongoDB fallback (for local development)
MONGODB_URI=mongodb://admin:password123@localhost:27017/parkrunhelper?authSource=admin
```

**Frontend (.env)**:
```env
REACT_APP_AZURE_CLIENT_ID=your-client-id
REACT_APP_AZURE_AUTHORITY=https://login.microsoftonline.com/your-tenant-id
REACT_APP_API_SCOPE=api://your-client-id/api.access
REACT_APP_API_BASE_URL=http://localhost:8080/api
REACT_APP_REDIRECT_URI=http://localhost:3000
REACT_APP_POST_LOGOUT_REDIRECT_URI=http://localhost:3000
```

### Step 3: Build Container Images

```bash
# Build all images
./scripts/build-images.sh

# Or build individually
docker build -t parkrun-helper/database:latest ./database
docker build -t parkrun-helper/backend:latest ./backend
docker build -t parkrun-helper/frontend:latest ./frontend
```

### Step 4: Create Docker Secrets

```bash
# Automatic creation from Terraform outputs
./scripts/create-secrets.sh

# Or create manually
echo "your-tenant-id" | docker secret create azure_tenant_id -
echo "your-client-id" | docker secret create azure_client_id -
# ... etc for all required secrets
```

Required secrets:
- `azure_tenant_id`
- `azure_client_id`
- `azure_client_secret`
- `azure_authority`
- `api_scope`
- `cosmos_endpoint`
- `cosmos_key`
- `cosmos_database_name`
- `mongo_root_username`
- `mongo_root_password`

### Step 5: Deploy Stack

```bash
# Deploy to Docker Swarm
./scripts/deploy-stack.sh

# Monitor deployment
docker stack services parkrun-helper
docker service logs parkrun-helper_frontend
docker service logs parkrun-helper_backend
```

## 🛠️ Development Mode

For local development with hot reloading:

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up

# Or run components individually
cd backend && npm run start:dev
cd frontend && npm start
```

## 📊 Monitoring and Management

### Service Status
```bash
# Check stack status
docker stack ls
docker stack services parkrun-helper

# Check individual services
docker service ps parkrun-helper_frontend
docker service ps parkrun-helper_backend
docker service ps parkrun-helper_database
```

### Logs
```bash
# View service logs
docker service logs -f parkrun-helper_frontend
docker service logs -f parkrun-helper_backend
docker service logs -f parkrun-helper_database

# View container logs
docker logs <container-id>
```

### Scaling
```bash
# Scale services
docker service scale parkrun-helper_frontend=3
docker service scale parkrun-helper_backend=3

# Update services
docker service update parkrun-helper_frontend
```

## 🔒 Security Configuration

### Entra ID Application Setup

After Terraform creates the application registration:

1. **Configure Redirect URIs**:
   - Web: `http://localhost:3000` (development)
   - SPA: `http://localhost:3000`, `http://localhost:3000/redirect`

2. **API Permissions**:
   - Microsoft Graph: `User.Read` (delegated)

3. **Expose API**:
   - Scope: `api.access` (created by Terraform)

### Certificate Management

For production deployment with HTTPS:

```bash
# Update Traefik configuration in stack.yml
# Add your domain and email for Let's Encrypt
```

## 🧪 Testing

### API Testing
```bash
# Test health endpoint
curl http://localhost:8080/api

# Test with authentication (requires token)
curl -H "Authorization: Bearer <token>" http://localhost:8080/api/secure-data
```

### Frontend Testing
```bash
cd frontend
npm test
```

### Backend Testing
```bash
cd backend
npm test
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Authentication Failures
```bash
# Check Azure AD configuration
# Verify client ID and tenant ID in secrets
docker secret inspect azure_client_id
```

#### 2. Database Connection Issues
```bash
# Check Cosmos DB connectivity
docker service logs parkrun-helper_backend | grep -i cosmos

# Fallback to MongoDB
docker service logs parkrun-helper_database
```

#### 3. Service Discovery Issues
```bash
# Check network connectivity
docker network inspect parkrun-helper_parkrun-network

# Verify service registration
docker service ls
```

#### 4. Build Failures
```bash
# Check Docker build context
docker system df
docker system prune

# Rebuild with no cache
docker build --no-cache -t parkrun-helper/backend:latest ./backend
```

### Log Analysis
```bash
# Follow logs in real-time
docker service logs -f parkrun-helper_backend 2>&1 | grep ERROR

# Export logs for analysis
docker service logs parkrun-helper_backend > backend.log
```

## 🔄 Updates and Maintenance

### Application Updates
```bash
# Build new images
./scripts/build-images.sh

# Update services (rolling update)
docker service update parkrun-helper_frontend
docker service update parkrun-helper_backend
```

### Infrastructure Updates
```bash
cd infra/terraform
terraform plan
terraform apply
```

### Secret Rotation
```bash
# Remove old secret
docker secret rm azure_client_secret

# Create new secret
echo "new-secret-value" | docker secret create azure_client_secret -

# Update service to use new secret
docker service update parkrun-helper_backend
```

## 📝 Environment Variables Reference

### Backend Service
| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Runtime environment | Yes | `production` |
| `PORT` | Service port | No | `8080` |
| `AZURE_TENANT_ID` | Azure AD tenant ID | Yes | - |
| `AZURE_CLIENT_ID` | App registration client ID | Yes | - |
| `AZURE_CLIENT_SECRET` | App registration secret | Yes | - |
| `COSMOS_ENDPOINT` | Cosmos DB endpoint URL | Yes | - |
| `COSMOS_KEY` | Cosmos DB access key | Yes | - |
| `COSMOS_DATABASE_NAME` | Database name | Yes | `parkrunhelper` |

### Frontend Service
| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `REACT_APP_AZURE_CLIENT_ID` | App registration client ID | Yes | - |
| `REACT_APP_AZURE_AUTHORITY` | Azure AD authority URL | Yes | - |
| `REACT_APP_API_SCOPE` | API scope identifier | Yes | - |
| `REACT_APP_API_BASE_URL` | Backend API URL | Yes | - |
| `REACT_APP_REDIRECT_URI` | OAuth redirect URI | No | `window.location.origin` |

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📞 Support

For support and questions:
- Create an issue in this repository
- Check the [troubleshooting section](#-troubleshooting)
- Review the [architecture documentation](./ARCHITECTURE.md)