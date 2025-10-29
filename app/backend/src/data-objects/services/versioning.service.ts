import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { DataObjectVersionInfo, SchemaSnapshot } from '../entities/data-object.entity';

@Injectable()
export class VersioningService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all versions for a data object
   */
  async getVersionHistory(dataObjectId: string): Promise<DataObjectVersionInfo[]> {
    // Verify data object exists
    const dataObject = await this.prisma.dataObject.findUnique({
      where: { id: dataObjectId },
    });

    if (!dataObject) {
      throw new NotFoundException(`Data object with ID ${dataObjectId} not found`);
    }

    const versions = await this.prisma.dataObjectVersion.findMany({
      where: { dataObjectId },
      orderBy: { version: 'desc' },
    });

    return versions.map((v) => ({
      id: v.id,
      version: v.version,
      name: v.name,
      description: v.description || undefined,
      createdAt: v.createdAt,
      createdBy: v.createdBy,
      changes: this.generateChangeDescription(v.version),
    }));
  }

  /**
   * Get a specific version
   */
  async getVersion(dataObjectId: string, version: number) {
    const versionRecord = await this.prisma.dataObjectVersion.findUnique({
      where: {
        dataObjectId_version: {
          dataObjectId,
          version,
        },
      },
    });

    if (!versionRecord) {
      throw new NotFoundException(
        `Version ${version} not found for data object ${dataObjectId}`
      );
    }

    return {
      id: versionRecord.id,
      version: versionRecord.version,
      name: versionRecord.name,
      description: versionRecord.description,
      schemaSnapshot: versionRecord.schemaSnapshot as unknown as SchemaSnapshot,
      createdAt: versionRecord.createdAt,
      createdBy: versionRecord.createdBy,
    };
  }

  /**
   * Get current (latest) version number
   */
  async getCurrentVersion(dataObjectId: string): Promise<number> {
    const latestVersion = await this.prisma.dataObjectVersion.findFirst({
      where: { dataObjectId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    return latestVersion?.version || 1;
  }

  /**
   * Compare two versions
   */
  async compareVersions(dataObjectId: string, version1: number, version2: number) {
    const [v1, v2] = await Promise.all([
      this.getVersion(dataObjectId, version1),
      this.getVersion(dataObjectId, version2),
    ]);

    const snapshot1 = v1.schemaSnapshot;
    const snapshot2 = v2.schemaSnapshot;

    const changes = {
      nameChanged: snapshot1.name !== snapshot2.name,
      descriptionChanged: snapshot1.description !== snapshot2.description,
      fieldsAdded: this.getAddedFields(snapshot1, snapshot2),
      fieldsRemoved: this.getRemovedFields(snapshot1, snapshot2),
      fieldsModified: this.getModifiedFields(snapshot1, snapshot2),
    };

    return {
      version1: v1,
      version2: v2,
      changes,
    };
  }

  /**
   * Get schema at specific version
   */
  async getSchemaAtVersion(dataObjectId: string, version: number): Promise<SchemaSnapshot> {
    const versionRecord = await this.getVersion(dataObjectId, version);
    return versionRecord.schemaSnapshot;
  }

  /**
   * Helper: Generate change description
   */
  private generateChangeDescription(version: number): string {
    if (version === 1) {
      return 'Initial version created';
    }
    return `Version ${version} - Schema updated`;
  }

  /**
   * Helper: Get fields added between versions
   */
  private getAddedFields(snapshot1: SchemaSnapshot, snapshot2: SchemaSnapshot) {
    const fields1Ids = new Set(snapshot1.fields.map((f) => f.id));
    return snapshot2.fields.filter((f) => !fields1Ids.has(f.id));
  }

  /**
   * Helper: Get fields removed between versions
   */
  private getRemovedFields(snapshot1: SchemaSnapshot, snapshot2: SchemaSnapshot) {
    const fields2Ids = new Set(snapshot2.fields.map((f) => f.id));
    return snapshot1.fields.filter((f) => !fields2Ids.has(f.id));
  }

  /**
   * Helper: Get fields modified between versions
   */
  private getModifiedFields(snapshot1: SchemaSnapshot, snapshot2: SchemaSnapshot) {
    const modified: any[] = [];
    const fields2Map = new Map(snapshot2.fields.map((f) => [f.id, f]));

    for (const field1 of snapshot1.fields) {
      const field2 = fields2Map.get(field1.id);
      if (field2) {
        const changes: string[] = [];

        if (field1.name !== field2.name) changes.push('name');
        if (field1.dataType !== field2.dataType) changes.push('dataType');
        if (field1.isMandatory !== field2.isMandatory) changes.push('isMandatory');
        if (field1.isReadOnly !== field2.isReadOnly) changes.push('isReadOnly');
        if (field1.description !== field2.description) changes.push('description');
        if (field1.defaultValue !== field2.defaultValue) changes.push('defaultValue');

        if (changes.length > 0) {
          modified.push({
            fieldId: field1.id,
            fieldName: field1.name,
            changes,
            before: field1,
            after: field2,
          });
        }
      }
    }

    return modified;
  }
}
