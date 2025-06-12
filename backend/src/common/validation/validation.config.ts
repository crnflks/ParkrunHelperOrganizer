import { ValidationPipeOptions } from '@nestjs/common';

export const globalValidationConfig: ValidationPipeOptions = {
  transform: true,
  transformOptions: {
    enableImplicitConversion: true,
  },
  whitelist: true,
  forbidNonWhitelisted: true,
  forbidUnknownValues: true,
  disableErrorMessages: process.env.NODE_ENV === 'production',
  validationError: {
    target: false,
    value: false,
  },
  exceptionFactory: (errors) => {
    const messages = errors.map(error => {
      const constraints = error.constraints;
      if (constraints) {
        return Object.values(constraints).join(', ');
      }
      return `Validation failed for ${error.property}`;
    });
    
    // Return a custom error format
    return {
      statusCode: 400,
      message: 'Validation failed',
      errors: messages,
      timestamp: new Date().toISOString(),
    };
  },
};