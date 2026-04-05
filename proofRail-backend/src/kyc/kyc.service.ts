import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { randomUUID } from 'crypto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RedisService } from '../core/redis/redis.service';

@Injectable()
export class KycService {
  private readonly logger = new Logger(KycService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    @InjectQueue('kyc') private kycQueue: Queue,
    private eventEmitter: EventEmitter2,
    private redisService: RedisService,
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
      // Return existing mock URL for dev/test
      return { verificationUrl: `https://mock.didit.me/${existing.sessionId}` };
    }

    // Attempt real Didit API call if API key is set, else fallback to mock
    const apiKey = this.configService.get('DIDIT_API_KEY');
    const baseUrl = this.configService.get('DIDIT_BASE_URL');
    
    let sessionId: string;
    let verificationUrl: string;

    if (apiKey && baseUrl) {
      try {
        const response = await fetch(`${baseUrl}/v3/sessions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ vendor_data: userId }),
        });
        
        if (!response.ok) {
          throw new Error('Didit API error');
        }
        
        const data = await response.json();
        sessionId = data.session_id;
        verificationUrl = data.verification_url;
      } catch (error) {
        this.logger.error('Failed to create Didit session', error);
        throw new InternalServerErrorException('KYC service unavailable');
      }
    } else {
      // Mock flow
      sessionId = randomUUID();
      verificationUrl = `https://mock.didit.me/${sessionId}`;
    }

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
    
    const idempotencyKey = `kyc:processed:${session_id}`;
    const alreadyProcessed = await this.redisService.getClient().get(idempotencyKey);
    
    if (alreadyProcessed) {
      this.logger.log(`Webhook for session ${session_id} already processed`);
      return;
    }

    const session = await this.prisma.kycSession.findUnique({
      where: { sessionId: session_id },
    });

    if (!session) {
      this.logger.warn(`Webhook received for unknown session ${session_id}`);
      return;
    }

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

    await this.redisService.getClient().set(idempotencyKey, 'true', 'EX', 86400); // 24h TTL

    if (newStatus === 'APPROVED') {
      await this.prisma.user.update({
        where: { id: session.userId },
        data: { kycStatus: 'APPROVED' },
      });
      this.eventEmitter.emit('kyc.approved', { userId: session.userId });
    }
  }
}
