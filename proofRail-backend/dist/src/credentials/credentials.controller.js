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
exports.CredentialsController = void 0;
const common_1 = require("@nestjs/common");
const credentials_service_1 = require("./credentials.service");
const jwt_auth_guard_1 = require("../core/guards/jwt-auth.guard");
const kyc_verified_guard_1 = require("../core/guards/kyc-verified.guard");
const swagger_1 = require("@nestjs/swagger");
let CredentialsController = class CredentialsController {
    credentialsService;
    constructor(credentialsService) {
        this.credentialsService = credentialsService;
    }
    getCredential(req) {
        return this.credentialsService.getCredential(req.user.id);
    }
    getMidnightProof(req) {
        return this.credentialsService.getFormattedProof(req.user.id, 'midnight');
    }
    getAleoProof(req) {
        return this.credentialsService.getFormattedProof(req.user.id, 'aleo');
    }
    getFhenixProof(req) {
        return this.credentialsService.getFormattedProof(req.user.id, 'fhenix');
    }
};
exports.CredentialsController = CredentialsController;
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CredentialsController.prototype, "getCredential", null);
__decorate([
    (0, common_1.Get)('midnight'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CredentialsController.prototype, "getMidnightProof", null);
__decorate([
    (0, common_1.Get)('aleo'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CredentialsController.prototype, "getAleoProof", null);
__decorate([
    (0, common_1.Get)('fhenix'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CredentialsController.prototype, "getFhenixProof", null);
exports.CredentialsController = CredentialsController = __decorate([
    (0, swagger_1.ApiTags)('Credentials'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, kyc_verified_guard_1.KycVerifiedGuard),
    (0, common_1.Controller)('credentials'),
    __metadata("design:paramtypes", [credentials_service_1.CredentialsService])
], CredentialsController);
//# sourceMappingURL=credentials.controller.js.map