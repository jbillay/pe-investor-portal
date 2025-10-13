/**
 * Template Renderer Service
 *
 * Handles Mustache template rendering and validation
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as Mustache from 'mustache';
import DOMPurify from 'isomorphic-dompurify';
import {
  IEmailTemplate,
  RenderedEmail,
  TemplateVariable,
  ValidationError,
  TemplateValidationResult,
} from '../interfaces/email-template.interface';

/**
 * Template Renderer Service
 * Renders Mustache templates and validates variable usage
 */
@Injectable()
export class TemplateRendererService {
  private readonly logger = new Logger(TemplateRendererService.name);

  constructor() {
    // Mustache will escape HTML by default, we'll sanitize after rendering
  }

  /**
   * Render complete email from template
   * @param template Email template
   * @param variables Variables to render
   * @returns Rendered email content
   */
  async render(
    template: IEmailTemplate,
    variables: Record<string, any>,
  ): Promise<RenderedEmail> {
    // Validate variables against schema
    this.validateVariables(template.variables, variables);

    // Add default values for missing optional variables
    const enrichedVariables = this.enrichVariables(
      template.variables,
      variables,
    );

    // Render each part
    const subject = this.renderSubject(template.subject, enrichedVariables);
    const htmlBody = this.renderHtmlBody(template.htmlBody, enrichedVariables);
    const textBody = this.renderTextBody(template.textBody, enrichedVariables);

    return {
      subject,
      htmlBody,
      textBody,
    };
  }

  /**
   * Render subject line
   * @param subject Subject template
   * @param variables Variables
   * @returns Rendered subject
   */
  renderSubject(subject: string, variables: Record<string, any>): string {
    try {
      return Mustache.render(subject, variables).trim();
    } catch (error) {
      this.logger.error('Error rendering subject', error);
      throw new BadRequestException('Failed to render email subject');
    }
  }

  /**
   * Render HTML body with sanitization
   * @param html HTML template
   * @param variables Variables
   * @returns Sanitized rendered HTML
   */
  renderHtmlBody(html: string, variables: Record<string, any>): string {
    try {
      const rendered = Mustache.render(html, variables);
      return this.sanitizeHtml(rendered);
    } catch (error) {
      this.logger.error('Error rendering HTML body', error);
      throw new BadRequestException('Failed to render email HTML body');
    }
  }

  /**
   * Render text body
   * @param text Text template
   * @param variables Variables
   * @returns Rendered text
   */
  renderTextBody(text: string, variables: Record<string, any>): string {
    try {
      return Mustache.render(text, variables);
    } catch (error) {
      this.logger.error('Error rendering text body', error);
      throw new BadRequestException('Failed to render email text body');
    }
  }

