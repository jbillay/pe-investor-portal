import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SchemaService } from './schema.service';
import { InstanceWithValues, PaginatedInstances } from '../entities/instance.entity';
import { QueryParamsDto, SearchInstancesDto } from '../dto/query-params.dto';
import { FieldDataType, ChangeType } from '../../../generated/prisma';
import { Decimal } from '../../../generated/prisma/runtime/library';

@Injectable()
export class InstanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly schemaService: SchemaService,
  ) {}

  /**
   * Create a new instance
   */
  async create(
    dataKey: string,
    values: Record<string, any>,
    userId: string,
  ): Promise<InstanceWithValues> {
    const schema = await this.schemaService.getSchema(dataKey);

    return await this.prisma.$transaction(async (tx) => {
      // Create instance
      const instance = await tx.dataObjectInstance.create({
        data: {
          dataObjectId: schema.dataObjectId,
          versionNumber: schema.version,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      // Create field values
      for (const field of schema.fields) {
        const value = values[field.fieldKey];

        if (value !== undefined && value !== null) {
          await tx.instanceFieldValue.create({
            data: {
              instanceId: instance.id,
              fieldId: field.id,
              ...this.mapValueToStorage(field.dataType, value),
            },
          });
        }
      }

      // Log creation
      await tx.instanceChangeLog.create({
        data: {
          instanceId: instance.id,
          changeType: ChangeType.CREATE,
          newValue: JSON.stringify(values),
          changedBy: userId,
        },
      });

      // Return instance with values
      return await this.findOne(dataKey, instance.id, tx);
    });
  }

  /**
   * Find all instances with pagination and filtering
   */
  async findAll(
    dataKey: string,
    query: QueryParamsDto,
  ): Promise<PaginatedInstances<InstanceWithValues>> {
    const schema = await this.schemaService.getSchema(dataKey);
    const { page = 1, limit = 20, sortBy, sortOrder = 'asc', search, filters } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      dataObjectId: schema.dataObjectId,
      isActive: true,
    };

    // Global search across text fields
    if (search) {
      where.fieldValues = {
        some: {
          OR: schema.fields
            .filter((f) => f.dataType === FieldDataType.TEXT || f.dataType === FieldDataType.TEXTAREA)
            .map((f) => ({
              fieldId: f.id,
              textValue: { contains: search, mode: 'insensitive' },
            })),
        },
      };
    }

    // Count total
    const total = await this.prisma.dataObjectInstance.count({ where });

    // Fetch instances
    const instances = await this.prisma.dataObjectInstance.findMany({
      where,
      include: {
        fieldValues: {
          include: {
            field: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: sortOrder },
    });

    // Transform to include computed values
    const items = instances.map((instance) => this.transformInstance(instance, schema));

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Find one instance by ID
   */
  async findOne(
    dataKey: string,
    instanceId: string,
    tx?: any,
  ): Promise<InstanceWithValues> {
    const schema = await this.schemaService.getSchema(dataKey);
    const prismaClient = tx || this.prisma;

    const instance = await prismaClient.dataObjectInstance.findFirst({
      where: {
        id: instanceId,
        dataObjectId: schema.dataObjectId,
      },
      include: {
        fieldValues: {
          include: {
            field: true,
          },
        },
      },
    });

    if (!instance) {
      throw new NotFoundException(`Instance with ID ${instanceId} not found`);
    }

    return this.transformInstance(instance, schema);
  }

  /**
   * Update an instance
   */
  async update(
    dataKey: string,
    instanceId: string,
    values: Record<string, any>,
    userId: string,
  ): Promise<InstanceWithValues> {
    const schema = await this.schemaService.getSchema(dataKey);
    const existing = await this.findOne(dataKey, instanceId);

    return await this.prisma.$transaction(async (tx) => {
      // Update instance timestamp
      await tx.dataObjectInstance.update({
        where: { id: instanceId },
        data: { updatedBy: userId },
      });

      // Update field values
      for (const field of schema.fields) {
        const newValue = values[field.fieldKey];
        const oldValue = existing.values?.[field.fieldKey];

        if (newValue !== undefined) {
          // Check if field value exists
          const existingFieldValue = await tx.instanceFieldValue.findUnique({
            where: {
              instanceId_fieldId: {
                instanceId,
                fieldId: field.id,
              },
            },
          });

          if (existingFieldValue) {
            // Update existing value
            await tx.instanceFieldValue.update({
              where: { id: existingFieldValue.id },
              data: this.mapValueToStorage(field.dataType, newValue),
            });
          } else {
            // Create new value
            await tx.instanceFieldValue.create({
              data: {
                instanceId,
                fieldId: field.id,
                ...this.mapValueToStorage(field.dataType, newValue),
              },
            });
          }

          // Log change if value changed
          if (oldValue !== newValue) {
            await tx.instanceChangeLog.create({
              data: {
                instanceId,
                fieldId: field.id,
                changeType: ChangeType.UPDATE,
                oldValue: this.serializeValue(oldValue),
                newValue: this.serializeValue(newValue),
                changedBy: userId,
              },
            });
          }
        }
      }

      // Return updated instance
      return await this.findOne(dataKey, instanceId, tx);
    });
  }

  /**
   * Delete an instance
   */
  async remove(dataKey: string, instanceId: string, userId: string): Promise<void> {
    const schema = await this.schemaService.getSchema(dataKey);

    await this.prisma.$transaction(async (tx) => {
      const instance = await tx.dataObjectInstance.findFirst({
        where: {
          id: instanceId,
          dataObjectId: schema.dataObjectId,
        },
      });

      if (!instance) {
        throw new NotFoundException(`Instance with ID ${instanceId} not found`);
      }

      // Soft delete
      await tx.dataObjectInstance.update({
        where: { id: instanceId },
        data: { isActive: false, updatedBy: userId },
      });

      // Log deletion
      await tx.instanceChangeLog.create({
        data: {
          instanceId,
          changeType: ChangeType.DELETE,
          changedBy: userId,
        },
      });
    });
  }

  /**
   * Get change history for an instance
   */
  async getHistory(dataKey: string, instanceId: string) {
    const schema = await this.schemaService.getSchema(dataKey);

    const instance = await this.prisma.dataObjectInstance.findFirst({
      where: {
        id: instanceId,
        dataObjectId: schema.dataObjectId,
      },
    });

    if (!instance) {
      throw new NotFoundException(`Instance with ID ${instanceId} not found`);
    }

    return await this.prisma.instanceChangeLog.findMany({
      where: { instanceId },
      orderBy: { changedAt: 'desc' },
    });
  }

  /**
   * Helper: Map value to appropriate storage column
   */
  private mapValueToStorage(dataType: string, value: any): any {
    const result: any = {
      textValue: null,
      numberValue: null,
      dateValue: null,
      booleanValue: null,
      jsonValue: null,
    };

    switch (dataType) {
      case FieldDataType.TEXT:
      case FieldDataType.TEXTAREA:
      case FieldDataType.EMAIL:
      case FieldDataType.URL:
        result.textValue = value?.toString() || null;
        break;

      case FieldDataType.NUMBER:
        result.numberValue = value !== null ? new Decimal(value) : null;
        break;

      case FieldDataType.CURRENCY:
        result.numberValue = value !== null ? new Decimal(value) : null;
        result.jsonValue = { currency: 'USD' }; // Default currency
        break;

      case FieldDataType.DATE:
      case FieldDataType.DATETIME:
        result.dateValue = value ? new Date(value) : null;
        break;

      case FieldDataType.BOOLEAN:
        result.booleanValue = Boolean(value);
        break;

      case FieldDataType.SINGLE_SELECT:
        result.textValue = value?.toString() || null;
        break;

      case FieldDataType.MULTI_SELECT:
        result.jsonValue = Array.isArray(value) ? value : [value];
        break;

      case FieldDataType.FILE:
      case FieldDataType.RICH_TEXT:
      case FieldDataType.RELATIONSHIP:
        result.jsonValue = value;
        break;
    }

    return result;
  }

  /**
   * Helper: Extract value from storage
   */
  private extractValue(dataType: string, fieldValue: any): any {
    if (!fieldValue) return null;

    switch (dataType) {
      case FieldDataType.TEXT:
      case FieldDataType.TEXTAREA:
      case FieldDataType.EMAIL:
      case FieldDataType.URL:
      case FieldDataType.SINGLE_SELECT:
        return fieldValue.textValue;

      case FieldDataType.NUMBER:
        return fieldValue.numberValue ? Number(fieldValue.numberValue) : null;

      case FieldDataType.CURRENCY:
        return fieldValue.numberValue ? Number(fieldValue.numberValue) : null;

      case FieldDataType.DATE:
      case FieldDataType.DATETIME:
        return fieldValue.dateValue;

      case FieldDataType.BOOLEAN:
        return fieldValue.booleanValue;

      case FieldDataType.MULTI_SELECT:
      case FieldDataType.FILE:
      case FieldDataType.RICH_TEXT:
      case FieldDataType.RELATIONSHIP:
        return fieldValue.jsonValue;
    }

    return null;
  }

  /**
   * Helper: Transform instance to include computed values
   */
  private transformInstance(instance: any, schema: any): InstanceWithValues {
    const values: Record<string, any> = {};

    for (const field of schema.fields) {
      const fieldValue = instance.fieldValues.find((fv: any) => fv.fieldId === field.id);
      values[field.fieldKey] = this.extractValue(field.dataType, fieldValue);
    }

    return {
      ...instance,
      values,
    };
  }

  /**
   * Helper: Serialize value for logging
   */
  private serializeValue(value: any): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }
}
