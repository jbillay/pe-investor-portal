import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { InvestmentService } from '../services/investment.service';
import {
  CreateInvestmentDto,
  UpdateInvestmentDto,
  InvestmentResponseDto,
  InvestmentSummaryDto,
} from '../dto/investment.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/interfaces/auth.interface';

@ApiTags('Investments')
@ApiBearerAuth('JWT-auth')
@Controller('investments')
@UseGuards(JwtAuthGuard)
export class InvestmentController {
  constructor(private investmentService: InvestmentService) {}

  @ApiOperation({
    summary: 'Create new investment',
    description: 'Create a new investment commitment for the authenticated user.',
  })
  @ApiResponse({
    status: 201,
    description: 'Investment created successfully',
    type: InvestmentResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User already has investment in this fund' })
  @ApiNotFoundResponse({ description: 'Fund not found' })
  @ApiBody({ type: CreateInvestmentDto })
  @Post()
  async createInvestment(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createInvestmentDto: CreateInvestmentDto,
  ): Promise<InvestmentResponseDto> {
    return this.investmentService.createInvestment(user.id, createInvestmentDto);
  }

  @ApiOperation({
    summary: 'Get user investments',
    description: 'Retrieve all investments for the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Investments retrieved successfully',
    type: [InvestmentResponseDto],
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @Get()
  async getUserInvestments(@CurrentUser() user: AuthenticatedUser): Promise<InvestmentResponseDto[]> {
    return this.investmentService.getUserInvestments(user.id);
  }

  @ApiOperation({
    summary: 'Get investment summary',
    description: 'Get aggregated investment summary for the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Investment summary retrieved successfully',
    type: InvestmentSummaryDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @Get('summary')
  async getInvestmentSummary(@CurrentUser() user: AuthenticatedUser): Promise<InvestmentSummaryDto> {
    return this.investmentService.getInvestmentSummary(user.id);
  }

  @ApiOperation({
    summary: 'Get investment by ID',
    description: 'Retrieve detailed information about a specific investment.',
  })
  @ApiResponse({
    status: 200,
    description: 'Investment retrieved successfully',
    type: InvestmentResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiNotFoundResponse({ description: 'Investment not found' })
  @ApiParam({ name: 'id', description: 'Investment ID' })
  @Get(':id')
  async getInvestmentById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<InvestmentResponseDto> {
    return this.investmentService.getInvestmentById(user.id, id);
  }

  @ApiOperation({
    summary: 'Get investment performance',
    description: 'Get detailed performance metrics for a specific investment.',
  })
  @ApiResponse({
    status: 200,
    description: 'Investment performance retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        investment: { $ref: '#/components/schemas/InvestmentResponseDto' },
        valuations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              valuationDate: { type: 'string', format: 'date-time' },
              totalValue: { type: 'number' },
              irr: { type: 'number' },
              multiple: { type: 'number' },
            },
          },
        },
        performance: {
          type: 'object',
          properties: {
            totalReturn: { type: 'number' },
            totalReturnPercentage: { type: 'number' },
            irr: { type: 'number' },
            multiple: { type: 'number' },
            unrealizedGain: { type: 'number' },
            realizedGain: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiNotFoundResponse({ description: 'Investment not found' })
  @ApiParam({ name: 'id', description: 'Investment ID' })
  @Get(':id/performance')
  async getInvestmentPerformance(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.investmentService.getInvestmentPerformance(user.id, id);
  }

  @ApiOperation({
    summary: 'Update investment',
    description: 'Update investment details such as current value, IRR, and multiple.',
  })
  @ApiResponse({
    status: 200,
    description: 'Investment updated successfully',
    type: InvestmentResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiNotFoundResponse({ description: 'Investment not found' })
  @ApiParam({ name: 'id', description: 'Investment ID' })
  @ApiBody({ type: UpdateInvestmentDto })
  @Put(':id')
  async updateInvestment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() updateInvestmentDto: UpdateInvestmentDto,
  ): Promise<InvestmentResponseDto> {
    return this.investmentService.updateInvestment(user.id, id, updateInvestmentDto);
  }

  @ApiOperation({
    summary: 'Delete investment',
    description: 'Soft delete an investment (marks as inactive).',
  })
  @ApiResponse({
    status: 204,
    description: 'Investment deleted successfully',
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiNotFoundResponse({ description: 'Investment not found' })
  @ApiParam({ name: 'id', description: 'Investment ID' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteInvestment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<void> {
    return this.investmentService.deleteInvestment(user.id, id);
  }
}