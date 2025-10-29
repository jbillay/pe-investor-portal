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
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { DynamicPermissionGuard, DynamicPermission } from '../guards/dynamic-permission.guard';
import { SchemaService } from '../services/schema.service';
import { InstanceService } from '../services/instance.service';
import { ValidationService } from '../services/validation.service';
import { ExportService } from '../services/export.service';
import { CreateInstanceDto, UpdateInstanceDto } from '../dto/create-instance.dto';
import { QueryParamsDto, SearchInstancesDto } from '../dto/query-params.dto';

@ApiTags('Dynamic Data')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, DynamicPermissionGuard)
@Controller('dynamic/:dataKey')
export class DynamicController {
  constructor(
    private readonly schemaService: SchemaService,
    private readonly instanceService: InstanceService,
    private readonly validationService: ValidationService,
    private readonly exportService: ExportService,
  ) {}

  // ============================================================================
  // SCHEMA ENDPOINT
  // ============================================================================

  @Get('schema')
  @DynamicPermission('READ')
  @ApiOperation({ summary: 'Get schema for dynamic form/table generation' })
  @ApiParam({ name: 'dataKey', description: 'Data object key (e.g., "fund")' })
  @ApiResponse({
    status: 200,
    description: 'Schema definition with fields and validation rules',
  })
  @ApiResponse({ status: 404, description: 'Data object not found' })
  async getSchema(
    @Param('dataKey') dataKey: string,
    @Request() req: any,
  ) {
    return await this.schemaService.getSchema(dataKey, req.user.id);
  }

  // ============================================================================
  // INSTANCE CRUD OPERATIONS
  // ============================================================================

  @Post()
  @DynamicPermission('WRITE')
  @ApiOperation({ summary: 'Create a new instance' })
  @ApiParam({ name: 'dataKey', description: 'Data object key' })
  @ApiResponse({
    status: 201,
    description: 'Instance created successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  async create(
    @Param('dataKey') dataKey: string,
    @Body() createDto: CreateInstanceDto,
    @Request() req: any,
  ) {
    // Get schema and validate
    const schema = await this.schemaService.getSchema(dataKey);
    const validation = await this.validationService.validate(schema, createDto.values);

    if (!validation.isValid) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: validation.errors,
      });
    }

    return await this.instanceService.create(dataKey, createDto.values, req.user.id);
  }

  @Get()
  @DynamicPermission('READ')
  @ApiOperation({ summary: 'Get all instances with pagination and filtering' })
  @ApiParam({ name: 'dataKey', description: 'Data object key' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of instances',
  })
  async findAll(
    @Param('dataKey') dataKey: string,
    @Query() query: QueryParamsDto,
  ) {
    return await this.instanceService.findAll(dataKey, query);
  }

  @Get(':id')
  @DynamicPermission('READ')
  @ApiOperation({ summary: 'Get a single instance by ID' })
  @ApiParam({ name: 'dataKey', description: 'Data object key' })
  @ApiParam({ name: 'id', description: 'Instance ID' })
  @ApiResponse({
    status: 200,
    description: 'Instance details',
  })
  @ApiResponse({ status: 404, description: 'Instance not found' })
  async findOne(
    @Param('dataKey') dataKey: string,
    @Param('id') id: string,
  ) {
    return await this.instanceService.findOne(dataKey, id);
  }

  @Put(':id')
  @DynamicPermission('WRITE')
  @ApiOperation({ summary: 'Update an instance' })
  @ApiParam({ name: 'dataKey', description: 'Data object key' })
  @ApiParam({ name: 'id', description: 'Instance ID' })
  @ApiResponse({
    status: 200,
    description: 'Instance updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Instance not found' })
  async update(
    @Param('dataKey') dataKey: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateInstanceDto,
    @Request() req: any,
  ) {
    // Get schema and validate
    const schema = await this.schemaService.getSchema(dataKey);
    const validation = await this.validationService.validate(schema, updateDto.values);

    if (!validation.isValid) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: validation.errors,
      });
    }

    return await this.instanceService.update(dataKey, id, updateDto.values, req.user.id);
  }

  @Delete(':id')
  @DynamicPermission('DELETE')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an instance' })
  @ApiParam({ name: 'dataKey', description: 'Data object key' })
  @ApiParam({ name: 'id', description: 'Instance ID' })
  @ApiResponse({
    status: 204,
    description: 'Instance deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Instance not found' })
  async remove(
    @Param('dataKey') dataKey: string,
    @Param('id') id: string,
    @Request() req: any,
  ) {
    await this.instanceService.remove(dataKey, id, req.user.id);
  }

  // ============================================================================
  // ADVANCED FEATURES
  // ============================================================================

  @Post('search')
  @DynamicPermission('READ')
  @ApiOperation({ summary: 'Advanced search with multiple filter criteria' })
  @ApiParam({ name: 'dataKey', description: 'Data object key' })
  @ApiResponse({
    status: 200,
    description: 'Filtered instances',
  })
  async search(
    @Param('dataKey') dataKey: string,
    @Body() searchDto: SearchInstancesDto,
  ) {
    // Convert search DTO to query params
    const query: QueryParamsDto = {
      page: searchDto.page,
      limit: searchDto.limit,
      sortBy: searchDto.sortBy,
      sortOrder: searchDto.sortOrder,
      filters: searchDto.filters ? this.convertFiltersToObject(searchDto.filters) : undefined,
    };

    return await this.instanceService.findAll(dataKey, query);
  }

  @Get('export/csv')
  @DynamicPermission('READ')
  @ApiOperation({ summary: 'Export instances to CSV' })
  @ApiParam({ name: 'dataKey', description: 'Data object key' })
  @ApiResponse({
    status: 200,
    description: 'CSV file',
    content: {
      'text/csv': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async exportCSV(
    @Param('dataKey') dataKey: string,
    @Query() query: QueryParamsDto,
    @Res() res: Response,
  ) {
    const csv = await this.exportService.exportToCSV(dataKey, query);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${dataKey}_export.csv"`,
    );
    res.send(csv);
  }

  @Get('export/json')
  @DynamicPermission('READ')
  @ApiOperation({ summary: 'Export instances to JSON' })
  @ApiParam({ name: 'dataKey', description: 'Data object key' })
  @ApiResponse({
    status: 200,
    description: 'JSON array of instances',
  })
  async exportJSON(
    @Param('dataKey') dataKey: string,
    @Query() query: QueryParamsDto,
  ) {
    return await this.exportService.exportToJSON(dataKey, query);
  }

  @Get(':id/history')
  @DynamicPermission('READ')
  @ApiOperation({ summary: 'Get change history for an instance' })
  @ApiParam({ name: 'dataKey', description: 'Data object key' })
  @ApiParam({ name: 'id', description: 'Instance ID' })
  @ApiResponse({
    status: 200,
    description: 'Change history',
  })
  @ApiResponse({ status: 404, description: 'Instance not found' })
  async getHistory(
    @Param('dataKey') dataKey: string,
    @Param('id') id: string,
  ) {
    return await this.instanceService.getHistory(dataKey, id);
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private convertFiltersToObject(filters: any[]): Record<string, any> {
    const result: Record<string, any> = {};

    for (const filter of filters) {
      const { fieldKey, operator, value } = filter;

      if (operator === 'between') {
        result[fieldKey] = {
          gte: value[0],
          lte: value[1],
        };
      } else {
        result[fieldKey] = {
          [operator]: value,
        };
      }
    }

    return result;
  }
}
