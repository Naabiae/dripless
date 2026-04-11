"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var DisputesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisputesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../core/prisma/prisma.service");
const escrow_service_1 = require("../trades/escrow.service");
const event_emitter_1 = require("@nestjs/event-emitter");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
let DisputesService = DisputesService_1 = class DisputesService {
    prisma;
    escrowService;
    eventEmitter;
    disputesQueue;
    logger = new common_1.Logger(DisputesService_1.name);
    constructor(prisma, escrowService, eventEmitter, disputesQueue) {
        this.prisma = prisma;
        this.escrowService = escrowService;
        this.eventEmitter = eventEmitter;
        this.disputesQueue = disputesQueue;
    }
    async raise(userId, dto) {
        const trade = await this.prisma.trade.findUnique({ where: { id: dto.tradeId } });
        if (!trade)
            throw new common_1.NotFoundException('Trade not found');
        if (trade.buyerId !== userId && trade.sellerId !== userId) {
            throw new common_1.ForbiddenException('Only trade parties can raise a dispute');
        }
        if (!['PAYMENT_SENT', 'COMPLETED'].includes(trade.status)) {
            if (trade.status !== 'PAYMENT_SENT') {
                throw new common_1.BadRequestException('Dispute can only be raised after payment sent');
            }
        }
        const existingDispute = await this.prisma.dispute.findUnique({ where: { tradeId: dto.tradeId } });
        if (existingDispute) {
            throw new common_1.BadRequestException('Dispute already exists for this trade');
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
        await this.disputesQueue.add('checkDisputeSLA', { disputeId: dispute.id }, { delay: 48 * 60 * 60 * 1000 });
        return dispute;
    }
    async submitEvidence(disputeId, userId, dto) {
        const dispute = await this.prisma.dispute.findUnique({
            where: { id: disputeId },
            include: { trade: true }
        });
        if (!dispute)
            throw new common_1.NotFoundException('Dispute not found');
        const isBuyer = dispute.trade.buyerId === userId;
        const isSeller = dispute.trade.sellerId === userId;
        if (!isBuyer && !isSeller) {
            throw new common_1.ForbiddenException('Only trade parties can submit evidence');
        }
        if (dispute.status !== 'OPEN' && dispute.status !== 'UNDER_REVIEW') {
            throw new common_1.BadRequestException('Cannot submit evidence to closed dispute');
        }
        const dataToUpdate = {};
        if (isBuyer)
            dataToUpdate.buyerEvidence = dto.evidence;
        if (isSeller)
            dataToUpdate.sellerEvidence = dto.evidence;
        const updated = await this.prisma.dispute.update({
            where: { id: disputeId },
            data: dataToUpdate,
        });
        return updated;
    }
    async resolve(disputeId, adminId, dto) {
        const dispute = await this.prisma.dispute.findUnique({
            where: { id: disputeId },
            include: { trade: true }
        });
        if (!dispute)
            throw new common_1.NotFoundException('Dispute not found');
        if (dispute.status === 'RESOLVED')
            throw new common_1.BadRequestException('Dispute already resolved');
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
        await this.prisma.trade.update({
            where: { id: dispute.tradeId },
            data: { status: 'COMPLETED', completedAt: new Date() },
        });
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
    async getDispute(disputeId, userId, role) {
        const dispute = await this.prisma.dispute.findUnique({
            where: { id: disputeId },
            include: { trade: true }
        });
        if (!dispute)
            throw new common_1.NotFoundException('Dispute not found');
        if (role !== 'ADMIN' && dispute.trade.buyerId !== userId && dispute.trade.sellerId !== userId) {
            throw new common_1.ForbiddenException('Access denied');
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
};
exports.DisputesService = DisputesService;
exports.DisputesService = DisputesService = DisputesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, bullmq_1.InjectQueue)('disputes')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        escrow_service_1.EscrowService,
        event_emitter_1.EventEmitter2,
        bullmq_2.Queue])
], DisputesService);
//# sourceMappingURL=disputes.service.js.map