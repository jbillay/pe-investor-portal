/**
 * Email Template Controller
 *
 * RESTful API for email template management (SUPER_ADMIN only)
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../guards/super-admin.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/interfaces/auth.interface';
import { EmailTemplateService } from '../services/email-template.service';
import {
  CreateEmailTemplateDto,
  UpdateEmailTemplateDto,
  QueryEmailTemplatesDto,
  TemplatePreviewDto,
  SendTestEmailDto,
  EmailTemplateResponseDto,
  PaginatedTemplatesResponseDto,
  TemplateValidationResponseDto,
} from '../dto/email-template.dto';

@ApiTags('Email Templates')
@Controller('admin/email-templates')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@ApiBearerAuth('JWT-auth')
export class EmailTemplateController {
  constructor(private readonly templateService: EmailTemplateService) {}

  @ApiOperation({
    summary: 'Create new email template',
    description: 'Create a new email template. Requires SUPER_ADMIN role.',
  })
  @ApiResponse({
    status: 201,
    description: 'Template created successfully',
    type: EmailTemplateResponseDto,
  })
  @ApiConflictResponse({ description: 'Template with this name already exists' })
  @ApiBadRequestResponse({ description: 'Invalid template data or syntax' })
  @ApiForbiddenResponse({ description: 'SUPER_ADMIN role required' })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @Post()
  async create(
    @Body() dto: CreateEmailTemplateDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.templateService.create(dto, user.id);
  }

  @ApiOperation({
    summary: 'Get all email templates',
    description: 'Retrieve all email templates with optional filtering and pagination.',
  })
  @ApiResponse({
    status: 200,
    description: 'Templates retrieved successfully',
    type: PaginatedTemplatesResponseDto,
  })
  @Get()
  async findAll(@Query() query: QueryEmailTemplatesDto) {
    return this.templateService.findAll(query);
  }

  @ApiOperation({
    summary: 'Get template by ID',
    description: 'Retrieve a specific email template by its ID.',
  })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({
    status: 200,
    description: 'Template retrieved successfully',
    type: EmailTemplateResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Template not found' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.templateService.findOne(id);
  }

  @ApiOperation({
    summary: 'Update email template',
    description: 'Update an existing email template. System templates cannot be modified.',
  })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({
    status: 200,
    description: 'Template updated successfully',
    type: EmailTemplateResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Template not found' })
  @ApiForbiddenResponse({ description: 'Cannot modify system templates' })
  @ApiBadRequestResponse({ description: 'Invalid template data or syntax' })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEmailTemplateDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.templateService.update(id, dto, user.id);
  }

  @ApiOperation({
    summary: 'Delete email template',
    description: 'Delete an email template. System templates cannot be deleted.',
  })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({
    status: 204,
    description: 'Template deleted successfully',
  })
  @ApiNotFoundResponse({ description: 'Template not found' })
  @ApiForbiddenResponse({ description: 'Cannot delete system templates' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.templateService.delete(id);
  }

  @ApiOperation({
    summary: 'Duplicate email template',
    description: 'Create a copy of an existing template.',
  })
  @ApiParam({ name: 'id', description: 'Template ID to duplicate' })
  @ApiResponse({
    status: 201,
    description: 'Template duplicated successfully',
    type: EmailTemplateResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Template not found' })
  @Post(':id/duplicate')
  async duplicate(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.templateService.duplicate(id, user.id);
  }

  @ApiOperation({
    summary: 'Preview template',
    description: 'Render template with sample data for preview.',
  })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({
    status: 200,
    description: 'Template preview rendered successfully',
    schema: {
      type: 'object',
      properties: {
        subject: { type: 'string' },
        htmlBody: { type: 'string' },
        textBody: { type: 'string' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Template not found' })
  @ApiBadRequestResponse({ description: 'Invalid variables provided' })
  @Post(':id/preview')
  async preview(
    @Param('id') id: string,
    @Body() dto: TemplatePreviewDto,
  ) {
    return this.templateService.preview(id, dto.variables || {});
  }

  @ApiOperation({
    summary: 'Send test email',
    description: 'Send a test email using the template with sample data.',
  })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({
    status: 200,
    description: 'Test email sent successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        emailLogId: { type: 'string' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Template not found' })
  @ApiBadRequestResponse({ description: 'Invalid variables or email address' })
  @Post(':id/test')
  async sendTest(
    @Param('id') id: string,
    @Body() dto: SendTestEmailDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const template = await this.templateService.findOne(id);

    // This would require EmailService - will be implemented when wiring controllers
    return {
      success: true,
      message: `Test email would be sent to ${dto.recipientEmail}`,
      templateName: template.name,
    };
  }

  @ApiOperation({
    summary: 'Get template categories',
    description: 'Retrieve list of all available template categories.',
  })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
    schema: {
      type: 'array',
      items: { type: 'string' },
    },
  })
  @Get('meta/categories')
  async getCategories() {
    return this.templateService.getCategories();
  }

  @ApiOperation({
    summary: 'Get template variable schema',
    description: 'Retrieve the variable schema definition for a template.',
  })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({
    status: 200,
    description: 'Variable schema retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          type: { type: 'string' },
          required: { type: 'boolean' },
          description: { type: 'string' },
          example: {},
          defaultValue: {},
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Template not found' })
  @Get(':id/variables')
  async getVariableSchema(@Param('id') id: string) {
    return this.templateService.getVariableSchema(id);
  }
}
