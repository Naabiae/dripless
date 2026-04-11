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
var KycService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KycService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../core/prisma/prisma.service");
const config_1 = require("@nestjs/config");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const crypto_1 = require("crypto");
const event_emitter_1 = require("@nestjs/event-emitter");
const schedule_1 = require("@nestjs/schedule");
const redis_service_1 = require("../core/redis/redis.service");
let KycService = KycService_1 = class KycService {
    prisma;
    configService;
    kycQueue;
    eventEmitter;
    redisService;
    logger = new common_1.Logger(KycService_1.name);
    constructor(prisma, configService, kycQueue, eventEmitter, redisService) {
        this.prisma = prisma;
        this.configService = configService;
        this.kycQueue = kycQueue;
        this.eventEmitter = eventEmitter;
        this.redisService = redisService;
    }
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
    async createSession(userId) {
        const existing = await this.prisma.kycSession.findFirst({
            where: { userId, status: 'IN_PROGRESS' },
        });
        if (existing) {
            return { verificationUrl: `https://mock.didit.me/${existing.sessionId}` };
        }
        const apiKey = this.configService.get('DIDIT_API_KEY');
        const baseUrl = this.configService.get('DIDIT_BASE_URL');
        let sessionId;
        let verificationUrl;
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
            }
            catch (error) {
                this.logger.error('Failed to create Didit session', error);
                throw new common_1.InternalServerErrorException('KYC service unavailable');
            }
        }
        else {
            sessionId = (0, crypto_1.randomUUID)();
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
    async getStatus(userId) {
        const session = await this.prisma.kycSession.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        return session || { status: 'NOT_STARTED' };
    }
    async processWebhook(payload) {
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
        let newStatus = 'IN_REVIEW';
        if (decision?.status === 'Approved')
            newStatus = 'APPROVED';
        if (decision?.status === 'Declined')
            newStatus = 'DECLINED';
        await this.prisma.kycSession.update({
            where: { id: session.id },
            data: {
                status: newStatus,
                decisionData: payload,
            },
        });
        await this.redisService.getClient().set(idempotencyKey, 'true', 'EX', 86400);
        if (newStatus === 'APPROVED') {
            await this.prisma.user.update({
                where: { id: session.userId },
                data: { kycStatus: 'APPROVED' },
            });
            this.eventEmitter.emit('kyc.approved', { userId: session.userId });
        }
    }
};
exports.KycService = KycService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_30_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], KycService.prototype, "handleAbandonedSessions", null);
exports.KycService = KycService = KycService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, bullmq_1.InjectQueue)('kyc')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        bullmq_2.Queue,
        event_emitter_1.EventEmitter2,
        redis_service_1.RedisService])
], KycService);
//# sourceMappingURL=kyc.service.js.map