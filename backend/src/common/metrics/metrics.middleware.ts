// Middleware for collecting HTTP metrics
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrometheusService } from './prometheus.service';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private readonly prometheusService: PrometheusService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = process.hrtime.bigint();
    const requestSize = parseInt(req.headers['content-length'] || '0');
    
    // Track active connections
    this.prometheusService.incrementActiveConnections();

    // Override res.end to capture metrics
    const originalEnd = res.end;
    res.end = function(chunk?: any, encoding?: any): any {
      // Calculate response time
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1e9; // Convert to seconds

      // Get response size
      const responseSize = parseInt(res.getHeader('content-length') as string || '0');

      // Extract route pattern (remove query params and specific IDs)
      const route = extractRoutePattern(req.originalUrl || req.url);

      // Record metrics
      this.prometheusService.recordHttpRequest(
        req.method,
        route,
        res.statusCode,
        duration,
        requestSize,
        responseSize
      );

      // Decrement active connections
      this.prometheusService.decrementActiveConnections();

      // Record errors if status code indicates an error
      if (res.statusCode >= 400) {
        const errorType = res.statusCode >= 500 ? 'server_error' : 'client_error';
        const severity = res.statusCode >= 500 ? 'error' : 'warning';
        this.prometheusService.recordError(errorType, severity, 'http');
      }

      return originalEnd.call(this, chunk, encoding);
    }.bind(res);

    next();
  }
}

// Helper function to extract route patterns
function extractRoutePattern(url: string): string {
  // Remove query parameters
  const pathOnly = url.split('?')[0];
  
  // Replace UUIDs and numeric IDs with placeholders
  const routePattern = pathOnly
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
    .replace(/\/\d+/g, '/:id')
    .replace(/\/[A-Za-z0-9]{24}/g, '/:id'); // MongoDB ObjectId pattern

  return routePattern || '/';
}