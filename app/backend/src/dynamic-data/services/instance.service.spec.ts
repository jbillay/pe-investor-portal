import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InstanceService } from './instance.service';
import { PrismaService } from '../../database/prisma.service';
import { SchemaService } from './schema.service';
import { Decimal } from '../../../generated/prisma/runtime/library';

// Mock the Prisma enums
jest.mock('../../../generated/prisma', () => {
  const actual = jest.requireActual('../../../generated/prisma');
  return {
    ...actual,
    FieldDataType: actual.FieldDataType || {
      TEXT: 'TEXT',
      TEXTAREA: 'TEXTAREA',
      EMAIL: 'EMAIL',
      URL: 'URL',
      NUMBER: 'NUMBER',
      CURRENCY: 'CURRENCY',
      DATE: 'DATE',
      DATETIME: 'DATETIME',
      BOOLEAN: 'BOOLEAN',
      SINGLE_SELECT: 'SINGLE_SELECT',
      MULTI_SELECT: 'MULTI_SELECT',
      FILE: 'FILE',
      RICH_TEXT: 'RICH_TEXT',
      RELATIONSHIP: 'RELATIONSHIP',
    },
    ChangeType: {
      CREATE: 'CREATE',
      UPDATE: 'UPDATE',
      DELETE: 'DELETE',
    },
  };
});

import { FieldDataType, ChangeType } from '../../../generated/prisma';

