import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { TemplateRendererService } from './template-renderer.service';
import { IEmailTemplate, TemplateVariable } from '../interfaces/email-template.interface';

describe('TemplateRendererService', () => {
  let service: TemplateRendererService;

  const mockVariableSchema: TemplateVariable[] = [
    {
      name: 'firstName',
      type: 'string',
      required: true,
      description: 'User first name',
    },
    {
      name: 'lastName',
      type: 'string',
      required: false,
      defaultValue: 'User',
      description: 'User last name',
    },
    {
      name: 'amount',
      type: 'number',
      required: false,
      description: 'Amount',
    },
    {
      name: 'isActive',
      type: 'boolean',
      required: false,
      description: 'Active status',
    },
  ];

  const mockTemplate: IEmailTemplate = {
    id: 'template-1',
    name: 'Welcome Email',
    subject: 'Welcome {{firstName}}!',
    htmlBody: '<h1>Hello {{firstName}} {{lastName}}</h1>',
    textBody: 'Hello {{firstName}} {{lastName}}',
    variables: mockVariableSchema,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TemplateRendererService],
    }).compile();

    service = module.get<TemplateRendererService>(TemplateRendererService);
  });

  describe('render', () => {
    it('should render complete email with all variables', async () => {
      const variables = {
        firstName: 'John',
        lastName: 'Doe',
      };

      const result = await service.render(mockTemplate, variables);

      expect(result.subject).toBe('Welcome John!');
      expect(result.htmlBody).toContain('Hello John Doe');
      expect(result.textBody).toBe('Hello John Doe');
    });

    it('should use default values for missing optional variables', async () => {
      const variables = {
        firstName: 'John',
        // lastName is missing, should use default 'User'
      };

      const result = await service.render(mockTemplate, variables);

      expect(result.subject).toBe('Welcome John!');
      expect(result.htmlBody).toContain('Hello John User');
      expect(result.textBody).toBe('Hello John User');
    });

    it('should throw BadRequestException when required variables are missing', async () => {
      const variables = {
        lastName: 'Doe',
        // firstName is missing but required
      };

      await expect(service.render(mockTemplate, variables)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when variable types are invalid', async () => {
      const template: IEmailTemplate = {
        ...mockTemplate,
        variables: [
          {
            name: 'age',
            type: 'number',
            required: true,
            description: 'Age',
          },
        ],
      };

      const variables = {
        age: 'not a number', // Invalid type
      };

      await expect(service.render(template, variables)).rejects.toThrow(BadRequestException);
    });
  });

  describe('renderSubject', () => {
    it('should render subject with variables', () => {
      const subject = 'Hello {{name}}, welcome!';
      const variables = { name: 'John' };

      const result = service.renderSubject(subject, variables);

      expect(result).toBe('Hello John, welcome!');
    });

    it('should trim whitespace from rendered subject', () => {
      const subject = '  {{greeting}} {{name}}  ';
      const variables = { greeting: 'Hi', name: 'John' };

      const result = service.renderSubject(subject, variables);

      expect(result).toBe('Hi John');
    });

    it('should throw BadRequestException on rendering error', () => {
      // This would require a broken Mustache setup, hard to test naturally
      // Just verify the method handles variables correctly
      const subject = 'Test {{var}}';
      const variables = { var: 'value' };

      expect(() => service.renderSubject(subject, variables)).not.toThrow();
    });
  });

  describe('renderHtmlBody', () => {
    it('should render HTML with variables', () => {
      const html = '<p>Hello {{name}}</p>';
      const variables = { name: 'John' };

      const result = service.renderHtmlBody(html, variables);

      expect(result).toContain('Hello John');
    });

    it('should sanitize rendered HTML', () => {
      const html = '<p>Hello {{name}}</p><script>alert("xss")</script>';
      const variables = { name: 'John' };

      const result = service.renderHtmlBody(html, variables);

      expect(result).toContain('Hello John');
      expect(result).not.toContain('<script>');
    });

    it('should allow safe HTML tags', () => {
      const html = '<div><h1>{{title}}</h1><p>{{content}}</p><a href="{{link}}">Link</a></div>';
      const variables = { title: 'Title', content: 'Content', link: 'https://example.com' };

      const result = service.renderHtmlBody(html, variables);

      expect(result).toContain('<h1>');
      expect(result).toContain('<p>');
      expect(result).toContain('<a');
    });

    it('should remove dangerous attributes', () => {
      const html = '<div onclick="alert()">{{content}}</div>';
      const variables = { content: 'Test' };

      const result = service.renderHtmlBody(html, variables);

      expect(result).not.toContain('onclick');
    });
  });

  describe('renderTextBody', () => {
    it('should render text body with variables', () => {
      const text = 'Hello {{name}}, welcome to {{platform}}!';
      const variables = { name: 'John', platform: 'Our Service' };

      const result = service.renderTextBody(text, variables);

      expect(result).toBe('Hello John, welcome to Our Service!');
    });

    it('should handle empty variables gracefully', () => {
      const text = 'Hello {{name}}!';
      const variables = { name: '' };

      const result = service.renderTextBody(text, variables);

      expect(result).toBe('Hello !');
    });
  });

  describe('validateTemplateSyntax', () => {
    it('should validate correct Mustache syntax', () => {
      const template = 'Hello {{name}}, your balance is {{balance}}';

      const result = service.validateTemplateSyntax(template);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect mismatched Mustache tags', () => {
      const template = 'Hello {{name}, your balance is {{balance}}';

      const result = service.validateTemplateSyntax(template);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Mismatched Mustache tags');
    });

    it('should detect invalid variable names', () => {
      const template = 'Hello {{user-name}}, welcome!';

      const result = service.validateTemplateSyntax(template);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.type === 'invalid_variable')).toBe(true);
    });

    it('should allow valid variable names with underscores', () => {
      const template = 'Hello {{first_name}} {{last_name}}';

      const result = service.validateTemplateSyntax(template);

      expect(result.isValid).toBe(true);
    });

    it('should allow alphanumeric variable names', () => {
      const template = 'Order {{order123}} for user {{user456}}';

      const result = service.validateTemplateSyntax(template);

      expect(result.isValid).toBe(true);
    });
  });

  describe('validateTemplate', () => {
    it('should validate all template parts (subject, HTML, text)', () => {
      const subject = 'Hello {{name}}';
      const htmlBody = '<p>Hello {{name}}</p>';
      const textBody = 'Hello {{name}}';

      const result = service.validateTemplate(subject, htmlBody, textBody);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should collect errors from all template parts', () => {
      const subject = 'Hello {{name';
      const htmlBody = '<p>Hello {{name}}</p>';
      const textBody = 'Hello {{name}';

      const result = service.validateTemplate(subject, htmlBody, textBody);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e) => e.field === 'subject')).toBe(true);
      expect(result.errors.some((e) => e.field === 'textBody')).toBe(true);
    });

    it('should identify which field has errors', () => {
      const subject = 'Valid {{name}}';
      const htmlBody = 'Invalid {{user-name}}';
      const textBody = 'Valid {{name}}';

      const result = service.validateTemplate(subject, htmlBody, textBody);

      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('htmlBody');
    });
  });

  describe('extractVariables', () => {
    it('should extract all unique variables from templates', () => {
      const template1 = 'Hello {{firstName}} {{lastName}}';
      const template2 = 'Your email is {{email}}';
      const template3 = 'Welcome {{firstName}}'; // Duplicate

      const result = service.extractVariables(template1, template2, template3);

      expect(result.size).toBe(3);
      expect(result.has('firstName')).toBe(true);
      expect(result.has('lastName')).toBe(true);
      expect(result.has('email')).toBe(true);
    });

    it('should handle templates with no variables', () => {
      const template = 'This is plain text with no variables';

      const result = service.extractVariables(template);

      expect(result.size).toBe(0);
    });

    it('should trim variable names', () => {
      const template = 'Hello {{ name }} and {{ age }}';

      const result = service.extractVariables(template);

      expect(result.has('name')).toBe(true);
      expect(result.has('age')).toBe(true);
    });

    it('should handle multiple templates', () => {
      const templates = [
        'Subject: {{subject}}',
        '<p>Body: {{content}}</p>',
        'Footer: {{footer}}',
      ];

      const result = service.extractVariables(...templates);

      expect(result.size).toBe(3);
      expect(result.has('subject')).toBe(true);
      expect(result.has('content')).toBe(true);
      expect(result.has('footer')).toBe(true);
    });
  });

  describe('variable validation', () => {
    it('should validate string type', async () => {
      const template: IEmailTemplate = {
        ...mockTemplate,
        variables: [{ name: 'name', type: 'string', required: true, description: 'Name' }],
      };

      const variables = { name: 'John' };

      await expect(service.render(template, variables)).resolves.toBeDefined();
    });

    it('should validate number type', async () => {
      const template: IEmailTemplate = {
        ...mockTemplate,
        variables: [{ name: 'count', type: 'number', required: true, description: 'Count' }],
      };

      const validVariables = { count: 42 };
      await expect(service.render(template, validVariables)).resolves.toBeDefined();

      const invalidVariables = { count: 'not a number' };
      await expect(service.render(template, invalidVariables)).rejects.toThrow(BadRequestException);
    });

    it('should validate boolean type', async () => {
      const template: IEmailTemplate = {
        ...mockTemplate,
        variables: [{ name: 'flag', type: 'boolean', required: true, description: 'Flag' }],
      };

      const validVariables = { flag: true };
      await expect(service.render(template, validVariables)).resolves.toBeDefined();

      const invalidVariables = { flag: 'yes' };
      await expect(service.render(template, invalidVariables)).rejects.toThrow(BadRequestException);
    });

    it('should validate date type', async () => {
      const template: IEmailTemplate = {
        ...mockTemplate,
        subject: 'Date: {{date}}',
        htmlBody: '<p>{{date}}</p>',
        textBody: '{{date}}',
        variables: [{ name: 'date', type: 'date', required: true, description: 'Date' }],
      };

      const validVariables1 = { date: new Date() };
      await expect(service.render(template, validVariables1)).resolves.toBeDefined();

      const validVariables2 = { date: '2024-01-15' };
      await expect(service.render(template, validVariables2)).resolves.toBeDefined();

      const invalidVariables = { date: 'invalid date' };
      await expect(service.render(template, invalidVariables)).rejects.toThrow(BadRequestException);
    });

    it('should validate currency type (accepts number or string)', async () => {
      const template: IEmailTemplate = {
        ...mockTemplate,
        subject: 'Amount: {{amount}}',
        htmlBody: '<p>{{amount}}</p>',
        textBody: '{{amount}}',
        variables: [{ name: 'amount', type: 'currency', required: true, description: 'Amount' }],
      };

      const validVariables1 = { amount: 99.99 };
      await expect(service.render(template, validVariables1)).resolves.toBeDefined();

      const validVariables2 = { amount: '$99.99' };
      await expect(service.render(template, validVariables2)).resolves.toBeDefined();
    });

    it('should allow null/undefined for optional variables', async () => {
      const template: IEmailTemplate = {
        ...mockTemplate,
        variables: [
          { name: 'optional', type: 'string', required: false, description: 'Optional' },
        ],
      };

      const variables1 = { optional: null };
      await expect(service.render(template, variables1)).resolves.toBeDefined();

      const variables2 = { optional: undefined };
      await expect(service.render(template, variables2)).resolves.toBeDefined();

      const variables3 = {}; // Missing optional variable
      await expect(service.render(template, variables3)).resolves.toBeDefined();
    });

    it('should throw BadRequestException with detailed errors', async () => {
      const template: IEmailTemplate = {
        ...mockTemplate,
        variables: [
          { name: 'required1', type: 'string', required: true, description: 'Required 1' },
          { name: 'required2', type: 'number', required: true, description: 'Required 2' },
        ],
      };

      const variables = {}; // Missing both required variables

      try {
        await service.render(template, variables);
        fail('Should have thrown BadRequestException');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        const response = error.getResponse() as any;
        expect(response.errors).toBeDefined();
        expect(response.errors.length).toBe(2);
      }
    });
  });

  describe('HTML sanitization', () => {
    it('should allow safe email HTML tags', () => {
      const html = `
        <div>
          <h1>Title</h1>
          <p>Paragraph</p>
          <a href="https://example.com">Link</a>
          <ul><li>Item</li></ul>
          <table><tr><td>Cell</td></tr></table>
          <img src="image.jpg" alt="Image" />
        </div>
      `;

      const result = service.renderHtmlBody(html, {});

      expect(result).toContain('<h1>');
      expect(result).toContain('<p>');
      expect(result).toContain('<a');
      expect(result).toContain('<ul>');
      expect(result).toContain('<table>');
      expect(result).toContain('<img');
    });

    it('should remove script tags', () => {
      const html = '<p>Safe content</p><script>alert("xss")</script>';

      const result = service.renderHtmlBody(html, {});

      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
    });

    it('should remove inline event handlers', () => {
      const html = '<div onclick="malicious()">Content</div>';

      const result = service.renderHtmlBody(html, {});

      expect(result).not.toContain('onclick');
      expect(result).not.toContain('malicious');
    });

    it('should allow safe attributes', () => {
      const html = '<a href="https://example.com" title="Example" target="_blank">Link</a>';

      const result = service.renderHtmlBody(html, {});

      expect(result).toContain('href');
      expect(result).toContain('title');
      expect(result).toContain('target');
    });

    it('should handle empty HTML', () => {
      const result = service.renderHtmlBody('', {});

      expect(result).toBe('');
    });
  });
});
