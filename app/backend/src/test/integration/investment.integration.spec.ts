import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';
import { InvestmentModule } from '../../investment/investment.module';
import { AuthModule } from '../../auth/auth.module';
import { FundModule } from '../../fund/fund.module';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TestDataGenerator, ValidationHelper } from '../utils/test-utils';

describe('Investment Integration Tests', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let authTokens: any;
  let testUser: any;
  let testFund: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        PrismaModule,
        AuthModule,
        FundModule,
        InvestmentModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    await app.init();
  });

  afterAll(async () => {
    await prismaService.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await prismaService.investment.deleteMany({});
    await prismaService.fund.deleteMany({});
    await prismaService.refreshToken.deleteMany({});
    await prismaService.user.deleteMany({});

    // Create test user and authenticate
    const registerDto = {
      email: ValidationHelper.generateValidEmail(),
      password: ValidationHelper.generateValidPassword(),
      firstName: 'John',
      lastName: 'Doe',
    };

    const authResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send(registerDto);

    authTokens = authResponse.body;
    testUser = authResponse.body.user;

    // Create test fund
    const fundDto = {
      name: 'Test PE Fund',
      description: 'A test private equity fund',
      fundType: 'PE',
      vintage: 2024,
      targetSize: 100000000,
      commitedSize: 85000000,
      currency: 'USD',
      managementFee: 0.02,
      carriedInterest: 0.20,
    };

    const fundResponse = await request(app.getHttpServer())
      .post('/funds')
      .set('Authorization', `Bearer ${authTokens.accessToken}`)
      .send(fundDto);

    testFund = fundResponse.body;
  });

  describe('POST /investments', () => {
    it('should create an investment successfully', async () => {
      const createInvestmentDto = {
        fundId: testFund.id,
        commitmentAmount: 1000000,
        investmentDate: '2024-01-15',
        drawnAmount: 0,
        distributedAmount: 0,
        currentValue: 1000000,
        status: 'ACTIVE',
      };

      const response = await request(app.getHttpServer())
        .post('/investments')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .send(createInvestmentDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.userId).toBe(testUser.id);
      expect(response.body.fundId).toBe(testFund.id);
      expect(response.body.commitmentAmount).toBe(1000000);
      expect(response.body.status).toBe('ACTIVE');
      expect(response.body.fund).toBeDefined();
      expect(response.body.fund.name).toBe(testFund.name);
    });

    it('should reject investment with invalid fund ID', async () => {
      const createInvestmentDto = {
        fundId: ValidationHelper.generateValidUUID(),
        commitmentAmount: 1000000,
        investmentDate: '2024-01-15',
        drawnAmount: 0,
        distributedAmount: 0,
        currentValue: 1000000,
        status: 'ACTIVE',
      };

      await request(app.getHttpServer())
        .post('/investments')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .send(createInvestmentDto)
        .expect(404);
    });

    it('should reject duplicate investment in same fund', async () => {
      const createInvestmentDto = {
        fundId: testFund.id,
        commitmentAmount: 1000000,
        investmentDate: '2024-01-15',
        drawnAmount: 0,
        distributedAmount: 0,
        currentValue: 1000000,
        status: 'ACTIVE',
      };

      // First investment
      await request(app.getHttpServer())
        .post('/investments')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .send(createInvestmentDto)
        .expect(201);

      // Duplicate investment
      await request(app.getHttpServer())
        .post('/investments')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .send(createInvestmentDto)
        .expect(403);
    });

    it('should reject investment without authorization', async () => {
      const createInvestmentDto = {
        fundId: testFund.id,
        commitmentAmount: 1000000,
        investmentDate: '2024-01-15',
        drawnAmount: 0,
        distributedAmount: 0,
        currentValue: 1000000,
        status: 'ACTIVE',
      };

      await request(app.getHttpServer())
        .post('/investments')
        .send(createInvestmentDto)
        .expect(401);
    });
  });

  describe('GET /investments', () => {
    let testInvestment: any;

    beforeEach(async () => {
      const createInvestmentDto = {
        fundId: testFund.id,
        commitmentAmount: 1000000,
        investmentDate: '2024-01-15',
        drawnAmount: 250000,
        distributedAmount: 50000,
        currentValue: 1200000,
        status: 'ACTIVE',
      };

      const response = await request(app.getHttpServer())
        .post('/investments')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .send(createInvestmentDto);

      testInvestment = response.body;
    });

    it('should get user investments successfully', async () => {
      const response = await request(app.getHttpServer())
        .get('/investments')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe(testInvestment.id);
      expect(response.body[0].fund).toBeDefined();
    });

    it('should return empty array for new user', async () => {
      // Create new user
      const newUserDto = {
        email: ValidationHelper.generateValidEmail(),
        password: ValidationHelper.generateValidPassword(),
        firstName: 'Jane',
        lastName: 'Smith',
      };

      const newAuthResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send(newUserDto);

      const response = await request(app.getHttpServer())
        .get('/investments')
        .set('Authorization', `Bearer ${newAuthResponse.body.accessToken}`)
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should reject request without authorization', async () => {
      await request(app.getHttpServer())
        .get('/investments')
        .expect(401);
    });
  });

  describe('GET /investments/:id', () => {
    let testInvestment: any;

    beforeEach(async () => {
      const createInvestmentDto = {
        fundId: testFund.id,
        commitmentAmount: 1000000,
        investmentDate: '2024-01-15',
        drawnAmount: 250000,
        distributedAmount: 50000,
        currentValue: 1200000,
        status: 'ACTIVE',
      };

      const response = await request(app.getHttpServer())
        .post('/investments')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .send(createInvestmentDto);

      testInvestment = response.body;
    });

    it('should get investment by ID successfully', async () => {
      const response = await request(app.getHttpServer())
        .get(`/investments/${testInvestment.id}`)
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .expect(200);

      expect(response.body.id).toBe(testInvestment.id);
      expect(response.body.commitmentAmount).toBe(1000000);
      expect(response.body.fund).toBeDefined();
      expect(response.body.fund.name).toBe(testFund.name);
    });

    it('should reject request for non-existent investment', async () => {
      await request(app.getHttpServer())
        .get(`/investments/${ValidationHelper.generateValidUUID()}`)
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .expect(404);
    });

    it('should reject access to other user\'s investment', async () => {
      // Create second user
      const newUserDto = {
        email: ValidationHelper.generateValidEmail(),
        password: ValidationHelper.generateValidPassword(),
        firstName: 'Jane',
        lastName: 'Smith',
      };

      const newAuthResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send(newUserDto);

      await request(app.getHttpServer())
        .get(`/investments/${testInvestment.id}`)
        .set('Authorization', `Bearer ${newAuthResponse.body.accessToken}`)
        .expect(404);
    });
  });

  describe('PUT /investments/:id', () => {
    let testInvestment: any;

    beforeEach(async () => {
      const createInvestmentDto = {
        fundId: testFund.id,
        commitmentAmount: 1000000,
        investmentDate: '2024-01-15',
        drawnAmount: 250000,
        distributedAmount: 50000,
        currentValue: 1200000,
        status: 'ACTIVE',
      };

      const response = await request(app.getHttpServer())
        .post('/investments')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .send(createInvestmentDto);

      testInvestment = response.body;
    });

    it('should update investment successfully', async () => {
      const updateDto = {
        drawnAmount: 400000,
        currentValue: 1500000,
        irr: 0.15,
      };

      const response = await request(app.getHttpServer())
        .put(`/investments/${testInvestment.id}`)
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.drawnAmount).toBe(400000);
      expect(response.body.currentValue).toBe(1500000);
      expect(response.body.irr).toBe(0.15);
    });

    it('should reject update for non-existent investment', async () => {
      const updateDto = {
        drawnAmount: 400000,
        currentValue: 1500000,
      };

      await request(app.getHttpServer())
        .put(`/investments/${ValidationHelper.generateValidUUID()}`)
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .send(updateDto)
        .expect(404);
    });
  });

  describe('DELETE /investments/:id', () => {
    let testInvestment: any;

    beforeEach(async () => {
      const createInvestmentDto = {
        fundId: testFund.id,
        commitmentAmount: 1000000,
        investmentDate: '2024-01-15',
        drawnAmount: 250000,
        distributedAmount: 50000,
        currentValue: 1200000,
        status: 'ACTIVE',
      };

      const response = await request(app.getHttpServer())
        .post('/investments')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .send(createInvestmentDto);

      testInvestment = response.body;
    });

    it('should soft delete investment successfully', async () => {
      await request(app.getHttpServer())
        .delete(`/investments/${testInvestment.id}`)
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .expect(204);

      // Verify investment is no longer accessible
      await request(app.getHttpServer())
        .get(`/investments/${testInvestment.id}`)
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .expect(404);
    });

    it('should reject delete for non-existent investment', async () => {
      await request(app.getHttpServer())
        .delete(`/investments/${ValidationHelper.generateValidUUID()}`)
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .expect(404);
    });
  });

  describe('GET /investments/summary', () => {
    beforeEach(async () => {
      // Create multiple investments for comprehensive summary
      const investments = [
        {
          fundId: testFund.id,
          commitmentAmount: 1000000,
          investmentDate: '2024-01-15',
          drawnAmount: 250000,
          distributedAmount: 50000,
          currentValue: 1200000,
          status: 'ACTIVE',
        },
      ];

      for (const investment of investments) {
        await request(app.getHttpServer())
          .post('/investments')
          .set('Authorization', `Bearer ${authTokens.accessToken}`)
          .send(investment);
      }
    });

    it('should get investment summary successfully', async () => {
      const response = await request(app.getHttpServer())
        .get('/investments/summary')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalInvestments');
      expect(response.body).toHaveProperty('totalCommitted');
      expect(response.body).toHaveProperty('totalDrawn');
      expect(response.body).toHaveProperty('totalDistributed');
      expect(response.body).toHaveProperty('totalCurrentValue');
      expect(response.body).toHaveProperty('overallIrr');
      expect(response.body).toHaveProperty('overallMultiple');
      expect(response.body).toHaveProperty('unfundedCommitment');

      expect(response.body.totalInvestments).toBeGreaterThan(0);
      expect(response.body.totalCommitted).toBeGreaterThan(0);
    });

    it('should return zero values for new user', async () => {
      const newUserDto = {
        email: ValidationHelper.generateValidEmail(),
        password: ValidationHelper.generateValidPassword(),
        firstName: 'Jane',
        lastName: 'Smith',
      };

      const newAuthResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send(newUserDto);

      const response = await request(app.getHttpServer())
        .get('/investments/summary')
        .set('Authorization', `Bearer ${newAuthResponse.body.accessToken}`)
        .expect(200);

      expect(response.body.totalInvestments).toBe(0);
      expect(response.body.totalCommitted).toBe(0);
      expect(response.body.totalDrawn).toBe(0);
    });
  });

  describe('GET /investments/:id/performance', () => {
    let testInvestment: any;

    beforeEach(async () => {
      const createInvestmentDto = {
        fundId: testFund.id,
        commitmentAmount: 1000000,
        investmentDate: '2024-01-15',
        drawnAmount: 250000,
        distributedAmount: 50000,
        currentValue: 1200000,
        status: 'ACTIVE',
      };

      const response = await request(app.getHttpServer())
        .post('/investments')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .send(createInvestmentDto);

      testInvestment = response.body;
    });

    it('should get investment performance successfully', async () => {
      const response = await request(app.getHttpServer())
        .get(`/investments/${testInvestment.id}/performance`)
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('investment');
      expect(response.body).toHaveProperty('valuations');
      expect(response.body).toHaveProperty('performance');
      expect(response.body.investment.id).toBe(testInvestment.id);
      expect(response.body.performance).toHaveProperty('totalReturn');
      expect(response.body.performance).toHaveProperty('totalReturnPercentage');
      expect(response.body.performance).toHaveProperty('irr');
      expect(response.body.performance).toHaveProperty('multiple');
    });

    it('should reject performance request for non-existent investment', async () => {
      await request(app.getHttpServer())
        .get(`/investments/${ValidationHelper.generateValidUUID()}/performance`)
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .expect(404);
    });
  });

  describe('Data validation and business rules', () => {
    it('should validate commitment amount is positive', async () => {
      const createInvestmentDto = {
        fundId: testFund.id,
        commitmentAmount: -1000000,
        investmentDate: '2024-01-15',
        drawnAmount: 0,
        distributedAmount: 0,
        currentValue: 1000000,
        status: 'ACTIVE',
      };

      await request(app.getHttpServer())
        .post('/investments')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .send(createInvestmentDto)
        .expect(400);
    });

    it('should validate drawn amount does not exceed commitment', async () => {
      const createInvestmentDto = {
        fundId: testFund.id,
        commitmentAmount: 1000000,
        investmentDate: '2024-01-15',
        drawnAmount: 1500000, // Exceeds commitment
        distributedAmount: 0,
        currentValue: 1000000,
        status: 'ACTIVE',
      };

      await request(app.getHttpServer())
        .post('/investments')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .send(createInvestmentDto)
        .expect(400);
    });

    it('should validate investment date format', async () => {
      const createInvestmentDto = {
        fundId: testFund.id,
        commitmentAmount: 1000000,
        investmentDate: 'invalid-date',
        drawnAmount: 0,
        distributedAmount: 0,
        currentValue: 1000000,
        status: 'ACTIVE',
      };

      await request(app.getHttpServer())
        .post('/investments')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .send(createInvestmentDto)
        .expect(400);
    });
  });
});