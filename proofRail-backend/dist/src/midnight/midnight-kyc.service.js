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
var MidnightKycService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MidnightKycService = void 0;
const common_1 = require("@nestjs/common");
const provider_service_1 = require("./provider.service");
const wallet_service_1 = require("./wallet.service");
const config_1 = require("@nestjs/config");
let MidnightKycService = MidnightKycService_1 = class MidnightKycService {
    provider;
    wallet;
    configService;
    logger = new common_1.Logger(MidnightKycService_1.name);
    contractAddress;
    constructor(provider, wallet, configService) {
        this.provider = provider;
        this.wallet = wallet;
        this.configService = configService;
        this.contractAddress = this.configService.get('MIDNIGHT_KYC_CONTRACT_ADDRESS') || null;
    }
    async deployKycContract() {
        this.logger.log('Deploying KYC contract to Midnight Preprod...');
        this.contractAddress = '0xMockKycContractAddress';
        return this.contractAddress;
    }
    async registerCredential(userId, credential) {
        this.logger.log(`Registering credential for user ${userId} on Midnight...`);
        const txHash = `0xMockTxHash_Register_${userId}`;
        return txHash;
    }
    async verifyCredential(userId, walletAddress, credential) {
        this.logger.log(`Verifying credential for wallet ${walletAddress} on Midnight...`);
        const txHash = `0xMockTxHash_Verify_${userId}`;
        return txHash;
    }
    async isVerified(walletAddress) {
        this.logger.log(`Checking if wallet ${walletAddress} is verified on-chain...`);
        return !!walletAddress;
    }
    async revokeCredential(walletAddress) {
        this.logger.log(`Revoking credential for wallet ${walletAddress}...`);
        return `0xMockTxHash_Revoke_${walletAddress}`;
    }
};
exports.MidnightKycService = MidnightKycService;
exports.MidnightKycService = MidnightKycService = MidnightKycService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [provider_service_1.ProviderService,
        wallet_service_1.WalletService,
        config_1.ConfigService])
], MidnightKycService);
//# sourceMappingURL=midnight-kyc.service.js.map