import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { VersioningService } from './versioning.service';
import { PrismaService } from '../../database/prisma.service';

describe('VersioningService', () => {
  let service: VersioningService;
  let prisma: jest.Mocked<PrismaService>;

  const mockPrisma = {
    dataObject: {
      findUnique: jest.fn(),
    },
    dataObjectVersion: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  const mockSchemaSnapshot = {
    name: 'Test Schema',
    description: 'Test Description',
    fields: [
      {
        id: 'field-1',
        name: 'Field 1',
        fieldKey: 'field1',
        dataType: 'TEXT',
        isMandatory: true,
        isReadOnly: false,
        description: 'First field',
        defaultValue: null,
      },
      {
        id: 'field-2',
        name: 'Field 2',
        fieldKey: 'field2',
        dataType: 'NUMBER',
        isMandatory: false,
        isReadOnly: false,
        description: 'Second field',
        defaultValue: 0,
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VersioningService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<VersioningService>(VersioningService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getVersionHistory', () => {
    it('should return version history for data object', async () => {
      const mockDataObject = { id: 'obj-1', name: 'Test Object' };
      const mockVersions = [
        {
          id: 'ver-2',
          version: 2,
          name: 'Version 2',
          description: 'Updated schema',
          dataObjectId: 'obj-1',
          createdAt: new Date(),
          createdBy: 'user-1',
        },
        {
          id: 'ver-1',
          version: 1,
          name: 'Version 1',
          description: null,
          dataObjectId: 'obj-1',
          createdAt: new Date(),
          createdBy: 'user-1',
        },
      ];

      prisma.dataObject.findUnique.mockResolvedValue(mockDataObject as any);
      prisma.dataObjectVersion.findMany.mockResolvedValue(mockVersions as any);

      const result = await service.getVersionHistory('obj-1');

      expect(result).toHaveLength(2);
      expect(result[0].version).toBe(2);
      expect(result[0].changes).toBe('Version 2 - Schema updated');
      expect(result[1].version).toBe(1);
      expect(result[1].changes).toBe('Initial version created');
      expect(prisma.dataObjectVersion.findMany).toHaveBeenCalledWith({
        where: { dataObjectId: 'obj-1' },
        orderBy: { version: 'desc' },
      });
    });

    it('should throw NotFoundException when data object not found', async () => {
      prisma.dataObject.findUnique.mockResolvedValue(null);

      await expect(service.getVersionHistory('non-existent')).rejects.toThrow(
        NotFoundException
      );
      await expect(service.getVersionHistory('non-existent')).rejects.toThrow(
        'Data object with ID non-existent not found'
      );
    });

    it('should handle null description', async () => {
      const mockDataObject = { id: 'obj-1', name: 'Test Object' };
      const mockVersions = [
        {
          id: 'ver-1',
          version: 1,
          name: 'Version 1',
          description: null,
          dataObjectId: 'obj-1',
          createdAt: new Date(),
          createdBy: 'user-1',
        },
      ];

      prisma.dataObject.findUnique.mockResolvedValue(mockDataObject as any);
      prisma.dataObjectVersion.findMany.mockResolvedValue(mockVersions as any);

      const result = await service.getVersionHistory('obj-1');

      expect(result[0].description).toBeUndefined();
    });
  });

  describe('getVersion', () => {
    it('should return specific version', async () => {
      const mockVersion = {
        id: 'ver-1',
        version: 1,
        name: 'Version 1',
        description: 'Initial version',
        schemaSnapshot: mockSchemaSnapshot,
        dataObjectId: 'obj-1',
        createdAt: new Date(),
        createdBy: 'user-1',
      };

      prisma.dataObjectVersion.findUnique.mockResolvedValue(mockVersion as any);

      const result = await service.getVersion('obj-1', 1);

      expect(result.version).toBe(1);
      expect(result.schemaSnapshot).toEqual(mockSchemaSnapshot);
      expect(prisma.dataObjectVersion.findUnique).toHaveBeenCalledWith({
        where: {
          dataObjectId_version: {
            dataObjectId: 'obj-1',
            version: 1,
          },
        },
      });
    });

    it('should throw NotFoundException when version not found', async () => {
      prisma.dataObjectVersion.findUnique.mockResolvedValue(null);

      await expect(service.getVersion('obj-1', 99)).rejects.toThrow(NotFoundException);
      await expect(service.getVersion('obj-1', 99)).rejects.toThrow(
        'Version 99 not found for data object obj-1'
      );
    });
  });

  describe('getCurrentVersion', () => {
    it('should return latest version number', async () => {
      prisma.dataObjectVersion.findFirst.mockResolvedValue({
        version: 5,
      } as any);

      const result = await service.getCurrentVersion('obj-1');

      expect(result).toBe(5);
      expect(prisma.dataObjectVersion.findFirst).toHaveBeenCalledWith({
        where: { dataObjectId: 'obj-1' },
        orderBy: { version: 'desc' },
        select: { version: true },
      });
    });

    it('should return 1 when no versions exist', async () => {
      prisma.dataObjectVersion.findFirst.mockResolvedValue(null);

      const result = await service.getCurrentVersion('obj-1');

      expect(result).toBe(1);
    });
  });

  describe('compareVersions', () => {
    it('should compare two versions and detect all changes', async () => {
      const snapshot1 = {
        name: 'Old Schema',
        description: 'Old Description',
        fields: [
          {
            id: 'field-1',
            name: 'Field 1',
            fieldKey: 'field1',
            dataType: 'TEXT',
            isMandatory: true,
            isReadOnly: false,
            description: 'Field 1',
            defaultValue: null,
          },
          {
            id: 'field-2',
            name: 'Field 2 Old',
            fieldKey: 'field2',
            dataType: 'NUMBER',
            isMandatory: false,
            isReadOnly: false,
            description: 'Old description',
            defaultValue: 0,
          },
        ],
      };

      const snapshot2 = {
        name: 'New Schema',
        description: 'New Description',
        fields: [
          {
            id: 'field-1',
            name: 'Field 1',
            fieldKey: 'field1',
            dataType: 'TEXT',
            isMandatory: true,
            isReadOnly: false,
            description: 'Field 1',
            defaultValue: null,
          },
          {
            id: 'field-2',
            name: 'Field 2 New',
            fieldKey: 'field2',
            dataType: 'TEXT',
            isMandatory: true,
            isReadOnly: true,
            description: 'New description',
            defaultValue: 'default',
          },
          {
            id: 'field-3',
            name: 'Field 3',
            fieldKey: 'field3',
            dataType: 'DATE',
            isMandatory: false,
            isReadOnly: false,
            description: 'New field',
            defaultValue: null,
          },
        ],
      };

      prisma.dataObjectVersion.findUnique
        .mockResolvedValueOnce({
          id: 'ver-1',
          version: 1,
          schemaSnapshot: snapshot1,
          createdAt: new Date(),
          createdBy: 'user-1',
        } as any)
        .mockResolvedValueOnce({
          id: 'ver-2',
          version: 2,
          schemaSnapshot: snapshot2,
          createdAt: new Date(),
          createdBy: 'user-1',
        } as any);

      const result = await service.compareVersions('obj-1', 1, 2);

      expect(result.changes.nameChanged).toBe(true);
      expect(result.changes.descriptionChanged).toBe(true);
      expect(result.changes.fieldsAdded).toHaveLength(1);
      expect(result.changes.fieldsAdded[0].id).toBe('field-3');
      expect(result.changes.fieldsRemoved).toHaveLength(0);
      expect(result.changes.fieldsModified).toHaveLength(1);
      expect(result.changes.fieldsModified[0].fieldId).toBe('field-2');
      expect(result.changes.fieldsModified[0].changes).toContain('name');
      expect(result.changes.fieldsModified[0].changes).toContain('dataType');
      expect(result.changes.fieldsModified[0].changes).toContain('isMandatory');
      expect(result.changes.fieldsModified[0].changes).toContain('isReadOnly');
      expect(result.changes.fieldsModified[0].changes).toContain('description');
      expect(result.changes.fieldsModified[0].changes).toContain('defaultValue');
    });

    it('should detect no changes when versions are identical', async () => {
      const snapshot = mockSchemaSnapshot;

      prisma.dataObjectVersion.findUnique
        .mockResolvedValueOnce({
          id: 'ver-1',
          version: 1,
          schemaSnapshot: snapshot,
          createdAt: new Date(),
          createdBy: 'user-1',
        } as any)
        .mockResolvedValueOnce({
          id: 'ver-2',
          version: 2,
          schemaSnapshot: snapshot,
          createdAt: new Date(),
          createdBy: 'user-1',
        } as any);

      const result = await service.compareVersions('obj-1', 1, 2);

      expect(result.changes.nameChanged).toBe(false);
      expect(result.changes.descriptionChanged).toBe(false);
      expect(result.changes.fieldsAdded).toHaveLength(0);
      expect(result.changes.fieldsRemoved).toHaveLength(0);
      expect(result.changes.fieldsModified).toHaveLength(0);
    });

    it('should detect removed fields', async () => {
      const snapshot1 = {
        name: 'Schema',
        description: 'Description',
        fields: [
          { id: 'field-1', name: 'Field 1', fieldKey: 'field1', dataType: 'TEXT' },
          { id: 'field-2', name: 'Field 2', fieldKey: 'field2', dataType: 'NUMBER' },
        ],
      };

      const snapshot2 = {
        name: 'Schema',
        description: 'Description',
        fields: [{ id: 'field-1', name: 'Field 1', fieldKey: 'field1', dataType: 'TEXT' }],
      };

      prisma.dataObjectVersion.findUnique
        .mockResolvedValueOnce({
          id: 'ver-1',
          version: 1,
          schemaSnapshot: snapshot1,
          createdAt: new Date(),
          createdBy: 'user-1',
        } as any)
        .mockResolvedValueOnce({
          id: 'ver-2',
          version: 2,
          schemaSnapshot: snapshot2,
          createdAt: new Date(),
          createdBy: 'user-1',
        } as any);

      const result = await service.compareVersions('obj-1', 1, 2);

      expect(result.changes.fieldsRemoved).toHaveLength(1);
      expect(result.changes.fieldsRemoved[0].id).toBe('field-2');
    });
  });

  describe('getSchemaAtVersion', () => {
    it('should return schema snapshot at specific version', async () => {
      const mockVersion = {
        id: 'ver-1',
        version: 1,
        name: 'Version 1',
        description: 'Description',
        schemaSnapshot: mockSchemaSnapshot,
        dataObjectId: 'obj-1',
        createdAt: new Date(),
        createdBy: 'user-1',
      };

      prisma.dataObjectVersion.findUnique.mockResolvedValue(mockVersion as any);

      const result = await service.getSchemaAtVersion('obj-1', 1);

      expect(result).toEqual(mockSchemaSnapshot);
    });
  });
});
