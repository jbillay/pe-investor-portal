/**
 * Plugin Storage Service
 * Handles file system operations for plugins
 */

import { Injectable, Logger } from '@nestjs/common';
import AdmZip from 'adm-zip';
import * as fs from 'fs/promises';
import * as fssync from 'fs';
import * as path from 'path';

@Injectable()
export class PluginStorageService {
  private readonly logger = new Logger(PluginStorageService.name);

  // Base directories for plugin storage
  private readonly PLUGINS_DIR = path.join(process.cwd(), 'plugins');
  private readonly UPLOADS_DIR = path.join(this.PLUGINS_DIR, 'uploads');
  private readonly EXTRACTED_DIR = path.join(this.PLUGINS_DIR, 'extracted');
  private readonly DATA_DIR = path.join(this.PLUGINS_DIR, 'data');

  constructor() {
    // Ensure directories exist on service initialization
    this.ensureDirectories();
  }

  /**
   * Ensure all required directories exist
   */
  private async ensureDirectories(): Promise<void> {
    const dirs = [this.PLUGINS_DIR, this.UPLOADS_DIR, this.EXTRACTED_DIR, this.DATA_DIR];

    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
        this.logger.log(`Directory ensured: ${dir}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Failed to create directory ${dir}: ${errorMessage}`);
      }
    }
  }

  /**
   * Get uploads directory path
   */
  getUploadsDir(): string {
    return this.UPLOADS_DIR;
  }

  /**
   * Get extracted plugins directory path
   */
  getExtractedDir(): string {
    return this.EXTRACTED_DIR;
  }

  /**
   * Get plugin data directory path
   */
  getDataDir(): string {
    return this.DATA_DIR;
  }

  /**
   * Extract ZIP file to plugin directory
   * @param zipPath Path to ZIP file
   * @param pluginId Plugin ID
   * @param version Plugin version
   * @returns Path to extracted directory
   */
  async extractZip(
    zipPath: string,
    pluginId: string,
    version: string,
  ): Promise<string> {
    try {
      const extractPath = path.join(this.EXTRACTED_DIR, pluginId, version);

      // Create extraction directory
      await fs.mkdir(extractPath, { recursive: true });

      // Extract ZIP
      const zip = new AdmZip(zipPath);
      zip.extractAllTo(extractPath, true);

      this.logger.log(`Plugin extracted to: ${extractPath}`);

      return extractPath;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error extracting ZIP: ${errorMessage}`);
      throw new Error(`Failed to extract plugin: ${errorMessage}`);
    }
  }

  /**
   * Delete plugin directory
   * @param pluginId Plugin ID
   */
  async deletePlugin(pluginId: string): Promise<void> {
    try {
      const pluginDir = path.join(this.EXTRACTED_DIR, pluginId);

      if (fssync.existsSync(pluginDir)) {
        await fs.rm(pluginDir, { recursive: true, force: true });
        this.logger.log(`Plugin directory deleted: ${pluginDir}`);
      }

      // Also delete data directory
      const dataDir = path.join(this.DATA_DIR, pluginId);
      if (fssync.existsSync(dataDir)) {
        await fs.rm(dataDir, { recursive: true, force: true });
        this.logger.log(`Plugin data deleted: ${dataDir}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error deleting plugin: ${errorMessage}`);
      throw new Error(`Failed to delete plugin: ${errorMessage}`);
    }
  }

  /**
   * Read file from plugin directory
   * @param pluginId Plugin ID
   * @param version Plugin version
   * @param filepath Relative file path
   * @returns File buffer
   */
  async readFile(
    pluginId: string,
    version: string,
    filepath: string,
  ): Promise<Buffer> {
    try {
      // Normalize path to prevent directory traversal
      const normalizedPath = path.normalize(filepath).replace(/^(\.\.(\/|\\|$))+/, '');
      const fullPath = path.join(this.EXTRACTED_DIR, pluginId, version, normalizedPath);

      // Security check: Ensure the resolved path is within plugin directory
      const pluginDir = path.join(this.EXTRACTED_DIR, pluginId, version);
      if (!fullPath.startsWith(pluginDir)) {
        throw new Error('Invalid file path: Directory traversal detected');
      }

      const buffer = await fs.readFile(fullPath);
      return buffer;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error reading file ${filepath}: ${errorMessage}`);
      throw new Error(`Failed to read file: ${errorMessage}`);
    }
  }

  /**
   * Check if file exists in plugin directory
   * @param pluginId Plugin ID
   * @param version Plugin version
   * @param filepath Relative file path
   * @returns True if file exists
   */
  async fileExists(
    pluginId: string,
    version: string,
    filepath: string,
  ): Promise<boolean> {
    try {
      const normalizedPath = path.normalize(filepath).replace(/^(\.\.(\/|\\|$))+/, '');
      const fullPath = path.join(this.EXTRACTED_DIR, pluginId, version, normalizedPath);

      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Write data to plugin data directory
   * @param pluginId Plugin ID
   * @param filename Filename
   * @param data Data to write
   */
  async writePluginData(
    pluginId: string,
    filename: string,
    data: any,
  ): Promise<void> {
    try {
      const dataDir = path.join(this.DATA_DIR, pluginId);
      await fs.mkdir(dataDir, { recursive: true });

      const filePath = path.join(dataDir, filename);
      const content =
        typeof data === 'string' ? data : JSON.stringify(data, null, 2);

      await fs.writeFile(filePath, content, 'utf8');
      this.logger.log(`Plugin data written: ${filePath}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error writing plugin data: ${errorMessage}`);
      throw new Error(`Failed to write plugin data: ${errorMessage}`);
    }
  }

  /**
   * Read data from plugin data directory
   * @param pluginId Plugin ID
   * @param filename Filename
   * @returns File content (parsed as JSON if applicable)
   */
  async readPluginData(pluginId: string, filename: string): Promise<any> {
    try {
      const filePath = path.join(this.DATA_DIR, pluginId, filename);
      const content = await fs.readFile(filePath, 'utf8');

      // Try to parse as JSON
      try {
        return JSON.parse(content);
      } catch {
        // Return raw content if not JSON
        return content;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error reading plugin data: ${errorMessage}`);
      throw new Error(`Failed to read plugin data: ${errorMessage}`);
    }
  }

  /**
   * Delete uploaded ZIP file
   * @param filename ZIP filename
   */
  async deleteUploadedZip(filename: string): Promise<void> {
    try {
      const zipPath = path.join(this.UPLOADS_DIR, filename);
      if (fssync.existsSync(zipPath)) {
        await fs.unlink(zipPath);
        this.logger.log(`Uploaded ZIP deleted: ${zipPath}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Failed to delete uploaded ZIP: ${errorMessage}`);
    }
  }

  /**
   * Get MIME type for file extension
   * @param filepath File path
   * @returns MIME type
   */
  getMimeType(filepath: string): string {
    const ext = path.extname(filepath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.css': 'text/css',
      '.html': 'text/html',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
      '.eot': 'application/vnd.ms-fontobject',
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Get plugin directory size
   * @param pluginId Plugin ID
   * @returns Size in bytes
   */
  async getPluginSize(pluginId: string): Promise<number> {
    try {
      const pluginDir = path.join(this.EXTRACTED_DIR, pluginId);
      return await this.getDirectorySize(pluginDir);
    } catch (error) {
      this.logger.warn(`Failed to get plugin size: ${error}`);
      return 0;
    }
  }

  /**
   * Get directory size recursively
   * @param dirPath Directory path
   * @returns Size in bytes
   */
  private async getDirectorySize(dirPath: string): Promise<number> {
    let size = 0;

    try {
      const files = await fs.readdir(dirPath);

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = await fs.stat(filePath);

        if (stats.isDirectory()) {
          size += await this.getDirectorySize(filePath);
        } else {
          size += stats.size;
        }
      }
    } catch (error) {
      // Ignore errors
    }

    return size;
  }
}
