"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CredentialsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../core/prisma/prisma.service");
const config_1 = require("@nestjs/config");
const midnight_adapter_1 = require("./adapters/midnight.adapter");
const aleo_adapter_1 = require("./adapters/aleo.adapter");
const fhenix_adapter_1 = require("./adapters/fhenix.adapter");
const redis_service_1 = require("../core/redis/redis.service");
const midnight_kyc_service_1 = require("../midnight/midnight-kyc.service");
const crypto = __importStar(require("crypto"));
const event_emitter_1 = require("@nestjs/event-emitter");
let CredentialsService = class CredentialsService {
    prisma;
    configService;
    midnightAdapter;
    aleoAdapter;
    fhenixAdapter;
    redisService;
    midnightKycService;
    constructor(prisma, configService, midnightAdapter, aleoAdapter, fhenixAdapter, redisService, midnightKycService) {
        this.prisma = prisma;
        this.configService = configService;
        this.midnightAdapter = midnightAdapter;
        this.aleoAdapter = aleoAdapter;
        this.fhenixAdapter = fhenixAdapter;
        this.redisService = redisService;
        this.midnightKycService = midnightKycService;
    }
    async handleComplianceCleared(payload) {
        await this.issue(payload.userId);
    }
    async issue(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                complianceRecord: true,
            }
        });
        if (!user || !user.walletAddress || user.kycStatus !== 'APPROVED' || user.complianceRecord?.status !== 'CLEAR') {
            throw new common_1.ForbiddenException('User must have completed KYC and Compliance');
        }
        const secret = this.configService.get('CREDENTIAL_SECRET') || 'dev-secret';
        const expiryDays = Number(this.configService.get('CREDENTIAL_EXPIRY_DAYS')) || 365;
        const issuedAt = new Date();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiryDays);
        const credentialId = crypto.randomUUID();
        const claims = {
            kycVerified: true,
            kycTier: 1,
            regionAllowed: true,
            sanctionsClear: true,
            complianceStatus: 'CLEAR',
            ageVerified: true,
        };
        const payload = {
            credentialId,
            userId,
            walletAddress: user.walletAddress,
            issuedAt: Math.floor(issuedAt.getTime() / 1000),
            expiresAt: Math.floor(expiresAt.getTime() / 1000),
            claims,
        };
        const signature = crypto
            .createHmac('sha256', secret)
            .update(JSON.stringify(payload))
            .digest('hex');
        const formattedPayload = {
            ...payload,
            signature,
        };
        const midnightProof = this.midnightAdapter.format(formattedPayload);
        const aleoRecord = this.aleoAdapter.format(formattedPayload);
        const fhenixAttestation = this.fhenixAdapter.format(formattedPayload);
        const txHash = await this.midnightKycService.registerCredential(userId, formattedPayload);
        midnightProof.txHash = txHash;
        await this.prisma.credential.upsert({
            where: { userId },
            update: {
                walletAddress: user.walletAddress,
                claims: claims,
                signature,
                issuedAt,
                expiresAt,
                revokedAt: null,
                midnightProof: midnightProof,
                aleoRecord: aleoRecord,
                fhenixAttestation: fhenixAttestation,
            },
            create: {
                userId,
                walletAddress: user.walletAddress,
                claims: claims,
                signature,
                issuedAt,
                expiresAt,
                midnightProof: midnightProof,
                aleoRecord: aleoRecord,
                fhenixAttestation: fhenixAttestation,
            },
        });
        const client = this.redisService.getClient();
        await client.del(`credentials:midnight:${userId}`);
        await client.del(`credentials:aleo:${userId}`);
        await client.del(`credentials:fhenix:${userId}`);
        return formattedPayload;
    }
    async getCredential(userId) {
        const cred = await this.prisma.credential.findUnique({
            where: { userId },
        });
        if (!cred || cred.revokedAt || cred.expiresAt < new Date()) {
            throw new common_1.ForbiddenException('Valid credential not found');
        }
        return cred;
    }
    async revoke(userId) {
        const cred = await this.prisma.credential.findUnique({ where: { userId } });
        if (cred) {
            await this.midnightKycService.revokeCredential(cred.walletAddress);
        }
        await this.prisma.credential.update({
            where: { userId },
            data: { revokedAt: new Date() },
        });
        const client = this.redisService.getClient();
        await client.del(`credentials:midnight:${userId}`);
        await client.del(`credentials:aleo:${userId}`);
        await client.del(`credentials:fhenix:${userId}`);
    }
    async refresh(userId) {
        return this.issue(userId);
    }
    async getFormattedProof(userId, chain) {
        const cacheKey = `credentials:${chain}:${userId}`;
        const client = this.redisService.getClient();
        const cached = await client.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
        const cred = await this.getCredential(userId);
        let result;
        if (chain === 'midnight')
            result = cred.midnightProof;
        if (chain === 'aleo')
            result = cred.aleoRecord;
        if (chain === 'fhenix')
            result = cred.fhenixAttestation;
        if (!result) {
            throw new common_1.NotFoundException(`Proof for chain ${chain} not found`);
        }
        const ttlSeconds = Math.max(1, Math.floor((cred.expiresAt.getTime() - Date.now()) / 1000));
        await client.set(cacheKey, JSON.stringify(result), 'EX', ttlSeconds);
        return result;
    }
};
exports.CredentialsService = CredentialsService;
__decorate([
    (0, event_emitter_1.OnEvent)('compliance.cleared'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CredentialsService.prototype, "handleComplianceCleared", null);
exports.CredentialsService = CredentialsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        midnight_adapter_1.MidnightAdapter,
        aleo_adapter_1.AleoAdapter,
        fhenix_adapter_1.FhenixAdapter,
        redis_service_1.RedisService,
        midnight_kyc_service_1.MidnightKycService])
], CredentialsService);
//# sourceMappingURL=credentials.service.js.map