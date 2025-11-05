import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { Reflector } from '@nestjs/core';
import { DynamicController } from './dynamic.controller';
import { SchemaService } from '../services/schema.service';
import { InstanceService } from '../services/instance.service';
import { ValidationService } from '../services/validation.service';
import { ExportService } from '../services/export.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { DynamicPermissionGuard } from '../guards/dynamic-permission.guard';
import { PrismaService } from '../../database/prisma.service';

describe('DynamicController', () => {
  let controller: DynamicController;
  let schemaService: jest.Mocked<SchemaService>;
  let instanceService: jest.Mocked<InstanceService>;
  let validationService: jest.Mocked<ValidationService>;
  let exportService: jest.Mocked<ExportService>;

  const mockSchema = {
    dataObjectId: 'obj-123',
    version: 1,
    fields: [
      { id: 'field-1', fieldKey: 'name', dataType: 'TEXT' },
      { id: 'field-2', fieldKey: 'email', dataType: 'EMAIL' },
    ],
  };

  const mockInstance = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    dataObjectId: 'obj-123',
    values: { name: 'John Doe', email: 'john@example.com' },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRequest = {
    user: {
      id: 'user-123',
      email: 'user@example.com',
      roles: ['USER'],
    },
  };

  beforeEach(async () => {
    const mockSchemaService = {
      getSchema: jest.fn(),
    };

    const mockInstanceService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      getHistory: jest.fn(),
    };

    const mockValidationService = {
      validate: jest.fn(),
    };

    const mockExportService = {
      exportToCSV: jest.fn(),
      exportToJSON: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DynamicController],
      providers: [
        { provide: SchemaService, useValue: mockSchemaService },
        { provide: InstanceService, useValue: mockInstanceService },
        { provide: ValidationService, useValue: mockValidationService },
        { provide: ExportService, useValue: mockExportService },
        {
          provide: PrismaService,
          useValue: {
            dataObject: { findFirst: jest.fn() },
            permission: { findMany: jest.fn() },
          },
        },
        Reflector,
        JwtAuthGuard,
        DynamicPermissionGuard,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(DynamicPermissionGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<DynamicController>(DynamicController);
    schemaService = module.get(SchemaService) as any;
    instanceService = module.get(InstanceService) as any;
    validationService = module.get(ValidationService) as any;
    exportService = module.get(ExportService) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSchema', () => {
    it('should return schema for data key', async () => {
      schemaService.getSchema.mockResolvedValue(mockSchema as any);

      const result = await controller.getSchema('fund', mockRequest);

      expect(result).toEqual(mockSchema);
      expect(schemaService.getSchema).toHaveBeenCalledWith('fund', 'user-123');
    });
  });

  describe('create', () => {
    it('should create instance successfully', async () => {
      const createDto = { values: { name: 'John Doe', email: 'john@example.com' } };

      schemaService.getSchema.mockResolvedValue(mockSchema as any);
      validationService.validate.mockResolvedValue({ isValid: true, errors: [] });
      instanceService.create.mockResolvedValue(mockInstance as any);

      const result = await controller.create('fund', createDto, mockRequest);

      expect(result).toEqual(mockInstance);
      expect(schemaService.getSchema).toHaveBeenCalledWith('fund');
      expect(validationService.validate).toHaveBeenCalledWith(mockSchema, createDto.values);
      expect(instanceService.create).toHaveBeenCalledWith('fund', createDto.values, 'user-123');
    });

    it('should throw BadRequestException if validation fails', async () => {
      const createDto = { values: { name: '', email: 'invalid' } };

      schemaService.getSchema.mockResolvedValue(mockSchema as any);
      validationService.validate.mockResolvedValue({
        isValid: false,
        errors: ['Name is required', 'Invalid email format'],
      });

      await expect(controller.create('fund', createDto, mockRequest)).rejects.toThrow(
        BadRequestException,
      );

      expect(instanceService.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated instances', async () => {
      const query = { page: 1, limit: 10 };
      const mockResult = {
        items: [mockInstance],
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      };

      instanceService.findAll.mockResolvedValue(mockResult as any);

      const result = await controller.findAll('fund', query);

      expect(result).toEqual(mockResult);
      expect(instanceService.findAll).toHaveBeenCalledWith('fund', query);
    });

    it('should support search parameter', async () => {
      const query = { page: 1, limit: 10, search: 'John' };
      instanceService.findAll.mockResolvedValue({
        items: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      } as any);

      await controller.findAll('fund', query);

      expect(instanceService.findAll).toHaveBeenCalledWith('fund', query);
    });

    it('should support sorting parameters', async () => {
      const query = { page: 1, limit: 10, sortBy: 'name', sortOrder: 'desc' as const };
      instanceService.findAll.mockResolvedValue({
        items: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      } as any);

      await controller.findAll('fund', query);

      expect(instanceService.findAll).toHaveBeenCalledWith('fund', query);
    });
  });

  describe('findOne', () => {
    it('should return single instance by ID', async () => {
      instanceService.findOne.mockResolvedValue(mockInstance as any);

      const result = await controller.findOne('fund', mockInstance.id);

      expect(result).toEqual(mockInstance);
      expect(instanceService.findOne).toHaveBeenCalledWith('fund', mockInstance.id);
    });
  });

  describe('update', () => {
    it('should update instance successfully', async () => {
      const updateDto = { values: { name: 'Jane Doe' } };
      const updatedInstance = { ...mockInstance, values: { ...mockInstance.values, name: 'Jane Doe' } };

      schemaService.getSchema.mockResolvedValue(mockSchema as any);
      validationService.validate.mockResolvedValue({ isValid: true, errors: [] });
      instanceService.update.mockResolvedValue(updatedInstance as any);

      const result = await controller.update('fund', mockInstance.id, updateDto, mockRequest);

      expect(result).toEqual(updatedInstance);
      expect(schemaService.getSchema).toHaveBeenCalledWith('fund');
      expect(validationService.validate).toHaveBeenCalledWith(mockSchema, updateDto.values);
      expect(instanceService.update).toHaveBeenCalledWith(
        'fund',
        mockInstance.id,
        updateDto.values,
        'user-123',
      );
    });

    it('should throw BadRequestException if validation fails', async () => {
      const updateDto = { values: { email: 'invalid-email' } };

      schemaService.getSchema.mockResolvedValue(mockSchema as any);
      validationService.validate.mockResolvedValue({
        isValid: false,
        errors: ['Invalid email format'],
      });

      await expect(
        controller.update('fund', mockInstance.id, updateDto, mockRequest),
      ).rejects.toThrow(BadRequestException);

      expect(instanceService.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete instance successfully', async () => {
      instanceService.remove.mockResolvedValue(undefined);

      await controller.remove('fund', mockInstance.id, mockRequest);

      expect(instanceService.remove).toHaveBeenCalledWith('fund', mockInstance.id, 'user-123');
    });
  });

  describe('search', () => {
    it('should perform advanced search', async () => {
      const searchDto = {
        page: 1,
        limit: 20,
        sortBy: 'name',
        sortOrder: 'asc' as const,
        filters: [
          { fieldKey: 'status', operator: 'equals', value: 'active' },
        ],
      };

      const mockResult = {
        items: [mockInstance],
        pagination: {
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      };

      instanceService.findAll.mockResolvedValue(mockResult as any);

      const result = await controller.search('fund', searchDto);

      expect(result).toEqual(mockResult);
      expect(instanceService.findAll).toHaveBeenCalledWith('fund', {
        page: 1,
        limit: 20,
        sortBy: 'name',
        sortOrder: 'asc',
        filters: { status: { equals: 'active' } },
      });
    });

    it('should handle between operator in filters', async () => {
      const searchDto = {
        page: 1,
        limit: 20,
        filters: [
          { fieldKey: 'amount', operator: 'between', value: [100, 500] },
        ],
      };

      instanceService.findAll.mockResolvedValue({
        items: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      } as any);

      await controller.search('fund', searchDto);

      expect(instanceService.findAll).toHaveBeenCalledWith('fund', {
        page: 1,
        limit: 20,
        filters: { amount: { gte: 100, lte: 500 } },
      });
    });

    it('should work without filters', async () => {
      const searchDto = {
        page: 1,
        limit: 20,
      };

      instanceService.findAll.mockResolvedValue({
        items: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      } as any);

      await controller.search('fund', searchDto);

      expect(instanceService.findAll).toHaveBeenCalledWith('fund', {
        page: 1,
        limit: 20,
        filters: undefined,
      });
    });
  });

  describe('exportCSV', () => {
    it('should export instances to CSV', async () => {
      const query = { page: 1, limit: 100 };
      const mockCSV = 'id,name,email\n1,John Doe,john@example.com';

      exportService.exportToCSV.mockResolvedValue(mockCSV);

      const mockResponse = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      await controller.exportCSV('fund', query, mockResponse);

      expect(exportService.exportToCSV).toHaveBeenCalledWith('fund', query);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="fund_export.csv"',
      );
      expect(mockResponse.send).toHaveBeenCalledWith(mockCSV);
    });
  });

  describe('exportJSON', () => {
    it('should export instances to JSON', async () => {
      const query = { page: 1, limit: 100 };
      const mockJSON = [mockInstance];

      exportService.exportToJSON.mockResolvedValue(mockJSON);

      const result = await controller.exportJSON('fund', query);

      expect(result).toEqual(mockJSON);
      expect(exportService.exportToJSON).toHaveBeenCalledWith('fund', query);
    });
  });

  describe('getHistory', () => {
    it('should return change history for instance', async () => {
      const mockHistory = [
        {
          id: 'log-1',
          instanceId: mockInstance.id,
          changeType: 'CREATE',
          changedAt: new Date(),
          changedBy: 'user-123',
        },
        {
          id: 'log-2',
          instanceId: mockInstance.id,
          changeType: 'UPDATE',
          fieldId: 'field-1',
          oldValue: 'Old Name',
          newValue: 'New Name',
          changedAt: new Date(),
          changedBy: 'user-456',
        },
      ];

      instanceService.getHistory.mockResolvedValue(mockHistory);

      const result = await controller.getHistory('fund', mockInstance.id);

      expect(result).toEqual(mockHistory);
      expect(instanceService.getHistory).toHaveBeenCalledWith('fund', mockInstance.id);
    });
  });

  describe('convertFiltersToObject', () => {
    it('should convert equals filter', async () => {
      const searchDto = {
        page: 1,
        limit: 20,
        filters: [{ fieldKey: 'status', operator: 'equals', value: 'active' }],
      };

      instanceService.findAll.mockResolvedValue({
        items: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      } as any);

      await controller.search('fund', searchDto);

      expect(instanceService.findAll).toHaveBeenCalledWith(
        'fund',
        expect.objectContaining({
          filters: { status: { equals: 'active' } },
        }),
      );
    });

    it('should convert multiple filters', async () => {
      const searchDto = {
        page: 1,
        limit: 20,
        filters: [
          { fieldKey: 'status', operator: 'equals', value: 'active' },
          { fieldKey: 'amount', operator: 'gte', value: 1000 },
        ],
      };

      instanceService.findAll.mockResolvedValue({
        items: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      } as any);

      await controller.search('fund', searchDto);

      expect(instanceService.findAll).toHaveBeenCalledWith(
        'fund',
        expect.objectContaining({
          filters: {
            status: { equals: 'active' },
            amount: { gte: 1000 },
          },
        }),
      );
    });
  });
});
