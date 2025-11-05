import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InstanceService } from './instance.service';
import { PrismaService } from '../../database/prisma.service';
import { SchemaService } from './schema.service';
import { FieldDataType, ChangeType } from '../../../generated/prisma';
import { Decimal } from '../../../generated/prisma/runtime/library';

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
    it('should create instance with field values successfully', async () => {
      schemaService.getSchema.mockResolvedValue(mockSchema as any);

      const mockTx = {
        dataObjectInstance: {
          create: jest.fn().mockResolvedValue(mockInstance),
          findFirst: jest.fn().mockResolvedValue({
            ...mockInstance,
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

      (prismaService.$transaction as jest.Mock).mockImplementation(
        async (callback) => callback(mockTx),
      );

      const values = { name: 'John Doe', age: 30 };
      const result = await service.create('test-data', values, 'user-123');

      expect(result).toBeDefined();
      expect(result.id).toBe(mockInstance.id);
      expect(mockTx.dataObjectInstance.create).toHaveBeenCalledWith({
        data: {
          dataObjectId: 'data-obj-123',
          versionNumber: 1,
          createdBy: 'user-123',
          updatedBy: 'user-123',
        },
      });
      expect(mockTx.instanceFieldValue.create).toHaveBeenCalledTimes(2);
      expect(mockTx.instanceChangeLog.create).toHaveBeenCalledWith({
        data: {
          instanceId: mockInstance.id,
          changeType: 'CREATE',
          newValue: JSON.stringify(values),
          changedBy: 'user-123',
        },
      });
    });

    it('should skip null and undefined field values', async () => {
      schemaService.getSchema.mockResolvedValue(mockSchema as any);

      const mockTx = {
        dataObjectInstance: {
          create: jest.fn().mockResolvedValue(mockInstance),
          findFirst: jest.fn().mockResolvedValue({
            ...mockInstance,
            fieldValues: [],
          }),
        },
        instanceFieldValue: {
          create: jest.fn(),
        },
        instanceChangeLog: {
          create: jest.fn(),
        },
      };

      (prismaService.$transaction as jest.Mock).mockImplementation(
        async (callback) => callback(mockTx),
      );

      const values = { name: 'John', age: null, email: undefined };
      await service.create('test-data', values, 'user-123');

      // Should only create field value for 'name'
      expect(mockTx.instanceFieldValue.create).toHaveBeenCalledTimes(1);
    });

    it('should throw BadRequestException if instance UUID is invalid', async () => {
      schemaService.getSchema.mockResolvedValue(mockSchema as any);

      const mockTx = {
        dataObjectInstance: {
          create: jest.fn().mockResolvedValue({ ...mockInstance, id: 'invalid-uuid' }),
        },
      };

      (prismaService.$transaction as jest.Mock).mockImplementation(
        async (callback) => callback(mockTx),
      );

      await expect(
        service.create('test-data', { name: 'John' }, 'user-123'),
      ).rejects.toThrow(BadRequestException);
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
      schemaService.getSchema.mockResolvedValue(mockSchema as any);

      const existingInstance = {
        ...mockInstance,
        values: { name: 'John Doe', age: 30 },
      };

      const mockTx = {
        dataObjectInstance: {
          update: jest.fn().mockResolvedValue(mockInstance),
          findFirst: jest.fn().mockResolvedValue(mockInstance),
        },
        instanceFieldValue: {
          findUnique: jest.fn().mockResolvedValue({ id: 'fv-1' }),
          update: jest.fn().mockResolvedValue({}),
        },
        instanceChangeLog: {
          create: jest.fn().mockResolvedValue({}),
        },
      };

      (prismaService.$transaction as jest.Mock).mockImplementation(
        async (callback) => callback(mockTx),
      );

      // Mock findOne to return existing instance
      jest.spyOn(service, 'findOne').mockResolvedValue(existingInstance as any);

      const updates = { name: 'Jane Doe' };
      await service.update(
        'test-data',
        '550e8400-e29b-41d4-a716-446655440000',
        updates,
        'user-123',
      );

      expect(mockTx.dataObjectInstance.update).toHaveBeenCalled();
      expect(mockTx.instanceFieldValue.update).toHaveBeenCalled();
    });

    it('should create new field value if not exists', async () => {
      schemaService.getSchema.mockResolvedValue(mockSchema as any);

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

      (prismaService.$transaction as jest.Mock).mockImplementation(
        async (callback) => callback(mockTx),
      );

      jest
        .spyOn(service, 'findOne')
        .mockResolvedValue({ ...mockInstance, values: {} } as any);

      const updates = { name: 'New Name' };
      await service.update(
        'test-data',
        '550e8400-e29b-41d4-a716-446655440000',
        updates,
        'user-123',
      );

      expect(mockTx.instanceFieldValue.create).toHaveBeenCalled();
    });

    it('should log changes for modified fields', async () => {
      schemaService.getSchema.mockResolvedValue(mockSchema as any);

      const mockTx = {
        dataObjectInstance: {
          update: jest.fn().mockResolvedValue(mockInstance),
          findFirst: jest.fn().mockResolvedValue(mockInstance),
        },
        instanceFieldValue: {
          findUnique: jest.fn().mockResolvedValue({ id: 'fv-1' }),
          update: jest.fn().mockResolvedValue({}),
        },
        instanceChangeLog: {
          create: jest.fn().mockResolvedValue({}),
        },
      };

      (prismaService.$transaction as jest.Mock).mockImplementation(
        async (callback) => callback(mockTx),
      );

      jest
        .spyOn(service, 'findOne')
        .mockResolvedValue({ ...mockInstance, values: { name: 'Old Name' } } as any);

      await service.update(
        'test-data',
        '550e8400-e29b-41d4-a716-446655440000',
        { name: 'New Name' },
        'user-123',
      );

      expect(mockTx.instanceChangeLog.create).toHaveBeenCalledWith({
        data: {
          instanceId: '550e8400-e29b-41d4-a716-446655440000',
          fieldId: 'field-1',
          changeType: 'UPDATE',
          oldValue: 'Old Name',
          newValue: 'New Name',
          changedBy: 'user-123',
        },
      });
    });
  });

  describe('remove', () => {
    it('should soft delete instance', async () => {
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

      (prismaService.$transaction as jest.Mock).mockImplementation(
        async (callback) => callback(mockTx),
      );

      await service.remove(
        'test-data',
        '550e8400-e29b-41d4-a716-446655440000',
        'user-123',
      );

      expect(mockTx.dataObjectInstance.update).toHaveBeenCalledWith({
        where: { id: '550e8400-e29b-41d4-a716-446655440000' },
        data: { isActive: false, updatedBy: 'user-123' },
      });
      expect(mockTx.instanceChangeLog.create).toHaveBeenCalledWith({
        data: {
          instanceId: '550e8400-e29b-41d4-a716-446655440000',
          changeType: 'DELETE',
          changedBy: 'user-123',
        },
      });
    });

    it('should throw BadRequestException for invalid UUID', async () => {
      await expect(
        service.remove('test-data', 'invalid-uuid', 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if instance not found', async () => {
      schemaService.getSchema.mockResolvedValue(mockSchema as any);

      const mockTx = {
        dataObjectInstance: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
      };

      (prismaService.$transaction as jest.Mock).mockImplementation(
        async (callback) => callback(mockTx),
      );

      await expect(
        service.remove('test-data', '550e8400-e29b-41d4-a716-446655440000', 'user-123'),
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

  describe('field type mappings', () => {
    it('should map TEXT field type correctly', async () => {
      schemaService.getSchema.mockResolvedValue({
        ...mockSchema,
        fields: [{ id: 'field-1', fieldKey: 'text', dataType: FieldDataType.TEXT }],
      } as any);

      const mockTx = {
        dataObjectInstance: {
          create: jest.fn().mockResolvedValue(mockInstance),
          findFirst: jest.fn().mockResolvedValue({
            ...mockInstance,
            fieldValues: [],
          }),
        },
        instanceFieldValue: {
          create: jest.fn().mockResolvedValue({}),
        },
        instanceChangeLog: {
          create: jest.fn(),
        },
      };

      (prismaService.$transaction as jest.Mock).mockImplementation(
        async (callback) => callback(mockTx),
      );

      await service.create('test-data', { text: 'Hello World' }, 'user-123');

      expect(mockTx.instanceFieldValue.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          textValue: 'Hello World',
          numberValue: null,
          dateValue: null,
          booleanValue: null,
          jsonValue: null,
        }),
      });
    });

    it('should map NUMBER field type correctly', async () => {
      schemaService.getSchema.mockResolvedValue({
        ...mockSchema,
        fields: [{ id: 'field-1', fieldKey: 'num', dataType: FieldDataType.NUMBER }],
      } as any);

      const mockTx = {
        dataObjectInstance: {
          create: jest.fn().mockResolvedValue(mockInstance),
          findFirst: jest.fn().mockResolvedValue({
            ...mockInstance,
            fieldValues: [],
          }),
        },
        instanceFieldValue: {
          create: jest.fn().mockResolvedValue({}),
        },
        instanceChangeLog: {
          create: jest.fn(),
        },
      };

      (prismaService.$transaction as jest.Mock).mockImplementation(
        async (callback) => callback(mockTx),
      );

      await service.create('test-data', { num: 42 }, 'user-123');

      expect(mockTx.instanceFieldValue.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          numberValue: expect.any(Decimal),
        }),
      });
    });

    it('should map BOOLEAN field type correctly', async () => {
      schemaService.getSchema.mockResolvedValue({
        ...mockSchema,
        fields: [{ id: 'field-1', fieldKey: 'flag', dataType: FieldDataType.BOOLEAN }],
      } as any);

      const mockTx = {
        dataObjectInstance: {
          create: jest.fn().mockResolvedValue(mockInstance),
          findFirst: jest.fn().mockResolvedValue({
            ...mockInstance,
            fieldValues: [],
          }),
        },
        instanceFieldValue: {
          create: jest.fn().mockResolvedValue({}),
        },
        instanceChangeLog: {
          create: jest.fn(),
        },
      };

      (prismaService.$transaction as jest.Mock).mockImplementation(
        async (callback) => callback(mockTx),
      );

      await service.create('test-data', { flag: true }, 'user-123');

      expect(mockTx.instanceFieldValue.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          booleanValue: true,
        }),
      });
    });

    it('should map DATE field type correctly', async () => {
      schemaService.getSchema.mockResolvedValue({
        ...mockSchema,
        fields: [{ id: 'field-1', fieldKey: 'date', dataType: FieldDataType.DATE }],
      } as any);

      const mockTx = {
        dataObjectInstance: {
          create: jest.fn().mockResolvedValue(mockInstance),
          findFirst: jest.fn().mockResolvedValue({
            ...mockInstance,
            fieldValues: [],
          }),
        },
        instanceFieldValue: {
          create: jest.fn().mockResolvedValue({}),
        },
        instanceChangeLog: {
          create: jest.fn(),
        },
      };

      (prismaService.$transaction as jest.Mock).mockImplementation(
        async (callback) => callback(mockTx),
      );

      const testDate = '2024-01-01';
      await service.create('test-data', { date: testDate }, 'user-123');

      expect(mockTx.instanceFieldValue.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          dateValue: expect.any(Date),
        }),
      });
    });

    it('should map MULTI_SELECT field type correctly', async () => {
      schemaService.getSchema.mockResolvedValue({
        ...mockSchema,
        fields: [
          { id: 'field-1', fieldKey: 'tags', dataType: FieldDataType.MULTI_SELECT },
        ],
      } as any);

      const mockTx = {
        dataObjectInstance: {
          create: jest.fn().mockResolvedValue(mockInstance),
          findFirst: jest.fn().mockResolvedValue({
            ...mockInstance,
            fieldValues: [],
          }),
        },
        instanceFieldValue: {
          create: jest.fn().mockResolvedValue({}),
        },
        instanceChangeLog: {
          create: jest.fn(),
        },
      };

      (prismaService.$transaction as jest.Mock).mockImplementation(
        async (callback) => callback(mockTx),
      );

      await service.create('test-data', { tags: ['tag1', 'tag2'] }, 'user-123');

      expect(mockTx.instanceFieldValue.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          jsonValue: ['tag1', 'tag2'],
        }),
      });
    });

    it('should map CURRENCY field type with default currency', async () => {
      schemaService.getSchema.mockResolvedValue({
        ...mockSchema,
        fields: [
          { id: 'field-1', fieldKey: 'price', dataType: FieldDataType.CURRENCY },
        ],
      } as any);

      const mockTx = {
        dataObjectInstance: {
          create: jest.fn().mockResolvedValue(mockInstance),
          findFirst: jest.fn().mockResolvedValue({
            ...mockInstance,
            fieldValues: [],
          }),
        },
        instanceFieldValue: {
          create: jest.fn().mockResolvedValue({}),
        },
        instanceChangeLog: {
          create: jest.fn(),
        },
      };

      (prismaService.$transaction as jest.Mock).mockImplementation(
        async (callback) => callback(mockTx),
      );

      await service.create('test-data', { price: 99.99 }, 'user-123');

      expect(mockTx.instanceFieldValue.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          numberValue: expect.any(Decimal),
          jsonValue: { currency: 'USD' },
        }),
      });
    });
  });
});
