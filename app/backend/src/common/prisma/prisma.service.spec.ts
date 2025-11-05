import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

// Mock the PrismaClient at the module level
jest.mock('../../../generated/prisma/index', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(function(this: any, options?: any) {
      this.$connect = jest.fn().mockResolvedValue(undefined);
      this.$disconnect = jest.fn().mockResolvedValue(undefined);
      this.$transaction = jest.fn();
      this.$executeRaw = jest.fn();
      this.$queryRaw = jest.fn();
      return this;
    }),
  };
});

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  afterEach(async () => {
    // Clean up any connections
    if (service && service.$disconnect) {
      await service.$disconnect().catch(() => {
        // Ignore disconnect errors in tests
      });
    }
  });

  describe('onModuleInit', () => {
    it('should connect to database on module initialization', async () => {
      const connectSpy = jest.spyOn(service, '$connect').mockResolvedValue();

      await service.onModuleInit();

      expect(connectSpy).toHaveBeenCalled();
    });

    it('should handle connection errors gracefully', async () => {
      const connectSpy = jest
        .spyOn(service, '$connect')
        .mockRejectedValue(new Error('Connection failed'));

      await expect(service.onModuleInit()).rejects.toThrow('Connection failed');
      expect(connectSpy).toHaveBeenCalled();
    });
  });

  describe('onModuleDestroy', () => {
    it('should disconnect from database on module destruction', async () => {
      const disconnectSpy = jest.spyOn(service, '$disconnect').mockResolvedValue();

      await service.onModuleDestroy();

      expect(disconnectSpy).toHaveBeenCalled();
    });

    it('should handle disconnection errors gracefully', async () => {
      const disconnectSpy = jest
        .spyOn(service, '$disconnect')
        .mockRejectedValue(new Error('Disconnection failed'));

      await expect(service.onModuleDestroy()).rejects.toThrow('Disconnection failed');
      expect(disconnectSpy).toHaveBeenCalled();
    });
  });

  describe('PrismaClient functionality', () => {
    it('should extend PrismaClient', () => {
      expect(service).toHaveProperty('$connect');
      expect(service).toHaveProperty('$disconnect');
      expect(service).toHaveProperty('$transaction');
    });
  });

  describe('service creation', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });
});
