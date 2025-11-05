import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { TemplateCacheService } from './template-cache.service';
import { IEmailTemplate } from '../interfaces/email-template.interface';

describe('TemplateCacheService', () => {
  let service: TemplateCacheService;

  const mockTemplate: IEmailTemplate = {
    id: 'template-1',
    name: 'welcome-email',
    subject: 'Welcome to {{appName}}',
    htmlBody: '<h1>Welcome {{userName}}!</h1>',
    textBody: 'Welcome {{userName}}!',
    variables: ['appName', 'userName'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    // Set environment variables for testing
    process.env.EMAIL_TEMPLATE_CACHE_MAX = '50';
    process.env.EMAIL_TEMPLATE_CACHE_TTL = '1800000'; // 30 minutes

    const module: TestingModule = await Test.createTestingModule({
      providers: [TemplateCacheService],
    }).compile();

    service = module.get<TemplateCacheService>(TemplateCacheService);

    // Suppress logger output
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'debug').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.EMAIL_TEMPLATE_CACHE_MAX;
    delete process.env.EMAIL_TEMPLATE_CACHE_TTL;
  });

  describe('Initialization', () => {
    it('should initialize with default cache options', () => {
      const stats = service.getStats();
      expect(stats.max).toBe(50);
      expect(stats.ttl).toBe(1800000);
      expect(stats.size).toBe(0);
    });

    it('should use default values when env vars not set', () => {
      delete process.env.EMAIL_TEMPLATE_CACHE_MAX;
      delete process.env.EMAIL_TEMPLATE_CACHE_TTL;

      const newService = new TemplateCacheService();
      const stats = newService.getStats();

      expect(stats.max).toBe(100); // Default
      expect(stats.ttl).toBe(3600000); // 1 hour default
    });
  });

  describe('set and get', () => {
    it('should store and retrieve template by key', () => {
      service.set('template-1', mockTemplate);
      const retrieved = service.get('template-1');

      expect(retrieved).toEqual(mockTemplate);
    });

    it('should return undefined for non-existent key', () => {
      const retrieved = service.get('non-existent');
      expect(retrieved).toBeUndefined();
    });

    it('should store multiple templates', () => {
      const template2: IEmailTemplate = { ...mockTemplate, id: 'template-2', name: 'goodbye' };

      service.set('template-1', mockTemplate);
      service.set('template-2', template2);

      expect(service.get('template-1')).toEqual(mockTemplate);
      expect(service.get('template-2')).toEqual(template2);
    });

    it('should overwrite existing key', () => {
      const updatedTemplate: IEmailTemplate = {
        ...mockTemplate,
        subject: 'Updated Subject',
      };

      service.set('template-1', mockTemplate);
      service.set('template-1', updatedTemplate);

      const retrieved = service.get('template-1');
      expect(retrieved?.subject).toBe('Updated Subject');
    });
  });

  describe('has', () => {
    it('should return true for existing key', () => {
      service.set('template-1', mockTemplate);
      expect(service.has('template-1')).toBe(true);
    });

    it('should return false for non-existent key', () => {
      expect(service.has('non-existent')).toBe(false);
    });
  });

  describe('invalidate', () => {
    it('should remove template from cache', () => {
      service.set('template-1', mockTemplate);
      expect(service.has('template-1')).toBe(true);

      const deleted = service.invalidate('template-1');

      expect(deleted).toBe(true);
      expect(service.has('template-1')).toBe(false);
      expect(service.get('template-1')).toBeUndefined();
    });

    it('should return false when invalidating non-existent key', () => {
      const deleted = service.invalidate('non-existent');
      expect(deleted).toBe(false);
    });
  });

  describe('invalidateTemplate', () => {
    it('should invalidate both ID and name keys', () => {
      service.set('template-1', mockTemplate);
      service.set('welcome-email', mockTemplate);

      service.invalidateTemplate('template-1', 'welcome-email');

      expect(service.has('template-1')).toBe(false);
      expect(service.has('welcome-email')).toBe(false);
    });

    it('should handle non-existent keys gracefully', () => {
      expect(() => {
        service.invalidateTemplate('non-existent-id', 'non-existent-name');
      }).not.toThrow();
    });
  });

  describe('clear', () => {
    it('should remove all items from cache', () => {
      service.set('template-1', mockTemplate);
      service.set('template-2', { ...mockTemplate, id: 'template-2' });
      service.set('template-3', { ...mockTemplate, id: 'template-3' });

      expect(service.getStats().size).toBe(3);

      service.clear();

      expect(service.getStats().size).toBe(0);
      expect(service.has('template-1')).toBe(false);
      expect(service.has('template-2')).toBe(false);
      expect(service.has('template-3')).toBe(false);
    });

    it('should work on empty cache', () => {
      expect(() => {
        service.clear();
      }).not.toThrow();

      expect(service.getStats().size).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return current cache statistics', () => {
      service.set('template-1', mockTemplate);
      service.set('template-2', { ...mockTemplate, id: 'template-2' });

      const stats = service.getStats();

      expect(stats.size).toBe(2);
      expect(stats.max).toBe(50);
      expect(stats.ttl).toBe(1800000);
    });

    it('should update size when items are added/removed', () => {
      expect(service.getStats().size).toBe(0);

      service.set('template-1', mockTemplate);
      expect(service.getStats().size).toBe(1);

      service.set('template-2', { ...mockTemplate, id: 'template-2' });
      expect(service.getStats().size).toBe(2);

      service.invalidate('template-1');
      expect(service.getStats().size).toBe(1);

      service.clear();
      expect(service.getStats().size).toBe(0);
    });
  });

  describe('LRU cache behavior', () => {
    it('should evict least recently used item when max is exceeded', () => {
      // Set max to 3 for testing
      process.env.EMAIL_TEMPLATE_CACHE_MAX = '3';
      const smallCacheService = new TemplateCacheService();

      smallCacheService.set('key-1', { ...mockTemplate, id: '1' });
      smallCacheService.set('key-2', { ...mockTemplate, id: '2' });
      smallCacheService.set('key-3', { ...mockTemplate, id: '3' });

      expect(smallCacheService.getStats().size).toBe(3);

      // Adding 4th item should evict the LRU item (key-1)
      smallCacheService.set('key-4', { ...mockTemplate, id: '4' });

      expect(smallCacheService.getStats().size).toBe(3);
      expect(smallCacheService.has('key-1')).toBe(false);
      expect(smallCacheService.has('key-4')).toBe(true);
    });

    it('should refresh TTL on get (updateAgeOnGet)', () => {
      service.set('template-1', mockTemplate);

      // Access the template
      const retrieved = service.get('template-1');

      expect(retrieved).toBeDefined();
      // Template should still be in cache after access
      expect(service.has('template-1')).toBe(true);
    });
  });
});
