/**
 * Plugin Controller
 * Admin API endpoints for plugin management
 */

import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PluginService } from '../services/plugin.service';
import {
  PluginUploadResponseDto,
  PluginListResponseDto,
  PluginResponseDto,
  PluginInstallResponseDto,
  PluginManifestResponseDto,
  PluginUninstallResponseDto,
  QueryPluginsDto,
} from '../dto';

@ApiTags('Plugin Management')
@Controller('admin/plugins')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class PluginController {
  constructor(private readonly pluginService: PluginService) {}

  /**
   * Upload a plugin ZIP file
   */
  @Post('upload')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './plugins/uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `plugin-${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req, file, cb) => {
        if (extname(file.originalname) !== '.zip') {
          return cb(new Error('Only ZIP files are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload a plugin ZIP file',
    description: 'Upload a plugin package. Only SUPER_ADMIN can upload plugins.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Plugin ZIP file (max 10MB)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Plugin uploaded successfully',
    type: PluginUploadResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file or validation failed',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async uploadPlugin(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ): Promise<PluginUploadResponseDto> {
    const userId = req.user?.id;
    return this.pluginService.uploadPlugin(file, userId);
  }

  /**
   * List all plugins
   */
  @Get()
  @ApiOperation({
    summary: 'List all plugins',
    description: 'Get a list of all plugins with optional filtering and pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Plugins retrieved successfully',
    type: PluginListResponseDto,
  })
  async listPlugins(@Query() query: QueryPluginsDto): Promise<PluginListResponseDto> {
    return this.pluginService.listPlugins(query);
  }

  /**
   * Get installed plugins (for frontend initialization)
   * IMPORTANT: Specific routes must come before parameterized routes
   */
  @Get('installed/list')
  @ApiOperation({
    summary: 'Get installed plugins',
    description: 'Get a list of all currently installed plugins',
  })
  @ApiResponse({
    status: 200,
    description: 'Installed plugins retrieved',
    type: [PluginResponseDto],
  })
  async getInstalledPlugins(): Promise<PluginResponseDto[]> {
    return this.pluginService.getInstalledPlugins();
  }

  /**
   * Get plugin manifest
   * IMPORTANT: This must come before @Get(':id') to avoid route conflicts
   */
  @Get(':id/manifest')
  @ApiOperation({
    summary: 'Get plugin manifest',
    description: 'Get the manifest (plugin.json) for a specific plugin',
  })
  @ApiParam({
    name: 'id',
    description: 'Plugin database ID or plugin ID',
    example: 'my-awesome-plugin',
  })
  @ApiResponse({
    status: 200,
    description: 'Manifest retrieved successfully',
    type: PluginManifestResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Plugin not found',
  })
  async getManifest(@Param('id') id: string): Promise<PluginManifestResponseDto> {
    return this.pluginService.getManifest(id);
  }

  /**
   * Get plugin by ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get plugin details',
    description: 'Get detailed information about a specific plugin',
  })
  @ApiParam({
    name: 'id',
    description: 'Plugin database ID or plugin ID',
    example: 'my-awesome-plugin',
  })
  @ApiResponse({
    status: 200,
    description: 'Plugin details retrieved',
    type: PluginResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Plugin not found',
  })
  async getPlugin(@Param('id') id: string): Promise<PluginResponseDto> {
    return this.pluginService.getPlugin(id);
  }

  /**
   * Install a plugin
   */
  @Post(':id/install')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Install a plugin',
    description: 'Install an uploaded plugin to make it active',
  })
  @ApiParam({
    name: 'id',
    description: 'Plugin database ID or plugin ID',
    example: 'my-awesome-plugin',
  })
  @ApiResponse({
    status: 200,
    description: 'Plugin installed successfully',
    type: PluginInstallResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Plugin already installed or installation failed',
  })
  @ApiResponse({
    status: 404,
    description: 'Plugin not found',
  })
  async installPlugin(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<PluginInstallResponseDto> {
    const userId = req.user?.id;
    return this.pluginService.installPlugin(id, userId);
  }

  /**
   * Uninstall a plugin
   */
  @Post(':id/uninstall')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Uninstall a plugin',
    description: 'Uninstall an active plugin (keeps files for potential reinstall)',
  })
  @ApiParam({
    name: 'id',
    description: 'Plugin database ID or plugin ID',
    example: 'my-awesome-plugin',
  })
  @ApiResponse({
    status: 200,
    description: 'Plugin uninstalled successfully',
    type: PluginUninstallResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Plugin not found',
  })
  async uninstallPlugin(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<PluginUninstallResponseDto> {
    const userId = req.user?.id;
    return this.pluginService.uninstallPlugin(id, userId);
  }

  /**
   * Delete a plugin completely
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a plugin',
    description: 'Permanently delete a plugin (files and database record)',
  })
  @ApiParam({
    name: 'id',
    description: 'Plugin database ID or plugin ID',
    example: 'my-awesome-plugin',
  })
  @ApiResponse({
    status: 200,
    description: 'Plugin deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Plugin deleted successfully' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Plugin not found',
  })
  async deletePlugin(@Param('id') id: string): Promise<{ success: boolean; message: string }> {
    return this.pluginService.deletePlugin(id);
  }
}
