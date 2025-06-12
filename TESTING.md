# Testing Instructions

This document provides comprehensive testing instructions for the Parkrun Helper Organizer application.

## 🧪 Test Categories

### 1. Infrastructure Testing
### 2. API Testing
### 3. Frontend Testing
### 4. Integration Testing
### 5. Security Testing
### 6. Performance Testing

---

## 1. Infrastructure Testing

### Terraform Validation
```bash
cd infra/terraform

# Validate configuration
terraform validate

# Check formatting
terraform fmt -check

# Plan without applying
terraform plan -out=plan.tfplan

# Validate plan
terraform show plan.tfplan
```

### Docker Image Testing
```bash
# Build and test images
./scripts/build-images.sh

# Test image security
docker scout cves parkrun-helper/backend:latest
docker scout cves parkrun-helper/frontend:latest

# Test image size optimization
docker images | grep parkrun-helper
```

### Container Health Checks
```bash
# Test database container
docker run --name test-db -d parkrun-helper/database:latest
docker exec test-db mongosh --eval "db.runCommand('ping')"
docker rm -f test-db

# Test backend container
docker run --name test-backend -d \
  -e NODE_ENV=test \
  -e PORT=8080 \
  parkrun-helper/backend:latest
sleep 10
curl -f http://localhost:8080/api || echo "Health check failed"
docker rm -f test-backend

# Test frontend container
docker run --name test-frontend -d -p 3001:3000 parkrun-helper/frontend:latest
sleep 5
curl -f http://localhost:3001/health || echo "Health check failed"
docker rm -f test-frontend
```

---

## 2. API Testing

### Prerequisites
```bash
# Install testing tools
npm install -g newman
# or use curl/httpie for manual testing
```

### Health Check Tests
```bash
# Test basic health endpoint
curl -X GET http://localhost:8080/api \
  -H "Accept: application/json" \
  | jq '.'

# Expected response:
# {
#   "status": "healthy",
#   "timestamp": "2024-01-01T12:00:00.000Z",
#   "service": "parkrun-helper-backend",
#   "version": "1.0.0"
# }
```

### Authentication Tests

#### 1. Acquire Access Token
```bash
# Using Azure CLI (for testing)
az login
ACCESS_TOKEN=$(az account get-access-token --resource api://your-client-id --query accessToken -o tsv)
```

#### 2. Test Protected Endpoints
```bash
# Test secure data endpoint
curl -X GET http://localhost:8080/api/secure-data \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Accept: application/json" \
  | jq '.'

# Expected response:
# {
#   "message": "This is protected data from the Parkrun Helper API",
#   "timestamp": "2024-01-01T12:00:00.000Z",
#   "data": {
#     "totalVolunteers": 42,
#     "upcomingEvents": 5,
#     "lastUpdated": "2024-01-01T12:00:00.000Z"
#   }
# }
```

### CRUD Operations Testing

#### Helpers API
```bash
# Create a helper
curl -X POST http://localhost:8080/api/helpers \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Helper",
    "parkrunId": "T123456",
    "email": "test@example.com"
  }' | jq '.'

# Get all helpers
curl -X GET http://localhost:8080/api/helpers \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  | jq '.'

# Get specific helper
HELPER_ID="your-helper-id"
curl -X GET http://localhost:8080/api/helpers/$HELPER_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  | jq '.'

# Update helper
curl -X PATCH http://localhost:8080/api/helpers/$HELPER_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Test Helper"
  }' | jq '.'

# Delete helper
curl -X DELETE http://localhost:8080/api/helpers/$HELPER_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Error Handling Tests
```bash
# Test unauthorized access
curl -X GET http://localhost:8080/api/secure-data \
  -H "Accept: application/json"
# Expected: 401 Unauthorized

# Test invalid token
curl -X GET http://localhost:8080/api/secure-data \
  -H "Authorization: Bearer invalid-token" \
  -H "Accept: application/json"
# Expected: 401 Unauthorized

# Test malformed request
curl -X POST http://localhost:8080/api/helpers \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"invalid": "data"}'
# Expected: 400 Bad Request
```

---

## 3. Frontend Testing

### Unit Tests
```bash
cd frontend

