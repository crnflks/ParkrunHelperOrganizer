# Environment Variables & Secrets Manifest

This document provides a comprehensive reference for all environment variables and secrets required by the Parkrun Helper Organizer application.

## 📋 Overview

The application uses a combination of:
- **Environment Variables**: Non-sensitive configuration
- **Docker Secrets**: Sensitive data (passwords, keys, tokens)
- **Terraform Outputs**: Infrastructure-generated values

## 🔐 Docker Secrets

### Azure Entra ID Secrets

| Secret Name | Description | Source | Required |
|-------------|-------------|---------|----------|
| `azure_tenant_id` | Azure AD Tenant ID | Terraform output: `tenant_id` | ✅ |
| `azure_client_id` | App Registration Client ID | Terraform output: `client_id` | ✅ |
| `azure_client_secret` | App Registration Client Secret | Terraform output: `client_secret` | ✅ |
| `azure_authority` | Azure AD Authority URL | Terraform output: `authority` | ✅ |
| `api_scope` | API Scope Identifier | Terraform output: `api_scope` | ✅ |

### Database Secrets

| Secret Name | Description | Source | Required |
|-------------|-------------|---------|----------|
| `cosmos_endpoint` | Cosmos DB Endpoint URL | Terraform output: `cosmos_endpoint` | ✅ |
| `cosmos_key` | Cosmos DB Primary Key | Terraform output: `cosmos_primary_key` | ✅ |
| `cosmos_database_name` | Cosmos DB Database Name | Terraform output: `database_name` | ✅ |
| `mongo_root_username` | MongoDB Root Username | Generated: `admin` | ⚠️ |
| `mongo_root_password` | MongoDB Root Password | Generated: Random | ⚠️ |

> ⚠️ **Note**: MongoDB secrets are only required when using local MongoDB instead of Cosmos DB

---

## 🌐 Environment Variables

### Backend Service Variables

#### Production (Docker Swarm)
```yaml
# In stack.yml
environment:
  NODE_ENV: production
  PORT: 8080
  
  # Azure AD Configuration (from secrets)
  AZURE_TENANT_ID_FILE: /run/secrets/azure_tenant_id
  AZURE_CLIENT_ID_FILE: /run/secrets/azure_client_id
  AZURE_CLIENT_SECRET_FILE: /run/secrets/azure_client_secret
  AZURE_AUTHORITY_FILE: /run/secrets/azure_authority
  
  # Cosmos DB Configuration (from secrets)
  COSMOS_ENDPOINT_FILE: /run/secrets/cosmos_endpoint
  COSMOS_KEY_FILE: /run/secrets/cosmos_key
  COSMOS_DATABASE_NAME_FILE: /run/secrets/cosmos_database_name
  
  # MongoDB Fallback (from secrets)
  MONGODB_URI: mongodb://database:27017/parkrunhelper
  MONGODB_USERNAME_FILE: /run/secrets/mongo_root_username
  MONGODB_PASSWORD_FILE: /run/secrets/mongo_root_password
```

#### Development (.env)
```bash
NODE_ENV=development
PORT=8080

# Azure AD Configuration
AZURE_TENANT_ID=your-tenant-id-here
AZURE_CLIENT_ID=your-client-id-here
AZURE_CLIENT_SECRET=your-client-secret-here
AZURE_AUTHORITY=https://login.microsoftonline.com/your-tenant-id-here

# Database Configuration
COSMOS_ENDPOINT=https://your-cosmos.documents.azure.com:443/
COSMOS_KEY=your-cosmos-key-here
COSMOS_DATABASE_NAME=parkrunhelper

# MongoDB fallback (for local development)
MONGODB_URI=mongodb://admin:password123@localhost:27017/parkrunhelper?authSource=admin

# Optional: JWT Secret for testing
JWT_SECRET=your-jwt-secret-for-testing
```

### Frontend Service Variables

#### Production (Docker Swarm)
```yaml
# In stack.yml
environment:
  # Azure AD Configuration (from secrets)
  REACT_APP_AZURE_CLIENT_ID_FILE: /run/secrets/azure_client_id
  REACT_APP_AZURE_AUTHORITY_FILE: /run/secrets/azure_authority
  REACT_APP_API_SCOPE_FILE: /run/secrets/api_scope
  
  # API Configuration
  REACT_APP_API_BASE_URL: http://backend:8080/api
  REACT_APP_REDIRECT_URI: http://localhost:3000
  REACT_APP_POST_LOGOUT_REDIRECT_URI: http://localhost:3000
```

