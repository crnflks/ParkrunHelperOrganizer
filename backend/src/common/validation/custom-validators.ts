import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  isPhoneNumber,
  isAlphanumeric,
} from 'class-validator';
import validator from 'validator';

// Custom validator for Parkrun ID format (letter followed by 6-7 digits)
export function IsParkrunId(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isParkrunId',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          // Parkrun ID format: A1234567 (letter followed by 6-7 digits)
          return /^[A-Z]\d{6,7}$/.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid Parkrun ID (e.g., A1234567)`;
        },
      },
    });
  };
}

// Custom validator for safe HTML content
export function IsSafeHTML(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isSafeHTML',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          // Check for potentially dangerous HTML/JS patterns
          const dangerousPatterns = [
            /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /<iframe/gi,
            /<object/gi,
            /<embed/gi,
            /<link/gi,
            /<meta/gi,
          ];
          
          return !dangerousPatterns.some(pattern => pattern.test(value));
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} contains potentially unsafe HTML content`;
        },
      },
    });
  };
}

// Custom validator for phone numbers with multiple format support
export function IsValidPhoneNumber(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidPhoneNumber',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          // Support multiple phone number formats
          return (
            isPhoneNumber(value, 'GB') || // UK format
            isPhoneNumber(value, 'US') || // US format
            validator.isMobilePhone(value, 'any', { strictMode: false })
          );
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid phone number`;
        },
      },
    });
  };
}

// Custom validator for alphanumeric with limited special characters
export function IsAlphanumericWithSpaces(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isAlphanumericWithSpaces',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          // Allow letters, numbers, spaces, hyphens, and apostrophes
          return /^[a-zA-Z0-9\s\-']+$/.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} can only contain letters, numbers, spaces, hyphens, and apostrophes`;
        },
      },
    });
  };
}

// Custom validator for strong password requirements
export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          
          return validator.isStrongPassword(value, {
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1,
          });
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must contain at least 8 characters with uppercase, lowercase, number and symbol`;
        },
      },
    });
  };
}