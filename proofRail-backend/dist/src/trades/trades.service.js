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
var TradesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../core/prisma/prisma.service");
const aml_service_1 = require("../compliance/aml.service");
const escrow_service_1 = require("./escrow.service");
const event_emitter_1 = require("@nestjs/event-emitter");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const midnight_escrow_service_1 = require("../midnight/midnight-escrow.service");
let TradesService = TradesService_1 = class TradesService {
    prisma;
    amlService;
    escrowService;
    eventEmitter;
    tradesQueue;
    midnightEscrowService;
    logger = new common_1.Logger(TradesService_1.name);
    constructor(prisma, amlService, escrowService, eventEmitter, tradesQueue, midnightEscrowService) {
        this.prisma = prisma;
        this.amlService = amlService;
        this.escrowService = escrowService;
        this.eventEmitter = eventEmitter;
        this.tradesQueue = tradesQueue;
        this.midnightEscrowService = midnightEscrowService;
    }
    async createTrade(buyerId, dto) {
        const isClear = await this.amlService.checkThresholds(buyerId, dto.fiatAmount);
        if (!isClear) {
            await this.prisma.complianceRecord.update({
                where: { userId: buyerId },
                data: { status: 'FLAGGED', flagReason: 'AML threshold exceeded on trade creation' },
            });
            this.eventEmitter.emit('compliance.flagged', { userId: buyerId });
            throw new common_1.ForbiddenException('Trade blocked due to AML thresholds');
        }
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
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
        await this.tradesQueue.add('checkPendingExpiry', { tradeId: trade.id }, { delay: 30 * 60 * 1000 });
        return trade;
    }
    async lockEscrow(tradeId, sellerId, txHash) {
        const trade = await this.getTradeIfParty(tradeId, sellerId);
        if (trade.sellerId !== sellerId) {
            throw new common_1.ForbiddenException('Only seller can lock escrow');
        }
        if (trade.status !== 'PENDING') {
            throw new common_1.BadRequestException(`Cannot lock escrow in status ${trade.status}`);
        }
        const buyer = await this.prisma.user.findUnique({ where: { id: trade.buyerId } });
        let actualTxHash = txHash;
        if (trade.chain === 'MIDNIGHT') {
            actualTxHash = await this.midnightEscrowService.lockFunds(tradeId, buyer.walletAddress, Number(trade.assetAmount));
        }
        await this.escrowService.validateEscrowTx(trade.chain, tradeId, actualTxHash, Number(trade.assetAmount));
        const updated = await this.prisma.trade.update({
            where: { id: tradeId },
            data: { status: 'ESCROW_LOCKED', escrowTxHash: actualTxHash },
        });
        this.eventEmitter.emit('trade.status_changed', { tradeId, status: 'ESCROW_LOCKED' });
        return updated;
    }
    async markPaymentSent(tradeId, buyerId) {
        const trade = await this.getTradeIfParty(tradeId, buyerId);
        if (trade.buyerId !== buyerId) {
            throw new common_1.ForbiddenException('Only buyer can mark payment sent');
        }
        if (trade.status !== 'ESCROW_LOCKED') {
            throw new common_1.BadRequestException(`Cannot mark payment sent in status ${trade.status}`);
        }
        const updated = await this.prisma.trade.update({
            where: { id: tradeId },
            data: { status: 'PAYMENT_SENT' },
        });
        this.eventEmitter.emit('trade.status_changed', { tradeId, status: 'PAYMENT_SENT' });
        await this.tradesQueue.add('checkPaymentEscalation', { tradeId: trade.id }, { delay: 30 * 60 * 1000 });
        return updated;
    }
    async confirmPayment(tradeId, sellerId) {
        const trade = await this.getTradeIfParty(tradeId, sellerId);
        if (trade.sellerId !== sellerId) {
            throw new common_1.ForbiddenException('Only seller can confirm payment');
        }
        if (trade.status !== 'PAYMENT_SENT') {
            throw new common_1.BadRequestException(`Cannot confirm payment in status ${trade.status}`);
        }
        const updated = await this.prisma.trade.update({
            where: { id: tradeId },
            data: { status: 'COMPLETED', completedAt: new Date() },
        });
        this.eventEmitter.emit('trade.status_changed', { tradeId, status: 'COMPLETED' });
        this.eventEmitter.emit('trade.completed', { tradeId, buyerId: trade.buyerId, sellerId: trade.sellerId });
        return updated;
    }
    async cancelTrade(tradeId, userId) {
        const trade = await this.getTradeIfParty(tradeId, userId);
        if (trade.status !== 'PENDING') {
            throw new common_1.BadRequestException('Can only cancel PENDING trades');
        }
        const updated = await this.prisma.trade.update({
            where: { id: tradeId },
            data: { status: 'CANCELLED' },
        });
        this.eventEmitter.emit('trade.status_changed', { tradeId, status: 'CANCELLED' });
        this.eventEmitter.emit('trade.cancelled', { tradeId, userId });
        return updated;
    }
    async getActiveTrades(userId) {
        return this.prisma.trade.findMany({
            where: {
                OR: [{ buyerId: userId }, { sellerId: userId }],
                status: { in: ['PENDING', 'ESCROW_LOCKED', 'PAYMENT_SENT', 'DISPUTED'] },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getTrade(tradeId, userId) {
        return this.getTradeIfParty(tradeId, userId);
    }
    async getTradeIfParty(tradeId, userId) {
        const trade = await this.prisma.trade.findUnique({ where: { id: tradeId } });
        if (!trade)
            throw new common_1.NotFoundException('Trade not found');
        if (trade.buyerId !== userId && trade.sellerId !== userId) {
            throw new common_1.ForbiddenException('Not a party to this trade');
        }
        return trade;
    }
};
exports.TradesService = TradesService;
exports.TradesService = TradesService = TradesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(4, (0, bullmq_1.InjectQueue)('trades')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        aml_service_1.AmlService,
        escrow_service_1.EscrowService,
        event_emitter_1.EventEmitter2,
        bullmq_2.Queue,
        midnight_escrow_service_1.MidnightEscrowService])
], TradesService);
//# sourceMappingURL=trades.service.js.map