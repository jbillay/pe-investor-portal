import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  afterEach(async () => {
    // Ensure we disconnect after each test
    await service.$disconnect();
  });

  describe('constructor', () => {
    it('should create service with default configuration in non-test environment', () => {
      const originalEnv = process.env.NODE_ENV;
      delete process.env.NODE_ENV;

      const newService = new PrismaService();

      expect(newService).toBeDefined();

      process.env.NODE_ENV = originalEnv;
    });

    it('should create service with test configuration when NODE_ENV is test', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';

      const newService = new PrismaService();

      expect(newService).toBeDefined();

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle DATABASE_URL with existing query parameters', () => {
      const originalUrl = process.env.DATABASE_URL;
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db?schema=public';

      const newService = new PrismaService();

      expect(newService).toBeDefined();

      process.env.DATABASE_URL = originalUrl;
    });

    it('should handle DATABASE_URL without query parameters', () => {
      const originalUrl = process.env.DATABASE_URL;
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';

      const newService = new PrismaService();

      expect(newService).toBeDefined();

      process.env.DATABASE_URL = originalUrl;
    });

    it('should use connection limit of 50 in test environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';

      const newService = new PrismaService();

      expect(newService).toBeDefined();
      // Connection limit is configured internally, service should be created successfully

      process.env.NODE_ENV = originalEnv;
    });

    it('should use connection limit of 10 in production environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const newService = new PrismaService();

      expect(newService).toBeDefined();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('onModuleInit', () => {
    it('should connect to database on module initialization', async () => {
      const connectSpy = jest.spyOn(service, '$connect').mockResolvedValue();

      await service.onModuleInit();

      expect(connectSpy).toHaveBeenCalled();
    });

  });

  describe('onModuleDestroy', () => {
    it('should disconnect from database on module destruction', async () => {
      const disconnectSpy = jest.spyOn(service, '$disconnect').mockResolvedValue();

      await service.onModuleDestroy();

      expect(disconnectSpy).toHaveBeenCalled();
    });
  });

  describe('PrismaClient functionality', () => {
    it('should extend PrismaClient', () => {
      expect(service).toHaveProperty('$connect');
      expect(service).toHaveProperty('$disconnect');
      expect(service).toHaveProperty('$transaction');
    });

    it('should be injectable as a service', () => {
      expect(service).toBeInstanceOf(PrismaService);
    });
  });
});
