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
var EscrowService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EscrowService = void 0;
const common_1 = require("@nestjs/common");
const midnight_escrow_service_1 = require("../midnight/midnight-escrow.service");
let EscrowService = EscrowService_1 = class EscrowService {
    midnightEscrowService;
    logger = new common_1.Logger(EscrowService_1.name);
    constructor(midnightEscrowService) {
        this.midnightEscrowService = midnightEscrowService;
    }
    async validateEscrowTx(chain, tradeId, txHash, expectedAmount) {
        this.logger.log(`Validating escrow tx ${txHash} on ${chain} for amount ${expectedAmount}`);
        if (chain === 'MIDNIGHT') {
            const status = await this.midnightEscrowService.getEscrowStatus(tradeId);
            if (status !== 'LOCKED') {
                throw new common_1.BadRequestException('On-chain escrow is not LOCKED');
            }
        }
        return true;
    }
    async releaseInstruction(tradeId, resolution) {
        this.logger.log(`Generating release instruction for trade ${tradeId} to ${resolution || 'BUYER'}`);
        let txHash = null;
        if (resolution === 'SELLER') {
            txHash = await this.midnightEscrowService.releaseToSeller(tradeId);
        }
        else {
            txHash = await this.midnightEscrowService.releaseToBuyer(tradeId);
        }
        return {
            tradeId,
            action: 'RELEASE',
            recipient: resolution || 'BUYER',
            timestamp: Date.now(),
            txHash,
        };
    }
};
exports.EscrowService = EscrowService;
exports.EscrowService = EscrowService = EscrowService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [midnight_escrow_service_1.MidnightEscrowService])
], EscrowService);
//# sourceMappingURL=escrow.service.js.map