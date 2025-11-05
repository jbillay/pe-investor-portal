import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { DataObjectController } from './data-object.controller';
import { DataObjectService } from '../services/data-object.service';
import { FieldService } from '../services/field.service';
import { VersioningService } from '../services/versioning.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

describe('DataObjectController', () => {
  let controller: DataObjectController;
  let dataObjectService: jest.Mocked<DataObjectService>;
  let fieldService: jest.Mocked<FieldService>;
  let versioningService: jest.Mocked<VersioningService>;

  const mockUser = {
    id: 'user-123',
    email: 'admin@example.com',
    roles: ['ADMIN'],
  };

  const mockRequest = { user: mockUser };

  const mockDataObject = {
    id: 'obj-123',
    dataKey: 'fund',
    name: 'Investment Fund',
    description: 'Fund information',
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    fields: [],
  };

  const mockField = {
    id: 'field-123',
    fieldKey: 'fundName',
    label: 'Fund Name',
    dataType: 'TEXT',
    required: true,
  };

  beforeEach(async () => {
    const mockDataObjectService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const mockFieldService = {
      addField: jest.fn(),
      updateField: jest.fn(),
      deleteField: jest.fn(),
    };

    const mockVersioningService = {
      getVersionHistory: jest.fn(),
      getVersion: jest.fn(),
      compareVersions: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DataObjectController],
      providers: [
        { provide: DataObjectService, useValue: mockDataObjectService },
        { provide: FieldService, useValue: mockFieldService },
        { provide: VersioningService, useValue: mockVersioningService },
        Reflector,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<DataObjectController>(DataObjectController);
    dataObjectService = module.get(DataObjectService) as any;
    fieldService = module.get(FieldService) as any;
    versioningService = module.get(VersioningService) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new data object', async () => {
      const createDto = {
        dataKey: 'fund',
        name: 'Investment Fund',
        description: 'Fund information',
      };

      dataObjectService.create.mockResolvedValue(mockDataObject as any);

      const result = await controller.create(createDto as any, mockRequest);

      expect(result).toEqual(mockDataObject);
      expect(dataObjectService.create).toHaveBeenCalledWith(createDto, 'user-123');
    });
  });

  describe('findAll', () => {
    it('should return all data objects', async () => {
      const mockDataObjects = [mockDataObject];

      dataObjectService.findAll.mockResolvedValue(mockDataObjects as any);

      const result = await controller.findAll();

      expect(result).toEqual(mockDataObjects);
      expect(dataObjectService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single data object by ID', async () => {
      dataObjectService.findOne.mockResolvedValue(mockDataObject as any);

      const result = await controller.findOne('obj-123');

      expect(result).toEqual(mockDataObject);
      expect(dataObjectService.findOne).toHaveBeenCalledWith('obj-123');
    });
  });

  describe('update', () => {
    it('should update a data object', async () => {
      const updateDto = {
        name: 'Updated Fund Name',
        description: 'Updated description',
      };

      const updatedDataObject = {
        ...mockDataObject,
        ...updateDto,
        version: 2,
      };

      dataObjectService.update.mockResolvedValue(updatedDataObject as any);

      const result = await controller.update('obj-123', updateDto as any, mockRequest);

      expect(result).toEqual(updatedDataObject);
      expect(dataObjectService.update).toHaveBeenCalledWith('obj-123', updateDto, 'user-123');
    });
  });

  describe('remove', () => {
    it('should delete a data object', async () => {
      dataObjectService.remove.mockResolvedValue(undefined);

      await controller.remove('obj-123');

      expect(dataObjectService.remove).toHaveBeenCalledWith('obj-123');
    });
  });

  describe('addField', () => {
    it('should add a field to data object', async () => {
      const fieldDto = {
        fieldKey: 'fundName',
        label: 'Fund Name',
        dataType: 'TEXT',
        required: true,
      };

      fieldService.addField.mockResolvedValue(mockField as any);

      const result = await controller.addField('obj-123', fieldDto as any, mockRequest);

      expect(result).toEqual(mockField);
      expect(fieldService.addField).toHaveBeenCalledWith('obj-123', fieldDto, 'user-123');
    });
  });

  describe('updateField', () => {
    it('should update a field', async () => {
      const updateDto = {
        label: 'Updated Fund Name',
        required: false,
      };

      const updatedField = {
        ...mockField,
        ...updateDto,
      };

      fieldService.updateField.mockResolvedValue(updatedField as any);

      const result = await controller.updateField(
        'obj-123',
        'field-123',
        updateDto as any,
        mockRequest,
      );

      expect(result).toEqual(updatedField);
      expect(fieldService.updateField).toHaveBeenCalledWith(
        'obj-123',
        'field-123',
        updateDto,
        'user-123',
      );
    });
  });

  describe('deleteField', () => {
    it('should delete a field', async () => {
      fieldService.deleteField.mockResolvedValue(undefined);

      await controller.deleteField('obj-123', 'field-123', mockRequest);

      expect(fieldService.deleteField).toHaveBeenCalledWith('obj-123', 'field-123', 'user-123');
    });
  });

  describe('getVersionHistory', () => {
    it('should return version history for data object', async () => {
      const mockVersionHistory = [
        {
          version: 2,
          createdAt: new Date(),
          createdBy: 'user-456',
          changes: 'Updated name',
        },
        {
          version: 1,
          createdAt: new Date(),
          createdBy: 'user-123',
          changes: 'Initial version',
        },
      ];

      versioningService.getVersionHistory.mockResolvedValue(mockVersionHistory);

      const result = await controller.getVersionHistory('obj-123');

      expect(result).toEqual(mockVersionHistory);
      expect(versioningService.getVersionHistory).toHaveBeenCalledWith('obj-123');
    });
  });

  describe('getVersion', () => {
    it('should return specific version schema', async () => {
      const mockVersion = {
        version: 1,
        dataObjectId: 'obj-123',
        fields: [mockField],
        createdAt: new Date(),
      };

      versioningService.getVersion.mockResolvedValue(mockVersion as any);

      const result = await controller.getVersion('obj-123', '1');

      expect(result).toEqual(mockVersion);
      expect(versioningService.getVersion).toHaveBeenCalledWith('obj-123', 1);
    });

    it('should parse version parameter as integer', async () => {
      const mockVersion = {
        version: 5,
        dataObjectId: 'obj-123',
        fields: [],
        createdAt: new Date(),
      };

      versioningService.getVersion.mockResolvedValue(mockVersion as any);

      await controller.getVersion('obj-123', '5');

      expect(versioningService.getVersion).toHaveBeenCalledWith('obj-123', 5);
    });
  });

  describe('compareVersions', () => {
    it('should compare two versions', async () => {
      const mockComparison = {
        version1: 1,
        version2: 2,
        differences: {
          fieldsAdded: ['newField'],
          fieldsRemoved: [],
          fieldsModified: ['existingField'],
        },
      };

      versioningService.compareVersions.mockResolvedValue(mockComparison as any);

      const result = await controller.compareVersions('obj-123', '1', '2');

      expect(result).toEqual(mockComparison);
      expect(versioningService.compareVersions).toHaveBeenCalledWith('obj-123', 1, 2);
    });

    it('should parse version parameters as integers', async () => {
      const mockComparison = {
        version1: 3,
        version2: 7,
        differences: {},
      };

      versioningService.compareVersions.mockResolvedValue(mockComparison as any);

      await controller.compareVersions('obj-123', '3', '7');

      expect(versioningService.compareVersions).toHaveBeenCalledWith('obj-123', 3, 7);
    });
  });

  describe('error handling', () => {
    it('should handle errors in create', async () => {
      const createDto = { dataKey: 'test', name: 'Test' };
      dataObjectService.create.mockRejectedValue(new Error('Creation failed'));

      await expect(controller.create(createDto as any, mockRequest)).rejects.toThrow(
        'Creation failed',
      );
    });

    it('should handle errors in findOne', async () => {
      dataObjectService.findOne.mockRejectedValue(new Error('Not found'));

      await expect(controller.findOne('invalid-id')).rejects.toThrow('Not found');
    });

    it('should handle errors in update', async () => {
      const updateDto = { name: 'Updated' };
      dataObjectService.update.mockRejectedValue(new Error('Update failed'));

      await expect(controller.update('obj-123', updateDto as any, mockRequest)).rejects.toThrow(
        'Update failed',
      );
    });

    it('should handle errors in remove', async () => {
      dataObjectService.remove.mockRejectedValue(new Error('Cannot delete with instances'));

      await expect(controller.remove('obj-123')).rejects.toThrow('Cannot delete with instances');
    });

    it('should handle errors in addField', async () => {
      const fieldDto = { fieldKey: 'test', label: 'Test', dataType: 'TEXT' };
      fieldService.addField.mockRejectedValue(new Error('Field already exists'));

      await expect(controller.addField('obj-123', fieldDto as any, mockRequest)).rejects.toThrow(
        'Field already exists',
      );
    });

    it('should handle errors in updateField', async () => {
      const updateDto = { label: 'Updated' };
      fieldService.updateField.mockRejectedValue(new Error('Field not found'));

      await expect(
        controller.updateField('obj-123', 'field-123', updateDto as any, mockRequest),
      ).rejects.toThrow('Field not found');
    });

    it('should handle errors in deleteField', async () => {
      fieldService.deleteField.mockRejectedValue(new Error('Cannot delete required field'));

      await expect(controller.deleteField('obj-123', 'field-123', mockRequest)).rejects.toThrow(
        'Cannot delete required field',
      );
    });

    it('should handle errors in getVersionHistory', async () => {
      versioningService.getVersionHistory.mockRejectedValue(new Error('History not found'));

      await expect(controller.getVersionHistory('obj-123')).rejects.toThrow('History not found');
    });

    it('should handle errors in getVersion', async () => {
      versioningService.getVersion.mockRejectedValue(new Error('Version not found'));

      await expect(controller.getVersion('obj-123', '1')).rejects.toThrow('Version not found');
    });

    it('should handle errors in compareVersions', async () => {
      versioningService.compareVersions.mockRejectedValue(new Error('Compare failed'));

      await expect(controller.compareVersions('obj-123', '1', '2')).rejects.toThrow(
        'Compare failed',
      );
    });
  });
});
