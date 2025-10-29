import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { DataObjectService } from '../services/data-object.service';
import { FieldService } from '../services/field.service';
import { VersioningService } from '../services/versioning.service';
import { CreateDataObjectDto, CreateFieldDto } from '../dto/create-data-object.dto';
import { UpdateDataObjectDto } from '../dto/update-data-object.dto';
import { UpdateFieldDto } from '../dto/update-field.dto';

@ApiTags('Data Objects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/data-objects')
export class DataObjectController {
  constructor(
    private readonly dataObjectService: DataObjectService,
    private readonly fieldService: FieldService,
    private readonly versioningService: VersioningService,
  ) {}

  // ============================================================================
  // DATA OBJECT CRUD OPERATIONS
  // ============================================================================

  @Post()
  @ApiOperation({ summary: 'Create a new data object' })
  @ApiResponse({
    status: 201,
    description: 'Data object created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 409, description: 'Data object with this key already exists' })
  async create(
    @Body() createDto: CreateDataObjectDto,
    @Request() req: any,
  ) {
    return await this.dataObjectService.create(createDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all data objects' })
  @ApiResponse({
    status: 200,
    description: 'List of all data objects',
  })
  async findAll() {
    return await this.dataObjectService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a data object by ID' })
  @ApiParam({ name: 'id', description: 'Data object ID' })
  @ApiResponse({
    status: 200,
    description: 'Data object details',
  })
  @ApiResponse({ status: 404, description: 'Data object not found' })
  async findOne(@Param('id') id: string) {
    return await this.dataObjectService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a data object (creates new version)' })
  @ApiParam({ name: 'id', description: 'Data object ID' })
  @ApiResponse({
    status: 200,
    description: 'Data object updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Data object not found' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateDataObjectDto,
    @Request() req: any,
  ) {
    return await this.dataObjectService.update(id, updateDto, req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a data object' })
  @ApiParam({ name: 'id', description: 'Data object ID' })
  @ApiResponse({
    status: 204,
    description: 'Data object deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Data object not found' })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete data object with existing instances',
  })
  async remove(@Param('id') id: string) {
    await this.dataObjectService.remove(id);
  }

  // ============================================================================
  // FIELD MANAGEMENT
  // ============================================================================

  @Post(':id/fields')
  @ApiOperation({ summary: 'Add a field to data object (creates new version)' })
  @ApiParam({ name: 'id', description: 'Data object ID' })
  @ApiResponse({
    status: 201,
    description: 'Field added successfully',
  })
  @ApiResponse({ status: 404, description: 'Data object not found' })
  @ApiResponse({ status: 409, description: 'Field with this key already exists' })
  async addField(
    @Param('id') id: string,
    @Body() fieldDto: CreateFieldDto,
    @Request() req: any,
  ) {
    return await this.fieldService.addField(id, fieldDto, req.user.id);
  }

  @Put(':id/fields/:fieldId')
  @ApiOperation({ summary: 'Update a field (creates new version)' })
  @ApiParam({ name: 'id', description: 'Data object ID' })
  @ApiParam({ name: 'fieldId', description: 'Field ID' })
  @ApiResponse({
    status: 200,
    description: 'Field updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Field not found' })
  async updateField(
    @Param('id') id: string,
    @Param('fieldId') fieldId: string,
    @Body() updateDto: UpdateFieldDto,
    @Request() req: any,
  ) {
    return await this.fieldService.updateField(id, fieldId, updateDto, req.user.id);
  }

  @Delete(':id/fields/:fieldId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a field (creates new version)' })
  @ApiParam({ name: 'id', description: 'Data object ID' })
  @ApiParam({ name: 'fieldId', description: 'Field ID' })
  @ApiResponse({
    status: 204,
    description: 'Field deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Field not found' })
  async deleteField(
    @Param('id') id: string,
    @Param('fieldId') fieldId: string,
    @Request() req: any,
  ) {
    await this.fieldService.deleteField(id, fieldId, req.user.id);
  }

  // ============================================================================
  // VERSION MANAGEMENT
  // ============================================================================

  @Get(':id/versions')
  @ApiOperation({ summary: 'Get version history for data object' })
  @ApiParam({ name: 'id', description: 'Data object ID' })
  @ApiResponse({
    status: 200,
    description: 'Version history',
  })
  @ApiResponse({ status: 404, description: 'Data object not found' })
  async getVersionHistory(@Param('id') id: string) {
    return await this.versioningService.getVersionHistory(id);
  }

  @Get(':id/versions/:version')
  @ApiOperation({ summary: 'Get specific version schema' })
  @ApiParam({ name: 'id', description: 'Data object ID' })
  @ApiParam({ name: 'version', description: 'Version number' })
  @ApiResponse({
    status: 200,
    description: 'Version schema',
  })
  @ApiResponse({ status: 404, description: 'Version not found' })
  async getVersion(
    @Param('id') id: string,
    @Param('version') version: string,
  ) {
    return await this.versioningService.getVersion(id, parseInt(version));
  }

  @Get(':id/versions/compare/:version1/:version2')
  @ApiOperation({ summary: 'Compare two versions' })
  @ApiParam({ name: 'id', description: 'Data object ID' })
  @ApiParam({ name: 'version1', description: 'First version number' })
  @ApiParam({ name: 'version2', description: 'Second version number' })
  @ApiResponse({
    status: 200,
    description: 'Version comparison',
  })
  async compareVersions(
    @Param('id') id: string,
    @Param('version1') version1: string,
    @Param('version2') version2: string,
  ) {
    return await this.versioningService.compareVersions(
      id,
      parseInt(version1),
      parseInt(version2),
    );
  }
}
