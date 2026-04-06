import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/core/prisma/prisma.service';
import { RedisService } from '../src/core/redis/redis.service';
import { JwtService } from '@nestjs/jwt';

jest.mock('ioredis', () => require('ioredis-mock'));
jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({ add: jest.fn(), on: jest.fn(), close: jest.fn() })),
  Worker: jest.fn().mockImplementation(() => ({ on: jest.fn(), close: jest.fn() })),
}));

describe('Midnight Integration (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let prisma: PrismaService;
  let buyerToken: string;
  let sellerToken: string;
  let buyerId: string;
  let sellerId: string;

  let currentTradeState = { id: 'trade-1', buyerId: 'buyer-1', sellerId: 'seller-1', status: 'PENDING', assetAmount: 100, chain: 'MIDNIGHT' };

  const mockPrismaService = {
    dispute: { deleteMany: jest.fn(), create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    trade: { 
      deleteMany: jest.fn(), 
      create: jest.fn().mockResolvedValue(currentTradeState), 
      findUnique: jest.fn().mockImplementation(() => currentTradeState), 
      update: jest.fn().mockImplementation(({ data }) => {
        currentTradeState = { ...currentTradeState, ...data };
        return currentTradeState;
      }) 
    },
    credential: { deleteMany: jest.fn() },
    reputation: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    complianceRecord: { deleteMany: jest.fn(), create: jest.fn(), findUnique: jest.fn().mockResolvedValue({ status: 'CLEAR' }) },
    kycSession: { deleteMany: jest.fn() },
    user: { deleteMany: jest.fn(), create: jest.fn(), findUnique: jest.fn().mockImplementation(({ where }) => {
      if (where.id === 'buyer-1') return { id: 'buyer-1', walletAddress: '0xbuyer', kycStatus: 'APPROVED' };
      if (where.id === 'seller-1') return { id: 'seller-1', walletAddress: '0xseller', kycStatus: 'APPROVED' };
      return null;
    }) },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider(PrismaService)
    .useValue(mockPrismaService)
    .overrideProvider(RedisService)
    .useValue({ getClient: () => ({ get: jest.fn(), set: jest.fn(), del: jest.fn(), zremrangebyscore: jest.fn(), zrange: jest.fn().mockResolvedValue(['1000:500']) }) })
    .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    jwtService = moduleFixture.get<JwtService>(JwtService);
    await app.init();

    buyerId = 'buyer-1';
    buyerToken = jwtService.sign({ sub: buyerId }, { secret: 'secret' });

    sellerId = 'seller-1';
    sellerToken = jwtService.sign({ sub: sellerId }, { secret: 'secret' });
  });

  afterAll(async () => {
    await app.close();
  });

  it('verifies midnight flow from trade to escrow lock and completion', async () => {
    // 1. Create Trade
    const tradeRes = await request(app.getHttpServer())
      .post('/trades')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        sellerId: sellerId,
        chain: 'MIDNIGHT',
        assetSymbol: 'USDT',
        assetAmount: 100,
        fiatCurrency: 'USD',
        fiatAmount: 100,
        fiatRate: 1,
        paymentMethod: 'BANK_TRANSFER'
      })
      .expect(201);
    
    const tradeId = tradeRes.body.id;

    // 2. Lock Escrow (Seller)
    const lockRes = await request(app.getHttpServer())
      .post(`/trades/${tradeId}/lock-escrow`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ txHash: 'mock-initial-hash' })
      .expect(200);

    expect(lockRes.body.status).toBe('ESCROW_LOCKED');
    expect(lockRes.body.escrowTxHash).toContain('0xLockEscrowTx_');

    // 3. Mark Payment Sent (Buyer)
    await request(app.getHttpServer())
      .post(`/trades/${tradeId}/payment-sent`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(200);

    // 4. Confirm Payment (Seller)
    const confirmRes = await request(app.getHttpServer())
      .post(`/trades/${tradeId}/confirm-payment`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .expect(200);

    expect(confirmRes.body.status).toBe('COMPLETED');
  });
});
