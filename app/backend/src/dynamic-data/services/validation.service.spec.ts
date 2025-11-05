import { Test, TestingModule } from '@nestjs/testing';
import { ValidationService } from './validation.service';
import { DynamicSchema, DynamicField } from '../entities/instance.entity';
import { FieldDataType, ValidationRuleType } from '../../../generated/prisma';

describe('ValidationService', () => {
  let service: ValidationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ValidationService],
    }).compile();

    service = module.get<ValidationService>(ValidationService);
  });

  describe('validate', () => {
    it('should validate all fields in schema and return no errors for valid data', async () => {
      const schema: DynamicSchema = {
        dataObjectId: 'obj-1',
        dataKey: 'test',
        name: 'Test',
        version: 1,
        fields: [
          {
            id: 'field-1',
            fieldKey: 'name',
            name: 'Name',
            dataType: FieldDataType.TEXT,
            fieldOrder: 1,
            isMandatory: true,
            isReadOnly: false,
            validationRules: [],
            dropdownOptions: [],
          },
          {
            id: 'field-2',
            fieldKey: 'age',
            name: 'Age',
            dataType: FieldDataType.NUMBER,
            fieldOrder: 2,
            isMandatory: false,
            isReadOnly: false,
            validationRules: [],
            dropdownOptions: [],
          },
        ],
      };

      const values = {
        name: 'John Doe',
        age: 30,
      };

      const result = await service.validate(schema, values);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should collect errors from multiple invalid fields', async () => {
      const schema: DynamicSchema = {
        dataObjectId: 'obj-1',
        dataKey: 'test',
        name: 'Test',
        version: 1,
        fields: [
          {
            id: 'field-1',
            fieldKey: 'name',
            name: 'Name',
            dataType: FieldDataType.TEXT,
            fieldOrder: 1,
            isMandatory: true,
            isReadOnly: false,
            validationRules: [],
            dropdownOptions: [],
          },
          {
            id: 'field-2',
            fieldKey: 'email',
            name: 'Email',
            dataType: FieldDataType.EMAIL,
            fieldOrder: 2,
            isMandatory: true,
            isReadOnly: false,
            validationRules: [],
            dropdownOptions: [],
          },
        ],
      };

      const values = {
        name: '',
        email: 'invalid-email',
      };

      const result = await service.validate(schema, values);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].field).toBe('name');
      expect(result.errors[0].code).toBe('REQUIRED');
      expect(result.errors[1].field).toBe('email');
      expect(result.errors[1].code).toBe('INVALID_EMAIL');
    });
  });

  describe('validateField - mandatory fields', () => {
    const mandatoryField: DynamicField = {
      id: 'field-1',
      fieldKey: 'name',
      name: 'Name',
      dataType: FieldDataType.TEXT,
      fieldOrder: 1,
      isMandatory: true,
      isReadOnly: false,
      validationRules: [],
      dropdownOptions: [],
    };

    it('should return error for undefined mandatory field', async () => {
      const errors = await service.validateField(mandatoryField, undefined);

      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('REQUIRED');
      expect(errors[0].message).toBe('Name is required');
    });

    it('should return error for null mandatory field', async () => {
      const errors = await service.validateField(mandatoryField, null);

      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('REQUIRED');
    });

    it('should return error for empty string mandatory field', async () => {
      const errors = await service.validateField(mandatoryField, '');

      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('REQUIRED');
    });

    it('should validate non-empty mandatory field', async () => {
      const errors = await service.validateField(mandatoryField, 'John');

      expect(errors).toHaveLength(0);
    });
  });

  describe('validateField - optional fields', () => {
    const optionalField: DynamicField = {
      id: 'field-1',
      fieldKey: 'nickname',
      name: 'Nickname',
      dataType: FieldDataType.TEXT,
      fieldOrder: 1,
      isMandatory: false,
      isReadOnly: false,
      validationRules: [],
      dropdownOptions: [],
    };

    it('should skip validation for undefined optional field', async () => {
      const errors = await service.validateField(optionalField, undefined);

      expect(errors).toHaveLength(0);
    });

    it('should skip validation for null optional field', async () => {
      const errors = await service.validateField(optionalField, null);

      expect(errors).toHaveLength(0);
    });

    it('should skip validation for empty string optional field', async () => {
      const errors = await service.validateField(optionalField, '');

      expect(errors).toHaveLength(0);
    });
  });

  describe('validateField - TEXT type', () => {
    const textField: DynamicField = {
      id: 'field-1',
      fieldKey: 'name',
      name: 'Name',
      dataType: FieldDataType.TEXT,
      fieldOrder: 1,
      isMandatory: false,
      isReadOnly: false,
      validationRules: [],
      dropdownOptions: [],
    };

    it('should accept string values', async () => {
      const errors = await service.validateField(textField, 'John Doe');

      expect(errors).toHaveLength(0);
    });

    it('should reject non-string values', async () => {
      const errors = await service.validateField(textField, 123);

      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('INVALID_TYPE');
      expect(errors[0].message).toContain('must be a string');
    });
  });

  describe('validateField - NUMBER type', () => {
    const numberField: DynamicField = {
      id: 'field-1',
      fieldKey: 'age',
      name: 'Age',
      dataType: FieldDataType.NUMBER,
      fieldOrder: 1,
      isMandatory: false,
      isReadOnly: false,
      validationRules: [],
      dropdownOptions: [],
    };

    it('should accept number values', async () => {
      const errors = await service.validateField(numberField, 25);

      expect(errors).toHaveLength(0);
    });

    it('should accept numeric string values', async () => {
      const errors = await service.validateField(numberField, '25');

      expect(errors).toHaveLength(0);
    });

    it('should reject non-numeric values', async () => {
      const errors = await service.validateField(numberField, 'not a number');

      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('INVALID_TYPE');
      expect(errors[0].message).toContain('must be a number');
    });
  });

  describe('validateField - EMAIL type', () => {
    const emailField: DynamicField = {
      id: 'field-1',
      fieldKey: 'email',
      name: 'Email',
      dataType: FieldDataType.EMAIL,
      fieldOrder: 1,
      isMandatory: false,
      isReadOnly: false,
      validationRules: [],
      dropdownOptions: [],
    };

    it('should accept valid email addresses', async () => {
      const validEmails = [
        'test@example.com',
        'user.name@example.co.uk',
        'user+tag@example.com',
      ];

      for (const email of validEmails) {
        const errors = await service.validateField(emailField, email);
        expect(errors).toHaveLength(0);
      }
    });

    it('should reject invalid email addresses', async () => {
      const invalidEmails = ['invalid', 'invalid@', '@example.com', 'invalid@.com'];

      for (const email of invalidEmails) {
        const errors = await service.validateField(emailField, email);
        expect(errors).toHaveLength(1);
        expect(errors[0].code).toBe('INVALID_EMAIL');
      }
    });
  });

  describe('validateField - URL type', () => {
    const urlField: DynamicField = {
      id: 'field-1',
      fieldKey: 'website',
      name: 'Website',
      dataType: FieldDataType.URL,
      fieldOrder: 1,
      isMandatory: false,
      isReadOnly: false,
      validationRules: [],
      dropdownOptions: [],
    };

    it('should accept valid URLs', async () => {
      const validUrls = [
        'https://example.com',
        'http://www.example.com',
        'https://example.com/path?query=value',
      ];

      for (const url of validUrls) {
        const errors = await service.validateField(urlField, url);
        expect(errors).toHaveLength(0);
      }
    });

    it('should reject clearly invalid URL format', async () => {
      const errors = await service.validateField(urlField, 'not a valid url at all');

      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('INVALID_URL');
    });
  });

  describe('validateField - DATE type', () => {
    const dateField: DynamicField = {
      id: 'field-1',
      fieldKey: 'birthDate',
      name: 'Birth Date',
      dataType: FieldDataType.DATE,
      fieldOrder: 1,
      isMandatory: false,
      isReadOnly: false,
      validationRules: [],
      dropdownOptions: [],
    };

    it('should accept Date objects', async () => {
      const errors = await service.validateField(dateField, new Date());

      expect(errors).toHaveLength(0);
    });

    it('should accept valid date strings', async () => {
      const errors = await service.validateField(dateField, '2024-01-15');

      expect(errors).toHaveLength(0);
    });

    it('should accept timestamps', async () => {
      const errors = await service.validateField(dateField, Date.now());

      expect(errors).toHaveLength(0);
    });

    it('should reject invalid dates', async () => {
      const errors = await service.validateField(dateField, 'not a date');

      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('INVALID_DATE');
    });
  });

  describe('validateField - BOOLEAN type', () => {
    const booleanField: DynamicField = {
      id: 'field-1',
      fieldKey: 'active',
      name: 'Active',
      dataType: FieldDataType.BOOLEAN,
      fieldOrder: 1,
      isMandatory: false,
      isReadOnly: false,
      validationRules: [],
      dropdownOptions: [],
    };

    it('should accept boolean true', async () => {
      const errors = await service.validateField(booleanField, true);

      expect(errors).toHaveLength(0);
    });

    it('should accept boolean false', async () => {
      const errors = await service.validateField(booleanField, false);

      expect(errors).toHaveLength(0);
    });

    it('should reject non-boolean values', async () => {
      const errors = await service.validateField(booleanField, 'true');

      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('INVALID_TYPE');
    });
  });

  describe('validateField - SINGLE_SELECT type', () => {
    const singleSelectField: DynamicField = {
      id: 'field-1',
      fieldKey: 'status',
      name: 'Status',
      dataType: FieldDataType.SINGLE_SELECT,
      fieldOrder: 1,
      isMandatory: false,
      isReadOnly: false,
      validationRules: [],
      dropdownOptions: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ],
    };

    it('should accept valid option value', async () => {
      const errors = await service.validateField(singleSelectField, 'active');

      expect(errors).toHaveLength(0);
    });

    it('should reject invalid option value', async () => {
      const errors = await service.validateField(singleSelectField, 'invalid');

      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('INVALID_OPTION');
      expect(errors[0].message).toContain('must be one of');
    });
  });

  describe('validateField - MULTI_SELECT type', () => {
    const multiSelectField: DynamicField = {
      id: 'field-1',
      fieldKey: 'tags',
      name: 'Tags',
      dataType: FieldDataType.MULTI_SELECT,
      fieldOrder: 1,
      isMandatory: false,
      isReadOnly: false,
      validationRules: [],
      dropdownOptions: [
        { label: 'Tag 1', value: 'tag1' },
        { label: 'Tag 2', value: 'tag2' },
        { label: 'Tag 3', value: 'tag3' },
      ],
    };

    it('should accept array of valid options', async () => {
      const errors = await service.validateField(multiSelectField, ['tag1', 'tag2']);

      expect(errors).toHaveLength(0);
    });

    it('should accept empty array', async () => {
      const errors = await service.validateField(multiSelectField, []);

      expect(errors).toHaveLength(0);
    });

    it('should reject non-array values', async () => {
      const errors = await service.validateField(multiSelectField, 'tag1');

      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('INVALID_TYPE');
      expect(errors[0].message).toContain('must be an array');
    });

    it('should reject array with invalid options', async () => {
      const errors = await service.validateField(multiSelectField, ['tag1', 'invalid']);

      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('INVALID_OPTION');
      expect(errors[0].message).toContain('contains invalid option: invalid');
    });
  });

  describe('validation rules - MIN_LENGTH', () => {
    const fieldWithMinLength: DynamicField = {
      id: 'field-1',
      fieldKey: 'username',
      name: 'Username',
      dataType: FieldDataType.TEXT,
      fieldOrder: 1,
      isMandatory: false,
      isReadOnly: false,
      validationRules: [
        {
          ruleType: ValidationRuleType.MIN_LENGTH,
          ruleValue: '3',
          errorMessage: 'Username must be at least 3 characters',
        },
      ],
      dropdownOptions: [],
    };

    it('should accept value meeting minimum length', async () => {
      const errors = await service.validateField(fieldWithMinLength, 'abc');

      expect(errors).toHaveLength(0);
    });

    it('should accept value exceeding minimum length', async () => {
      const errors = await service.validateField(fieldWithMinLength, 'abcdef');

      expect(errors).toHaveLength(0);
    });

    it('should reject value below minimum length', async () => {
      const errors = await service.validateField(fieldWithMinLength, 'ab');

      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('MIN_LENGTH');
      expect(errors[0].message).toBe('Username must be at least 3 characters');
    });
  });

  describe('validation rules - MAX_LENGTH', () => {
    const fieldWithMaxLength: DynamicField = {
      id: 'field-1',
      fieldKey: 'bio',
      name: 'Bio',
      dataType: FieldDataType.TEXTAREA,
      fieldOrder: 1,
      isMandatory: false,
      isReadOnly: false,
      validationRules: [
        {
          ruleType: ValidationRuleType.MAX_LENGTH,
          ruleValue: '10',
          errorMessage: 'Bio must not exceed 10 characters',
        },
      ],
      dropdownOptions: [],
    };

    it('should accept value meeting maximum length', async () => {
      const errors = await service.validateField(fieldWithMaxLength, '1234567890');

      expect(errors).toHaveLength(0);
    });

    it('should reject value exceeding maximum length', async () => {
      const errors = await service.validateField(fieldWithMaxLength, '12345678901');

      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('MAX_LENGTH');
      expect(errors[0].message).toBe('Bio must not exceed 10 characters');
    });
  });

  describe('validation rules - MIN_VALUE', () => {
    const fieldWithMinValue: DynamicField = {
      id: 'field-1',
      fieldKey: 'age',
      name: 'Age',
      dataType: FieldDataType.NUMBER,
      fieldOrder: 1,
      isMandatory: false,
      isReadOnly: false,
      validationRules: [
        {
          ruleType: ValidationRuleType.MIN_VALUE,
          ruleValue: '18',
          errorMessage: 'Age must be at least 18',
        },
      ],
      dropdownOptions: [],
    };

    it('should accept value meeting minimum', async () => {
      const errors = await service.validateField(fieldWithMinValue, 18);

      expect(errors).toHaveLength(0);
    });

    it('should accept value exceeding minimum', async () => {
      const errors = await service.validateField(fieldWithMinValue, 25);

      expect(errors).toHaveLength(0);
    });

    it('should reject value below minimum', async () => {
      const errors = await service.validateField(fieldWithMinValue, 17);

      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('MIN_VALUE');
      expect(errors[0].message).toBe('Age must be at least 18');
    });
  });

  describe('validation rules - MAX_VALUE', () => {
    const fieldWithMaxValue: DynamicField = {
      id: 'field-1',
      fieldKey: 'score',
      name: 'Score',
      dataType: FieldDataType.NUMBER,
      fieldOrder: 1,
      isMandatory: false,
      isReadOnly: false,
      validationRules: [
        {
          ruleType: ValidationRuleType.MAX_VALUE,
          ruleValue: '100',
          errorMessage: 'Score must not exceed 100',
        },
      ],
      dropdownOptions: [],
    };

    it('should accept value meeting maximum', async () => {
      const errors = await service.validateField(fieldWithMaxValue, 100);

      expect(errors).toHaveLength(0);
    });

    it('should reject value exceeding maximum', async () => {
      const errors = await service.validateField(fieldWithMaxValue, 101);

      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('MAX_VALUE');
      expect(errors[0].message).toBe('Score must not exceed 100');
    });
  });

  describe('validation rules - REGEX', () => {
    const fieldWithRegex: DynamicField = {
      id: 'field-1',
      fieldKey: 'zipCode',
      name: 'Zip Code',
      dataType: FieldDataType.TEXT,
      fieldOrder: 1,
      isMandatory: false,
      isReadOnly: false,
      validationRules: [
        {
          ruleType: ValidationRuleType.REGEX,
          ruleValue: '^\\d{5}$',
          errorMessage: 'Zip code must be 5 digits',
        },
      ],
      dropdownOptions: [],
    };

    it('should accept value matching regex pattern', async () => {
      const errors = await service.validateField(fieldWithRegex, '12345');

      expect(errors).toHaveLength(0);
    });

    it('should reject value not matching regex pattern', async () => {
      const errors = await service.validateField(fieldWithRegex, '1234');

      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('REGEX');
      expect(errors[0].message).toBe('Zip code must be 5 digits');
    });

    it('should handle invalid regex pattern', async () => {
      const fieldWithInvalidRegex: DynamicField = {
        ...fieldWithRegex,
        validationRules: [
          {
            ruleType: ValidationRuleType.REGEX,
            ruleValue: '[invalid(regex',
            errorMessage: 'Custom error',
          },
        ],
      };

      const errors = await service.validateField(fieldWithInvalidRegex, 'test');

      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('INVALID_REGEX');
      expect(errors[0].message).toBe('Invalid regex pattern');
    });
  });

  describe('validation rules - CUSTOM', () => {
    const fieldWithCustomRule: DynamicField = {
      id: 'field-1',
      fieldKey: 'custom',
      name: 'Custom',
      dataType: FieldDataType.TEXT,
      fieldOrder: 1,
      isMandatory: false,
      isReadOnly: false,
      validationRules: [
        {
          ruleType: ValidationRuleType.CUSTOM,
          ruleValue: 'someCustomLogic',
          errorMessage: 'Custom validation failed',
        },
      ],
      dropdownOptions: [],
    };

    it('should not return errors for CUSTOM rule (not implemented)', async () => {
      const errors = await service.validateField(fieldWithCustomRule, 'anything');

      expect(errors).toHaveLength(0);
    });
  });

  describe('multiple validation rules', () => {
    const fieldWithMultipleRules: DynamicField = {
      id: 'field-1',
      fieldKey: 'username',
      name: 'Username',
      dataType: FieldDataType.TEXT,
      fieldOrder: 1,
      isMandatory: true,
      isReadOnly: false,
      validationRules: [
        {
          ruleType: ValidationRuleType.MIN_LENGTH,
          ruleValue: '3',
          errorMessage: 'Username must be at least 3 characters',
        },
        {
          ruleType: ValidationRuleType.MAX_LENGTH,
          ruleValue: '20',
          errorMessage: 'Username must not exceed 20 characters',
        },
        {
          ruleType: ValidationRuleType.REGEX,
          ruleValue: '^[a-zA-Z0-9_]+$',
          errorMessage: 'Username can only contain letters, numbers, and underscores',
        },
      ],
      dropdownOptions: [],
    };

    it('should pass all validation rules', async () => {
      const errors = await service.validateField(fieldWithMultipleRules, 'valid_user123');

      expect(errors).toHaveLength(0);
    });

    it('should return multiple errors when multiple rules fail', async () => {
      const errors = await service.validateField(fieldWithMultipleRules, 'ab');

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.code === 'MIN_LENGTH')).toBe(true);
    });

    it('should stop at type validation error', async () => {
      const errors = await service.validateField(fieldWithMultipleRules, 123);

      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('INVALID_TYPE');
      // Should not validate rules if type is wrong
    });
  });
});
