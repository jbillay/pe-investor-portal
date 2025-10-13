/**
 * Email Template Service
 *
 * Handles CRUD operations for email templates with caching
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TemplateCacheService } from './template-cache.service';
import { TemplateRendererService } from './template-renderer.service';
import {
  CreateEmailTemplateDto,
  UpdateEmailTemplateDto,
  QueryEmailTemplatesDto,
} from '../dto/email-template.dto';
import { IEmailTemplate, EmailCategory } from '../interfaces/email-template.interface';

/**
 * Email Template Service
 * Provides comprehensive template management with caching and validation
 */
@Injectable()
export class EmailTemplateService {
  private readonly logger = new Logger(EmailTemplateService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: TemplateCacheService,
    private readonly rendererService: TemplateRendererService,
  ) {}

  /**
   * Create a new email template
   * @param dto Create template DTO
   * @param userId User creating the template
   * @returns Created template
   */
  async create(
    dto: CreateEmailTemplateDto,
    userId: string,
  ): Promise<IEmailTemplate> {
    this.logger.log(`Creating email template: ${dto.name}`);

    // Check if template with same name already exists
    const existing = await this.prisma.emailTemplate.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException(
        `Template with name '${dto.name}' already exists`,
      );
    }

    // Validate template syntax
    const validation = this.rendererService.validateTemplate(
      dto.subject,
      dto.htmlBody,
      dto.textBody,
    );

    if (!validation.isValid) {
      throw new BadRequestException({
        message: 'Template validation failed',
        errors: validation.errors,
      });
    }

    // Validate variable consistency
    this.validateVariableConsistency(dto);

    // Create template
    const template = await this.prisma.emailTemplate.create({
      data: {
        name: dto.name,
        displayName: dto.displayName,
        description: dto.description,
        subject: dto.subject,
        htmlBody: dto.htmlBody,
        textBody: dto.textBody,
        category: dto.category,
        variables: dto.variables as any,
        isActive: dto.isActive ?? true,
        isSystem: false,
        createdBy: userId,
      },
    });

    this.logger.log(`Email template created: ${template.id}`);

    // Cache the template
    this.cacheTemplate(template);

