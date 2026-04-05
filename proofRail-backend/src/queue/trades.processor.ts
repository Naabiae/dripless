import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../core/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Logger } from '@nestjs/common';

@Processor('trades')
export class TradesProcessor extends WorkerHost {
  private readonly logger = new Logger(TradesProcessor.name);

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    if (job.name === 'checkPendingExpiry') {
      const { tradeId } = job.data;
      const trade = await this.prisma.trade.findUnique({ where: { id: tradeId } });
      
      if (trade && trade.status === 'PENDING') {
        this.logger.log(`Trade ${tradeId} expired without escrow lock. Marking EXPIRED.`);
        await this.prisma.trade.update({
          where: { id: tradeId },
          data: { status: 'EXPIRED' },
        });
        this.eventEmitter.emit('trade.status_changed', { tradeId, status: 'EXPIRED' });
      }
    } else if (job.name === 'checkPaymentEscalation') {
      const { tradeId } = job.data;
      const trade = await this.prisma.trade.findUnique({ where: { id: tradeId } });

      if (trade && trade.status === 'PAYMENT_SENT') {
        this.logger.log(`Trade ${tradeId} payment confirmation timed out. Escalating to DISPUTED.`);
        await this.prisma.trade.update({
          where: { id: tradeId },
          data: { status: 'DISPUTED' },
        });
        this.eventEmitter.emit('trade.status_changed', { tradeId, status: 'DISPUTED' });
        this.eventEmitter.emit('trade.escalated', { tradeId, sellerId: trade.sellerId, buyerId: trade.buyerId });
      }
    }
  }
}
