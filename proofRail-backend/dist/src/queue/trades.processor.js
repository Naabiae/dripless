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
var TradesProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradesProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const prisma_service_1 = require("../core/prisma/prisma.service");
const event_emitter_1 = require("@nestjs/event-emitter");
const common_1 = require("@nestjs/common");
let TradesProcessor = TradesProcessor_1 = class TradesProcessor extends bullmq_1.WorkerHost {
    prisma;
    eventEmitter;
    logger = new common_1.Logger(TradesProcessor_1.name);
    constructor(prisma, eventEmitter) {
        super();
        this.prisma = prisma;
        this.eventEmitter = eventEmitter;
    }
    async process(job) {
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
        }
        else if (job.name === 'checkPaymentEscalation') {
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
};
exports.TradesProcessor = TradesProcessor;
exports.TradesProcessor = TradesProcessor = TradesProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('trades'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        event_emitter_1.EventEmitter2])
], TradesProcessor);
//# sourceMappingURL=trades.processor.js.map