import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/core/prisma/prisma.service';
import { RedisService } from '../src/core/redis/redis.service';
import { JwtService } from '@nestjs/jwt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CredentialsService } from '../src/credentials/credentials.service';

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

describe('CredentialsModule (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let eventEmitter: EventEmitter2;
  let credentialsService: CredentialsService;
  let accessToken: string;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
    credential: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
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
    eventEmitter = moduleFixture.get<EventEmitter2>(EventEmitter2);
    credentialsService = moduleFixture.get<CredentialsService>(CredentialsService);
    
    accessToken = jwtService.sign({ sub: 'user-1' }, { secret: 'secret' });

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('issues credential on compliance.cleared event', async () => {
    mockPrismaService.user.findUnique.mockResolvedValueOnce({
      id: 'user-1',
      walletAddress: '0x123',
      kycStatus: 'APPROVED',
      complianceRecord: { status: 'CLEAR' },
    });
    mockPrismaService.credential.upsert.mockResolvedValueOnce({});

    eventEmitter.emit('compliance.cleared', { userId: 'user-1' });
    
    await new Promise((resolve) => setTimeout(resolve, 50));
    
    expect(mockPrismaService.credential.upsert).toHaveBeenCalled();
  });

  it('/credentials/me (GET) - unverified user returns 403', async () => {
    mockPrismaService.user.findUnique.mockResolvedValueOnce({
      id: 'user-2',
      kycStatus: 'NOT_STARTED',
    });

    await request(app.getHttpServer())
      .get('/credentials/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);
  });

  it('/credentials/midnight (GET) - returns Compact JSON', async () => {
    mockPrismaService.user.findUnique.mockResolvedValueOnce({ id: 'user-1', kycStatus: 'APPROVED' });
    mockRedisService.getClient().get.mockResolvedValueOnce(null);
    mockPrismaService.credential.findUnique.mockResolvedValueOnce({
      userId: 'user-1',
      expiresAt: new Date(Date.now() + 86400000),
      midnightProof: { witness: { kyc_verified: 1 } },
    });

    const response = await request(app.getHttpServer())
      .get('/credentials/midnight')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.witness.kyc_verified).toBe(1);
    expect(mockRedisService.getClient().set).toHaveBeenCalled();
  });

  it('/credentials/aleo (GET) - returns Leo record', async () => {
    mockPrismaService.user.findUnique.mockResolvedValueOnce({ id: 'user-1', kycStatus: 'APPROVED' });
    mockRedisService.getClient().get.mockResolvedValueOnce(null);
    
    // Simulate cache hit on getClient().get for token verification then aleo cache hit
    mockRedisService.getClient().get.mockResolvedValueOnce(JSON.stringify({ record: 'owner: 0x123' }));

    const response = await request(app.getHttpServer())
      .get('/credentials/aleo')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.record).toBe('owner: 0x123');
  });

  it('revokes credential correctly', async () => {
    mockRedisService.getClient().del.mockClear();
    mockPrismaService.credential.update.mockResolvedValueOnce({});
    
    await credentialsService.revoke('user-1');
    
    expect(mockPrismaService.credential.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ revokedAt: expect.any(Date) }) })
    );
    expect(mockRedisService.getClient().del).toHaveBeenCalledTimes(3);
  });
});
