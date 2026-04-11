"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MidnightModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const provider_service_1 = require("./provider.service");
const wallet_service_1 = require("./wallet.service");
const midnight_kyc_service_1 = require("./midnight-kyc.service");
const midnight_escrow_service_1 = require("./midnight-escrow.service");
let MidnightModule = class MidnightModule {
};
exports.MidnightModule = MidnightModule;
exports.MidnightModule = MidnightModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [config_1.ConfigModule],
        providers: [
            provider_service_1.ProviderService,
            wallet_service_1.WalletService,
            midnight_kyc_service_1.MidnightKycService,
            midnight_escrow_service_1.MidnightEscrowService,
        ],
        exports: [
            provider_service_1.ProviderService,
            wallet_service_1.WalletService,
            midnight_kyc_service_1.MidnightKycService,
            midnight_escrow_service_1.MidnightEscrowService,
        ],
    })
], MidnightModule);
//# sourceMappingURL=midnight.module.js.map