/**
 * Plugin Response DTOs
 * Data Transfer Objects for plugin API responses
 */

import { ApiProperty } from '@nestjs/swagger';
import { PluginManifest } from '../interfaces';

export class PluginResponseDto {
  @ApiProperty({
    description: 'Database ID',
    example: 'clxxx1234567890',
  })
  id: string;

  @ApiProperty({
    description: 'Plugin ID from manifest',
    example: 'my-awesome-plugin',
  })
  pluginId: string;

  @ApiProperty({
    description: 'Plugin name',
    example: 'My Awesome Plugin',
  })
  name: string;

  @ApiProperty({
    description: 'Plugin version',
    example: '1.0.0',
  })
  version: string;

  @ApiProperty({
    description: 'Plugin author',
    example: 'John Doe',
  })
  author: string;

  @ApiProperty({
    description: 'Plugin description',
    example: 'A plugin that does awesome things',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Plugin icon path',
    example: 'assets/icon.png',
    required: false,
  })
  icon?: string;

  @ApiProperty({
    description: 'Plugin status',
    enum: ['UPLOADED', 'INSTALLED', 'FAILED', 'UNINSTALLED'],
    example: 'INSTALLED',
  })
  status: string;

  @ApiProperty({
    description: 'Installation timestamp',
    example: '2025-01-15T10:30:00Z',
    required: false,
  })
  installedAt?: Date;

  @ApiProperty({
    description: 'User ID who installed the plugin',
    example: 'clxxx1234567890',
    required: false,
  })
  installedBy?: string;

  @ApiProperty({
    description: 'Error message if installation failed',
    required: false,
  })
  errorMessage?: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2025-01-15T10:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2025-01-15T10:30:00Z',
  })
  updatedAt: Date;
}

export class PluginUploadResponseDto {
  @ApiProperty({
    description: 'Upload success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Plugin ID',
    example: 'my-awesome-plugin',
  })
  pluginId: string;

  @ApiProperty({
    description: 'Plugin name',
    example: 'My Awesome Plugin',
  })
  name: string;

  @ApiProperty({
    description: 'Plugin version',
    example: '1.0.0',
  })
  version: string;

  @ApiProperty({
    description: 'Success message',
    example: 'Plugin uploaded successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Validation warnings',
    type: [String],
    required: false,
  })
  warnings?: string[];
}

export class PluginInstallResponseDto {
  @ApiProperty({
    description: 'Installation success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Plugin ID',
    example: 'my-awesome-plugin',
  })
  pluginId: string;

  @ApiProperty({
    description: 'Success message',
    example: 'Plugin installed successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Installation timestamp',
    example: '2025-01-15T10:30:00Z',
  })
  installedAt: Date;
}

export class PluginManifestResponseDto {
  @ApiProperty({
    description: 'Plugin manifest object',
    type: Object,
  })
  manifest: PluginManifest;
}

export class PluginListResponseDto {
  @ApiProperty({
    description: 'List of plugins',
    type: [PluginResponseDto],
  })
  plugins: PluginResponseDto[];

  @ApiProperty({
    description: 'Total count',
    example: 10,
  })
  total: number;
}

export class PluginUninstallResponseDto {
  @ApiProperty({
    description: 'Uninstallation success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Plugin ID',
    example: 'my-awesome-plugin',
  })
  pluginId: string;

  @ApiProperty({
    description: 'Success message',
    example: 'Plugin uninstalled successfully',
  })
  message: string;
}

export class PluginHookResponseDto {
  @ApiProperty({
    description: 'Hook execution success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Hook output',
    example: 'Installation script executed successfully',
  })
  output?: string;

  @ApiProperty({
    description: 'Error message if hook failed',
    required: false,
  })
  error?: string;
}
