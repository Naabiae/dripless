import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SanctionsService } from './sanctions.service';
import { AmlService } from './aml.service';

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);

  constructor(
    private prisma: PrismaService,
    private sanctionsService: SanctionsService,
    private amlService: AmlService,
    private eventEmitter: EventEmitter2,
  ) {}

  async runFullCheck(userId: string) {
    const kycSession = await this.prisma.kycSession.findFirst({
      where: { userId, status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
    });

    if (!kycSession) {
      this.logger.warn(`No APPROVED KYC session found for user ${userId} during compliance check`);
      return;
    }

    const sanctionsCheck = await this.sanctionsService.screen(userId, kycSession.decisionData);
    const amlCheck = await this.amlService.runAml(userId);

    let status: 'CLEAR' | 'FLAGGED' | 'PENDING_REVIEW' = 'CLEAR';
    let flagReason = null;

    if (sanctionsCheck.status === 'FLAGGED' || amlCheck.status === 'FLAGGED') {
      status = 'FLAGGED';
      flagReason = [
        sanctionsCheck.status === 'FLAGGED' ? 'Sanctions Match' : null,
        amlCheck.status === 'FLAGGED' ? 'AML Threshold Exceeded' : null,
      ].filter(Boolean).join(', ');
    }

    const record = await this.prisma.complianceRecord.upsert({
      where: { userId },
      update: {
        status,
        sanctionsResult: sanctionsCheck.result,
        amlResult: amlCheck.result,
        lastCheckedAt: new Date(),
        flagReason,
      },
      create: {
        userId,
        status,
        sanctionsResult: sanctionsCheck.result,
        amlResult: amlCheck.result,
        lastCheckedAt: new Date(),
        flagReason,
      },
    });

    if (status === 'CLEAR') {
      this.eventEmitter.emit('compliance.cleared', { userId });
    } else {
      this.eventEmitter.emit('compliance.flagged', { userId, reason: flagReason });
    }

    return record;
  }

  async getStatus(userId: string) {
    const record = await this.prisma.complianceRecord.findUnique({
      where: { userId },
      select: { status: true, flagReason: true, lastCheckedAt: true },
    });
    return record || { status: 'PENDING_REVIEW' };
  }

  async flagUser(userId: string, reason: string) {
    await this.prisma.complianceRecord.update({
      where: { userId },
      data: { status: 'FLAGGED', flagReason: reason },
    });
    this.eventEmitter.emit('compliance.flagged', { userId, reason });
  }

  async blockUser(userId: string, adminId: string) {
    await this.prisma.complianceRecord.update({
      where: { userId },
      data: { status: 'BLOCKED', reviewedBy: adminId },
    });
    this.eventEmitter.emit('compliance.blocked', { userId });
  }

  async clearUser(userId: string, adminId: string) {
    await this.prisma.complianceRecord.update({
      where: { userId },
      data: { status: 'CLEAR', reviewedBy: adminId, flagReason: null },
    });
    this.eventEmitter.emit('compliance.cleared', { userId });
  }
}
