import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PluginService } from './plugin.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PluginValidatorService } from './plugin-validator.service';
import { PluginStorageService } from './plugin-storage.service';
import { PluginRegistryService } from './plugin-registry.service';

describe('PluginService', () => {
  let service: PluginService;
  let prismaService: jest.Mocked<PrismaService>;
  let validatorService: jest.Mocked<PluginValidatorService>;
  let storageService: jest.Mocked<PluginStorageService>;
  let registryService: jest.Mocked<PluginRegistryService>;

  const mockManifest = {
    id: 'test-plugin',
    name: 'Test Plugin',
    version: '1.0.0',
    author: 'Test Author',
    authorEmail: 'test@example.com',
    description: 'Test plugin description',
    icon: 'icon.png',
    license: 'MIT',
    entryPoint: 'index.js',
    dependencies: {
      plugins: [],
      external: [],
    },
  };

  const mockPlugin = {
    id: 'plugin-db-id',
    pluginId: 'test-plugin',
    name: 'Test Plugin',
    version: '1.0.0',
    author: 'Test Author',
    authorEmail: 'test@example.com',
    description: 'Test description',
    icon: 'icon.png',
    license: 'MIT',
    status: 'UPLOADED',
    manifest: mockManifest,
    filePath: '/path/to/extracted',
    zipPath: '/path/to/zip',
    createdAt: new Date(),
    updatedAt: new Date(),
    installedAt: null,
    installedBy: null,
    uninstalledAt: null,
    uninstalledBy: null,
    errorMessage: null,
  };

  const mockFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'test-plugin.zip',
    encoding: '7bit',
    mimetype: 'application/zip',
    size: 1024,
    destination: '/uploads',
    filename: 'test-plugin-123.zip',
    path: '/uploads/test-plugin-123.zip',
    buffer: Buffer.from(''),
    stream: null as any,
  };

  beforeEach(async () => {
    const mockPrismaService = {
      plugin: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
    };

    const mockValidatorService = {
      validatePlugin: jest.fn(),
    };

    const mockStorageService = {
      deleteUploadedZip: jest.fn(),
      extractZip: jest.fn(),
      deletePlugin: jest.fn(),
    };

    const mockRegistryService = {
      unregisterPlugin: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PluginService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: PluginValidatorService, useValue: mockValidatorService },
        { provide: PluginStorageService, useValue: mockStorageService },
        { provide: PluginRegistryService, useValue: mockRegistryService },
      ],
    }).compile();

    service = module.get<PluginService>(PluginService);
    prismaService = module.get(PrismaService) as any;
    validatorService = module.get(PluginValidatorService) as any;
    storageService = module.get(PluginStorageService) as any;
    registryService = module.get(PluginRegistryService) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadPlugin', () => {
    it('should upload plugin successfully', async () => {
      validatorService.validatePlugin.mockReturnValue({
        isValid: true,
        manifest: mockManifest,
        errors: [],
        warnings: [],
      });

      (prismaService.plugin.findUnique as jest.Mock).mockResolvedValue(null);
      storageService.extractZip.mockResolvedValue('/extracted/path');
      (prismaService.plugin.create as jest.Mock).mockResolvedValue(mockPlugin);

      const result = await service.uploadPlugin(mockFile, 'user-123');

      expect(result.success).toBe(true);
      expect(result.pluginId).toBe('test-plugin');
      expect(result.name).toBe('Test Plugin');
      expect(result.version).toBe('1.0.0');
      expect(validatorService.validatePlugin).toHaveBeenCalledWith(mockFile.path);
      expect(prismaService.plugin.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if validation fails', async () => {
      validatorService.validatePlugin.mockReturnValue({
        isValid: false,
        manifest: null,
        errors: ['Invalid manifest'],
        warnings: [],
      });

      storageService.deleteUploadedZip.mockResolvedValue(undefined);

      await expect(service.uploadPlugin(mockFile, 'user-123')).rejects.toThrow(
        BadRequestException,
      );

      expect(storageService.deleteUploadedZip).toHaveBeenCalledWith(
        mockFile.filename,
      );
    });

    it('should throw BadRequestException if plugin already exists', async () => {
      validatorService.validatePlugin.mockReturnValue({
        isValid: true,
        manifest: mockManifest,
        errors: [],
        warnings: [],
      });

      (prismaService.plugin.findUnique as jest.Mock).mockResolvedValue(
        mockPlugin,
      );
      storageService.deleteUploadedZip.mockResolvedValue(undefined);

      await expect(service.uploadPlugin(mockFile, 'user-123')).rejects.toThrow(
        BadRequestException,
      );

      expect(storageService.deleteUploadedZip).toHaveBeenCalled();
    });

    it('should clean up and throw InternalServerErrorException on unexpected error', async () => {
      validatorService.validatePlugin.mockReturnValue({
        isValid: true,
        manifest: mockManifest,
        errors: [],
        warnings: [],
      });

      (prismaService.plugin.findUnique as jest.Mock).mockResolvedValue(null);
      storageService.extractZip.mockRejectedValue(new Error('Extract failed'));
      storageService.deleteUploadedZip.mockResolvedValue(undefined);

      await expect(service.uploadPlugin(mockFile, 'user-123')).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(storageService.deleteUploadedZip).toHaveBeenCalledWith(
        mockFile.filename,
      );
    });
  });

  describe('listPlugins', () => {
    it('should list plugins with default pagination', async () => {
      const mockPlugins = [mockPlugin];
      (prismaService.plugin.findMany as jest.Mock).mockResolvedValue(mockPlugins);
      (prismaService.plugin.count as jest.Mock).mockResolvedValue(1);

      const result = await service.listPlugins({});

      expect(result.plugins).toEqual(mockPlugins);
      expect(result.total).toBe(1);
      expect(prismaService.plugin.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter plugins by status', async () => {
      (prismaService.plugin.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.plugin.count as jest.Mock).mockResolvedValue(0);

      await service.listPlugins({ status: 'INSTALLED' });

      expect(prismaService.plugin.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'INSTALLED' },
        }),
      );
    });

    it('should search plugins by name, pluginId, or description', async () => {
      (prismaService.plugin.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.plugin.count as jest.Mock).mockResolvedValue(0);

      await service.listPlugins({ search: 'test' });

      expect(prismaService.plugin.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { name: { contains: 'test', mode: 'insensitive' } },
              { pluginId: { contains: 'test', mode: 'insensitive' } },
              { description: { contains: 'test', mode: 'insensitive' } },
            ],
          },
        }),
      );
    });

    it('should support custom pagination and sorting', async () => {
      (prismaService.plugin.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.plugin.count as jest.Mock).mockResolvedValue(0);

      await service.listPlugins({
        page: 2,
        limit: 20,
        sortBy: 'name',
        sortOrder: 'asc',
      });

      expect(prismaService.plugin.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 20,
        take: 20,
        orderBy: { name: 'asc' },
      });
    });

    it('should throw InternalServerErrorException on database error', async () => {
      (prismaService.plugin.findMany as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.listPlugins({})).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('getPlugin', () => {
    it('should get plugin by database ID', async () => {
      (prismaService.plugin.findFirst as jest.Mock).mockResolvedValue(mockPlugin);

      const result = await service.getPlugin('plugin-db-id');

      expect(result).toEqual(mockPlugin);
      expect(prismaService.plugin.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [{ id: 'plugin-db-id' }, { pluginId: 'plugin-db-id' }],
        },
      });
    });

    it('should get plugin by pluginId', async () => {
      (prismaService.plugin.findFirst as jest.Mock).mockResolvedValue(mockPlugin);

      const result = await service.getPlugin('test-plugin');

      expect(result).toEqual(mockPlugin);
    });

    it('should throw NotFoundException if plugin not found', async () => {
      (prismaService.plugin.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.getPlugin('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw InternalServerErrorException on database error', async () => {
      (prismaService.plugin.findFirst as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.getPlugin('test-plugin')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('installPlugin', () => {
    it('should install plugin successfully', async () => {
      (prismaService.plugin.findFirst as jest.Mock).mockResolvedValue(mockPlugin);
      (prismaService.plugin.update as jest.Mock).mockResolvedValue({
        ...mockPlugin,
        status: 'INSTALLED',
        installedAt: new Date(),
      });

      const result = await service.installPlugin('test-plugin', 'user-123');

      expect(result.success).toBe(true);
      expect(result.pluginId).toBe('test-plugin');
      expect(prismaService.plugin.update).toHaveBeenCalledWith({
        where: { id: mockPlugin.id },
        data: {
          status: 'INSTALLED',
          installedAt: expect.any(Date),
          installedBy: 'user-123',
          errorMessage: null,
        },
      });
    });

    it('should throw NotFoundException if plugin not found', async () => {
      (prismaService.plugin.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.installPlugin('non-existent', 'user-123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if plugin already installed', async () => {
      (prismaService.plugin.findFirst as jest.Mock).mockResolvedValue({
        ...mockPlugin,
        status: 'INSTALLED',
      });

      await expect(
        service.installPlugin('test-plugin', 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should validate dependencies before installation', async () => {
      const pluginWithDeps = {
        ...mockPlugin,
        manifest: {
          ...mockManifest,
          dependencies: {
            plugins: ['required-plugin@1.0.0'],
            external: [],
          },
        },
      };

      (prismaService.plugin.findFirst as jest.Mock)
        .mockResolvedValueOnce(pluginWithDeps) // For main plugin
        .mockResolvedValueOnce(null); // For dependency check

      (prismaService.plugin.update as jest.Mock).mockResolvedValue({
        ...pluginWithDeps,
        status: 'FAILED',
      });

      await expect(
        service.installPlugin('test-plugin', 'user-123'),
      ).rejects.toThrow(BadRequestException);

      expect(prismaService.plugin.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'FAILED',
          }),
        }),
      );
    });

    it('should mark plugin as FAILED on installation error', async () => {
      (prismaService.plugin.findFirst as jest.Mock).mockResolvedValue(mockPlugin);
      (prismaService.plugin.update as jest.Mock)
        .mockRejectedValueOnce(new Error('Installation failed'))
        .mockResolvedValueOnce({ ...mockPlugin, status: 'FAILED' });

      await expect(
        service.installPlugin('test-plugin', 'user-123'),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('uninstallPlugin', () => {
    it('should uninstall plugin successfully', async () => {
      const installedPlugin = { ...mockPlugin, status: 'INSTALLED' };
      (prismaService.plugin.findFirst as jest.Mock).mockResolvedValue(
        installedPlugin,
      );
      (prismaService.plugin.update as jest.Mock).mockResolvedValue({
        ...installedPlugin,
        status: 'UNINSTALLED',
      });
      registryService.unregisterPlugin.mockReturnValue(undefined);

      const result = await service.uninstallPlugin('test-plugin', 'user-123');

      expect(result.success).toBe(true);
      expect(result.pluginId).toBe('test-plugin');
      expect(prismaService.plugin.update).toHaveBeenCalledWith({
        where: { id: installedPlugin.id },
        data: {
          status: 'UNINSTALLED',
          uninstalledAt: expect.any(Date),
          uninstalledBy: 'user-123',
        },
      });
      expect(registryService.unregisterPlugin).toHaveBeenCalledWith(
        'test-plugin',
      );
    });

    it('should throw NotFoundException if plugin not found', async () => {
      (prismaService.plugin.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.uninstallPlugin('non-existent', 'user-123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException on database error', async () => {
      (prismaService.plugin.findFirst as jest.Mock).mockResolvedValue(mockPlugin);
      (prismaService.plugin.update as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.uninstallPlugin('test-plugin', 'user-123'),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('deletePlugin', () => {
    it('should delete plugin successfully', async () => {
      (prismaService.plugin.findFirst as jest.Mock).mockResolvedValue(mockPlugin);
      registryService.unregisterPlugin.mockReturnValue(undefined);
      storageService.deletePlugin.mockResolvedValue(undefined);
      storageService.deleteUploadedZip.mockResolvedValue(undefined);
      (prismaService.plugin.delete as jest.Mock).mockResolvedValue(mockPlugin);

      const result = await service.deletePlugin('test-plugin');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Plugin deleted successfully');
      expect(registryService.unregisterPlugin).toHaveBeenCalledWith(
        'test-plugin',
      );
      expect(storageService.deletePlugin).toHaveBeenCalledWith('test-plugin');
      expect(prismaService.plugin.delete).toHaveBeenCalledWith({
        where: { id: mockPlugin.id },
      });
    });

    it('should delete ZIP file if exists', async () => {
      (prismaService.plugin.findFirst as jest.Mock).mockResolvedValue(mockPlugin);
      registryService.unregisterPlugin.mockReturnValue(undefined);
      storageService.deletePlugin.mockResolvedValue(undefined);
      storageService.deleteUploadedZip.mockResolvedValue(undefined);
      (prismaService.plugin.delete as jest.Mock).mockResolvedValue(mockPlugin);

      await service.deletePlugin('test-plugin');

      expect(storageService.deleteUploadedZip).toHaveBeenCalled();
    });

    it('should throw NotFoundException if plugin not found', async () => {
      (prismaService.plugin.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.deletePlugin('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw InternalServerErrorException on deletion error', async () => {
      (prismaService.plugin.findFirst as jest.Mock).mockResolvedValue(mockPlugin);
      registryService.unregisterPlugin.mockReturnValue(undefined);
      storageService.deletePlugin.mockRejectedValue(
        new Error('Deletion failed'),
      );

      await expect(service.deletePlugin('test-plugin')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('getManifest', () => {
    it('should return plugin manifest', async () => {
      (prismaService.plugin.findFirst as jest.Mock).mockResolvedValue(mockPlugin);

      const result = await service.getManifest('test-plugin');

      expect(result.manifest).toEqual(mockManifest);
    });

    it('should throw NotFoundException if plugin not found', async () => {
      (prismaService.plugin.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.getManifest('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw InternalServerErrorException on database error', async () => {
      (prismaService.plugin.findFirst as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.getManifest('test-plugin')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('getInstalledPlugins', () => {
    it('should return list of installed plugins', async () => {
      const installedPlugins = [
        { ...mockPlugin, status: 'INSTALLED' },
        { ...mockPlugin, id: 'plugin-2', status: 'INSTALLED' },
      ];
      (prismaService.plugin.findMany as jest.Mock).mockResolvedValue(
        installedPlugins,
      );

      const result = await service.getInstalledPlugins();

      expect(result).toEqual(installedPlugins);
      expect(prismaService.plugin.findMany).toHaveBeenCalledWith({
        where: { status: 'INSTALLED' },
        orderBy: { installedAt: 'asc' },
      });
    });

    it('should return empty array if no plugins installed', async () => {
      (prismaService.plugin.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getInstalledPlugins();

      expect(result).toEqual([]);
    });

    it('should throw InternalServerErrorException on database error', async () => {
      (prismaService.plugin.findMany as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.getInstalledPlugins()).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
