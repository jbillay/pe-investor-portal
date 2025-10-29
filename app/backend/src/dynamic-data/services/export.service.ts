import { Injectable } from '@nestjs/common';
import { SchemaService } from './schema.service';
import { InstanceService } from './instance.service';
import { DynamicSchema } from '../entities/instance.entity';
import { QueryParamsDto } from '../dto/query-params.dto';
import { FieldDataType } from '../../../generated/prisma';

@Injectable()
export class ExportService {
  constructor(
    private readonly schemaService: SchemaService,
    private readonly instanceService: InstanceService,
  ) {}

  /**
   * Export instances to CSV
   */
  async exportToCSV(dataKey: string, query: QueryParamsDto): Promise<string> {
    const schema = await this.schemaService.getSchema(dataKey);

    // Get all instances (ignoring pagination for export)
    const result = await this.instanceService.findAll(dataKey, {
      ...query,
      limit: 10000, // Max export limit
      page: 1,
    });

    // Generate CSV headers
    const headers = schema.fields.map((field) => field.name);
    const csvRows: string[] = [headers.join(',')];

    // Generate CSV rows
    for (const instance of result.items) {
      const row = schema.fields.map((field) => {
        const value = instance.values?.[field.fieldKey];
        return this.formatValueForCSV(value, field.dataType);
      });
      csvRows.push(row.join(','));
    }

    return csvRows.join('\n');
  }

  /**
   * Export instances to JSON (for Excel import)
   */
  async exportToJSON(dataKey: string, query: QueryParamsDto): Promise<any[]> {
    const schema = await this.schemaService.getSchema(dataKey);

    // Get all instances
    const result = await this.instanceService.findAll(dataKey, {
      ...query,
      limit: 10000,
      page: 1,
    });

    // Format for JSON
    return result.items.map((instance) => {
      const row: any = {
        id: instance.id,
        createdAt: instance.createdAt,
        updatedAt: instance.updatedAt,
      };

      for (const field of schema.fields) {
        row[field.name] = this.formatValueForJSON(
          instance.values?.[field.fieldKey],
          field.dataType,
        );
      }

      return row;
    });
  }

  /**
   * Helper: Format value for CSV
   */
  private formatValueForCSV(value: any, dataType: string): string {
    if (value === null || value === undefined) {
      return '';
    }

    switch (dataType) {
      case FieldDataType.TEXT:
      case FieldDataType.TEXTAREA:
      case FieldDataType.EMAIL:
      case FieldDataType.URL:
      case FieldDataType.SINGLE_SELECT:
        // Escape quotes and wrap in quotes if contains comma
        const strValue = String(value).replace(/"/g, '""');
        return strValue.includes(',') || strValue.includes('\n')
          ? `"${strValue}"`
          : strValue;

      case FieldDataType.NUMBER:
      case FieldDataType.CURRENCY:
        return String(value);

      case FieldDataType.DATE:
        return value instanceof Date
          ? value.toISOString().split('T')[0]
          : String(value);

      case FieldDataType.DATETIME:
        return value instanceof Date ? value.toISOString() : String(value);

      case FieldDataType.BOOLEAN:
        return value ? 'Yes' : 'No';

      case FieldDataType.MULTI_SELECT:
        return Array.isArray(value) ? value.join('; ') : String(value);

      case FieldDataType.RICH_TEXT:
        // Strip HTML tags for CSV
        return String(value).replace(/<[^>]*>/g, '');

      default:
        return String(value);
    }
  }

  /**
   * Helper: Format value for JSON
   */
  private formatValueForJSON(value: any, dataType: string): any {
    if (value === null || value === undefined) {
      return null;
    }

    switch (dataType) {
      case FieldDataType.DATE:
      case FieldDataType.DATETIME:
        return value instanceof Date ? value.toISOString() : value;

      case FieldDataType.NUMBER:
      case FieldDataType.CURRENCY:
        return Number(value);

      case FieldDataType.BOOLEAN:
        return Boolean(value);

      default:
        return value;
    }
  }
}
