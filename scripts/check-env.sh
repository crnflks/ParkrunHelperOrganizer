#!/bin/bash
# filename: scripts/check-env.sh

set -e

echo "🔍 Environment Variables Validation"
echo "=================================="

check_backend_env() {
  echo ""
  echo "📦 Checking backend environment..."
  
  required_vars=(
    "AZURE_TENANT_ID"
    "AZURE_CLIENT_ID" 
    "AZURE_CLIENT_SECRET"
    "COSMOS_ENDPOINT"
    "COSMOS_KEY"
    "COSMOS_DATABASE_NAME"
  )
  
  optional_vars=(
    "NODE_ENV"
    "PORT"
    "MONGODB_URI"
    "JWT_SECRET"
  )
  
  missing_vars=()
  present_vars=()
  
  for var in "${required_vars[@]}"; do
    if [[ -z "${!var}" ]]; then
      missing_vars+=("$var")
    else
      present_vars+=("$var")
    fi
  done
  
  # Display present variables
  if [[ ${#present_vars[@]} -gt 0 ]]; then
    echo "✅ Present required variables:"
    for var in "${present_vars[@]}"; do
      # Mask sensitive values
      case $var in
        *SECRET*|*KEY*|*PASSWORD*)
          echo "   $var=***masked***"
          ;;
        *)
          echo "   $var=${!var}"
          ;;
      esac
    done
  fi
  
  # Display optional variables
  echo ""
  echo "📋 Optional variables:"
  for var in "${optional_vars[@]}"; do
    if [[ -n "${!var}" ]]; then
      case $var in
        *SECRET*|*KEY*|*PASSWORD*)
          echo "   $var=***masked***"
          ;;
        *)
          echo "   $var=${!var}"
          ;;
      esac
    else
      echo "   $var=(not set)"
    fi
  done
  
  if [[ ${#missing_vars[@]} -gt 0 ]]; then
    echo ""
    echo "❌ Missing required variables:"
    printf '   %s\n' "${missing_vars[@]}"
    return 1
  fi
  
  echo ""
  echo "✅ All backend required variables present"
  return 0
}

check_frontend_env() {
  echo ""
  echo "🌐 Checking frontend environment..."
  
  required_vars=(
    "REACT_APP_AZURE_CLIENT_ID"
    "REACT_APP_AZURE_AUTHORITY"
    "REACT_APP_API_SCOPE"
    "REACT_APP_API_BASE_URL"
  )
  
  optional_vars=(
    "REACT_APP_REDIRECT_URI"
    "REACT_APP_POST_LOGOUT_REDIRECT_URI"
    "REACT_APP_DEBUG"
    "GENERATE_SOURCEMAP"
  )
  
  missing_vars=()
  present_vars=()
  
  for var in "${required_vars[@]}"; do
    if [[ -z "${!var}" ]]; then
      missing_vars+=("$var")
    else
      present_vars+=("$var")
    fi
  done
  
  # Display present variables
  if [[ ${#present_vars[@]} -gt 0 ]]; then
    echo "✅ Present required variables:"
    for var in "${present_vars[@]}"; do
      echo "   $var=${!var}"
    done
  fi
  
  # Display optional variables
  echo ""
  echo "📋 Optional variables:"
  for var in "${optional_vars[@]}"; do
    if [[ -n "${!var}" ]]; then
      echo "   $var=${!var}"
    else
      echo "   $var=(not set)"
    fi
  done
  
  if [[ ${#missing_vars[@]} -gt 0 ]]; then
    echo ""
    echo "❌ Missing required variables:"
    printf '   %s\n' "${missing_vars[@]}"
    return 1
  fi
  
  echo ""
  echo "✅ All frontend required variables present"
  return 0
}

check_docker_secrets() {
  echo ""
  echo "🔐 Checking Docker secrets..."
  
  if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker not found, skipping secrets check"
    return 0
  fi
  
  if ! docker info --format '{{.Swarm.LocalNodeState}}' 2>/dev/null | grep -q "active"; then
    echo "⚠️  Docker Swarm not active, skipping secrets check"
    return 0
  fi
  
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
  
  optional_secrets=(
    "mongo_root_username"
    "mongo_root_password"
  )
  
  missing_secrets=()
  present_secrets=()
  
  for secret in "${required_secrets[@]}"; do
    if docker secret inspect "$secret" >/dev/null 2>&1; then
      present_secrets+=("$secret")
    else
      missing_secrets+=("$secret")
    fi
  done
  
  # Display present secrets
  if [[ ${#present_secrets[@]} -gt 0 ]]; then
    echo "✅ Present required secrets:"
    printf '   %s\n' "${present_secrets[@]}"
  fi
  
  # Display optional secrets
  echo ""
  echo "📋 Optional secrets:"
  for secret in "${optional_secrets[@]}"; do
    if docker secret inspect "$secret" >/dev/null 2>&1; then
      echo "   $secret (present)"
    else
      echo "   $secret (not set)"
    fi
  done
  
  if [[ ${#missing_secrets[@]} -gt 0 ]]; then
    echo ""
    echo "❌ Missing required secrets:"
    printf '   %s\n' "${missing_secrets[@]}"
    echo ""
    echo "💡 Create missing secrets with:"
    echo "   ./scripts/create-secrets.sh"
    return 1
  fi
  
  echo ""
  echo "✅ All required Docker secrets present"
  return 0
}

check_terraform_outputs() {
  echo ""
  echo "🏗️ Checking Terraform outputs..."
  
  if [[ ! -f "terraform-outputs.json" ]]; then
    echo "⚠️  terraform-outputs.json not found"
    echo "💡 Generate with: cd infra/terraform && terraform output -json > ../../terraform-outputs.json"
    return 0
  fi
  
  if ! command -v jq &> /dev/null; then
    echo "⚠️  jq not found, skipping Terraform outputs validation"
    return 0
  fi
  
  required_outputs=(
    "tenant_id"
    "client_id"
    "client_secret"
    "authority"
    "api_scope"
    "cosmos_endpoint"
    "cosmos_primary_key"
    "database_name"
  )
  
  missing_outputs=()
  present_outputs=()
  
  for output in "${required_outputs[@]}"; do
    if jq -e ".$output" terraform-outputs.json >/dev/null 2>&1; then
      present_outputs+=("$output")
    else
      missing_outputs+=("$output")
    fi
  done
  
  # Display present outputs
  if [[ ${#present_outputs[@]} -gt 0 ]]; then
    echo "✅ Present Terraform outputs:"
    printf '   %s\n' "${present_outputs[@]}"
  fi
  
  if [[ ${#missing_outputs[@]} -gt 0 ]]; then
    echo ""
    echo "❌ Missing Terraform outputs:"
    printf '   %s\n' "${missing_outputs[@]}"
    echo ""
    echo "💡 Regenerate with: cd infra/terraform && terraform output -json > ../../terraform-outputs.json"
    return 1
  fi
  
  echo ""
  echo "✅ All required Terraform outputs present"
  return 0
}

# Main execution
main() {
  local backend_ok=true
  local frontend_ok=true
  local secrets_ok=true
  local terraform_ok=true
  
  # Check backend environment
  if [[ -f "backend/.env" ]]; then
    source backend/.env 2>/dev/null
    check_backend_env || backend_ok=false
  else
    echo ""
    echo "⚠️  backend/.env not found"
    echo "💡 Copy from: cp backend/.env.example backend/.env"
    backend_ok=false
  fi
  
  # Check frontend environment
  if [[ -f "frontend/.env" ]]; then
    source frontend/.env 2>/dev/null
    check_frontend_env || frontend_ok=false
  else
    echo ""
    echo "⚠️  frontend/.env not found"
    echo "💡 Copy from: cp frontend/.env.example frontend/.env"
    frontend_ok=false
  fi
  
  # Check Docker secrets
  check_docker_secrets || secrets_ok=false
  
  # Check Terraform outputs
  check_terraform_outputs || terraform_ok=false
  
  # Summary
  echo ""
  echo "📊 Environment Check Summary"
  echo "=========================="
  echo "Backend Environment:  $($backend_ok && echo "✅ OK" || echo "❌ Issues")"
  echo "Frontend Environment: $($frontend_ok && echo "✅ OK" || echo "❌ Issues")"
  echo "Docker Secrets:       $($secrets_ok && echo "✅ OK" || echo "❌ Issues")"
  echo "Terraform Outputs:    $($terraform_ok && echo "✅ OK" || echo "❌ Issues")"
  
  if $backend_ok && $frontend_ok && $secrets_ok && $terraform_ok; then
    echo ""
    echo "🎉 All environment checks passed!"
    return 0
  else
    echo ""
    echo "⚠️  Some environment issues found. Please address them before deployment."
    return 1
  fi
}

# Run main function
main "$@"