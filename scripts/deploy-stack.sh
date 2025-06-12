#!/bin/bash
# filename: scripts/deploy-stack.sh

set -e

STACK_NAME="parkrun-helper"

echo "🚀 Deploying Parkrun Helper Organizer stack..."

# Check if Docker Swarm is initialized
if ! docker node ls >/dev/null 2>&1; then
    echo "❌ Docker Swarm is not initialized!"
    echo "Run: docker swarm init"
    exit 1
fi

# Check if secrets exist
echo "🔍 Checking required secrets..."
required_secrets=(
    "azure_tenant_id"
    "azure_client_id" 
    "azure_client_secret"
    "azure_authority"
    "api_scope"
    "cosmos_endpoint"
    "cosmos_key"
    "cosmos_database_name"
    "mongo_root_username"
    "mongo_root_password"
)

missing_secrets=()
for secret in "${required_secrets[@]}"; do
    if ! docker secret inspect $secret >/dev/null 2>&1; then
        missing_secrets+=($secret)
    fi
done

if [ ${#missing_secrets[@]} -gt 0 ]; then
    echo "❌ Missing required secrets:"
    printf '%s\n' "${missing_secrets[@]}"
    echo ""
    echo "Run: ./scripts/create-secrets.sh"
    exit 1
fi

# Deploy the stack
echo "📦 Deploying stack: $STACK_NAME"
docker stack deploy -c stack.yml $STACK_NAME

echo ""
echo "✅ Stack deployed successfully!"
echo ""
echo "🔍 Stack status:"
docker stack ls

echo ""
echo "📋 Services:"
docker stack services $STACK_NAME

echo ""
echo "🌐 Access the application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8080/api"
echo "   API Docs: http://localhost:8080/api/docs"
echo "   Traefik Dashboard: http://localhost:8080"

echo ""
echo "📊 To monitor the deployment:"
echo "   docker stack services $STACK_NAME"
echo "   docker service logs ${STACK_NAME}_frontend"
echo "   docker service logs ${STACK_NAME}_backend"