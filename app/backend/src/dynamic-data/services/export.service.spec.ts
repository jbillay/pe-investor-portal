import { Test, TestingModule } from '@nestjs/testing';
import { ExportService } from './export.service';
import { SchemaService } from './schema.service';
import { InstanceService } from './instance.service';
import { FieldDataType } from '../../../generated/prisma';

describe('ExportService', () => {
  let service: ExportService;
  let schemaService: jest.Mocked<SchemaService>;
  let instanceService: jest.Mocked<InstanceService>;

  const mockSchema = {
    dataObjectId: 'obj-1',
    dataKey: 'test-data',
    name: 'Test Data',
    fields: [
      {
        id: 'field-1',
        name: 'Name',
        fieldKey: 'name',
        dataType: FieldDataType.TEXT,
      },
      {
        id: 'field-2',
        name: 'Age',
        fieldKey: 'age',
        dataType: FieldDataType.NUMBER,
      },
      {
        id: 'field-3',
        name: 'Email',
        fieldKey: 'email',
        dataType: FieldDataType.EMAIL,
      },
    ],
  };

  const mockSchemaService = {
    getSchema: jest.fn(),
  };

  const mockInstanceService = {
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportService,
        {
          provide: SchemaService,
          useValue: mockSchemaService,
        },
        {
          provide: InstanceService,
          useValue: mockInstanceService,
        },
      ],
    }).compile();

    service = module.get<ExportService>(ExportService);
    schemaService = module.get(SchemaService) as jest.Mocked<SchemaService>;
    instanceService = module.get(InstanceService) as jest.Mocked<InstanceService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('exportToCSV', () => {
    it('should export instances to CSV format', async () => {
      const mockInstances = {
        items: [
          {
            id: 'inst-1',
            values: {
              name: 'John Doe',
              age: 30,
              email: 'john@example.com',
            },
          },
          {
            id: 'inst-2',
            values: {
              name: 'Jane Smith',
              age: 25,
              email: 'jane@example.com',
            },
          },
        ],
        total: 2,
        page: 1,
        limit: 10000,
      };

      schemaService.getSchema.mockResolvedValue(mockSchema as any);
      instanceService.findAll.mockResolvedValue(mockInstances as any);

      const result = await service.exportToCSV('test-data', {});

      expect(result).toContain('Name,Age,Email');
      expect(result).toContain('John Doe,30,john@example.com');
      expect(result).toContain('Jane Smith,25,jane@example.com');
      expect(schemaService.getSchema).toHaveBeenCalledWith('test-data');
      expect(instanceService.findAll).toHaveBeenCalledWith('test-data', {
        limit: 10000,
        page: 1,
      });
    });

    it('should handle empty instances', async () => {
      const mockInstances = {
        items: [],
        total: 0,
        page: 1,
        limit: 10000,
      };

      schemaService.getSchema.mockResolvedValue(mockSchema as any);
      instanceService.findAll.mockResolvedValue(mockInstances as any);

      const result = await service.exportToCSV('test-data', {});

      expect(result).toBe('Name,Age,Email');
    });

    it('should escape commas in text values', async () => {
      const mockInstances = {
        items: [
          {
            id: 'inst-1',
            values: {
              name: 'Doe, John',
              age: 30,
              email: 'john@example.com',
            },
          },
        ],
        total: 1,
        page: 1,
        limit: 10000,
      };

      schemaService.getSchema.mockResolvedValue(mockSchema as any);
      instanceService.findAll.mockResolvedValue(mockInstances as any);

      const result = await service.exportToCSV('test-data', {});

      expect(result).toContain('"Doe, John"');
    });

    it('should escape quotes in text values', async () => {
      const mockInstances = {
        items: [
          {
            id: 'inst-1',
            values: {
              name: 'John "Johnny" Doe',
              age: 30,
              email: 'john@example.com',
            },
          },
        ],
        total: 1,
        page: 1,
        limit: 10000,
      };

      schemaService.getSchema.mockResolvedValue(mockSchema as any);
      instanceService.findAll.mockResolvedValue(mockInstances as any);

      const result = await service.exportToCSV('test-data', {});

      expect(result).toContain('John ""Johnny"" Doe');
    });

    it('should handle null and undefined values', async () => {
      const mockInstances = {
        items: [
          {
            id: 'inst-1',
            values: {
              name: null,
              age: undefined,
              email: 'john@example.com',
            },
          },
        ],
        total: 1,
        page: 1,
        limit: 10000,
      };

      schemaService.getSchema.mockResolvedValue(mockSchema as any);
      instanceService.findAll.mockResolvedValue(mockInstances as any);

      const result = await service.exportToCSV('test-data', {});

      expect(result).toContain(',,john@example.com');
    });

    it('should format boolean values as Yes/No', async () => {
      const schemaWithBoolean = {
        ...mockSchema,
        fields: [
          {
            id: 'field-1',
            name: 'Active',
            fieldKey: 'active',
            dataType: FieldDataType.BOOLEAN,
          },
        ],
      };

      const mockInstances = {
        items: [
          { id: 'inst-1', values: { active: true } },
          { id: 'inst-2', values: { active: false } },
        ],
        total: 2,
        page: 1,
        limit: 10000,
      };

      schemaService.getSchema.mockResolvedValue(schemaWithBoolean as any);
      instanceService.findAll.mockResolvedValue(mockInstances as any);

      const result = await service.exportToCSV('test-data', {});

      expect(result).toContain('Yes');
      expect(result).toContain('No');
    });

    it('should format DATE values as ISO date string', async () => {
      const schemaWithDate = {
        ...mockSchema,
        fields: [
          {
            id: 'field-1',
            name: 'Birth Date',
            fieldKey: 'birthDate',
            dataType: FieldDataType.DATE,
          },
        ],
      };

      const testDate = new Date('2024-01-15T10:30:00Z');
      const mockInstances = {
        items: [{ id: 'inst-1', values: { birthDate: testDate } }],
        total: 1,
        page: 1,
        limit: 10000,
      };

      schemaService.getSchema.mockResolvedValue(schemaWithDate as any);
      instanceService.findAll.mockResolvedValue(mockInstances as any);

      const result = await service.exportToCSV('test-data', {});

      expect(result).toContain('2024-01-15');
    });

    it('should format DATETIME values as ISO string', async () => {
      const schemaWithDatetime = {
        ...mockSchema,
        fields: [
          {
            id: 'field-1',
            name: 'Created At',
            fieldKey: 'createdAt',
            dataType: FieldDataType.DATETIME,
          },
        ],
      };

      const testDate = new Date('2024-01-15T10:30:00Z');
      const mockInstances = {
        items: [{ id: 'inst-1', values: { createdAt: testDate } }],
        total: 1,
        page: 1,
        limit: 10000,
      };

      schemaService.getSchema.mockResolvedValue(schemaWithDatetime as any);
      instanceService.findAll.mockResolvedValue(mockInstances as any);

      const result = await service.exportToCSV('test-data', {});

      expect(result).toContain('2024-01-15T10:30:00.000Z');
    });

    it('should format MULTI_SELECT as semicolon-separated values', async () => {
      const schemaWithMultiSelect = {
        ...mockSchema,
        fields: [
          {
            id: 'field-1',
            name: 'Tags',
            fieldKey: 'tags',
            dataType: FieldDataType.MULTI_SELECT,
          },
        ],
      };

      const mockInstances = {
        items: [{ id: 'inst-1', values: { tags: ['tag1', 'tag2', 'tag3'] } }],
        total: 1,
        page: 1,
        limit: 10000,
      };

      schemaService.getSchema.mockResolvedValue(schemaWithMultiSelect as any);
      instanceService.findAll.mockResolvedValue(mockInstances as any);

      const result = await service.exportToCSV('test-data', {});

      expect(result).toContain('tag1; tag2; tag3');
    });

    it('should strip HTML tags from RICH_TEXT', async () => {
      const schemaWithRichText = {
        ...mockSchema,
        fields: [
          {
            id: 'field-1',
            name: 'Description',
            fieldKey: 'description',
            dataType: FieldDataType.RICH_TEXT,
          },
        ],
      };

      const mockInstances = {
        items: [
          {
            id: 'inst-1',
            values: { description: '<p>Hello <strong>world</strong></p>' },
          },
        ],
        total: 1,
        page: 1,
        limit: 10000,
      };

      schemaService.getSchema.mockResolvedValue(schemaWithRichText as any);
      instanceService.findAll.mockResolvedValue(mockInstances as any);

      const result = await service.exportToCSV('test-data', {});

      expect(result).toContain('Hello world');
      expect(result).not.toContain('<p>');
      expect(result).not.toContain('<strong>');
    });

    it('should handle CURRENCY data type', async () => {
      const schemaWithCurrency = {
        ...mockSchema,
        fields: [
          {
            id: 'field-1',
            name: 'Price',
            fieldKey: 'price',
            dataType: FieldDataType.CURRENCY,
          },
        ],
      };

      const mockInstances = {
        items: [{ id: 'inst-1', values: { price: 99.99 } }],
        total: 1,
        page: 1,
        limit: 10000,
      };

      schemaService.getSchema.mockResolvedValue(schemaWithCurrency as any);
      instanceService.findAll.mockResolvedValue(mockInstances as any);

      const result = await service.exportToCSV('test-data', {});

      expect(result).toContain('99.99');
    });

    it('should handle query parameters', async () => {
      const mockInstances = {
        items: [],
        total: 0,
        page: 1,
        limit: 10000,
      };

      schemaService.getSchema.mockResolvedValue(mockSchema as any);
      instanceService.findAll.mockResolvedValue(mockInstances as any);

      const query = { filter: { status: 'active' }, sort: 'name' };
      await service.exportToCSV('test-data', query);

      expect(instanceService.findAll).toHaveBeenCalledWith('test-data', {
        ...query,
        limit: 10000,
        page: 1,
      });
    });
  });

  describe('exportToJSON', () => {
    it('should export instances to JSON format', async () => {
      const mockInstances = {
        items: [
          {
            id: 'inst-1',
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-02'),
            values: {
              name: 'John Doe',
              age: 30,
              email: 'john@example.com',
            },
          },
          {
            id: 'inst-2',
            createdAt: new Date('2024-01-03'),
            updatedAt: new Date('2024-01-04'),
            values: {
              name: 'Jane Smith',
              age: 25,
              email: 'jane@example.com',
            },
          },
        ],
        total: 2,
        page: 1,
        limit: 10000,
      };

      schemaService.getSchema.mockResolvedValue(mockSchema as any);
      instanceService.findAll.mockResolvedValue(mockInstances as any);

      const result = await service.exportToJSON('test-data', {});

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'inst-1',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        Name: 'John Doe',
        Age: 30,
        Email: 'john@example.com',
      });
    });

    it('should handle empty instances', async () => {
      const mockInstances = {
        items: [],
        total: 0,
        page: 1,
        limit: 10000,
      };

      schemaService.getSchema.mockResolvedValue(mockSchema as any);
      instanceService.findAll.mockResolvedValue(mockInstances as any);

      const result = await service.exportToJSON('test-data', {});

      expect(result).toEqual([]);
    });

    it('should format null values as null in JSON', async () => {
      const mockInstances = {
        items: [
          {
            id: 'inst-1',
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-02'),
            values: {
              name: null,
              age: undefined,
              email: 'john@example.com',
            },
          },
        ],
        total: 1,
        page: 1,
        limit: 10000,
      };

      schemaService.getSchema.mockResolvedValue(mockSchema as any);
      instanceService.findAll.mockResolvedValue(mockInstances as any);

      const result = await service.exportToJSON('test-data', {});

      expect(result[0].Name).toBeNull();
      expect(result[0].Age).toBeNull();
    });

    it('should format DATE values as ISO string in JSON', async () => {
      const schemaWithDate = {
        ...mockSchema,
        fields: [
          {
            id: 'field-1',
            name: 'Birth Date',
            fieldKey: 'birthDate',
            dataType: FieldDataType.DATE,
          },
        ],
      };

      const testDate = new Date('2024-01-15T10:30:00Z');
      const mockInstances = {
        items: [
          {
            id: 'inst-1',
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-02'),
            values: { birthDate: testDate },
          },
        ],
        total: 1,
        page: 1,
        limit: 10000,
      };

      schemaService.getSchema.mockResolvedValue(schemaWithDate as any);
      instanceService.findAll.mockResolvedValue(mockInstances as any);

      const result = await service.exportToJSON('test-data', {});

      expect(result[0]['Birth Date']).toBe('2024-01-15T10:30:00.000Z');
    });

    it('should format NUMBER values as numbers in JSON', async () => {
      const schemaWithNumber = {
        ...mockSchema,
        fields: [
          {
            id: 'field-1',
            name: 'Count',
            fieldKey: 'count',
            dataType: FieldDataType.NUMBER,
          },
        ],
      };

      const mockInstances = {
        items: [
          {
            id: 'inst-1',
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-02'),
            values: { count: '42' },
          },
        ],
        total: 1,
        page: 1,
        limit: 10000,
      };

      schemaService.getSchema.mockResolvedValue(schemaWithNumber as any);
      instanceService.findAll.mockResolvedValue(mockInstances as any);

      const result = await service.exportToJSON('test-data', {});

      expect(result[0].Count).toBe(42);
      expect(typeof result[0].Count).toBe('number');
    });

    it('should format BOOLEAN values as booleans in JSON', async () => {
      const schemaWithBoolean = {
        ...mockSchema,
        fields: [
          {
            id: 'field-1',
            name: 'Active',
            fieldKey: 'active',
            dataType: FieldDataType.BOOLEAN,
          },
        ],
      };

      const mockInstances = {
        items: [
          {
            id: 'inst-1',
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-02'),
            values: { active: 1 },
          },
        ],
        total: 1,
        page: 1,
        limit: 10000,
      };

      schemaService.getSchema.mockResolvedValue(schemaWithBoolean as any);
      instanceService.findAll.mockResolvedValue(mockInstances as any);

      const result = await service.exportToJSON('test-data', {});

      expect(result[0].Active).toBe(true);
      expect(typeof result[0].Active).toBe('boolean');
    });

    it('should preserve other data types as-is in JSON', async () => {
      const schemaWithText = {
        ...mockSchema,
        fields: [
          {
            id: 'field-1',
            name: 'Description',
            fieldKey: 'description',
            dataType: FieldDataType.TEXT,
          },
        ],
      };

      const mockInstances = {
        items: [
          {
            id: 'inst-1',
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-02'),
            values: { description: 'This is a test' },
          },
        ],
        total: 1,
        page: 1,
        limit: 10000,
      };

      schemaService.getSchema.mockResolvedValue(schemaWithText as any);
      instanceService.findAll.mockResolvedValue(mockInstances as any);

      const result = await service.exportToJSON('test-data', {});

      expect(result[0].Description).toBe('This is a test');
    });

    it('should handle query parameters', async () => {
      const mockInstances = {
        items: [],
        total: 0,
        page: 1,
        limit: 10000,
      };

      schemaService.getSchema.mockResolvedValue(mockSchema as any);
      instanceService.findAll.mockResolvedValue(mockInstances as any);

      const query = { filter: { status: 'active' }, sort: 'name' };
      await service.exportToJSON('test-data', query);

      expect(instanceService.findAll).toHaveBeenCalledWith('test-data', {
        ...query,
        limit: 10000,
        page: 1,
      });
    });
  });
});
