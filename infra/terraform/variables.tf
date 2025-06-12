# filename: infra/terraform/variables.tf

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "parkrun-helper"
  
  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.project_name))
    error_message = "Project name must contain only lowercase letters, numbers, and hyphens."
  }
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
  
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "West Europe"
}

variable "database_name" {
  description = "Name of the Cosmos DB database"
  type        = string
  default     = "parkrunhelper"
}

variable "cosmos_free_tier" {
  description = "Enable Cosmos DB free tier (only one per subscription)"
  type        = bool
  default     = true
}

variable "frontend_url" {
  description = "Frontend application URL for redirect URIs"
  type        = string
  default     = ""
}

variable "backend_url" {
  description = "Backend API URL for redirect URIs"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default = {
    Project     = "parkrun-helper"
    Environment = "dev"
    ManagedBy   = "terraform"
  }
}