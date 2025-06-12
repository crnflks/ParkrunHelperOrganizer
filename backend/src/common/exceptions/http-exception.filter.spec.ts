import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';
import { ArgumentsHost } from '@nestjs/common';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockResponse: any;
  let mockRequest: any;
  let mockArgumentsHost: ArgumentsHost;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HttpExceptionFilter],
    }).compile();

    filter = module.get<HttpExceptionFilter>(HttpExceptionFilter);

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockRequest = {
      url: '/api/test',
      method: 'GET',
      headers: {
        'x-correlation-id': 'test-correlation-id',
      },
      user: {
        sub: 'test-user-id',
      },
    };

    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as any;

    // Mock Logger
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should catch and handle HttpException with 400 status', () => {
    const exception = new HttpException('Bad Request', HttpStatus.BAD_REQUEST);

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: 'Bad Request',
        path: '/api/test',
        method: 'GET',
        correlationId: 'test-correlation-id',
        timestamp: expect.any(String),
      })
    );
  });

  it('should catch and handle HttpException with 500 status', () => {
    const exception = new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(Logger.prototype.error).toHaveBeenCalled();
  });

  it('should include error details in development environment', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const exception = new HttpException('Test Error', HttpStatus.BAD_REQUEST);
    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'HttpException',
        stack: expect.any(String),
      })
    );

    process.env.NODE_ENV = originalEnv;
  });

  it('should not include error details in production environment', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const exception = new HttpException('Test Error', HttpStatus.BAD_REQUEST);
    filter.catch(exception, mockArgumentsHost);

    const callArgs = mockResponse.json.mock.calls[0][0];
    expect(callArgs).not.toHaveProperty('error');
    expect(callArgs).not.toHaveProperty('stack');

    process.env.NODE_ENV = originalEnv;
  });

  it('should handle exceptions without correlation ID', () => {
    mockRequest.headers = {};

    const exception = new HttpException('Test Error', HttpStatus.BAD_REQUEST);
    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        correlationId: undefined,
      })
    );
  });

  it('should handle complex error response objects', () => {
    const errorResponse = {
      message: 'Validation failed',
      error: 'Bad Request',
      statusCode: 400,
    };
    const exception = new HttpException(errorResponse, HttpStatus.BAD_REQUEST);

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Validation failed',
      })
    );
  });

  it('should log warnings for 400-level errors', () => {
    const exception = new HttpException('Bad Request', HttpStatus.BAD_REQUEST);

    filter.catch(exception, mockArgumentsHost);

    expect(Logger.prototype.warn).toHaveBeenCalledWith(
      'HTTP 400 GET /api/test',
      expect.objectContaining({
        correlationId: 'test-correlation-id',
        error: 'Bad Request',
        userId: 'test-user-id',
      })
    );
  });

  it('should log errors for 500-level errors', () => {
    const exception = new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);

    filter.catch(exception, mockArgumentsHost);

    expect(Logger.prototype.error).toHaveBeenCalledWith(
      'HTTP 500 GET /api/test',
      expect.objectContaining({
        correlationId: 'test-correlation-id',
        error: 'Internal Server Error',
        stack: expect.any(String),
        userId: 'test-user-id',
      })
    );
  });
});