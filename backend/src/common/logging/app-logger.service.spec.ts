import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { AppLoggerService, LogContext } from './app-logger.service';

describe('AppLoggerService', () => {
  let service: AppLoggerService;
  let mockWinstonLogger: jest.Mocked<Logger>;

  beforeEach(async () => {
    mockWinstonLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppLoggerService,
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: mockWinstonLogger,
        },
      ],
    }).compile();

    service = module.get<AppLoggerService>(AppLoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('log', () => {
    it('should call winston info method', () => {
      const message = 'Test message';
      const context: LogContext = { correlationId: 'test-id' };

      service.log(message, context);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(message, context);
    });
  });

  describe('info', () => {
    it('should call winston info method', () => {
      const message = 'Info message';
      const context: LogContext = { userId: 'user-123' };

      service.info(message, context);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(message, context);
    });
  });

  describe('error', () => {
    it('should call winston error method with trace', () => {
      const message = 'Error message';
      const trace = 'Stack trace';
      const context: LogContext = { correlationId: 'test-id' };

      service.error(message, trace, context);

      expect(mockWinstonLogger.error).toHaveBeenCalledWith(message, {
        ...context,
        trace,
      });
    });

    it('should handle undefined trace', () => {
      const message = 'Error message';
      const context: LogContext = { correlationId: 'test-id' };

      service.error(message, undefined, context);

      expect(mockWinstonLogger.error).toHaveBeenCalledWith(message, {
        ...context,
        trace: undefined,
      });
    });
  });

  describe('warn', () => {
    it('should call winston warn method', () => {
      const message = 'Warning message';
      const context: LogContext = { method: 'GET' };

      service.warn(message, context);

      expect(mockWinstonLogger.warn).toHaveBeenCalledWith(message, context);
    });
  });

  describe('debug', () => {
    it('should call winston debug method', () => {
      const message = 'Debug message';
      const context: LogContext = { url: '/api/test' };

      service.debug(message, context);

      expect(mockWinstonLogger.debug).toHaveBeenCalledWith(message, context);
    });
  });

  describe('verbose', () => {
    it('should call winston verbose method', () => {
      const message = 'Verbose message';
      const context: LogContext = { statusCode: 200 };

      service.verbose(message, context);

      expect(mockWinstonLogger.verbose).toHaveBeenCalledWith(message, context);
    });
  });

  describe('logBusinessOperation', () => {
    it('should log business operation with proper context', () => {
      const operation = 'CREATE_HELPER';
      const details = { helperId: '123', name: 'John Doe' };
      const context: LogContext = { correlationId: 'test-id' };

      service.logBusinessOperation(operation, details, context);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        'Business Operation: CREATE_HELPER',
        {
          ...context,
          operation,
          details,
        }
      );
    });
  });

  describe('logSecurityEvent', () => {
    it('should log security event with proper context', () => {
      const event = 'UNAUTHORIZED_ACCESS';
      const details = { ip: '192.168.1.1', userAgent: 'test-agent' };
      const context: LogContext = { correlationId: 'test-id' };

      service.logSecurityEvent(event, details, context);

      expect(mockWinstonLogger.warn).toHaveBeenCalledWith(
        'Security Event: UNAUTHORIZED_ACCESS',
        {
          ...context,
          securityEvent: event,
          details,
        }
      );
    });
  });

  describe('logPerformance', () => {
    it('should log performance metrics with proper context', () => {
      const operation = 'DATABASE_QUERY';
      const duration = 150;
      const context: LogContext = { correlationId: 'test-id' };

      service.logPerformance(operation, duration, context);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        'Performance: DATABASE_QUERY',
        {
          ...context,
          operation,
          duration,
          performanceMetric: true,
        }
      );
    });
  });

  describe('logHttpRequest', () => {
    it('should log successful HTTP requests as info', () => {
      const method = 'GET';
      const url = '/api/helpers';
      const statusCode = 200;
      const responseTime = 50;
      const context: LogContext = { correlationId: 'test-id' };

      service.logHttpRequest(method, url, statusCode, responseTime, context);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        'HTTP GET /api/helpers 200',
        {
          ...context,
          method,
          url,
          statusCode,
          responseTime,
          httpRequest: true,
        }
      );
    });

    it('should log error HTTP requests as warn', () => {
      const method = 'POST';
      const url = '/api/helpers';
      const statusCode = 400;
      const responseTime = 25;
      const context: LogContext = { correlationId: 'test-id' };

      service.logHttpRequest(method, url, statusCode, responseTime, context);

      expect(mockWinstonLogger.warn).toHaveBeenCalledWith(
        'HTTP POST /api/helpers 400',
        {
          ...context,
          method,
          url,
          statusCode,
          responseTime,
          httpRequest: true,
        }
      );
    });
  });

  describe('logDatabaseOperation', () => {
    it('should log database operations with proper context', () => {
      const operation = 'INSERT';
      const collection = 'helpers';
      const duration = 75;
      const context: LogContext = { correlationId: 'test-id' };

      service.logDatabaseOperation(operation, collection, duration, context);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        'Database INSERT on helpers',
        {
          ...context,
          databaseOperation: operation,
          collection,
          duration,
        }
      );
    });
  });
});