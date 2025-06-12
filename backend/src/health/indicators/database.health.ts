// Database health indicator for Cosmos DB connectivity and performance
import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { Container } from '@azure/cosmos';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DatabaseHealthIndicator extends HealthIndicator {
  private container: Container;

  constructor(private configService: ConfigService) {
    super();
    // Initialize Cosmos DB container
    const { CosmosClient } = require('@azure/cosmos');
    const client = new CosmosClient({
      endpoint: this.configService.get('COSMOS_DB_ENDPOINT'),
      key: this.configService.get('COSMOS_DB_KEY'),
    });
    const database = client.database(this.configService.get('COSMOS_DB_DATABASE_NAME'));
    this.container = database.container('helpers'); // Using helpers container for health checks
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const startTime = Date.now();
      
      // Perform a simple query to test connectivity
      const querySpec = {
        query: 'SELECT TOP 1 c.id FROM c',
      };
      
      const { resources } = await this.container.items.query(querySpec).fetchAll();
      const responseTime = Date.now() - startTime;
      
      // Check if response time is acceptable (< 1000ms)
      if (responseTime > 1000) {
        throw new Error(`Database response time too high: ${responseTime}ms`);
      }

      const result = this.getStatus(key, true, {
        responseTime: `${responseTime}ms`,
        status: 'connected',
        recordCount: resources.length,
        timestamp: new Date().toISOString(),
      });

      return result;
    } catch (error) {
      const result = this.getStatus(key, false, {
        error: error.message,
        status: 'disconnected',
        timestamp: new Date().toISOString(),
      });

      throw new HealthCheckError('Database health check failed', result);
    }
  }

  async checkDatabasePerformance(key: string): Promise<HealthIndicatorResult> {
    try {
      const startTime = Date.now();
      
      // Perform multiple operations to test performance
      const operations = await Promise.all([
        this.container.items.query('SELECT TOP 5 c.id FROM c').fetchAll(),
        this.container.items.query('SELECT COUNT(1) as count FROM c').fetchAll(),
      ]);
      
      const responseTime = Date.now() - startTime;
      const recordCount = operations[1].resources[0]?.count || 0;
      
      // Performance thresholds
      const isHealthy = responseTime < 2000 && recordCount >= 0;
      
      const result = this.getStatus(key, isHealthy, {
        responseTime: `${responseTime}ms`,
        recordCount,
        performanceGrade: responseTime < 500 ? 'excellent' : responseTime < 1000 ? 'good' : 'acceptable',
        timestamp: new Date().toISOString(),
      });

      if (!isHealthy) {
        throw new HealthCheckError('Database performance check failed', result);
      }

      return result;
    } catch (error) {
      const result = this.getStatus(key, false, {
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      throw new HealthCheckError('Database performance check failed', result);
    }
  }
}