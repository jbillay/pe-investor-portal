import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { EmailTemplateService } from './email-template.service';
import { PrismaService } from '../../database/prisma.service';
import { TemplateCacheService } from './template-cache.service';
import { TemplateRendererService } from './template-renderer.service';
import { EmailCategory } from '../interfaces/email-template.interface';
import {
  CreateEmailTemplateDto,
  UpdateEmailTemplateDto,
  QueryEmailTemplatesDto,
} from '../dto/email-template.dto';

describe('EmailTemplateService', () => {
  let service: EmailTemplateService;
  let prismaService: jest.Mocked<PrismaService>;
  let cacheService: jest.Mocked<TemplateCacheService>;
  let rendererService: jest.Mocked<TemplateRendererService>;

  const mockPrismaService = {
    emailTemplate: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    invalidateTemplate: jest.fn(),
  };

  const mockRendererService = {
    validateTemplate: jest.fn(),
    render: jest.fn(),
    extractVariables: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailTemplateService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: TemplateCacheService,
          useValue: mockCacheService,
        },
        {
          provide: TemplateRendererService,
          useValue: mockRendererService,
        },
      ],
    }).compile();

    service = module.get<EmailTemplateService>(EmailTemplateService);
    prismaService = module.get(PrismaService) as any;
    cacheService = module.get(TemplateCacheService) as any;
    rendererService = module.get(TemplateRendererService) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const userId = 'user-123';

    it('should create a new email template successfully', async () => {
      // Arrange
      const dto: CreateEmailTemplateDto = {
        name: 'welcome-email',
        displayName: 'Welcome Email',
        description: 'Welcome new users',
        subject: 'Welcome {{name}}!',
        htmlBody: '<p>Hello {{name}}</p>',
        textBody: 'Hello {{name}}',
        category: EmailCategory.ACCOUNT,
        variables: [
          { name: 'name', type: 'string', required: true, defaultValue: '' },
        ],
        isActive: true,
      };

      const mockTemplate = {
        id: 'template-123',
        ...dto,
        isSystem: false,
        version: 1,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.emailTemplate.findUnique.mockResolvedValue(null);
      rendererService.validateTemplate.mockReturnValue({
        isValid: true,
        errors: [],
      });
      rendererService.extractVariables.mockReturnValue(new Set(['name']));
      prismaService.emailTemplate.create.mockResolvedValue(mockTemplate as any);

      // Act
      const result = await service.create(dto, userId);

      // Assert
      expect(result.id).toBe('template-123');
      expect(result.name).toBe('welcome-email');
      expect(prismaService.emailTemplate.findUnique).toHaveBeenCalledWith({
        where: { name: dto.name },
      });
      expect(rendererService.validateTemplate).toHaveBeenCalledWith(
        dto.subject,
        dto.htmlBody,
        dto.textBody
      );
      expect(prismaService.emailTemplate.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: dto.name,
          displayName: dto.displayName,
          category: dto.category,
          isActive: true,
          isSystem: false,
          createdBy: userId,
        }),
      });
      expect(cacheService.set).toHaveBeenCalledTimes(2); // ID and name
    });

    it('should throw ConflictException if template name already exists', async () => {
      // Arrange
      const dto: CreateEmailTemplateDto = {
        name: 'existing-template',
        displayName: 'Existing',
        subject: 'Test',
        htmlBody: '<p>Test</p>',
        textBody: 'Test',
        category: EmailCategory.DOCUMENT,
      };

      prismaService.emailTemplate.findUnique.mockResolvedValue({
        id: 'existing-id',
        name: 'existing-template',
      } as any);

      // Act & Assert
      await expect(service.create(dto, userId)).rejects.toThrow(ConflictException);
      await expect(service.create(dto, userId)).rejects.toThrow(
        "Template with name 'existing-template' already exists"
      );
    });

    it('should throw BadRequestException if template validation fails', async () => {
      // Arrange
      const dto: CreateEmailTemplateDto = {
        name: 'invalid-template',
        displayName: 'Invalid',
        subject: 'Test {{invalid syntax',
        htmlBody: '<p>Test</p>',
        textBody: 'Test',
        category: EmailCategory.NOTIFICATION,
      };

      prismaService.emailTemplate.findUnique.mockResolvedValue(null);
      rendererService.validateTemplate.mockReturnValue({
        isValid: false,
        errors: ['Unclosed variable tag in subject'],
      });

      // Act & Assert
      await expect(service.create(dto, userId)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if variable consistency check fails', async () => {
      // Arrange
      const dto: CreateEmailTemplateDto = {
        name: 'inconsistent-vars',
        displayName: 'Inconsistent',
        subject: 'Hello {{undefinedVar}}',
        htmlBody: '<p>Test</p>',
        textBody: 'Test',
        category: EmailCategory.ACCOUNT,
        variables: [
          { name: 'definedVar', type: 'string', required: true, defaultValue: '' },
        ],
      };

      prismaService.emailTemplate.findUnique.mockResolvedValue(null);
      rendererService.validateTemplate.mockReturnValue({
        isValid: true,
        errors: [],
      });
      rendererService.extractVariables.mockReturnValue(new Set(['undefinedVar']));

      // Act & Assert
      await expect(service.create(dto, userId)).rejects.toThrow(BadRequestException);
      await expect(service.create(dto, userId)).rejects.toThrow(
        'The following variables are used in templates but not defined in schema: undefinedVar'
      );
    });

    it('should create template with isActive defaulting to true', async () => {
      // Arrange
      const dto: CreateEmailTemplateDto = {
        name: 'default-active',
        displayName: 'Default Active',
        subject: 'Test',
        htmlBody: '<p>Test</p>',
        textBody: 'Test',
        category: EmailCategory.DOCUMENT,
      };

      prismaService.emailTemplate.findUnique.mockResolvedValue(null);
      rendererService.validateTemplate.mockReturnValue({
        isValid: true,
        errors: [],
      });
      rendererService.extractVariables.mockReturnValue(new Set());
      prismaService.emailTemplate.create.mockResolvedValue({
        id: 'template-default',
        ...dto,
        isActive: true,
      } as any);

      // Act
      await service.create(dto, userId);

      // Assert
      expect(prismaService.emailTemplate.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          isActive: true,
        }),
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated templates', async () => {
      // Arrange
      const query: QueryEmailTemplatesDto = {
        page: 1,
        limit: 10,
      };

      const mockTemplates = [
        {
          id: 'template-1',
          name: 'template-1',
          displayName: 'Template 1',
          category: EmailCategory.ACCOUNT,
        },
        {
          id: 'template-2',
          name: 'template-2',
          displayName: 'Template 2',
          category: EmailCategory.DOCUMENT,
        },
      ];

      prismaService.emailTemplate.findMany.mockResolvedValue(mockTemplates as any);
      prismaService.emailTemplate.count.mockResolvedValue(50);

      // Act
      const result = await service.findAll(query);

      // Assert
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(50);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(5);
      expect(prismaService.emailTemplate.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter templates by category', async () => {
      // Arrange
      const query: QueryEmailTemplatesDto = {
        category: EmailCategory.ACCOUNT,
      };

      prismaService.emailTemplate.findMany.mockResolvedValue([]);
      prismaService.emailTemplate.count.mockResolvedValue(0);

      // Act
      await service.findAll(query);

      // Assert
      expect(prismaService.emailTemplate.findMany).toHaveBeenCalledWith({
        where: { category: EmailCategory.ACCOUNT },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter templates by isActive', async () => {
      // Arrange
      const query: QueryEmailTemplatesDto = {
        isActive: true,
      };

      prismaService.emailTemplate.findMany.mockResolvedValue([]);
      prismaService.emailTemplate.count.mockResolvedValue(0);

      // Act
      await service.findAll(query);

      // Assert
      expect(prismaService.emailTemplate.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should search templates by name or displayName', async () => {
      // Arrange
      const query: QueryEmailTemplatesDto = {
        search: 'welcome',
      };

      prismaService.emailTemplate.findMany.mockResolvedValue([]);
      prismaService.emailTemplate.count.mockResolvedValue(0);

      // Act
      await service.findAll(query);

      // Assert
      expect(prismaService.emailTemplate.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: 'welcome', mode: 'insensitive' } },
            { displayName: { contains: 'welcome', mode: 'insensitive' } },
          ],
        },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should handle pagination correctly', async () => {
      // Arrange
      const query: QueryEmailTemplatesDto = {
        page: 3,
        limit: 15,
      };

      prismaService.emailTemplate.findMany.mockResolvedValue([]);
      prismaService.emailTemplate.count.mockResolvedValue(45);

      // Act
      const result = await service.findAll(query);

      // Assert
      expect(result.totalPages).toBe(3);
      expect(prismaService.emailTemplate.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 30, // (page-1) * limit = (3-1) * 15
        take: 15,
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return template from cache if available', async () => {
      // Arrange
      const mockTemplate = {
        id: 'cached-template',
        name: 'cached',
        displayName: 'Cached Template',
      };

      cacheService.get.mockReturnValue(mockTemplate as any);

      // Act
      const result = await service.findOne('cached-template');

      // Assert
      expect(result).toEqual(mockTemplate);
      expect(cacheService.get).toHaveBeenCalledWith('cached-template');
      expect(prismaService.emailTemplate.findUnique).not.toHaveBeenCalled();
    });

    it('should fetch template from database if not cached', async () => {
      // Arrange
      const mockTemplate = {
        id: 'template-123',
        name: 'uncached',
        displayName: 'Uncached Template',
        category: EmailCategory.NOTIFICATION,
      };

      cacheService.get.mockReturnValue(null);
      prismaService.emailTemplate.findUnique.mockResolvedValue(mockTemplate as any);

      // Act
      const result = await service.findOne('template-123');

      // Assert
      expect(result.id).toBe('template-123');
      expect(prismaService.emailTemplate.findUnique).toHaveBeenCalledWith({
        where: { id: 'template-123' },
      });
      expect(cacheService.set).toHaveBeenCalledTimes(2); // ID and name
    });

    it('should throw NotFoundException if template not found', async () => {
      // Arrange
      cacheService.get.mockReturnValue(null);
      prismaService.emailTemplate.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('non-existent')).rejects.toThrow(
        "Template with ID 'non-existent' not found"
      );
    });
  });

  describe('findByName', () => {
    it('should return template from cache if available', async () => {
      // Arrange
      const mockTemplate = {
        id: 'template-123',
        name: 'cached-template',
        displayName: 'Cached',
      };

      cacheService.get.mockReturnValue(mockTemplate as any);

      // Act
      const result = await service.findByName('cached-template');

      // Assert
      expect(result).toEqual(mockTemplate);
      expect(cacheService.get).toHaveBeenCalledWith('cached-template');
      expect(prismaService.emailTemplate.findUnique).not.toHaveBeenCalled();
    });

    it('should fetch template by name from database if not cached', async () => {
      // Arrange
      const mockTemplate = {
        id: 'template-456',
        name: 'welcome-email',
        displayName: 'Welcome Email',
      };

      cacheService.get.mockReturnValue(null);
      prismaService.emailTemplate.findUnique.mockResolvedValue(mockTemplate as any);

      // Act
      const result = await service.findByName('welcome-email');

      // Assert
      expect(result.name).toBe('welcome-email');
      expect(prismaService.emailTemplate.findUnique).toHaveBeenCalledWith({
        where: { name: 'welcome-email' },
      });
      expect(cacheService.set).toHaveBeenCalledTimes(2);
    });

    it('should throw NotFoundException if template not found', async () => {
      // Arrange
      cacheService.get.mockReturnValue(null);
      prismaService.emailTemplate.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findByName('non-existent')).rejects.toThrow(NotFoundException);
      await expect(service.findByName('non-existent')).rejects.toThrow(
        "Template with name 'non-existent' not found"
      );
    });
  });

  describe('update', () => {
    const userId = 'user-123';

    it('should update template successfully', async () => {
      // Arrange
      const templateId = 'template-123';
      const dto: UpdateEmailTemplateDto = {
        displayName: 'Updated Template',
        description: 'Updated description',
        isActive: false,
      };

      const existingTemplate = {
        id: templateId,
        name: 'test-template',
        displayName: 'Test Template',
        subject: 'Test',
        htmlBody: '<p>Test</p>',
        textBody: 'Test',
        isSystem: false,
      };

      const updatedTemplate = {
        ...existingTemplate,
        ...dto,
        version: 2,
      };

      prismaService.emailTemplate.findUnique.mockResolvedValue(existingTemplate as any);
      prismaService.emailTemplate.update.mockResolvedValue(updatedTemplate as any);

      // Act
      const result = await service.update(templateId, dto, userId);

      // Assert
      expect(result.displayName).toBe('Updated Template');
      expect(prismaService.emailTemplate.update).toHaveBeenCalledWith({
        where: { id: templateId },
        data: expect.objectContaining({
          ...dto,
          updatedBy: userId,
          version: { increment: 1 },
        }),
      });
      expect(cacheService.invalidateTemplate).toHaveBeenCalledWith(
        templateId,
        'test-template'
      );
    });

    it('should throw NotFoundException if template not found', async () => {
      // Arrange
      prismaService.emailTemplate.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.update('non-existent', {}, userId)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw ForbiddenException if trying to update system template', async () => {
      // Arrange
      const systemTemplate = {
        id: 'system-template',
        name: 'system',
        isSystem: true,
      };

      prismaService.emailTemplate.findUnique.mockResolvedValue(systemTemplate as any);

      // Act & Assert
      await expect(service.update('system-template', {}, userId)).rejects.toThrow(
        ForbiddenException
      );
      await expect(service.update('system-template', {}, userId)).rejects.toThrow(
        'System templates cannot be modified'
      );
    });

    it('should validate template syntax when content is updated', async () => {
      // Arrange
      const dto: UpdateEmailTemplateDto = {
        subject: 'New Subject {{name}}',
        htmlBody: '<p>New body {{name}}</p>',
      };

      const existingTemplate = {
        id: 'template-123',
        name: 'test',
        subject: 'Old',
        htmlBody: '<p>Old</p>',
        textBody: 'Old',
        isSystem: false,
      };

      prismaService.emailTemplate.findUnique.mockResolvedValue(existingTemplate as any);
      rendererService.validateTemplate.mockReturnValue({
        isValid: true,
        errors: [],
      });
      rendererService.extractVariables.mockReturnValue(new Set(['name']));
      prismaService.emailTemplate.update.mockResolvedValue({} as any);

      // Act
      await service.update('template-123', dto, userId);

      // Assert
      expect(rendererService.validateTemplate).toHaveBeenCalledWith(
        'New Subject {{name}}',
        '<p>New body {{name}}</p>',
        'Old'
      );
    });

    it('should throw BadRequestException if validation fails', async () => {
      // Arrange
      const dto: UpdateEmailTemplateDto = {
        htmlBody: '<p>Invalid {{syntax</p>',
      };

      const existingTemplate = {
        id: 'template-123',
        subject: 'Test',
        htmlBody: '<p>Old</p>',
        textBody: 'Old',
        isSystem: false,
      };

      prismaService.emailTemplate.findUnique.mockResolvedValue(existingTemplate as any);
      rendererService.validateTemplate.mockReturnValue({
        isValid: false,
        errors: ['Invalid syntax'],
      });

      // Act & Assert
      await expect(service.update('template-123', dto, userId)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('delete', () => {
    it('should delete template successfully', async () => {
      // Arrange
      const templateId = 'template-123';
      const mockTemplate = {
        id: templateId,
        name: 'test-template',
        isSystem: false,
      };

      prismaService.emailTemplate.findUnique.mockResolvedValue(mockTemplate as any);
      prismaService.emailTemplate.delete.mockResolvedValue({} as any);

      // Act
      await service.delete(templateId);

      // Assert
      expect(prismaService.emailTemplate.delete).toHaveBeenCalledWith({
        where: { id: templateId },
      });
      expect(cacheService.invalidateTemplate).toHaveBeenCalledWith(
        templateId,
        'test-template'
      );
    });

    it('should throw NotFoundException if template not found', async () => {
      // Arrange
      prismaService.emailTemplate.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.delete('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if trying to delete system template', async () => {
      // Arrange
      const systemTemplate = {
        id: 'system-template',
        name: 'system',
        isSystem: true,
      };

      prismaService.emailTemplate.findUnique.mockResolvedValue(systemTemplate as any);

      // Act & Assert
      await expect(service.delete('system-template')).rejects.toThrow(
        ForbiddenException
      );
      await expect(service.delete('system-template')).rejects.toThrow(
        'System templates cannot be deleted'
      );
    });
  });

  describe('duplicate', () => {
    const userId = 'user-123';

    it('should duplicate template with unique name', async () => {
      // Arrange
      const sourceTemplate = {
        id: 'source-template',
        name: 'original',
        displayName: 'Original Template',
        description: 'Original description',
        subject: 'Subject',
        htmlBody: '<p>Body</p>',
        textBody: 'Body',
        category: EmailCategory.DOCUMENT,
        variables: [],
      };

      const duplicatedTemplate = {
        id: 'duplicated-template',
        name: 'original_COPY',
        displayName: 'Original Template (Copy)',
      };

      cacheService.get.mockReturnValue(sourceTemplate as any);
      prismaService.emailTemplate.count.mockResolvedValue(0); // Name doesn't exist
      prismaService.emailTemplate.findUnique.mockResolvedValue(null);
      rendererService.validateTemplate.mockReturnValue({
        isValid: true,
        errors: [],
      });
      rendererService.extractVariables.mockReturnValue(new Set());
      prismaService.emailTemplate.create.mockResolvedValue(duplicatedTemplate as any);

      // Act
      const result = await service.duplicate('source-template', userId);

      // Assert
      expect(result.name).toBe('original_COPY');
      expect(prismaService.emailTemplate.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'original_COPY',
          displayName: 'Original Template (Copy)',
          isActive: false,
        }),
      });
    });

    it('should generate unique name if COPY already exists', async () => {
      // Arrange
      const sourceTemplate = {
        id: 'source-template',
        name: 'original',
        displayName: 'Original',
        category: EmailCategory.ACCOUNT,
        subject: 'Test',
        htmlBody: '<p>Test</p>',
        textBody: 'Test',
        variables: [],
      };

      cacheService.get.mockReturnValue(sourceTemplate as any);
      prismaService.emailTemplate.count
        .mockResolvedValueOnce(1) // original_COPY exists
        .mockResolvedValueOnce(0); // original_COPY_1 doesn't exist
      prismaService.emailTemplate.findUnique.mockResolvedValue(null);
      rendererService.validateTemplate.mockReturnValue({
        isValid: true,
        errors: [],
      });
      rendererService.extractVariables.mockReturnValue(new Set());
      prismaService.emailTemplate.create.mockResolvedValue({
        id: 'dup-id',
        name: 'original_COPY_1',
      } as any);

      // Act
      const result = await service.duplicate('source-template', userId);

      // Assert
      expect(result.name).toBe('original_COPY_1');
    });
  });

  describe('preview', () => {
    it('should render template with provided variables', async () => {
      // Arrange
      const templateId = 'template-123';
      const variables = {
        name: 'John Doe',
        email: 'john@example.com',
      };

      const mockTemplate = {
        id: templateId,
        name: 'welcome',
        subject: 'Welcome {{name}}',
        htmlBody: '<p>Hello {{name}}</p>',
        textBody: 'Hello {{name}}',
      };

      const mockRendered = {
        subject: 'Welcome John Doe',
        htmlBody: '<p>Hello John Doe</p>',
        textBody: 'Hello John Doe',
      };

      cacheService.get.mockReturnValue(mockTemplate as any);
      rendererService.render.mockResolvedValue(mockRendered);

      // Act
      const result = await service.preview(templateId, variables);

      // Assert
      expect(result).toEqual(mockRendered);
      expect(rendererService.render).toHaveBeenCalledWith(mockTemplate, variables);
    });
  });

  describe('getCategories', () => {
    it('should return all email categories', () => {
      // Act
      const categories = service.getCategories();

      // Assert
      expect(categories).toContain(EmailCategory.ACCOUNT);
      expect(categories).toContain(EmailCategory.DOCUMENT);
      expect(categories).toContain(EmailCategory.NOTIFICATION);
      expect(categories).toContain(EmailCategory.CAPITAL_CALL);
      expect(categories).toContain(EmailCategory.DISTRIBUTION);
      expect(categories).toContain(EmailCategory.SYSTEM);
      expect(Array.isArray(categories)).toBe(true);
    });
  });

  describe('getVariableSchema', () => {
    it('should return variable schema for template', async () => {
      // Arrange
      const templateId = 'template-123';
      const mockTemplate = {
        id: templateId,
        name: 'test',
        variables: [
          { name: 'userName', type: 'string', required: true },
          { name: 'companyName', type: 'string', required: false },
        ],
      };

      cacheService.get.mockReturnValue(mockTemplate as any);

      // Act
      const schema = await service.getVariableSchema(templateId);

      // Assert
      expect(schema).toEqual(mockTemplate.variables);
    });
  });

  describe('service initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have all dependencies injected', () => {
      expect(service['prisma']).toBeDefined();
      expect(service['cacheService']).toBeDefined();
      expect(service['rendererService']).toBeDefined();
    });
  });
});
