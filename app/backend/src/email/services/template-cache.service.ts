/**
 * Template Cache Service
 *
 * In-memory LRU cache for email templates to reduce database queries
 */

import { Injectable, Logger } from '@nestjs/common';
import { LRUCache } from 'lru-cache';
import { IEmailTemplate } from '../interfaces/email-template.interface';

/**
 * Cache options interface
 */
interface CacheOptions {
  max: number; // Maximum number of items
  ttl: number; // Time to live in milliseconds
}

/**
 * Template Cache Service
 * Provides in-memory caching for email templates using LRU strategy
 */
@Injectable()
export class TemplateCacheService {
  private readonly logger = new Logger(TemplateCacheService.name);
  private cache: LRUCache<string, IEmailTemplate>;

  constructor() {
    const options: CacheOptions = {
      max: parseInt(process.env.EMAIL_TEMPLATE_CACHE_MAX || '100', 10),
      ttl: parseInt(process.env.EMAIL_TEMPLATE_CACHE_TTL || '3600000', 10), // 1 hour default
    };

    this.cache = new LRUCache<string, IEmailTemplate>({
      max: options.max,
      ttl: options.ttl,
      updateAgeOnGet: true, // Refresh TTL on access
      updateAgeOnHas: false,
    });

    this.logger.log(
      `Template cache initialized with max: ${options.max}, ttl: ${options.ttl}ms`,
    );
  }

  /**
   * Get template from cache
   * @param key Cache key (template ID or name)
   * @returns Template or undefined if not found
   */
  get(key: string): IEmailTemplate | undefined {
    const template = this.cache.get(key);
    if (template) {
      this.logger.debug(`Cache hit for key: ${key}`);
    } else {
      this.logger.debug(`Cache miss for key: ${key}`);
    }
    return template;
  }

  /**
   * Set template in cache
   * @param key Cache key (template ID or name)
   * @param value Template to cache
   */
  set(key: string, value: IEmailTemplate): void {
    this.cache.set(key, value);
    this.logger.debug(`Cached template with key: ${key}`);
  }

  /**
   * Invalidate template cache entry
   * @param key Cache key to invalidate
   */
  invalidate(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.logger.debug(`Invalidated cache for key: ${key}`);
    }
    return deleted;
  }

  /**
   * Invalidate template by both ID and name
   * @param id Template ID
   * @param name Template name
   */
  invalidateTemplate(id: string, name: string): void {
    this.invalidate(id);
    this.invalidate(name);
    this.logger.debug(`Invalidated cache for template ID: ${id}, name: ${name}`);
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
    this.logger.log('Cache cleared');
  }

  /**
   * Get cache statistics
   * @returns Cache stats
   */
  getStats(): {
    size: number;
    max: number;
    ttl: number;
  } {
    return {
      size: this.cache.size,
      max: this.cache.max,
      ttl: this.cache.ttl || 0,
    };
  }

  /**
   * Check if key exists in cache
   * @param key Cache key
   * @returns True if key exists
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }
}
