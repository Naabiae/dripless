import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/core/prisma/prisma.service';
import { RedisService } from '../src/core/redis/redis.service';
import { JwtService } from '@nestjs/jwt';

jest.mock('ioredis', () => require('ioredis-mock'));
jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn(),
    on: jest.fn(),
    close: jest.fn(),
  })),
  Worker: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    close: jest.fn(),
  })),
}));

describe('KycModule (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let accessToken: string;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    kycSession: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    }
  };

  const mockRedisService = {
    getClient: jest.fn().mockReturnValue({
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .overrideProvider(RedisService)
      .useValue(mockRedisService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    jwtService = moduleFixture.get<JwtService>(JwtService);
    
    // Generate valid access token for tests
    accessToken = jwtService.sign({ sub: 'user-1' });

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/kyc/initiate (POST) - creates session', async () => {
    mockPrismaService.user.findUnique.mockResolvedValueOnce({ id: 'user-1', kycStatus: 'NOT_STARTED' });
    mockPrismaService.kycSession.findFirst.mockResolvedValueOnce(null);
    mockPrismaService.kycSession.create.mockResolvedValueOnce({});

    const response = await request(app.getHttpServer())
      .post('/kyc/initiate')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.verificationUrl).toBeDefined();
  });

  it('/kyc/status (GET) - returns status', async () => {
    mockPrismaService.user.findUnique.mockResolvedValueOnce({ id: 'user-1', kycStatus: 'IN_PROGRESS' });
    mockPrismaService.kycSession.findFirst.mockResolvedValueOnce({ status: 'IN_PROGRESS' });

    const response = await request(app.getHttpServer())
      .get('/kyc/status')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.status).toBe('IN_PROGRESS');
  });

  it('/kyc/webhook (POST) - handles approved', async () => {
    const response = await request(app.getHttpServer())
      .post('/kyc/webhook')
      .set('X-Signature-V2', 'mock-signature')
      .send({ session_id: 'test-session', decision: { status: 'Approved' } })
      .expect(200);

    expect(response.body.received).toBe(true);
  });
});