  /**
   * Validate Mustache template syntax
   * @param template Template string
   * @returns Validation result
   */
  validateTemplateSyntax(template: string): TemplateValidationResult {
    const errors: ValidationError[] = [];

    try {
      // Parse template to check for syntax errors
      Mustache.parse(template);

      // Check for unclosed tags
      const openTags = (template.match(/{{/g) || []).length;
      const closeTags = (template.match(/}}/g) || []).length;

      if (openTags !== closeTags) {
        errors.push({
          field: 'template',
          message: 'Mismatched Mustache tags',
          type: 'syntax_error',
        });
      }

      // Check for invalid variable names (should be alphanumeric and underscore)
      const variablePattern = /{{([^}]+)}}/g;
      let match;
      while ((match = variablePattern.exec(template)) !== null) {
        const varName = match[1].trim();
        // Allow simple variables, no sections or inverted sections for now
        if (!varName.match(/^[a-zA-Z0-9_]+$/)) {
          errors.push({
            field: 'template',
            message: `Invalid variable name: ${varName}`,
            type: 'invalid_variable',
          });
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Template parsing failed';
      errors.push({
        field: 'template',
        message: errorMessage,
        type: 'parse_error',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate template content (subject, HTML, text)
   * @param subject Subject template
   * @param htmlBody HTML template
   * @param textBody Text template
   * @returns Validation result
   */
  validateTemplate(
    subject: string,
    htmlBody: string,
    textBody: string,
  ): TemplateValidationResult {
    const errors: ValidationError[] = [];

    // Validate subject
    const subjectValidation = this.validateTemplateSyntax(subject);
    if (!subjectValidation.isValid) {
      errors.push(
        ...subjectValidation.errors.map((e) => ({
          ...e,
          field: 'subject',
        })),
      );
    }

    // Validate HTML body
    const htmlValidation = this.validateTemplateSyntax(htmlBody);
    if (!htmlValidation.isValid) {
      errors.push(
        ...htmlValidation.errors.map((e) => ({
          ...e,
          field: 'htmlBody',
        })),
      );
    }

    // Validate text body
    const textValidation = this.validateTemplateSyntax(textBody);
    if (!textValidation.isValid) {
      errors.push(
        ...textValidation.errors.map((e) => ({
          ...e,
          field: 'textBody',
        })),
      );
    }

    // Check for variable consistency (all used variables should be in schema)
    const usedVariables = this.extractVariables(subject, htmlBody, textBody);
    // This validation will be done by EmailTemplateService since it has access to variable schema

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Extract all variables used in templates
   * @param templates Template strings
   * @returns Set of variable names
   */
  extractVariables(...templates: string[]): Set<string> {
    const variables = new Set<string>();
    const variablePattern = /{{([^}]+)}}/g;

    templates.forEach((template) => {
      let match;
      while ((match = variablePattern.exec(template)) !== null) {
        const varName = match[1].trim();
        variables.add(varName);
      }
    });

    return variables;
  }

  /**
   * Validate variables against schema
   * @param schema Variable schema
   * @param variables Provided variables
   * @throws BadRequestException if validation fails
   */
  private validateVariables(
    schema: TemplateVariable[],
    variables: Record<string, any>,
  ): void {
    const errors: string[] = [];

    // Check required variables
    schema.forEach((schemaVar) => {
      if (schemaVar.required && !(schemaVar.name in variables)) {
        errors.push(`Required variable '${schemaVar.name}' is missing`);
      }
    });

    // Validate variable types
    schema.forEach((schemaVar) => {
      const value = variables[schemaVar.name];
      if (value !== undefined && value !== null) {
        const isValid = this.validateVariableType(value, schemaVar.type);
        if (!isValid) {
          errors.push(
            `Variable '${schemaVar.name}' has invalid type. Expected: ${schemaVar.type}`,
          );
        }
      }
    });

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Variable validation failed',
        errors,
      });
    }
  }

  /**
   * Validate variable type
   * @param value Variable value
   * @param expectedType Expected type
   * @returns True if valid
   */
  private validateVariableType(value: any, expectedType: string): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'date':
        return value instanceof Date || !isNaN(Date.parse(value));
      case 'currency':
        return typeof value === 'number' || typeof value === 'string';
      default:
        return true;
    }
  }

  /**
   * Enrich variables with default values
   * @param schema Variable schema
   * @param variables Provided variables
   * @returns Enriched variables
   */
  private enrichVariables(
    schema: TemplateVariable[],
    variables: Record<string, any>,
  ): Record<string, any> {
    const enriched = { ...variables };

    schema.forEach((schemaVar) => {
      if (!(schemaVar.name in enriched) && schemaVar.defaultValue !== undefined) {
        enriched[schemaVar.name] = schemaVar.defaultValue;
      }
    });

    return enriched;
  }

  /**
   * Sanitize HTML to prevent XSS attacks
   * @param html HTML content
   * @returns Sanitized HTML
   */
  private sanitizeHtml(html: string): string {
    // DOMPurify configuration for email
    const config = {
      ALLOWED_TAGS: [
        'a',
        'b',
        'i',
        'u',
        'strong',
        'em',
        'p',
        'br',
        'div',
        'span',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'ul',
        'ol',
        'li',
        'table',
        'thead',
        'tbody',
        'tr',
        'td',
        'th',
        'img',
        'hr',
        'blockquote',
        'pre',
        'code',
      ],
      ALLOWED_ATTR: [
        'href',
        'src',
        'alt',
        'title',
        'style',
        'class',
        'id',
        'width',
        'height',
        'border',
        'cellpadding',
        'cellspacing',
        'align',
        'valign',
        'target',
      ],
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    };

    return DOMPurify.sanitize(html, config);
  }
}
