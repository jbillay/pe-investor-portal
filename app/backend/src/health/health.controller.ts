import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @ApiOperation({
    summary: 'Health check',
    description: 'Check if the API service is running and healthy',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2025-01-09T10:30:00.000Z' },
        service: { type: 'string', example: 'pe-investor-portal-api' },
        version: { type: 'string', example: '1.0.0' },
      },
    },
  })
  @Public()
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'pe-investor-portal-api',
      version: '1.0.0',
    };
  }
}
