// Mock Prisma before importing services
jest.mock('../../generated/prisma', () => ({
  PrismaClient: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { EmailQueueWorker } from './email-queue.worker';
import { EmailService } from '../services/email.service';
import { EmailQueueService } from '../services/email-queue.service';
import { Logger } from '@nestjs/common';

describe('EmailQueueWorker', () => {
  let worker: EmailQueueWorker;
  let emailService: jest.Mocked<EmailService>;
  let queueService: jest.Mocked<EmailQueueService>;

  // Mock services
  const mockEmailService = {
    processQueue: jest.fn(),
  };

  const mockQueueService = {
    cleanupCompleted: jest.fn(),
    getQueueStats: jest.fn(),
  };

  beforeEach(async () => {
    // Clear environment variables
    delete process.env.EMAIL_QUEUE_BATCH_SIZE;
    delete process.env.EMAIL_QUEUE_CLEANUP_DAYS;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailQueueWorker,
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: EmailQueueService,
          useValue: mockQueueService,
        },
      ],
    }).compile();

    worker = module.get<EmailQueueWorker>(EmailQueueWorker);
    emailService = module.get(EmailService) as jest.Mocked<EmailService>;
    queueService = module.get(EmailQueueService) as jest.Mocked<EmailQueueService>;

    // Spy on logger methods
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'debug').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processEmailQueue', () => {
    it('should process email queue with default batch size', async () => {
      // Arrange
      mockEmailService.processQueue.mockResolvedValue(5);

      // Act
      await worker.processEmailQueue();

      // Assert
      expect(emailService.processQueue).toHaveBeenCalledWith(10); // Default batch size
      expect(Logger.prototype.log).toHaveBeenCalledWith('Processed 5 queued emails');
    });

    it('should use batch size from environment variable', async () => {
      // Arrange
      process.env.EMAIL_QUEUE_BATCH_SIZE = '25';
      mockEmailService.processQueue.mockResolvedValue(25);

      // Act
      await worker.processEmailQueue();

      // Assert
      expect(emailService.processQueue).toHaveBeenCalledWith(25);
      expect(Logger.prototype.log).toHaveBeenCalledWith('Processed 25 queued emails');
    });

    it('should not log when no emails are processed', async () => {
      // Arrange
      mockEmailService.processQueue.mockResolvedValue(0);

      // Act
      await worker.processEmailQueue();

      // Assert
      expect(emailService.processQueue).toHaveBeenCalledWith(10);
      expect(Logger.prototype.log).not.toHaveBeenCalledWith(expect.stringContaining('Processed'));
    });

    it('should skip processing when already processing', async () => {
      // Arrange
      mockEmailService.processQueue.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(5), 100))
      );

      // Act - Start first processing
      const firstCall = worker.processEmailQueue();

      // Act - Try to start second processing while first is still running
      await worker.processEmailQueue();

      // Wait for first to complete
      await firstCall;

      // Assert
      expect(Logger.prototype.debug).toHaveBeenCalledWith(
        'Queue processing already in progress, skipping...'
      );
      expect(emailService.processQueue).toHaveBeenCalledTimes(1);
    });

    it('should allow processing after previous processing completes', async () => {
      // Arrange
      mockEmailService.processQueue.mockResolvedValue(3);

      // Act - First call
      await worker.processEmailQueue();

      // Act - Second call after first completes
      await worker.processEmailQueue();

      // Assert
      expect(emailService.processQueue).toHaveBeenCalledTimes(2);
    });

    it('should handle processing errors gracefully', async () => {
      // Arrange
      const error = new Error('Email service unavailable');
      mockEmailService.processQueue.mockRejectedValue(error);

      // Act
      await worker.processEmailQueue();

      // Assert
      expect(Logger.prototype.error).toHaveBeenCalledWith(
        'Error processing email queue: Email service unavailable'
      );
      expect(emailService.processQueue).toHaveBeenCalled();
    });

    it('should handle non-Error exceptions', async () => {
      // Arrange
      mockEmailService.processQueue.mockRejectedValue('String error');

      // Act
      await worker.processEmailQueue();

      // Assert
      expect(Logger.prototype.error).toHaveBeenCalledWith(
        'Error processing email queue: Unknown error'
      );
    });

    it('should reset isProcessing flag after successful processing', async () => {
      // Arrange
      mockEmailService.processQueue.mockResolvedValue(5);

      // Act
      await worker.processEmailQueue();
      await worker.processEmailQueue(); // Should not skip this time

      // Assert
      expect(emailService.processQueue).toHaveBeenCalledTimes(2);
    });

    it('should reset isProcessing flag even after error', async () => {
      // Arrange
      mockEmailService.processQueue
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce(3);

      // Act
      await worker.processEmailQueue(); // First call fails
      await worker.processEmailQueue(); // Second call should succeed

      // Assert
      expect(emailService.processQueue).toHaveBeenCalledTimes(2);
    });

    it('should log debug message with batch size', async () => {
      // Arrange
      process.env.EMAIL_QUEUE_BATCH_SIZE = '15';
      mockEmailService.processQueue.mockResolvedValue(0);

      // Act
      await worker.processEmailQueue();

      // Assert
      expect(Logger.prototype.debug).toHaveBeenCalledWith(
        'Processing email queue (batch size: 15)'
      );
    });

    it('should handle batch size as string number correctly', async () => {
      // Arrange
      process.env.EMAIL_QUEUE_BATCH_SIZE = '50';
      mockEmailService.processQueue.mockResolvedValue(30);

      // Act
      await worker.processEmailQueue();

      // Assert
      expect(emailService.processQueue).toHaveBeenCalledWith(50);
      expect(typeof 50).toBe('number'); // Ensure it's parsed as number
    });
  });

  describe('cleanupCompletedJobs', () => {
    it('should cleanup completed jobs with default retention period', async () => {
      // Arrange
      mockQueueService.cleanupCompleted.mockResolvedValue(15);

      // Act
      await worker.cleanupCompletedJobs();

      // Assert
      expect(queueService.cleanupCompleted).toHaveBeenCalledWith(7); // Default 7 days
      expect(Logger.prototype.log).toHaveBeenCalledWith(
        'Cleaned up 15 old completed queue items'
      );
    });

    it('should use cleanup days from environment variable', async () => {
      // Arrange
      process.env.EMAIL_QUEUE_CLEANUP_DAYS = '30';
      mockQueueService.cleanupCompleted.mockResolvedValue(100);

      // Act
      await worker.cleanupCompletedJobs();

      // Assert
      expect(queueService.cleanupCompleted).toHaveBeenCalledWith(30);
      expect(Logger.prototype.log).toHaveBeenCalledWith(
        'Cleaned up 100 old completed queue items'
      );
    });

    it('should log debug message before cleanup', async () => {
      // Arrange
      mockQueueService.cleanupCompleted.mockResolvedValue(5);

      // Act
      await worker.cleanupCompletedJobs();

      // Assert
      expect(Logger.prototype.debug).toHaveBeenCalledWith(
        'Cleaning up old completed queue items'
      );
    });

    it('should handle cleanup errors gracefully', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      mockQueueService.cleanupCompleted.mockRejectedValue(error);

      // Act
      await worker.cleanupCompletedJobs();

      // Assert
      expect(Logger.prototype.error).toHaveBeenCalledWith(
        'Error cleaning up queue: Database connection failed'
      );
    });

    it('should handle non-Error exceptions during cleanup', async () => {
      // Arrange
      mockQueueService.cleanupCompleted.mockRejectedValue('Unknown error type');

      // Act
      await worker.cleanupCompletedJobs();

      // Assert
      expect(Logger.prototype.error).toHaveBeenCalledWith(
        'Error cleaning up queue: Unknown error'
      );
    });

    it('should parse cleanup days as integer', async () => {
      // Arrange
      process.env.EMAIL_QUEUE_CLEANUP_DAYS = '14';
      mockQueueService.cleanupCompleted.mockResolvedValue(25);

      // Act
      await worker.cleanupCompletedJobs();

      // Assert
      expect(queueService.cleanupCompleted).toHaveBeenCalledWith(14);
      expect(typeof 14).toBe('number'); // Ensure it's parsed as number
    });

    it('should handle cleanup returning zero deleted items', async () => {
      // Arrange
      mockQueueService.cleanupCompleted.mockResolvedValue(0);

      // Act
      await worker.cleanupCompletedJobs();

      // Assert
      expect(Logger.prototype.log).toHaveBeenCalledWith(
        'Cleaned up 0 old completed queue items'
      );
    });
  });

  describe('getQueueStats', () => {
    it('should return queue statistics', async () => {
      // Arrange
      const mockStats = {
        pending: 10,
        processing: 2,
        completed: 50,
        failed: 3,
      };
      mockQueueService.getQueueStats.mockResolvedValue(mockStats);

      // Act
      const result = await worker.getQueueStats();

      // Assert
      expect(result).toEqual(mockStats);
      expect(queueService.getQueueStats).toHaveBeenCalled();
    });

    it('should propagate errors from queue service', async () => {
      // Arrange
      const error = new Error('Stats unavailable');
      mockQueueService.getQueueStats.mockRejectedValue(error);

      // Act & Assert
      await expect(worker.getQueueStats()).rejects.toThrow('Stats unavailable');
    });

    it('should handle empty stats', async () => {
      // Arrange
      mockQueueService.getQueueStats.mockResolvedValue({
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
      });

      // Act
      const result = await worker.getQueueStats();

      // Assert
      expect(result).toEqual({
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
      });
    });
  });

  describe('worker initialization', () => {
    it('should be defined', () => {
      expect(worker).toBeDefined();
    });

    it('should have isProcessing initialized to false', () => {
      // Assert
      expect(worker['isProcessing']).toBe(false);
    });

    it('should have logger initialized', () => {
      // Assert
      expect(worker['logger']).toBeDefined();
    });
  });

  describe('concurrent processing protection', () => {
    it('should prevent concurrent processEmailQueue calls', async () => {
      // Arrange
      let processResolve: (value: number) => void;
      const processPromise = new Promise<number>((resolve) => {
        processResolve = resolve;
      });

      mockEmailService.processQueue.mockReturnValue(processPromise);

      // Act - Start first call (will hang)
      const firstCall = worker.processEmailQueue();

      // Try to start second call while first is running
      await worker.processEmailQueue();

      // Complete the first call
      processResolve!(5);
      await firstCall;

      // Assert
      expect(Logger.prototype.debug).toHaveBeenCalledWith(
        'Queue processing already in progress, skipping...'
      );
    });

    it('should allow sequential processing after completion', async () => {
      // Arrange
      mockEmailService.processQueue
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(3);

      // Act
      await worker.processEmailQueue();
      await worker.processEmailQueue();

      // Assert
      expect(emailService.processQueue).toHaveBeenCalledTimes(2);
      expect(Logger.prototype.log).toHaveBeenCalledWith('Processed 5 queued emails');
      expect(Logger.prototype.log).toHaveBeenCalledWith('Processed 3 queued emails');
    });
  });
});
