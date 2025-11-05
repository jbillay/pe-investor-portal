import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { DataObjectService } from './data-object.service';
import { PrismaService } from '../../database/prisma.service';
import { FieldDataType } from '../../../generated/prisma';
import { CreateDataObjectDto } from '../dto/create-data-object.dto';
import { UpdateDataObjectDto } from '../dto/update-data-object.dto';

describe('DataObjectService', () => {
  let service: DataObjectService;
  let prisma: jest.Mocked<PrismaService>;

  const mockDataObject = {
    id: 'obj-1',
    dataKey: 'test_object',
    name: 'Test Object',
    description: 'Test description',
    isActive: true,
    createdBy: 'user-1',
    updatedBy: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockField = {
    id: 'field-1',
    dataObjectId: 'obj-1',
    fieldKey: 'name',
    name: 'Name',
    dataType: FieldDataType.TEXT,
    fieldOrder: 1,
    description: 'Name field',
    isMandatory: true,
    isReadOnly: false,
    defaultValue: null,
    relatedDataObjectId: null,
    isActive: true,
    createdBy: 'user-1',
    updatedBy: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    validationRules: [],
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
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    dataField: {
      create: jest.fn(),
    },
    dataObjectVersion: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    dataObjectInstance: {
      count: jest.fn(),
    },
    permission: {
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    rolePermission: {
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataObjectService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<DataObjectService>(DataObjectService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateDataObjectDto = {
      name: 'New Object',
      description: 'New description',
      dataKey: 'new_object',
      fields: [
        {
          name: 'Field 1',
          fieldKey: 'field1',
          dataType: FieldDataType.TEXT,
          fieldOrder: 1,
          isMandatory: true,
          isReadOnly: false,
        },
      ],
    };

    it('should create a data object with fields', async () => {
      prisma.dataObject.findUnique.mockResolvedValue(null); // No existing

      prisma.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          dataObject: {
            create: jest.fn().mockResolvedValue(mockDataObject),
            findUnique: jest.fn().mockResolvedValue({
              ...mockDataObject,
              fields: [mockField],
            }),
          },
          dataField: {
            create: jest.fn().mockResolvedValue(mockField),
          },
          dataObjectVersion: {
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue(mockVersion),
          },
          permission: {
            upsert: jest.fn().mockResolvedValue({}),
          },
        };
        return callback(txMock);
      });

      const result = await service.create(createDto, 'user-1');

      expect(result).toBeDefined();
      expect(result.dataKey).toBe('test_object');
      expect(prisma.dataObject.findUnique).toHaveBeenCalledWith({
        where: { dataKey: 'new_object' },
      });
    });

    it('should generate dataKey from name if not provided', async () => {
      const dtoWithoutKey: CreateDataObjectDto = {
        name: 'New Object Name',
        description: 'Description',
        fields: [],
      };

      prisma.dataObject.findUnique.mockResolvedValue(null);

      prisma.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          dataObject: {
            create: jest.fn().mockResolvedValue(mockDataObject),
            findUnique: jest.fn().mockResolvedValue({
              ...mockDataObject,
              fields: [],
            }),
          },
          dataObjectVersion: {
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue(mockVersion),
          },
          permission: {
            upsert: jest.fn().mockResolvedValue({}),
          },
        };
        return callback(txMock);
      });

      await service.create(dtoWithoutKey, 'user-1');

      // Should check for generated key "new_object_name"
      expect(prisma.dataObject.findUnique).toHaveBeenCalledWith({
        where: { dataKey: 'new_object_name' },
      });
    });

    it('should throw ConflictException when dataKey already exists', async () => {
      prisma.dataObject.findUnique.mockResolvedValue(mockDataObject as any);

      await expect(service.create(createDto, 'user-1')).rejects.toThrow(ConflictException);
      await expect(service.create(createDto, 'user-1')).rejects.toThrow(
        "Data object with key 'new_object' already exists"
      );
    });

    it('should create fields with validation rules', async () => {
      const dtoWithRules: CreateDataObjectDto = {
        ...createDto,
        fields: [
          {
            name: 'Email',
            dataType: FieldDataType.EMAIL,
            fieldOrder: 1,
            isMandatory: true,
            isReadOnly: false,
            validationRules: [
              {
                ruleType: 'REGEX',
                ruleValue: '^[^@]+@[^@]+$',
                errorMessage: 'Invalid email',
              },
            ],
          },
        ],
      };

      prisma.dataObject.findUnique.mockResolvedValue(null);

      let capturedFieldData: any;
      prisma.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          dataObject: {
            create: jest.fn().mockResolvedValue(mockDataObject),
            findUnique: jest.fn().mockResolvedValue({
              ...mockDataObject,
              fields: [mockField],
            }),
          },
          dataField: {
            create: jest.fn().mockImplementation((args) => {
              capturedFieldData = args.data;
              return Promise.resolve(mockField);
            }),
          },
          dataObjectVersion: {
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue(mockVersion),
          },
          permission: {
            upsert: jest.fn().mockResolvedValue({}),
          },
        };
        return callback(txMock);
      });

      await service.create(dtoWithRules, 'user-1');

      expect(capturedFieldData.validationRules).toBeDefined();
      expect(capturedFieldData.validationRules.create).toHaveLength(1);
    });

    it('should create fields with dropdown options', async () => {
      const dtoWithOptions: CreateDataObjectDto = {
        ...createDto,
        fields: [
          {
            name: 'Status',
            dataType: FieldDataType.SINGLE_SELECT,
            fieldOrder: 1,
            isMandatory: true,
            isReadOnly: false,
            dropdownOptions: [
              { label: 'Active', value: 'active', orderIndex: 1 },
              { label: 'Inactive', value: 'inactive', orderIndex: 2 },
            ],
          },
        ],
      };

      prisma.dataObject.findUnique.mockResolvedValue(null);

      let capturedFieldData: any;
      prisma.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          dataObject: {
            create: jest.fn().mockResolvedValue(mockDataObject),
            findUnique: jest.fn().mockResolvedValue({
              ...mockDataObject,
              fields: [mockField],
            }),
          },
          dataField: {
            create: jest.fn().mockImplementation((args) => {
              capturedFieldData = args.data;
              return Promise.resolve(mockField);
            }),
          },
          dataObjectVersion: {
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue(mockVersion),
          },
          permission: {
            upsert: jest.fn().mockResolvedValue({}),
          },
        };
        return callback(txMock);
      });

      await service.create(dtoWithOptions, 'user-1');

      expect(capturedFieldData.dropdownOptions).toBeDefined();
      expect(capturedFieldData.dropdownOptions.create).toHaveLength(2);
    });

    it('should create version 1 snapshot', async () => {
      prisma.dataObject.findUnique.mockResolvedValue(null);

      let capturedVersionData: any;
      prisma.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          dataObject: {
            create: jest.fn().mockResolvedValue(mockDataObject),
            findUnique: jest.fn().mockResolvedValue({
              ...mockDataObject,
              fields: [mockField],
            }),
          },
          dataField: {
            create: jest.fn().mockResolvedValue(mockField),
          },
          dataObjectVersion: {
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockImplementation((args) => {
              capturedVersionData = args.data;
              return Promise.resolve(mockVersion);
            }),
          },
          permission: {
            upsert: jest.fn().mockResolvedValue({}),
          },
        };
        return callback(txMock);
      });

      await service.create(createDto, 'user-1');

      expect(capturedVersionData.version).toBe(1);
      expect(capturedVersionData.schemaSnapshot).toBeDefined();
    });

    it('should create READ, WRITE, DELETE permissions', async () => {
      prisma.dataObject.findUnique.mockResolvedValue(null);

      const upsertedPermissions: any[] = [];
      prisma.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          dataObject: {
            create: jest.fn().mockResolvedValue(mockDataObject),
            findUnique: jest.fn().mockResolvedValue({
              ...mockDataObject,
              fields: [mockField],
            }),
          },
          dataField: {
            create: jest.fn().mockResolvedValue(mockField),
          },
          dataObjectVersion: {
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue(mockVersion),
          },
          permission: {
            upsert: jest.fn().mockImplementation((args) => {
              upsertedPermissions.push(args.create);
              return Promise.resolve({});
            }),
          },
        };
        return callback(txMock);
      });

      await service.create(createDto, 'user-1');

      expect(upsertedPermissions).toHaveLength(3);
      expect(upsertedPermissions.some((p) => p.action === 'READ')).toBe(true);
      expect(upsertedPermissions.some((p) => p.action === 'WRITE')).toBe(true);
      expect(upsertedPermissions.some((p) => p.action === 'DELETE')).toBe(true);
    });
  });

  describe('findAll', () => {
    it('should return all active data objects with fields', async () => {
      const mockObjects = [
        {
          ...mockDataObject,
          fields: [mockField],
          _count: { fields: 1, instances: 5 },
        },
      ];

      prisma.dataObject.findMany.mockResolvedValue(mockObjects as any);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].fields).toHaveLength(1);
      expect(prisma.dataObject.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        include: expect.objectContaining({
          fields: expect.any(Object),
          _count: expect.any(Object),
        }),
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array when no data objects exist', async () => {
      prisma.dataObject.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    it('should return a data object by ID', async () => {
      prisma.dataObject.findUnique.mockResolvedValue({
        ...mockDataObject,
        fields: [mockField],
        _count: { fields: 1, instances: 0 },
      } as any);

      const result = await service.findOne('obj-1');

      expect(result).toBeDefined();
      expect(result.id).toBe('obj-1');
      expect(prisma.dataObject.findUnique).toHaveBeenCalledWith({
        where: { id: 'obj-1' },
        include: expect.objectContaining({
          fields: expect.any(Object),
          _count: expect.any(Object),
        }),
      });
    });

    it('should throw NotFoundException when data object does not exist', async () => {
      prisma.dataObject.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('non-existent')).rejects.toThrow(
        'Data object with ID non-existent not found'
      );
    });
  });

  describe('findByDataKey', () => {
    it('should return a data object by dataKey', async () => {
      prisma.dataObject.findUnique.mockResolvedValue({
        ...mockDataObject,
        fields: [mockField],
      } as any);

      const result = await service.findByDataKey('test_object');

      expect(result).toBeDefined();
      expect(result.dataKey).toBe('test_object');
      expect(prisma.dataObject.findUnique).toHaveBeenCalledWith({
        where: { dataKey: 'test_object' },
        include: expect.objectContaining({
          fields: expect.any(Object),
        }),
      });
    });

    it('should throw NotFoundException when dataKey does not exist', async () => {
      prisma.dataObject.findUnique.mockResolvedValue(null);

      await expect(service.findByDataKey('non-existent')).rejects.toThrow(NotFoundException);
      await expect(service.findByDataKey('non-existent')).rejects.toThrow(
        'Data object with key non-existent not found'
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdateDataObjectDto = {
      name: 'Updated Name',
      description: 'Updated description',
    };

    it('should update a data object and create new version', async () => {
      prisma.dataObject.findUnique.mockResolvedValue({
        ...mockDataObject,
        fields: [mockField],
        _count: { fields: 1, instances: 0 },
      } as any);

      prisma.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          dataObject: {
            update: jest.fn().mockResolvedValue({
              ...mockDataObject,
              name: 'Updated Name',
            }),
            findUnique: jest.fn()
              .mockResolvedValueOnce({
                ...mockDataObject,
                fields: [mockField],
              })
              .mockResolvedValueOnce({
                ...mockDataObject,
                name: 'Updated Name',
                fields: [mockField],
              }),
          },
          dataObjectVersion: {
            findFirst: jest.fn().mockResolvedValue(mockVersion),
            create: jest.fn().mockResolvedValue({ ...mockVersion, version: 2 }),
          },
        };
        return callback(txMock);
      });

      const result = await service.update('obj-1', updateDto, 'user-1');

      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when data object does not exist', async () => {
      prisma.dataObject.findUnique.mockResolvedValue(null);

      await expect(service.update('non-existent', updateDto, 'user-1')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should increment version number', async () => {
      prisma.dataObject.findUnique.mockResolvedValue({
        ...mockDataObject,
        fields: [mockField],
        _count: { fields: 1, instances: 0 },
      } as any);

      let capturedVersionData: any;
      prisma.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          dataObject: {
            update: jest.fn().mockResolvedValue(mockDataObject),
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

      await service.update('obj-1', updateDto, 'user-1');

      expect(capturedVersionData.version).toBe(4);
    });
  });

  describe('remove', () => {
    it('should soft delete a data object', async () => {
      prisma.dataObject.findUnique.mockResolvedValue({
        ...mockDataObject,
        fields: [mockField],
        _count: { fields: 1, instances: 0 },
      } as any);
      prisma.dataObjectInstance.count.mockResolvedValue(0);

      let updatedData: any;
      prisma.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          dataObject: {
            update: jest.fn().mockImplementation((args) => {
              updatedData = args.data;
              return Promise.resolve({ ...mockDataObject, isActive: false });
            }),
          },
          permission: {
            deleteMany: jest.fn().mockResolvedValue({ count: 3 }),
          },
          rolePermission: {
            deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
        };
        return callback(txMock);
      });

      await service.remove('obj-1');

      expect(updatedData.isActive).toBe(false);
    });

    it('should throw BadRequestException when instances exist', async () => {
      prisma.dataObject.findUnique.mockResolvedValue({
        ...mockDataObject,
        fields: [mockField],
        _count: { fields: 1, instances: 0 },
      } as any);
      prisma.dataObjectInstance.count.mockResolvedValue(5);

      await expect(service.remove('obj-1')).rejects.toThrow(BadRequestException);
      await expect(service.remove('obj-1')).rejects.toThrow(
        'Cannot delete data object with 5 existing instances'
      );
    });

    it('should throw NotFoundException when data object does not exist', async () => {
      prisma.dataObject.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should delete associated permissions', async () => {
      prisma.dataObject.findUnique.mockResolvedValue({
        ...mockDataObject,
        fields: [mockField],
        _count: { fields: 1, instances: 0 },
      } as any);
      prisma.dataObjectInstance.count.mockResolvedValue(0);

      let deletedPermissions: any;
      let deletedRolePermissions: any;

      prisma.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          dataObject: {
            update: jest.fn().mockResolvedValue({ ...mockDataObject, isActive: false }),
          },
          rolePermission: {
            deleteMany: jest.fn().mockImplementation((args) => {
              deletedRolePermissions = args;
              return Promise.resolve({ count: 2 });
            }),
          },
          permission: {
            deleteMany: jest.fn().mockImplementation((args) => {
              deletedPermissions = args;
              return Promise.resolve({ count: 3 });
            }),
          },
        };
        return callback(txMock);
      });

      await service.remove('obj-1');

      expect(deletedRolePermissions).toBeDefined();
      expect(deletedPermissions).toBeDefined();
    });
  });

  describe('getVersionHistory', () => {
    it('should return version history for a data object', async () => {
      prisma.dataObject.findUnique.mockResolvedValue({
        ...mockDataObject,
        fields: [mockField],
        _count: { fields: 1, instances: 0 },
      } as any);

      const mockVersions = [
        { ...mockVersion, version: 2 },
        { ...mockVersion, version: 1 },
      ];
      prisma.dataObjectVersion.findMany.mockResolvedValue(mockVersions as any);

      const result = await service.getVersionHistory('obj-1');

      expect(result).toHaveLength(2);
      expect(result[0].version).toBe(2);
      expect(prisma.dataObjectVersion.findMany).toHaveBeenCalledWith({
        where: { dataObjectId: 'obj-1' },
        orderBy: { version: 'desc' },
      });
    });

    it('should throw NotFoundException when data object does not exist', async () => {
      prisma.dataObject.findUnique.mockResolvedValue(null);

      await expect(service.getVersionHistory('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getVersion', () => {
    it('should return a specific version', async () => {
      prisma.dataObjectVersion.findUnique.mockResolvedValue(mockVersion as any);

      const result = await service.getVersion('obj-1', 1);

      expect(result).toBeDefined();
      expect(result.version).toBe(1);
      expect(prisma.dataObjectVersion.findUnique).toHaveBeenCalledWith({
        where: {
          dataObjectId_version: {
            dataObjectId: 'obj-1',
            version: 1,
          },
        },
      });
    });

    it('should throw NotFoundException when version does not exist', async () => {
      prisma.dataObjectVersion.findUnique.mockResolvedValue(null);

      await expect(service.getVersion('obj-1', 999)).rejects.toThrow(NotFoundException);
      await expect(service.getVersion('obj-1', 999)).rejects.toThrow(
        'Version 999 not found for data object obj-1'
      );
    });
  });

  describe('generateDataKey (private method)', () => {
    it('should convert "Test Object" to "test_object"', async () => {
      const dto: CreateDataObjectDto = {
        name: 'Test Object',
        description: 'Description',
        fields: [],
      };

      prisma.dataObject.findUnique.mockResolvedValue(null);

      prisma.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          dataObject: {
            create: jest.fn().mockResolvedValue(mockDataObject),
            findUnique: jest.fn().mockResolvedValue({
              ...mockDataObject,
              fields: [],
            }),
          },
          dataObjectVersion: {
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue(mockVersion),
          },
          permission: {
            upsert: jest.fn().mockResolvedValue({}),
          },
        };
        return callback(txMock);
      });

      await service.create(dto, 'user-1');

      expect(prisma.dataObject.findUnique).toHaveBeenCalledWith({
        where: { dataKey: 'test_object' },
      });
    });

    it('should convert "Capital Call-Analysis" to "capital_call_analysis"', async () => {
      const dto: CreateDataObjectDto = {
        name: 'Capital Call-Analysis',
        description: 'Description',
        fields: [],
      };

      prisma.dataObject.findUnique.mockResolvedValue(null);

      prisma.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          dataObject: {
            create: jest.fn().mockResolvedValue(mockDataObject),
            findUnique: jest.fn().mockResolvedValue({
              ...mockDataObject,
              fields: [],
            }),
          },
          dataObjectVersion: {
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue(mockVersion),
          },
          permission: {
            upsert: jest.fn().mockResolvedValue({}),
          },
        };
        return callback(txMock);
      });

      await service.create(dto, 'user-1');

      expect(prisma.dataObject.findUnique).toHaveBeenCalledWith({
        where: { dataKey: 'capital_call_analysis' },
      });
    });

    it('should strip leading and trailing underscores', async () => {
      const dto: CreateDataObjectDto = {
        name: '___Test___',
        description: 'Description',
        fields: [],
      };

      prisma.dataObject.findUnique.mockResolvedValue(null);

      prisma.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          dataObject: {
            create: jest.fn().mockResolvedValue(mockDataObject),
            findUnique: jest.fn().mockResolvedValue({
              ...mockDataObject,
              fields: [],
            }),
          },
          dataObjectVersion: {
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue(mockVersion),
          },
          permission: {
            upsert: jest.fn().mockResolvedValue({}),
          },
        };
        return callback(txMock);
      });

      await service.create(dto, 'user-1');

      expect(prisma.dataObject.findUnique).toHaveBeenCalledWith({
        where: { dataKey: 'test' },
      });
    });
  });
});
