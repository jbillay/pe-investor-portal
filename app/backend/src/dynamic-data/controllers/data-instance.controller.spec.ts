import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataInstanceController } from './data-instance.controller';
import { SchemaService } from '../services/schema.service';
import { InstanceService } from '../services/instance.service';
import { ValidationService } from '../services/validation.service';
import { PrismaService } from '../../database/prisma.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

describe('DataInstanceController', () => {
  let controller: DataInstanceController;
  let schemaService: jest.Mocked<SchemaService>;
  let instanceService: jest.Mocked<InstanceService>;
  let validationService: jest.Mocked<ValidationService>;
  let prismaService: jest.Mocked<PrismaService>;

  const mockSchema = {
    dataObjectId: 'obj-123',
    version: 1,
    fields: [
      { id: 'field-1', fieldKey: 'name', dataType: 'TEXT' },
      { id: 'field-2', fieldKey: 'email', dataType: 'EMAIL' },
    ],
  };

  const mockDataObject = {
    id: 'obj-123',
    dataKey: 'fund',
  };

  const mockInstance = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    dataObjectId: 'obj-123',
    values: { name: 'Test Fund', email: 'fund@example.com' },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRequest = {
    user: {
      id: 'user-123',
      email: 'user@example.com',
    },
  };

  beforeEach(async () => {
    const mockSchemaService = {
      getSchemaById: jest.fn(),
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

    const mockPrismaService = {
      dataObject: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DataInstanceController],
      providers: [
        { provide: SchemaService, useValue: mockSchemaService },
        { provide: InstanceService, useValue: mockInstanceService },
        { provide: ValidationService, useValue: mockValidationService },
        { provide: PrismaService, useValue: mockPrismaService },
        Reflector,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<DataInstanceController>(DataInstanceController);
    schemaService = module.get(SchemaService) as any;
    instanceService = module.get(InstanceService) as any;
    validationService = module.get(ValidationService) as any;
    prismaService = module.get(PrismaService) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSchema', () => {
    it('should return schema by data object ID', async () => {
      schemaService.getSchemaById.mockResolvedValue(mockSchema as any);

      const result = await controller.getSchema('obj-123', mockRequest);

      expect(result).toEqual(mockSchema);
      expect(schemaService.getSchemaById).toHaveBeenCalledWith('obj-123');
    });
  });

  describe('create', () => {
    it('should create instance successfully', async () => {
      const createDto = { values: { name: 'Test Fund', email: 'fund@example.com' } };

      (prismaService.dataObject.findUnique as jest.Mock).mockResolvedValue(mockDataObject);
      schemaService.getSchemaById.mockResolvedValue(mockSchema as any);
      validationService.validate.mockResolvedValue({ isValid: true, errors: [] });
      instanceService.create.mockResolvedValue(mockInstance as any);

      const result = await controller.create('obj-123', createDto, mockRequest);

      expect(result).toEqual(mockInstance);
      expect(prismaService.dataObject.findUnique).toHaveBeenCalledWith({
        where: { id: 'obj-123' },
        select: { dataKey: true },
      });
      expect(schemaService.getSchemaById).toHaveBeenCalledWith('obj-123');
      expect(validationService.validate).toHaveBeenCalledWith(mockSchema, createDto.values);
      expect(instanceService.create).toHaveBeenCalledWith('fund', createDto.values, 'user-123');
    });

    it('should throw BadRequestException if data object not found', async () => {
      const createDto = { values: { name: 'Test' } };

      (prismaService.dataObject.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(controller.create('obj-invalid', createDto, mockRequest)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if validation fails', async () => {
      const createDto = { values: { name: '', email: 'invalid' } };

      (prismaService.dataObject.findUnique as jest.Mock).mockResolvedValue(mockDataObject);
      schemaService.getSchemaById.mockResolvedValue(mockSchema as any);
      validationService.validate.mockResolvedValue({
        isValid: false,
        errors: ['Name is required'],
      });

      await expect(controller.create('obj-123', createDto, mockRequest)).rejects.toThrow(
        BadRequestException,
      );
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

      (prismaService.dataObject.findUnique as jest.Mock).mockResolvedValue(mockDataObject);
      instanceService.findAll.mockResolvedValue(mockResult as any);

      const result = await controller.findAll('obj-123', query);

      expect(result).toEqual(mockResult);
      expect(instanceService.findAll).toHaveBeenCalledWith('fund', query);
    });

    it('should throw BadRequestException if data object not found', async () => {
      const query = { page: 1, limit: 10 };

      (prismaService.dataObject.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(controller.findAll('obj-invalid', query)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findOne', () => {
    it('should return single instance by ID', async () => {
      (prismaService.dataObject.findUnique as jest.Mock).mockResolvedValue(mockDataObject);
      instanceService.findOne.mockResolvedValue(mockInstance as any);

      const result = await controller.findOne('obj-123', mockInstance.id);

      expect(result).toEqual(mockInstance);
      expect(instanceService.findOne).toHaveBeenCalledWith('fund', mockInstance.id);
    });
  });

  describe('update', () => {
    it('should update instance successfully', async () => {
      const updateDto = { values: { name: 'Updated Fund' } };
      const updatedInstance = { ...mockInstance, values: { ...mockInstance.values, name: 'Updated Fund' } };

      (prismaService.dataObject.findUnique as jest.Mock).mockResolvedValue(mockDataObject);
      schemaService.getSchemaById.mockResolvedValue(mockSchema as any);
      validationService.validate.mockResolvedValue({ isValid: true, errors: [] });
      instanceService.update.mockResolvedValue(updatedInstance as any);

      const result = await controller.update('obj-123', mockInstance.id, updateDto, mockRequest);

      expect(result).toEqual(updatedInstance);
      expect(instanceService.update).toHaveBeenCalledWith(
        'fund',
        mockInstance.id,
        updateDto.values,
        'user-123',
      );
    });

    it('should throw BadRequestException if validation fails', async () => {
      const updateDto = { values: { email: 'invalid-email' } };

      (prismaService.dataObject.findUnique as jest.Mock).mockResolvedValue(mockDataObject);
      schemaService.getSchemaById.mockResolvedValue(mockSchema as any);
      validationService.validate.mockResolvedValue({
        isValid: false,
        errors: ['Invalid email format'],
      });

      await expect(
        controller.update('obj-123', mockInstance.id, updateDto, mockRequest),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should delete instance successfully', async () => {
      (prismaService.dataObject.findUnique as jest.Mock).mockResolvedValue(mockDataObject);
      instanceService.remove.mockResolvedValue(undefined);

      await controller.remove('obj-123', mockInstance.id, mockRequest);

      expect(instanceService.remove).toHaveBeenCalledWith('fund', mockInstance.id, 'user-123');
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
        },
      ];

      (prismaService.dataObject.findUnique as jest.Mock).mockResolvedValue(mockDataObject);
      instanceService.getHistory.mockResolvedValue(mockHistory);

      const result = await controller.getHistory('obj-123', mockInstance.id);

      expect(result).toEqual(mockHistory);
      expect(instanceService.getHistory).toHaveBeenCalledWith('fund', mockInstance.id);
    });
  });
});
