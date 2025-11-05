import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { FieldService } from './field.service';
import { PrismaService } from '../../database/prisma.service';
import { FieldDataType } from '../../../generated/prisma';
import { CreateFieldDto } from '../dto/create-data-object.dto';
import { UpdateFieldDto } from '../dto/update-field.dto';

describe('FieldService', () => {
  let service: FieldService;
  let prisma: jest.Mocked<PrismaService>;

  const mockDataObject = {
    id: 'obj-1',
    dataKey: 'test-object',
    name: 'Test Object',
    description: 'Test description',
    isActive: true,
  };

  const mockField = {
    id: 'field-1',
    dataObjectId: 'obj-1',
    fieldKey: 'testField',
    name: 'Test Field',
    dataType: FieldDataType.TEXT,
    fieldOrder: 1,
    description: 'Field description',
    isMandatory: true,
    isReadOnly: false,
    defaultValue: null,
    relatedDataObjectId: null,
    isActive: true,
    createdBy: 'user-1',
    updatedBy: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    validationRules: [
      {
        id: 'rule-1',
        fieldId: 'field-1',
        ruleType: 'MIN_LENGTH',
        ruleValue: '3',
        errorMessage: 'Minimum 3 characters',
      },
    ],
    dropdownOptions: [],
  };

  const mockVersion = {
    id: 'ver-1',
    dataObjectId: 'obj-1',
    version: 1,
    name: 'Test Object',
    description: 'Test description',
    schemaSnapshot: {},
    createdBy: 'user-1',
    createdAt: new Date(),
  };

  const mockPrismaService = {
    dataObject: {
      findUnique: jest.fn(),
    },
    dataField: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    dataObjectVersion: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    fieldValidationRule: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    fieldDropdownOption: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FieldService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<FieldService>(FieldService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addField', () => {
    const createFieldDto: CreateFieldDto = {
      name: 'New Field',
      fieldKey: 'newField',
      dataType: FieldDataType.TEXT,
      fieldOrder: 1,
      description: 'A new field',
      isMandatory: false,
      isReadOnly: false,
    };

    it('should add a new field with provided fieldKey', async () => {
      prisma.dataObject.findUnique.mockResolvedValue(mockDataObject as any);
      prisma.dataField.findUnique.mockResolvedValue(null); // No existing field

      prisma.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          dataField: {
            create: jest.fn().mockResolvedValue(mockField),
          },
          dataObject: {
            findUnique: jest.fn().mockResolvedValue({
              ...mockDataObject,
              fields: [mockField],
            }),
          },
          dataObjectVersion: {
            findFirst: jest.fn().mockResolvedValue(mockVersion),
            create: jest.fn().mockResolvedValue(mockVersion),
          },
        };
        return callback(txMock);
      });

      const result = await service.addField('obj-1', createFieldDto, 'user-1');

      expect(result).toBeDefined();
      expect(result.fieldKey).toBe('testField');
      expect(prisma.dataObject.findUnique).toHaveBeenCalledWith({
        where: { id: 'obj-1' },
      });
      expect(prisma.dataField.findUnique).toHaveBeenCalledWith({
        where: {
          dataObjectId_fieldKey: {
            dataObjectId: 'obj-1',
            fieldKey: 'newField',
          },
        },
      });
    });

    it('should generate fieldKey from name if not provided', async () => {
      const dtoWithoutKey: CreateFieldDto = {
        ...createFieldDto,
        fieldKey: undefined,
      };

      prisma.dataObject.findUnique.mockResolvedValue(mockDataObject as any);
      prisma.dataField.findUnique.mockResolvedValue(null);

      prisma.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          dataField: {
            create: jest.fn().mockResolvedValue({
              ...mockField,
              fieldKey: 'newField',
            }),
          },
          dataObject: {
            findUnique: jest.fn().mockResolvedValue({
              ...mockDataObject,
              fields: [mockField],
            }),
          },
          dataObjectVersion: {
            findFirst: jest.fn().mockResolvedValue(mockVersion),
            create: jest.fn().mockResolvedValue(mockVersion),
          },
        };
        return callback(txMock);
      });

      await service.addField('obj-1', dtoWithoutKey, 'user-1');

      // Should be called with generated key
      expect(prisma.dataField.findUnique).toHaveBeenCalledWith({
        where: {
          dataObjectId_fieldKey: {
            dataObjectId: 'obj-1',
            fieldKey: 'newField',
          },
        },
      });
    });

    it('should throw NotFoundException when data object does not exist', async () => {
      prisma.dataObject.findUnique.mockResolvedValue(null);

      await expect(service.addField('non-existent', createFieldDto, 'user-1')).rejects.toThrow(
        NotFoundException
      );
      await expect(service.addField('non-existent', createFieldDto, 'user-1')).rejects.toThrow(
        'Data object with ID non-existent not found'
      );
    });

    it('should throw ConflictException when fieldKey already exists', async () => {
      prisma.dataObject.findUnique.mockResolvedValue(mockDataObject as any);
      prisma.dataField.findUnique.mockResolvedValue(mockField as any); // Existing field

      await expect(service.addField('obj-1', createFieldDto, 'user-1')).rejects.toThrow(
        ConflictException
      );
      await expect(service.addField('obj-1', createFieldDto, 'user-1')).rejects.toThrow(
        "Field with key 'newField' already exists for this data object"
      );
    });

    it('should create field with validation rules', async () => {
      const dtoWithRules: CreateFieldDto = {
        ...createFieldDto,
        validationRules: [
          {
            ruleType: 'MIN_LENGTH',
            ruleValue: '5',
            errorMessage: 'Minimum 5 characters',
          },
        ],
      };

      prisma.dataObject.findUnique.mockResolvedValue(mockDataObject as any);
      prisma.dataField.findUnique.mockResolvedValue(null);

      let capturedFieldData: any;
      prisma.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          dataField: {
            create: jest.fn().mockImplementation((args) => {
              capturedFieldData = args.data;
              return Promise.resolve(mockField);
            }),
          },
          dataObject: {
            findUnique: jest.fn().mockResolvedValue({
              ...mockDataObject,
              fields: [mockField],
            }),
          },
          dataObjectVersion: {
            findFirst: jest.fn().mockResolvedValue(mockVersion),
            create: jest.fn().mockResolvedValue(mockVersion),
          },
        };
        return callback(txMock);
      });

      await service.addField('obj-1', dtoWithRules, 'user-1');

      expect(capturedFieldData.validationRules).toBeDefined();
      expect(capturedFieldData.validationRules.create).toHaveLength(1);
      expect(capturedFieldData.validationRules.create[0].ruleType).toBe('MIN_LENGTH');
    });

    it('should create field with dropdown options', async () => {
      const dtoWithOptions: CreateFieldDto = {
        ...createFieldDto,
        dropdownOptions: [
          { label: 'Option 1', value: 'opt1', orderIndex: 1 },
          { label: 'Option 2', value: 'opt2', orderIndex: 2 },
        ],
      };

      prisma.dataObject.findUnique.mockResolvedValue(mockDataObject as any);
      prisma.dataField.findUnique.mockResolvedValue(null);

      let capturedFieldData: any;
      prisma.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          dataField: {
            create: jest.fn().mockImplementation((args) => {
              capturedFieldData = args.data;
              return Promise.resolve(mockField);
            }),
          },
          dataObject: {
            findUnique: jest.fn().mockResolvedValue({
              ...mockDataObject,
              fields: [mockField],
            }),
          },
          dataObjectVersion: {
            findFirst: jest.fn().mockResolvedValue(mockVersion),
            create: jest.fn().mockResolvedValue(mockVersion),
          },
        };
        return callback(txMock);
      });

      await service.addField('obj-1', dtoWithOptions, 'user-1');

      expect(capturedFieldData.dropdownOptions).toBeDefined();
      expect(capturedFieldData.dropdownOptions.create).toHaveLength(2);
      expect(capturedFieldData.dropdownOptions.create[0].label).toBe('Option 1');
    });
  });

  describe('updateField', () => {
    const updateFieldDto: UpdateFieldDto = {
      name: 'Updated Field',
      dataType: FieldDataType.NUMBER,
      fieldOrder: 2,
      description: 'Updated description',
      isMandatory: true,
      isReadOnly: true,
    };

    it('should update an existing field', async () => {
      prisma.dataField.findFirst.mockResolvedValue(mockField as any);

      prisma.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          dataField: {
            update: jest.fn().mockResolvedValue({
              ...mockField,
              ...updateFieldDto,
            }),
            findUnique: jest.fn().mockResolvedValue({
              ...mockField,
              ...updateFieldDto,
            }),
          },
          dataObject: {
            findUnique: jest.fn().mockResolvedValue({
              ...mockDataObject,
              fields: [mockField],
            }),
          },
          dataObjectVersion: {
            findFirst: jest.fn().mockResolvedValue(mockVersion),
            create: jest.fn().mockResolvedValue(mockVersion),
          },
        };
        return callback(txMock);
      });

      const result = await service.updateField('obj-1', 'field-1', updateFieldDto, 'user-1');

      expect(result).toBeDefined();
      expect(result.name).toBe('Updated Field');
      expect(prisma.dataField.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'field-1',
          dataObjectId: 'obj-1',
        },
      });
    });

    it('should throw NotFoundException when field does not exist', async () => {
      prisma.dataField.findFirst.mockResolvedValue(null);

      await expect(
        service.updateField('obj-1', 'non-existent', updateFieldDto, 'user-1')
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.updateField('obj-1', 'non-existent', updateFieldDto, 'user-1')
      ).rejects.toThrow('Field with ID non-existent not found for this data object');
    });

    it('should update validation rules when provided', async () => {
      const dtoWithRules: UpdateFieldDto = {
        ...updateFieldDto,
        validationRules: [
          {
            ruleType: 'MAX_LENGTH',
            ruleValue: '10',
            errorMessage: 'Maximum 10 characters',
          },
        ],
      };

      prisma.dataField.findFirst.mockResolvedValue(mockField as any);

      let deleteManyCalled = false;
      let createManyCalled = false;

      prisma.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          dataField: {
            update: jest.fn().mockResolvedValue(mockField),
            findUnique: jest.fn().mockResolvedValue(mockField),
          },
          fieldValidationRule: {
            deleteMany: jest.fn().mockImplementation(() => {
              deleteManyCalled = true;
              return Promise.resolve();
            }),
            createMany: jest.fn().mockImplementation(() => {
              createManyCalled = true;
              return Promise.resolve();
            }),
          },
          dataObject: {
            findUnique: jest.fn().mockResolvedValue({
              ...mockDataObject,
              fields: [mockField],
            }),
          },
          dataObjectVersion: {
            findFirst: jest.fn().mockResolvedValue(mockVersion),
            create: jest.fn().mockResolvedValue(mockVersion),
          },
        };
        return callback(txMock);
      });

      await service.updateField('obj-1', 'field-1', dtoWithRules, 'user-1');

      expect(deleteManyCalled).toBe(true);
      expect(createManyCalled).toBe(true);
    });

    it('should update dropdown options when provided', async () => {
      const dtoWithOptions: UpdateFieldDto = {
        ...updateFieldDto,
        dropdownOptions: [
          { label: 'New Option', value: 'new', orderIndex: 1 },
        ],
      };

      prisma.dataField.findFirst.mockResolvedValue(mockField as any);

      let deleteManyCalled = false;
      let createManyCalled = false;

      prisma.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          dataField: {
            update: jest.fn().mockResolvedValue(mockField),
            findUnique: jest.fn().mockResolvedValue(mockField),
          },
          fieldDropdownOption: {
            deleteMany: jest.fn().mockImplementation(() => {
              deleteManyCalled = true;
              return Promise.resolve();
            }),
            createMany: jest.fn().mockImplementation(() => {
              createManyCalled = true;
              return Promise.resolve();
            }),
          },
          dataObject: {
            findUnique: jest.fn().mockResolvedValue({
              ...mockDataObject,
              fields: [mockField],
            }),
          },
          dataObjectVersion: {
            findFirst: jest.fn().mockResolvedValue(mockVersion),
            create: jest.fn().mockResolvedValue(mockVersion),
          },
        };
        return callback(txMock);
      });

      await service.updateField('obj-1', 'field-1', dtoWithOptions, 'user-1');

      expect(deleteManyCalled).toBe(true);
      expect(createManyCalled).toBe(true);
    });

    it('should not update validation rules when not provided', async () => {
      prisma.dataField.findFirst.mockResolvedValue(mockField as any);

      let deleteManyCalled = false;

      prisma.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          dataField: {
            update: jest.fn().mockResolvedValue(mockField),
            findUnique: jest.fn().mockResolvedValue(mockField),
          },
          fieldValidationRule: {
            deleteMany: jest.fn().mockImplementation(() => {
              deleteManyCalled = true;
              return Promise.resolve();
            }),
          },
          dataObject: {
            findUnique: jest.fn().mockResolvedValue({
              ...mockDataObject,
              fields: [mockField],
            }),
          },
          dataObjectVersion: {
            findFirst: jest.fn().mockResolvedValue(mockVersion),
            create: jest.fn().mockResolvedValue(mockVersion),
          },
        };
        return callback(txMock);
      });

      await service.updateField('obj-1', 'field-1', updateFieldDto, 'user-1');

      expect(deleteManyCalled).toBe(false);
    });
  });

  describe('deleteField', () => {
    it('should soft delete a field', async () => {
      prisma.dataField.findFirst.mockResolvedValue(mockField as any);

      let updatedData: any;
      prisma.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          dataField: {
            update: jest.fn().mockImplementation((args) => {
              updatedData = args.data;
              return Promise.resolve({ ...mockField, isActive: false });
            }),
          },
          dataObject: {
            findUnique: jest.fn().mockResolvedValue({
              ...mockDataObject,
              fields: [mockField],
            }),
          },
          dataObjectVersion: {
            findFirst: jest.fn().mockResolvedValue(mockVersion),
            create: jest.fn().mockResolvedValue(mockVersion),
          },
        };
        return callback(txMock);
      });

      await service.deleteField('obj-1', 'field-1', 'user-1');

      expect(updatedData.isActive).toBe(false);
      expect(updatedData.updatedBy).toBe('user-1');
    });

    it('should throw NotFoundException when field does not exist', async () => {
      prisma.dataField.findFirst.mockResolvedValue(null);

      await expect(service.deleteField('obj-1', 'non-existent', 'user-1')).rejects.toThrow(
        NotFoundException
      );
      await expect(service.deleteField('obj-1', 'non-existent', 'user-1')).rejects.toThrow(
        'Field with ID non-existent not found for this data object'
      );
    });
  });

  describe('reorderFields', () => {
    it('should update field order for multiple fields', async () => {
      const fieldOrders = [
        { fieldId: 'field-1', order: 2 },
        { fieldId: 'field-2', order: 1 },
      ];

      const updatedOrders: any[] = [];
      prisma.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          dataField: {
            update: jest.fn().mockImplementation((args) => {
              updatedOrders.push({
                fieldId: args.where.id,
                order: args.data.fieldOrder,
              });
              return Promise.resolve(mockField);
            }),
          },
          dataObject: {
            findUnique: jest.fn().mockResolvedValue({
              ...mockDataObject,
              fields: [mockField],
            }),
          },
          dataObjectVersion: {
            findFirst: jest.fn().mockResolvedValue(mockVersion),
            create: jest.fn().mockResolvedValue(mockVersion),
          },
        };
        return callback(txMock);
      });

      await service.reorderFields('obj-1', fieldOrders, 'user-1');

      expect(updatedOrders).toHaveLength(2);
      expect(updatedOrders[0]).toEqual({ fieldId: 'field-1', order: 2 });
      expect(updatedOrders[1]).toEqual({ fieldId: 'field-2', order: 1 });
    });

    it('should handle empty field orders array', async () => {
      let createVersionCalled = false;
      prisma.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          dataField: {
            update: jest.fn(),
          },
          dataObject: {
            findUnique: jest.fn().mockResolvedValue({
              ...mockDataObject,
              fields: [mockField],
            }),
          },
          dataObjectVersion: {
            findFirst: jest.fn().mockResolvedValue(mockVersion),
            create: jest.fn().mockImplementation(() => {
              createVersionCalled = true;
              return Promise.resolve(mockVersion);
            }),
          },
        };
        return callback(txMock);
      });

      await service.reorderFields('obj-1', [], 'user-1');

      // Should still create version even with empty array
      expect(createVersionCalled).toBe(true);
    });
  });

  describe('generateFieldKey (private method)', () => {
    it('should convert "First Name" to "firstName"', async () => {
      // We need to test this through addField since it's private
      const dto: CreateFieldDto = {
        name: 'First Name',
        dataType: FieldDataType.TEXT,
        fieldOrder: 1,
        isMandatory: false,
        isReadOnly: false,
      };

      prisma.dataObject.findUnique.mockResolvedValue(mockDataObject as any);
      prisma.dataField.findUnique.mockResolvedValue(null);

      prisma.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          dataField: {
            create: jest.fn().mockResolvedValue(mockField),
          },
          dataObject: {
            findUnique: jest.fn().mockResolvedValue({
              ...mockDataObject,
              fields: [mockField],
            }),
          },
          dataObjectVersion: {
            findFirst: jest.fn().mockResolvedValue(mockVersion),
            create: jest.fn().mockResolvedValue(mockVersion),
          },
        };
        return callback(txMock);
      });

      await service.addField('obj-1', dto, 'user-1');

      // Should check for "firstName" key
      expect(prisma.dataField.findUnique).toHaveBeenCalledWith({
        where: {
          dataObjectId_fieldKey: {
            dataObjectId: 'obj-1',
            fieldKey: 'firstName',
          },
        },
      });
    });

    it('should convert "user-email-address" to "userEmailAddress"', async () => {
      const dto: CreateFieldDto = {
        name: 'user-email-address',
        dataType: FieldDataType.EMAIL,
        fieldOrder: 1,
        isMandatory: false,
        isReadOnly: false,
      };

      prisma.dataObject.findUnique.mockResolvedValue(mockDataObject as any);
      prisma.dataField.findUnique.mockResolvedValue(null);

      prisma.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          dataField: {
            create: jest.fn().mockResolvedValue(mockField),
          },
          dataObject: {
            findUnique: jest.fn().mockResolvedValue({
              ...mockDataObject,
              fields: [mockField],
            }),
          },
          dataObjectVersion: {
            findFirst: jest.fn().mockResolvedValue(mockVersion),
            create: jest.fn().mockResolvedValue(mockVersion),
          },
        };
        return callback(txMock);
      });

      await service.addField('obj-1', dto, 'user-1');

      expect(prisma.dataField.findUnique).toHaveBeenCalledWith({
        where: {
          dataObjectId_fieldKey: {
            dataObjectId: 'obj-1',
            fieldKey: 'userEmailAddress',
          },
        },
      });
    });
  });

  describe('createNewVersion (private method)', () => {
    it('should create a new version with incremented version number', async () => {
      prisma.dataField.findFirst.mockResolvedValue(mockField as any);

      let capturedVersionData: any;
      prisma.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          dataField: {
            update: jest.fn().mockResolvedValue(mockField),
          },
          dataObject: {
            findUnique: jest.fn().mockResolvedValue({
              ...mockDataObject,
              fields: [mockField],
            }),
          },
          dataObjectVersion: {
            findFirst: jest.fn().mockResolvedValue({ ...mockVersion, version: 3 }),
            create: jest.fn().mockImplementation((args) => {
              capturedVersionData = args.data;
              return Promise.resolve({ ...mockVersion, version: 4 });
            }),
          },
        };
        return callback(txMock);
      });

      await service.deleteField('obj-1', 'field-1', 'user-1');

      expect(capturedVersionData.version).toBe(4);
      expect(capturedVersionData.createdBy).toBe('user-1');
    });

    it('should use version 1 when no previous version exists', async () => {
      prisma.dataField.findFirst.mockResolvedValue(mockField as any);

      let capturedVersionData: any;
      prisma.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          dataField: {
            update: jest.fn().mockResolvedValue(mockField),
          },
          dataObject: {
            findUnique: jest.fn().mockResolvedValue({
              ...mockDataObject,
              fields: [mockField],
            }),
          },
          dataObjectVersion: {
            findFirst: jest.fn().mockResolvedValue(null), // No previous version
            create: jest.fn().mockImplementation((args) => {
              capturedVersionData = args.data;
              return Promise.resolve({ ...mockVersion, version: 1 });
            }),
          },
        };
        return callback(txMock);
      });

      await service.deleteField('obj-1', 'field-1', 'user-1');

      expect(capturedVersionData.version).toBe(1);
    });

    it('should create schema snapshot with all field details', async () => {
      prisma.dataField.findFirst.mockResolvedValue(mockField as any);

      let capturedVersionData: any;
      prisma.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          dataField: {
            update: jest.fn().mockResolvedValue(mockField),
          },
          dataObject: {
            findUnique: jest.fn().mockResolvedValue({
              ...mockDataObject,
              fields: [mockField],
            }),
          },
          dataObjectVersion: {
            findFirst: jest.fn().mockResolvedValue(mockVersion),
            create: jest.fn().mockImplementation((args) => {
              capturedVersionData = args.data;
              return Promise.resolve(mockVersion);
            }),
          },
        };
        return callback(txMock);
      });

      await service.deleteField('obj-1', 'field-1', 'user-1');

      expect(capturedVersionData.schemaSnapshot).toBeDefined();
      expect(capturedVersionData.schemaSnapshot.fields).toHaveLength(1);
      expect(capturedVersionData.schemaSnapshot.fields[0].fieldKey).toBe('testField');
    });
  });
});
