import { Injectable, LoggerService } from '@nestjs/common';
import { Logger } from 'winston';
import { Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

export interface LogContext {
  correlationId?: string;
  userId?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  responseTime?: number;
  [key: string]: any;
}

@Injectable()
export class AppLoggerService implements LoggerService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {}

  log(message: string, context?: LogContext) {
    this.logger.info(message, context);
  }

  info(message: string, context?: LogContext) {
    this.logger.info(message, context);
  }

  error(message: string, trace?: string, context?: LogContext) {
    this.logger.error(message, { ...context, trace });
  }

  warn(message: string, context?: LogContext) {
    this.logger.warn(message, context);
  }

  debug(message: string, context?: LogContext) {
    this.logger.debug(message, context);
  }

  verbose(message: string, context?: LogContext) {
    this.logger.verbose(message, context);
  }

  // Business operation logging
  logBusinessOperation(
    operation: string,
    details: any,
    context?: LogContext
  ) {
    this.logger.info(`Business Operation: ${operation}`, {
      ...context,
      operation,
      details,
    });
  }

  // Security event logging
  logSecurityEvent(
    event: string,
    details: any,
    context?: LogContext
  ) {
    this.logger.warn(`Security Event: ${event}`, {
      ...context,
      securityEvent: event,
      details,
    });
  }

  // Performance logging
  logPerformance(
    operation: string,
    duration: number,
    context?: LogContext
  ) {
    this.logger.info(`Performance: ${operation}`, {
      ...context,
      operation,
      duration,
      performanceMetric: true,
    });
  }

  // HTTP request logging
  logHttpRequest(
    method: string,
    url: string,
    statusCode: number,
    responseTime: number,
    context?: LogContext
  ) {
    const level = statusCode >= 400 ? 'warn' : 'info';
    this.logger[level](`HTTP ${method} ${url} ${statusCode}`, {
      ...context,
      method,
      url,
      statusCode,
      responseTime,
      httpRequest: true,
    });
  }

  // Database operation logging
  logDatabaseOperation(
    operation: string,
    collection: string,
    duration: number,
    context?: LogContext
  ) {
    this.logger.info(`Database ${operation} on ${collection}`, {
      ...context,
      databaseOperation: operation,
      collection,
      duration,
    });
  }
}