    return this.mapToEmailTemplate(template);
  }

  /**
   * Find all templates with filters and pagination
   * @param query Query parameters
   * @returns Paginated templates
   */
  async findAll(query: QueryEmailTemplatesDto) {
    const { category, isActive, search, page = 1, limit = 20 } = query;

    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [templates, total] = await Promise.all([
      this.prisma.emailTemplate.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.emailTemplate.count({ where }),
    ]);

    return {
      data: templates.map((t) => this.mapToEmailTemplate(t)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find template by ID
   * @param id Template ID
   * @returns Template
   */
  async findOne(id: string): Promise<IEmailTemplate> {
    // Check cache first
    const cached = this.cacheService.get(id);
    if (cached) {
      return cached;
    }

    const template = await this.prisma.emailTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException(`Template with ID '${id}' not found`);
    }

    const mapped = this.mapToEmailTemplate(template);
    this.cacheTemplate(template);

    return mapped;
  }

  /**
   * Find template by name
   * @param name Template name
   * @returns Template
   */
  async findByName(name: string): Promise<IEmailTemplate> {
    // Check cache first
    const cached = this.cacheService.get(name);
    if (cached) {
      return cached;
    }

    const template = await this.prisma.emailTemplate.findUnique({
      where: { name },
    });

    if (!template) {
      throw new NotFoundException(`Template with name '${name}' not found`);
    }

    const mapped = this.mapToEmailTemplate(template);
    this.cacheTemplate(template);

    return mapped;
  }

  /**
   * Update template
   * @param id Template ID
   * @param dto Update DTO
   * @param userId User updating the template
   * @returns Updated template
   */
  async update(
    id: string,
    dto: UpdateEmailTemplateDto,
    userId: string,
  ): Promise<IEmailTemplate> {
    this.logger.log(`Updating email template: ${id}`);

    const existing = await this.prisma.emailTemplate.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Template with ID '${id}' not found`);
    }

    // Cannot update system templates
    if (existing.isSystem) {
      throw new ForbiddenException('System templates cannot be modified');
    }

    // Validate template syntax if content changed
    if (dto.subject || dto.htmlBody || dto.textBody) {
      const validation = this.rendererService.validateTemplate(
        dto.subject || existing.subject,
        dto.htmlBody || existing.htmlBody,
        dto.textBody || existing.textBody,
      );

      if (!validation.isValid) {
        throw new BadRequestException({
          message: 'Template validation failed',
          errors: validation.errors,
        });
      }
    }

    // Validate variable consistency if changed
    if (dto.variables || dto.subject || dto.htmlBody || dto.textBody) {
      this.validateVariableConsistency({
        ...existing,
        ...dto,
        variables: dto.variables || (existing.variables as any),
      } as any);
    }

    const template = await this.prisma.emailTemplate.update({
      where: { id },
      data: {
        ...dto,
        variables: dto.variables as any,
        updatedBy: userId,
        version: { increment: 1 },
      },
    });

    this.logger.log(`Email template updated: ${id}`);

    // Invalidate cache
    this.cacheService.invalidateTemplate(id, existing.name);

    // Cache updated template
    this.cacheTemplate(template);

    return this.mapToEmailTemplate(template);
  }

  /**
   * Delete template
   * @param id Template ID
   */
  async delete(id: string): Promise<void> {
    this.logger.log(`Deleting email template: ${id}`);

    const template = await this.prisma.emailTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException(`Template with ID '${id}' not found`);
    }

    // Cannot delete system templates
    if (template.isSystem) {
      throw new ForbiddenException('System templates cannot be deleted');
    }

    await this.prisma.emailTemplate.delete({
      where: { id },
    });

    this.logger.log(`Email template deleted: ${id}`);

    // Invalidate cache
    this.cacheService.invalidateTemplate(id, template.name);
  }

  /**
   * Duplicate template
   * @param id Template ID
   * @param userId User duplicating the template
   * @returns Duplicated template
   */
  async duplicate(id: string, userId: string): Promise<IEmailTemplate> {
    this.logger.log(`Duplicating email template: ${id}`);

    const source = await this.findOne(id);

    // Generate unique name
    let copyName = `${source.name}_COPY`;
    let counter = 1;
    while (await this.templateNameExists(copyName)) {
      copyName = `${source.name}_COPY_${counter}`;
      counter++;
    }

    const duplicated = await this.create(
      {
        name: copyName,
        displayName: `${source.displayName} (Copy)`,
        description: source.description,
        subject: source.subject,
        htmlBody: source.htmlBody,
        textBody: source.textBody,
        category: source.category,
        variables: source.variables,
        isActive: false, // Duplicated templates are inactive by default
      },
      userId,
    );

    this.logger.log(`Email template duplicated: ${duplicated.id}`);

    return duplicated;
  }

  /**
   * Preview template with sample data
   * @param id Template ID
   * @param variables Sample variables
   * @returns Rendered preview
   */
  async preview(id: string, variables: Record<string, any>) {
    const template = await this.findOne(id);

    return this.rendererService.render(template, variables);
  }

  /**
   * Get template categories
   * @returns Array of categories
   */
  getCategories(): string[] {
    return Object.values(EmailCategory);
  }

  /**
   * Get template variable schema
   * @param id Template ID
   * @returns Variable schema
   */
  async getVariableSchema(id: string) {
    const template = await this.findOne(id);
    return template.variables;
  }

  /**
   * Check if template name exists
   * @param name Template name
   * @returns True if exists
   */
  private async templateNameExists(name: string): Promise<boolean> {
    const count = await this.prisma.emailTemplate.count({
      where: { name },
    });
    return count > 0;
  }

  /**
   * Validate variable consistency between schema and template content
   * @param dto Template DTO
   */
  private validateVariableConsistency(
    dto: CreateEmailTemplateDto | (UpdateEmailTemplateDto & { subject: string; htmlBody: string; textBody: string }),
  ): void {
    const usedVariables = this.rendererService.extractVariables(
      dto.subject,
      dto.htmlBody,
      dto.textBody,
    );

    if (!dto.variables || dto.variables.length === 0) {
      // If no variables defined in schema but some are used in templates, warn
      if (usedVariables.size > 0) {
        this.logger.warn(
          `Variables used in templates but no schema defined: ${Array.from(usedVariables).join(', ')}`,
        );
      }
      return;
    }

    const schemaVariables = new Set(dto.variables.map((v) => v.name));

    // Find variables used in templates but not in schema
    const undefinedVars: string[] = [];
    usedVariables.forEach((varName) => {
      if (!schemaVariables.has(varName)) {
        undefinedVars.push(varName);
      }
    });

    if (undefinedVars.length > 0) {
      throw new BadRequestException(
        `The following variables are used in templates but not defined in schema: ${undefinedVars.join(', ')}`,
      );
    }

    // Warn about unused schema variables (not an error)
    const unusedVars: string[] = [];
    dto.variables.forEach((schemaVar) => {
      if (!usedVariables.has(schemaVar.name)) {
        unusedVars.push(schemaVar.name);
      }
    });

    if (unusedVars.length > 0) {
      this.logger.warn(
        `The following variables are defined in schema but not used: ${unusedVars.join(', ')}`,
      );
    }
  }

  /**
   * Cache template by ID and name
   * @param template Template to cache
   */
  private cacheTemplate(template: any): void {
    const mapped = this.mapToEmailTemplate(template);
    this.cacheService.set(template.id, mapped);
    this.cacheService.set(template.name, mapped);
  }

  /**
   * Map database template to interface
   * @param template Database template
   * @returns Mapped template
   */
  private mapToEmailTemplate(template: any): IEmailTemplate {
    return {
      id: template.id,
      name: template.name,
      displayName: template.displayName,
      description: template.description,
      subject: template.subject,
      htmlBody: template.htmlBody,
      textBody: template.textBody,
      category: template.category as EmailCategory,
      variables: template.variables as any,
      isActive: template.isActive,
      isSystem: template.isSystem,
      version: template.version,
      createdBy: template.createdBy,
      updatedBy: template.updatedBy,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }
}
