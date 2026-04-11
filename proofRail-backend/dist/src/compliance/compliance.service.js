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
var ComplianceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplianceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../core/prisma/prisma.service");
const event_emitter_1 = require("@nestjs/event-emitter");
const sanctions_service_1 = require("./sanctions.service");
const aml_service_1 = require("./aml.service");
let ComplianceService = ComplianceService_1 = class ComplianceService {
    prisma;
    sanctionsService;
    amlService;
    eventEmitter;
    logger = new common_1.Logger(ComplianceService_1.name);
    constructor(prisma, sanctionsService, amlService, eventEmitter) {
        this.prisma = prisma;
        this.sanctionsService = sanctionsService;
        this.amlService = amlService;
        this.eventEmitter = eventEmitter;
    }
    async runFullCheck(userId) {
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
        let status = 'CLEAR';
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
        }
        else {
            this.eventEmitter.emit('compliance.flagged', { userId, reason: flagReason });
        }
        return record;
    }
    async getStatus(userId) {
        const record = await this.prisma.complianceRecord.findUnique({
            where: { userId },
            select: { status: true, flagReason: true, lastCheckedAt: true },
        });
        return record || { status: 'PENDING_REVIEW' };
    }
    async flagUser(userId, reason) {
        await this.prisma.complianceRecord.update({
            where: { userId },
            data: { status: 'FLAGGED', flagReason: reason },
        });
        this.eventEmitter.emit('compliance.flagged', { userId, reason });
    }
    async blockUser(userId, adminId) {
        await this.prisma.complianceRecord.update({
            where: { userId },
            data: { status: 'BLOCKED', reviewedBy: adminId },
        });
        this.eventEmitter.emit('compliance.blocked', { userId });
    }
    async clearUser(userId, adminId) {
        await this.prisma.complianceRecord.update({
            where: { userId },
            data: { status: 'CLEAR', reviewedBy: adminId, flagReason: null },
        });
        this.eventEmitter.emit('compliance.cleared', { userId });
    }
};
exports.ComplianceService = ComplianceService;
exports.ComplianceService = ComplianceService = ComplianceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        sanctions_service_1.SanctionsService,
        aml_service_1.AmlService,
        event_emitter_1.EventEmitter2])
], ComplianceService);
//# sourceMappingURL=compliance.service.js.map