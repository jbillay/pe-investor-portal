import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateFieldDto } from '../dto/create-data-object.dto';
import { UpdateFieldDto } from '../dto/update-field.dto';
import { DataFieldWithRelations } from '../entities/data-object.entity';

@Injectable()
export class FieldService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Add a field to a data object (creates new version)
   */
  async addField(
    dataObjectId: string,
    fieldDto: CreateFieldDto,
    userId: string
  ): Promise<DataFieldWithRelations> {
    // Verify data object exists
    const dataObject = await this.prisma.dataObject.findUnique({
      where: { id: dataObjectId },
    });

    if (!dataObject) {
      throw new NotFoundException(`Data object with ID ${dataObjectId} not found`);
    }

    // Generate fieldKey if not provided
    const fieldKey = fieldDto.fieldKey || this.generateFieldKey(fieldDto.name);

    // Check if fieldKey already exists for this data object
    const existing = await this.prisma.dataField.findUnique({
      where: {
        dataObjectId_fieldKey: {
          dataObjectId,
          fieldKey,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Field with key '${fieldKey}' already exists for this data object`
      );
    }

    return await this.prisma.$transaction(async (tx) => {
      // Create the field
      const field = await tx.dataField.create({
        data: {
          dataObjectId,
          name: fieldDto.name,
          fieldKey,
          dataType: fieldDto.dataType,
          fieldOrder: fieldDto.fieldOrder,
          description: fieldDto.description,
          isMandatory: fieldDto.isMandatory,
          isReadOnly: fieldDto.isReadOnly,
          defaultValue: fieldDto.defaultValue,
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
        include: {
          validationRules: true,
          dropdownOptions: {
            where: { isActive: true },
            orderBy: { orderIndex: 'asc' },
          },
        },
      });

      // Create new version
      await this.createNewVersion(dataObjectId, userId, tx);

      return field as DataFieldWithRelations;
    });
  }

  /**
   * Update a field (creates new version)
   */
  async updateField(
    dataObjectId: string,
    fieldId: string,
    updateDto: UpdateFieldDto,
    userId: string
  ): Promise<DataFieldWithRelations> {
    // Verify field exists and belongs to data object
    const field = await this.prisma.dataField.findFirst({
      where: {
        id: fieldId,
        dataObjectId,
      },
    });

    if (!field) {
      throw new NotFoundException(`Field with ID ${fieldId} not found for this data object`);
    }

    return await this.prisma.$transaction(async (tx) => {
      // Update the field
      const updated = await tx.dataField.update({
        where: { id: fieldId },
        data: {
          name: updateDto.name,
          dataType: updateDto.dataType,
          fieldOrder: updateDto.fieldOrder,
          description: updateDto.description,
          isMandatory: updateDto.isMandatory,
          isReadOnly: updateDto.isReadOnly,
          defaultValue: updateDto.defaultValue,
          updatedBy: userId,
        },
        include: {
          validationRules: true,
          dropdownOptions: {
            where: { isActive: true },
            orderBy: { orderIndex: 'asc' },
          },
        },
      });

      // Update validation rules if provided
      if (updateDto.validationRules) {
        // Delete existing rules
        await tx.fieldValidationRule.deleteMany({
          where: { fieldId },
        });

        // Create new rules
        await tx.fieldValidationRule.createMany({
          data: updateDto.validationRules.map((rule) => ({
            fieldId,
            ruleType: rule.ruleType,
            ruleValue: rule.ruleValue,
            errorMessage: rule.errorMessage,
          })),
        });
      }

      // Update dropdown options if provided
      if (updateDto.dropdownOptions) {
        // Delete existing options
        await tx.fieldDropdownOption.deleteMany({
          where: { fieldId },
        });

        // Create new options
        await tx.fieldDropdownOption.createMany({
          data: updateDto.dropdownOptions.map((option) => ({
            fieldId,
            label: option.label,
            value: option.value,
            orderIndex: option.orderIndex,
          })),
        });
      }

      // Create new version
      await this.createNewVersion(dataObjectId, userId, tx);

      // Return updated field with relations
      return await tx.dataField.findUnique({
        where: { id: fieldId },
        include: {
          validationRules: true,
          dropdownOptions: {
            where: { isActive: true },
            orderBy: { orderIndex: 'asc' },
          },
        },
      }) as DataFieldWithRelations;
    });
  }

  /**
   * Delete a field (creates new version)
   */
  async deleteField(
    dataObjectId: string,
    fieldId: string,
    userId: string
  ): Promise<void> {
    // Verify field exists and belongs to data object
    const field = await this.prisma.dataField.findFirst({
      where: {
        id: fieldId,
        dataObjectId,
      },
    });

    if (!field) {
      throw new NotFoundException(`Field with ID ${fieldId} not found for this data object`);
    }

    await this.prisma.$transaction(async (tx) => {
      // Soft delete the field
      await tx.dataField.update({
        where: { id: fieldId },
        data: { isActive: false, updatedBy: userId },
      });

      // Create new version
      await this.createNewVersion(dataObjectId, userId, tx);
    });
  }

  /**
   * Reorder fields
   */
  async reorderFields(
    dataObjectId: string,
    fieldOrders: Array<{ fieldId: string; order: number }>,
    userId: string
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      for (const { fieldId, order } of fieldOrders) {
        await tx.dataField.update({
          where: { id: fieldId },
          data: { fieldOrder: order, updatedBy: userId },
        });
      }

      // Create new version
      await this.createNewVersion(dataObjectId, userId, tx);
    });
  }

  /**
   * Helper: Generate fieldKey from name (camelCase)
   */
  private generateFieldKey(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase())
      .replace(/^[A-Z]/, (char) => char.toLowerCase());
  }

  /**
   * Helper: Create new version after field changes
   */
  private async createNewVersion(dataObjectId: string, userId: string, tx: any): Promise<void> {
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

    const newVersion = (latestVersion?.version || 0) + 1;

    const schemaSnapshot = {
      dataObjectId,
      dataKey: dataObject.dataKey,
      name: dataObject.name,
      description: dataObject.description,
      version: newVersion,
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

    await tx.dataObjectVersion.create({
      data: {
        dataObjectId,
        version: newVersion,
        name: dataObject.name,
        description: dataObject.description,
        schemaSnapshot: schemaSnapshot as any,
        createdBy: userId,
      },
    });
  }
}
