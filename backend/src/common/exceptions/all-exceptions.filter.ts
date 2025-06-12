import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorResponse } from './http-exception.filter';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string;
    let errorName: string;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;
      errorName = exception.name;
    } else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = exception.message || 'Internal server error';
      errorName = exception.name;
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Unknown error occurred';
      errorName = 'UnknownError';
    }

    const correlationId = request.headers['x-correlation-id'] as string;

    const errorBody: ErrorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      correlationId,
    };

    // Add detailed error information in development
    if (process.env.NODE_ENV === 'development' && exception instanceof Error) {
      errorBody.error = errorName;
      errorBody.stack = exception.stack;
    }

    // Always log server errors
    if (status >= 500) {
      this.logger.error(
        `Unhandled Exception: ${errorName}`,
        {
          correlationId,
          method: request.method,
          url: request.url,
          error: message,
          stack: exception instanceof Error ? exception.stack : undefined,
          userId: (request as any).user?.sub,
        }
      );
    }

    response.status(status).json(errorBody);
  }
}