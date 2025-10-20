/**
 * Plugin Files Controller
 * Serves plugin files for dynamic frontend loading
 */

import {
  Controller,
  Get,
  Param,
  Res,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PluginStorageService } from '../services/plugin-storage.service';
import { Public } from '../../auth/decorators/public.decorator';

@ApiTags('Plugin Files')
@Controller('plugins')
export class PluginFilesController {
  private readonly logger = new Logger(PluginFilesController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: PluginStorageService,
  ) {}

  /**
   * Serve plugin files
   * Public endpoint for loading plugin JavaScript/CSS files
   */
  @Get(':pluginId/files/*')
  @Public() // No authentication required for file serving
  @ApiOperation({
    summary: 'Serve plugin files',
    description: 'Serve JavaScript, CSS, and asset files for dynamic plugin loading',
  })
  @ApiParam({
    name: 'pluginId',
    description: 'Plugin ID',
    example: 'my-awesome-plugin',
  })
  @ApiParam({
    name: '*',
    description: 'File path relative to plugin root',
    example: 'index.js',
  })
  @ApiResponse({
    status: 200,
    description: 'File content',
  })
  @ApiResponse({
    status: 404,
    description: 'Plugin or file not found',
  })
  async serveFile(
    @Param('pluginId') pluginId: string,
    @Param('0') filepath: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      // Get plugin info from database
      const plugin = await this.prisma.plugin.findUnique({
        where: { pluginId },
      });

      if (!plugin) {
        this.logger.warn(`Plugin not found: ${pluginId}`);
        throw new NotFoundException(`Plugin '${pluginId}' not found`);
      }

      // Only serve files from INSTALLED plugins
      if (plugin.status !== 'INSTALLED') {
        this.logger.warn(
          `Attempt to access files from non-installed plugin: ${pluginId} (status: ${plugin.status})`,
        );
        throw new NotFoundException(
          `Plugin '${pluginId}' is not installed`,
        );
      }

      // Read file from storage
      const fileBuffer = await this.storage.readFile(
        pluginId,
        plugin.version,
        filepath,
      );

      // Set appropriate content type
      const mimeType = this.storage.getMimeType(filepath);
      res.setHeader('Content-Type', mimeType);

      // Set caching headers for better performance
      res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour
      res.setHeader('X-Plugin-Id', pluginId);
      res.setHeader('X-Plugin-Version', plugin.version);

      // Send file
      res.send(fileBuffer);
    } catch (error) {
      if (error instanceof NotFoundException) {
        res.status(404).send({ message: error.message });
        return;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error serving file ${filepath}: ${errorMessage}`);

      res.status(500).send({
        message: 'Failed to serve file',
        error: errorMessage,
      });
    }
  }
}
