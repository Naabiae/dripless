import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/core/prisma/prisma.service';
import { RedisService } from '../src/core/redis/redis.service';
import { JwtService } from '@nestjs/jwt';
import { EventEmitter2 } from '@nestjs/event-emitter';

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

describe('ComplianceModule (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let eventEmitter: EventEmitter2;
  let accessToken: string;
  let adminToken: string;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
    kycSession: {
      findFirst: jest.fn(),
    },
    complianceRecord: {
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
      zadd: jest.fn(),
      zremrangebyscore: jest.fn(),
      expire: jest.fn(),
      zrange: jest.fn().mockResolvedValue(['1000:500']),
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
    
    accessToken = jwtService.sign({ sub: 'user-1' }, { secret: 'secret' });
    adminToken = jwtService.sign({ sub: 'admin-1' }, { secret: 'secret' });

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('runs full check automatically on kyc.approved event', async () => {
    mockPrismaService.kycSession.findFirst.mockResolvedValueOnce({
      userId: 'user-1',
      decisionData: { decision: { first_name: 'John', last_name: 'Doe' } }
    });
    mockPrismaService.complianceRecord.upsert.mockResolvedValueOnce({ status: 'CLEAR' });
    
    // Simulate event
    eventEmitter.emit('kyc.approved', { userId: 'user-1' });
    
    // Wait for async handler
    await new Promise((resolve) => setTimeout(resolve, 50));
    
    expect(mockPrismaService.complianceRecord.upsert).toHaveBeenCalled();
  });

  it('/compliance/status (GET) - user sees own status', async () => {
    mockPrismaService.user.findUnique.mockResolvedValueOnce({ id: 'user-1', kycStatus: 'APPROVED' });
    mockPrismaService.complianceRecord.findUnique.mockResolvedValueOnce({ status: 'CLEAR' });

    const response = await request(app.getHttpServer())
      .get('/compliance/status')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.status).toBe('CLEAR');
  });

  it('/admin/compliance/:userId/block (PATCH) - admin blocks user', async () => {
    mockPrismaService.user.findUnique.mockResolvedValueOnce({ id: 'admin-1', role: 'ADMIN' });
    mockPrismaService.complianceRecord.update.mockResolvedValueOnce({ status: 'BLOCKED' });

    await request(app.getHttpServer())
      .patch('/admin/compliance/user-1/block')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(mockPrismaService.complianceRecord.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'BLOCKED' }) })
    );
  });

  it('/admin/compliance/:userId/block (PATCH) - non-admin fails 403', async () => {
    mockPrismaService.user.findUnique.mockResolvedValueOnce({ id: 'user-1', role: 'USER' });

    await request(app.getHttpServer())
      .patch('/admin/compliance/user-2/block')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);
  });
});
