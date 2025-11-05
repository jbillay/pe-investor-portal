import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('check', () => {
    it('should return health status with ok status', () => {
      // Arrange
      const beforeTimestamp = new Date().toISOString();

      // Act
      const result = controller.check();

      // Assert
      const afterTimestamp = new Date().toISOString();

      expect(result).toBeDefined();
      expect(result.status).toBe('ok');
      expect(result.service).toBe('pe-investor-portal-api');
      expect(result.version).toBe('1.0.0');
      expect(result.timestamp).toBeDefined();

      // Timestamp should be between before and after
      expect(new Date(result.timestamp).getTime()).toBeGreaterThanOrEqual(
        new Date(beforeTimestamp).getTime(),
      );
      expect(new Date(result.timestamp).getTime()).toBeLessThanOrEqual(
        new Date(afterTimestamp).getTime(),
      );
    });

    it('should return timestamp in ISO format', () => {
      // Act
      const result = controller.check();

      // Assert
      expect(result.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
    });

    it('should return consistent service name and version', () => {
      // Act
      const result1 = controller.check();
      const result2 = controller.check();

      // Assert
      expect(result1.service).toBe(result2.service);
      expect(result1.version).toBe(result2.version);
      expect(result1.status).toBe(result2.status);
    });

    it('should be defined', () => {
      expect(controller).toBeDefined();
    });
  });
});