#### Development (.env)
```bash
# Azure AD Configuration
REACT_APP_AZURE_CLIENT_ID=your-client-id-here
REACT_APP_AZURE_AUTHORITY=https://login.microsoftonline.com/your-tenant-id-here
REACT_APP_API_SCOPE=api://your-client-id-here/api.access

# API Configuration
REACT_APP_API_BASE_URL=http://localhost:8080/api
REACT_APP_REDIRECT_URI=http://localhost:3000
REACT_APP_POST_LOGOUT_REDIRECT_URI=http://localhost:3000

# Optional: Development overrides
REACT_APP_DEBUG=true
GENERATE_SOURCEMAP=true
```

### Database Service Variables

#### MongoDB (Development)
```yaml
# In docker-compose.dev.yml
environment:
  MONGO_INITDB_ROOT_USERNAME: admin
  MONGO_INITDB_ROOT_PASSWORD: password123
  MONGO_INITDB_DATABASE: parkrunhelper
```

#### MongoDB (Production)
```yaml
# In stack.yml
environment:
  MONGO_INITDB_ROOT_USERNAME_FILE: /run/secrets/mongo_root_username
  MONGO_INITDB_ROOT_PASSWORD_FILE: /run/secrets/mongo_root_password
  MONGO_INITDB_DATABASE: parkrunhelper
```

---

## 🔧 Configuration by Environment

### Local Development

```bash
# Required files:
backend/.env
frontend/.env
docker-compose.dev.yml

# Setup:
1. Copy .env.example files
2. Fill in Azure AD values from Azure Portal
3. Use local MongoDB or Azure Cosmos DB
4. Run: docker-compose -f docker-compose.dev.yml up
```

### Docker Swarm Production

```bash
# Required secrets (created by Terraform):
azure_tenant_id
azure_client_id
azure_client_secret
azure_authority
api_scope
cosmos_endpoint
cosmos_key
cosmos_database_name

# Optional secrets (for MongoDB fallback):
mongo_root_username
mongo_root_password

# Setup:
1. Deploy infrastructure: terraform apply
2. Create secrets: ./scripts/create-secrets.sh
3. Deploy stack: ./scripts/deploy-stack.sh
```

### Cloud Production (Advanced)

```bash
# Additional variables for cloud deployment:
FRONTEND_URL=https://your-domain.com
BACKEND_URL=https://api.your-domain.com
TRAEFIK_DOMAIN=your-domain.com
TRAEFIK_EMAIL=admin@your-domain.com
SSL_RESOLVER=letsencrypt
```

---

## 🔍 Variable Validation

### Required Variables Checker

```bash
#!/bin/bash
# scripts/check-env.sh

check_backend_env() {
  echo "🔍 Checking backend environment..."
  
  required_vars=(
    "AZURE_TENANT_ID"
    "AZURE_CLIENT_ID" 
    "AZURE_CLIENT_SECRET"
    "COSMOS_ENDPOINT"
    "COSMOS_KEY"
  )
  
  missing_vars=()
  
  for var in "${required_vars[@]}"; do
    if [[ -z "${!var}" ]]; then
      missing_vars+=("$var")
    fi
  done
  
  if [[ ${#missing_vars[@]} -gt 0 ]]; then
    echo "❌ Missing required variables:"
    printf '%s\n' "${missing_vars[@]}"
    return 1
  fi
  
  echo "✅ All backend variables present"
}

check_frontend_env() {
  echo "🔍 Checking frontend environment..."
  
  required_vars=(
    "REACT_APP_AZURE_CLIENT_ID"
    "REACT_APP_AZURE_AUTHORITY"
    "REACT_APP_API_SCOPE"
    "REACT_APP_API_BASE_URL"
  )
  
  missing_vars=()
  
  for var in "${required_vars[@]}"; do
    if [[ -z "${!var}" ]]; then
      missing_vars+=("$var")
    fi
  done
  
  if [[ ${#missing_vars[@]} -gt 0 ]]; then
    echo "❌ Missing required variables:"
    printf '%s\n' "${missing_vars[@]}"
    return 1
  fi
  
  echo "✅ All frontend variables present"
}

# Run checks
source backend/.env 2>/dev/null
check_backend_env

source frontend/.env 2>/dev/null  
check_frontend_env
```

### Docker Secrets Validator

