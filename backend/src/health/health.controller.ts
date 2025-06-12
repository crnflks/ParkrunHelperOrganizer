// Health check controller with multiple endpoints for different monitoring needs
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheckService,
  HealthCheck,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { DatabaseHealthIndicator } from './indicators/database.health';
import { ExternalApiHealthIndicator } from './indicators/external-api.health';
import { BusinessLogicHealthIndicator } from './indicators/business-logic.health';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly memory: MemoryHealthIndicator,
    private readonly disk: DiskHealthIndicator,
    private readonly database: DatabaseHealthIndicator,
    private readonly externalApi: ExternalApiHealthIndicator,
    private readonly businessLogic: BusinessLogicHealthIndicator,
    private readonly healthService: HealthService,
  ) {}

  @Get()
  @ApiOperation({ 
    summary: 'Basic health check',
    description: 'Returns basic application health status'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Service is healthy' 
  })
  @ApiResponse({ 
    status: 503, 
    description: 'Service is unhealthy' 
  })
  @HealthCheck()
  async check() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024),
    ]);
  }

  @Get('live')
  @ApiOperation({ 
    summary: 'Liveness probe',
    description: 'Kubernetes liveness probe endpoint'
  })
  @HealthCheck()
  async liveness() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 200 * 1024 * 1024),
    ]);
  }

  @Get('ready')
  @ApiOperation({ 
    summary: 'Readiness probe',
    description: 'Kubernetes readiness probe endpoint'
  })
  @HealthCheck()
  async readiness() {
    return this.health.check([
      () => this.database.isHealthy('database'),
      () => this.memory.checkHeap('memory_heap', 200 * 1024 * 1024),
    ]);
  }

  @Get('deep')
  @ApiOperation({ 
    summary: 'Deep health check',
    description: 'Comprehensive health check including all dependencies'
  })
  @HealthCheck()
  async deepCheck() {
    return this.health.check([
      // Core system checks
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024),
      () => this.disk.checkStorage('storage', { path: '/', thresholdPercent: 0.9 }),
      
      // Database connectivity
      () => this.database.isHealthy('cosmos_db'),
      
      // External dependencies
      () => this.externalApi.checkAzureAD('azure_ad'),
      
      // Business logic validations
      () => this.businessLogic.checkDataIntegrity('data_integrity'),
    ]);
  }

  @Get('startup')
  @ApiOperation({ 
    summary: 'Startup probe',
    description: 'Kubernetes startup probe endpoint'
  })
  @HealthCheck()
  async startup() {
    return this.health.check([
      () => this.database.isHealthy('database'),
      () => this.businessLogic.checkStartupRequirements('startup'),
    ]);
  }

  @Get('detailed')
  @ApiOperation({ 
    summary: 'Detailed health information',
    description: 'Returns detailed health information including metrics and diagnostics'
  })
  async detailed() {
    return this.healthService.getDetailedHealth();
  }

  @Get('metrics')
  @ApiOperation({ 
    summary: 'Health metrics',
    description: 'Returns health-related metrics for monitoring'
  })
  async metrics() {
    return this.healthService.getHealthMetrics();
  }
}