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
var ReputationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReputationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../core/prisma/prisma.service");
const event_emitter_1 = require("@nestjs/event-emitter");
let ReputationService = ReputationService_1 = class ReputationService {
    prisma;
    eventEmitter;
    logger = new common_1.Logger(ReputationService_1.name);
    constructor(prisma, eventEmitter) {
        this.prisma = prisma;
        this.eventEmitter = eventEmitter;
    }
    async initialize(userId) {
        const existing = await this.prisma.reputation.findUnique({ where: { userId } });
        if (!existing) {
            await this.prisma.reputation.create({
                data: { userId }
            });
        }
    }
    async onTradeCompleted(payload) {
        await this.updateScore(payload.buyerId, { completedTrades: 1, scoreDelta: 10 });
        await this.updateScore(payload.sellerId, { completedTrades: 1, scoreDelta: 10 });
    }
    async onDisputeResolved(payload) {
        await this.updateScore(payload.winnerId, { disputesWon: 1, scoreDelta: 15 });
        await this.updateScore(payload.loserId, { disputesLost: 1, scoreDelta: -20 });
        await this.checkDisputeRate(payload.loserId);
    }
    async onTradeCancelled(payload) {
        await this.updateScore(payload.userId, { cancelledTrades: 1, scoreDelta: -5 });
    }
    async updateScore(userId, update) {
        await this.initialize(userId);
        const current = await this.prisma.reputation.findUnique({ where: { userId } });
        if (!current)
            return;
        let newScore = current.score + update.scoreDelta;
        if (newScore < 0)
            newScore = 0;
        if (newScore > 1000)
            newScore = 1000;
        let newTier = current.tier;
        if (newScore >= 600)
            newTier = 'PLATINUM';
        else if (newScore >= 300)
            newTier = 'GOLD';
        else if (newScore >= 100)
            newTier = 'SILVER';
        else
            newTier = 'BRONZE';
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
    async checkDisputeRate(userId) {
        const rep = await this.prisma.reputation.findUnique({ where: { userId } });
        if (!rep)
            return;
        const totalTrades = rep.completedTrades + rep.disputesLost + rep.disputesWon;
        if (totalTrades > 5) {
            const rate = rep.disputesLost / totalTrades;
            if (rate > 0.10) {
                this.logger.warn(`User ${userId} dispute rate > 10%. Flagging compliance.`);
                this.eventEmitter.emit('compliance.flagged', { userId, reason: 'Dispute rate > 10%' });
            }
        }
    }
    async getTier(userId) {
        const rep = await this.prisma.reputation.findUnique({ where: { userId } });
        if (!rep)
            return { tier: 'BRONZE', tradeCount: 0, score: 0 };
        return { tier: rep.tier, tradeCount: rep.completedTrades, score: rep.score };
    }
    async getRepProof(userId, chain) {
        const rep = await this.prisma.reputation.findUnique({ where: { userId } });
        if (!rep)
            return null;
        const totalTrades = rep.completedTrades + rep.disputesLost + rep.disputesWon;
        const disputeRate = totalTrades > 0 ? rep.disputesLost / totalTrades : 0;
        const proofClaims = {
            tier: rep.tier,
            tradeCount: rep.completedTrades,
            disputeRateOk: disputeRate <= 0.10
        };
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
};
exports.ReputationService = ReputationService;
__decorate([
    (0, event_emitter_1.OnEvent)('trade.completed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReputationService.prototype, "onTradeCompleted", null);
__decorate([
    (0, event_emitter_1.OnEvent)('dispute.resolved'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReputationService.prototype, "onDisputeResolved", null);
__decorate([
    (0, event_emitter_1.OnEvent)('trade.cancelled'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReputationService.prototype, "onTradeCancelled", null);
exports.ReputationService = ReputationService = ReputationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        event_emitter_1.EventEmitter2])
], ReputationService);
//# sourceMappingURL=reputation.service.js.map