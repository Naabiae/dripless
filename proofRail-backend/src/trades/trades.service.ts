import { Injectable, Logger, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { AmlService } from '../compliance/aml.service';
import { EscrowService } from './escrow.service';
import { CreateTradeDto } from './dto/create-trade.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class TradesService {
  private readonly logger = new Logger(TradesService.name);

  constructor(
    private prisma: PrismaService,
    private amlService: AmlService,
    private escrowService: EscrowService,
    private eventEmitter: EventEmitter2,
    @InjectQueue('trades') private tradesQueue: Queue,
  ) {}

  async createTrade(buyerId: string, dto: CreateTradeDto) {
    const isClear = await this.amlService.checkThresholds(buyerId, dto.fiatAmount);
    if (!isClear) {
      await this.prisma.complianceRecord.update({
        where: { userId: buyerId },
        data: { status: 'FLAGGED', flagReason: 'AML threshold exceeded on trade creation' },
      });
      this.eventEmitter.emit('compliance.flagged', { userId: buyerId });
      throw new ForbiddenException('Trade blocked due to AML thresholds');
    }

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min from now

    const trade = await this.prisma.trade.create({
      data: {
        buyerId,
        sellerId: dto.sellerId,
        chain: dto.chain,
        assetSymbol: dto.assetSymbol,
        assetAmount: dto.assetAmount,
        fiatCurrency: dto.fiatCurrency,
        fiatAmount: dto.fiatAmount,
        fiatRate: dto.fiatRate,
        paymentMethod: dto.paymentMethod,
        status: 'PENDING',
        expiresAt,
      },
    });

    this.eventEmitter.emit('trade.created', { tradeId: trade.id });

    // Schedule expiry check
    await this.tradesQueue.add('checkPendingExpiry', { tradeId: trade.id }, { delay: 30 * 60 * 1000 });

    return trade;
  }

  async lockEscrow(tradeId: string, sellerId: string, txHash: string) {
    const trade = await this.getTradeIfParty(tradeId, sellerId);
    if (trade.sellerId !== sellerId) {
      throw new ForbiddenException('Only seller can lock escrow');
    }
    if (trade.status !== 'PENDING') {
      throw new BadRequestException(`Cannot lock escrow in status ${trade.status}`);
    }

    await this.escrowService.validateEscrowTx(trade.chain, txHash, Number(trade.assetAmount));

    const updated = await this.prisma.trade.update({
      where: { id: tradeId },
      data: { status: 'ESCROW_LOCKED', escrowTxHash: txHash },
    });

    this.eventEmitter.emit('trade.status_changed', { tradeId, status: 'ESCROW_LOCKED' });
    return updated;
  }

  async markPaymentSent(tradeId: string, buyerId: string) {
    const trade = await this.getTradeIfParty(tradeId, buyerId);
    if (trade.buyerId !== buyerId) {
      throw new ForbiddenException('Only buyer can mark payment sent');
    }
    if (trade.status !== 'ESCROW_LOCKED') {
      throw new BadRequestException(`Cannot mark payment sent in status ${trade.status}`);
    }

    const updated = await this.prisma.trade.update({
      where: { id: tradeId },
      data: { status: 'PAYMENT_SENT' },
    });

    this.eventEmitter.emit('trade.status_changed', { tradeId, status: 'PAYMENT_SENT' });

    // Schedule 30-min auto-dispute escalation
    await this.tradesQueue.add('checkPaymentEscalation', { tradeId: trade.id }, { delay: 30 * 60 * 1000 });

    return updated;
  }

  async confirmPayment(tradeId: string, sellerId: string) {
    const trade = await this.getTradeIfParty(tradeId, sellerId);
    if (trade.sellerId !== sellerId) {
      throw new ForbiddenException('Only seller can confirm payment');
    }
    if (trade.status !== 'PAYMENT_SENT') {
      throw new BadRequestException(`Cannot confirm payment in status ${trade.status}`);
    }

    const updated = await this.prisma.trade.update({
      where: { id: tradeId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });

    this.eventEmitter.emit('trade.status_changed', { tradeId, status: 'COMPLETED' });
    this.eventEmitter.emit('trade.completed', { tradeId, buyerId: trade.buyerId, sellerId: trade.sellerId });

    return updated;
  }

  async cancelTrade(tradeId: string, userId: string) {
    const trade = await this.getTradeIfParty(tradeId, userId);
    if (trade.status !== 'PENDING') {
      throw new BadRequestException('Can only cancel PENDING trades');
    }

    const updated = await this.prisma.trade.update({
      where: { id: tradeId },
      data: { status: 'CANCELLED' },
    });

    this.eventEmitter.emit('trade.status_changed', { tradeId, status: 'CANCELLED' });
    this.eventEmitter.emit('trade.cancelled', { tradeId, userId });
    return updated;
  }

  async getActiveTrades(userId: string) {
    return this.prisma.trade.findMany({
      where: {
        OR: [{ buyerId: userId }, { sellerId: userId }],
        status: { in: ['PENDING', 'ESCROW_LOCKED', 'PAYMENT_SENT', 'DISPUTED'] },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTrade(tradeId: string, userId: string) {
    return this.getTradeIfParty(tradeId, userId);
  }

  private async getTradeIfParty(tradeId: string, userId: string) {
    const trade = await this.prisma.trade.findUnique({ where: { id: tradeId } });
    if (!trade) throw new NotFoundException('Trade not found');
    if (trade.buyerId !== userId && trade.sellerId !== userId) {
      throw new ForbiddenException('Not a party to this trade');
    }
    return trade;
  }
}
