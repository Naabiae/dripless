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
exports.DisputesController = void 0;
const common_1 = require("@nestjs/common");
const disputes_service_1 = require("./disputes.service");
const raise_dispute_dto_1 = require("./dto/raise-dispute.dto");
const jwt_auth_guard_1 = require("../core/guards/jwt-auth.guard");
const swagger_1 = require("@nestjs/swagger");
const roles_guard_1 = require("../core/guards/roles.guard");
const roles_decorator_1 = require("../core/decorators/roles.decorator");
let DisputesController = class DisputesController {
    disputesService;
    constructor(disputesService) {
        this.disputesService = disputesService;
    }
    raiseDispute(req, dto) {
        return this.disputesService.raise(req.user.id, dto);
    }
    submitEvidence(disputeId, req, dto) {
        return this.disputesService.submitEvidence(disputeId, req.user.id, dto);
    }
    getDispute(disputeId, req) {
        return this.disputesService.getDispute(disputeId, req.user.id, req.user.role);
    }
    resolveDispute(disputeId, req, dto) {
        return this.disputesService.resolve(disputeId, req.user.id, dto);
    }
    listOpenDisputes() {
        return this.disputesService.listOpen();
    }
};
exports.DisputesController = DisputesController;
__decorate([
    (0, common_1.Post)('disputes'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, raise_dispute_dto_1.RaiseDisputeDto]),
    __metadata("design:returntype", void 0)
], DisputesController.prototype, "raiseDispute", null);
__decorate([
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.Post)('disputes/:id/evidence'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, raise_dispute_dto_1.SubmitEvidenceDto]),
    __metadata("design:returntype", void 0)
], DisputesController.prototype, "submitEvidence", null);
__decorate([
    (0, common_1.Get)('disputes/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DisputesController.prototype, "getDispute", null);
__decorate([
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.Post)('admin/disputes/:id/resolve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, raise_dispute_dto_1.ResolveDisputeDto]),
    __metadata("design:returntype", void 0)
], DisputesController.prototype, "resolveDispute", null);
__decorate([
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, common_1.Get)('admin/disputes'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DisputesController.prototype, "listOpenDisputes", null);
exports.DisputesController = DisputesController = __decorate([
    (0, swagger_1.ApiTags)('Disputes'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [disputes_service_1.DisputesService])
], DisputesController);
//# sourceMappingURL=disputes.controller.js.map