describe('InstanceService', () => {
  let service: InstanceService;
  let prismaService: jest.Mocked<PrismaService>;
  let schemaService: jest.Mocked<SchemaService>;

  const mockSchema = {
    dataObjectId: 'data-obj-123',
    version: 1,
    fields: [
      {
        id: 'field-1',
        fieldKey: 'name',
        dataType: FieldDataType.TEXT,
      },
      {
        id: 'field-2',
        fieldKey: 'age',
        dataType: FieldDataType.NUMBER,
      },
      {
        id: 'field-3',
        fieldKey: 'email',
        dataType: FieldDataType.EMAIL,
      },
      {
        id: 'field-4',
        fieldKey: 'active',
        dataType: FieldDataType.BOOLEAN,
      },
      {
        id: 'field-5',
        fieldKey: 'bio',
        dataType: FieldDataType.TEXTAREA,
      },
      {
        id: 'field-6',
        fieldKey: 'website',
        dataType: FieldDataType.URL,
      },
      {
        id: 'field-7',
        fieldKey: 'birthDate',
        dataType: FieldDataType.DATE,
      },
      {
        id: 'field-8',
        fieldKey: 'registeredAt',
        dataType: FieldDataType.DATETIME,
      },
      {
        id: 'field-9',
        fieldKey: 'salary',
        dataType: FieldDataType.CURRENCY,
      },
      {
        id: 'field-10',
        fieldKey: 'role',
        dataType: FieldDataType.SINGLE_SELECT,
      },
      {
        id: 'field-11',
        fieldKey: 'tags',
        dataType: FieldDataType.MULTI_SELECT,
      },
      {
        id: 'field-12',
        fieldKey: 'avatar',
        dataType: FieldDataType.FILE,
      },
      {
        id: 'field-13',
        fieldKey: 'description',
        dataType: FieldDataType.RICH_TEXT,
      },
      {
        id: 'field-14',
        fieldKey: 'manager',
        dataType: FieldDataType.RELATIONSHIP,
      },
    ],
  };

  const mockInstance = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    dataObjectId: 'data-obj-123',
    versionNumber: 1,
    isActive: true,
    createdBy: 'user-123',
    updatedBy: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    fieldValues: [
      {
        id: 'fv-1',
        instanceId: '550e8400-e29b-41d4-a716-446655440000',
        fieldId: 'field-1',
        textValue: 'John Doe',
        numberValue: null,
        dateValue: null,
        booleanValue: null,
        jsonValue: null,
        field: { id: 'field-1', fieldKey: 'name', dataType: FieldDataType.TEXT },
      },
      {
        id: 'fv-2',
        instanceId: '550e8400-e29b-41d4-a716-446655440000',
        fieldId: 'field-2',
        textValue: null,
        numberValue: new Decimal(30),
        dateValue: null,
        booleanValue: null,
        jsonValue: null,
        field: { id: 'field-2', fieldKey: 'age', dataType: FieldDataType.NUMBER },
      },
    ],
  };

  beforeEach(async () => {
    const mockPrismaService = {
      $transaction: jest.fn(),
      dataObjectInstance: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      instanceFieldValue: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      instanceChangeLog: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const mockSchemaService = {
      getSchema: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InstanceService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: SchemaService, useValue: mockSchemaService },
      ],
    }).compile();

    service = module.get<InstanceService>(InstanceService);
    prismaService = module.get(PrismaService) as any;
    schemaService = module.get(SchemaService) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new instance with field values', async () => {
      const values = {
        name: 'John Doe',
        age: 30,
        email: 'john@example.com',
        active: true,
      };

      schemaService.getSchema.mockResolvedValue(mockSchema as any);

      const createdInstance = { ...mockInstance, fieldValues: [] };
      const mockTx = {
        dataObjectInstance: {
          create: jest.fn().mockResolvedValue(createdInstance),
          findFirst: jest.fn().mockResolvedValue({
            ...createdInstance,
            fieldValues: mockInstance.fieldValues,
          }),
        },
        instanceFieldValue: {
          create: jest.fn().mockResolvedValue({}),
        },
        instanceChangeLog: {
          create: jest.fn().mockResolvedValue({}),
        },
      };

      prismaService.$transaction.mockImplementation(async (callback: any) => {
        return await callback(mockTx);
      });

      const result = await service.create('test-data', values, 'user-123');

      expect(result).toBeDefined();
      expect(mockTx.dataObjectInstance.create).toHaveBeenCalledWith({
        data: {
          dataObjectId: 'data-obj-123',
          versionNumber: 1,
          createdBy: 'user-123',
          updatedBy: 'user-123',
        },
      });
      expect(mockTx.instanceFieldValue.create).toHaveBeenCalledTimes(4);
      expect(mockTx.instanceChangeLog.create).toHaveBeenCalled();
    });

    it('should skip null and undefined values during creation', async () => {
      const values = {
        name: 'John Doe',
        age: null,
        email: undefined,
      };

      schemaService.getSchema.mockResolvedValue(mockSchema as any);

      const createdInstance = { ...mockInstance, fieldValues: [] };
      const mockTx = {
        dataObjectInstance: {
          create: jest.fn().mockResolvedValue(createdInstance),
          findFirst: jest.fn().mockResolvedValue({
            ...createdInstance,
            fieldValues: [],
          }),
        },
        instanceFieldValue: {
          create: jest.fn().mockResolvedValue({}),
        },
        instanceChangeLog: {
          create: jest.fn().mockResolvedValue({}),
        },
      };

      prismaService.$transaction.mockImplementation(async (callback: any) => {
        return await callback(mockTx);
      });

      await service.create('test-data', values, 'user-123');

      // Only 'name' should be created since age is null and email is undefined
      expect(mockTx.instanceFieldValue.create).toHaveBeenCalledTimes(1);
    });

    it('should throw BadRequestException for invalid UUID in created instance', async () => {
      const values = { name: 'Test' };

      schemaService.getSchema.mockResolvedValue(mockSchema as any);

      const invalidInstance = { ...mockInstance, id: 'invalid-uuid' };
      const mockTx = {
        dataObjectInstance: {
          create: jest.fn().mockResolvedValue(invalidInstance),
        },
        instanceFieldValue: {
          create: jest.fn(),
        },
        instanceChangeLog: {
          create: jest.fn(),
        },
      };

      prismaService.$transaction.mockImplementation(async (callback: any) => {
        return await callback(mockTx);
      });

      await expect(service.create('test-data', values, 'user-123')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle all field data types correctly', async () => {
      const values = {
        name: 'John Doe',
        age: 30,
        email: 'john@example.com',
        active: true,
        bio: 'Long bio text',
        website: 'https://example.com',
        birthDate: '1990-01-01',
        registeredAt: '2024-01-01T10:00:00Z',
        salary: 50000,
        role: 'admin',
        tags: ['tag1', 'tag2'],
        avatar: { url: 'https://example.com/avatar.jpg' },
        description: '<p>Rich text</p>',
        manager: 'manager-id-123',
      };

      schemaService.getSchema.mockResolvedValue(mockSchema as any);

      const createdInstance = { ...mockInstance, fieldValues: [] };
      const mockTx = {
        dataObjectInstance: {
          create: jest.fn().mockResolvedValue(createdInstance),
          findFirst: jest.fn().mockResolvedValue({
            ...createdInstance,
            fieldValues: [],
          }),
        },
        instanceFieldValue: {
          create: jest.fn().mockResolvedValue({}),
        },
        instanceChangeLog: {
          create: jest.fn().mockResolvedValue({}),
        },
      };

      prismaService.$transaction.mockImplementation(async (callback: any) => {
        return await callback(mockTx);
      });

      await service.create('test-data', values, 'user-123');

      expect(mockTx.instanceFieldValue.create).toHaveBeenCalledTimes(14);
    });
  });

  describe('findAll', () => {
    it('should return paginated instances', async () => {
      schemaService.getSchema.mockResolvedValue(mockSchema as any);
      (prismaService.dataObjectInstance.count as jest.Mock).mockResolvedValue(1);
      (prismaService.dataObjectInstance.findMany as jest.Mock).mockResolvedValue([
        mockInstance,
      ]);

      const result = await service.findAll('test-data', { page: 1, limit: 20 });

      expect(result.items).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
      expect(result.pagination.totalPages).toBe(1);
      expect(result.pagination.hasNext).toBe(false);
      expect(result.pagination.hasPrev).toBe(false);
    });

    it('should apply search filter for text fields', async () => {
      schemaService.getSchema.mockResolvedValue(mockSchema as any);
      (prismaService.dataObjectInstance.count as jest.Mock).mockResolvedValue(0);
      (prismaService.dataObjectInstance.findMany as jest.Mock).mockResolvedValue([]);

      await service.findAll('test-data', { search: 'test' });

      expect(prismaService.dataObjectInstance.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            fieldValues: {
              some: {
                OR: expect.arrayContaining([
                  expect.objectContaining({
                    textValue: { contains: 'test', mode: 'insensitive' },
                  }),
                ]),
              },
            },
          }),
        }),
      );
    });

    it('should calculate pagination correctly', async () => {
      schemaService.getSchema.mockResolvedValue(mockSchema as any);
      (prismaService.dataObjectInstance.count as jest.Mock).mockResolvedValue(50);
      (prismaService.dataObjectInstance.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.findAll('test-data', { page: 2, limit: 20 });

      expect(result.pagination.total).toBe(50);
      expect(result.pagination.totalPages).toBe(3);
      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.hasPrev).toBe(true);
      expect(prismaService.dataObjectInstance.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 20,
        }),
      );
    });

    it('should use default pagination values', async () => {
      schemaService.getSchema.mockResolvedValue(mockSchema as any);
      (prismaService.dataObjectInstance.count as jest.Mock).mockResolvedValue(0);
      (prismaService.dataObjectInstance.findMany as jest.Mock).mockResolvedValue([]);

      await service.findAll('test-data', {});

      expect(prismaService.dataObjectInstance.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
          orderBy: { createdAt: 'asc' },
        }),
      );
    });

    it('should apply sortOrder parameter', async () => {
      schemaService.getSchema.mockResolvedValue(mockSchema as any);
      (prismaService.dataObjectInstance.count as jest.Mock).mockResolvedValue(0);
      (prismaService.dataObjectInstance.findMany as jest.Mock).mockResolvedValue([]);

      await service.findAll('test-data', { sortOrder: 'desc' });

      expect(prismaService.dataObjectInstance.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return instance by ID', async () => {
      schemaService.getSchema.mockResolvedValue(mockSchema as any);
      (prismaService.dataObjectInstance.findFirst as jest.Mock).mockResolvedValue(
        mockInstance,
      );

      const result = await service.findOne(
        'test-data',
        '550e8400-e29b-41d4-a716-446655440000',
      );

      expect(result).toBeDefined();
      expect(result.id).toBe(mockInstance.id);
      expect(result.values).toBeDefined();
    });

    it('should throw BadRequestException for invalid UUID', async () => {
      await expect(service.findOne('test-data', 'invalid-uuid')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.findOne('test-data', 'invalid-uuid')).rejects.toThrow(
        'Invalid UUID format in instance lookup',
      );
    });

    it('should throw NotFoundException if instance not found', async () => {
      schemaService.getSchema.mockResolvedValue(mockSchema as any);
      (prismaService.dataObjectInstance.findFirst as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(
        service.findOne('test-data', '550e8400-e29b-41d4-a716-446655440000'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should work with transaction', async () => {
      schemaService.getSchema.mockResolvedValue(mockSchema as any);

      const mockTx = {
        dataObjectInstance: {
          findFirst: jest.fn().mockResolvedValue(mockInstance),
        },
      };

      const result = await service.findOne(
        'test-data',
        '550e8400-e29b-41d4-a716-446655440000',
        mockTx,
      );

      expect(result).toBeDefined();
      expect(mockTx.dataObjectInstance.findFirst).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update instance field values', async () => {
      const updatedValues = {
        name: 'Jane Doe',
        age: 35,
      };

      schemaService.getSchema.mockResolvedValue(mockSchema as any);

      const existingInstance = {
        ...mockInstance,
        values: {
          name: 'John Doe',
          age: 30,
        },
      };

      const mockTx = {
        dataObjectInstance: {
          update: jest.fn().mockResolvedValue(mockInstance),
          findFirst: jest.fn().mockResolvedValue({
            ...mockInstance,
            fieldValues: mockInstance.fieldValues,
          }),
        },
        instanceFieldValue: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'fv-1',
            instanceId: mockInstance.id,
            fieldId: 'field-1',
          }),
          update: jest.fn().mockResolvedValue({}),
          create: jest.fn().mockResolvedValue({}),
        },
        instanceChangeLog: {
          create: jest.fn().mockResolvedValue({}),
        },
      };

      // Mock findOne to return existing instance first, then updated
      jest.spyOn(service, 'findOne')
        .mockResolvedValueOnce(existingInstance as any);

      jest.spyOn(schemaService, 'getSchema')
        .mockResolvedValueOnce(mockSchema as any)
        .mockResolvedValueOnce(mockSchema as any);

      prismaService.$transaction.mockImplementation(async (callback: any) => {
        // Mock the second findOne call within transaction
        jest.spyOn(service, 'findOne').mockResolvedValueOnce({
          ...mockInstance,
          values: updatedValues,
        } as any);
        return await callback(mockTx);
      });

      const result = await service.update(
        'test-data',
        '550e8400-e29b-41d4-a716-446655440000',
        updatedValues,
        'user-456',
      );

      expect(result).toBeDefined();
      expect(mockTx.dataObjectInstance.update).toHaveBeenCalledWith({
        where: { id: '550e8400-e29b-41d4-a716-446655440000' },
        data: { updatedBy: 'user-456' },
      });
    });

    it('should create new field value if it does not exist', async () => {
      const updatedValues = {
        email: 'newemail@example.com',
      };

      schemaService.getSchema.mockResolvedValue(mockSchema as any);

      jest.spyOn(service, 'findOne')
        .mockResolvedValueOnce({
          ...mockInstance,
          values: {},
        } as any);

      const mockTx = {
        dataObjectInstance: {
          update: jest.fn().mockResolvedValue(mockInstance),
          findFirst: jest.fn().mockResolvedValue(mockInstance),
        },
        instanceFieldValue: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({}),
        },
        instanceChangeLog: {
          create: jest.fn().mockResolvedValue({}),
        },
      };

      prismaService.$transaction.mockImplementation(async (callback: any) => {
        jest.spyOn(service, 'findOne').mockResolvedValueOnce({
          ...mockInstance,
          values: updatedValues,
        } as any);
        return await callback(mockTx);
      });

      await service.update(
        'test-data',
        '550e8400-e29b-41d4-a716-446655440000',
        updatedValues,
        'user-456',
      );

      expect(mockTx.instanceFieldValue.create).toHaveBeenCalled();
    });

    it('should not log change if value unchanged', async () => {
      const unchangedValues = {
        name: 'John Doe',
      };

      schemaService.getSchema.mockResolvedValue(mockSchema as any);

      jest.spyOn(service, 'findOne')
        .mockResolvedValueOnce({
          ...mockInstance,
          values: unchangedValues,
        } as any);

      const mockTx = {
        dataObjectInstance: {
          update: jest.fn().mockResolvedValue(mockInstance),
          findFirst: jest.fn().mockResolvedValue(mockInstance),
        },
        instanceFieldValue: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'fv-1',
          }),
          update: jest.fn().mockResolvedValue({}),
        },
        instanceChangeLog: {
          create: jest.fn().mockResolvedValue({}),
        },
      };

      prismaService.$transaction.mockImplementation(async (callback: any) => {
        jest.spyOn(service, 'findOne').mockResolvedValueOnce({
          ...mockInstance,
          values: unchangedValues,
        } as any);
        return await callback(mockTx);
      });

      await service.update(
        'test-data',
        '550e8400-e29b-41d4-a716-446655440000',
        unchangedValues,
        'user-456',
      );

      // Should not create change log for unchanged values
      expect(mockTx.instanceChangeLog.create).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should soft delete an instance', async () => {
      schemaService.getSchema.mockResolvedValue(mockSchema as any);

      const mockTx = {
        dataObjectInstance: {
          findFirst: jest.fn().mockResolvedValue(mockInstance),
          update: jest.fn().mockResolvedValue({}),
        },
        instanceChangeLog: {
          create: jest.fn().mockResolvedValue({}),
        },
      };

      prismaService.$transaction.mockImplementation(async (callback: any) => {
        return await callback(mockTx);
      });

      await service.remove(
        'test-data',
        '550e8400-e29b-41d4-a716-446655440000',
        'user-456',
      );

      expect(mockTx.dataObjectInstance.update).toHaveBeenCalledWith({
        where: { id: '550e8400-e29b-41d4-a716-446655440000' },
        data: { isActive: false, updatedBy: 'user-456' },
      });
      expect(mockTx.instanceChangeLog.create).toHaveBeenCalledWith({
        data: {
          instanceId: '550e8400-e29b-41d4-a716-446655440000',
          changeType: ChangeType.DELETE,
          changedBy: 'user-456',
        },
      });
    });

    it('should throw BadRequestException for invalid UUID', async () => {
      await expect(
        service.remove('test-data', 'invalid-uuid', 'user-456'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.remove('test-data', 'invalid-uuid', 'user-456'),
      ).rejects.toThrow('Invalid UUID format in instance deletion');
    });

    it('should throw NotFoundException if instance not found', async () => {
      schemaService.getSchema.mockResolvedValue(mockSchema as any);

      const mockTx = {
        dataObjectInstance: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
      };

      prismaService.$transaction.mockImplementation(async (callback: any) => {
        return await callback(mockTx);
      });

      await expect(
        service.remove('test-data', '550e8400-e29b-41d4-a716-446655440000', 'user-456'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getHistory', () => {
    it('should return instance change history', async () => {
      schemaService.getSchema.mockResolvedValue(mockSchema as any);
      (prismaService.dataObjectInstance.findFirst as jest.Mock).mockResolvedValue(
        mockInstance,
      );

      const mockHistory = [
        {
          id: 'log-1',
          instanceId: '550e8400-e29b-41d4-a716-446655440000',
          changeType: 'CREATE',
          changedAt: new Date(),
        },
      ];
      (prismaService.instanceChangeLog.findMany as jest.Mock).mockResolvedValue(
        mockHistory,
      );

      const result = await service.getHistory(
        'test-data',
        '550e8400-e29b-41d4-a716-446655440000',
      );

      expect(result).toEqual(mockHistory);
      expect(prismaService.instanceChangeLog.findMany).toHaveBeenCalledWith({
        where: { instanceId: '550e8400-e29b-41d4-a716-446655440000' },
        orderBy: { changedAt: 'desc' },
      });
    });

    it('should throw NotFoundException if instance not found', async () => {
      schemaService.getSchema.mockResolvedValue(mockSchema as any);
      (prismaService.dataObjectInstance.findFirst as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(
        service.getHistory('test-data', '550e8400-e29b-41d4-a716-446655440000'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('helper methods - mapValueToStorage', () => {
    it('should map TEXT field correctly', () => {
      const result = (service as any).mapValueToStorage(FieldDataType.TEXT, 'test text');
      expect(result.textValue).toBe('test text');
      expect(result.numberValue).toBeNull();
      expect(result.dateValue).toBeNull();
      expect(result.booleanValue).toBeNull();
      expect(result.jsonValue).toBeNull();
    });

    it('should map TEXTAREA field correctly', () => {
      const result = (service as any).mapValueToStorage(FieldDataType.TEXTAREA, 'long text');
      expect(result.textValue).toBe('long text');
    });

    it('should map EMAIL field correctly', () => {
      const result = (service as any).mapValueToStorage(FieldDataType.EMAIL, 'test@example.com');
      expect(result.textValue).toBe('test@example.com');
    });

    it('should map URL field correctly', () => {
      const result = (service as any).mapValueToStorage(FieldDataType.URL, 'https://example.com');
      expect(result.textValue).toBe('https://example.com');
    });

    it('should map NUMBER field correctly', () => {
      const result = (service as any).mapValueToStorage(FieldDataType.NUMBER, 42);
      expect(result.numberValue).toBeInstanceOf(Decimal);
      expect(Number(result.numberValue)).toBe(42);
    });

    it('should handle null NUMBER value', () => {
      const result = (service as any).mapValueToStorage(FieldDataType.NUMBER, null);
      expect(result.numberValue).toBeNull();
    });

    it('should map CURRENCY field correctly', () => {
      const result = (service as any).mapValueToStorage(FieldDataType.CURRENCY, 100.50);
      expect(result.numberValue).toBeInstanceOf(Decimal);
      expect(Number(result.numberValue)).toBe(100.50);
      expect(result.jsonValue).toEqual({ currency: 'USD' });
    });

    it('should map DATE field correctly', () => {
      const date = '2024-01-01';
      const result = (service as any).mapValueToStorage(FieldDataType.DATE, date);
      expect(result.dateValue).toBeInstanceOf(Date);
    });

    it('should map DATETIME field correctly', () => {
      const datetime = '2024-01-01T10:00:00Z';
      const result = (service as any).mapValueToStorage(FieldDataType.DATETIME, datetime);
      expect(result.dateValue).toBeInstanceOf(Date);
    });

    it('should handle null date values', () => {
      const result = (service as any).mapValueToStorage(FieldDataType.DATE, null);
      expect(result.dateValue).toBeNull();
    });

    it('should map BOOLEAN field correctly', () => {
      const resultTrue = (service as any).mapValueToStorage(FieldDataType.BOOLEAN, true);
      expect(resultTrue.booleanValue).toBe(true);

      const resultFalse = (service as any).mapValueToStorage(FieldDataType.BOOLEAN, false);
      expect(resultFalse.booleanValue).toBe(false);

      const resultTruthy = (service as any).mapValueToStorage(FieldDataType.BOOLEAN, 1);
      expect(resultTruthy.booleanValue).toBe(true);
    });

    it('should map SINGLE_SELECT field correctly', () => {
      const result = (service as any).mapValueToStorage(FieldDataType.SINGLE_SELECT, 'option1');
      expect(result.textValue).toBe('option1');
    });

    it('should map MULTI_SELECT field correctly with array', () => {
      const result = (service as any).mapValueToStorage(FieldDataType.MULTI_SELECT, ['opt1', 'opt2']);
      expect(result.jsonValue).toEqual(['opt1', 'opt2']);
    });

    it('should map MULTI_SELECT field correctly with single value', () => {
      const result = (service as any).mapValueToStorage(FieldDataType.MULTI_SELECT, 'opt1');
      expect(result.jsonValue).toEqual(['opt1']);
    });

    it('should map FILE field correctly', () => {
      const fileData = { url: 'https://example.com/file.pdf', name: 'file.pdf' };
      const result = (service as any).mapValueToStorage(FieldDataType.FILE, fileData);
      expect(result.jsonValue).toEqual(fileData);
    });

    it('should map RICH_TEXT field correctly', () => {
      const richText = '<p>Rich <strong>text</strong></p>';
      const result = (service as any).mapValueToStorage(FieldDataType.RICH_TEXT, richText);
      expect(result.jsonValue).toBe(richText);
    });

    it('should map RELATIONSHIP field correctly', () => {
      const relationshipId = 'related-id-123';
      const result = (service as any).mapValueToStorage(FieldDataType.RELATIONSHIP, relationshipId);
      expect(result.jsonValue).toBe(relationshipId);
    });

    it('should handle null text values', () => {
      const result = (service as any).mapValueToStorage(FieldDataType.TEXT, null);
      expect(result.textValue).toBeNull();
    });
  });

  describe('helper methods - extractValue', () => {
    it('should extract TEXT value correctly', () => {
      const fieldValue = { textValue: 'test text' };
      const result = (service as any).extractValue(FieldDataType.TEXT, fieldValue);
      expect(result).toBe('test text');
    });

    it('should extract NUMBER value correctly', () => {
      const fieldValue = { numberValue: new Decimal(42) };
      const result = (service as any).extractValue(FieldDataType.NUMBER, fieldValue);
      expect(result).toBe(42);
    });

    it('should handle null NUMBER value', () => {
      const fieldValue = { numberValue: null };
      const result = (service as any).extractValue(FieldDataType.NUMBER, fieldValue);
      expect(result).toBeNull();
    });

    it('should extract CURRENCY value correctly', () => {
      const fieldValue = { numberValue: new Decimal(100.50) };
      const result = (service as any).extractValue(FieldDataType.CURRENCY, fieldValue);
      expect(result).toBe(100.50);
    });

    it('should extract DATE value correctly', () => {
      const date = new Date('2024-01-01');
      const fieldValue = { dateValue: date };
      const result = (service as any).extractValue(FieldDataType.DATE, fieldValue);
      expect(result).toEqual(date);
    });

    it('should extract BOOLEAN value correctly', () => {
      const fieldValue = { booleanValue: true };
      const result = (service as any).extractValue(FieldDataType.BOOLEAN, fieldValue);
      expect(result).toBe(true);
    });

    it('should extract MULTI_SELECT value correctly', () => {
      const fieldValue = { jsonValue: ['opt1', 'opt2'] };
      const result = (service as any).extractValue(FieldDataType.MULTI_SELECT, fieldValue);
      expect(result).toEqual(['opt1', 'opt2']);
    });

    it('should extract FILE value correctly', () => {
      const fileData = { url: 'https://example.com/file.pdf' };
      const fieldValue = { jsonValue: fileData };
      const result = (service as any).extractValue(FieldDataType.FILE, fieldValue);
      expect(result).toEqual(fileData);
    });

    it('should extract RICH_TEXT value correctly', () => {
      const richText = '<p>Rich text</p>';
      const fieldValue = { jsonValue: richText };
      const result = (service as any).extractValue(FieldDataType.RICH_TEXT, fieldValue);
      expect(result).toBe(richText);
    });

    it('should extract RELATIONSHIP value correctly', () => {
      const relationshipId = 'related-id-123';
      const fieldValue = { jsonValue: relationshipId };
      const result = (service as any).extractValue(FieldDataType.RELATIONSHIP, fieldValue);
      expect(result).toBe(relationshipId);
    });

    it('should return null for null fieldValue', () => {
      const result = (service as any).extractValue(FieldDataType.TEXT, null);
      expect(result).toBeNull();
    });
  });

  describe('helper methods - serializeValue', () => {
    it('should serialize null to empty string', () => {
      const result = (service as any).serializeValue(null);
      expect(result).toBe('');
    });

    it('should serialize undefined to empty string', () => {
      const result = (service as any).serializeValue(undefined);
      expect(result).toBe('');
    });

    it('should serialize object to JSON string', () => {
      const obj = { key: 'value', nested: { data: 'test' } };
      const result = (service as any).serializeValue(obj);
      expect(result).toBe(JSON.stringify(obj));
    });

    it('should serialize array to JSON string', () => {
      const arr = ['value1', 'value2', 'value3'];
      const result = (service as any).serializeValue(arr);
      expect(result).toBe(JSON.stringify(arr));
    });

    it('should serialize number to string', () => {
      const result = (service as any).serializeValue(42);
      expect(result).toBe('42');
    });

    it('should serialize boolean to string', () => {
      const resultTrue = (service as any).serializeValue(true);
      expect(resultTrue).toBe('true');

      const resultFalse = (service as any).serializeValue(false);
      expect(resultFalse).toBe('false');
    });

    it('should serialize string as is', () => {
      const result = (service as any).serializeValue('test string');
      expect(result).toBe('test string');
    });
  });

  describe('helper methods - transformInstance', () => {
    it('should transform instance with field values', () => {
      const instance = {
        ...mockInstance,
        fieldValues: [
          {
            fieldId: 'field-1',
            textValue: 'John Doe',
            numberValue: null,
            dateValue: null,
            booleanValue: null,
            jsonValue: null,
          },
          {
            fieldId: 'field-2',
            textValue: null,
            numberValue: new Decimal(30),
            dateValue: null,
            booleanValue: null,
            jsonValue: null,
          },
        ],
      };

      const result = (service as any).transformInstance(instance, mockSchema);

      expect(result.values).toBeDefined();
      expect(result.values.name).toBe('John Doe');
      expect(result.values.age).toBe(30);
    });

    it('should handle missing field values', () => {
      const instance = {
        ...mockInstance,
        fieldValues: [],
      };

      const result = (service as any).transformInstance(instance, mockSchema);

      expect(result.values).toBeDefined();
      expect(result.values.name).toBeNull();
      expect(result.values.age).toBeNull();
    });
  });
});
