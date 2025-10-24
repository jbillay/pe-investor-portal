/**
 * Plugin Service
 * Core service for plugin management operations
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PluginValidatorService } from './plugin-validator.service';
import { PluginStorageService } from './plugin-storage.service';
import { PluginRegistryService } from './plugin-registry.service';
import {
  PluginResponseDto,
  PluginUploadResponseDto,
  PluginInstallResponseDto,
  PluginManifestResponseDto,
  PluginListResponseDto,
  PluginUninstallResponseDto,
  QueryPluginsDto,
} from '../dto';
import { PluginManifest } from '../interfaces';
import * as path from 'path';

@Injectable()
export class PluginService {
  private readonly logger = new Logger(PluginService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly validator: PluginValidatorService,
    private readonly storage: PluginStorageService,
    private readonly registry: PluginRegistryService,
  ) {}

  /**
   * Upload a plugin ZIP file
   * @param file Uploaded file
   * @param userId User ID who is uploading
   * @returns Upload response
   */
  async uploadPlugin(
    file: Express.Multer.File,
    userId: string,
  ): Promise<PluginUploadResponseDto> {
    try {
      this.logger.log(`Uploading plugin: ${file.originalname}`);

      // Validate ZIP and extract manifest
      const validation = this.validator.validatePlugin(file.path);

      if (!validation.isValid) {
        // Delete uploaded file if validation fails
        await this.storage.deleteUploadedZip(file.filename);
        throw new BadRequestException({
          message: 'Plugin validation failed',
          errors: validation.errors,
          warnings: validation.warnings,
        });
      }

      const manifest = validation.manifest as PluginManifest;

      // Check if plugin already exists
      const existing = await this.prisma.plugin.findUnique({
        where: { pluginId: manifest.id },
      });

      if (existing) {
        // Delete uploaded file
        await this.storage.deleteUploadedZip(file.filename);
        throw new BadRequestException(
          `Plugin with ID '${manifest.id}' already exists. Please uninstall the existing plugin first.`,
        );
      }

      // Extract plugin to storage
      const extractedPath = await this.storage.extractZip(
        file.path,
        manifest.id,
        manifest.version,
      );

      // Create database record
      const plugin = await this.prisma.plugin.create({
        data: {
          pluginId: manifest.id,
          name: manifest.name,
          version: manifest.version,
          author: manifest.author,
          authorEmail: manifest.authorEmail,
          description: manifest.description,
          icon: manifest.icon,
          license: manifest.license,
          status: 'UPLOADED',
          manifest: manifest as any,
          filePath: extractedPath,
          zipPath: file.path,
        },
      });

      this.logger.log(
        `Plugin uploaded successfully: ${manifest.id} v${manifest.version}`,
      );

      return {
        success: true,
        pluginId: manifest.id,
        name: manifest.name,
        version: manifest.version,
        message: 'Plugin uploaded successfully',
        warnings: validation.warnings,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error uploading plugin: ${errorMessage}`);

      // Clean up uploaded file
      if (file?.filename) {
        await this.storage.deleteUploadedZip(file.filename);
      }

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Failed to upload plugin: ${errorMessage}`,
      );
    }
  }

  /**
   * List all plugins with optional filtering
   * @param query Query parameters
   * @returns Paginated plugin list
   */
  async listPlugins(query: QueryPluginsDto): Promise<PluginListResponseDto> {
    try {
      const { status, search, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = query;

      const where: any = {};

      if (status) {
        where.status = status;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { pluginId: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [plugins, total] = await Promise.all([
        this.prisma.plugin.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
        }),
        this.prisma.plugin.count({ where }),
      ]);

      return {
        plugins: plugins as any,
        total,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error listing plugins: ${errorMessage}`);
      throw new InternalServerErrorException(
        `Failed to list plugins: ${errorMessage}`,
      );
    }
  }

  /**
   * Get plugin by ID
   * @param id Plugin database ID or plugin ID
   * @returns Plugin details
   */
  async getPlugin(id: string): Promise<PluginResponseDto> {
    try {
      // Try to find by database ID first, then by pluginId
      const plugin = await this.prisma.plugin.findFirst({
        where: {
          OR: [{ id }, { pluginId: id }],
        },
      });

      if (!plugin) {
        throw new NotFoundException(`Plugin with ID '${id}' not found`);
      }

      return plugin as any;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error getting plugin: ${errorMessage}`);
      throw new InternalServerErrorException(
        `Failed to get plugin: ${errorMessage}`,
      );
    }
  }

  /**
   * Validates plugin dependencies
   * @param manifest Plugin manifest with dependencies
   * @returns Dependency validation result
   */
  private async validateDependencies(manifest: any): Promise<{
    satisfied: boolean;
    missingPlugins?: string[];
    missingPackages?: string[];
    warnings?: string[];
  }> {
    const warnings: string[] = [];
    const missingPlugins: string[] = [];
    const missingPackages: string[] = [];

    // Check plugin dependencies
    if (manifest.dependencies?.plugins) {
      const requiredPlugins = Array.isArray(manifest.dependencies.plugins)
        ? manifest.dependencies.plugins
        : [];

      for (const requiredPlugin of requiredPlugins) {
        // Parse plugin requirement (e.g., "base-plugin@^1.0.0")
        const [pluginId, versionRange] = requiredPlugin.split('@');

        // Check if plugin is installed
        const installedPlugin = await this.prisma.plugin.findFirst({
          where: {
            pluginId,
            status: 'INSTALLED',
          },
        });

        if (!installedPlugin) {
          missingPlugins.push(requiredPlugin);
        } else if (versionRange) {
          // Basic version check (you can enhance this with semver library)
          warnings.push(
            `Plugin '${pluginId}' is installed but version compatibility not verified`,
          );
        }
      }
    }

    // Check external package dependencies
    if (manifest.dependencies?.external) {
      const requiredPackages = Array.isArray(manifest.dependencies.external)
        ? manifest.dependencies.external
        : [];

      for (const requiredPackage of requiredPackages) {
        // Note: We can't easily check npm packages from backend
        // This is a placeholder for future enhancement
        warnings.push(
          `External package dependency '${requiredPackage}' must be available in frontend`,
        );
      }
    }

    const satisfied =
      missingPlugins.length === 0 && missingPackages.length === 0;

    return {
      satisfied,
      missingPlugins: missingPlugins.length > 0 ? missingPlugins : undefined,
      missingPackages:
        missingPackages.length > 0 ? missingPackages : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Install a plugin
   * @param id Plugin database ID or plugin ID
   * @param userId User ID who is installing
   * @returns Install response
   */
  async installPlugin(
    id: string,
    userId: string,
  ): Promise<PluginInstallResponseDto> {
    try {
      this.logger.log(`Installing plugin: ${id}`);

      // Get plugin record
      const plugin = await this.prisma.plugin.findFirst({
        where: {
          OR: [{ id }, { pluginId: id }],
        },
      });

      if (!plugin) {
        throw new NotFoundException(`Plugin with ID '${id}' not found`);
      }

      if (plugin.status === 'INSTALLED') {
        throw new BadRequestException(
          `Plugin '${plugin.name}' is already installed`,
        );
      }

      // Validate dependencies
      const manifest = plugin.manifest as any;
      const dependencyValidation = await this.validateDependencies(manifest);

      // If dependencies are not satisfied, throw error
      if (!dependencyValidation.satisfied) {
        const errorParts: string[] = [];

        if (dependencyValidation.missingPlugins?.length) {
          errorParts.push(
            `Missing required plugins: ${dependencyValidation.missingPlugins.join(', ')}`,
          );
        }

        if (dependencyValidation.missingPackages?.length) {
          errorParts.push(
            `Missing required packages: ${dependencyValidation.missingPackages.join(', ')}`,
          );
        }

        const errorMessage = errorParts.join('. ');

        // Mark plugin as FAILED with dependency error
        await this.prisma.plugin.update({
          where: { id: plugin.id },
          data: {
            status: 'FAILED',
            errorMessage,
          },
        });

        throw new BadRequestException(errorMessage);
      }

      // Update plugin status to INSTALLED
      const updatedPlugin = await this.prisma.plugin.update({
        where: { id: plugin.id },
        data: {
          status: 'INSTALLED',
          installedAt: new Date(),
          installedBy: userId,
          errorMessage: null,
        },
      });

      this.logger.log(
        `Plugin installed successfully: ${plugin.pluginId} v${plugin.version}`,
      );

      return {
        success: true,
        pluginId: plugin.pluginId,
        name: plugin.name,
        version: plugin.version,
        message: 'Plugin installed successfully',
        installedAt: updatedPlugin.installedAt as Date,
        dependencies: dependencyValidation,
        warnings: dependencyValidation.warnings,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error installing plugin: ${errorMessage}`);

      // Mark plugin as FAILED
      try {
        await this.prisma.plugin.update({
          where: { id },
          data: {
            status: 'FAILED',
            errorMessage,
          },
        });
      } catch (updateError) {
        // Ignore update error
      }

      throw new InternalServerErrorException(
        `Failed to install plugin: ${errorMessage}`,
      );
    }
  }

  /**
   * Uninstall a plugin
   * @param id Plugin database ID or plugin ID
   * @param userId User ID who is uninstalling
   * @returns Uninstall response
   */
  async uninstallPlugin(
    id: string,
    userId: string,
  ): Promise<PluginUninstallResponseDto> {
    try {
      this.logger.log(`Uninstalling plugin: ${id}`);

      // Get plugin record
      const plugin = await this.prisma.plugin.findFirst({
        where: {
          OR: [{ id }, { pluginId: id }],
        },
      });

      if (!plugin) {
        throw new NotFoundException(`Plugin with ID '${id}' not found`);
      }

      // Update plugin status
      await this.prisma.plugin.update({
        where: { id: plugin.id },
        data: {
          status: 'UNINSTALLED',
          uninstalledAt: new Date(),
          uninstalledBy: userId,
        },
      });

      // Unregister from in-memory registry
      this.registry.unregisterPlugin(plugin.pluginId);

      // Optionally delete plugin files (keep for now for rollback capability)
      // await this.storage.deletePlugin(plugin.pluginId);

      this.logger.log(`Plugin uninstalled: ${plugin.pluginId}`);

      return {
        success: true,
        pluginId: plugin.pluginId,
        message: 'Plugin uninstalled successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error uninstalling plugin: ${errorMessage}`);
      throw new InternalServerErrorException(
        `Failed to uninstall plugin: ${errorMessage}`,
      );
    }
  }

  /**
   * Delete a plugin completely (files and database record)
   * @param id Plugin database ID or plugin ID
   * @returns Success message
   */
  async deletePlugin(id: string): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log(`Deleting plugin: ${id}`);

      // Get plugin record
      const plugin = await this.prisma.plugin.findFirst({
        where: {
          OR: [{ id }, { pluginId: id }],
        },
      });

      if (!plugin) {
        throw new NotFoundException(`Plugin with ID '${id}' not found`);
      }

      // Unregister from registry if loaded
      this.registry.unregisterPlugin(plugin.pluginId);

      // Delete files
      await this.storage.deletePlugin(plugin.pluginId);

      // Delete ZIP file
      if (plugin.zipPath) {
        const filename = path.basename(plugin.zipPath);
        await this.storage.deleteUploadedZip(filename);
      }

      // Delete database record
      await this.prisma.plugin.delete({
        where: { id: plugin.id },
      });

      this.logger.log(`Plugin deleted: ${plugin.pluginId}`);

      return {
        success: true,
        message: 'Plugin deleted successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error deleting plugin: ${errorMessage}`);
      throw new InternalServerErrorException(
        `Failed to delete plugin: ${errorMessage}`,
      );
    }
  }

  /**
   * Get plugin manifest
   * @param id Plugin database ID or plugin ID
   * @returns Manifest
   */
  async getManifest(id: string): Promise<PluginManifestResponseDto> {
    try {
      const plugin = await this.prisma.plugin.findFirst({
        where: {
          OR: [{ id }, { pluginId: id }],
        },
      });

      if (!plugin) {
        throw new NotFoundException(`Plugin with ID '${id}' not found`);
      }

      return {
        manifest: plugin.manifest as any,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error getting manifest: ${errorMessage}`);
      throw new InternalServerErrorException(
        `Failed to get manifest: ${errorMessage}`,
      );
    }
  }

  /**
   * Get installed plugins (for frontend initialization)
   * @returns List of installed plugins
   */
  async getInstalledPlugins(): Promise<PluginResponseDto[]> {
    try {
      const plugins = await this.prisma.plugin.findMany({
        where: { status: 'INSTALLED' },
        orderBy: { installedAt: 'asc' },
      });

      return plugins as any;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error getting installed plugins: ${errorMessage}`);
      throw new InternalServerErrorException(
        `Failed to get installed plugins: ${errorMessage}`,
      );
    }
  }
}
