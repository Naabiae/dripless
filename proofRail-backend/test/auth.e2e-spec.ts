import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/core/prisma/prisma.service';
import { RedisService } from '../src/core/redis/redis.service';
import { JwtService } from '@nestjs/jwt';
import { ethers } from 'ethers';
import Redis from 'ioredis-mock';

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

describe('AuthModule (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
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
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/auth/register (POST) - creates user', async () => {
    mockPrismaService.user.findUnique.mockResolvedValueOnce(null);
    mockPrismaService.user.create.mockResolvedValueOnce({ id: 'user-1' });

    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'test@test.com', password: 'password123' })
      .expect(201);

    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
  });

  it('/auth/login (POST) - wrong password returns 401', async () => {
    mockPrismaService.user.findUnique.mockResolvedValueOnce({
      id: 'user-1',
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$WRoA+58e4u5R+2H375sB2g$9bX6K53lq2Qx3a2m2t9q5P6H3l1J9R2Q8L8Y3u9I4O0', // mock hash
    });

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@test.com', password: 'wrongpassword' })
      .expect(401);
  });

  it('/auth/wallet/nonce (POST)', async () => {
    mockRedisService.getClient().set.mockResolvedValueOnce('OK');
    const response = await request(app.getHttpServer())
      .post('/auth/wallet/nonce')
      .send({ address: '0x123' })
      .expect(200);

    expect(response.body.nonce).toBeDefined();
  });

  it('/auth/wallet/verify (POST) - valid sig', async () => {
    const wallet = ethers.Wallet.createRandom();
    const nonce = 'test-nonce';
    const signature = await wallet.signMessage(nonce);

    mockRedisService.getClient().get.mockResolvedValueOnce(nonce);
    mockPrismaService.user.findUnique.mockResolvedValueOnce({ id: 'user-1', walletAddress: wallet.address.toLowerCase() });

    const response = await request(app.getHttpServer())
      .post('/auth/wallet/verify')
      .send({ address: wallet.address, signature })
      .expect(200);

    expect(response.body.accessToken).toBeDefined();
  });

  it('/health (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/health')
      .expect(200);

    expect(response.body.status).toBe('ok');
  });
});
