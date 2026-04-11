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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReputationController = void 0;
const common_1 = require("@nestjs/common");
const reputation_service_1 = require("./reputation.service");
const jwt_auth_guard_1 = require("../core/guards/jwt-auth.guard");
const swagger_1 = require("@nestjs/swagger");
let ReputationController = class ReputationController {
    reputationService;
    constructor(reputationService) {
        this.reputationService = reputationService;
    }
    getTier(req) {
        return this.reputationService.getTier(req.user.id);
    }
    getRepProof(chain, req) {
        return this.reputationService.getRepProof(req.user.id, chain);
    }
    async getPublicReputation(walletAddress) {
        const user = await this.reputationService['prisma'].user.findUnique({
            where: { walletAddress: walletAddress.toLowerCase() },
            include: { reputation: true }
        });
        if (!user || !user.reputation) {
            return { tier: 'BRONZE', tradeCount: 0 };
        }
        return {
            tier: user.reputation.tier,
            tradeCount: user.reputation.completedTrades,
        };
    }
};
exports.ReputationController = ReputationController;
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ReputationController.prototype, "getTier", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('me/:chain'),
    __param(0, (0, common_1.Param)('chain')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ReputationController.prototype, "getRepProof", null);
__decorate([
    (0, common_1.Get)('user/:walletAddress'),
    __param(0, (0, common_1.Param)('walletAddress')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReputationController.prototype, "getPublicReputation", null);
exports.ReputationController = ReputationController = __decorate([
    (0, swagger_1.ApiTags)('Reputation'),
    (0, common_1.Controller)('reputation'),
    __metadata("design:paramtypes", [reputation_service_1.ReputationService])
], ReputationController);
//# sourceMappingURL=reputation.controller.js.map