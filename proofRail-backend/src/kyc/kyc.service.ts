import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { randomUUID } from 'crypto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class KycService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    @InjectQueue('kyc') private kycQueue: Queue,
    private eventEmitter: EventEmitter2,
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleAbandonedSessions() {
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
    await this.prisma.kycSession.updateMany({
      where: {
        status: 'IN_PROGRESS',
        createdAt: { lt: thirtyMinsAgo },
      },
      data: { status: 'ABANDONED' },
    });
  }

  async createSession(userId: string) {
    const existing = await this.prisma.kycSession.findFirst({
      where: { userId, status: 'IN_PROGRESS' },
    });

    if (existing) {
      return { verificationUrl: `https://mock.didit.me/${existing.sessionId}` };
    }

    const sessionId = randomUUID();
    const verificationUrl = `https://mock.didit.me/${sessionId}`;

    await this.prisma.kycSession.create({
      data: {
        userId,
        sessionId,
        status: 'IN_PROGRESS',
      },
    });

    return { verificationUrl };
  }

  async getStatus(userId: string) {
    const session = await this.prisma.kycSession.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return session || { status: 'NOT_STARTED' };
  }

  async processWebhook(payload: any) {
    const { session_id, decision } = payload;
    
    const session = await this.prisma.kycSession.findUnique({
      where: { sessionId: session_id },
    });

    if (!session) return;

    let newStatus: any = 'IN_REVIEW';
    if (decision?.status === 'Approved') newStatus = 'APPROVED';
    if (decision?.status === 'Declined') newStatus = 'DECLINED';

    await this.prisma.kycSession.update({
      where: { id: session.id },
      data: {
        status: newStatus,
        decisionData: payload,
      },
    });

    if (newStatus === 'APPROVED') {
      await this.prisma.user.update({
        where: { id: session.userId },
        data: { kycStatus: 'APPROVED' },
      });
      this.eventEmitter.emit('kyc.approved', { userId: session.userId });
    }
  }
}
