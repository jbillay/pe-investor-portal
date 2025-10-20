/**
 * Plugin Validator Service
 * Validates plugin manifests and ZIP file structure
 */

import { Injectable, Logger } from '@nestjs/common';
import { PluginManifest, ValidationResult } from '../interfaces';
import * as semver from 'semver';
import AdmZip from 'adm-zip';
import * as path from 'path';

@Injectable()
export class PluginValidatorService {
  private readonly logger = new Logger(PluginValidatorService.name);

  // Core version for compatibility checking
  private readonly CORE_VERSION = '1.0.0';

  // Required files in plugin ZIP
  private readonly REQUIRED_FILES = ['plugin.json', 'index.js'];

  // Dangerous file extensions to block
  private readonly DANGEROUS_EXTENSIONS = [
    '.exe',
    '.sh',
    '.bat',
    '.cmd',
    '.com',
    '.dll',
    '.so',
    '.dylib',
  ];

  /**
   * Validate plugin ZIP file structure
   * @param zipPath Path to ZIP file
   * @returns Validation result
   */
  validateZipStructure(zipPath: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const zip = new AdmZip(zipPath);
      const zipEntries = zip.getEntries();

      // Check for required files
      const fileNames = zipEntries.map((entry: AdmZip.IZipEntry) => entry.entryName);

      for (const requiredFile of this.REQUIRED_FILES) {
        if (!fileNames.includes(requiredFile)) {
          errors.push(`Missing required file: ${requiredFile}`);
        }
      }

      // Check for dangerous files
      for (const entry of zipEntries) {
        const ext = path.extname(entry.entryName).toLowerCase();
        if (this.DANGEROUS_EXTENSIONS.includes(ext)) {
          errors.push(
            `Dangerous file type not allowed: ${entry.entryName} (${ext})`,
          );
        }
      }

      // Validate file size (individual files should not exceed 5MB)
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
      for (const entry of zipEntries) {
        if (entry.header.size > MAX_FILE_SIZE) {
          warnings.push(
            `Large file detected: ${entry.entryName} (${(entry.header.size / 1024 / 1024).toFixed(2)}MB)`,
          );
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error validating ZIP structure: ${errorMessage}`);
      return {
        isValid: false,
        errors: [`Invalid ZIP file: ${errorMessage}`],
        warnings: [],
      };
    }
  }

  /**
   * Extract and validate plugin manifest
   * @param zipPath Path to ZIP file
   * @returns Manifest object or null if invalid
   */
  extractManifest(zipPath: string): PluginManifest | null {
    try {
      const zip = new AdmZip(zipPath);
      const manifestEntry = zip.getEntry('plugin.json');

      if (!manifestEntry) {
        this.logger.error('plugin.json not found in ZIP');
        return null;
      }

      const manifestContent = manifestEntry.getData().toString('utf8');
      const manifest = JSON.parse(manifestContent);

      return manifest as PluginManifest;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error extracting manifest: ${errorMessage}`);
      return null;
    }
  }

