import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AppLoggerService } from './app-logger.service';

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: AppLoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const { method, originalUrl, ip, headers } = req;
    const userAgent = headers['user-agent'] || '';
    const correlationId = headers['x-correlation-id'] as string;

    // Log request start
    this.logger.info(`Incoming ${method} ${originalUrl}`, {
      correlationId,
      method,
      url: originalUrl,
      ip,
      userAgent,
    });

    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function(chunk?: any, encoding?: any): any {
      const responseTime = Date.now() - startTime;
      const { statusCode } = res;

      // Log the request completion
      try {
        if (req.app?.locals?.logger?.logHttpRequest) {
          req.app.locals.logger.logHttpRequest(
            method,
            originalUrl,
            statusCode,
            responseTime,
            {
              correlationId,
              ip,
              userAgent,
              userId: (req as any).user?.sub,
            }
          );
        }
      } catch (error) {
        // Silently ignore logging errors to prevent breaking the response
      }

      return originalEnd.call(this, chunk, encoding);
    };

    next();
  }
}