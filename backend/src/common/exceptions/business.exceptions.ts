import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessException extends HttpException {
  constructor(message: string, status: HttpStatus = HttpStatus.BAD_REQUEST) {
    super(message, status);
  }
}

export class HelperNotFoundException extends BusinessException {
  constructor(helperId: string) {
    super(`Helper with ID ${helperId} not found`, HttpStatus.NOT_FOUND);
  }
}

export class ScheduleNotFoundException extends BusinessException {
  constructor(scheduleId: string) {
    super(`Schedule with ID ${scheduleId} not found`, HttpStatus.NOT_FOUND);
  }
}

export class HelperAlreadyAssignedException extends BusinessException {
  constructor(helperId: string, scheduleId: string) {
    super(
      `Helper ${helperId} is already assigned to schedule ${scheduleId}`,
      HttpStatus.CONFLICT
    );
  }
}

export class InvalidDateRangeException extends BusinessException {
  constructor() {
    super('Invalid date range: end date must be after start date');
  }
}

export class DatabaseConnectionException extends BusinessException {
  constructor(error?: string) {
    super(
      `Database connection failed${error ? `: ${error}` : ''}`,
      HttpStatus.SERVICE_UNAVAILABLE
    );
  }
}

export class ExternalServiceException extends BusinessException {
  constructor(service: string, error?: string) {
    super(
      `External service ${service} is unavailable${error ? `: ${error}` : ''}`,
      HttpStatus.BAD_GATEWAY
    );
  }
}

export class ValidationException extends BusinessException {
  constructor(field: string, message: string) {
    super(`Validation failed for ${field}: ${message}`);
  }
}