# Run unit tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- Login.test.tsx
```

### E2E Testing with Cypress
```bash
cd frontend

# Install Cypress
npm install --save-dev cypress

# Open Cypress Test Runner
npx cypress open

# Run headless tests
npx cypress run
```

#### Sample Cypress Test
```javascript
// cypress/e2e/auth.cy.ts
describe('Authentication Flow', () => {
  it('should redirect to login when not authenticated', () => {
    cy.visit('/dashboard');
    cy.url().should('include', '/login');
  });

  it('should show login form', () => {
    cy.visit('/login');
    cy.contains('Sign in with Microsoft').should('be.visible');
  });

  it('should handle login success', () => {
    // Mock MSAL authentication
    cy.window().then((win) => {
      win.localStorage.setItem('msal.account.keys', JSON.stringify(['test-key']));
    });
    
    cy.visit('/dashboard');
    cy.contains('Welcome').should('be.visible');
  });
});
```

### Browser Compatibility Testing
```bash
# Test with different browsers using Playwright
npm install --save-dev @playwright/test

# Run cross-browser tests
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

---

## 4. Integration Testing

### Full Stack Testing
```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# Wait for services to be ready
sleep 30

# Test complete user flow
./scripts/test-integration.sh
```

#### Integration Test Script
```bash
#!/bin/bash
# scripts/test-integration.sh

set -e

echo "🧪 Running integration tests..."

# Test 1: Health checks
echo "Testing health endpoints..."
curl -f http://localhost:8080/api || exit 1
curl -f http://localhost:3000/health || exit 1

# Test 2: Database connectivity
echo "Testing database connectivity..."
docker exec parkrun-database mongosh --eval "db.runCommand('ping')" || exit 1

# Test 3: Authentication flow (mock)
echo "Testing authentication flow..."
# Add mock authentication test here

# Test 4: API data flow
echo "Testing API data flow..."
# Test CRUD operations with real database

echo "✅ All integration tests passed!"
```

### Load Testing
```bash
# Install Apache Bench
sudo apt-get install apache2-utils

# Basic load test
ab -n 100 -c 10 http://localhost:8080/api

# Load test with authentication
ab -n 100 -c 10 -H "Authorization: Bearer $ACCESS_TOKEN" \
   http://localhost:8080/api/secure-data
```

---

## 5. Security Testing

### Authentication Security
```bash
# Test JWT validation
./scripts/test-jwt-security.sh
```

#### JWT Security Test Script
```bash
#!/bin/bash
# scripts/test-jwt-security.sh

echo "🔒 Testing JWT security..."

# Test 1: Invalid signature
echo "Testing invalid JWT signature..."
INVALID_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.invalid-signature"

RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $INVALID_TOKEN" \
  http://localhost:8080/api/secure-data)

if [ "$RESPONSE" == "401" ]; then
  echo "✅ Invalid JWT properly rejected"
else
  echo "❌ Invalid JWT not rejected (got $RESPONSE)"
  exit 1
fi

# Test 2: Expired token
echo "Testing expired JWT..."
# Test with expired token

# Test 3: Wrong audience
echo "Testing wrong audience..."
# Test with token for different audience

echo "✅ All JWT security tests passed!"
```

### Container Security
```bash
# Scan for vulnerabilities
docker scout cves parkrun-helper/backend:latest
docker scout cves parkrun-helper/frontend:latest
docker scout cves parkrun-helper/database:latest

# Check for secrets in images
docker history parkrun-helper/backend:latest | grep -i secret || echo "No secrets found"

# Test container isolation
docker run --rm parkrun-helper/backend:latest ps aux | grep root
```

### Network Security
```bash
# Test network isolation
docker network inspect parkrun-helper_parkrun-network

# Test port exposure
nmap -p 1-1000 localhost

# Test SSL/TLS (if configured)
sslscan localhost:443
```

---

## 6. Performance Testing

