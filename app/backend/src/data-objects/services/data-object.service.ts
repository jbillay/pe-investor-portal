import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateDataObjectDto } from '../dto/create-data-object.dto';
import { UpdateDataObjectDto } from '../dto/update-data-object.dto';
import {
  DataObjectWithFields,
  SchemaSnapshot,
} from '../entities/data-object.entity';

@Injectable()
export class DataObjectService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new data object with fields
   */
  async create(
    createDto: CreateDataObjectDto,
    userId: string,
  ): Promise<DataObjectWithFields> {
    // Generate dataKey from name if not provided
    const dataKey = createDto.dataKey || this.generateDataKey(createDto.name);

    // Check if dataKey already exists
    const existing = await this.prisma.dataObject.findUnique({
      where: { dataKey },
    });

    if (existing) {
      throw new ConflictException(
        `Data object with key '${dataKey}' already exists`,
      );
    }

    // Create data object with fields in a transaction
    return await this.prisma.$transaction(async (tx) => {
      // Create the data object
      const dataObject = await tx.dataObject.create({
        data: {
          name: createDto.name,
          description: createDto.description,
          dataKey,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      // Create fields if provided
      if (createDto.fields && createDto.fields.length > 0) {
        for (const fieldDto of createDto.fields) {
          const fieldKey =
            fieldDto.fieldKey || this.generateFieldKey(fieldDto.name);

          await tx.dataField.create({
            data: {
              dataObjectId: dataObject.id,
              name: fieldDto.name,
              fieldKey,
              dataType: fieldDto.dataType,
              fieldOrder: fieldDto.fieldOrder,
              description: fieldDto.description,
              isMandatory: fieldDto.isMandatory,
              isReadOnly: fieldDto.isReadOnly,
              defaultValue: fieldDto.defaultValue,
              relatedDataObjectId: fieldDto.relatedDataObjectId,
              createdBy: userId,
              updatedBy: userId,
              validationRules: fieldDto.validationRules
                ? {
                    create: fieldDto.validationRules.map((rule) => ({
                      ruleType: rule.ruleType,
                      ruleValue: rule.ruleValue,
                      errorMessage: rule.errorMessage,
                    })),
                  }
                : undefined,
              dropdownOptions: fieldDto.dropdownOptions
                ? {
                    create: fieldDto.dropdownOptions.map((option) => ({
                      label: option.label,
                      value: option.value,
                      orderIndex: option.orderIndex,
                    })),
                  }
                : undefined,
            },
          });
        }
      }

      // Create version 1 with schema snapshot
      const schemaSnapshot = await this.generateSchemaSnapshot(
        dataObject.id,
        tx,
      );
      await tx.dataObjectVersion.create({
        data: {
          dataObjectId: dataObject.id,
          version: 1,
          name: dataObject.name,
          description: dataObject.description,
          schemaSnapshot: schemaSnapshot as any,
          createdBy: userId,
        },
      });

      // Create permissions for this data object
      await this.createPermissions(dataKey, tx);

      // Return the complete data object with fields
      return (await tx.dataObject.findUnique({
        where: { id: dataObject.id },
        include: {
          fields: {
            include: {
              validationRules: true,
              dropdownOptions: true,
            },
            orderBy: { fieldOrder: 'asc' },
          },
        },
      })) as DataObjectWithFields;
    });
  }

  /**
   * Find all data objects
   */
  async findAll(): Promise<DataObjectWithFields[]> {
    return await this.prisma.dataObject.findMany({
      where: { isActive: true },
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
        _count: {
          select: {
            fields: { where: { isActive: true } },
            instances: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find one data object by ID
   */
  async findOne(id: string): Promise<DataObjectWithFields> {
    const dataObject = await this.prisma.dataObject.findUnique({
      where: { id },
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
        _count: {
          select: {
            fields: true,
            instances: true,
          },
        },
      },
    });

    if (!dataObject) {
      throw new NotFoundException(`Data object with ID ${id} not found`);
    }

    return dataObject as DataObjectWithFields;
  }

  /**
   * Find one data object by dataKey
   */
  async findByDataKey(dataKey: string): Promise<DataObjectWithFields> {
    const dataObject = await this.prisma.dataObject.findUnique({
      where: { dataKey },
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
      throw new NotFoundException(`Data object with key ${dataKey} not found`);
    }

    return dataObject as DataObjectWithFields;
  }

  /**
   * Update a data object (creates new version)
   */
  async update(
    id: string,
    updateDto: UpdateDataObjectDto,
    userId: string,
  ): Promise<DataObjectWithFields> {
    const existing = await this.findOne(id);

    return await this.prisma.$transaction(async (tx) => {
      // Update the data object
      const updated = await tx.dataObject.update({
        where: { id },
        data: {
          name: updateDto.name ?? existing.name,
          description: updateDto.description ?? existing.description,
          updatedBy: userId,
        },
      });

      // Get current version
      const latestVersion = await tx.dataObjectVersion.findFirst({
        where: { dataObjectId: id },
        orderBy: { version: 'desc' },
      });

      const newVersion = (latestVersion?.version || 0) + 1;

      // Create new version with updated schema snapshot
      const schemaSnapshot = await this.generateSchemaSnapshot(id, tx);
      await tx.dataObjectVersion.create({
        data: {
          dataObjectId: id,
          version: newVersion,
          name: updated.name,
          description: updated.description,
          schemaSnapshot: schemaSnapshot as any,
          createdBy: userId,
        },
      });

      return (await tx.dataObject.findUnique({
        where: { id },
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
      })) as DataObjectWithFields;
    });
  }

  /**
   * Delete a data object (soft delete)
   */
  async remove(id: string): Promise<void> {
    const dataObject = await this.findOne(id);

    // Check if there are any instances
    const instanceCount = await this.prisma.dataObjectInstance.count({
      where: { dataObjectId: id },
    });

    if (instanceCount > 0) {
      throw new BadRequestException(
        `Cannot delete data object with ${instanceCount} existing instances. Delete instances first.`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      // Soft delete the data object
      await tx.dataObject.update({
        where: { id },
        data: { isActive: false },
      });

      // Delete associated permissions
      await this.deletePermissions(dataObject.dataKey, tx);
    });
  }

  /**
   * Get version history for a data object
   */
  async getVersionHistory(id: string) {
    await this.findOne(id); // Verify exists

    return await this.prisma.dataObjectVersion.findMany({
      where: { dataObjectId: id },
      orderBy: { version: 'desc' },
    });
  }

  /**
   * Get specific version schema
   */
  async getVersion(id: string, version: number) {
    const versionRecord = await this.prisma.dataObjectVersion.findUnique({
      where: {
        dataObjectId_version: {
          dataObjectId: id,
          version,
        },
      },
    });

    if (!versionRecord) {
      throw new NotFoundException(
        `Version ${version} not found for data object ${id}`,
      );
    }

    return versionRecord;
  }

  /**
   * Helper: Generate dataKey from name
   */
  private generateDataKey(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  /**
   * Helper: Generate fieldKey from name
   */
  private generateFieldKey(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase())
      .replace(/^[A-Z]/, (char) => char.toLowerCase());
  }

  /**
   * Helper: Generate schema snapshot for versioning
   */
  private async generateSchemaSnapshot(
    dataObjectId: string,
    tx: any,
  ): Promise<SchemaSnapshot> {
    const dataObject = await tx.dataObject.findUnique({
      where: { id: dataObjectId },
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

    const latestVersion = await tx.dataObjectVersion.findFirst({
      where: { dataObjectId },
      orderBy: { version: 'desc' },
    });

    return {
      dataObjectId,
      dataKey: dataObject.dataKey,
      name: dataObject.name,
      description: dataObject.description,
      version: (latestVersion?.version || 0) + 1,
      fields: dataObject.fields.map((field: any) => ({
        id: field.id,
        name: field.name,
        fieldKey: field.fieldKey,
        dataType: field.dataType,
        fieldOrder: field.fieldOrder,
        description: field.description,
        isMandatory: field.isMandatory,
        isReadOnly: field.isReadOnly,
        defaultValue: field.defaultValue,
        relatedDataObjectId: field.relatedDataObjectId,
        validationRules: field.validationRules.map((rule: any) => ({
          ruleType: rule.ruleType,
          ruleValue: rule.ruleValue,
          errorMessage: rule.errorMessage,
        })),
        dropdownOptions: field.dropdownOptions.map((option: any) => ({
          label: option.label,
          value: option.value,
          orderIndex: option.orderIndex,
        })),
      })),
    };
  }

  /**
   * Helper: Create permissions for data object
   */
  private async createPermissions(dataKey: string, tx: any): Promise<void> {
    const upperDataKey = dataKey.toUpperCase();
    const permissions = [
      {
        name: `OBJ_${upperDataKey}:READ`,
        description: `View ${dataKey} instances`,
        resource: dataKey,
        action: 'READ',
      },
      {
        name: `OBJ_${upperDataKey}:WRITE`,
        description: `Create and edit ${dataKey} instances`,
        resource: dataKey,
        action: 'WRITE',
      },
      {
        name: `OBJ_${upperDataKey}:DELETE`,
        description: `Delete ${dataKey} instances`,
        resource: dataKey,
        action: 'DELETE',
      },
    ];

    for (const permission of permissions) {
      await tx.permission.upsert({
        where: { name: permission.name },
        update: {},
        create: permission,
      });
    }
  }

  /**
   * Helper: Delete permissions for data object
   */
  private async deletePermissions(dataKey: string, tx: any): Promise<void> {
    const upperDataKey = dataKey.toUpperCase();
    const permissionNames = [
      `OBJ_${upperDataKey}:READ`,
      `OBJ_${upperDataKey}:WRITE`,
      `OBJ_${upperDataKey}:DELETE`,
    ];

    // Delete role_permissions first (cascade delete)
    await tx.rolePermission.deleteMany({
      where: {
        permission: {
          name: {
            in: permissionNames,
          },
        },
      },
    });

    // Delete permissions
    await tx.permission.deleteMany({
      where: {
        name: {
          in: permissionNames,
        },
      },
    });
  }
}
