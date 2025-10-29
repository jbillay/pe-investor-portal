import { FieldDataType, ValidationRuleType, type DynamicField, type ValidationRule } from '@/types/dynamic-data';

/**
 * Format a field value for display
 */
export const formatFieldValue = (value: any, dataType: FieldDataType): string => {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  switch (dataType) {
    case FieldDataType.DATE:
      return new Date(value).toLocaleDateString();

    case FieldDataType.DATETIME:
      return new Date(value).toLocaleString();

    case FieldDataType.CURRENCY:
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(value);

    case FieldDataType.NUMBER:
      return new Intl.NumberFormat('en-US').format(value);

    case FieldDataType.BOOLEAN:
      return value ? 'Yes' : 'No';

    case FieldDataType.MULTI_SELECT:
      return Array.isArray(value) ? value.join(', ') : String(value);

    case FieldDataType.FILE:
      return value?.name || value?.fileName || 'File';

    case FieldDataType.RICH_TEXT:
      // Strip HTML tags for display
      return String(value).replace(/<[^>]*>/g, '').substring(0, 100) + '...';

    default:
      return String(value);
  }
};

/**
 * Validate a field value against its rules
 */
export const validateField = (value: any, field: DynamicField): string | null => {
  // Check mandatory
  if (field.isMandatory && (value === null || value === undefined || value === '')) {
    return `${field.name} is required`;
  }

  // Skip validation if value is empty and not mandatory
  if (value === null || value === undefined || value === '') {
    return null;
  }

  // Type-specific validation
  const typeError = validateFieldType(value, field.dataType, field.name);
  if (typeError) return typeError;

  // Custom validation rules
  for (const rule of field.validationRules) {
    const error = validateRule(value, rule, field.dataType);
    if (error) return error;
  }

  return null;
};

/**
 * Validate field type
 */
const validateFieldType = (value: any, dataType: FieldDataType, fieldName: string): string | null => {
  switch (dataType) {
    case FieldDataType.EMAIL:
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return `${fieldName} must be a valid email address`;
      }
      break;

    case FieldDataType.URL:
      try {
        new URL(value);
      } catch {
        return `${fieldName} must be a valid URL`;
      }
      break;

    case FieldDataType.NUMBER:
    case FieldDataType.CURRENCY:
      if (typeof value !== 'number' && isNaN(Number(value))) {
        return `${fieldName} must be a number`;
      }
      break;
  }

  return null;
};

/**
 * Validate a single rule
 */
const validateRule = (value: any, rule: ValidationRule, dataType: FieldDataType): string | null => {
  switch (rule.ruleType) {
    case ValidationRuleType.MIN_LENGTH:
      if (typeof value === 'string' && value.length < parseInt(rule.ruleValue)) {
        return rule.errorMessage;
      }
      break;

    case ValidationRuleType.MAX_LENGTH:
      if (typeof value === 'string' && value.length > parseInt(rule.ruleValue)) {
        return rule.errorMessage;
      }
      break;

    case ValidationRuleType.MIN_VALUE:
      if (typeof value === 'number' && value < parseFloat(rule.ruleValue)) {
        return rule.errorMessage;
      }
      break;

    case ValidationRuleType.MAX_VALUE:
      if (typeof value === 'number' && value > parseFloat(rule.ruleValue)) {
        return rule.errorMessage;
      }
      break;

    case ValidationRuleType.REGEX:
      if (typeof value === 'string') {
        try {
          const regex = new RegExp(rule.ruleValue);
          if (!regex.test(value)) {
            return rule.errorMessage;
          }
        } catch {
          return 'Invalid regex pattern';
        }
      }
      break;
  }

  return null;
};

/**
 * Generate a camelCase key from a name
 */
export const generateFieldKey = (name: string): string => {
  return name
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase())
    .replace(/^[A-Z]/, (char) => char.toLowerCase());
};

/**
 * Generate a snake_case key from a name
 */
export const generateDataKey = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
};

/**
 * Get PrimeIcons icon class for field type
 */
export const getFieldTypeIcon = (dataType: FieldDataType): string => {
  const iconMap: Record<FieldDataType, string> = {
    [FieldDataType.TEXT]: 'pi-align-left',
    [FieldDataType.TEXTAREA]: 'pi-align-justify',
    [FieldDataType.NUMBER]: 'pi-hashtag',
    [FieldDataType.CURRENCY]: 'pi-dollar',
    [FieldDataType.DATE]: 'pi-calendar',
    [FieldDataType.DATETIME]: 'pi-calendar-times',
    [FieldDataType.BOOLEAN]: 'pi-check-square',
    [FieldDataType.SINGLE_SELECT]: 'pi-list',
    [FieldDataType.MULTI_SELECT]: 'pi-list',
    [FieldDataType.EMAIL]: 'pi-envelope',
    [FieldDataType.URL]: 'pi-link',
    [FieldDataType.FILE]: 'pi-file',
    [FieldDataType.RICH_TEXT]: 'pi-file-edit',
    [FieldDataType.RELATIONSHIP]: 'pi-sitemap'
  };

  return `pi ${iconMap[dataType] || 'pi-question'}`;
};

/**
 * Get color for field type
 */
export const getFieldTypeColor = (dataType: FieldDataType): string => {
  const colorMap: Record<FieldDataType, string> = {
    [FieldDataType.TEXT]: 'blue',
    [FieldDataType.TEXTAREA]: 'blue',
    [FieldDataType.NUMBER]: 'green',
    [FieldDataType.CURRENCY]: 'green',
    [FieldDataType.DATE]: 'purple',
    [FieldDataType.DATETIME]: 'purple',
    [FieldDataType.BOOLEAN]: 'orange',
    [FieldDataType.SINGLE_SELECT]: 'cyan',
    [FieldDataType.MULTI_SELECT]: 'cyan',
    [FieldDataType.EMAIL]: 'pink',
    [FieldDataType.URL]: 'pink',
    [FieldDataType.FILE]: 'gray',
    [FieldDataType.RICH_TEXT]: 'indigo',
    [FieldDataType.RELATIONSHIP]: 'teal'
  };

  return colorMap[dataType] || 'gray';
};
