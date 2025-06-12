# filename: infra/terraform/main.tf

terraform {
  required_version = ">= 1.6"
  required_providers {
    azuread = {
      source  = "hashicorp/azuread"
      version = "~> 2.47"
    }
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.85"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.4"
    }
  }
}

provider "azurerm" {
  features {
    resource_group {
      prevent_deletion_if_contains_resources = false
    }
  }
}

provider "azuread" {}

# Data sources
data "azuread_client_config" "current" {}
data "azurerm_client_config" "current" {}

# Resource Group
resource "azurerm_resource_group" "main" {
  name     = "rg-${var.project_name}-${var.environment}"
  location = var.location

  tags = var.tags
}

# Azure AD Application Registration
resource "azuread_application" "parkrun_app" {
  display_name     = "${var.project_name}-${var.environment}"
  owners           = [data.azuread_client_config.current.object_id]
  sign_in_audience = "AzureADMyOrg"

  # API configuration
  api {
    mapped_claims_enabled          = false
    requested_access_token_version = 2

    oauth2_permission_scope {
      admin_consent_description  = "Access Parkrun Helper API"
      admin_consent_display_name = "Access API"
      enabled                    = true
      id                        = random_uuid.api_scope_id.result
      type                      = "User"
      user_consent_description  = "Access Parkrun Helper API on your behalf"
      user_consent_display_name = "Access API"
      value                     = "api.access"
    }
  }

  # SPA configuration
  single_page_application {
    redirect_uris = [
      "http://localhost:3000",
      "http://localhost:3000/redirect",
      var.frontend_url != "" ? var.frontend_url : "http://localhost:3000",
      var.frontend_url != "" ? "${var.frontend_url}/redirect" : "http://localhost:3000/redirect"
    ]
  }

  # Web app configuration for backend
  web {
    redirect_uris = [
      var.backend_url != "" ? "${var.backend_url}/auth/callback" : "http://localhost:8080/auth/callback"
    ]
    
    implicit_grant {
      access_token_issuance_enabled = false
      id_token_issuance_enabled     = true
    }
  }

  # Required resource access
  required_resource_access {
    resource_app_id = "00000003-0000-0000-c000-000000000000" # Microsoft Graph

    resource_access {
      id   = "e1fe6dd8-ba31-4d61-89e7-88639da4683d" # User.Read
      type = "Scope"
    }
    
    resource_access {
      id   = "64a6cdd6-aab1-4aaf-94b8-3cc8405e90d0" # User.Read.All
      type = "Scope"
    }
  }

  tags = ["parkrun", "helper", "organizer"]
}

# Service Principal
resource "azuread_service_principal" "parkrun_sp" {
  application_id               = azuread_application.parkrun_app.application_id
  app_role_assignment_required = false
  owners                       = [data.azuread_client_config.current.object_id]

  tags = ["parkrun", "helper", "organizer"]
}

# Client Secret
resource "azuread_application_password" "parkrun_secret" {
  application_object_id = azuread_application.parkrun_app.object_id
  display_name          = "Backend API Secret"
  end_date_relative     = "8760h" # 1 year
}

# Random UUID for API scope
resource "random_uuid" "api_scope_id" {}

# Cosmos DB Account
resource "azurerm_cosmosdb_account" "main" {
  name                = "cosmos-${var.project_name}-${var.environment}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  offer_type          = "Standard"
  kind                = "GlobalDocumentDB"

  enable_automatic_failover = false
  enable_free_tier          = var.cosmos_free_tier

  consistency_policy {
    consistency_level = "Session"
  }

  geo_location {
    location          = azurerm_resource_group.main.location
    failover_priority = 0
  }

  tags = var.tags
}

# Cosmos DB Database
resource "azurerm_cosmosdb_sql_database" "main" {
  name                = var.database_name
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.main.name
}

# Cosmos DB Containers
resource "azurerm_cosmosdb_sql_container" "helpers" {
  name                = "helpers"
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.main.name
  database_name       = azurerm_cosmosdb_sql_database.main.name
  partition_key_path  = "/id"
  throughput          = 400

  indexing_policy {
    indexing_mode = "consistent"

    included_path {
      path = "/*"
    }

    excluded_path {
      path = "/\"_etag\"/?"
    }
  }
}

resource "azurerm_cosmosdb_sql_container" "schedules" {
  name                = "schedules"
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.main.name
  database_name       = azurerm_cosmosdb_sql_database.main.name
  partition_key_path  = "/weekKey"
  throughput          = 400

  indexing_policy {
    indexing_mode = "consistent"

    included_path {
      path = "/*"
    }

    excluded_path {
      path = "/\"_etag\"/?"
    }
  }
}