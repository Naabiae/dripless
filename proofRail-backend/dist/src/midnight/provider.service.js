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
var ProviderService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let ProviderService = ProviderService_1 = class ProviderService {
    configService;
    logger = new common_1.Logger(ProviderService_1.name);
    constructor(configService) {
        this.configService = configService;
    }
    async onModuleInit() {
        this.logger.log('Checking proof server connection...');
        const proofServerUrl = this.configService.get('MIDNIGHT_PROOF_SERVER_URL') || 'http://localhost:6300';
        try {
            const response = await fetch(`${proofServerUrl}/health`);
            if (response.ok) {
                this.logger.log('Proof server is online.');
            }
            else {
                this.logger.warn(`Proof server returned status: ${response.status}`);
            }
        }
        catch (e) {
            this.logger.warn(`Failed to connect to proof server at ${proofServerUrl}. Ensure it is running.`);
        }
    }
    getProofServerUrl() {
        return this.configService.get('MIDNIGHT_PROOF_SERVER_URL') || 'http://localhost:6300';
    }
    getIndexerUrl() {
        return this.configService.get('MIDNIGHT_INDEXER_URL') || 'https://indexer.preprod.midnight.network';
    }
    getNodeUrl() {
        return this.configService.get('MIDNIGHT_NODE_URL') || 'https://rpc.preprod.midnight.network';
    }
};
exports.ProviderService = ProviderService;
exports.ProviderService = ProviderService = ProviderService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ProviderService);
//# sourceMappingURL=provider.service.js.map