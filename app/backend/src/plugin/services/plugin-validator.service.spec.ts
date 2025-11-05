import { Test, TestingModule } from '@nestjs/testing';
import { PluginValidatorService } from './plugin-validator.service';
import { PluginManifest } from '../interfaces';

// Mock semver
jest.mock('semver', () => ({
  valid: jest.fn(),
  satisfies: jest.fn(),
}));
import * as semver from 'semver';

// Mock AdmZip
jest.mock('adm-zip');
import AdmZip from 'adm-zip';

describe('PluginValidatorService', () => {
  let service: PluginValidatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PluginValidatorService],
    }).compile();

    service = module.get<PluginValidatorService>(PluginValidatorService);
    jest.clearAllMocks();
  });

  describe('validateZipStructure', () => {
    it('should pass validation for valid ZIP with required files', () => {
      const mockEntries = [
        { entryName: 'plugin.json', header: { size: 1024 } },
        { entryName: 'index.js', header: { size: 2048 } },
      ];

      (AdmZip as jest.MockedClass<typeof AdmZip>).mockImplementation(() => ({
        getEntries: jest.fn().mockReturnValue(mockEntries),
      } as any));

      const result = service.validateZipStructure('/path/to/plugin.zip');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when plugin.json is missing', () => {
      const mockEntries = [
        { entryName: 'index.js', header: { size: 2048 } },
      ];

      (AdmZip as jest.MockedClass<typeof AdmZip>).mockImplementation(() => ({
        getEntries: jest.fn().mockReturnValue(mockEntries),
      } as any));

      const result = service.validateZipStructure('/path/to/plugin.zip');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing required file: plugin.json');
    });

    it('should fail when index.js is missing', () => {
      const mockEntries = [
        { entryName: 'plugin.json', header: { size: 1024 } },
      ];

      (AdmZip as jest.MockedClass<typeof AdmZip>).mockImplementation(() => ({
        getEntries: jest.fn().mockReturnValue(mockEntries),
      } as any));

      const result = service.validateZipStructure('/path/to/plugin.zip');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing required file: index.js');
    });

    it('should fail when dangerous file extensions are present', () => {
      const mockEntries = [
        { entryName: 'plugin.json', header: { size: 1024 } },
        { entryName: 'index.js', header: { size: 2048 } },
        { entryName: 'malicious.exe', header: { size: 512 } },
      ];

      (AdmZip as jest.MockedClass<typeof AdmZip>).mockImplementation(() => ({
        getEntries: jest.fn().mockReturnValue(mockEntries),
      } as any));

      const result = service.validateZipStructure('/path/to/plugin.zip');

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Dangerous file type not allowed');
      expect(result.errors[0]).toContain('.exe');
    });

    it('should detect dangerous extensions (.sh, .bat, .cmd, .dll, .so)', () => {
      const dangerousFiles = [
        'script.sh',
        'runner.bat',
        'cmd.cmd',
        'library.dll',
        'lib.so',
      ];

      for (const filename of dangerousFiles) {
        const mockEntries = [
          { entryName: 'plugin.json', header: { size: 1024 } },
          { entryName: 'index.js', header: { size: 2048 } },
          { entryName: filename, header: { size: 512 } },
        ];

        (AdmZip as jest.MockedClass<typeof AdmZip>).mockImplementation(() => ({
          getEntries: jest.fn().mockReturnValue(mockEntries),
        } as any));

        const result = service.validateZipStructure('/path/to/plugin.zip');
        expect(result.isValid).toBe(false);
      }
    });

    it('should warn about large files over 5MB', () => {
      const mockEntries = [
        { entryName: 'plugin.json', header: { size: 1024 } },
        { entryName: 'index.js', header: { size: 2048 } },
        { entryName: 'large-file.js', header: { size: 6 * 1024 * 1024 } }, // 6MB
      ];

      (AdmZip as jest.MockedClass<typeof AdmZip>).mockImplementation(() => ({
        getEntries: jest.fn().mockReturnValue(mockEntries),
      } as any));

      const result = service.validateZipStructure('/path/to/plugin.zip');

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('Large file detected');
      expect(result.warnings[0]).toContain('6.00MB');
    });

    it('should handle invalid ZIP file gracefully', () => {
      (AdmZip as jest.MockedClass<typeof AdmZip>).mockImplementation(() => {
        throw new Error('Invalid ZIP format');
      });

      const result = service.validateZipStructure('/path/to/invalid.zip');

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Invalid ZIP file');
    });
  });

  describe('extractManifest', () => {
    it('should extract and parse valid manifest', () => {
      const mockManifest: PluginManifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        author: 'Test Author',
        coreVersion: '>=1.0.0',
        main: './index.js',
      };

      const mockEntry = {
        getData: jest.fn().mockReturnValue(Buffer.from(JSON.stringify(mockManifest))),
      };

      (AdmZip as jest.MockedClass<typeof AdmZip>).mockImplementation(() => ({
        getEntry: jest.fn().mockReturnValue(mockEntry),
      } as any));

      const result = service.extractManifest('/path/to/plugin.zip');

      expect(result).toEqual(mockManifest);
    });

    it('should return null when plugin.json is not found', () => {
      (AdmZip as jest.MockedClass<typeof AdmZip>).mockImplementation(() => ({
        getEntry: jest.fn().mockReturnValue(null),
      } as any));

      const result = service.extractManifest('/path/to/plugin.zip');

      expect(result).toBeNull();
    });

    it('should return null when JSON parsing fails', () => {
      const mockEntry = {
        getData: jest.fn().mockReturnValue(Buffer.from('invalid json {')),
      };

      (AdmZip as jest.MockedClass<typeof AdmZip>).mockImplementation(() => ({
        getEntry: jest.fn().mockReturnValue(mockEntry),
      } as any));

      const result = service.extractManifest('/path/to/plugin.zip');

      expect(result).toBeNull();
    });
  });

  describe('validateManifest', () => {
    const validManifest: PluginManifest = {
      id: 'test-plugin',
      name: 'Test Plugin',
      version: '1.0.0',
      author: 'Test Author',
      coreVersion: '>=1.0.0',
      main: './index.js',
    };

    it('should pass validation for valid manifest', () => {
      // Mock semver.valid to return the version for valid manifest
      (semver.valid as jest.Mock).mockReturnValue('1.0.0');

      const result = service.validateManifest(validManifest);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when required field "id" is missing', () => {
      const manifest = { ...validManifest, id: undefined };

      const result = service.validateManifest(manifest);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing required field: id');
    });

    it('should fail when required field "name" is missing', () => {
      const manifest = { ...validManifest, name: undefined };

      const result = service.validateManifest(manifest);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing required field: name');
    });

    it('should fail when required field "version" is missing', () => {
      const manifest = { ...validManifest, version: undefined };

      const result = service.validateManifest(manifest);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing required field: version');
    });

    it('should fail when required field "author" is missing', () => {
      const manifest = { ...validManifest, author: undefined };

      const result = service.validateManifest(manifest);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing required field: author');
    });

    it('should fail when required field "coreVersion" is missing', () => {
      const manifest = { ...validManifest, coreVersion: undefined };

      const result = service.validateManifest(manifest);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing required field: coreVersion');
    });

    it('should fail when plugin ID is not kebab-case', () => {
      const manifest = { ...validManifest, id: 'TestPlugin' };

      const result = service.validateManifest(manifest);

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Invalid plugin ID');
      expect(result.errors[0]).toContain('kebab-case');
    });

    it('should accept kebab-case plugin IDs', () => {
      const validIds = ['my-plugin', 'test-123', 'simple'];

      for (const id of validIds) {
        // Mock semver.valid to return valid version
        (semver.valid as jest.Mock).mockReturnValue('1.0.0');

        const manifest = { ...validManifest, id };
        const result = service.validateManifest(manifest);
        expect(result.isValid).toBe(true);
      }
    });

    it('should fail when version is not valid semver', () => {
      const manifest = { ...validManifest, version: 'not-a-version' };

      // Mock semver.valid to return null for invalid version
      (semver.valid as jest.Mock).mockReturnValue(null);

      const result = service.validateManifest(manifest);

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Invalid version format');
    });

    it('should accept valid semver versions', () => {
      const validVersions = ['1.0.0', '2.1.3', '0.0.1'];

      for (const version of validVersions) {
        const manifest = { ...validManifest, version };

        // Mock semver.valid to return the version for valid semver
        (semver.valid as jest.Mock).mockReturnValue(version);

        const result = service.validateManifest(manifest);
        expect(result.isValid).toBe(true);
      }
    });

    it('should fail when coreVersion has invalid format', () => {
      const manifest = { ...validManifest, coreVersion: 'invalid' };

      const result = service.validateManifest(manifest);

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Invalid coreVersion format');
    });

    it('should accept valid coreVersion formats', () => {
      const validCoreVersions = ['>=1.0.0', '^1.0.0', '~1.0.0', '1.0.0'];

      for (const coreVersion of validCoreVersions) {
        const manifest = { ...validManifest, coreVersion };
        const result = service.validateManifest(manifest);
        expect(result.isValid).toBe(true);
      }
    });

    it('should fail when menus is not an array', () => {
      const manifest = { ...validManifest, menus: 'not-an-array' };

      const result = service.validateManifest(manifest);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('menus must be an array');
    });

    it('should validate menu item structure', () => {
      const manifest = {
        ...validManifest,
        menus: [
          { id: 'menu-1', label: 'Menu 1', type: 'main', route: '/menu1' },
        ],
      };

      const result = service.validateManifest(manifest);

      expect(result.isValid).toBe(true);
    });

    it('should fail when menu item is missing required fields', () => {
      const manifest = {
        ...validManifest,
        menus: [
          { label: 'Menu 1' }, // Missing id, type, route
        ],
      };

      const result = service.validateManifest(manifest);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Menu item 0: missing id');
      expect(result.errors).toContain('Menu item 0: missing route');
    });

    it('should fail when menu type is invalid', () => {
      const manifest = {
        ...validManifest,
        menus: [
          { id: 'menu-1', label: 'Menu 1', type: 'invalid', route: '/menu1' },
        ],
      };

      const result = service.validateManifest(manifest);

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('type must be "main" or "admin"');
    });

    it('should fail when widgets is not an array', () => {
      const manifest = { ...validManifest, widgets: 'not-an-array' };

      const result = service.validateManifest(manifest);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('widgets must be an array');
    });

    it('should validate widget structure', () => {
      const manifest = {
        ...validManifest,
        widgets: [
          { id: 'widget-1', name: 'Widget 1', component: 'MyWidget', slot: 'dashboard' },
        ],
      };

      const result = service.validateManifest(manifest);

      expect(result.isValid).toBe(true);
    });

    it('should fail when widget is missing required fields', () => {
      const manifest = {
        ...validManifest,
        widgets: [
          { name: 'Widget 1' }, // Missing id, component, slot
        ],
      };

      const result = service.validateManifest(manifest);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Widget 0: missing id');
      expect(result.errors).toContain('Widget 0: missing component');
      expect(result.errors).toContain('Widget 0: missing slot');
    });
  });

  describe('isCompatible', () => {
    it('should return true for compatible version', () => {
      (semver.valid as jest.Mock).mockReturnValue('1.0.0');
      (semver.satisfies as jest.Mock).mockReturnValue(true);

      const result = service.isCompatible('>=1.0.0');

      expect(result).toBe(true);
    });

    it('should return false for incompatible version', () => {
      (semver.valid as jest.Mock).mockReturnValue('2.0.0');
      (semver.satisfies as jest.Mock).mockReturnValue(false);

      const result = service.isCompatible('>=2.0.0');

      expect(result).toBe(false);
    });

    it('should return false for invalid version format', () => {
      (semver.valid as jest.Mock).mockReturnValue(null);

      const result = service.isCompatible('invalid-version');

      expect(result).toBe(false);
    });

    it('should handle version range operators (>=, ^, ~)', () => {
      const operators = ['>=1.0.0', '^1.0.0', '~1.0.0'];

      for (const op of operators) {
        (semver.valid as jest.Mock).mockReturnValue('1.0.0');
        (semver.satisfies as jest.Mock).mockReturnValue(true);

        const result = service.isCompatible(op);
        expect(result).toBe(true);
      }
    });

    it('should handle errors gracefully', () => {
      (semver.valid as jest.Mock).mockImplementation(() => {
        throw new Error('Semver error');
      });

      const result = service.isCompatible('>=1.0.0');

      expect(result).toBe(false);
    });
  });

  describe('validatePlugin', () => {
    const validManifest: PluginManifest = {
      id: 'test-plugin',
      name: 'Test Plugin',
      version: '1.0.0',
      author: 'Test Author',
      coreVersion: '>=1.0.0',
      main: './index.js',
    };

    it('should pass comprehensive validation for valid plugin', () => {
      const mockEntries = [
        { entryName: 'plugin.json', header: { size: 1024 } },
        { entryName: 'index.js', header: { size: 2048 } },
      ];

      const mockEntry = {
        getData: jest.fn().mockReturnValue(Buffer.from(JSON.stringify(validManifest))),
      };

      (AdmZip as jest.MockedClass<typeof AdmZip>).mockImplementation(() => ({
        getEntries: jest.fn().mockReturnValue(mockEntries),
        getEntry: jest.fn().mockReturnValue(mockEntry),
      } as any));

      (semver.valid as jest.Mock).mockReturnValue('1.0.0');
      (semver.satisfies as jest.Mock).mockReturnValue(true);

      const result = service.validatePlugin('/path/to/plugin.zip');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.manifest).toEqual(validManifest);
    });

    it('should fail when ZIP structure is invalid', () => {
      const mockEntries = [
        { entryName: 'index.js', header: { size: 2048 } }, // Missing plugin.json
      ];

      (AdmZip as jest.MockedClass<typeof AdmZip>).mockImplementation(() => ({
        getEntries: jest.fn().mockReturnValue(mockEntries),
      } as any));

      const result = service.validatePlugin('/path/to/plugin.zip');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing required file: plugin.json');
      expect(result.manifest).toBeNull();
    });

    it('should fail when manifest extraction fails', () => {
      const mockEntries = [
        { entryName: 'plugin.json', header: { size: 1024 } },
        { entryName: 'index.js', header: { size: 2048 } },
      ];

      (AdmZip as jest.MockedClass<typeof AdmZip>).mockImplementation(() => ({
        getEntries: jest.fn().mockReturnValue(mockEntries),
        getEntry: jest.fn().mockReturnValue(null), // Manifest not found
      } as any));

      const result = service.validatePlugin('/path/to/plugin.zip');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Failed to extract or parse plugin.json');
    });

    it('should fail when manifest is invalid', () => {
      const invalidManifest = { ...validManifest, id: undefined };

      const mockEntries = [
        { entryName: 'plugin.json', header: { size: 1024 } },
        { entryName: 'index.js', header: { size: 2048 } },
      ];

      const mockEntry = {
        getData: jest.fn().mockReturnValue(Buffer.from(JSON.stringify(invalidManifest))),
      };

      (AdmZip as jest.MockedClass<typeof AdmZip>).mockImplementation(() => ({
        getEntries: jest.fn().mockReturnValue(mockEntries),
        getEntry: jest.fn().mockReturnValue(mockEntry),
      } as any));

      const result = service.validatePlugin('/path/to/plugin.zip');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing required field: id');
    });

    it('should fail when plugin is incompatible', () => {
      const mockEntries = [
        { entryName: 'plugin.json', header: { size: 1024 } },
        { entryName: 'index.js', header: { size: 2048 } },
      ];

      const mockEntry = {
        getData: jest.fn().mockReturnValue(Buffer.from(JSON.stringify(validManifest))),
      };

      (AdmZip as jest.MockedClass<typeof AdmZip>).mockImplementation(() => ({
        getEntries: jest.fn().mockReturnValue(mockEntries),
        getEntry: jest.fn().mockReturnValue(mockEntry),
      } as any));

      (semver.valid as jest.Mock).mockReturnValue('2.0.0');
      (semver.satisfies as jest.Mock).mockReturnValue(false); // Incompatible

      const result = service.validatePlugin('/path/to/plugin.zip');

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('requires core version');
    });

    it('should accumulate warnings from all validation steps', () => {
      const mockEntries = [
        { entryName: 'plugin.json', header: { size: 1024 } },
        { entryName: 'index.js', header: { size: 2048 } },
        { entryName: 'large.js', header: { size: 6 * 1024 * 1024 } }, // 6MB - triggers warning
      ];

      const mockEntry = {
        getData: jest.fn().mockReturnValue(Buffer.from(JSON.stringify(validManifest))),
      };

      (AdmZip as jest.MockedClass<typeof AdmZip>).mockImplementation(() => ({
        getEntries: jest.fn().mockReturnValue(mockEntries),
        getEntry: jest.fn().mockReturnValue(mockEntry),
      } as any));

      (semver.valid as jest.Mock).mockReturnValue('1.0.0');
      (semver.satisfies as jest.Mock).mockReturnValue(true);

      const result = service.validatePlugin('/path/to/plugin.zip');

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('Large file detected');
    });
  });
});
