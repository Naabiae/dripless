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
var SanctionsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SanctionsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let SanctionsService = SanctionsService_1 = class SanctionsService {
    configService;
    logger = new common_1.Logger(SanctionsService_1.name);
    constructor(configService) {
        this.configService = configService;
    }
    async screen(userId, kycData) {
        const apiKey = this.configService.get('OPENSANCTIONS_API_KEY');
        const name = `${kycData?.decision?.first_name || ''} ${kycData?.decision?.last_name || ''}`.trim();
        if (!name) {
            this.logger.warn(`No name provided for sanctions check on user ${userId}`);
            return { status: 'FLAGGED', result: { reason: 'No name provided' } };
        }
        if (apiKey) {
            try {
                const response = await fetch(`https://api.opensanctions.org/match/default?api_key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        queries: {
                            q1: {
                                schema: 'Person',
                                properties: {
                                    name: [name],
                                }
                            }
                        }
                    })
                });
                if (response.ok) {
                    const data = await response.json();
                    const match = data.responses?.q1?.results?.length > 0;
                    return {
                        status: match ? 'FLAGGED' : 'CLEAR',
                        result: data.responses?.q1
                    };
                }
            }
            catch (error) {
                this.logger.error(`OpenSanctions API error for user ${userId}`, error);
            }
        }
        if (name.toLowerCase().includes('sanctioned')) {
            return { status: 'FLAGGED', result: { reason: 'Mock sanctioned name match' } };
        }
        return { status: 'CLEAR', result: { reason: 'Mock clean name' } };
    }
};
exports.SanctionsService = SanctionsService;
exports.SanctionsService = SanctionsService = SanctionsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SanctionsService);
//# sourceMappingURL=sanctions.service.js.map