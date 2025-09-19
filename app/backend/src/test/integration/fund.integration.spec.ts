import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';
import { FundModule } from '../../fund/fund.module';
import { AuthModule } from '../../auth/auth.module';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TestDataGenerator, ValidationHelper } from '../utils/test-utils';

describe('Fund Integration Tests', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let authTokens: any;
  let testUser: any;

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
  });

  describe('POST /funds', () => {
    it('should create a fund successfully', async () => {
      const createFundDto = {
        name: 'Test PE Fund',
        description: 'A test private equity fund',
        fundType: 'PE',
        vintage: 2024,
        targetSize: 100000000,
        commitedSize: 85000000,
        currency: 'USD',
        closeDate: '2024-01-15',
        finalClose: '2024-06-15',
        liquidationDate: '2034-01-15',
        managementFee: 0.02,
        carriedInterest: 0.20,
      };

      const response = await request(app.getHttpServer())
        .post('/funds')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .send(createFundDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(createFundDto.name);
      expect(response.body.fundType).toBe(createFundDto.fundType);
      expect(response.body.vintage).toBe(createFundDto.vintage);
      expect(response.body.targetSize).toBe(createFundDto.targetSize);
      expect(response.body.commitedSize).toBe(createFundDto.commitedSize);
      expect(response.body.currency).toBe(createFundDto.currency);
      expect(response.body.managementFee).toBe(createFundDto.managementFee);
      expect(response.body.carriedInterest).toBe(createFundDto.carriedInterest);
      expect(response.body.isActive).toBe(true);
    });

    it('should reject fund creation without authorization', async () => {
      const createFundDto = {
        name: 'Test PE Fund',
        fundType: 'PE',
        vintage: 2024,
        targetSize: 100000000,
        commitedSize: 85000000,
        currency: 'USD',
      };

      await request(app.getHttpServer())
        .post('/funds')
        .send(createFundDto)
        .expect(401);
    });

    it('should validate required fields', async () => {
      const invalidFundDto = {
        name: 'Test Fund',
        // Missing required fields
      };

      await request(app.getHttpServer())
        .post('/funds')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .send(invalidFundDto)
        .expect(400);
    });

    it('should validate fund type enum', async () => {
      const invalidFundDto = {
        name: 'Test Fund',
        fundType: 'INVALID_TYPE',
        vintage: 2024,
        targetSize: 100000000,
        commitedSize: 85000000,
      };

      await request(app.getHttpServer())
        .post('/funds')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .send(invalidFundDto)
        .expect(400);
    });
  });

  describe('GET /funds', () => {
    let testFund: any;

    beforeEach(async () => {
      const createFundDto = {
        name: 'Test PE Fund',
        description: 'A test private equity fund',
        fundType: 'PE',
        vintage: 2024,
        targetSize: 100000000,
        commitedSize: 85000000,
        currency: 'USD',
      };

      const response = await request(app.getHttpServer())
        .post('/funds')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .send(createFundDto);

      testFund = response.body;
    });

    it('should get all funds successfully', async () => {
      const response = await request(app.getHttpServer())
        .get('/funds')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe(testFund.id);
      expect(response.body[0].name).toBe(testFund.name);
    });

    it('should return empty array when no funds exist', async () => {
      // Delete the test fund
      await request(app.getHttpServer())
        .delete(`/funds/${testFund.id}`)
        .set('Authorization', `Bearer ${authTokens.accessToken}`);

      const response = await request(app.getHttpServer())
        .get('/funds')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should reject request without authorization', async () => {
      await request(app.getHttpServer())
        .get('/funds')
        .expect(401);
    });
  });

  describe('GET /funds/:id', () => {
    let testFund: any;

    beforeEach(async () => {
      const createFundDto = {
        name: 'Test PE Fund',
        description: 'A test private equity fund',
        fundType: 'PE',
        vintage: 2024,
        targetSize: 100000000,
        commitedSize: 85000000,
        currency: 'USD',
      };

      const response = await request(app.getHttpServer())
        .post('/funds')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .send(createFundDto);

      testFund = response.body;
    });

    it('should get fund by ID successfully', async () => {
      const response = await request(app.getHttpServer())
        .get(`/funds/${testFund.id}`)
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .expect(200);

      expect(response.body.id).toBe(testFund.id);
      expect(response.body.name).toBe(testFund.name);
      expect(response.body.description).toBe(testFund.description);
    });

    it('should reject request for non-existent fund', async () => {
      await request(app.getHttpServer())
        .get(`/funds/${ValidationHelper.generateValidUUID()}`)
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .expect(404);
    });
  });

  describe('GET /funds/my-funds', () => {
    let testFund: any;

    beforeEach(async () => {
      const createFundDto = {
        name: 'Test PE Fund',
        fundType: 'PE',
        vintage: 2024,
        targetSize: 100000000,
        commitedSize: 85000000,
        currency: 'USD',
      };

      const fundResponse = await request(app.getHttpServer())
        .post('/funds')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .send(createFundDto);

      testFund = fundResponse.body;

      // Create investment for the user
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
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .send(createInvestmentDto);
    });

    it('should get user funds successfully', async () => {
      const response = await request(app.getHttpServer())
        .get('/funds/my-funds')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe(testFund.id);
    });

    it('should return empty array for user with no investments', async () => {
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
        .get('/funds/my-funds')
        .set('Authorization', `Bearer ${newAuthResponse.body.accessToken}`)
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('GET /funds/by-type', () => {
    beforeEach(async () => {
      const funds = [
        {
          name: 'PE Fund 1',
          fundType: 'PE',
          vintage: 2024,
          targetSize: 100000000,
          commitedSize: 85000000,
          currency: 'USD',
        },
        {
          name: 'VC Fund 1',
          fundType: 'VC',
          vintage: 2024,
          targetSize: 50000000,
          commitedSize: 40000000,
          currency: 'USD',
        },
      ];

      for (const fund of funds) {
        await request(app.getHttpServer())
          .post('/funds')
          .set('Authorization', `Bearer ${authTokens.accessToken}`)
          .send(fund);
      }
    });

    it('should get funds by type successfully', async () => {
      const response = await request(app.getHttpServer())
        .get('/funds/by-type?type=PE')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].fundType).toBe('PE');
    });

    it('should return empty array for unknown fund type', async () => {
      const response = await request(app.getHttpServer())
        .get('/funds/by-type?type=UNKNOWN')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('GET /funds/by-vintage', () => {
    beforeEach(async () => {
      const funds = [
        {
          name: 'Fund 2023',
          fundType: 'PE',
          vintage: 2023,
          targetSize: 100000000,
          commitedSize: 85000000,
          currency: 'USD',
        },
        {
          name: 'Fund 2024',
          fundType: 'PE',
          vintage: 2024,
          targetSize: 120000000,
          commitedSize: 100000000,
          currency: 'USD',
        },
      ];

      for (const fund of funds) {
        await request(app.getHttpServer())
          .post('/funds')
          .set('Authorization', `Bearer ${authTokens.accessToken}`)
          .send(fund);
      }
    });

    it('should get funds by vintage successfully', async () => {
      const response = await request(app.getHttpServer())
        .get('/funds/by-vintage?vintage=2024')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].vintage).toBe(2024);
    });

    it('should return empty array for non-existent vintage', async () => {
      const response = await request(app.getHttpServer())
        .get('/funds/by-vintage?vintage=2025')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('GET /funds/:id/summary', () => {
    let testFund: any;

    beforeEach(async () => {
      const createFundDto = {
        name: 'Test PE Fund',
        fundType: 'PE',
        vintage: 2024,
        targetSize: 100000000,
        commitedSize: 85000000,
        currency: 'USD',
      };

      const fundResponse = await request(app.getHttpServer())
        .post('/funds')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .send(createFundDto);

      testFund = fundResponse.body;

      // Create investment for summary data
      const createInvestmentDto = {
        fundId: testFund.id,
        commitmentAmount: 5000000,
        investmentDate: '2024-01-15',
        drawnAmount: 1250000,
        distributedAmount: 250000,
        currentValue: 6000000,
        status: 'ACTIVE',
      };

      await request(app.getHttpServer())
        .post('/investments')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .send(createInvestmentDto);
    });

    it('should get fund summary successfully', async () => {
      const response = await request(app.getHttpServer())
        .get(`/funds/${testFund.id}/summary`)
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('fund');
      expect(response.body).toHaveProperty('investorCount');
      expect(response.body).toHaveProperty('totalInvestorCommitment');
      expect(response.body).toHaveProperty('totalDrawn');
      expect(response.body).toHaveProperty('totalDistributed');
      expect(response.body).toHaveProperty('currentNav');

      expect(response.body.fund.id).toBe(testFund.id);
      expect(response.body.investorCount).toBe(1);
      expect(response.body.totalInvestorCommitment).toBe(5000000);
      expect(response.body.totalDrawn).toBe(1250000);
    });

    it('should reject summary for non-existent fund', async () => {
      await request(app.getHttpServer())
        .get(`/funds/${ValidationHelper.generateValidUUID()}/summary`)
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .expect(404);
    });
  });

  describe('PUT /funds/:id', () => {
    let testFund: any;

    beforeEach(async () => {
      const createFundDto = {
        name: 'Test PE Fund',
        fundType: 'PE',
        vintage: 2024,
        targetSize: 100000000,
        commitedSize: 85000000,
        currency: 'USD',
      };

      const response = await request(app.getHttpServer())
        .post('/funds')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .send(createFundDto);

      testFund = response.body;
    });

    it('should update fund successfully', async () => {
      const updateDto = {
        description: 'Updated fund description',
        drawnSize: 30000000,
        status: 'CLOSED',
      };

      const response = await request(app.getHttpServer())
        .put(`/funds/${testFund.id}`)
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.description).toBe(updateDto.description);
      expect(response.body.drawnSize).toBe(updateDto.drawnSize);
      expect(response.body.status).toBe(updateDto.status);
    });

    it('should reject update for non-existent fund', async () => {
      const updateDto = {
        description: 'Updated description',
      };

      await request(app.getHttpServer())
        .put(`/funds/${ValidationHelper.generateValidUUID()}`)
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .send(updateDto)
        .expect(404);
    });
  });

  describe('DELETE /funds/:id', () => {
    let testFund: any;

    beforeEach(async () => {
      const createFundDto = {
        name: 'Test PE Fund',
        fundType: 'PE',
        vintage: 2024,
        targetSize: 100000000,
        commitedSize: 85000000,
        currency: 'USD',
      };

      const response = await request(app.getHttpServer())
        .post('/funds')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .send(createFundDto);

      testFund = response.body;
    });

    it('should soft delete fund successfully', async () => {
      await request(app.getHttpServer())
        .delete(`/funds/${testFund.id}`)
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .expect(204);

      // Verify fund is no longer accessible
      await request(app.getHttpServer())
        .get(`/funds/${testFund.id}`)
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .expect(404);
    });

    it('should reject delete for non-existent fund', async () => {
      await request(app.getHttpServer())
        .delete(`/funds/${ValidationHelper.generateValidUUID()}`)
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .expect(404);
    });
  });

  describe('Data validation and business rules', () => {
    it('should validate target size is positive', async () => {
      const createFundDto = {
        name: 'Invalid Fund',
        fundType: 'PE',
        vintage: 2024,
        targetSize: -100000000,
        commitedSize: 85000000,
        currency: 'USD',
      };

      await request(app.getHttpServer())
        .post('/funds')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .send(createFundDto)
        .expect(400);
    });

    it('should validate committed size does not exceed target size', async () => {
      const createFundDto = {
        name: 'Invalid Fund',
        fundType: 'PE',
        vintage: 2024,
        targetSize: 100000000,
        commitedSize: 150000000, // Exceeds target
        currency: 'USD',
      };

      await request(app.getHttpServer())
        .post('/funds')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .send(createFundDto)
        .expect(400);
    });

    it('should validate vintage year is reasonable', async () => {
      const createFundDto = {
        name: 'Invalid Fund',
        fundType: 'PE',
        vintage: 1900, // Too old
        targetSize: 100000000,
        commitedSize: 85000000,
        currency: 'USD',
      };

      await request(app.getHttpServer())
        .post('/funds')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .send(createFundDto)
        .expect(400);
    });

    it('should validate management fee is within reasonable range', async () => {
      const createFundDto = {
        name: 'Invalid Fund',
        fundType: 'PE',
        vintage: 2024,
        targetSize: 100000000,
        commitedSize: 85000000,
        currency: 'USD',
        managementFee: 0.50, // 50% is unreasonable
      };

      await request(app.getHttpServer())
        .post('/funds')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .send(createFundDto)
        .expect(400);
    });
  });
});