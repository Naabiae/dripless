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

describe('TradesModule (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let buyerToken: string;
  let sellerToken: string;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
    complianceRecord: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    trade: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockRedisService = {
    getClient: jest.fn().mockReturnValue({
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      zremrangebyscore: jest.fn(),
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
    
    buyerToken = jwtService.sign({ sub: 'buyer-1' }, { secret: 'secret' });
    sellerToken = jwtService.sign({ sub: 'seller-1' }, { secret: 'secret' });

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/trades (POST) - unverified user returns 403', async () => {
    mockPrismaService.user.findUnique.mockResolvedValueOnce({
      id: 'buyer-1',
      kycStatus: 'NOT_STARTED',
    });

    await request(app.getHttpServer())
      .post('/trades')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        sellerId: 'seller-1',
        chain: 'MIDNIGHT',
        assetSymbol: 'USDT',
        assetAmount: 100,
        fiatCurrency: 'USD',
        fiatAmount: 100,
        fiatRate: 1,
        paymentMethod: 'BANK_TRANSFER'
      })
      .expect(403);
  });

  it('/trades (POST) - over-threshold amount flags + blocks trade', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue({ id: 'buyer-1', kycStatus: 'APPROVED' });
    mockPrismaService.complianceRecord.findUnique.mockResolvedValue({ status: 'CLEAR' });
    
    // Setting trade > $10k single limit
    await request(app.getHttpServer())
      .post('/trades')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        sellerId: 'seller-1',
        chain: 'MIDNIGHT',
        assetSymbol: 'USDT',
        assetAmount: 15000,
        fiatCurrency: 'USD',
        fiatAmount: 15000,
        fiatRate: 1,
        paymentMethod: 'BANK_TRANSFER'
      })
      .expect(403);
      
    expect(mockPrismaService.complianceRecord.update).toHaveBeenCalled();
  });

  it('/trades (POST) - valid trade creates PENDING record', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue({ id: 'buyer-1', kycStatus: 'APPROVED' });
    mockPrismaService.complianceRecord.findUnique.mockResolvedValue({ status: 'CLEAR' });
    mockPrismaService.trade.create.mockResolvedValueOnce({ id: 'trade-1', status: 'PENDING' });

    const response = await request(app.getHttpServer())
      .post('/trades')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        sellerId: 'seller-1',
        chain: 'MIDNIGHT',
        assetSymbol: 'USDT',
        assetAmount: 100,
        fiatCurrency: 'USD',
        fiatAmount: 100,
        fiatRate: 1,
        paymentMethod: 'BANK_TRANSFER'
      })
      .expect(201);

    expect(response.body.id).toBe('trade-1');
  });

  it('/trades/:id/lock-escrow (POST) - moves to ESCROW_LOCKED', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue({ id: 'seller-1', kycStatus: 'APPROVED' });
    mockPrismaService.trade.findUnique.mockResolvedValueOnce({ id: 'trade-1', sellerId: 'seller-1', status: 'PENDING', assetAmount: 100, chain: 'MIDNIGHT' });
    mockPrismaService.trade.update.mockResolvedValueOnce({ status: 'ESCROW_LOCKED', escrowTxHash: '0xabc' });

    const response = await request(app.getHttpServer())
      .post('/trades/trade-1/lock-escrow')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ txHash: '0xabc' })
      .expect(200);

    expect(response.body.status).toBe('ESCROW_LOCKED');
  });

  it('/trades/:id/payment-sent (POST) - buyer only, moves to PAYMENT_SENT', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue({ id: 'buyer-1', kycStatus: 'APPROVED' });
    mockPrismaService.trade.findUnique.mockResolvedValueOnce({ id: 'trade-1', buyerId: 'buyer-1', sellerId: 'seller-1', status: 'ESCROW_LOCKED' });
    mockPrismaService.trade.update.mockResolvedValueOnce({ status: 'PAYMENT_SENT' });

    const response = await request(app.getHttpServer())
      .post('/trades/trade-1/payment-sent')
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(200);

    expect(response.body.status).toBe('PAYMENT_SENT');
  });

  it('/trades/:id/confirm-payment (POST) - seller only, moves to COMPLETED', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue({ id: 'seller-1', kycStatus: 'APPROVED' });
    mockPrismaService.trade.findUnique.mockResolvedValueOnce({ id: 'trade-1', buyerId: 'buyer-1', sellerId: 'seller-1', status: 'PAYMENT_SENT' });
    mockPrismaService.trade.update.mockResolvedValueOnce({ status: 'COMPLETED' });

    const response = await request(app.getHttpServer())
      .post('/trades/trade-1/confirm-payment')
      .set('Authorization', `Bearer ${sellerToken}`)
      .expect(200);

    expect(response.body.status).toBe('COMPLETED');
  });

  it('/trades/:id/cancel (POST) - only works in PENDING state', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue({ id: 'buyer-1', kycStatus: 'APPROVED' });
    mockPrismaService.trade.findUnique.mockResolvedValueOnce({ id: 'trade-1', buyerId: 'buyer-1', status: 'PAYMENT_SENT' });

    await request(app.getHttpServer())
      .post('/trades/trade-1/cancel')
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(400); // Bad Request because it's not PENDING
  });

  it('/trades/active (GET) - only returns caller trades', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue({ id: 'buyer-1', kycStatus: 'APPROVED' });
    mockPrismaService.trade.findMany.mockResolvedValueOnce([{ id: 'trade-1', buyerId: 'buyer-1' }]);

    const response = await request(app.getHttpServer())
      .get('/trades/active')
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(200);

    expect(response.body).toHaveLength(1);
    expect(mockPrismaService.trade.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ OR: [{ buyerId: 'buyer-1' }, { sellerId: 'buyer-1' }] })
      })
    );
  });
});
