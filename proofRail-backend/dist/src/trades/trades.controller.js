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
exports.TradesController = void 0;
const common_1 = require("@nestjs/common");
const trades_service_1 = require("./trades.service");
const create_trade_dto_1 = require("./dto/create-trade.dto");
const confirm_payment_dto_1 = require("./dto/confirm-payment.dto");
const jwt_auth_guard_1 = require("../core/guards/jwt-auth.guard");
const kyc_verified_guard_1 = require("../core/guards/kyc-verified.guard");
const swagger_1 = require("@nestjs/swagger");
const compliance_service_1 = require("../compliance/compliance.service");
let TradesController = class TradesController {
    tradesService;
    complianceService;
    constructor(tradesService, complianceService) {
        this.tradesService = tradesService;
        this.complianceService = complianceService;
    }
    async createTrade(req, dto) {
        const compliance = await this.complianceService.getStatus(req.user.id);
        if (compliance.status !== 'CLEAR') {
            throw new common_1.ForbiddenException('Compliance status must be CLEAR to trade');
        }
        return this.tradesService.createTrade(req.user.id, dto);
    }
    lockEscrow(tradeId, req, dto) {
        return this.tradesService.lockEscrow(tradeId, req.user.id, dto.txHash);
    }
    markPaymentSent(tradeId, req) {
        return this.tradesService.markPaymentSent(tradeId, req.user.id);
    }
    confirmPayment(tradeId, req) {
        return this.tradesService.confirmPayment(tradeId, req.user.id);
    }
    cancelTrade(tradeId, req) {
        return this.tradesService.cancelTrade(tradeId, req.user.id);
    }
    getActiveTrades(req) {
        return this.tradesService.getActiveTrades(req.user.id);
    }
    getTrade(tradeId, req) {
        return this.tradesService.getTrade(tradeId, req.user.id);
    }
};
exports.TradesController = TradesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_trade_dto_1.CreateTradeDto]),
    __metadata("design:returntype", Promise)
], TradesController.prototype, "createTrade", null);
__decorate([
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.Post)(':id/lock-escrow'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, confirm_payment_dto_1.LockEscrowDto]),
    __metadata("design:returntype", void 0)
], TradesController.prototype, "lockEscrow", null);
__decorate([
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.Post)(':id/payment-sent'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TradesController.prototype, "markPaymentSent", null);
__decorate([
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.Post)(':id/confirm-payment'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TradesController.prototype, "confirmPayment", null);
__decorate([
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.Post)(':id/cancel'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TradesController.prototype, "cancelTrade", null);
__decorate([
    (0, common_1.Get)('active'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TradesController.prototype, "getActiveTrades", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TradesController.prototype, "getTrade", null);
exports.TradesController = TradesController = __decorate([
    (0, swagger_1.ApiTags)('Trades'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, kyc_verified_guard_1.KycVerifiedGuard),
    (0, common_1.Controller)('trades'),
    __metadata("design:paramtypes", [trades_service_1.TradesService,
        compliance_service_1.ComplianceService])
], TradesController);
//# sourceMappingURL=trades.controller.js.map