import { Test, TestingModule } from '@nestjs/testing';
import { PluginStorageService } from './plugin-storage.service';
import * as fs from 'fs/promises';
import * as fssync from 'fs';
import * as path from 'path';
import AdmZip from 'adm-zip';

// Mock modules
jest.mock('fs/promises', () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
  readFile: jest.fn(),
  writeFile: jest.fn(),
  readdir: jest.fn(),
  stat: jest.fn(),
  access: jest.fn(),
  rm: jest.fn(),
  unlink: jest.fn(),
}));

jest.mock('fs', () => ({
  existsSync: jest.fn(),
}));

jest.mock('adm-zip');

describe('PluginStorageService', () => {
  let service: PluginStorageService;
  const mockFs = fs as jest.Mocked<typeof fs>;
  const mockFsSync = fssync as jest.Mocked<typeof fssync>;
  const MockAdmZip = AdmZip as jest.MockedClass<typeof AdmZip>;

  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();

    // Reset mock implementations
    (mockFs.mkdir as jest.Mock).mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [PluginStorageService],
    }).compile();

    service = module.get<PluginStorageService>(PluginStorageService);

    // Wait for constructor's ensureDirectories to complete
    await new Promise((resolve) => setTimeout(resolve, 10));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor and ensureDirectories', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should create required directories on initialization', () => {
      expect(mockFs.mkdir).toHaveBeenCalled();
      // Should create 4 directories: plugins, uploads, extracted, data
      expect(mockFs.mkdir).toHaveBeenCalledTimes(4);
    });
  });

  describe('getUploadsDir', () => {
    it('should return uploads directory path', () => {
      const uploadsDir = service.getUploadsDir();
      expect(uploadsDir).toContain('plugins');
      expect(uploadsDir).toContain('uploads');
      expect(path.basename(uploadsDir)).toBe('uploads');
    });
  });

  describe('getExtractedDir', () => {
    it('should return extracted directory path', () => {
      const extractedDir = service.getExtractedDir();
      expect(extractedDir).toContain('plugins');
      expect(extractedDir).toContain('extracted');
      expect(path.basename(extractedDir)).toBe('extracted');
    });
  });

  describe('getDataDir', () => {
    it('should return data directory path', () => {
      const dataDir = service.getDataDir();
      expect(dataDir).toContain('plugins');
      expect(dataDir).toContain('data');
      expect(path.basename(dataDir)).toBe('data');
    });
  });

  describe('extractZip', () => {
    it('should extract ZIP file successfully', async () => {
      // Arrange
      const zipPath = '/path/to/plugin.zip';
      const pluginId = 'test-plugin';
      const version = '1.0.0';

      const mockZipInstance = {
        extractAllTo: jest.fn(),
      };
      MockAdmZip.mockImplementation(() => mockZipInstance as any);
      (mockFs.mkdir as jest.Mock).mockResolvedValue(undefined);

      // Act
      const result = await service.extractZip(zipPath, pluginId, version);

      // Assert
      expect(result).toContain('extracted');
      expect(result).toContain(pluginId);
      expect(result).toContain(version);
      expect(MockAdmZip).toHaveBeenCalledWith(zipPath);
      expect(mockZipInstance.extractAllTo).toHaveBeenCalledWith(result, true);
      expect(mockFs.mkdir).toHaveBeenCalledWith(result, { recursive: true });
    });

    it('should handle extraction errors', async () => {
      // Arrange
      const zipPath = '/path/to/invalid.zip';
      const pluginId = 'test-plugin';
      const version = '1.0.0';

      MockAdmZip.mockImplementation(() => {
        throw new Error('Invalid ZIP file');
      });
      (mockFs.mkdir as jest.Mock).mockResolvedValue(undefined);

      // Act & Assert
      await expect(service.extractZip(zipPath, pluginId, version)).rejects.toThrow(
        'Failed to extract plugin: Invalid ZIP file'
      );
    });

    it('should handle directory creation errors', async () => {
      // Arrange
      const zipPath = '/path/to/plugin.zip';
      const pluginId = 'test-plugin';
      const version = '1.0.0';

      (mockFs.mkdir as jest.Mock).mockRejectedValue(new Error('Permission denied'));

      // Act & Assert
      await expect(service.extractZip(zipPath, pluginId, version)).rejects.toThrow(
        'Failed to extract plugin'
      );
    });
  });

  describe('deletePlugin', () => {
    it('should delete plugin directory when it exists', async () => {
      // Arrange
      const pluginId = 'test-plugin';
      (mockFsSync.existsSync as jest.Mock).mockReturnValue(true);
      (mockFs.rm as jest.Mock).mockResolvedValue(undefined);

      // Act
      await service.deletePlugin(pluginId);

      // Assert
      expect(mockFsSync.existsSync).toHaveBeenCalledTimes(2); // extracted and data dirs
      expect(mockFs.rm).toHaveBeenCalledTimes(2);
      expect(mockFs.rm).toHaveBeenCalledWith(
        expect.stringContaining(pluginId),
        { recursive: true, force: true }
      );
    });

    it('should not throw error if plugin directory does not exist', async () => {
      // Arrange
      const pluginId = 'non-existent-plugin';
      (mockFsSync.existsSync as jest.Mock).mockReturnValue(false);
      (mockFs.rm as jest.Mock).mockResolvedValue(undefined);

      // Act
      await service.deletePlugin(pluginId);

      // Assert
      expect(mockFs.rm).not.toHaveBeenCalled();
    });

    it('should handle deletion errors', async () => {
      // Arrange
      const pluginId = 'test-plugin';
      (mockFsSync.existsSync as jest.Mock).mockReturnValue(true);
      (mockFs.rm as jest.Mock).mockRejectedValue(new Error('Permission denied'));

      // Act & Assert
      await expect(service.deletePlugin(pluginId)).rejects.toThrow(
        'Failed to delete plugin: Permission denied'
      );
    });
  });

  describe('readFile', () => {
    it('should read file from plugin directory', async () => {
      // Arrange
      const pluginId = 'test-plugin';
      const version = '1.0.0';
      const filepath = 'config.json';
      const mockBuffer = Buffer.from('{"key": "value"}');

      (mockFs.readFile as jest.Mock).mockResolvedValue(mockBuffer);

      // Act
      const result = await service.readFile(pluginId, version, filepath);

      // Assert
      expect(result).toEqual(mockBuffer);
      expect(mockFs.readFile).toHaveBeenCalledWith(
        expect.stringContaining(pluginId)
      );
    });

    it('should prevent directory traversal attacks by normalizing paths', async () => {
      // Arrange
      const pluginId = 'test-plugin';
      const version = '1.0.0';
      // Paths with .. are normalized and leading .. are removed to prevent traversal
      const filepath = '../../sensitive-file.txt';
      const mockBuffer = Buffer.from('data');

      (mockFs.readFile as jest.Mock).mockResolvedValue(mockBuffer);

      // Act
      const result = await service.readFile(pluginId, version, filepath);

      // Assert
      // The path should be normalized and the file should be read from within the plugin directory
      expect(result).toEqual(mockBuffer);
      expect(mockFs.readFile).toHaveBeenCalled();
      // Verify the called path doesn't escape the plugin directory
      const calledPath = (mockFs.readFile as jest.Mock).mock.calls[0][0];
      expect(calledPath).toContain(pluginId);
      expect(calledPath).toContain(version);
    });

    it('should handle file read errors', async () => {
      // Arrange
      const pluginId = 'test-plugin';
      const version = '1.0.0';
      const filepath = 'missing.txt';

      (mockFs.readFile as jest.Mock).mockRejectedValue(new Error('File not found'));

      // Act & Assert
      await expect(service.readFile(pluginId, version, filepath)).rejects.toThrow(
        'Failed to read file: File not found'
      );
    });

    it('should normalize file paths', async () => {
      // Arrange
      const pluginId = 'test-plugin';
      const version = '1.0.0';
      const filepath = 'subdir/../config.json';
      const mockBuffer = Buffer.from('data');

      (mockFs.readFile as jest.Mock).mockResolvedValue(mockBuffer);

      // Act
      const result = await service.readFile(pluginId, version, filepath);

      // Assert
      expect(result).toEqual(mockBuffer);
      expect(mockFs.readFile).toHaveBeenCalled();
    });
  });

  describe('fileExists', () => {
    it('should return true if file exists', async () => {
      // Arrange
      const pluginId = 'test-plugin';
      const version = '1.0.0';
      const filepath = 'index.js';

      (mockFs.access as jest.Mock).mockResolvedValue(undefined);

      // Act
      const result = await service.fileExists(pluginId, version, filepath);

      // Assert
      expect(result).toBe(true);
      expect(mockFs.access).toHaveBeenCalledWith(
        expect.stringContaining('index.js')
      );
    });

    it('should return false if file does not exist', async () => {
      // Arrange
      const pluginId = 'test-plugin';
      const version = '1.0.0';
      const filepath = 'missing.txt';

      (mockFs.access as jest.Mock).mockRejectedValue(new Error('File not found'));

      // Act
      const result = await service.fileExists(pluginId, version, filepath);

      // Assert
      expect(result).toBe(false);
    });

    it('should normalize file path', async () => {
      // Arrange
      const pluginId = 'test-plugin';
      const version = '1.0.0';
      const filepath = './subdir/../file.txt';

      (mockFs.access as jest.Mock).mockResolvedValue(undefined);

      // Act
      await service.fileExists(pluginId, version, filepath);

      // Assert
      expect(mockFs.access).toHaveBeenCalled();
    });
  });

  describe('writePluginData', () => {
    it('should write JSON data to plugin data directory', async () => {
      // Arrange
      const pluginId = 'test-plugin';
      const filename = 'settings.json';
      const data = { enabled: true, config: { timeout: 5000 } };

      (mockFs.mkdir as jest.Mock).mockResolvedValue(undefined);
      (mockFs.writeFile as jest.Mock).mockResolvedValue(undefined);

      // Act
      await service.writePluginData(pluginId, filename, data);

      // Assert
      expect(mockFs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining(pluginId),
        { recursive: true }
      );
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining(filename),
        JSON.stringify(data, null, 2),
        'utf8'
      );
    });

    it('should write string data without JSON stringification', async () => {
      // Arrange
      const pluginId = 'test-plugin';
      const filename = 'log.txt';
      const data = 'Plain text log content';

      (mockFs.mkdir as jest.Mock).mockResolvedValue(undefined);
      (mockFs.writeFile as jest.Mock).mockResolvedValue(undefined);

      // Act
      await service.writePluginData(pluginId, filename, data);

      // Assert
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining(filename),
        data,
        'utf8'
      );
    });

    it('should handle write errors', async () => {
      // Arrange
      const pluginId = 'test-plugin';
      const filename = 'data.json';
      const data = { test: true };

      (mockFs.mkdir as jest.Mock).mockResolvedValue(undefined);
      (mockFs.writeFile as jest.Mock).mockRejectedValue(new Error('Disk full'));

      // Act & Assert
      await expect(service.writePluginData(pluginId, filename, data)).rejects.toThrow(
        'Failed to write plugin data: Disk full'
      );
    });
  });

  describe('readPluginData', () => {
    it('should read and parse JSON data', async () => {
      // Arrange
      const pluginId = 'test-plugin';
      const filename = 'settings.json';
      const jsonData = { enabled: true, version: '1.0.0' };

      (mockFs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(jsonData));

      // Act
      const result = await service.readPluginData(pluginId, filename);

      // Assert
      expect(result).toEqual(jsonData);
      expect(mockFs.readFile).toHaveBeenCalledWith(
        expect.stringContaining(filename),
        'utf8'
      );
    });

    it('should return raw content if not valid JSON', async () => {
      // Arrange
      const pluginId = 'test-plugin';
      const filename = 'log.txt';
      const textContent = 'Plain text log';

      (mockFs.readFile as jest.Mock).mockResolvedValue(textContent);

      // Act
      const result = await service.readPluginData(pluginId, filename);

      // Assert
      expect(result).toBe(textContent);
    });

    it('should handle read errors', async () => {
      // Arrange
      const pluginId = 'test-plugin';
      const filename = 'missing.json';

      (mockFs.readFile as jest.Mock).mockRejectedValue(new Error('File not found'));

      // Act & Assert
      await expect(service.readPluginData(pluginId, filename)).rejects.toThrow(
        'Failed to read plugin data: File not found'
      );
    });
  });

  describe('deleteUploadedZip', () => {
    it('should delete uploaded ZIP file if it exists', async () => {
      // Arrange
      const filename = 'plugin-v1.0.0.zip';

      (mockFsSync.existsSync as jest.Mock).mockReturnValue(true);
      (mockFs.unlink as jest.Mock).mockResolvedValue(undefined);

      // Act
      await service.deleteUploadedZip(filename);

      // Assert
      expect(mockFsSync.existsSync).toHaveBeenCalledWith(
        expect.stringContaining(filename)
      );
      expect(mockFs.unlink).toHaveBeenCalledWith(
        expect.stringContaining(filename)
      );
    });

    it('should not throw error if ZIP file does not exist', async () => {
      // Arrange
      const filename = 'non-existent.zip';

      (mockFsSync.existsSync as jest.Mock).mockReturnValue(false);
      (mockFs.unlink as jest.Mock);

      // Act
      await service.deleteUploadedZip(filename);

      // Assert
      expect(mockFs.unlink).not.toHaveBeenCalled();
    });

    it('should not throw error on deletion failure', async () => {
      // Arrange
      const filename = 'plugin.zip';

      (mockFsSync.existsSync as jest.Mock).mockReturnValue(true);
      (mockFs.unlink as jest.Mock).mockRejectedValue(new Error('Permission denied'));

      // Act - should not throw
      await expect(service.deleteUploadedZip(filename)).resolves.not.toThrow();
    });
  });

  describe('getMimeType', () => {
    it('should return correct MIME type for JavaScript files', () => {
      expect(service.getMimeType('script.js')).toBe('application/javascript');
    });

    it('should return correct MIME type for JSON files', () => {
      expect(service.getMimeType('config.json')).toBe('application/json');
    });

    it('should return correct MIME type for CSS files', () => {
      expect(service.getMimeType('styles.css')).toBe('text/css');
    });

    it('should return correct MIME type for HTML files', () => {
      expect(service.getMimeType('index.html')).toBe('text/html');
    });

    it('should return correct MIME type for image files', () => {
      expect(service.getMimeType('logo.png')).toBe('image/png');
      expect(service.getMimeType('photo.jpg')).toBe('image/jpeg');
      expect(service.getMimeType('photo.jpeg')).toBe('image/jpeg');
      expect(service.getMimeType('icon.gif')).toBe('image/gif');
      expect(service.getMimeType('vector.svg')).toBe('image/svg+xml');
      expect(service.getMimeType('favicon.ico')).toBe('image/x-icon');
    });

    it('should return correct MIME type for font files', () => {
      expect(service.getMimeType('font.woff')).toBe('font/woff');
      expect(service.getMimeType('font.woff2')).toBe('font/woff2');
      expect(service.getMimeType('font.ttf')).toBe('font/ttf');
      expect(service.getMimeType('font.eot')).toBe('application/vnd.ms-fontobject');
    });

    it('should handle uppercase extensions', () => {
      expect(service.getMimeType('SCRIPT.JS')).toBe('application/javascript');
      expect(service.getMimeType('IMAGE.PNG')).toBe('image/png');
    });

    it('should return default MIME type for unknown extensions', () => {
      expect(service.getMimeType('file.xyz')).toBe('application/octet-stream');
      expect(service.getMimeType('unknown')).toBe('application/octet-stream');
    });

    it('should handle files with multiple dots', () => {
      expect(service.getMimeType('my.config.json')).toBe('application/json');
    });
  });

  describe('getPluginSize', () => {
    it('should calculate plugin directory size', async () => {
      // Arrange
      const pluginId = 'test-plugin';
      const mockRootFiles = ['file1.js', 'file2.json'];

      // Setup mocks to handle the recursive directory traversal
      (mockFs.readdir as jest.Mock).mockResolvedValue(mockRootFiles as any);
      (mockFs.stat as jest.Mock)
        .mockResolvedValueOnce({ isDirectory: () => false, size: 1024 } as any) // file1.js
        .mockResolvedValueOnce({ isDirectory: () => false, size: 512 } as any); // file2.json

      // Act
      const size = await service.getPluginSize(pluginId);

      // Assert
      expect(size).toBe(1536); // 1024 + 512
    });

    it('should return 0 if plugin directory does not exist', async () => {
      // Arrange
      const pluginId = 'non-existent';
      (mockFs.readdir as jest.Mock).mockRejectedValue(new Error('Directory not found'));

      // Act
      const size = await service.getPluginSize(pluginId);

      // Assert
      expect(size).toBe(0);
    });

    it('should handle empty directories', async () => {
      // Arrange
      const pluginId = 'empty-plugin';
      (mockFs.readdir as jest.Mock).mockResolvedValue([] as any);

      // Act
      const size = await service.getPluginSize(pluginId);

      // Assert
      expect(size).toBe(0);
    });
  });
});
