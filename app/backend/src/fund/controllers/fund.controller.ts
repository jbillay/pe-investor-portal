import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
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
  ApiQuery,
  ApiBody,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { FundService } from '../services/fund.service';
import {
  CreateFundDto,
  UpdateFundDto,
  FundResponseDto,
  FundSummaryDto,
} from '../dto/fund.dto';
import { ParseCuidPipe } from '../../common/pipes/parse-cuid.pipe';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/interfaces/auth.interface';

@ApiTags('Funds')
@ApiBearerAuth('JWT-auth')
@Controller('funds')
@UseGuards(JwtAuthGuard)
export class FundController {
  constructor(private fundService: FundService) {}

  @ApiOperation({
    summary: 'Create new fund',
    description: 'Create a new investment fund (admin only).',
  })
  @ApiResponse({
    status: 201,
    description: 'Fund created successfully',
    type: FundResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiBody({ type: CreateFundDto })
  @Post()
  async createFund(@Body() createFundDto: CreateFundDto): Promise<FundResponseDto> {
    return this.fundService.createFund(createFundDto);
  }

  @ApiOperation({
    summary: 'Get all funds',
    description: 'Retrieve all available investment funds.',
  })
  @ApiResponse({
    status: 200,
    description: 'Funds retrieved successfully',
    type: [FundResponseDto],
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @Get()
  async getAllFunds(): Promise<FundResponseDto[]> {
    return this.fundService.getAllFunds();
  }

  @ApiOperation({
    summary: 'Get user funds',
    description: 'Retrieve funds where the authenticated user has investments.',
  })
  @ApiResponse({
    status: 200,
    description: 'User funds retrieved successfully',
    type: [FundResponseDto],
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @Get('my-funds')
  async getUserFunds(@CurrentUser() user: AuthenticatedUser): Promise<FundResponseDto[]> {
    return this.fundService.getFundsForUser(user.id);
  }

  @ApiOperation({
    summary: 'Get funds by type',
    description: 'Retrieve funds filtered by fund type.',
  })
  @ApiResponse({
    status: 200,
    description: 'Funds retrieved successfully',
    type: [FundResponseDto],
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiQuery({ name: 'type', description: 'Fund type', enum: ['PE', 'VC', 'GROWTH', 'REAL_ESTATE', 'INFRASTRUCTURE', 'DEBT'] })
  @Get('by-type')
  async getFundsByType(@Query('type') fundType: string): Promise<FundResponseDto[]> {
    return this.fundService.getFundsByType(fundType);
  }

  @ApiOperation({
    summary: 'Get funds by vintage',
    description: 'Retrieve funds filtered by vintage year.',
  })
  @ApiResponse({
    status: 200,
    description: 'Funds retrieved successfully',
    type: [FundResponseDto],
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiQuery({ name: 'vintage', description: 'Vintage year', type: 'number' })
  @Get('by-vintage')
  async getFundsByVintage(@Query('vintage') vintage: string): Promise<FundResponseDto[]> {
    return this.fundService.getFundsByVintage(parseInt(vintage));
  }

  @ApiOperation({
    summary: 'Get fund by ID',
    description: 'Retrieve detailed information about a specific fund.',
  })
  @ApiResponse({
    status: 200,
    description: 'Fund retrieved successfully',
    type: FundResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiNotFoundResponse({ description: 'Fund not found' })
  @ApiParam({ name: 'id', description: 'Fund ID (CUID format)', example: 'cljk0x5a10001qz6z9k8z9k8z' })
  @Get(':id')
  async getFundById(@Param('id', ParseCuidPipe) id: string): Promise<FundResponseDto> {
    return this.fundService.getFundById(id);
  }

  @ApiOperation({
    summary: 'Get fund summary',
    description: 'Get aggregated summary information for a specific fund.',
  })
  @ApiResponse({
    status: 200,
    description: 'Fund summary retrieved successfully',
    type: FundSummaryDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiNotFoundResponse({ description: 'Fund not found' })
  @ApiParam({ name: 'id', description: 'Fund ID (CUID format)', example: 'cljk0x5a10001qz6z9k8z9k8z' })
  @Get(':id/summary')
  async getFundSummary(@Param('id', ParseCuidPipe) id: string): Promise<FundSummaryDto> {
    return this.fundService.getFundSummary(id);
  }

  @ApiOperation({
    summary: 'Get fund performance',
    description: 'Get detailed performance metrics and history for a specific fund.',
  })
  @ApiResponse({
    status: 200,
    description: 'Fund performance retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        fund: { $ref: '#/components/schemas/FundResponseDto' },
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
        capitalCalls: { type: 'array' },
        distributions: { type: 'array' },
        performance: {
          type: 'object',
          properties: {
            currentNav: { type: 'number' },
            irr: { type: 'number' },
            multiple: { type: 'number' },
            totalCommitted: { type: 'number' },
            totalDrawn: { type: 'number' },
            totalDistributed: { type: 'number' },
            unrealizedValue: { type: 'number' },
            realizedValue: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiNotFoundResponse({ description: 'Fund not found' })
  @ApiParam({ name: 'id', description: 'Fund ID (CUID format)', example: 'cljk0x5a10001qz6z9k8z9k8z' })
  @Get(':id/performance')
  async getFundPerformance(@Param('id', ParseCuidPipe) id: string) {
    return this.fundService.getFundPerformance(id);
  }

  @ApiOperation({
    summary: 'Update fund',
    description: 'Update fund details (admin only).',
  })
  @ApiResponse({
    status: 200,
    description: 'Fund updated successfully',
    type: FundResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiNotFoundResponse({ description: 'Fund not found' })
  @ApiParam({ name: 'id', description: 'Fund ID (CUID format)', example: 'cljk0x5a10001qz6z9k8z9k8z' })
  @ApiBody({ type: UpdateFundDto })
  @Put(':id')
  async updateFund(
    @Param('id', ParseCuidPipe) id: string,
    @Body() updateFundDto: UpdateFundDto,
  ): Promise<FundResponseDto> {
    return this.fundService.updateFund(id, updateFundDto);
  }

  @ApiOperation({
    summary: 'Delete fund',
    description: 'Soft delete a fund (admin only).',
  })
  @ApiResponse({
    status: 204,
    description: 'Fund deleted successfully',
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiNotFoundResponse({ description: 'Fund not found' })
  @ApiParam({ name: 'id', description: 'Fund ID (CUID format)', example: 'cljk0x5a10001qz6z9k8z9k8z' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteFund(@Param('id', ParseCuidPipe) id: string): Promise<void> {
    return this.fundService.deleteFund(id);
  }
}