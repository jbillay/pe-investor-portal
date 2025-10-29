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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SchemaService } from '../services/schema.service';
import { InstanceService } from '../services/instance.service';
import { ValidationService } from '../services/validation.service';
import { CreateInstanceDto, UpdateInstanceDto } from '../dto/create-instance.dto';
import { QueryParamsDto } from '../dto/query-params.dto';
import { PrismaService } from '../../database/prisma.service';

@ApiTags('Data Instances')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('data/:dataObjectId')
export class DataInstanceController {
  constructor(
    private readonly schemaService: SchemaService,
    private readonly instanceService: InstanceService,
    private readonly validationService: ValidationService,
    private readonly prisma: PrismaService,
  ) {}

  // ============================================================================
  // SCHEMA ENDPOINT
  // ============================================================================

  @Get('schema')
  @ApiOperation({ summary: 'Get schema by data object ID' })
  @ApiParam({ name: 'dataObjectId', description: 'Data object UUID' })
  @ApiResponse({
    status: 200,
    description: 'Schema definition with fields and validation rules',
  })
  @ApiResponse({ status: 404, description: 'Data object not found' })
  async getSchema(
    @Param('dataObjectId') dataObjectId: string,
    @Request() req: any,
  ) {
    return await this.schemaService.getSchemaById(dataObjectId);
  }

  // ============================================================================
  // INSTANCE CRUD OPERATIONS
  // ============================================================================

  @Post('instances')
  @ApiOperation({ summary: 'Create a new instance' })
  @ApiParam({ name: 'dataObjectId', description: 'Data object UUID' })
  @ApiResponse({
    status: 201,
    description: 'Instance created successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  async create(
    @Param('dataObjectId') dataObjectId: string,
    @Body() createDto: CreateInstanceDto,
    @Request() req: any,
  ) {
    // Get the dataKey from ID
    const dataObject = await this.prisma.dataObject.findUnique({
      where: { id: dataObjectId },
      select: { dataKey: true },
    });

    if (!dataObject) {
      throw new BadRequestException('Data object not found');
    }

    // Get schema and validate
    const schema = await this.schemaService.getSchemaById(dataObjectId);
    const validation = await this.validationService.validate(schema, createDto.values);

    if (!validation.isValid) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: validation.errors,
      });
    }

    return await this.instanceService.create(dataObject.dataKey, createDto.values, req.user.id);
  }

  @Get('instances')
  @ApiOperation({ summary: 'Get all instances with pagination and filtering' })
  @ApiParam({ name: 'dataObjectId', description: 'Data object UUID' })
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
    @Param('dataObjectId') dataObjectId: string,
    @Query() query: QueryParamsDto,
  ) {
    // Get the dataKey from ID
    const dataObject = await this.prisma.dataObject.findUnique({
      where: { id: dataObjectId },
      select: { dataKey: true },
    });

    if (!dataObject) {
      throw new BadRequestException('Data object not found');
    }

    return await this.instanceService.findAll(dataObject.dataKey, query);
  }

  @Get('instances/:id')
  @ApiOperation({ summary: 'Get a single instance by ID' })
  @ApiParam({ name: 'dataObjectId', description: 'Data object UUID' })
  @ApiParam({ name: 'id', description: 'Instance ID' })
  @ApiResponse({
    status: 200,
    description: 'Instance details',
  })
  @ApiResponse({ status: 404, description: 'Instance not found' })
  async findOne(
    @Param('dataObjectId') dataObjectId: string,
    @Param('id') id: string,
  ) {
    // Get the dataKey from ID
    const dataObject = await this.prisma.dataObject.findUnique({
      where: { id: dataObjectId },
      select: { dataKey: true },
    });

    if (!dataObject) {
      throw new BadRequestException('Data object not found');
    }

    return await this.instanceService.findOne(dataObject.dataKey, id);
  }

  @Put('instances/:id')
  @ApiOperation({ summary: 'Update an instance' })
  @ApiParam({ name: 'dataObjectId', description: 'Data object UUID' })
  @ApiParam({ name: 'id', description: 'Instance ID' })
  @ApiResponse({
    status: 200,
    description: 'Instance updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Instance not found' })
  async update(
    @Param('dataObjectId') dataObjectId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateInstanceDto,
    @Request() req: any,
  ) {
    // Get the dataKey from ID
    const dataObject = await this.prisma.dataObject.findUnique({
      where: { id: dataObjectId },
      select: { dataKey: true },
    });

    if (!dataObject) {
      throw new BadRequestException('Data object not found');
    }

    // Get schema and validate
    const schema = await this.schemaService.getSchemaById(dataObjectId);
    const validation = await this.validationService.validate(schema, updateDto.values);

    if (!validation.isValid) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: validation.errors,
      });
    }

    return await this.instanceService.update(dataObject.dataKey, id, updateDto.values, req.user.id);
  }

  @Delete('instances/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an instance' })
  @ApiParam({ name: 'dataObjectId', description: 'Data object UUID' })
  @ApiParam({ name: 'id', description: 'Instance ID' })
  @ApiResponse({
    status: 204,
    description: 'Instance deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Instance not found' })
  async remove(
    @Param('dataObjectId') dataObjectId: string,
    @Param('id') id: string,
    @Request() req: any,
  ) {
    // Get the dataKey from ID
    const dataObject = await this.prisma.dataObject.findUnique({
      where: { id: dataObjectId },
      select: { dataKey: true },
    });

    if (!dataObject) {
      throw new BadRequestException('Data object not found');
    }

    await this.instanceService.remove(dataObject.dataKey, id, req.user.id);
  }

  @Get('instances/:id/history')
  @ApiOperation({ summary: 'Get change history for an instance' })
  @ApiParam({ name: 'dataObjectId', description: 'Data object UUID' })
  @ApiParam({ name: 'id', description: 'Instance ID' })
  @ApiResponse({
    status: 200,
    description: 'Change history',
  })
  @ApiResponse({ status: 404, description: 'Instance not found' })
  async getHistory(
    @Param('dataObjectId') dataObjectId: string,
    @Param('id') id: string,
  ) {
    // Get the dataKey from ID
    const dataObject = await this.prisma.dataObject.findUnique({
      where: { id: dataObjectId },
      select: { dataKey: true },
    });

    if (!dataObject) {
      throw new BadRequestException('Data object not found');
    }

    return await this.instanceService.getHistory(dataObject.dataKey, id);
  }
}
