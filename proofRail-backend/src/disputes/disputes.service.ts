import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { EscrowService } from '../trades/escrow.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { RaiseDisputeDto, SubmitEvidenceDto, ResolveDisputeDto } from './dto/raise-dispute.dto';

@Injectable()
export class DisputesService {
  private readonly logger = new Logger(DisputesService.name);

  constructor(
    private prisma: PrismaService,
    private escrowService: EscrowService,
    private eventEmitter: EventEmitter2,
    @InjectQueue('disputes') private disputesQueue: Queue,
  ) {}

  async raise(userId: string, dto: RaiseDisputeDto) {
    const trade = await this.prisma.trade.findUnique({ where: { id: dto.tradeId } });
    if (!trade) throw new NotFoundException('Trade not found');

    if (trade.buyerId !== userId && trade.sellerId !== userId) {
      throw new ForbiddenException('Only trade parties can raise a dispute');
    }

    if (!['PAYMENT_SENT', 'COMPLETED'].includes(trade.status)) { // COMPLETED check allows dispute shortly after, per spec logic
      if (trade.status !== 'PAYMENT_SENT') {
        throw new BadRequestException('Dispute can only be raised after payment sent');
      }
    }

    const existingDispute = await this.prisma.dispute.findUnique({ where: { tradeId: dto.tradeId } });
    if (existingDispute) {
      throw new BadRequestException('Dispute already exists for this trade');
    }

    const dispute = await this.prisma.dispute.create({
      data: {
        tradeId: dto.tradeId,
        raisedBy: userId,
        reason: dto.reason,
      }
    });

    await this.prisma.trade.update({
      where: { id: dto.tradeId },
      data: { status: 'DISPUTED' }
    });

    this.eventEmitter.emit('trade.status_changed', { tradeId: trade.id, status: 'DISPUTED' });
    this.eventEmitter.emit('dispute.raised', { disputeId: dispute.id, tradeId: trade.id });

    // Schedule 48h SLA escalation
    await this.disputesQueue.add('checkDisputeSLA', { disputeId: dispute.id }, { delay: 48 * 60 * 60 * 1000 });

    return dispute;
  }

  async submitEvidence(disputeId: string, userId: string, dto: SubmitEvidenceDto) {
    const dispute = await this.prisma.dispute.findUnique({ 
      where: { id: disputeId },
      include: { trade: true }
    });

    if (!dispute) throw new NotFoundException('Dispute not found');

    const isBuyer = dispute.trade.buyerId === userId;
    const isSeller = dispute.trade.sellerId === userId;

    if (!isBuyer && !isSeller) {
      throw new ForbiddenException('Only trade parties can submit evidence');
    }

    if (dispute.status !== 'OPEN' && dispute.status !== 'UNDER_REVIEW') {
      throw new BadRequestException('Cannot submit evidence to closed dispute');
    }

    const dataToUpdate: any = {};
    if (isBuyer) dataToUpdate.buyerEvidence = dto.evidence;
    if (isSeller) dataToUpdate.sellerEvidence = dto.evidence;

    const updated = await this.prisma.dispute.update({
      where: { id: disputeId },
      data: dataToUpdate,
    });

    return updated;
  }

  async resolve(disputeId: string, adminId: string, dto: ResolveDisputeDto) {
    const dispute = await this.prisma.dispute.findUnique({ 
      where: { id: disputeId },
      include: { trade: true }
    });

    if (!dispute) throw new NotFoundException('Dispute not found');
    if (dispute.status === 'RESOLVED') throw new BadRequestException('Dispute already resolved');

    const winnerId = dto.resolution === 'RESOLVED_BUYER' ? dispute.trade.buyerId : dispute.trade.sellerId;
    const loserId = dto.resolution === 'RESOLVED_BUYER' ? dispute.trade.sellerId : dispute.trade.buyerId;

    const updatedDispute = await this.prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: 'RESOLVED',
        resolution: dto.resolution,
        resolvedBy: adminId,
        resolvedAt: new Date(),
        notes: dto.notes,
      }
    });

    // Update trade status implicitly resolved via dispute
    await this.prisma.trade.update({
      where: { id: dispute.tradeId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });

    // Generate escrow instruction
    const action = dto.resolution === 'RESOLVED_BUYER' ? 'BUYER' : 'SELLER';
    await this.escrowService.releaseInstruction(dispute.tradeId, action);

    this.eventEmitter.emit('dispute.resolved', {
      disputeId,
      tradeId: dispute.tradeId,
      winnerId,
      loserId,
      resolution: dto.resolution
    });

    return updatedDispute;
  }

  async getDispute(disputeId: string, userId: string, role: string) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { trade: true }
    });

    if (!dispute) throw new NotFoundException('Dispute not found');

    if (role !== 'ADMIN' && dispute.trade.buyerId !== userId && dispute.trade.sellerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return dispute;
  }

  async listOpen() {
    return this.prisma.dispute.findMany({
      where: { status: { in: ['OPEN', 'UNDER_REVIEW', 'ESCALATED'] } },
      include: { trade: true },
      orderBy: { createdAt: 'asc' }
    });
  }
}