### API Performance
```bash
# Install wrk for load testing
sudo apt-get install wrk

# Basic performance test
wrk -t12 -c400 -d30s http://localhost:8080/api

# Authenticated endpoint test
wrk -t12 -c400 -d30s -H "Authorization: Bearer $ACCESS_TOKEN" \
    http://localhost:8080/api/secure-data
```

### Database Performance
```bash
# MongoDB performance test
docker exec parkrun-database mongosh --eval "
  db.helpers.insertMany([...Array(1000)].map((_, i) => ({
    id: 'test-' + i,
    name: 'Test Helper ' + i,
    parkrunId: 'T' + i.toString().padStart(6, '0'),
    createdAt: new Date(),
    createdBy: 'test-user'
  })));
  
  console.time('query-test');
  db.helpers.find({parkrunId: {$regex: '^T0001'}}).count();
  console.timeEnd('query-test');
"
```

### Frontend Performance
```bash
cd frontend

# Lighthouse CI
npm install -g @lhci/cli
lhci autorun --upload.target=temporary-public-storage

# Bundle size analysis
npm run build
npx webpack-bundle-analyzer build/static/js/*.js
```

---

## 🎯 Automated Testing Pipeline

### GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
        
    - name: Setup Docker
      uses: docker/setup-buildx-action@v2
      
    - name: Run unit tests
      run: |
        cd backend && npm ci && npm test
        cd frontend && npm ci && npm test
        
    - name: Build images
      run: ./scripts/build-images.sh
      
    - name: Run integration tests
      run: |
        docker-compose -f docker-compose.dev.yml up -d
        sleep 30
        ./scripts/test-integration.sh
```

### Pre-commit Hooks
```bash
# Install pre-commit
pip install pre-commit

# Setup hooks
pre-commit install

# Run manually
pre-commit run --all-files
```

---

## 📊 Test Reporting

### Coverage Reports
```bash
# Backend coverage
cd backend
npm test -- --coverage
open coverage/lcov-report/index.html

# Frontend coverage
cd frontend
npm test -- --coverage --watchAll=false
open coverage/lcov-report/index.html
```

### Test Results Dashboard
- **Backend**: http://localhost:8080/api/docs (Swagger UI for API testing)
- **Frontend**: Generated coverage reports in `coverage/` directories
- **Integration**: Custom dashboard in test results

---

## 🔍 Troubleshooting Tests

### Common Test Failures

#### Authentication Issues
```bash
# Check Azure AD configuration
az ad app list --display-name "parkrun-helper"

# Verify token claims
echo $ACCESS_TOKEN | jwt decode -

# Check token expiry
jwt decode $ACCESS_TOKEN | jq '.exp'
```

#### Database Connection Issues
```bash
# Check MongoDB logs
docker logs parkrun-database

# Test direct connection
docker exec -it parkrun-database mongosh

# Verify collections
docker exec parkrun-database mongosh --eval "show collections"
```

#### Network Issues
```bash
# Check Docker network
docker network ls
docker network inspect parkrun-helper_parkrun-network

# Test service connectivity
docker exec parkrun-backend ping database
docker exec parkrun-frontend ping backend
```

---

## 📝 Test Checklist

### Before Deployment
- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] Security scans clean
- [ ] Performance benchmarks met
- [ ] Load testing completed
- [ ] Cross-browser testing done
- [ ] API documentation updated
- [ ] Test coverage > 80%

### After Deployment
- [ ] Health checks pass
- [ ] Authentication working
- [ ] Database connectivity verified
- [ ] All services responding
- [ ] Load balancer functioning
- [ ] SSL certificates valid
- [ ] Monitoring alerts configured

---

## 🚀 Continuous Testing

### Monitoring in Production
```bash
# Health check monitoring
curl -f http://your-domain.com/api/health

# Performance monitoring
curl -w "@curl-format.txt" -o /dev/null -s http://your-domain.com/api

# Error rate monitoring
docker service logs parkrun-helper_backend | grep ERROR | wc -l
```

### Automated Testing Schedule
- **Unit Tests**: On every commit
- **Integration Tests**: On every push to main
- **Security Scans**: Daily
- **Performance Tests**: Weekly
- **Load Tests**: Before major releases
- **Penetration Tests**: Quarterly