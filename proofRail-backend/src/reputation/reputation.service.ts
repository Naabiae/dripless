import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class ReputationService {
  private readonly logger = new Logger(ReputationService.name);

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async initialize(userId: string) {
    const existing = await this.prisma.reputation.findUnique({ where: { userId } });
    if (!existing) {
      await this.prisma.reputation.create({
        data: { userId }
      });
    }
  }

  @OnEvent('trade.completed')
  async onTradeCompleted(payload: { tradeId: string, buyerId: string, sellerId: string }) {
    await this.updateScore(payload.buyerId, { completedTrades: 1, scoreDelta: 10 });
    await this.updateScore(payload.sellerId, { completedTrades: 1, scoreDelta: 10 });
  }

  @OnEvent('dispute.resolved')
  async onDisputeResolved(payload: { disputeId: string, tradeId: string, winnerId: string, loserId: string }) {
    await this.updateScore(payload.winnerId, { disputesWon: 1, scoreDelta: 15 });
    await this.updateScore(payload.loserId, { disputesLost: 1, scoreDelta: -20 });
    
    // Check loser's dispute rate for compliance flag
    await this.checkDisputeRate(payload.loserId);
  }

  @OnEvent('trade.cancelled')
  async onTradeCancelled(payload: { tradeId: string, userId: string }) {
    await this.updateScore(payload.userId, { cancelledTrades: 1, scoreDelta: -5 });
  }

  private async updateScore(userId: string, update: { completedTrades?: number, disputesWon?: number, disputesLost?: number, cancelledTrades?: number, scoreDelta: number }) {
    await this.initialize(userId);
    
    const current = await this.prisma.reputation.findUnique({ where: { userId } });
    if (!current) return;

    let newScore = current.score + update.scoreDelta;
    if (newScore < 0) newScore = 0;
    if (newScore > 1000) newScore = 1000;

    let newTier = current.tier;
    if (newScore >= 600) newTier = 'PLATINUM';
    else if (newScore >= 300) newTier = 'GOLD';
    else if (newScore >= 100) newTier = 'SILVER';
    else newTier = 'BRONZE';

    await this.prisma.reputation.update({
      where: { userId },
      data: {
        score: newScore,
        tier: newTier,
        completedTrades: { increment: update.completedTrades || 0 },
        disputesWon: { increment: update.disputesWon || 0 },
        disputesLost: { increment: update.disputesLost || 0 },
        cancelledTrades: { increment: update.cancelledTrades || 0 },
      }
    });
  }

  async checkDisputeRate(userId: string) {
    const rep = await this.prisma.reputation.findUnique({ where: { userId } });
    if (!rep) return;

    const totalTrades = rep.completedTrades + rep.disputesLost + rep.disputesWon; // Rough proxy for total
    if (totalTrades > 5) {
      const rate = rep.disputesLost / totalTrades;
      if (rate > 0.10) {
        this.logger.warn(`User ${userId} dispute rate > 10%. Flagging compliance.`);
        this.eventEmitter.emit('compliance.flagged', { userId, reason: 'Dispute rate > 10%' });
      }
    }
  }

  async getTier(userId: string) {
    const rep = await this.prisma.reputation.findUnique({ where: { userId } });
    if (!rep) return { tier: 'BRONZE', tradeCount: 0, score: 0 };
    return { tier: rep.tier, tradeCount: rep.completedTrades, score: rep.score };
  }

  async getRepProof(userId: string, chain: 'midnight' | 'aleo' | 'fhenix') {
    const rep = await this.prisma.reputation.findUnique({ where: { userId } });
    if (!rep) return null;

    const totalTrades = rep.completedTrades + rep.disputesLost + rep.disputesWon;
    const disputeRate = totalTrades > 0 ? rep.disputesLost / totalTrades : 0;
    
    const proofClaims = {
      tier: rep.tier,
      tradeCount: rep.completedTrades,
      disputeRateOk: disputeRate <= 0.10
    };

    // Simulated adapter pattern for reputation proofs
    if (chain === 'midnight') {
      return { witness: { tier: rep.tier, tradeCount: rep.completedTrades, disputeRateOk: proofClaims.disputeRateOk ? 1 : 0 } };
    }
    if (chain === 'aleo') {
      return { record: `{ tier: "${rep.tier}", tradeCount: ${rep.completedTrades}u32, disputeRateOk: ${proofClaims.disputeRateOk} }` };
    }
    if (chain === 'fhenix') {
      return { encryptedClaims: { payload: 'mock-fhe-rep-payload' } };
    }
    
    return proofClaims;
  }
}
