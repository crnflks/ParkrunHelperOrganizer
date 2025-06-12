# Parkrun Helper Organizer - Architecture

## High-Level Architecture

```mermaid
graph TB
    subgraph "Azure Cloud"
        AD[Azure Entra ID]
        COSMOS[(Cosmos DB)]
    end
    
    subgraph "Docker Swarm Cluster"
        subgraph "Overlay Network: parkrun-network"
            LB[Traefik Load Balancer]
            
            subgraph "Frontend Replicas"
                FE1[Frontend Service 1]
                FE2[Frontend Service 2]
            end
            
            subgraph "Backend Replicas"
                BE1[Backend Service 1]
                BE2[Backend Service 2]
            end
            
            subgraph "Database Layer"
                MONGO[(MongoDB)]
            end
        end
        
        subgraph "Docker Secrets"
            SEC[Encrypted Secrets Store]
        end
        
        subgraph "Persistent Storage"
            VOL[Docker Volumes]
        end
    end
    
    subgraph "Client"
        BROWSER[Web Browser]
        USER[End User]
    end
    
    subgraph "Infrastructure as Code"
        TF[Terraform]
    end
    
    %% User interactions
    USER --> BROWSER
    BROWSER --> LB
    
    %% Load balancer routing
    LB --> FE1
    LB --> FE2
    
    %% Frontend to backend communication
    FE1 --> BE1
    FE1 --> BE2
    FE2 --> BE1
    FE2 --> BE2
    
    %% Backend to database
    BE1 --> MONGO
    BE1 --> COSMOS
    BE2 --> MONGO
    BE2 --> COSMOS
    
    %% Authentication flow
    FE1 --> AD
    FE2 --> AD
    BE1 --> AD
    BE2 --> AD
    
    %% Secrets access
    BE1 --> SEC
    BE2 --> SEC
    FE1 --> SEC
    FE2 --> SEC
    
    %% Persistent storage
    MONGO --> VOL
    LB --> VOL
    
    %% Infrastructure provisioning
    TF --> AD
    TF --> COSMOS
    TF --> SEC
    
    %% Styling
    classDef azure fill:#0078d4,stroke:#005a9e,stroke-width:2px,color:#fff
    classDef docker fill:#2496ed,stroke:#1a73e8,stroke-width:2px,color:#fff
    classDef app fill:#28a745,stroke:#1e7e34,stroke-width:2px,color:#fff
    classDef data fill:#ffc107,stroke:#e0a800,stroke-width:2px,color:#000
    classDef client fill:#6f42c1,stroke:#5a2d91,stroke-width:2px,color:#fff
    classDef infra fill:#fd7e14,stroke:#dc6002,stroke-width:2px,color:#fff
    
    class AD,COSMOS azure
    class LB,SEC,VOL docker
    class FE1,FE2,BE1,BE2 app
    class MONGO data
    class BROWSER,USER client
    class TF infra
```

## Component Details

### Frontend Layer
- **Technology**: React 18 + TypeScript
- **Authentication**: Microsoft MSAL for PKCE/OIDC flow
- **Container**: Nginx-served static files
- **Replicas**: 2 instances for high availability
- **Features**:
  - Protected routes with JWT validation
  - Responsive design with Parkrun branding
  - Helper management interface
  - Schedule management interface

### Backend API Layer
- **Technology**: NestJS + TypeScript
- **Authentication**: JWT validation against Azure Entra ID
- **Database**: Cosmos DB (primary) with MongoDB fallback
- **Container**: Node.js 20 Alpine
- **Replicas**: 2 instances for high availability
- **Features**:
  - RESTful API with OpenAPI documentation
  - Role-based access control
  - Automatic JWT token validation
  - Data persistence to NoSQL database

### Database Layer
- **Primary**: Azure Cosmos DB (managed service)
- **Fallback**: MongoDB (containerized)
- **Data Models**:
  - Helpers: volunteer information
  - Schedules: weekly volunteer assignments
- **Features**:
  - Automatic indexing
  - Data validation schemas
  - Backup and recovery

### Infrastructure Layer
- **Orchestration**: Docker Swarm
- **Load Balancer**: Traefik with automatic SSL
- **Secrets Management**: Docker Swarm Secrets
- **Networking**: Encrypted overlay network
- **Storage**: Persistent Docker volumes

### Azure Services
- **Azure Entra ID**: 
  - Application registration
  - OAuth 2.0/OpenID Connect provider
  - JWT token issuing and validation
- **Azure Cosmos DB**:
  - Globally distributed NoSQL database
  - Automatic scaling and backups
  - Multi-region replication

## Security Features

1. **Zero-Trust Architecture**
   - All components authenticate via Azure Entra ID
   - No hardcoded secrets in containers
   - Encrypted communication between services

2. **Secrets Management**
   - All sensitive data stored in Docker Swarm Secrets
   - Secrets mounted as files, not environment variables
   - Automatic secret rotation support

3. **Network Security**
   - Isolated overlay network
   - Container-to-container encryption
   - No direct database access from outside

4. **Authentication & Authorization**
   - PKCE flow for frontend (secure for SPAs)
   - JWT validation for all API calls
   - Role-based access control

## Deployment Flow

```mermaid
sequenceDiagram
    participant DEV as Developer
    participant TF as Terraform
    participant AZURE as Azure
    participant DOCKER as Docker Swarm
    participant APP as Application
    
    DEV->>TF: terraform apply
    TF->>AZURE: Create Entra ID App
    TF->>AZURE: Create Cosmos DB
    TF-->>DEV: Output secrets
    
    DEV->>DOCKER: docker swarm init
    DEV->>DOCKER: Create secrets from Terraform output
    
    DEV->>DOCKER: Build container images
    DEV->>DOCKER: docker stack deploy
    
    DOCKER->>APP: Deploy frontend replicas
    DOCKER->>APP: Deploy backend replicas
    DOCKER->>APP: Deploy database container
    
    APP->>AZURE: Connect to Entra ID
    APP->>AZURE: Connect to Cosmos DB
    
    DEV->>APP: Access application
```

## Scaling Strategy

- **Horizontal Scaling**: Add more service replicas
- **Load Distribution**: Traefik distributes load automatically
- **Database Scaling**: Cosmos DB auto-scales based on usage
- **Geographic Distribution**: Deploy to multiple Docker Swarm clusters

## Monitoring & Observability

- **Health Checks**: Built into all containers
- **Service Discovery**: Automatic via Docker Swarm
- **Logging**: Centralized container logs
- **Metrics**: Traefik provides load balancer metrics