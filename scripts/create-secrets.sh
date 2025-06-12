#!/bin/bash
# filename: scripts/create-secrets.sh

set -e

echo "🔐 Creating Docker Swarm secrets from Terraform outputs..."

# Check if terraform output file exists
if [ ! -f "terraform-outputs.json" ]; then
    echo "❌ terraform-outputs.json not found!"
    echo "Please run: terraform output -json > terraform-outputs.json"
    exit 1
fi

# Function to create secret from terraform output
create_secret() {
    local secret_name=$1
    local terraform_key=$2
    
    echo "Creating secret: $secret_name"
    
    # Extract value from terraform output
    local value=$(cat terraform-outputs.json | jq -r ".$terraform_key.value")
    
    if [ "$value" == "null" ] || [ -z "$value" ]; then
        echo "⚠️  Warning: $terraform_key not found in terraform outputs"
        return 1
    fi
    
    # Create secret if it doesn't exist
    if ! docker secret inspect $secret_name >/dev/null 2>&1; then
        echo "$value" | docker secret create $secret_name -
        echo "✅ Created secret: $secret_name"
    else
        echo "ℹ️  Secret $secret_name already exists"
    fi
}

# Create Azure AD secrets
create_secret "azure_tenant_id" "tenant_id"
create_secret "azure_client_id" "client_id"
create_secret "azure_client_secret" "client_secret"
create_secret "azure_authority" "authority"
create_secret "api_scope" "api_scope"

# Create Cosmos DB secrets
create_secret "cosmos_endpoint" "cosmos_endpoint"
create_secret "cosmos_key" "cosmos_primary_key"
create_secret "cosmos_database_name" "database_name"

# Create MongoDB secrets for fallback
if ! docker secret inspect mongo_root_username >/dev/null 2>&1; then
    echo "admin" | docker secret create mongo_root_username -
    echo "✅ Created secret: mongo_root_username"
fi

if ! docker secret inspect mongo_root_password >/dev/null 2>&1; then
    echo "$(openssl rand -base64 32)" | docker secret create mongo_root_password -
    echo "✅ Created secret: mongo_root_password"
fi

echo ""
echo "🎯 All secrets created successfully!"
echo ""
echo "Available secrets:"
docker secret ls