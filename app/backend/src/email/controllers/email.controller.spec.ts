import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { EmailController } from './email.controller';
import { EmailService } from '../services/email.service';
import { EmailQueueService } from '../services/email-queue.service';
import { EmailQueueWorker } from '../jobs/email-queue.worker';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../guards/super-admin.guard';

describe('EmailController', () => {
  let controller: EmailController;
  let emailService: jest.Mocked<EmailService>;
  let queueService: jest.Mocked<EmailQueueService>;
  let queueWorker: jest.Mocked<EmailQueueWorker>;

  beforeEach(async () => {
    const mockEmailService = {
      sendEmail: jest.fn(),
      sendTemplatedEmail: jest.fn(),
      getEmailLogs: jest.fn(),
      getEmailLog: jest.fn(),
      retryFailedEmail: jest.fn(),
      getEmailStats: jest.fn(),
    };

    const mockQueueService = {
      queueEmail: jest.fn(),
      getQueueStats: jest.fn(),
      retryQueuedEmail: jest.fn(),
    };

    const mockQueueWorker = {
      processQueue: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailController],
      providers: [
        { provide: EmailService, useValue: mockEmailService },
        { provide: EmailQueueService, useValue: mockQueueService },
        { provide: EmailQueueWorker, useValue: mockQueueWorker },
        Reflector,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(SuperAdminGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<EmailController>(EmailController);
    emailService = module.get(EmailService) as any;
    queueService = module.get(EmailQueueService) as any;
    queueWorker = module.get(EmailQueueWorker) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendEmail', () => {
    it('should send email directly', async () => {
      const dto = {
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
        text: 'Test content',
      };

      const mockResponse = {
        success: true,
        messageId: 'msg-123',
        logId: 'log-123',
      };

      emailService.sendEmail.mockResolvedValue(mockResponse as any);

      const result = await controller.sendEmail(dto);

      expect(result).toEqual(mockResponse);
      expect(emailService.sendEmail).toHaveBeenCalledWith(dto);
    });
  });

  describe('sendTemplatedEmail', () => {
    it('should send templated email', async () => {
      const dto = {
        to: 'test@example.com',
        templateKey: 'welcome-email',
        variables: { name: 'John' },
      };

      const mockResponse = {
        success: true,
        messageId: 'msg-456',
        logId: 'log-456',
      };

      emailService.sendTemplatedEmail.mockResolvedValue(mockResponse as any);

      const result = await controller.sendTemplatedEmail(dto);

      expect(result).toEqual(mockResponse);
      expect(emailService.sendTemplatedEmail).toHaveBeenCalledWith(dto);
    });
  });

  describe('queueEmail', () => {
    it('should queue email for later sending', async () => {
      const dto = {
        to: 'test@example.com',
        templateKey: 'notification',
        variables: { message: 'Hello' },
        scheduledFor: new Date('2024-12-31'),
      };

      const mockResponse = {
        queueId: 'queue-789',
        status: 'queued',
        scheduledFor: dto.scheduledFor,
      };

      queueService.queueEmail.mockResolvedValue(mockResponse as any);

      const result = await controller.queueEmail(dto);

      expect(result).toEqual(mockResponse);
      expect(queueService.queueEmail).toHaveBeenCalledWith(dto);
    });
  });

  describe('getEmailLogs', () => {
    it('should return paginated email logs', async () => {
      const query = { page: 1, limit: 20 };

      const mockResponse = {
        data: [
          {
            id: 'log-1',
            to: 'user@example.com',
            subject: 'Test',
            status: 'SENT',
            sentAt: new Date(),
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      };

      emailService.getEmailLogs.mockResolvedValue(mockResponse as any);

      const result = await controller.getEmailLogs(query);

      expect(result).toEqual(mockResponse);
      expect(emailService.getEmailLogs).toHaveBeenCalledWith(query);
    });
  });

  describe('getEmailLog', () => {
    it('should return single email log by ID', async () => {
      const logId = 'log-123';

      const mockLog = {
        id: logId,
        to: 'user@example.com',
        subject: 'Test Email',
        status: 'SENT',
        sentAt: new Date(),
        details: {},
      };

      emailService.getEmailLog.mockResolvedValue(mockLog as any);

      const result = await controller.getEmailLog(logId);

      expect(result).toEqual(mockLog);
      expect(emailService.getEmailLog).toHaveBeenCalledWith(logId);
    });
  });

  describe('retryFailedEmail', () => {
    it('should retry sending failed email', async () => {
      const logId = 'log-failed-123';

      const mockResponse = {
        success: true,
        messageId: 'msg-retry-123',
        logId: 'log-new-123',
      };

      emailService.retryFailedEmail.mockResolvedValue(mockResponse as any);

      const result = await controller.retryFailedEmail(logId);

      expect(result).toEqual(mockResponse);
      expect(emailService.retryFailedEmail).toHaveBeenCalledWith(logId);
    });
  });

  describe('getEmailStats', () => {
    it('should return email statistics', async () => {
      const query = { days: 30 };

      const mockStats = {
        totalSent: 100,
        totalFailed: 5,
        totalQueued: 10,
        successRate: 95.24,
        timeline: [],
      };

      emailService.getEmailStats.mockResolvedValue(mockStats as any);

      const result = await controller.getEmailStats(query);

      expect(result).toEqual(mockStats);
      expect(emailService.getEmailStats).toHaveBeenCalledWith(query);
    });
  });

  describe('getQueueStats', () => {
    it('should return queue statistics', async () => {
      const mockStats = {
        pending: 5,
        processing: 2,
        failed: 1,
        completed: 100,
      };

      queueService.getQueueStats.mockResolvedValue(mockStats as any);

      const result = await controller.getQueueStats();

      expect(result).toEqual(mockStats);
      expect(queueService.getQueueStats).toHaveBeenCalled();
    });
  });

  describe('retryQueuedEmail', () => {
    it('should retry queued email', async () => {
      const queueId = 'queue-123';

      const mockResponse = {
        success: true,
        queueId,
        status: 'processing',
      };

      queueService.retryQueuedEmail.mockResolvedValue(mockResponse as any);

      const result = await controller.retryQueuedEmail(queueId);

      expect(result).toEqual(mockResponse);
      expect(queueService.retryQueuedEmail).toHaveBeenCalledWith(queueId);
    });
  });
});