```bash
#!/bin/bash
# scripts/validate-secrets.sh

echo "🔐 Validating Docker secrets..."

required_secrets=(
  "azure_tenant_id"
  "azure_client_id"
  "azure_client_secret"
  "azure_authority"
  "api_scope"
  "cosmos_endpoint"
  "cosmos_key"
  "cosmos_database_name"
)

missing_secrets=()

for secret in "${required_secrets[@]}"; do
  if ! docker secret inspect "$secret" >/dev/null 2>&1; then
    missing_secrets+=("$secret")
  fi
done

if [[ ${#missing_secrets[@]} -gt 0 ]]; then
  echo "❌ Missing required secrets:"
  printf '%s\n' "${missing_secrets[@]}"
  echo ""
  echo "Create missing secrets with:"
  echo "./scripts/create-secrets.sh"
  exit 1
fi

echo "✅ All required secrets present"
```

---

## 🏗️ Terraform Integration

### Output Mapping

```hcl
# infra/terraform/outputs.tf

# Maps to docker secret: azure_tenant_id
output "tenant_id" {
  value = data.azuread_client_config.current.tenant_id
}

# Maps to docker secret: azure_client_id
output "client_id" {
  value = azuread_application.parkrun_app.application_id
}

# Maps to docker secret: azure_client_secret
output "client_secret" {
  value     = azuread_application_password.parkrun_secret.value
  sensitive = true
}

# Maps to docker secret: azure_authority
output "authority" {
  value = "https://login.microsoftonline.com/${data.azuread_client_config.current.tenant_id}"
}

# Maps to docker secret: api_scope
output "api_scope" {
  value = "api://${azuread_application.parkrun_app.application_id}/api.access"
}

# Maps to docker secret: cosmos_endpoint
output "cosmos_endpoint" {
  value = azurerm_cosmosdb_account.main.endpoint
}

# Maps to docker secret: cosmos_key
output "cosmos_primary_key" {
  value     = azurerm_cosmosdb_account.main.primary_key
  sensitive = true
}

# Maps to docker secret: cosmos_database_name
output "database_name" {
  value = azurerm_cosmosdb_sql_database.main.name
}
```

### Environment-Specific Outputs

```bash
# Export for different environments
terraform output -json > terraform-outputs.json

# Development
terraform workspace select dev
terraform output -json > terraform-outputs-dev.json

# Production  
terraform workspace select prod
terraform output -json > terraform-outputs-prod.json
```

---

## 🔧 Variable Sources Priority

### Backend (NestJS)
1. **Docker Secrets** (production) - `/run/secrets/*`
2. **Environment Variables** (development) - `process.env.*`
3. **Configuration Files** (fallback) - `.env` files
4. **Default Values** (hardcoded) - In application code

### Frontend (React)
1. **Build-time Variables** - `REACT_APP_*` at build time
2. **Runtime Configuration** (advanced) - Loaded from `/config.json`
3. **Default Values** - In application code

---

## 🛡️ Security Best Practices

### Secret Management
- ✅ **DO**: Use Docker Secrets for sensitive data
- ✅ **DO**: Rotate secrets regularly
- ✅ **DO**: Use least-privilege access
- ❌ **DON'T**: Put secrets in environment variables
- ❌ **DON'T**: Commit secrets to version control
- ❌ **DON'T**: Log secret values

### Environment Separation
```bash
# Development
- Use .env files
- Mock external services
- Use local database
- Debug logging enabled

# Staging  
- Use Docker secrets
- Real external services
- Shared test database
- Info logging level

# Production
- Use Docker secrets
- Production services
- Dedicated database
- Error logging only
```

---

## 📝 Quick Reference

### Create Development Environment
```bash
# 1. Copy example files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 2. Get values from Azure Portal or Terraform
# 3. Update .env files with real values

# 4. Start development
docker-compose -f docker-compose.dev.yml up
```

### Create Production Secrets
```bash
# 1. Deploy infrastructure
cd infra/terraform && terraform apply

# 2. Export outputs
terraform output -json > ../../terraform-outputs.json

# 3. Create secrets
./scripts/create-secrets.sh

# 4. Deploy application
./scripts/deploy-stack.sh
```

### Troubleshoot Environment Issues
```bash
# Check environment variables
./scripts/check-env.sh

# Validate secrets
./scripts/validate-secrets.sh

# Test connectivity
curl -f http://localhost:8080/api
```