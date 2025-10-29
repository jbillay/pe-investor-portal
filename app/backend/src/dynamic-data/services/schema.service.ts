import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { DynamicSchema, DynamicField } from '../entities/instance.entity';

@Injectable()
export class SchemaService {
  // Simple in-memory cache for schemas
  private schemaCache: Map<string, { schema: DynamicSchema; cachedAt: Date }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get schema by dataKey with caching
   */
  async getSchema(dataKey: string, userId?: string): Promise<DynamicSchema> {
    // Check cache first
    const cached = this.schemaCache.get(dataKey);
    if (cached && Date.now() - cached.cachedAt.getTime() < this.CACHE_TTL) {
      return cached.schema;
    }

    // Fetch from database
    const dataObject = await this.prisma.dataObject.findUnique({
      where: { dataKey, isActive: true },
      include: {
        fields: {
          where: { isActive: true },
          include: {
            validationRules: true,
            dropdownOptions: {
              where: { isActive: true },
              orderBy: { orderIndex: 'asc' },
            },
          },
          orderBy: { fieldOrder: 'asc' },
        },
      },
    });

    if (!dataObject) {
      throw new NotFoundException(`Data object with key '${dataKey}' not found`);
    }

    // Get current version
    const latestVersion = await this.prisma.dataObjectVersion.findFirst({
      where: { dataObjectId: dataObject.id },
      orderBy: { version: 'desc' },
    });

    // Build schema
    const schema: DynamicSchema = {
      dataObjectId: dataObject.id,
      dataKey: dataObject.dataKey,
      name: dataObject.name,
      description: dataObject.description || undefined,
      version: latestVersion?.version || 1,
      fields: dataObject.fields.map((field) => this.mapToDynamicField(field)),
    };

    // If userId provided, add permissions
    if (userId) {
      schema.permissions = await this.getUserPermissions(dataKey, userId);
    }

    // Cache the schema
    this.schemaCache.set(dataKey, {
      schema,
      cachedAt: new Date(),
    });

    return schema;
  }

  /**
   * Get schema by ID
   */
  async getSchemaById(dataObjectId: string): Promise<DynamicSchema> {
    const dataObject = await this.prisma.dataObject.findUnique({
      where: { id: dataObjectId, isActive: true },
      include: {
        fields: {
          where: { isActive: true },
          include: {
            validationRules: true,
            dropdownOptions: {
              where: { isActive: true },
              orderBy: { orderIndex: 'asc' },
            },
          },
          orderBy: { fieldOrder: 'asc' },
        },
      },
    });

    if (!dataObject) {
      throw new NotFoundException(`Data object with ID '${dataObjectId}' not found`);
    }

    const latestVersion = await this.prisma.dataObjectVersion.findFirst({
      where: { dataObjectId },
      orderBy: { version: 'desc' },
    });

    return {
      dataObjectId: dataObject.id,
      dataKey: dataObject.dataKey,
      name: dataObject.name,
      description: dataObject.description || undefined,
      version: latestVersion?.version || 1,
      fields: dataObject.fields.map((field) => this.mapToDynamicField(field)),
    };
  }

  /**
   * Invalidate cache for a specific dataKey
   */
  invalidateCache(dataKey: string): void {
    this.schemaCache.delete(dataKey);
  }

  /**
   * Clear all schema cache
   */
  clearCache(): void {
    this.schemaCache.clear();
  }

  /**
   * Helper: Map database field to DynamicField
   */
  private mapToDynamicField(field: any): DynamicField {
    return {
      id: field.id,
      fieldKey: field.fieldKey,
      name: field.name,
      dataType: field.dataType,
      fieldOrder: field.fieldOrder,
      description: field.description || undefined,
      isMandatory: field.isMandatory,
      isReadOnly: field.isReadOnly,
      defaultValue: field.defaultValue || undefined,
      validationRules: field.validationRules.map((rule: any) => ({
        ruleType: rule.ruleType,
        ruleValue: rule.ruleValue,
        errorMessage: rule.errorMessage,
      })),
      dropdownOptions: field.dropdownOptions.map((option: any) => ({
        label: option.label,
        value: option.value,
      })),
    };
  }

  /**
   * Helper: Get user permissions for data object
   */
  private async getUserPermissions(dataKey: string, userId: string) {
    const upperDataKey = dataKey.toUpperCase();

    // Get user's roles
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId, isActive: true },
      include: {
        role: {
          include: {
            rolePermissions: {
              where: { isActive: true },
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    // Collect all permissions from all roles
    const permissions = new Set<string>();
    for (const userRole of userRoles) {
      for (const rolePermission of userRole.role.rolePermissions) {
        permissions.add(rolePermission.permission.name);
      }
    }

    return {
      canRead: permissions.has(`${upperDataKey}:READ`),
      canWrite: permissions.has(`${upperDataKey}:WRITE`),
      canDelete: permissions.has(`${upperDataKey}:DELETE`),
    };
  }
}
