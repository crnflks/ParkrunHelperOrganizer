# filename: infra/terraform/outputs.tf

output "tenant_id" {
  description = "Azure AD Tenant ID"
  value       = data.azuread_client_config.current.tenant_id
}

output "client_id" {
  description = "Azure AD Application Client ID"
  value       = azuread_application.parkrun_app.application_id
}

output "client_secret" {
  description = "Azure AD Application Client Secret"
  value       = azuread_application_password.parkrun_secret.value
  sensitive   = true
}

output "authority" {
  description = "Azure AD Authority URL"
  value       = "https://login.microsoftonline.com/${data.azuread_client_config.current.tenant_id}"
}

output "api_scope" {
  description = "API scope identifier"
  value       = "api://${azuread_application.parkrun_app.application_id}/api.access"
}

output "cosmos_endpoint" {
  description = "Cosmos DB endpoint"
  value       = azurerm_cosmosdb_account.main.endpoint
}

output "cosmos_primary_key" {
  description = "Cosmos DB primary key"
  value       = azurerm_cosmosdb_account.main.primary_key
  sensitive   = true
}

output "cosmos_connection_string" {
  description = "Cosmos DB connection string"
  value       = azurerm_cosmosdb_account.main.connection_strings[0]
  sensitive   = true
}

output "database_name" {
  description = "Cosmos DB database name"
  value       = azurerm_cosmosdb_sql_database.main.name
}

output "resource_group_name" {
  description = "Resource group name"
  value       = azurerm_resource_group.main.name
}

# For Docker Swarm secrets
output "docker_secrets" {
  description = "Environment variables for Docker services"
  value = {
    AZURE_TENANT_ID           = data.azuread_client_config.current.tenant_id
    AZURE_CLIENT_ID           = azuread_application.parkrun_app.application_id
    AZURE_CLIENT_SECRET       = azuread_application_password.parkrun_secret.value
    AZURE_AUTHORITY           = "https://login.microsoftonline.com/${data.azuread_client_config.current.tenant_id}"
    API_SCOPE                 = "api://${azuread_application.parkrun_app.application_id}/api.access"
    COSMOS_ENDPOINT           = azurerm_cosmosdb_account.main.endpoint
    COSMOS_KEY                = azurerm_cosmosdb_account.main.primary_key
    COSMOS_DATABASE_NAME      = azurerm_cosmosdb_sql_database.main.name
  }
  sensitive = true
}