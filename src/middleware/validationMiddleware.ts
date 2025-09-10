import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/Logger';

export interface ValidationError {
  field: string;
  message: string;
}

export class RequestValidationMiddleware {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('./logs/validation-middleware.log', 'DEBUG', 'RequestValidationMiddleware');
  }

  /**
   * Validate that required fields are present in the request body
   * @param requiredFields List of required field names
   * @returns Express middleware function
   */
  public validateRequiredFields(requiredFields: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const requestId = Date.now().toString(36) + Math.random().toString(36).substr(2);
      this.logger.debug('Validating required fields', { requiredFields, body: req.body }, requestId);

      const errors: ValidationError[] = [];

      for (const field of requiredFields) {
        if (req.body[field] === undefined || req.body[field] === null) {
          errors.push({
            field,
            message: `Field '${field}' is required`
          });
        }
      }

      if (errors.length > 0) {
        this.logger.warn('Validation failed: Required fields missing', { errors }, requestId);
        res.status(400).json({
          error: 'Validation failed',
          details: errors
        });
        return;
      }

      this.logger.debug('Required fields validation passed', { requiredFields }, requestId);
      next();
    };
  }

  /**
   * Validate that fields match specified types
   * @param fieldTypes Object mapping field names to expected types
   * @returns Express middleware function
   */
  public validateFieldTypes(fieldTypes: { [key: string]: string }) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const requestId = Date.now().toString(36) + Math.random().toString(36).substr(2);
      this.logger.debug('Validating field types', { fieldTypes, body: req.body }, requestId);

      const errors: ValidationError[] = [];

      for (const [field, expectedType] of Object.entries(fieldTypes)) {
        if (req.body[field] !== undefined && req.body[field] !== null) {
          const actualType = typeof req.body[field];
          if (actualType !== expectedType) {
            errors.push({
              field,
              message: `Field '${field}' must be of type '${expectedType}', got '${actualType}'`
            });
          }
        }
      }

      if (errors.length > 0) {
        this.logger.warn('Validation failed: Field type mismatch', { errors }, requestId);
        res.status(400).json({
          error: 'Validation failed',
          details: errors
        });
        return;
      }

      this.logger.debug('Field types validation passed', { fieldTypes }, requestId);
      next();
    };
  }

  /**
   * Validate string fields against regex patterns
   * @param fieldPatterns Object mapping field names to regex patterns
   * @returns Express middleware function
   */
  public validateStringPatterns(fieldPatterns: { [key: string]: RegExp }) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const requestId = Date.now().toString(36) + Math.random().toString(36).substr(2);
      this.logger.debug('Validating string patterns', { fieldPatterns, body: req.body }, requestId);

      const errors: ValidationError[] = [];

      for (const [field, pattern] of Object.entries(fieldPatterns)) {
        if (req.body[field] !== undefined && req.body[field] !== null) {
          const value = req.body[field];
          if (typeof value !== 'string') {
            errors.push({
              field,
              message: `Field '${field}' must be a string`
            });
          } else if (!pattern.test(value)) {
            errors.push({
              field,
              message: `Field '${field}' does not match required pattern`
            });
          }
        }
      }

      if (errors.length > 0) {
        this.logger.warn('Validation failed: String pattern mismatch', { errors }, requestId);
        res.status(400).json({
          error: 'Validation failed',
          details: errors
        });
        return;
      }

      this.logger.debug('String patterns validation passed', { fieldPatterns }, requestId);
      next();
    };
  }
}