"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AleoAdapter = void 0;
const common_1 = require("@nestjs/common");
let AleoAdapter = class AleoAdapter {
    format(credential) {
        const claims = credential.claims;
        const recordStr = `{
      owner: ${credential.walletAddress},
      data: {
        kyc_verified: ${claims.kycVerified ? 'true' : 'false'},
        tier: ${claims.kycTier}u8,
        region_allowed: ${claims.regionAllowed ? 'true' : 'false'},
        sanctions_clear: ${claims.sanctionsClear ? 'true' : 'false'}
      }
    }`;
        return {
            record: recordStr,
            programId: "proof_rail_kyc.aleo",
        };
    }
};
exports.AleoAdapter = AleoAdapter;
exports.AleoAdapter = AleoAdapter = __decorate([
    (0, common_1.Injectable)()
], AleoAdapter);
//# sourceMappingURL=aleo.adapter.js.map