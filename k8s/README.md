# Kubernetes Manifests for Parkrun Helper Organizer

This directory contains Kubernetes manifests for deploying the Parkrun Helper Organizer application to a Kubernetes cluster.

## Architecture

The application consists of:
- **Frontend**: React SPA served by nginx
- **Backend**: NestJS API with Azure AD authentication
- **Storage**: Persistent volumes for backups
- **Monitoring**: Prometheus metrics and health checks
- **Security**: Network policies, RBAC, and security contexts

## Prerequisites

- Kubernetes cluster (1.20+)
- kubectl configured to access your cluster
- Nginx Ingress Controller
- cert-manager (for TLS certificates)
- Prometheus Operator (optional, for monitoring)

## Quick Start

1. **Update secrets and configuration**:
   ```bash
   # Edit the secret.yaml file with your actual Azure AD and Cosmos DB credentials
   kubectl apply -f secret.yaml
   ```

2. **Deploy using Kustomize**:
   ```bash
   kubectl apply -k .
   ```

3. **Verify deployment**:
   ```bash
   kubectl get pods -n parkrun-helper
   kubectl get services -n parkrun-helper
   kubectl get ingress -n parkrun-helper
   ```

## Configuration

### Required Secrets

Before deploying, update `secret.yaml` with your actual values:

```bash
# Azure AD Configuration
AZURE_AD_CLIENT_ID: "your-client-id"
AZURE_AD_CLIENT_SECRET: "your-client-secret" 
AZURE_AD_TENANT_ID: "your-tenant-id"

# Cosmos DB Configuration
COSMOS_DB_ENDPOINT: "https://your-account.documents.azure.com"
COSMOS_DB_KEY: "your-primary-key"
COSMOS_DB_DATABASE_NAME: "your-database-name"

# JWT Secret
JWT_SECRET: "your-jwt-secret"
```

Encode values with base64:
```bash
echo -n "your-secret-value" | base64
```

### Environment-Specific Customization

For different environments (dev/staging/prod), create overlay directories:

```
k8s/
├── base/
│   ├── (all base manifests)
│   └── kustomization.yaml
├── overlays/
│   ├── development/
│   │   ├── kustomization.yaml
│   │   └── patches/
│   ├── staging/
│   │   ├── kustomization.yaml
│   │   └── patches/
│   └── production/
│       ├── kustomization.yaml
│       └── patches/
```

Example overlay kustomization:
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
- ../../base

patchesStrategicMerge:
- patches/increase-replicas.yaml
- patches/production-resources.yaml

images:
- name: parkrun-helper/backend
  newTag: v1.2.0
- name: parkrun-helper/frontend
  newTag: v1.2.0
```

## Components

### Core Application

- **Namespace**: `parkrun-helper`
- **Backend Deployment**: 3 replicas with health checks
- **Frontend Deployment**: 2 replicas with nginx
- **Services**: ClusterIP services for internal communication
- **Ingress**: HTTPS termination and routing

### Storage

- **backup-pvc**: 10Gi volume for automated backups
- **monitoring-pvc**: 5Gi volume for monitoring data (optional)

### Security

- **RBAC**: Minimal permissions for service accounts
- **Network Policies**: Restricted pod-to-pod communication
- **Security Contexts**: Non-root containers, read-only filesystems
- **Pod Security Standards**: Restricted profile

### Scaling

- **HPA**: Auto-scaling based on CPU/memory usage
- **Backend**: 2-10 replicas
- **Frontend**: 2-5 replicas

### Monitoring

- **Health Checks**: Liveness, readiness, and startup probes
- **Metrics**: Prometheus endpoints on port 9090
- **Logging**: Structured JSON logs

## Health Checks

The backend provides comprehensive health check endpoints:

- `/health` - Basic health check
- `/health/live` - Liveness probe
- `/health/ready` - Readiness probe  
- `/health/startup` - Startup probe
- `/health/deep` - Comprehensive health check
- `/health/metrics` - Health metrics

## Monitoring Integration

The manifests include Prometheus annotations for automatic service discovery:

```yaml
annotations:
  prometheus.io/scrape: "true"
  prometheus.io/port: "9090"
  prometheus.io/path: "/metrics"
```

## SSL/TLS

The ingress is configured for HTTPS with cert-manager:

```yaml
annotations:
  cert-manager.io/cluster-issuer: "letsencrypt-prod"
tls:
- hosts:
  - parkrun-helper.example.com
  secretName: parkrun-helper-tls
```

Update the hostname in `ingress.yaml` to match your domain.

## Backup Strategy

Automated backups are configured through the backend service:

- **Daily full backups** at 2:00 AM UTC
- **Hourly incremental backups** during business hours
- **Weekly cleanup** of old backups
- **Monthly verification** backups

Backup files are stored in the persistent volume mounted at `/app/backups`.

## Troubleshooting

### Check pod status
```bash
kubectl get pods -n parkrun-helper
kubectl describe pod <pod-name> -n parkrun-helper
```

### View logs
```bash
kubectl logs -f deployment/parkrun-helper-backend -n parkrun-helper
kubectl logs -f deployment/parkrun-helper-frontend -n parkrun-helper
```

### Check health endpoints
```bash
kubectl port-forward service/parkrun-helper-backend-service 3000:3000 -n parkrun-helper
curl http://localhost:3000/health
```

### Check ingress
```bash
kubectl get ingress -n parkrun-helper
kubectl describe ingress parkrun-helper-ingress -n parkrun-helper
```

### Check secrets and configmaps
```bash
kubectl get secrets -n parkrun-helper
kubectl get configmaps -n parkrun-helper
```

## Security Considerations

1. **Update secrets**: Replace example values with real credentials
2. **Network policies**: Adjust based on your cluster's network requirements
3. **Resource limits**: Tune based on your workload requirements
4. **Image scanning**: Scan container images for vulnerabilities
5. **RBAC**: Review and minimize permissions as needed
6. **Pod security**: Enable Pod Security Standards enforcement

## Production Checklist

- [ ] Update all secrets with real values
- [ ] Configure proper SSL certificates
- [ ] Set up monitoring and alerting
- [ ] Configure backup storage (Azure Blob, AWS S3, etc.)
- [ ] Review and test disaster recovery procedures
- [ ] Set up log aggregation
- [ ] Configure network policies for your environment
- [ ] Review resource limits and requests
- [ ] Set up proper CI/CD pipelines
- [ ] Configure external DNS if needed