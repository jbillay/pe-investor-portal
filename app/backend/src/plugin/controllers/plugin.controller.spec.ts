import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { PluginController } from './plugin.controller';
import { PluginService } from '../services/plugin.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

describe('PluginController', () => {
  let controller: PluginController;
  let pluginService: jest.Mocked<PluginService>;

  const mockUser = {
    id: 'user-123',
    email: 'admin@example.com',
    roles: ['SUPER_ADMIN'],
  };

  const mockPlugin = {
    id: 'plugin-123',
    pluginId: 'my-awesome-plugin',
    name: 'My Awesome Plugin',
    version: '1.0.0',
    status: 'INSTALLED',
    manifest: {
      id: 'my-awesome-plugin',
      name: 'My Awesome Plugin',
      version: '1.0.0',
      description: 'A great plugin',
      author: 'Developer',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockFile = {
    fieldname: 'file',
    originalname: 'plugin.zip',
    encoding: '7bit',
    mimetype: 'application/zip',
    buffer: Buffer.from('mock zip content'),
    size: 1024,
    path: '/tmp/plugin-123456.zip',
  } as Express.Multer.File;

  beforeEach(async () => {
    const mockPluginService = {
      uploadPlugin: jest.fn(),
      listPlugins: jest.fn(),
      getInstalledPlugins: jest.fn(),
      getManifest: jest.fn(),
      getPlugin: jest.fn(),
      installPlugin: jest.fn(),
      uninstallPlugin: jest.fn(),
      deletePlugin: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PluginController],
      providers: [
        { provide: PluginService, useValue: mockPluginService },
        Reflector,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<PluginController>(PluginController);
    pluginService = module.get(PluginService) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadPlugin', () => {
    it('should upload a plugin successfully', async () => {
      const mockRequest = { user: mockUser };
      const mockResponse = {
        success: true,
        pluginId: 'my-awesome-plugin',
        message: 'Plugin uploaded successfully',
      };

      pluginService.uploadPlugin.mockResolvedValue(mockResponse as any);

      const result = await controller.uploadPlugin(mockFile, mockRequest);

      expect(result).toEqual(mockResponse);
      expect(pluginService.uploadPlugin).toHaveBeenCalledWith(mockFile, 'user-123');
    });

    it('should handle upload without user', async () => {
      const mockRequest = { user: null };
      const mockResponse = {
        success: true,
        pluginId: 'my-awesome-plugin',
        message: 'Plugin uploaded successfully',
      };

      pluginService.uploadPlugin.mockResolvedValue(mockResponse as any);

      const result = await controller.uploadPlugin(mockFile, mockRequest);

      expect(result).toEqual(mockResponse);
      expect(pluginService.uploadPlugin).toHaveBeenCalledWith(mockFile, undefined);
    });
  });

  describe('listPlugins', () => {
    it('should return paginated list of plugins', async () => {
      const query = { page: 1, limit: 20 };
      const mockResponse = {
        data: [mockPlugin],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      };

      pluginService.listPlugins.mockResolvedValue(mockResponse as any);

      const result = await controller.listPlugins(query as any);

      expect(result).toEqual(mockResponse);
      expect(pluginService.listPlugins).toHaveBeenCalledWith(query);
    });

    it('should list plugins with status filter', async () => {
      const query = { page: 1, limit: 20, status: 'INSTALLED' };
      const mockResponse = {
        data: [mockPlugin],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      };

      pluginService.listPlugins.mockResolvedValue(mockResponse as any);

      const result = await controller.listPlugins(query as any);

      expect(result).toEqual(mockResponse);
      expect(pluginService.listPlugins).toHaveBeenCalledWith(query);
    });
  });

  describe('getInstalledPlugins', () => {
    it('should return list of installed plugins', async () => {
      const installedPlugins = [mockPlugin];

      pluginService.getInstalledPlugins.mockResolvedValue(installedPlugins as any);

      const result = await controller.getInstalledPlugins();

      expect(result).toEqual(installedPlugins);
      expect(pluginService.getInstalledPlugins).toHaveBeenCalled();
    });
  });

  describe('getManifest', () => {
    it('should return plugin manifest', async () => {
      const mockManifest = {
        id: 'my-awesome-plugin',
        name: 'My Awesome Plugin',
        version: '1.0.0',
        description: 'A great plugin',
        author: 'Developer',
        homepage: 'https://example.com',
        repository: 'https://github.com/example/plugin',
        license: 'MIT',
        entrypoint: 'index.js',
        styles: ['styles.css'],
        dependencies: {},
        permissions: ['READ_DATA'],
      };

      pluginService.getManifest.mockResolvedValue(mockManifest as any);

      const result = await controller.getManifest('my-awesome-plugin');

      expect(result).toEqual(mockManifest);
      expect(pluginService.getManifest).toHaveBeenCalledWith('my-awesome-plugin');
    });
  });

  describe('getPlugin', () => {
    it('should return plugin details by ID', async () => {
      pluginService.getPlugin.mockResolvedValue(mockPlugin as any);

      const result = await controller.getPlugin('plugin-123');

      expect(result).toEqual(mockPlugin);
      expect(pluginService.getPlugin).toHaveBeenCalledWith('plugin-123');
    });

    it('should return plugin details by plugin ID', async () => {
      pluginService.getPlugin.mockResolvedValue(mockPlugin as any);

      const result = await controller.getPlugin('my-awesome-plugin');

      expect(result).toEqual(mockPlugin);
      expect(pluginService.getPlugin).toHaveBeenCalledWith('my-awesome-plugin');
    });
  });

  describe('installPlugin', () => {
    it('should install a plugin successfully', async () => {
      const mockRequest = { user: mockUser };
      const mockResponse = {
        success: true,
        pluginId: 'my-awesome-plugin',
        message: 'Plugin installed successfully',
      };

      pluginService.installPlugin.mockResolvedValue(mockResponse as any);

      const result = await controller.installPlugin('my-awesome-plugin', mockRequest);

      expect(result).toEqual(mockResponse);
      expect(pluginService.installPlugin).toHaveBeenCalledWith('my-awesome-plugin', 'user-123');
    });

    it('should handle install without user', async () => {
      const mockRequest = { user: null };
      const mockResponse = {
        success: true,
        pluginId: 'my-awesome-plugin',
        message: 'Plugin installed successfully',
      };

      pluginService.installPlugin.mockResolvedValue(mockResponse as any);

      const result = await controller.installPlugin('my-awesome-plugin', mockRequest);

      expect(result).toEqual(mockResponse);
      expect(pluginService.installPlugin).toHaveBeenCalledWith('my-awesome-plugin', undefined);
    });
  });

  describe('uninstallPlugin', () => {
    it('should uninstall a plugin successfully', async () => {
      const mockRequest = { user: mockUser };
      const mockResponse = {
        success: true,
        pluginId: 'my-awesome-plugin',
        message: 'Plugin uninstalled successfully',
      };

      pluginService.uninstallPlugin.mockResolvedValue(mockResponse as any);

      const result = await controller.uninstallPlugin('my-awesome-plugin', mockRequest);

      expect(result).toEqual(mockResponse);
      expect(pluginService.uninstallPlugin).toHaveBeenCalledWith('my-awesome-plugin', 'user-123');
    });

    it('should handle uninstall without user', async () => {
      const mockRequest = { user: null };
      const mockResponse = {
        success: true,
        pluginId: 'my-awesome-plugin',
        message: 'Plugin uninstalled successfully',
      };

      pluginService.uninstallPlugin.mockResolvedValue(mockResponse as any);

      const result = await controller.uninstallPlugin('my-awesome-plugin', mockRequest);

      expect(result).toEqual(mockResponse);
      expect(pluginService.uninstallPlugin).toHaveBeenCalledWith('my-awesome-plugin', undefined);
    });
  });

  describe('deletePlugin', () => {
    it('should delete a plugin successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Plugin deleted successfully',
      };

      pluginService.deletePlugin.mockResolvedValue(mockResponse);

      const result = await controller.deletePlugin('my-awesome-plugin');

      expect(result).toEqual(mockResponse);
      expect(pluginService.deletePlugin).toHaveBeenCalledWith('my-awesome-plugin');
    });
  });
});
