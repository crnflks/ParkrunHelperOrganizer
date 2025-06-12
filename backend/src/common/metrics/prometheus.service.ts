// Prometheus metrics service for application monitoring
import { Injectable } from '@nestjs/common';
import { register, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';

@Injectable()
export class PrometheusService {
  private readonly httpRequestDuration: Histogram<string>;
  private readonly httpRequestTotal: Counter<string>;
  private readonly httpRequestSize: Histogram<string>;
  private readonly httpResponseSize: Histogram<string>;
  private readonly activeConnections: Gauge<string>;
  private readonly databaseOperationDuration: Histogram<string>;
  private readonly databaseOperationTotal: Counter<string>;
  private readonly errorTotal: Counter<string>;
  private readonly authenticationTotal: Counter<string>;
  private readonly businessOperationTotal: Counter<string>;

  constructor() {
    // Enable default metrics collection
    collectDefaultMetrics({ register });

    // HTTP Metrics
    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.5, 1, 2, 5, 10],
    });

    this.httpRequestTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
    });

    this.httpRequestSize = new Histogram({
      name: 'http_request_size_bytes',
      help: 'Size of HTTP requests in bytes',
      labelNames: ['method', 'route'],
      buckets: [100, 1000, 10000, 100000, 1000000],
    });

    this.httpResponseSize = new Histogram({
      name: 'http_response_size_bytes',
      help: 'Size of HTTP responses in bytes',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [100, 1000, 10000, 100000, 1000000],
    });

    this.activeConnections = new Gauge({
      name: 'http_active_connections',
      help: 'Number of active HTTP connections',
    });

    // Database Metrics
    this.databaseOperationDuration = new Histogram({
      name: 'database_operation_duration_seconds',
      help: 'Duration of database operations in seconds',
      labelNames: ['operation', 'collection', 'status'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    });

    this.databaseOperationTotal = new Counter({
      name: 'database_operations_total',
      help: 'Total number of database operations',
      labelNames: ['operation', 'collection', 'status'],
    });

    // Error Metrics
    this.errorTotal = new Counter({
      name: 'application_errors_total',
      help: 'Total number of application errors',
      labelNames: ['type', 'severity', 'component'],
    });

    // Authentication Metrics
    this.authenticationTotal = new Counter({
      name: 'authentication_attempts_total',
      help: 'Total number of authentication attempts',
      labelNames: ['type', 'status', 'provider'],
    });

    // Business Metrics
    this.businessOperationTotal = new Counter({
      name: 'business_operations_total',
      help: 'Total number of business operations',
      labelNames: ['operation', 'status', 'user_type'],
    });

    // Register all metrics
    register.registerMetric(this.httpRequestDuration);
    register.registerMetric(this.httpRequestTotal);
    register.registerMetric(this.httpRequestSize);
    register.registerMetric(this.httpResponseSize);
    register.registerMetric(this.activeConnections);
    register.registerMetric(this.databaseOperationDuration);
    register.registerMetric(this.databaseOperationTotal);
    register.registerMetric(this.errorTotal);
    register.registerMetric(this.authenticationTotal);
    register.registerMetric(this.businessOperationTotal);
  }

  // HTTP Metrics Methods
  recordHttpRequest(method: string, route: string, statusCode: number, duration: number, requestSize?: number, responseSize?: number) {
    const labels = { method, route, status_code: statusCode.toString() };
    
    this.httpRequestDuration.observe(labels, duration);
    this.httpRequestTotal.inc(labels);
    
    if (requestSize) {
      this.httpRequestSize.observe({ method, route }, requestSize);
    }
    
    if (responseSize) {
      this.httpResponseSize.observe(labels, responseSize);
    }
  }

  incrementActiveConnections() {
    this.activeConnections.inc();
  }

  decrementActiveConnections() {
    this.activeConnections.dec();
  }

  // Database Metrics Methods
  recordDatabaseOperation(operation: string, collection: string, status: string, duration: number) {
    const labels = { operation, collection, status };
    
    this.databaseOperationDuration.observe(labels, duration);
    this.databaseOperationTotal.inc(labels);
  }

  // Error Metrics Methods
  recordError(type: string, severity: string, component: string) {
    this.errorTotal.inc({ type, severity, component });
  }

  // Authentication Metrics Methods
  recordAuthentication(type: string, status: string, provider: string) {
    this.authenticationTotal.inc({ type, status, provider });
  }

  // Business Metrics Methods
  recordBusinessOperation(operation: string, status: string, userType: string) {
    this.businessOperationTotal.inc({ operation, status, user_type: userType });
  }

  // Get metrics for Prometheus scraping
  getMetrics(): Promise<string> {
    return register.metrics();
  }

  // Reset all metrics (useful for testing)
  resetMetrics() {
    register.resetMetrics();
  }

  // Custom metrics for Parkrun-specific operations
  recordHelperOperation(operation: 'create' | 'update' | 'delete' | 'view', success: boolean, userId?: string) {
    this.recordBusinessOperation(
      `helper_${operation}`,
      success ? 'success' : 'failure',
      userId ? 'authenticated' : 'anonymous'
    );
  }

  recordScheduleOperation(operation: 'create' | 'update' | 'delete' | 'view', success: boolean, userId?: string) {
    this.recordBusinessOperation(
      `schedule_${operation}`,
      success ? 'success' : 'failure',
      userId ? 'authenticated' : 'anonymous'
    );
  }

  recordUserActivity(activity: string, userId: string) {
    this.recordBusinessOperation(
      `user_${activity}`,
      'success',
      'authenticated'
    );
  }
}