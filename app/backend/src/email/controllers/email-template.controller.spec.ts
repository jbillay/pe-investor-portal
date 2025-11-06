import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { EmailTemplateController } from './email-template.controller';
import { EmailTemplateService } from '../services/email-template.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../guards/super-admin.guard';

describe('EmailTemplateController', () => {
  let controller: EmailTemplateController;
  let templateService: jest.Mocked<EmailTemplateService>;

  const mockUser = {
    id: 'user-123',
    email: 'admin@example.com',
    roles: ['SUPER_ADMIN'],
  };

  const mockTemplate = {
    id: 'template-123',
    name: 'Welcome Email',
    subject: 'Welcome to {{companyName}}',
    htmlBody: '<h1>Welcome {{userName}}</h1>',
    textBody: 'Welcome {{userName}}',
    category: 'USER',
    variableSchema: [
      { name: 'userName', type: 'string', required: true },
      { name: 'companyName', type: 'string', required: true },
    ],
    isSystem: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockTemplateService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      duplicate: jest.fn(),
      preview: jest.fn(),
      getCategories: jest.fn(),
      getVariableSchema: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailTemplateController],
      providers: [
        { provide: EmailTemplateService, useValue: mockTemplateService },
        Reflector,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(SuperAdminGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<EmailTemplateController>(EmailTemplateController);
    templateService = module.get(EmailTemplateService) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new template', async () => {
      const createDto = {
        name: 'Welcome Email',
        subject: 'Welcome to {{companyName}}',
        htmlBody: '<h1>Welcome {{userName}}</h1>',
        textBody: 'Welcome {{userName}}',
        category: 'USER',
        variableSchema: [
          { name: 'userName', type: 'string', required: true },
          { name: 'companyName', type: 'string', required: true },
        ],
      };

      templateService.create.mockResolvedValue(mockTemplate as any);

      const result = await controller.create(createDto as any, mockUser as any);

      expect(result).toEqual(mockTemplate);
      expect(templateService.create).toHaveBeenCalledWith(createDto, 'user-123');
    });
  });

  describe('findAll', () => {
    it('should return paginated templates', async () => {
      const query = { page: 1, limit: 20, category: 'USER' };
      const mockResponse = {
        data: [mockTemplate],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      };

      templateService.findAll.mockResolvedValue(mockResponse as any);

      const result = await controller.findAll(query as any);

      expect(result).toEqual(mockResponse);
      expect(templateService.findAll).toHaveBeenCalledWith(query);
    });

    it('should return templates without filters', async () => {
      const query = {};
      const mockResponse = {
        data: [mockTemplate],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      };

      templateService.findAll.mockResolvedValue(mockResponse as any);

      const result = await controller.findAll(query as any);

      expect(result).toEqual(mockResponse);
      expect(templateService.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should return a single template by ID', async () => {
      templateService.findOne.mockResolvedValue(mockTemplate as any);

      const result = await controller.findOne('template-123');

      expect(result).toEqual(mockTemplate);
      expect(templateService.findOne).toHaveBeenCalledWith('template-123');
    });
  });

  describe('update', () => {
    it('should update a template', async () => {
      const updateDto = {
        subject: 'Updated Subject',
        htmlBody: '<h1>Updated Content</h1>',
      };

      const updatedTemplate = {
        ...mockTemplate,
        ...updateDto,
      };

      templateService.update.mockResolvedValue(updatedTemplate as any);

      const result = await controller.update('template-123', updateDto as any, mockUser as any);

      expect(result).toEqual(updatedTemplate);
      expect(templateService.update).toHaveBeenCalledWith('template-123', updateDto, 'user-123');
    });
  });

  describe('delete', () => {
    it('should delete a template', async () => {
      templateService.delete.mockResolvedValue(undefined);

      await controller.delete('template-123');

      expect(templateService.delete).toHaveBeenCalledWith('template-123');
    });
  });

  describe('duplicate', () => {
    it('should duplicate a template', async () => {
      const duplicatedTemplate = {
        ...mockTemplate,
        id: 'template-456',
        name: 'Welcome Email (Copy)',
      };

      templateService.duplicate.mockResolvedValue(duplicatedTemplate as any);

      const result = await controller.duplicate('template-123', mockUser as any);

      expect(result).toEqual(duplicatedTemplate);
      expect(templateService.duplicate).toHaveBeenCalledWith('template-123', 'user-123');
    });
  });

  describe('preview', () => {
    it('should preview a template with variables', async () => {
      const previewDto = {
        variables: {
          userName: 'John Doe',
          companyName: 'Acme Corp',
        },
      };

      const mockPreview = {
        subject: 'Welcome to Acme Corp',
        htmlBody: '<h1>Welcome John Doe</h1>',
        textBody: 'Welcome John Doe',
      };

      templateService.preview.mockResolvedValue(mockPreview);

      const result = await controller.preview('template-123', previewDto as any);

      expect(result).toEqual(mockPreview);
      expect(templateService.preview).toHaveBeenCalledWith('template-123', previewDto.variables);
    });

    it('should preview a template without variables', async () => {
      const previewDto = {};

      const mockPreview = {
        subject: 'Welcome to {{companyName}}',
        htmlBody: '<h1>Welcome {{userName}}</h1>',
        textBody: 'Welcome {{userName}}',
      };

      templateService.preview.mockResolvedValue(mockPreview);

      const result = await controller.preview('template-123', previewDto as any);

      expect(result).toEqual(mockPreview);
      expect(templateService.preview).toHaveBeenCalledWith('template-123', {});
    });
  });

  describe('sendTest', () => {
    it('should send a test email', async () => {
      const testDto = {
        recipientEmail: 'test@example.com',
        variables: {
          userName: 'Test User',
          companyName: 'Test Corp',
        },
      };

      templateService.findOne.mockResolvedValue(mockTemplate as any);

      const result = await controller.sendTest('template-123', testDto as any, mockUser as any);

      expect(result).toEqual({
        success: true,
        message: 'Test email would be sent to test@example.com',
        templateName: 'Welcome Email',
      });
      expect(templateService.findOne).toHaveBeenCalledWith('template-123');
    });
  });

  describe('getCategories', () => {
    it('should return available template categories', async () => {
      const mockCategories = ['USER', 'ADMIN', 'NOTIFICATION', 'SYSTEM'];

      templateService.getCategories.mockResolvedValue(mockCategories);

      const result = await controller.getCategories();

      expect(result).toEqual(mockCategories);
      expect(templateService.getCategories).toHaveBeenCalled();
    });
  });

  describe('getVariableSchema', () => {
    it('should return variable schema for a template', async () => {
      const mockSchema = [
        {
          name: 'userName',
          type: 'string',
          required: true,
          description: 'User full name',
          example: 'John Doe',
        },
        {
          name: 'companyName',
          type: 'string',
          required: true,
          description: 'Company name',
          example: 'Acme Corp',
        },
      ];

      templateService.getVariableSchema.mockResolvedValue(mockSchema);

      const result = await controller.getVariableSchema('template-123');

      expect(result).toEqual(mockSchema);
      expect(templateService.getVariableSchema).toHaveBeenCalledWith('template-123');
    });
  });

  describe('error handling', () => {
    it('should handle service errors in create', async () => {
      const createDto = { name: 'Test', subject: 'Test', htmlBody: 'Test' };
      templateService.create.mockRejectedValue(new Error('Database error'));

      await expect(controller.create(createDto as any, mockUser as any)).rejects.toThrow(
        'Database error',
      );
    });

    it('should handle service errors in findOne', async () => {
      templateService.findOne.mockRejectedValue(new Error('Not found'));

      await expect(controller.findOne('invalid-id')).rejects.toThrow('Not found');
    });

    it('should handle service errors in update', async () => {
      const updateDto = { subject: 'Updated' };
      templateService.update.mockRejectedValue(new Error('Update failed'));

      await expect(
        controller.update('template-123', updateDto as any, mockUser as any),
      ).rejects.toThrow('Update failed');
    });

    it('should handle service errors in delete', async () => {
      templateService.delete.mockRejectedValue(new Error('Cannot delete system template'));

      await expect(controller.delete('template-123')).rejects.toThrow(
        'Cannot delete system template',
      );
    });

    it('should handle service errors in duplicate', async () => {
      templateService.duplicate.mockRejectedValue(new Error('Template not found'));

      await expect(controller.duplicate('invalid-id', mockUser as any)).rejects.toThrow(
        'Template not found',
      );
    });

    it('should handle service errors in preview', async () => {
      const previewDto = { variables: {} };
      templateService.preview.mockRejectedValue(new Error('Invalid variables'));

      await expect(controller.preview('template-123', previewDto as any)).rejects.toThrow(
        'Invalid variables',
      );
    });
  });
});
