import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { Request, Response } from 'express';
import { PluginFilesController } from './plugin-files.controller';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PluginStorageService } from '../services/plugin-storage.service';

describe('PluginFilesController', () => {
  let controller: PluginFilesController;
  let prismaService: jest.Mocked<PrismaService>;
  let storageService: jest.Mocked<PluginStorageService>;

  const mockPlugin = {
    id: 'plugin-db-id',
    pluginId: 'test-plugin',
    version: '1.0.0',
    status: 'INSTALLED',
    name: 'Test Plugin',
  };

  beforeEach(async () => {
    const mockPrismaService = {
      plugin: {
        findUnique: jest.fn(),
      },
    };

    const mockStorageService = {
      readFile: jest.fn(),
      getMimeType: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PluginFilesController],
      providers: [
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: PluginStorageService, useValue: mockStorageService },
      ],
    }).compile();

    controller = module.get<PluginFilesController>(PluginFilesController);
    prismaService = module.get(PrismaService) as any;
    storageService = module.get(PluginStorageService) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('serveFile', () => {
    it('should serve JavaScript file successfully', async () => {
      const mockReq = {
        url: '/plugins/test-plugin/files/index.js',
      } as Request;

      const mockRes = {
        setHeader: jest.fn(),
        send: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      const fileBuffer = Buffer.from('console.log("hello")');

      (prismaService.plugin.findUnique as jest.Mock).mockResolvedValue(mockPlugin);
      storageService.readFile.mockResolvedValue(fileBuffer);
      storageService.getMimeType.mockReturnValue('application/javascript');

      await controller.serveFile('test-plugin', mockReq, mockRes);

      expect(prismaService.plugin.findUnique).toHaveBeenCalledWith({
        where: { pluginId: 'test-plugin' },
      });
      expect(storageService.readFile).toHaveBeenCalledWith(
        'test-plugin',
        '1.0.0',
        'index.js',
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/javascript',
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Cache-Control',
        'public, max-age=3600',
      );
      expect(mockRes.send).toHaveBeenCalledWith(fileBuffer);
    });

    it('should serve CSS file successfully', async () => {
      const mockReq = {
        url: '/plugins/test-plugin/files/styles.css',
      } as Request;

      const mockRes = {
        setHeader: jest.fn(),
        send: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      const fileBuffer = Buffer.from('body { color: blue; }');

      (prismaService.plugin.findUnique as jest.Mock).mockResolvedValue(mockPlugin);
      storageService.readFile.mockResolvedValue(fileBuffer);
      storageService.getMimeType.mockReturnValue('text/css');

      await controller.serveFile('test-plugin', mockReq, mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/css');
      expect(mockRes.send).toHaveBeenCalledWith(fileBuffer);
    });

    it('should strip query parameters from file path', async () => {
      const mockReq = {
        url: '/plugins/test-plugin/files/index.js?import&v=12345',
      } as Request;

      const mockRes = {
        setHeader: jest.fn(),
        send: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      (prismaService.plugin.findUnique as jest.Mock).mockResolvedValue(mockPlugin);
      storageService.readFile.mockResolvedValue(Buffer.from(''));
      storageService.getMimeType.mockReturnValue('application/javascript');

      await controller.serveFile('test-plugin', mockReq, mockRes);

      expect(storageService.readFile).toHaveBeenCalledWith(
        'test-plugin',
        '1.0.0',
        'index.js',
      );
    });

    it('should return 404 if file path not specified', async () => {
      const mockReq = {
        url: '/plugins/test-plugin/files',
      } as Request;

      const mockRes = {
        setHeader: jest.fn(),
        send: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      await controller.serveFile('test-plugin', mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.send).toHaveBeenCalledWith({
        message: 'File path not specified',
      });
    });

    it('should return 404 if plugin not found', async () => {
      const mockReq = {
        url: '/plugins/non-existent/files/index.js',
      } as Request;

      const mockRes = {
        setHeader: jest.fn(),
        send: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      (prismaService.plugin.findUnique as jest.Mock).mockResolvedValue(null);

      await controller.serveFile('non-existent', mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.send).toHaveBeenCalledWith({
        message: "Plugin 'non-existent' not found",
      });
    });

    it('should return 404 if plugin not installed', async () => {
      const mockReq = {
        url: '/plugins/test-plugin/files/index.js',
      } as Request;

      const mockRes = {
        setHeader: jest.fn(),
        send: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      (prismaService.plugin.findUnique as jest.Mock).mockResolvedValue({
        ...mockPlugin,
        status: 'UPLOADED',
      });

      await controller.serveFile('test-plugin', mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.send).toHaveBeenCalledWith({
        message: "Plugin 'test-plugin' is not installed",
      });
    });

    it('should set correct headers including version', async () => {
      const mockReq = {
        url: '/plugins/test-plugin/files/index.js',
      } as Request;

      const mockRes = {
        setHeader: jest.fn(),
        send: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      (prismaService.plugin.findUnique as jest.Mock).mockResolvedValue(mockPlugin);
      storageService.readFile.mockResolvedValue(Buffer.from(''));
      storageService.getMimeType.mockReturnValue('application/javascript');

      await controller.serveFile('test-plugin', mockReq, mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Plugin-Id', 'test-plugin');
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Plugin-Version', '1.0.0');
    });

    it('should handle storage errors gracefully', async () => {
      const mockReq = {
        url: '/plugins/test-plugin/files/missing.js',
      } as Request;

      const mockRes = {
        setHeader: jest.fn(),
        send: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      (prismaService.plugin.findUnique as jest.Mock).mockResolvedValue(mockPlugin);
      storageService.readFile.mockRejectedValue(new Error('File not found'));

      await controller.serveFile('test-plugin', mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        message: 'Failed to serve file',
        error: 'File not found',
      });
    });
  });
});
