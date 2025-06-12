// Health service for detailed health information and metrics
import { Injectable } from '@nestjs/common';
import { DatabaseHealthIndicator } from './indicators/database.health';
import { ExternalApiHealthIndicator } from './indicators/external-api.health';
import { BusinessLogicHealthIndicator } from './indicators/business-logic.health';

@Injectable()
export class HealthService {
  constructor(
    private readonly databaseHealth: DatabaseHealthIndicator,
    private readonly externalApiHealth: ExternalApiHealthIndicator,
    private readonly businessLogicHealth: BusinessLogicHealthIndicator,
  ) {}

  async getDetailedHealth() {
    const startTime = Date.now();
    
    try {
      // Run detailed health checks
      const healthChecks = await Promise.allSettled([
        this.databaseHealth.isHealthy('database_connectivity'),
        this.databaseHealth.checkDatabasePerformance('database_performance'),
        this.externalApiHealth.checkAzureAD('azure_ad_connectivity'),
        this.externalApiHealth.checkParkrunApi('parkrun_api_connectivity'),
        this.businessLogicHealth.checkDataIntegrity('data_integrity'),
        this.businessLogicHealth.checkStartupRequirements('startup_requirements'),
      ]);

      const totalTime = Date.now() - startTime;
      
      // Process results
      const results = healthChecks.map((check, index) => {
        const checkNames = [
          'database_connectivity',
          'database_performance', 
          'azure_ad_connectivity',
          'parkrun_api_connectivity',
          'data_integrity',
          'startup_requirements'
        ];
        
        return {
          name: checkNames[index],
          status: check.status,
          result: check.status === 'fulfilled' ? 'healthy' : 'unhealthy',
          details: check.status === 'fulfilled' ? check.value : { error: check.reason?.message },
          duration: check.status === 'fulfilled' ? check.value.responseTime || 'N/A' : 'N/A',
        };
      });

      const healthyCount = results.filter(r => r.result === 'healthy').length;
      const overallHealth = healthyCount === results.length ? 'healthy' : 
                           healthyCount > results.length / 2 ? 'degraded' : 'unhealthy';

      return {
        status: overallHealth,
        timestamp: new Date().toISOString(),
        totalDuration: `${totalTime}ms`,
        checks: results,
        summary: {
          total: results.length,
          healthy: healthyCount,
          unhealthy: results.length - healthyCount,
          healthPercentage: Math.round((healthyCount / results.length) * 100),
        },
        system: {
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
          version: process.version,
          environment: process.env.NODE_ENV || 'development',
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        totalDuration: `${Date.now() - startTime}ms`,
        error: error.message,
        system: {
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
          version: process.version,
          environment: process.env.NODE_ENV || 'development',
        },
      };
    }
  }

  async getHealthMetrics() {
    const startTime = Date.now();
    
    try {
      // Get basic system metrics
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      const uptime = process.uptime();
      
      // Get database metrics
      let databaseMetrics = null;
      try {
        const dbCheck = await this.databaseHealth.isHealthy('metrics_check');
        databaseMetrics = {
          status: 'connected',
          responseTime: dbCheck.database_connectivity?.responseTime || 'N/A',
        };
      } catch (error) {
        databaseMetrics = {
          status: 'disconnected',
          error: error.message,
        };
      }

      const totalTime = Date.now() - startTime;

      return {
        timestamp: new Date().toISOString(),
        collectionDuration: `${totalTime}ms`,
        system: {
          uptime: uptime,
          memory: {
            rss: memoryUsage.rss,
            heapTotal: memoryUsage.heapTotal,
            heapUsed: memoryUsage.heapUsed,
            external: memoryUsage.external,
            arrayBuffers: memoryUsage.arrayBuffers,
          },
          cpu: {
            user: cpuUsage.user,
            system: cpuUsage.system,
          },
          version: process.version,
          platform: process.platform,
          arch: process.arch,
        },
        database: databaseMetrics,
        application: {
          environment: process.env.NODE_ENV || 'development',
          version: process.env.npm_package_version || '1.0.0',
          name: 'Parkrun Helper Organizer API',
        },
        health: {
          status: databaseMetrics?.status === 'connected' ? 'healthy' : 'degraded',
          lastCheck: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        timestamp: new Date().toISOString(),
        collectionDuration: `${Date.now() - startTime}ms`,
        error: error.message,
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
        },
        health: {
          status: 'unhealthy',
          lastCheck: new Date().toISOString(),
        },
      };
    }
  }

  async getHealthSummary() {
    try {
      const detailed = await this.getDetailedHealth();
      
      return {
        status: detailed.status,
        timestamp: detailed.timestamp,
        summary: detailed.summary,
        uptime: detailed.system.uptime,
        environment: detailed.system.environment,
        version: process.env.npm_package_version || '1.0.0',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
      };
    }
  }
}