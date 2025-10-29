import { Injectable } from '@nestjs/common';
import { ValidationResult, ValidationError, DynamicSchema, DynamicField } from '../entities/instance.entity';
import { FieldDataType, ValidationRuleType } from '../../../generated/prisma';

@Injectable()
export class ValidationService {
  /**
   * Validate instance values against schema
   */
  async validate(
    schema: DynamicSchema,
    values: Record<string, any>,
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    for (const field of schema.fields) {
      const value = values[field.fieldKey];
      const fieldErrors = await this.validateField(field, value);
      errors.push(...fieldErrors);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate a single field
   */
  async validateField(
    field: DynamicField,
    value: any,
  ): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    // Check mandatory
    if (field.isMandatory) {
      if (value === undefined || value === null || value === '') {
        errors.push({
          field: field.fieldKey,
          message: `${field.name} is required`,
          code: 'REQUIRED',
        });
        return errors; // Don't continue validation if required field is missing
      }
    }

    // Skip validation if value is empty and not mandatory
    if (value === undefined || value === null || value === '') {
      return errors;
    }

    // Type validation
    const typeError = this.validateType(field, value);
    if (typeError) {
      errors.push(typeError);
      return errors; // Don't continue if type is wrong
    }

    // Custom validation rules
    for (const rule of field.validationRules) {
      const ruleError = this.validateRule(field, value, rule);
      if (ruleError) {
        errors.push(ruleError);
      }
    }

    return errors;
  }

  /**
   * Validate value type matches field data type
   */
  private validateType(field: DynamicField, value: any): ValidationError | null {
    switch (field.dataType) {
      case FieldDataType.TEXT:
      case FieldDataType.TEXTAREA:
        if (typeof value !== 'string') {
          return {
            field: field.fieldKey,
            message: `${field.name} must be a string`,
            code: 'INVALID_TYPE',
          };
        }
        break;

      case FieldDataType.NUMBER:
      case FieldDataType.CURRENCY:
        if (typeof value !== 'number' && !this.isNumeric(value)) {
          return {
            field: field.fieldKey,
            message: `${field.name} must be a number`,
            code: 'INVALID_TYPE',
          };
        }
        break;

      case FieldDataType.EMAIL:
        if (typeof value !== 'string' || !this.isValidEmail(value)) {
          return {
            field: field.fieldKey,
            message: `${field.name} must be a valid email address`,
            code: 'INVALID_EMAIL',
          };
        }
        break;

      case FieldDataType.URL:
        if (typeof value !== 'string' || !this.isValidUrl(value)) {
          return {
            field: field.fieldKey,
            message: `${field.name} must be a valid URL`,
            code: 'INVALID_URL',
          };
        }
        break;

      case FieldDataType.DATE:
      case FieldDataType.DATETIME:
        if (!this.isValidDate(value)) {
          return {
            field: field.fieldKey,
            message: `${field.name} must be a valid date`,
            code: 'INVALID_DATE',
          };
        }
        break;

      case FieldDataType.BOOLEAN:
        if (typeof value !== 'boolean') {
          return {
            field: field.fieldKey,
            message: `${field.name} must be a boolean`,
            code: 'INVALID_TYPE',
          };
        }
        break;

      case FieldDataType.SINGLE_SELECT:
        if (field.dropdownOptions) {
          const validValues = field.dropdownOptions.map((opt) => opt.value);
          if (!validValues.includes(value)) {
            return {
              field: field.fieldKey,
              message: `${field.name} must be one of: ${validValues.join(', ')}`,
              code: 'INVALID_OPTION',
            };
          }
        }
        break;

      case FieldDataType.MULTI_SELECT:
        if (!Array.isArray(value)) {
          return {
            field: field.fieldKey,
            message: `${field.name} must be an array`,
            code: 'INVALID_TYPE',
          };
        }
        if (field.dropdownOptions) {
          const validValues = field.dropdownOptions.map((opt) => opt.value);
          for (const v of value) {
            if (!validValues.includes(v)) {
              return {
                field: field.fieldKey,
                message: `${field.name} contains invalid option: ${v}`,
                code: 'INVALID_OPTION',
              };
            }
          }
        }
        break;
    }

    return null;
  }

  /**
   * Validate value against a specific rule
   */
  private validateRule(
    field: DynamicField,
    value: any,
    rule: { ruleType: string; ruleValue: string; errorMessage: string },
  ): ValidationError | null {
    switch (rule.ruleType) {
      case ValidationRuleType.MIN_LENGTH:
        if (typeof value === 'string' && value.length < parseInt(rule.ruleValue)) {
          return {
            field: field.fieldKey,
            message: rule.errorMessage,
            code: 'MIN_LENGTH',
          };
        }
        break;

      case ValidationRuleType.MAX_LENGTH:
        if (typeof value === 'string' && value.length > parseInt(rule.ruleValue)) {
          return {
            field: field.fieldKey,
            message: rule.errorMessage,
            code: 'MAX_LENGTH',
          };
        }
        break;

      case ValidationRuleType.MIN_VALUE:
        if (typeof value === 'number' && value < parseFloat(rule.ruleValue)) {
          return {
            field: field.fieldKey,
            message: rule.errorMessage,
            code: 'MIN_VALUE',
          };
        }
        break;

      case ValidationRuleType.MAX_VALUE:
        if (typeof value === 'number' && value > parseFloat(rule.ruleValue)) {
          return {
            field: field.fieldKey,
            message: rule.errorMessage,
            code: 'MAX_VALUE',
          };
        }
        break;

      case ValidationRuleType.REGEX:
        if (typeof value === 'string') {
          try {
            const regex = new RegExp(rule.ruleValue);
            if (!regex.test(value)) {
              return {
                field: field.fieldKey,
                message: rule.errorMessage,
                code: 'REGEX',
              };
            }
          } catch (e) {
            // Invalid regex pattern
            return {
              field: field.fieldKey,
              message: 'Invalid regex pattern',
              code: 'INVALID_REGEX',
            };
          }
        }
        break;

      case ValidationRuleType.CUSTOM:
        // Custom validation logic can be implemented here
        break;
    }

    return null;
  }

  /**
   * Helper: Check if value is numeric
   */
  private isNumeric(value: any): boolean {
    if (typeof value === 'number') return true;
    if (typeof value === 'string') {
      return !isNaN(parseFloat(value)) && isFinite(Number(value));
    }
    return false;
  }

  /**
   * Helper: Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Helper: Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Helper: Validate date format
   */
  private isValidDate(value: any): boolean {
    if (value instanceof Date) {
      return !isNaN(value.getTime());
    }
    if (typeof value === 'string' || typeof value === 'number') {
      const date = new Date(value);
      return !isNaN(date.getTime());
    }
    return false;
  }
}
