import { describe, it, expect } from 'vitest'
import {
  formatFieldValue,
  validateField,
  generateFieldKey,
  generateDataKey,
  getFieldTypeIcon,
  getFieldTypeColor,
} from '../dynamic-data'
import { FieldDataType, ValidationRuleType, type DynamicField, type ValidationRule } from '@/types/dynamic-data'

describe('dynamic-data utils', () => {
  describe('formatFieldValue', () => {
    it('should return "-" for null, undefined, or empty values', () => {
      expect(formatFieldValue(null, FieldDataType.TEXT)).toBe('-')
      expect(formatFieldValue(undefined, FieldDataType.TEXT)).toBe('-')
      expect(formatFieldValue('', FieldDataType.TEXT)).toBe('-')
    })

    it('should format DATE type', () => {
      const date = new Date('2024-01-15')
      const result = formatFieldValue(date, FieldDataType.DATE)
      expect(result).toContain('2024')
    })

    it('should format DATETIME type', () => {
      const date = new Date('2024-01-15T10:30:00')
      const result = formatFieldValue(date, FieldDataType.DATETIME)
      expect(result).toContain('2024')
    })

    it('should format CURRENCY type', () => {
      const result = formatFieldValue(1234.56, FieldDataType.CURRENCY)
      expect(result).toContain('1,234.56')
      expect(result).toContain('$')
    })

    it('should format NUMBER type', () => {
      const result = formatFieldValue(1234567, FieldDataType.NUMBER)
      expect(result).toBe('1,234,567')
    })

    it('should format BOOLEAN type', () => {
      expect(formatFieldValue(true, FieldDataType.BOOLEAN)).toBe('Yes')
      expect(formatFieldValue(false, FieldDataType.BOOLEAN)).toBe('No')
    })

    it('should format MULTI_SELECT type with array', () => {
      const result = formatFieldValue(['Option1', 'Option2', 'Option3'], FieldDataType.MULTI_SELECT)
      expect(result).toBe('Option1, Option2, Option3')
    })

    it('should format MULTI_SELECT type with non-array', () => {
      const result = formatFieldValue('SingleOption', FieldDataType.MULTI_SELECT)
      expect(result).toBe('SingleOption')
    })

    it('should format FILE type with name property', () => {
      const file = { name: 'document.pdf' }
      expect(formatFieldValue(file, FieldDataType.FILE)).toBe('document.pdf')
    })

    it('should format FILE type with fileName property', () => {
      const file = { fileName: 'image.jpg' }
      expect(formatFieldValue(file, FieldDataType.FILE)).toBe('image.jpg')
    })

    it('should format FILE type with default', () => {
      expect(formatFieldValue({}, FieldDataType.FILE)).toBe('File')
    })

    it('should format RICH_TEXT type by stripping HTML', () => {
      const html = '<p>This is <strong>rich</strong> text with <em>formatting</em> and more content</p>'
      const result = formatFieldValue(html, FieldDataType.RICH_TEXT)
      expect(result).toContain('This is rich text')
      expect(result).not.toContain('<p>')
      expect(result).toContain('...')
    })

    it('should format TEXT and other types as string', () => {
      expect(formatFieldValue('Plain text', FieldDataType.TEXT)).toBe('Plain text')
      expect(formatFieldValue('test@example.com', FieldDataType.EMAIL)).toBe('test@example.com')
      expect(formatFieldValue('https://example.com', FieldDataType.URL)).toBe('https://example.com')
    })
  })

  describe('validateField', () => {
    const createField = (overrides: Partial<DynamicField>): DynamicField => ({
      id: '1',
      name: 'Test Field',
      dataKey: 'testField',
      dataType: FieldDataType.TEXT,
      isMandatory: false,
      validationRules: [],
      selectOptions: [],
      sortOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    })

    it('should return error for mandatory field with empty value', () => {
      const field = createField({ isMandatory: true, name: 'Email' })
      expect(validateField(null, field)).toBe('Email is required')
      expect(validateField(undefined, field)).toBe('Email is required')
      expect(validateField('', field)).toBe('Email is required')
    })

    it('should return null for optional field with empty value', () => {
      const field = createField({ isMandatory: false })
      expect(validateField(null, field)).toBeNull()
      expect(validateField(undefined, field)).toBeNull()
      expect(validateField('', field)).toBeNull()
    })

    it('should validate EMAIL type with valid email', () => {
      const field = createField({ dataType: FieldDataType.EMAIL, name: 'Email' })
      expect(validateField('test@example.com', field)).toBeNull()
    })

    it('should return error for EMAIL type with invalid email', () => {
      const field = createField({ dataType: FieldDataType.EMAIL, name: 'Email' })
      expect(validateField('invalid-email', field)).toBe('Email must be a valid email address')
      expect(validateField('test@', field)).toBe('Email must be a valid email address')
    })

    it('should validate URL type with valid URL', () => {
      const field = createField({ dataType: FieldDataType.URL, name: 'Website' })
      expect(validateField('https://example.com', field)).toBeNull()
      expect(validateField('http://test.com/path', field)).toBeNull()
    })

    it('should return error for URL type with invalid URL', () => {
      const field = createField({ dataType: FieldDataType.URL, name: 'Website' })
      expect(validateField('invalid-url', field)).toBe('Website must be a valid URL')
      expect(validateField('not a url', field)).toBe('Website must be a valid URL')
    })

    it('should validate NUMBER type with valid number', () => {
      const field = createField({ dataType: FieldDataType.NUMBER, name: 'Age' })
      expect(validateField(25, field)).toBeNull()
      expect(validateField('25', field)).toBeNull()
    })

    it('should return error for NUMBER type with invalid number', () => {
      const field = createField({ dataType: FieldDataType.NUMBER, name: 'Age' })
      expect(validateField('not-a-number', field)).toBe('Age must be a number')
    })

    it('should validate CURRENCY type with valid number', () => {
      const field = createField({ dataType: FieldDataType.CURRENCY, name: 'Price' })
      expect(validateField(99.99, field)).toBeNull()
      expect(validateField('99.99', field)).toBeNull()
    })

    it('should validate MIN_LENGTH rule', () => {
      const rule: ValidationRule = {
        id: '1',
        ruleType: ValidationRuleType.MIN_LENGTH,
        ruleValue: '5',
        errorMessage: 'Minimum 5 characters required',
      }
      const field = createField({ validationRules: [rule] })

      expect(validateField('test', field)).toBe('Minimum 5 characters required')
      expect(validateField('testing', field)).toBeNull()
    })

    it('should validate MAX_LENGTH rule', () => {
      const rule: ValidationRule = {
        id: '1',
        ruleType: ValidationRuleType.MAX_LENGTH,
        ruleValue: '10',
        errorMessage: 'Maximum 10 characters allowed',
      }
      const field = createField({ validationRules: [rule] })

      expect(validateField('this is too long', field)).toBe('Maximum 10 characters allowed')
      expect(validateField('short', field)).toBeNull()
    })

    it('should validate MIN_VALUE rule', () => {
      const rule: ValidationRule = {
        id: '1',
        ruleType: ValidationRuleType.MIN_VALUE,
        ruleValue: '18',
        errorMessage: 'Must be at least 18',
      }
      const field = createField({ validationRules: [rule] })

      expect(validateField(15, field)).toBe('Must be at least 18')
      expect(validateField(18, field)).toBeNull()
      expect(validateField(25, field)).toBeNull()
    })

    it('should validate MAX_VALUE rule', () => {
      const rule: ValidationRule = {
        id: '1',
        ruleType: ValidationRuleType.MAX_VALUE,
        ruleValue: '100',
        errorMessage: 'Must be at most 100',
      }
      const field = createField({ validationRules: [rule] })

      expect(validateField(150, field)).toBe('Must be at most 100')
      expect(validateField(100, field)).toBeNull()
      expect(validateField(50, field)).toBeNull()
    })

    it('should validate REGEX rule with valid pattern', () => {
      const rule: ValidationRule = {
        id: '1',
        ruleType: ValidationRuleType.REGEX,
        ruleValue: '^[A-Z][a-z]+$',
        errorMessage: 'Must start with uppercase letter',
      }
      const field = createField({ validationRules: [rule] })

      expect(validateField('hello', field)).toBe('Must start with uppercase letter')
      expect(validateField('Hello', field)).toBeNull()
    })

    it('should handle invalid REGEX pattern', () => {
      const rule: ValidationRule = {
        id: '1',
        ruleType: ValidationRuleType.REGEX,
        ruleValue: '[invalid',
        errorMessage: 'Pattern error',
      }
      const field = createField({ validationRules: [rule] })

      expect(validateField('test', field)).toBe('Invalid regex pattern')
    })

    it('should validate multiple rules', () => {
      const rules: ValidationRule[] = [
        {
          id: '1',
          ruleType: ValidationRuleType.MIN_LENGTH,
          ruleValue: '3',
          errorMessage: 'Too short',
        },
        {
          id: '2',
          ruleType: ValidationRuleType.MAX_LENGTH,
          ruleValue: '10',
          errorMessage: 'Too long',
        },
      ]
      const field = createField({ validationRules: rules })

      expect(validateField('ab', field)).toBe('Too short')
      expect(validateField('this is way too long', field)).toBe('Too long')
      expect(validateField('valid', field)).toBeNull()
    })
  })

  describe('generateFieldKey', () => {
    it('should generate camelCase key from simple name', () => {
      expect(generateFieldKey('First Name')).toBe('firstName')
      expect(generateFieldKey('Email Address')).toBe('emailAddress')
    })

    it('should handle multiple spaces and special characters', () => {
      expect(generateFieldKey('User  Full   Name')).toBe('userFullName')
      expect(generateFieldKey('Phone-Number')).toBe('phoneNumber')
      expect(generateFieldKey('Date_Of_Birth')).toBe('dateOfBirth')
    })

    it('should handle mixed special characters', () => {
      expect(generateFieldKey('My-Special_Field Name')).toBe('mySpecialFieldName')
      expect(generateFieldKey('Test@Field#Name')).toBe('testFieldName')
    })

    it('should handle already camelCase', () => {
      expect(generateFieldKey('alreadyCamelCase')).toBe('alreadyCamelCase')
    })

    it('should handle single word', () => {
      expect(generateFieldKey('Name')).toBe('name')
      expect(generateFieldKey('email')).toBe('email')
    })
  })

  describe('generateDataKey', () => {
    it('should generate snake_case key from simple name', () => {
      expect(generateDataKey('First Name')).toBe('first_name')
      expect(generateDataKey('Email Address')).toBe('email_address')
    })

    it('should convert to lowercase', () => {
      expect(generateDataKey('User Full Name')).toBe('user_full_name')
      expect(generateDataKey('UPPERCASE')).toBe('uppercase')
    })

    it('should handle special characters', () => {
      expect(generateDataKey('Phone-Number')).toBe('phone_number')
      expect(generateDataKey('Date@Of#Birth')).toBe('date_of_birth')
    })

    it('should remove leading and trailing underscores', () => {
      expect(generateDataKey(' Leading')).toBe('leading')
      expect(generateDataKey('Trailing ')).toBe('trailing')
      expect(generateDataKey(' Both Ends ')).toBe('both_ends')
    })

    it('should handle multiple spaces', () => {
      expect(generateDataKey('Multiple   Spaces')).toBe('multiple_spaces')
    })

    it('should handle already snake_case', () => {
      expect(generateDataKey('already_snake_case')).toBe('already_snake_case')
    })
  })

  describe('getFieldTypeIcon', () => {
    it('should return correct icon for TEXT type', () => {
      expect(getFieldTypeIcon(FieldDataType.TEXT)).toBe('pi pi-align-left')
    })

    it('should return correct icon for TEXTAREA type', () => {
      expect(getFieldTypeIcon(FieldDataType.TEXTAREA)).toBe('pi pi-align-justify')
    })

    it('should return correct icon for NUMBER type', () => {
      expect(getFieldTypeIcon(FieldDataType.NUMBER)).toBe('pi pi-hashtag')
    })

    it('should return correct icon for CURRENCY type', () => {
      expect(getFieldTypeIcon(FieldDataType.CURRENCY)).toBe('pi pi-dollar')
    })

    it('should return correct icon for DATE type', () => {
      expect(getFieldTypeIcon(FieldDataType.DATE)).toBe('pi pi-calendar')
    })

    it('should return correct icon for DATETIME type', () => {
      expect(getFieldTypeIcon(FieldDataType.DATETIME)).toBe('pi pi-calendar-times')
    })

    it('should return correct icon for BOOLEAN type', () => {
      expect(getFieldTypeIcon(FieldDataType.BOOLEAN)).toBe('pi pi-check-square')
    })

    it('should return correct icon for EMAIL type', () => {
      expect(getFieldTypeIcon(FieldDataType.EMAIL)).toBe('pi pi-envelope')
    })

    it('should return correct icon for URL type', () => {
      expect(getFieldTypeIcon(FieldDataType.URL)).toBe('pi pi-link')
    })

    it('should return correct icon for FILE type', () => {
      expect(getFieldTypeIcon(FieldDataType.FILE)).toBe('pi pi-file')
    })

    it('should return correct icon for RICH_TEXT type', () => {
      expect(getFieldTypeIcon(FieldDataType.RICH_TEXT)).toBe('pi pi-file-edit')
    })

    it('should return correct icon for RELATIONSHIP type', () => {
      expect(getFieldTypeIcon(FieldDataType.RELATIONSHIP)).toBe('pi pi-sitemap')
    })
  })

  describe('getFieldTypeColor', () => {
    it('should return correct color for TEXT type', () => {
      expect(getFieldTypeColor(FieldDataType.TEXT)).toBe('blue')
    })

    it('should return correct color for NUMBER type', () => {
      expect(getFieldTypeColor(FieldDataType.NUMBER)).toBe('green')
    })

    it('should return correct color for CURRENCY type', () => {
      expect(getFieldTypeColor(FieldDataType.CURRENCY)).toBe('green')
    })

    it('should return correct color for DATE type', () => {
      expect(getFieldTypeColor(FieldDataType.DATE)).toBe('purple')
    })

    it('should return correct color for BOOLEAN type', () => {
      expect(getFieldTypeColor(FieldDataType.BOOLEAN)).toBe('orange')
    })

    it('should return correct color for SELECT types', () => {
      expect(getFieldTypeColor(FieldDataType.SINGLE_SELECT)).toBe('cyan')
      expect(getFieldTypeColor(FieldDataType.MULTI_SELECT)).toBe('cyan')
    })

    it('should return correct color for EMAIL type', () => {
      expect(getFieldTypeColor(FieldDataType.EMAIL)).toBe('pink')
    })

    it('should return correct color for FILE type', () => {
      expect(getFieldTypeColor(FieldDataType.FILE)).toBe('gray')
    })

    it('should return correct color for RICH_TEXT type', () => {
      expect(getFieldTypeColor(FieldDataType.RICH_TEXT)).toBe('indigo')
    })

    it('should return correct color for RELATIONSHIP type', () => {
      expect(getFieldTypeColor(FieldDataType.RELATIONSHIP)).toBe('teal')
    })
  })
})