  /**
   * Validate plugin manifest schema
   * @param manifest Plugin manifest object
   * @returns Validation result
   */
  validateManifest(manifest: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    const requiredFields = ['id', 'name', 'version', 'author', 'coreVersion'];

    for (const field of requiredFields) {
      if (!manifest[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate plugin ID format (kebab-case)
    if (manifest.id) {
      const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
      if (!idPattern.test(manifest.id)) {
        errors.push(
          `Invalid plugin ID: ${manifest.id}. Must be kebab-case (e.g., "my-plugin")`,
        );
      }
    }

    // Validate version format (semver)
    if (manifest.version) {
      if (!semver.valid(manifest.version)) {
        errors.push(
          `Invalid version format: ${manifest.version}. Must be semver (e.g., "1.0.0")`,
        );
      }
    }

    // Validate core version format
    if (manifest.coreVersion) {
      const coreVersionPattern = /^[>=<^~]*\d+\.\d+\.\d+$/;
      if (!coreVersionPattern.test(manifest.coreVersion)) {
        errors.push(
          `Invalid coreVersion format: ${manifest.coreVersion}. Must be semver with range (e.g., ">=1.0.0")`,
        );
      }
    }

    // Validate menu items if present
    if (manifest.menus) {
      if (!Array.isArray(manifest.menus)) {
        errors.push('menus must be an array');
      } else {
        manifest.menus.forEach((menu: any, index: number) => {
          if (!menu.id) errors.push(`Menu item ${index}: missing id`);
          if (!menu.label) errors.push(`Menu item ${index}: missing label`);
          if (!menu.type || !['main', 'admin'].includes(menu.type)) {
            errors.push(
              `Menu item ${index}: type must be "main" or "admin"`,
            );
          }
          if (!menu.route) errors.push(`Menu item ${index}: missing route`);
        });
      }
    }

    // Validate widgets if present
    if (manifest.widgets) {
      if (!Array.isArray(manifest.widgets)) {
        errors.push('widgets must be an array');
      } else {
        manifest.widgets.forEach((widget: any, index: number) => {
          if (!widget.id) errors.push(`Widget ${index}: missing id`);
          if (!widget.name) errors.push(`Widget ${index}: missing name`);
          if (!widget.component)
            errors.push(`Widget ${index}: missing component`);
          if (!widget.slot) errors.push(`Widget ${index}: missing slot`);
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Check if plugin is compatible with current core version
   * @param requiredVersion Required core version from manifest
   * @returns True if compatible
   */
  isCompatible(requiredVersion: string): boolean {
    try {
      // Remove leading operators (>=, ^, ~, etc.)
      const cleanVersion = requiredVersion.replace(/^[>=<^~]+/, '');

      if (!semver.valid(cleanVersion)) {
        this.logger.warn(`Invalid core version format: ${requiredVersion}`);
        return false;
      }

      // Check if current core version satisfies required version
      const satisfied = semver.satisfies(this.CORE_VERSION, requiredVersion);

      if (!satisfied) {
        this.logger.warn(
          `Plugin requires core version ${requiredVersion}, but current version is ${this.CORE_VERSION}`,
        );
      }

      return satisfied;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error checking compatibility: ${errorMessage}`);
      return false;
    }
  }

  /**
   * Comprehensive plugin validation
   * Validates both ZIP structure and manifest
   * @param zipPath Path to ZIP file
   * @returns Validation result with manifest
   */
  validatePlugin(zipPath: string): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    manifest: PluginManifest | null;
  } {
    // Step 1: Validate ZIP structure
    const zipValidation = this.validateZipStructure(zipPath);
    if (!zipValidation.isValid) {
      return {
        isValid: zipValidation.isValid,
        errors: zipValidation.errors,
        warnings: zipValidation.warnings || [],
        manifest: null,
      };
    }

    // Step 2: Extract manifest
    const manifest = this.extractManifest(zipPath);
    if (!manifest) {
      return {
        isValid: false,
        errors: ['Failed to extract or parse plugin.json'],
        warnings: zipValidation.warnings || [],
        manifest: null as any,
      };
    }

    // Step 3: Validate manifest schema
    const manifestValidation = this.validateManifest(manifest);
    if (!manifestValidation.isValid) {
      return {
        ...manifestValidation,
        warnings: [
          ...(zipValidation.warnings || []),
          ...(manifestValidation.warnings || []),
        ],
        manifest,
      };
    }

    // Step 4: Check core version compatibility
    if (!this.isCompatible(manifest.coreVersion)) {
      return {
        isValid: false,
        errors: [
          `Plugin requires core version ${manifest.coreVersion}, but current version is ${this.CORE_VERSION}`,
        ],
        warnings: [
          ...(zipValidation.warnings || []),
          ...(manifestValidation.warnings || []),
        ],
        manifest,
      };
    }

    // All validations passed
    return {
      isValid: true,
      errors: [],
      warnings: [
        ...(zipValidation.warnings || []),
        ...(manifestValidation.warnings || []),
      ],
      manifest,
    };
  }
}
