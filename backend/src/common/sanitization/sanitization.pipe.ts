import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import { Transform } from 'class-transformer';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import validator from 'validator';

// Initialize DOMPurify with JSDOM
const window = new JSDOM('').window;
const purify = DOMPurify(window as any);

@Injectable()
export class SanitizationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (!value || typeof value !== 'object') {
      return this.sanitizeValue(value);
    }

    return this.sanitizeObject(value);
  }

  private sanitizeObject(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = this.sanitizeObject(value);
      }
      return sanitized;
    }

    return this.sanitizeValue(obj);
  }

  private sanitizeValue(value: any): any {
    if (typeof value === 'string') {
      // Basic XSS protection
      let sanitized = purify.sanitize(value, { 
        ALLOWED_TAGS: [], 
        ALLOWED_ATTR: [] 
      });
      
      // Additional sanitization
      sanitized = validator.escape(sanitized);
      
      // Normalize whitespace
      sanitized = sanitized.trim().replace(/\s+/g, ' ');
      
      return sanitized;
    }

    return value;
  }
}

// Transform decorators for common sanitization patterns
export function SanitizeString() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      return purify.sanitize(validator.escape(value.trim()), { 
        ALLOWED_TAGS: [], 
        ALLOWED_ATTR: [] 
      });
    }
    return value;
  });
}

export function NormalizeEmail() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      return validator.normalizeEmail(value.trim().toLowerCase()) || value;
    }
    return value;
  });
}

export function NormalizePhone() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      // Remove all non-digit characters except + at the beginning
      return value.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
    }
    return value;
  });
}

export function CapitalizeWords() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      return value
        .trim()
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    return value;
  });
}

export function TrimWhitespace() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.trim().replace(/\s+/g, ' ');
    }
    return value;
  });
}