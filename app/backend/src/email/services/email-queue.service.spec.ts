import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { EmailQueueService } from './email-queue.service';
import { PrismaService } from '../../database/prisma.service';
import { EmailQueueStatus } from '../interfaces/email-template.interface';

describe('EmailQueueService', () => {
  let service: EmailQueueService;
  let prisma: jest.Mocked<PrismaService>;

  const mockPrisma = {
    emailQueue: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      deleteMany: jest.fn(),
      fields: {
        maxAttempts: 3,
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailQueueService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<EmailQueueService>(EmailQueueService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;

    // Suppress logger output
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'debug').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('enqueue', () => {
    it('should add email to queue with default values', async () => {
      const queueData = {
        recipientEmail: 'test@example.com',
        variables: { name: 'John' },
      };

      const mockQueueItem = {
        id: 'queue-1',
        ...queueData,
        recipientName: undefined,
        templateId: undefined,
        priority: 5,
        scheduledFor: expect.any(Date),
        status: EmailQueueStatus.PENDING,
      };

      prisma.emailQueue.create.mockResolvedValue(mockQueueItem as any);

      const result = await service.enqueue(queueData);

      expect(result.id).toBe('queue-1');
      expect(result.priority).toBe(5);
      expect(result.status).toBe(EmailQueueStatus.PENDING);
      expect(prisma.emailQueue.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          recipientEmail: 'test@example.com',
          priority: 5,
          status: EmailQueueStatus.PENDING,
        }),
      });
    });

    it('should add email with custom priority and schedule', async () => {
      const scheduledFor = new Date('2025-01-01');
      const queueData = {
        templateId: 'template-1',
        recipientEmail: 'test@example.com',
        recipientName: 'John Doe',
        variables: { name: 'John' },
        priority: 1, // High priority
        scheduledFor,
      };

      const mockQueueItem = {
        id: 'queue-1',
        ...queueData,
        status: EmailQueueStatus.PENDING,
      };

      prisma.emailQueue.create.mockResolvedValue(mockQueueItem as any);

      const result = await service.enqueue(queueData);

      expect(result.priority).toBe(1);
      expect(result.scheduledFor).toEqual(scheduledFor);
      expect(prisma.emailQueue.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          templateId: 'template-1',
          recipientName: 'John Doe',
          priority: 1,
          scheduledFor,
        }),
      });
    });
  });

  describe('getPendingEmails', () => {
    it('should fetch pending emails scheduled for now or earlier', async () => {
      const mockPendingEmails = [
        {
          id: 'queue-1',
          status: EmailQueueStatus.PENDING,
          attempts: 0,
          priority: 1,
          scheduledFor: new Date('2024-12-01'),
        },
        {
          id: 'queue-2',
          status: EmailQueueStatus.PENDING,
          attempts: 1,
          priority: 5,
          scheduledFor: new Date('2024-12-02'),
        },
      ];

      prisma.emailQueue.findMany.mockResolvedValue(mockPendingEmails as any);

      const result = await service.getPendingEmails(10);

      expect(result).toHaveLength(2);
      expect(prisma.emailQueue.findMany).toHaveBeenCalledWith({
        where: {
          status: EmailQueueStatus.PENDING,
          scheduledFor: { lte: expect.any(Date) },
          attempts: { lt: 3 },
        },
        orderBy: [{ priority: 'asc' }, { scheduledFor: 'asc' }],
        take: 10,
      });
    });

    it('should use default batch size of 10', async () => {
      prisma.emailQueue.findMany.mockResolvedValue([]);

      await service.getPendingEmails();

      expect(prisma.emailQueue.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        })
      );
    });

    it('should respect custom batch size', async () => {
      prisma.emailQueue.findMany.mockResolvedValue([]);

      await service.getPendingEmails(25);

      expect(prisma.emailQueue.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 25,
        })
      );
    });
  });

  describe('markAsProcessing', () => {
    it('should update status to processing and increment attempts', async () => {
      prisma.emailQueue.update.mockResolvedValue({} as any);

      await service.markAsProcessing('queue-1');

      expect(prisma.emailQueue.update).toHaveBeenCalledWith({
        where: { id: 'queue-1' },
        data: {
          status: EmailQueueStatus.PROCESSING,
          attempts: { increment: 1 },
        },
      });
    });
  });

  describe('markAsCompleted', () => {
    it('should update status to completed with email log ID', async () => {
      prisma.emailQueue.update.mockResolvedValue({} as any);

      await service.markAsCompleted('queue-1', 'email-log-1');

      expect(prisma.emailQueue.update).toHaveBeenCalledWith({
        where: { id: 'queue-1' },
        data: {
          status: EmailQueueStatus.COMPLETED,
          processedAt: expect.any(Date),
          emailLogId: 'email-log-1',
        },
      });
    });
  });

  describe('markAsFailed', () => {
    it('should mark as failed when max attempts reached', async () => {
      const mockQueueItem = {
        id: 'queue-1',
        attempts: 3,
        maxAttempts: 3,
      };

      prisma.emailQueue.findUnique.mockResolvedValue(mockQueueItem as any);
      prisma.emailQueue.update.mockResolvedValue({} as any);

      await service.markAsFailed('queue-1', 'SMTP error');

      expect(prisma.emailQueue.update).toHaveBeenCalledWith({
        where: { id: 'queue-1' },
        data: {
          status: EmailQueueStatus.FAILED,
          errorMessage: 'SMTP error',
          scheduledFor: undefined,
        },
      });
    });

    it('should schedule retry with exponential backoff when attempts remain', async () => {
      const mockQueueItem = {
        id: 'queue-1',
        attempts: 1,
        maxAttempts: 3,
      };

      prisma.emailQueue.findUnique.mockResolvedValue(mockQueueItem as any);
      prisma.emailQueue.update.mockResolvedValue({} as any);

      await service.markAsFailed('queue-1', 'Temporary error');

      expect(prisma.emailQueue.update).toHaveBeenCalledWith({
        where: { id: 'queue-1' },
        data: {
          status: EmailQueueStatus.PENDING,
          errorMessage: 'Temporary error',
          scheduledFor: expect.any(Date),
        },
      });
    });

    it('should use exponential backoff formula (5min * 2^attempts)', async () => {
      const mockQueueItem = {
        id: 'queue-1',
        attempts: 2, // 2nd attempt
        maxAttempts: 3,
      };

      prisma.emailQueue.findUnique.mockResolvedValue(mockQueueItem as any);
      prisma.emailQueue.update.mockResolvedValue({} as any);

      const beforeTime = Date.now();
      await service.markAsFailed('queue-1', 'Error');
      const afterTime = Date.now();

      // Expected delay: 5 * 60 * 1000 * 2^2 = 1200000ms (20 minutes)
      const expectedDelay = 5 * 60 * 1000 * Math.pow(2, 2);

      const call = prisma.emailQueue.update.mock.calls[0][0];
      const scheduledFor = call.data.scheduledFor as Date;

      const actualDelay = scheduledFor.getTime() - beforeTime;

      // Allow some tolerance for execution time
      expect(actualDelay).toBeGreaterThanOrEqual(expectedDelay - 1000);
      expect(actualDelay).toBeLessThanOrEqual(expectedDelay + afterTime - beforeTime + 1000);
    });

    it('should handle non-existent queue item gracefully', async () => {
      prisma.emailQueue.findUnique.mockResolvedValue(null);

      await service.markAsFailed('non-existent', 'Error');

      expect(prisma.emailQueue.update).not.toHaveBeenCalled();
    });
  });

  describe('getQueueStats', () => {
    it('should return statistics for all statuses', async () => {
      prisma.emailQueue.count
        .mockResolvedValueOnce(10) // pending
        .mockResolvedValueOnce(2)  // processing
        .mockResolvedValueOnce(50) // completed
        .mockResolvedValueOnce(3)  // failed
        .mockResolvedValueOnce(65); // total

      const stats = await service.getQueueStats();

      expect(stats).toEqual({
        pending: 10,
        processing: 2,
        completed: 50,
        failed: 3,
        total: 65,
      });

      expect(prisma.emailQueue.count).toHaveBeenCalledTimes(5);
    });
  });

  describe('cleanupCompleted', () => {
    it('should delete completed items older than specified days', async () => {
      prisma.emailQueue.deleteMany.mockResolvedValue({ count: 25 });

      const result = await service.cleanupCompleted(7);

      expect(result).toBe(25);
      expect(prisma.emailQueue.deleteMany).toHaveBeenCalledWith({
        where: {
          status: EmailQueueStatus.COMPLETED,
          processedAt: { lt: expect.any(Date) },
        },
      });
    });

    it('should use default of 7 days', async () => {
      prisma.emailQueue.deleteMany.mockResolvedValue({ count: 10 });

      await service.cleanupCompleted();

      const call = prisma.emailQueue.deleteMany.mock.calls[0][0];
      const cutoffDate = call.where.processedAt.lt as Date;
      const expectedCutoff = new Date();
      expectedCutoff.setDate(expectedCutoff.getDate() - 7);

      // Allow 1 second tolerance
      expect(Math.abs(cutoffDate.getTime() - expectedCutoff.getTime())).toBeLessThan(1000);
    });

    it('should handle custom retention period', async () => {
      prisma.emailQueue.deleteMany.mockResolvedValue({ count: 5 });

      await service.cleanupCompleted(30);

      const call = prisma.emailQueue.deleteMany.mock.calls[0][0];
      const cutoffDate = call.where.processedAt.lt as Date;
      const expectedCutoff = new Date();
      expectedCutoff.setDate(expectedCutoff.getDate() - 30);

      expect(Math.abs(cutoffDate.getTime() - expectedCutoff.getTime())).toBeLessThan(1000);
    });
  });

  describe('retryFailed', () => {
    it('should reset failed email for retry', async () => {
      const mockQueueItem = {
        id: 'queue-1',
        status: EmailQueueStatus.FAILED,
      };

      prisma.emailQueue.findUnique.mockResolvedValue(mockQueueItem as any);
      prisma.emailQueue.update.mockResolvedValue({} as any);

      await service.retryFailed('queue-1');

      expect(prisma.emailQueue.update).toHaveBeenCalledWith({
        where: { id: 'queue-1' },
        data: {
          status: EmailQueueStatus.PENDING,
          attempts: 0,
          errorMessage: null,
          scheduledFor: expect.any(Date),
        },
      });
    });

    it('should throw error when queue item not found', async () => {
      prisma.emailQueue.findUnique.mockResolvedValue(null);

      await expect(service.retryFailed('non-existent')).rejects.toThrow(
        'Queue item non-existent not found'
      );
    });

    it('should throw error when queue item is not in failed status', async () => {
      const mockQueueItem = {
        id: 'queue-1',
        status: EmailQueueStatus.COMPLETED,
      };

      prisma.emailQueue.findUnique.mockResolvedValue(mockQueueItem as any);

      await expect(service.retryFailed('queue-1')).rejects.toThrow(
        'Queue item queue-1 is not in failed status'
      );
    });
  });
});
