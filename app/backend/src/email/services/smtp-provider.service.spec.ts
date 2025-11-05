import { Test, TestingModule } from '@nestjs/testing';
import { SmtpProviderService } from './smtp-provider.service';
import * as nodemailer from 'nodemailer';

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
  createTestAccount: jest.fn(),
  getTestMessageUrl: jest.fn(),
}));

describe('SmtpProviderService', () => {
  let service: SmtpProviderService;
  let mockTransporter: any;
  let mockCreateTransport: jest.MockedFunction<typeof nodemailer.createTransport>;
  let mockCreateTestAccount: jest.MockedFunction<typeof nodemailer.createTestAccount>;
  let mockGetTestMessageUrl: jest.MockedFunction<typeof nodemailer.getTestMessageUrl>;

  const mockEtherealAccount = {
    user: 'test@ethereal.email',
    pass: 'testpassword',
    smtp: {
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
    },
  };

  beforeEach(async () => {
    // Reset environment variables
    delete process.env.EMAIL_PROVIDER;
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_SECURE;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASSWORD;
    delete process.env.EMAIL_FROM_NAME;
    delete process.env.EMAIL_FROM_ADDRESS;
    delete process.env.EMAIL_REPLY_TO;
    delete process.env.NODE_ENV;

    // Create mock transporter
    mockTransporter = {
      sendMail: jest.fn(),
      verify: jest.fn(),
    };

    // Get mocked functions
    mockCreateTransport = nodemailer.createTransport as jest.MockedFunction<typeof nodemailer.createTransport>;
    mockCreateTestAccount = nodemailer.createTestAccount as jest.MockedFunction<typeof nodemailer.createTestAccount>;
    mockGetTestMessageUrl = nodemailer.getTestMessageUrl as jest.MockedFunction<typeof nodemailer.getTestMessageUrl>;

    // Setup default mock implementations
    mockCreateTransport.mockReturnValue(mockTransporter as any);
    mockCreateTestAccount.mockResolvedValue(mockEtherealAccount as any);
    mockGetTestMessageUrl.mockReturnValue('https://ethereal.email/message/xxx');

    const module: TestingModule = await Test.createTestingModule({
      providers: [SmtpProviderService],
    }).compile();

    service = module.get<SmtpProviderService>(SmtpProviderService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should initialize transporter on module init', async () => {
      await service.onModuleInit();
      expect(mockCreateTransport).toHaveBeenCalled();
    });
  });

  describe('initializeTransporter - Ethereal', () => {
    it('should use Ethereal when EMAIL_PROVIDER is ethereal', async () => {
      process.env.EMAIL_PROVIDER = 'ethereal';

      await service.onModuleInit();

      expect(mockCreateTestAccount).toHaveBeenCalled();
      expect(mockCreateTransport).toHaveBeenCalledWith({
        host: mockEtherealAccount.smtp.host,
        port: mockEtherealAccount.smtp.port,
        secure: mockEtherealAccount.smtp.secure,
        auth: {
          user: mockEtherealAccount.user,
          pass: mockEtherealAccount.pass,
        },
      });
    });

    it('should use Ethereal in development mode when no SMTP_HOST is set', async () => {
      process.env.NODE_ENV = 'development';
      delete process.env.SMTP_HOST;

      await service.onModuleInit();

      expect(mockCreateTestAccount).toHaveBeenCalled();
    });

    it('should fall back to regular SMTP when Ethereal creation fails', async () => {
      process.env.EMAIL_PROVIDER = 'ethereal';
      mockCreateTestAccount.mockRejectedValueOnce(new Error('Ethereal error'));

      await service.onModuleInit();

      // Should be called twice - once for Ethereal failure, once for fallback
      expect(mockCreateTransport).toHaveBeenCalled();
    });

    it('should handle non-Error objects when Ethereal creation fails', async () => {
      process.env.EMAIL_PROVIDER = 'ethereal';
      mockCreateTestAccount.mockRejectedValueOnce('string error' as any);

      await service.onModuleInit();

      expect(mockCreateTransport).toHaveBeenCalled();
    });
  });

  describe('initializeTransporter - Regular SMTP', () => {
    it('should use regular SMTP when SMTP_HOST is provided', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      process.env.SMTP_PORT = '465';
      process.env.SMTP_SECURE = 'true';
      process.env.SMTP_USER = 'user@example.com';
      process.env.SMTP_PASSWORD = 'password123';

      await service.onModuleInit();

      expect(mockCreateTransport).toHaveBeenCalledWith({
        host: 'smtp.example.com',
        port: 465,
        secure: true,
        auth: {
          user: 'user@example.com',
          pass: 'password123',
        },
      });
      expect(mockCreateTestAccount).not.toHaveBeenCalled();
    });

    it('should use default SMTP settings when not provided', async () => {
      process.env.NODE_ENV = 'production'; // Avoid Ethereal

      await service.onModuleInit();

      expect(mockCreateTransport).toHaveBeenCalledWith({
        host: 'localhost',
        port: 587,
        secure: false,
        auth: undefined,
      });
    });

    it('should omit auth when SMTP_USER is not provided', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      delete process.env.SMTP_USER;

      await service.onModuleInit();

      const config = mockCreateTransport.mock.calls[0][0];
      expect(config.auth).toBeUndefined();
    });
  });

  describe('send', () => {
    beforeEach(async () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      await service.onModuleInit();
    });

    it('should send email successfully', async () => {
      const mockInfo = {
        messageId: 'message-id-123',
        response: '250 OK',
      };
      mockTransporter.sendMail.mockResolvedValue(mockInfo);

      const options = {
        to: 'recipient@example.com',
        subject: 'Test Email',
        text: 'Test content',
        html: '<p>Test content</p>',
      };

      const result = await service.send(options);

      expect(result).toEqual({
        success: true,
        messageId: 'message-id-123',
        provider: 'smtp',
      });
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'recipient@example.com',
          subject: 'Test Email',
          text: 'Test content',
          html: '<p>Test content</p>',
          priority: 'normal',
        })
      );
    });

    it('should use default from address when not provided', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'msg-1' });

      await service.send({
        to: 'recipient@example.com',
        subject: 'Test',
        text: 'Test',
      });

      const mailOptions = mockTransporter.sendMail.mock.calls[0][0];
      expect(mailOptions.from).toContain('Investor Portal');
      expect(mailOptions.from).toContain('noreply@localhost');
    });

    it('should use custom from address when provided', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'msg-1' });
      process.env.EMAIL_FROM_NAME = 'Custom Name';
      process.env.EMAIL_FROM_ADDRESS = 'custom@example.com';

      await service.send({
        to: 'recipient@example.com',
        subject: 'Test',
        text: 'Test',
      });

      const mailOptions = mockTransporter.sendMail.mock.calls[0][0];
      expect(mailOptions.from).toContain('Custom Name');
      expect(mailOptions.from).toContain('custom@example.com');
    });

    it('should include optional email fields', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'msg-1' });

      await service.send({
        to: 'recipient@example.com',
        subject: 'Test',
        text: 'Test',
        replyTo: 'reply@example.com',
        cc: 'cc@example.com',
        bcc: 'bcc@example.com',
        attachments: [{ filename: 'test.pdf', content: Buffer.from('test') }],
        priority: 'high',
      });

      const mailOptions = mockTransporter.sendMail.mock.calls[0][0];
      expect(mailOptions.replyTo).toBe('reply@example.com');
      expect(mailOptions.cc).toBe('cc@example.com');
      expect(mailOptions.bcc).toBe('bcc@example.com');
      expect(mailOptions.attachments).toHaveLength(1);
      expect(mailOptions.priority).toBe('high');
    });

    it('should use EMAIL_REPLY_TO from environment when not provided', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'msg-1' });
      process.env.EMAIL_REPLY_TO = 'default-reply@example.com';

      await service.send({
        to: 'recipient@example.com',
        subject: 'Test',
        text: 'Test',
      });

      const mailOptions = mockTransporter.sendMail.mock.calls[0][0];
      expect(mailOptions.replyTo).toBe('default-reply@example.com');
    });

    it('should return error when sending fails', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP error'));

      const result = await service.send({
        to: 'recipient@example.com',
        subject: 'Test',
        text: 'Test',
      });

      expect(result).toEqual({
        success: false,
        error: 'SMTP error',
        provider: 'smtp',
      });
    });

    it('should handle non-Error objects when sending fails', async () => {
      mockTransporter.sendMail.mockRejectedValue('string error');

      const result = await service.send({
        to: 'recipient@example.com',
        subject: 'Test',
        text: 'Test',
      });

      expect(result).toEqual({
        success: false,
        error: 'Unknown error',
        provider: 'smtp',
      });
    });

    it('should log preview URL when using Ethereal', async () => {
      // Reinitialize with Ethereal
      process.env.EMAIL_PROVIDER = 'ethereal';
      await service.onModuleInit();

      const mockInfo = {
        messageId: 'ethereal-msg-id',
        response: '250 OK',
      };
      mockTransporter.sendMail.mockResolvedValue(mockInfo);

      const result = await service.send({
        to: 'recipient@example.com',
        subject: 'Test',
        text: 'Test',
      });

      expect(result.success).toBe(true);
      expect(mockGetTestMessageUrl).toHaveBeenCalledWith(mockInfo);
    });

    it('should handle null preview URL from Ethereal', async () => {
      // Reinitialize with Ethereal
      process.env.EMAIL_PROVIDER = 'ethereal';
      await service.onModuleInit();

      const mockInfo = {
        messageId: 'ethereal-msg-id',
        response: '250 OK',
      };
      mockTransporter.sendMail.mockResolvedValue(mockInfo);
      mockGetTestMessageUrl.mockReturnValue(null);

      const result = await service.send({
        to: 'recipient@example.com',
        subject: 'Test',
        text: 'Test',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('verify', () => {
    beforeEach(async () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      await service.onModuleInit();
    });

    it('should return true when verification succeeds', async () => {
      mockTransporter.verify.mockResolvedValue(true);

      const result = await service.verify();

      expect(result).toBe(true);
      expect(mockTransporter.verify).toHaveBeenCalled();
    });

    it('should return false when verification fails', async () => {
      mockTransporter.verify.mockRejectedValue(new Error('Connection failed'));

      const result = await service.verify();

      expect(result).toBe(false);
    });

    it('should handle non-Error objects when verification fails', async () => {
      mockTransporter.verify.mockRejectedValue('string error');

      const result = await service.verify();

      expect(result).toBe(false);
    });
  });

  describe('getProviderName', () => {
    it('should return smtp as provider name', () => {
      expect(service.getProviderName()).toBe('smtp');
    });
  });
});
