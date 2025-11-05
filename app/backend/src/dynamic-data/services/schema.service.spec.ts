import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SchemaService } from './schema.service';
import { PrismaService } from '../../database/prisma.service';
import { FieldDataType } from '../../../generated/prisma';

describe('SchemaService', () => {
  let service: SchemaService;
  let prisma: jest.Mocked<PrismaService>;

  const mockDataObject = {
    id: 'obj-1',
    dataKey: 'test-data',
    name: 'Test Data',
    description: 'Test description',
    isActive: true,
    fields: [
      {
        id: 'field-1',
        fieldKey: 'name',
        name: 'Name',
        dataType: FieldDataType.TEXT,
        fieldOrder: 1,
        description: 'Name field',
        isMandatory: true,
        isReadOnly: false,
        defaultValue: null,
        relatedDataObjectId: null,
        validationRules: [
          {
            ruleType: 'MIN_LENGTH',
            ruleValue: '3',
            errorMessage: 'Name must be at least 3 characters',
          },
        ],
        dropdownOptions: [],
        isActive: true,
      },
      {
        id: 'field-2',
        fieldKey: 'age',
        name: 'Age',
        dataType: FieldDataType.NUMBER,
        fieldOrder: 2,
        description: null,
        isMandatory: false,
        isReadOnly: false,
        defaultValue: '18',
        relatedDataObjectId: null,
        validationRules: [],
        dropdownOptions: [],
        isActive: true,
      },
    ],
  };

  const mockVersion = {
    id: 'ver-1',
    dataObjectId: 'obj-1',
    version: 2,
    createdAt: new Date(),
  };

  const mockPrismaService = {
    dataObject: {
      findUnique: jest.fn(),
    },
    dataObjectVersion: {
      findFirst: jest.fn(),
    },
    userRole: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchemaService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SchemaService>(SchemaService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
    service.clearCache(); // Clear cache between tests
  });

  describe('getSchema', () => {
    it('should fetch and cache schema by dataKey', async () => {
      prisma.dataObject.findUnique.mockResolvedValue(mockDataObject as any);
      prisma.dataObjectVersion.findFirst.mockResolvedValue(mockVersion as any);

      const schema = await service.getSchema('test-data');

      expect(schema).toEqual({
        dataObjectId: 'obj-1',
        dataKey: 'test-data',
        name: 'Test Data',
        description: 'Test description',
        version: 2,
        fields: [
          {
            id: 'field-1',
            fieldKey: 'name',
            name: 'Name',
            dataType: FieldDataType.TEXT,
            fieldOrder: 1,
            description: 'Name field',
            isMandatory: true,
            isReadOnly: false,
            defaultValue: undefined,
            relatedDataObjectId: undefined,
            validationRules: [
              {
                ruleType: 'MIN_LENGTH',
                ruleValue: '3',
                errorMessage: 'Name must be at least 3 characters',
              },
            ],
            dropdownOptions: [],
          },
          {
            id: 'field-2',
            fieldKey: 'age',
            name: 'Age',
            dataType: FieldDataType.NUMBER,
            fieldOrder: 2,
            description: undefined,
            isMandatory: false,
            isReadOnly: false,
            defaultValue: '18',
            relatedDataObjectId: undefined,
            validationRules: [],
            dropdownOptions: [],
          },
        ],
      });

      expect(prisma.dataObject.findUnique).toHaveBeenCalledWith({
        where: { dataKey: 'test-data', isActive: true },
        include: expect.any(Object),
      });
    });

    it('should return cached schema on subsequent calls within TTL', async () => {
      prisma.dataObject.findUnique.mockResolvedValue(mockDataObject as any);
      prisma.dataObjectVersion.findFirst.mockResolvedValue(mockVersion as any);

      // First call - should fetch from database
      await service.getSchema('test-data');
      expect(prisma.dataObject.findUnique).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      await service.getSchema('test-data');
      expect(prisma.dataObject.findUnique).toHaveBeenCalledTimes(1); // Still only 1 call
    });

    it('should fetch fresh data when cache expires', async () => {
      prisma.dataObject.findUnique.mockResolvedValue(mockDataObject as any);
      prisma.dataObjectVersion.findFirst.mockResolvedValue(mockVersion as any);

      // First call
      await service.getSchema('test-data');
      expect(prisma.dataObject.findUnique).toHaveBeenCalledTimes(1);

      // Manually expire cache by clearing it
      service.clearCache();

      // Second call - should fetch again
      await service.getSchema('test-data');
      expect(prisma.dataObject.findUnique).toHaveBeenCalledTimes(2);
    });

    it('should throw NotFoundException when data object not found', async () => {
      prisma.dataObject.findUnique.mockResolvedValue(null);

      await expect(service.getSchema('non-existent')).rejects.toThrow(NotFoundException);
      await expect(service.getSchema('non-existent')).rejects.toThrow(
        "Data object with key 'non-existent' not found"
      );
    });

    it('should use default version 1 when no version exists', async () => {
      prisma.dataObject.findUnique.mockResolvedValue(mockDataObject as any);
      prisma.dataObjectVersion.findFirst.mockResolvedValue(null);

      const schema = await service.getSchema('test-data');

      expect(schema.version).toBe(1);
    });

    it('should include user permissions when userId is provided', async () => {
      prisma.dataObject.findUnique.mockResolvedValue(mockDataObject as any);
      prisma.dataObjectVersion.findFirst.mockResolvedValue(mockVersion as any);
      prisma.userRole.findMany.mockResolvedValue([
        {
          userId: 'user-1',
          roleId: 'role-1',
          isActive: true,
          role: {
            id: 'role-1',
            name: 'USER',
            isActive: true,
            rolePermissions: [
              {
                isActive: true,
                permission: {
                  name: 'OBJ_TEST-DATA:READ',
                },
              },
            ],
          },
        },
      ] as any);

      const schema = await service.getSchema('test-data', 'user-1');

      expect(schema.permissions).toEqual({
        canRead: true,
        canWrite: false,
        canDelete: false,
      });
      expect(prisma.userRole.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', isActive: true },
        include: expect.any(Object),
      });
    });

    it('should grant all permissions to SUPER_ADMIN', async () => {
      prisma.dataObject.findUnique.mockResolvedValue(mockDataObject as any);
      prisma.dataObjectVersion.findFirst.mockResolvedValue(mockVersion as any);
      prisma.userRole.findMany.mockResolvedValue([
        {
          userId: 'admin-1',
          roleId: 'admin-role-1',
          isActive: true,
          role: {
            id: 'admin-role-1',
            name: 'SUPER_ADMIN',
            isActive: true,
            rolePermissions: [],
          },
        },
      ] as any);

      const schema = await service.getSchema('test-data', 'admin-1');

      expect(schema.permissions).toEqual({
        canRead: true,
        canWrite: true,
        canDelete: true,
      });
    });

    it('should handle multiple roles with combined permissions', async () => {
      prisma.dataObject.findUnique.mockResolvedValue(mockDataObject as any);
      prisma.dataObjectVersion.findFirst.mockResolvedValue(mockVersion as any);
      prisma.userRole.findMany.mockResolvedValue([
        {
          userId: 'user-1',
          roleId: 'role-1',
          isActive: true,
          role: {
            id: 'role-1',
            name: 'READER',
            isActive: true,
            rolePermissions: [
              {
                isActive: true,
                permission: {
                  name: 'OBJ_TEST-DATA:READ',
                },
              },
            ],
          },
        },
        {
          userId: 'user-1',
          roleId: 'role-2',
          isActive: true,
          role: {
            id: 'role-2',
            name: 'WRITER',
            isActive: true,
            rolePermissions: [
              {
                isActive: true,
                permission: {
                  name: 'OBJ_TEST-DATA:WRITE',
                },
              },
            ],
          },
        },
      ] as any);

      const schema = await service.getSchema('test-data', 'user-1');

      expect(schema.permissions).toEqual({
        canRead: true,
        canWrite: true,
        canDelete: false,
      });
    });
  });

  describe('getSchemaById', () => {
    it('should fetch schema by dataObjectId', async () => {
      prisma.dataObject.findUnique.mockResolvedValue(mockDataObject as any);
      prisma.dataObjectVersion.findFirst.mockResolvedValue(mockVersion as any);

      const schema = await service.getSchemaById('obj-1');

      expect(schema.dataObjectId).toBe('obj-1');
      expect(schema.dataKey).toBe('test-data');
      expect(prisma.dataObject.findUnique).toHaveBeenCalledWith({
        where: { id: 'obj-1', isActive: true },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException when data object not found by ID', async () => {
      prisma.dataObject.findUnique.mockResolvedValue(null);

      await expect(service.getSchemaById('non-existent')).rejects.toThrow(NotFoundException);
      await expect(service.getSchemaById('non-existent')).rejects.toThrow(
        "Data object with ID 'non-existent' not found"
      );
    });

    it('should use default version 1 when no version exists', async () => {
      prisma.dataObject.findUnique.mockResolvedValue(mockDataObject as any);
      prisma.dataObjectVersion.findFirst.mockResolvedValue(null);

      const schema = await service.getSchemaById('obj-1');

      expect(schema.version).toBe(1);
    });
  });

  describe('invalidateCache', () => {
    it('should remove specific dataKey from cache', async () => {
      prisma.dataObject.findUnique.mockResolvedValue(mockDataObject as any);
      prisma.dataObjectVersion.findFirst.mockResolvedValue(mockVersion as any);

      // Cache the schema
      await service.getSchema('test-data');
      expect(prisma.dataObject.findUnique).toHaveBeenCalledTimes(1);

      // Invalidate specific cache
      service.invalidateCache('test-data');

      // Next call should fetch from database again
      await service.getSchema('test-data');
      expect(prisma.dataObject.findUnique).toHaveBeenCalledTimes(2);
    });

    it('should not affect other cached entries', async () => {
      const mockDataObject2 = { ...mockDataObject, id: 'obj-2', dataKey: 'test-data-2' };

      prisma.dataObject.findUnique
        .mockResolvedValueOnce(mockDataObject as any)
        .mockResolvedValueOnce(mockDataObject2 as any)
        .mockResolvedValueOnce(mockDataObject as any);
      prisma.dataObjectVersion.findFirst.mockResolvedValue(mockVersion as any);

      // Cache two schemas
      await service.getSchema('test-data');
      await service.getSchema('test-data-2');
      expect(prisma.dataObject.findUnique).toHaveBeenCalledTimes(2);

      // Invalidate only one
      service.invalidateCache('test-data');

      // First should refetch, second should use cache
      await service.getSchema('test-data');
      expect(prisma.dataObject.findUnique).toHaveBeenCalledTimes(3);

      await service.getSchema('test-data-2');
      expect(prisma.dataObject.findUnique).toHaveBeenCalledTimes(3); // Still 3, used cache
    });
  });

  describe('clearCache', () => {
    it('should remove all entries from cache', async () => {
      const mockDataObject2 = { ...mockDataObject, id: 'obj-2', dataKey: 'test-data-2' };

      prisma.dataObject.findUnique
        .mockResolvedValueOnce(mockDataObject as any)
        .mockResolvedValueOnce(mockDataObject2 as any)
        .mockResolvedValueOnce(mockDataObject as any)
        .mockResolvedValueOnce(mockDataObject2 as any);
      prisma.dataObjectVersion.findFirst.mockResolvedValue(mockVersion as any);

      // Cache two schemas
      await service.getSchema('test-data');
      await service.getSchema('test-data-2');
      expect(prisma.dataObject.findUnique).toHaveBeenCalledTimes(2);

      // Clear all cache
      service.clearCache();

      // Both should refetch
      await service.getSchema('test-data');
      await service.getSchema('test-data-2');
      expect(prisma.dataObject.findUnique).toHaveBeenCalledTimes(4);
    });
  });

  describe('field mapping', () => {
    it('should map fields with dropdown options', async () => {
      const dataObjectWithDropdown = {
        ...mockDataObject,
        fields: [
          {
            ...mockDataObject.fields[0],
            dropdownOptions: [
              { label: 'Option 1', value: 'opt1', orderIndex: 1, isActive: true },
              { label: 'Option 2', value: 'opt2', orderIndex: 2, isActive: true },
            ],
          },
        ],
      };

      prisma.dataObject.findUnique.mockResolvedValue(dataObjectWithDropdown as any);
      prisma.dataObjectVersion.findFirst.mockResolvedValue(mockVersion as any);

      const schema = await service.getSchema('test-data');

      expect(schema.fields[0].dropdownOptions).toEqual([
        { label: 'Option 1', value: 'opt1' },
        { label: 'Option 2', value: 'opt2' },
      ]);
    });

    it('should handle null optional fields', async () => {
      const dataObjectWithNulls = {
        ...mockDataObject,
        description: null,
        fields: [
          {
            ...mockDataObject.fields[0],
            description: null,
            defaultValue: null,
            relatedDataObjectId: null,
          },
        ],
      };

      prisma.dataObject.findUnique.mockResolvedValue(dataObjectWithNulls as any);
      prisma.dataObjectVersion.findFirst.mockResolvedValue(mockVersion as any);

      const schema = await service.getSchema('test-data');

      expect(schema.description).toBeUndefined();
      expect(schema.fields[0].description).toBeUndefined();
      expect(schema.fields[0].defaultValue).toBeUndefined();
      expect(schema.fields[0].relatedDataObjectId).toBeUndefined();
    });
  });
});
