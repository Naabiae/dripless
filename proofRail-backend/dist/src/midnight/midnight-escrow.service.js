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
var MidnightEscrowService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MidnightEscrowService = void 0;
const common_1 = require("@nestjs/common");
const provider_service_1 = require("./provider.service");
const wallet_service_1 = require("./wallet.service");
const config_1 = require("@nestjs/config");
let MidnightEscrowService = MidnightEscrowService_1 = class MidnightEscrowService {
    provider;
    wallet;
    configService;
    logger = new common_1.Logger(MidnightEscrowService_1.name);
    contractAddress;
    constructor(provider, wallet, configService) {
        this.provider = provider;
        this.wallet = wallet;
        this.configService = configService;
        this.contractAddress = this.configService.get('MIDNIGHT_ESCROW_CONTRACT_ADDRESS') || null;
    }
    async deployEscrowContract() {
        this.logger.log('Deploying Escrow contract to Midnight Preprod...');
        this.contractAddress = '0xMockEscrowContractAddress';
        return this.contractAddress;
    }
    async lockFunds(tradeId, buyerWalletAddress, amountUsd) {
        this.logger.log(`Calling lockFunds circuit for trade ${tradeId} to lock $${amountUsd}`);
        await new Promise(r => setTimeout(r, 50));
        return `0xLockEscrowTx_${tradeId}`;
    }
    async releaseToBuyer(tradeId) {
        this.logger.log(`Calling releaseToBuyer circuit for trade ${tradeId}`);
        const secret = this.configService.get('MIDNIGHT_RELEASE_SECRET') || 'secret';
        return `0xReleaseBuyerTx_${tradeId}`;
    }
    async releaseToSeller(tradeId) {
        this.logger.log(`Calling releaseToSeller circuit for trade ${tradeId}`);
        return `0xReleaseSellerTx_${tradeId}`;
    }
    async cancelEscrow(tradeId, sellerWalletAddress) {
        this.logger.log(`Calling cancelEscrow circuit for trade ${tradeId} by ${sellerWalletAddress}`);
        return `0xCancelEscrowTx_${tradeId}`;
    }
    async getEscrowStatus(tradeId) {
        this.logger.log(`Reading on-chain escrow status for trade ${tradeId}`);
        return 'LOCKED';
    }
};
exports.MidnightEscrowService = MidnightEscrowService;
exports.MidnightEscrowService = MidnightEscrowService = MidnightEscrowService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [provider_service_1.ProviderService,
        wallet_service_1.WalletService,
        config_1.ConfigService])
], MidnightEscrowService);
//# sourceMappingURL=midnight-escrow.service.js.map