import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EmailService } from './email.service';
import { PrismaService } from '../../database/prisma.service';
import { EmailTemplateService } from './email-template.service';
import { TemplateRendererService } from './template-renderer.service';
import { SmtpProviderService } from './smtp-provider.service';
import { EmailQueueService } from './email-queue.service';
import { EmailStatus } from '../interfaces/email-template.interface';
import {
  SendEmailDto,
  SendTemplatedEmailDto,
  QueueEmailDto,
} from '../dto/send-email.dto';
import { QueryEmailLogsDto } from '../dto/email-log.dto';

describe('EmailService', () => {
  let service: EmailService;
  let prismaService: jest.Mocked<PrismaService>;
  let templateService: jest.Mocked<EmailTemplateService>;
  let rendererService: jest.Mocked<TemplateRendererService>;
  let smtpProvider: jest.Mocked<SmtpProviderService>;
  let queueService: jest.Mocked<EmailQueueService>;

  const mockPrismaService = {
    emailLog: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
  };

  const mockTemplateService = {
    findByName: jest.fn(),
    findOne: jest.fn(),
  };

  const mockRendererService = {
    render: jest.fn(),
  };

  const mockSmtpProvider = {
    send: jest.fn(),
  };

  const mockQueueService = {
    enqueue: jest.fn(),
    getPendingEmails: jest.fn(),
    markAsProcessing: jest.fn(),
    markAsCompleted: jest.fn(),
    markAsFailed: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: EmailTemplateService,
          useValue: mockTemplateService,
        },
        {
          provide: TemplateRendererService,
          useValue: mockRendererService,
        },
        {
          provide: SmtpProviderService,
          useValue: mockSmtpProvider,
        },
        {
          provide: EmailQueueService,
          useValue: mockQueueService,
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    prismaService = module.get(PrismaService) as any;
    templateService = module.get(EmailTemplateService) as any;
    rendererService = module.get(TemplateRendererService) as any;
    smtpProvider = module.get(SmtpProviderService) as any;
    queueService = module.get(EmailQueueService) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      // Arrange
      const dto: SendEmailDto = {
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
        text: 'Test content',
      };

      const mockEmailLog = {
        id: 'log-123',
        recipientEmail: dto.to,
        subject: dto.subject,
        status: EmailStatus.PENDING,
      };

      const mockSendResult = {
        success: true,
        messageId: 'msg-456',
      };

      prismaService.emailLog.create.mockResolvedValue(mockEmailLog as any);
      smtpProvider.send.mockResolvedValue(mockSendResult);
      prismaService.emailLog.update.mockResolvedValue({} as any);

      // Act
      const result = await service.sendEmail(dto);

      // Assert
      expect(result.success).toBe(true);
      expect(result.emailLogId).toBe('log-123');
      expect(result.messageId).toBe('msg-456');
      expect(prismaService.emailLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          recipientEmail: dto.to,
          subject: dto.subject,
          htmlBody: dto.html,
          textBody: dto.text,
          provider: 'smtp',
          status: EmailStatus.PENDING,
        }),
      });
      expect(smtpProvider.send).toHaveBeenCalledWith({
        to: dto.to,
        subject: dto.subject,
        text: dto.text,
        html: dto.html,
        replyTo: undefined,
        cc: undefined,
        bcc: undefined,
        attachments: undefined,
        priority: 'normal',
      });
      expect(prismaService.emailLog.update).toHaveBeenCalledWith({
        where: { id: 'log-123' },
        data: {
          status: EmailStatus.SENT,
          externalId: 'msg-456',
          errorMessage: undefined,
          sentAt: expect.any(Date),
        },
      });
    });

    it('should handle high priority email', async () => {
      // Arrange
      const dto: SendEmailDto = {
        to: 'urgent@example.com',
        subject: 'Urgent',
        html: '<p>Urgent</p>',
        text: 'Urgent',
        priority: 1,
      };

      prismaService.emailLog.create.mockResolvedValue({ id: 'log-1' } as any);
      smtpProvider.send.mockResolvedValue({ success: true, messageId: 'msg-1' });
      prismaService.emailLog.update.mockResolvedValue({} as any);

      // Act
      await service.sendEmail(dto);

      // Assert
      expect(smtpProvider.send).toHaveBeenCalledWith(
        expect.objectContaining({ priority: 'high' })
      );
    });

    it('should handle low priority email', async () => {
      // Arrange
      const dto: SendEmailDto = {
        to: 'lowpriority@example.com',
        subject: 'Low Priority',
        html: '<p>Low</p>',
        text: 'Low',
        priority: 10,
      };

      prismaService.emailLog.create.mockResolvedValue({ id: 'log-2' } as any);
      smtpProvider.send.mockResolvedValue({ success: true, messageId: 'msg-2' });
      prismaService.emailLog.update.mockResolvedValue({} as any);

      // Act
      await service.sendEmail(dto);

      // Assert
      expect(smtpProvider.send).toHaveBeenCalledWith(
        expect.objectContaining({ priority: 'low' })
      );
    });

    it('should handle email with CC and BCC', async () => {
      // Arrange
      const dto: SendEmailDto = {
        to: 'to@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
        text: 'Test',
        cc: ['cc@example.com'],
        bcc: ['bcc@example.com'],
      };

      prismaService.emailLog.create.mockResolvedValue({ id: 'log-3' } as any);
      smtpProvider.send.mockResolvedValue({ success: true });
      prismaService.emailLog.update.mockResolvedValue({} as any);

      // Act
      await service.sendEmail(dto);

      // Assert
      expect(smtpProvider.send).toHaveBeenCalledWith(
        expect.objectContaining({
          cc: ['cc@example.com'],
          bcc: ['bcc@example.com'],
        })
      );
    });

    it('should handle failed email send', async () => {
      // Arrange
      const dto: SendEmailDto = {
        to: 'fail@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
        text: 'Test',
      };

      prismaService.emailLog.create.mockResolvedValue({ id: 'log-fail' } as any);
      smtpProvider.send.mockResolvedValue({
        success: false,
        error: 'SMTP error',
      });
      prismaService.emailLog.update.mockResolvedValue({} as any);

      // Act
      const result = await service.sendEmail(dto);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to send email');
      expect(prismaService.emailLog.update).toHaveBeenCalledWith({
        where: { id: 'log-fail' },
        data: {
          status: EmailStatus.FAILED,
          externalId: undefined,
          errorMessage: 'SMTP error',
          sentAt: null,
        },
      });
    });

    it('should handle error during send', async () => {
      // Arrange
      const dto: SendEmailDto = {
        to: 'error@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
        text: 'Test',
      };

      prismaService.emailLog.create.mockResolvedValue({ id: 'log-error' } as any);
      smtpProvider.send.mockRejectedValue(new Error('Connection timeout'));
      prismaService.emailLog.update.mockResolvedValue({} as any);

      // Act & Assert
      await expect(service.sendEmail(dto)).rejects.toThrow('Connection timeout');
      expect(prismaService.emailLog.update).toHaveBeenCalledWith({
        where: { id: 'log-error' },
        data: {
          status: EmailStatus.FAILED,
          errorMessage: 'Connection timeout',
        },
      });
    });
  });

  describe('sendTemplatedEmail', () => {
    it('should send templated email successfully', async () => {
      // Arrange
      const dto: SendTemplatedEmailDto = {
        templateName: 'welcome-email',
        recipientEmail: 'user@example.com',
        recipientName: 'John Doe',
        variables: {
          userName: 'John',
          activationLink: 'https://example.com/activate',
        },
      };

      const mockTemplate = {
        id: 'template-1',
        name: 'welcome-email',
        isActive: true,
      };

      const mockRendered = {
        subject: 'Welcome to our platform!',
        htmlBody: '<p>Welcome John!</p>',
        textBody: 'Welcome John!',
      };

      templateService.findByName.mockResolvedValue(mockTemplate as any);
      rendererService.render.mockResolvedValue(mockRendered);
      prismaService.emailLog.create.mockResolvedValue({ id: 'log-tpl-1' } as any);
      smtpProvider.send.mockResolvedValue({ success: true, messageId: 'msg-tpl-1' });
      prismaService.emailLog.update.mockResolvedValue({} as any);

      // Act
      const result = await service.sendTemplatedEmail(dto);

      // Assert
      expect(result.success).toBe(true);
      expect(templateService.findByName).toHaveBeenCalledWith('welcome-email');
      expect(rendererService.render).toHaveBeenCalledWith(mockTemplate, dto.variables);
      expect(smtpProvider.send).toHaveBeenCalledWith({
        to: dto.recipientEmail,
        subject: mockRendered.subject,
        text: mockRendered.textBody,
        html: mockRendered.htmlBody,
        replyTo: undefined,
        cc: undefined,
        bcc: undefined,
        attachments: undefined,
        priority: 'normal',
      });
    });

    it('should throw error if template is inactive', async () => {
      // Arrange
      const dto: SendTemplatedEmailDto = {
        templateName: 'inactive-template',
        recipientEmail: 'user@example.com',
      };

      const mockTemplate = {
        id: 'template-inactive',
        name: 'inactive-template',
        isActive: false,
      };

      templateService.findByName.mockResolvedValue(mockTemplate as any);

      // Act & Assert
      await expect(service.sendTemplatedEmail(dto)).rejects.toThrow(NotFoundException);
      await expect(service.sendTemplatedEmail(dto)).rejects.toThrow(
        "Template 'inactive-template' is not active"
      );
    });

    it('should handle templated email with attachments', async () => {
      // Arrange
      const dto: SendTemplatedEmailDto = {
        templateName: 'report-email',
        recipientEmail: 'user@example.com',
        attachments: [
          {
            filename: 'report.pdf',
            content: Buffer.from('PDF content'),
          },
        ],
      };

      templateService.findByName.mockResolvedValue({
        id: 'template-2',
        isActive: true,
      } as any);
      rendererService.render.mockResolvedValue({
        subject: 'Report',
        htmlBody: '<p>Report</p>',
        textBody: 'Report',
      });
      prismaService.emailLog.create.mockResolvedValue({ id: 'log-att' } as any);
      smtpProvider.send.mockResolvedValue({ success: true });
      prismaService.emailLog.update.mockResolvedValue({} as any);

      // Act
      await service.sendTemplatedEmail(dto);

      // Assert
      expect(smtpProvider.send).toHaveBeenCalledWith(
        expect.objectContaining({
          attachments: dto.attachments,
        })
      );
    });

    it('should handle templated email send failure', async () => {
      // Arrange
      const dto: SendTemplatedEmailDto = {
        templateName: 'test-template',
        recipientEmail: 'fail@example.com',
      };

      templateService.findByName.mockResolvedValue({
        id: 'template-3',
        isActive: true,
      } as any);
      rendererService.render.mockResolvedValue({
        subject: 'Test',
        htmlBody: '<p>Test</p>',
        textBody: 'Test',
      });
      prismaService.emailLog.create.mockResolvedValue({ id: 'log-fail-tpl' } as any);
      smtpProvider.send.mockRejectedValue(new Error('Send failed'));
      prismaService.emailLog.update.mockResolvedValue({} as any);

      // Act & Assert
      await expect(service.sendTemplatedEmail(dto)).rejects.toThrow('Send failed');
      expect(prismaService.emailLog.update).toHaveBeenCalledWith({
        where: { id: 'log-fail-tpl' },
        data: {
          status: EmailStatus.FAILED,
          errorMessage: 'Send failed',
        },
      });
    });
  });

  describe('queueEmail', () => {
    it('should queue email successfully', async () => {
      // Arrange
      const dto: QueueEmailDto = {
        templateName: 'newsletter',
        recipientEmail: 'subscriber@example.com',
        recipientName: 'Subscriber',
        variables: {
          content: 'Newsletter content',
        },
        priority: 5,
      };

      const mockTemplate = {
        id: 'template-newsletter',
        name: 'newsletter',
        variables: [],
      };

      const mockQueueItem = {
        id: 'queue-1',
        scheduledFor: null,
      };

      templateService.findByName.mockResolvedValue(mockTemplate as any);
      queueService.enqueue.mockResolvedValue(mockQueueItem as any);

      // Act
      const result = await service.queueEmail(dto);

      // Assert
      expect(result.success).toBe(true);
      expect(result.queueId).toBe('queue-1');
      expect(result.message).toBe('Email queued for delivery');
      expect(queueService.enqueue).toHaveBeenCalledWith({
        templateId: 'template-newsletter',
        recipientEmail: dto.recipientEmail,
        recipientName: dto.recipientName,
        variables: dto.variables,
        priority: 5,
        scheduledFor: undefined,
      });
    });

    it('should queue email with scheduled time', async () => {
      // Arrange
      const scheduledTime = new Date('2025-12-01T10:00:00Z').toISOString();
      const dto: QueueEmailDto = {
        templateName: 'scheduled-email',
        recipientEmail: 'user@example.com',
        scheduledFor: scheduledTime,
      };

      templateService.findByName.mockResolvedValue({
        id: 'template-scheduled',
        variables: [],
      } as any);
      queueService.enqueue.mockResolvedValue({
        id: 'queue-scheduled',
        scheduledFor: new Date(scheduledTime),
      } as any);

      // Act
      const result = await service.queueEmail(dto);

      // Assert
      expect(result.scheduledFor).toEqual(new Date(scheduledTime));
      expect(queueService.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          scheduledFor: new Date(scheduledTime),
        })
      );
    });

    it('should validate required template variables', async () => {
      // Arrange
      const dto: QueueEmailDto = {
        templateName: 'template-with-vars',
        recipientEmail: 'user@example.com',
        variables: {
          firstName: 'John',
        },
      };

      templateService.findByName.mockResolvedValue({
        id: 'template-vars',
        variables: [
          { name: 'firstName', required: true },
          { name: 'lastName', required: true },
        ],
      } as any);

      // Act & Assert
      await expect(service.queueEmail(dto)).rejects.toThrow(
        'Missing required variables: lastName'
      );
    });

    it('should allow optional template variables to be missing', async () => {
      // Arrange
      const dto: QueueEmailDto = {
        templateName: 'template-optional',
        recipientEmail: 'user@example.com',
        variables: {
          requiredVar: 'value',
        },
      };

      templateService.findByName.mockResolvedValue({
        id: 'template-optional',
        variables: [
          { name: 'requiredVar', required: true },
          { name: 'optionalVar', required: false },
        ],
      } as any);
      queueService.enqueue.mockResolvedValue({ id: 'queue-optional' } as any);

      // Act
      const result = await service.queueEmail(dto);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe('processQueue', () => {
    it('should process queued emails successfully', async () => {
      // Arrange
      const pendingEmails = [
        {
          id: 'queue-1',
          templateId: 'template-1',
          recipientEmail: 'user1@example.com',
          recipientName: 'User One',
          variables: { name: 'User One' },
        },
        {
          id: 'queue-2',
          templateId: 'template-1',
          recipientEmail: 'user2@example.com',
          recipientName: 'User Two',
          variables: { name: 'User Two' },
        },
      ];

      const mockTemplate = {
        id: 'template-1',
        name: 'test-template',
      };

      const mockRendered = {
        subject: 'Test Email',
        htmlBody: '<p>Test</p>',
        textBody: 'Test',
      };

      queueService.getPendingEmails.mockResolvedValue(pendingEmails as any);
      queueService.markAsProcessing.mockResolvedValue(undefined);
      templateService.findOne.mockResolvedValue(mockTemplate as any);
      rendererService.render.mockResolvedValue(mockRendered);
      prismaService.emailLog.create.mockResolvedValue({ id: 'log-processed' } as any);
      smtpProvider.send.mockResolvedValue({ success: true, messageId: 'msg-processed' });
      prismaService.emailLog.update.mockResolvedValue({} as any);
      queueService.markAsCompleted.mockResolvedValue(undefined);

      // Act
      const processed = await service.processQueue(10);

      // Assert
      expect(processed).toBe(2);
      expect(queueService.getPendingEmails).toHaveBeenCalledWith(10);
      expect(queueService.markAsProcessing).toHaveBeenCalledTimes(2);
      expect(queueService.markAsCompleted).toHaveBeenCalledTimes(2);
    });

    it('should return 0 when no pending emails', async () => {
      // Arrange
      queueService.getPendingEmails.mockResolvedValue([]);

      // Act
      const processed = await service.processQueue();

      // Assert
      expect(processed).toBe(0);
    });

    it('should handle emails without template', async () => {
      // Arrange
      const pendingEmails = [
        {
          id: 'queue-no-tpl',
          templateId: null,
          recipientEmail: 'user@example.com',
          variables: {
            subject: 'Direct Email',
            htmlBody: '<p>Direct</p>',
            textBody: 'Direct',
          },
        },
      ];

      queueService.getPendingEmails.mockResolvedValue(pendingEmails as any);
      queueService.markAsProcessing.mockResolvedValue(undefined);
      prismaService.emailLog.create.mockResolvedValue({ id: 'log-direct' } as any);
      smtpProvider.send.mockResolvedValue({ success: true });
      prismaService.emailLog.update.mockResolvedValue({} as any);
      queueService.markAsCompleted.mockResolvedValue(undefined);

      // Act
      const processed = await service.processQueue();

      // Assert
      expect(processed).toBe(1);
      expect(templateService.findOne).not.toHaveBeenCalled();
    });

    it('should handle failed email send in queue', async () => {
      // Arrange
      const pendingEmails = [
        {
          id: 'queue-fail',
          templateId: 'template-1',
          recipientEmail: 'fail@example.com',
          variables: {},
        },
      ];

      queueService.getPendingEmails.mockResolvedValue(pendingEmails as any);
      queueService.markAsProcessing.mockResolvedValue(undefined);
      templateService.findOne.mockResolvedValue({ id: 'template-1' } as any);
      rendererService.render.mockResolvedValue({
        subject: 'Test',
        htmlBody: '<p>Test</p>',
        textBody: 'Test',
      });
      prismaService.emailLog.create.mockResolvedValue({ id: 'log-fail-queue' } as any);
      smtpProvider.send.mockResolvedValue({ success: false, error: 'Send failed' });
      prismaService.emailLog.update.mockResolvedValue({} as any);
      queueService.markAsFailed.mockResolvedValue(undefined);

      // Act
      const processed = await service.processQueue();

      // Assert
      expect(processed).toBe(0);
      expect(queueService.markAsFailed).toHaveBeenCalledWith('queue-fail', 'Send failed');
    });

    it('should handle error during queue processing', async () => {
      // Arrange
      const pendingEmails = [
        {
          id: 'queue-error',
          templateId: 'template-1',
          recipientEmail: 'error@example.com',
          variables: {},
        },
      ];

      queueService.getPendingEmails.mockResolvedValue(pendingEmails as any);
      queueService.markAsProcessing.mockResolvedValue(undefined);
      templateService.findOne.mockRejectedValue(new Error('Template not found'));
      queueService.markAsFailed.mockResolvedValue(undefined);

      // Act
      const processed = await service.processQueue();

      // Assert
      expect(processed).toBe(0);
      expect(queueService.markAsFailed).toHaveBeenCalledWith(
        'queue-error',
        'Template not found'
      );
    });
  });

  describe('getEmailLogs', () => {
    it('should get email logs with pagination', async () => {
      // Arrange
      const query: QueryEmailLogsDto = {
        page: 1,
        limit: 20,
      };

      const mockLogs = [
        {
          id: 'log-1',
          recipientEmail: 'user1@example.com',
          subject: 'Test 1',
          status: EmailStatus.SENT,
        },
        {
          id: 'log-2',
          recipientEmail: 'user2@example.com',
          subject: 'Test 2',
          status: EmailStatus.SENT,
        },
      ];

      prismaService.emailLog.findMany.mockResolvedValue(mockLogs as any);
      prismaService.emailLog.count.mockResolvedValue(100);

      // Act
      const result = await service.getEmailLogs(query);

      // Assert
      expect(result.data).toEqual(mockLogs);
      expect(result.total).toBe(100);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.totalPages).toBe(5);
    });

    it('should filter logs by status', async () => {
      // Arrange
      const query: QueryEmailLogsDto = {
        status: EmailStatus.FAILED,
        page: 1,
        limit: 50,
      };

      prismaService.emailLog.findMany.mockResolvedValue([]);
      prismaService.emailLog.count.mockResolvedValue(0);

      // Act
      await service.getEmailLogs(query);

      // Assert
      expect(prismaService.emailLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: EmailStatus.FAILED,
          }),
        })
      );
    });

    it('should filter logs by template ID', async () => {
      // Arrange
      const query: QueryEmailLogsDto = {
        templateId: 'template-123',
      };

      prismaService.emailLog.findMany.mockResolvedValue([]);
      prismaService.emailLog.count.mockResolvedValue(0);

      // Act
      await service.getEmailLogs(query);

      // Assert
      expect(prismaService.emailLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            templateId: 'template-123',
          }),
        })
      );
    });

    it('should filter logs by recipient email', async () => {
      // Arrange
      const query: QueryEmailLogsDto = {
        recipientEmail: 'john@example.com',
      };

      prismaService.emailLog.findMany.mockResolvedValue([]);
      prismaService.emailLog.count.mockResolvedValue(0);

      // Act
      await service.getEmailLogs(query);

      // Assert
      expect(prismaService.emailLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            recipientEmail: { contains: 'john@example.com', mode: 'insensitive' },
          }),
        })
      );
    });

    it('should filter logs by date range', async () => {
      // Arrange
      const query: QueryEmailLogsDto = {
        dateFrom: '2025-01-01',
        dateTo: '2025-01-31',
      };

      prismaService.emailLog.findMany.mockResolvedValue([]);
      prismaService.emailLog.count.mockResolvedValue(0);

      // Act
      await service.getEmailLogs(query);

      // Assert
      expect(prismaService.emailLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: {
              gte: new Date('2025-01-01'),
              lte: new Date('2025-01-31'),
            },
          }),
        })
      );
    });

    it('should sort logs by specified field', async () => {
      // Arrange
      const query: QueryEmailLogsDto = {
        sortBy: 'recipientEmail',
        sortOrder: 'asc',
      };

      prismaService.emailLog.findMany.mockResolvedValue([]);
      prismaService.emailLog.count.mockResolvedValue(0);

      // Act
      await service.getEmailLogs(query);

      // Assert
      expect(prismaService.emailLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { recipientEmail: 'asc' },
        })
      );
    });
  });

  describe('getEmailLog', () => {
    it('should get email log by ID', async () => {
      // Arrange
      const mockLog = {
        id: 'log-123',
        recipientEmail: 'user@example.com',
        subject: 'Test Email',
        status: EmailStatus.SENT,
        template: {
          id: 'template-1',
          name: 'test-template',
        },
      };

      prismaService.emailLog.findUnique.mockResolvedValue(mockLog as any);

      // Act
      const result = await service.getEmailLog('log-123');

      // Assert
      expect(result).toEqual(mockLog);
      expect(prismaService.emailLog.findUnique).toHaveBeenCalledWith({
        where: { id: 'log-123' },
        include: {
          template: {
            select: {
              id: true,
              name: true,
              displayName: true,
              category: true,
            },
          },
        },
      });
    });

    it('should throw NotFoundException when log not found', async () => {
      // Arrange
      prismaService.emailLog.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getEmailLog('non-existent')).rejects.toThrow(NotFoundException);
      await expect(service.getEmailLog('non-existent')).rejects.toThrow(
        "Email log with ID 'non-existent' not found"
      );
    });
  });

  describe('retryFailedEmail', () => {
    it('should retry failed email successfully', async () => {
      // Arrange
      const mockLog = {
        id: 'log-retry',
        recipientEmail: 'user@example.com',
        subject: 'Test',
        htmlBody: '<p>Test</p>',
        textBody: 'Test',
        status: EmailStatus.FAILED,
        retryCount: 1,
        maxRetries: 3,
      };

      prismaService.emailLog.findUnique.mockResolvedValue(mockLog as any);
      smtpProvider.send.mockResolvedValue({ success: true, messageId: 'retry-msg' });
      prismaService.emailLog.update.mockResolvedValue({} as any);

      // Act
      const result = await service.retryFailedEmail('log-retry');

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('Email sent successfully');
      expect(smtpProvider.send).toHaveBeenCalledWith({
        to: mockLog.recipientEmail,
        subject: mockLog.subject,
        text: mockLog.textBody,
        html: mockLog.htmlBody,
      });
      expect(prismaService.emailLog.update).toHaveBeenCalledWith({
        where: { id: 'log-retry' },
        data: {
          status: EmailStatus.SENT,
          externalId: 'retry-msg',
          errorMessage: undefined,
          sentAt: expect.any(Date),
          retryCount: 2,
        },
      });
    });

    it('should throw error if email is not in failed status', async () => {
      // Arrange
      const mockLog = {
        id: 'log-sent',
        status: EmailStatus.SENT,
      };

      prismaService.emailLog.findUnique.mockResolvedValue(mockLog as any);

      // Act & Assert
      await expect(service.retryFailedEmail('log-sent')).rejects.toThrow(
        'Email log log-sent is not in failed status'
      );
    });

    it('should throw error if max retries exceeded', async () => {
      // Arrange
      const mockLog = {
        id: 'log-max-retries',
        status: EmailStatus.FAILED,
        retryCount: 3,
        maxRetries: 3,
      };

      prismaService.emailLog.findUnique.mockResolvedValue(mockLog as any);

      // Act & Assert
      await expect(service.retryFailedEmail('log-max-retries')).rejects.toThrow(
        'Email log log-max-retries has exceeded max retries'
      );
    });

    it('should handle retry failure', async () => {
      // Arrange
      const mockLog = {
        id: 'log-retry-fail',
        recipientEmail: 'user@example.com',
        subject: 'Test',
        htmlBody: '<p>Test</p>',
        textBody: 'Test',
        status: EmailStatus.FAILED,
        retryCount: 0,
        maxRetries: 3,
      };

      prismaService.emailLog.findUnique.mockResolvedValue(mockLog as any);
      smtpProvider.send.mockRejectedValue(new Error('Still failing'));
      prismaService.emailLog.update.mockResolvedValue({} as any);

      // Act & Assert
      await expect(service.retryFailedEmail('log-retry-fail')).rejects.toThrow(
        'Still failing'
      );
      expect(prismaService.emailLog.update).toHaveBeenCalledWith({
        where: { id: 'log-retry-fail' },
        data: {
          errorMessage: 'Still failing',
          retryCount: 1,
        },
      });
    });
  });

  describe('getEmailStats', () => {
    it('should get email statistics', async () => {
      // Arrange
      prismaService.emailLog.count
        .mockResolvedValueOnce(1000) // totalSent
        .mockResolvedValueOnce(950) // totalSuccess
        .mockResolvedValueOnce(50) // totalFailed
        .mockResolvedValueOnce(400) // totalOpened
        .mockResolvedValueOnce(100); // totalClicked

      prismaService.emailLog.groupBy
        .mockResolvedValueOnce([
          { templateId: 'template-1', _count: 500 },
          { templateId: 'template-2', _count: 500 },
        ])
        .mockResolvedValueOnce([
          { provider: 'smtp', _count: 800 },
          { provider: 'sendgrid', _count: 200 },
        ]);

      templateService.findOne
        .mockResolvedValueOnce({ category: 'transactional' } as any)
        .mockResolvedValueOnce({ category: 'marketing' } as any);

      // Act
      const stats = await service.getEmailStats();

      // Assert
      expect(stats.totalSent).toBe(1000);
      expect(stats.totalSuccess).toBe(950);
      expect(stats.totalFailed).toBe(50);
      expect(stats.successRate).toBe(95);
      expect(stats.totalOpened).toBe(400);
      expect(stats.totalClicked).toBe(100);
      expect(stats.openRate).toBe(42.11);
      expect(stats.clickRate).toBe(10.53);
      expect(stats.byCategory).toEqual({
        transactional: 500,
        marketing: 500,
      });
      expect(stats.byProvider).toEqual({
        smtp: 800,
        sendgrid: 200,
      });
    });

    it('should filter stats by date range', async () => {
      // Arrange
      const dateFrom = '2025-01-01';
      const dateTo = '2025-01-31';

      prismaService.emailLog.count.mockResolvedValue(100);
      prismaService.emailLog.groupBy.mockResolvedValue([]);

      // Act
      await service.getEmailStats(dateFrom, dateTo);

      // Assert
      expect(prismaService.emailLog.count).toHaveBeenCalledWith({
        where: {
          createdAt: {
            gte: new Date(dateFrom),
            lte: new Date(dateTo),
          },
        },
      });
    });

    it('should handle zero emails scenario', async () => {
      // Arrange
      prismaService.emailLog.count.mockResolvedValue(0);
      prismaService.emailLog.groupBy.mockResolvedValue([]);

      // Act
      const stats = await service.getEmailStats();

      // Assert
      expect(stats.totalSent).toBe(0);
      expect(stats.successRate).toBe(0);
      expect(stats.openRate).toBe(0);
      expect(stats.clickRate).toBe(0);
    });
  });

  describe('service initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have all dependencies injected', () => {
      expect(service['prisma']).toBeDefined();
      expect(service['templateService']).toBeDefined();
      expect(service['rendererService']).toBeDefined();
      expect(service['smtpProvider']).toBeDefined();
      expect(service['queueService']).toBeDefined();
    });
  });
});
