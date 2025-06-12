import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

export interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string;
  error?: string;
  stack?: string;
  correlationId?: string;
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const correlationId = request.headers['x-correlation-id'] as string;
    const errorResponse = exception.getResponse();
    
    const errorBody: ErrorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: typeof errorResponse === 'string' ? errorResponse : (errorResponse as any).message,
      correlationId,
    };

    // Add detailed error information in development
    if (process.env.NODE_ENV === 'development') {
      errorBody.error = exception.name;
      errorBody.stack = exception.stack;
    }

    // Log the error with appropriate level
    if (status >= 500) {
      this.logger.error(
        `HTTP ${status} ${request.method} ${request.url}`,
        {
          correlationId,
          error: exception.message,
          stack: exception.stack,
          userId: (request as any).user?.sub,
        }
      );
    } else if (status >= 400) {
      this.logger.warn(
        `HTTP ${status} ${request.method} ${request.url}`,
        {
          correlationId,
          error: exception.message,
          userId: (request as any).user?.sub,
        }
      );
    }

    response.status(status).json(errorBody);
  }
}