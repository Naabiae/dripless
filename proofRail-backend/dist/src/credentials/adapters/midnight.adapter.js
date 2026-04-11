"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MidnightAdapter = void 0;
const common_1 = require("@nestjs/common");
let MidnightAdapter = class MidnightAdapter {
    format(credential) {
        const claims = credential.claims;
        return {
            witness: {
                kyc_verified: claims.kycVerified ? 1 : 0,
                region_ok: claims.regionAllowed ? 1 : 0,
                sanctions_clear: claims.sanctionsClear ? 1 : 0,
                tier: claims.kycTier,
            },
            proofHint: {
                issuerSignature: credential.signature,
                credentialId: credential.credentialId,
            }
        };
    }
};
exports.MidnightAdapter = MidnightAdapter;
exports.MidnightAdapter = MidnightAdapter = __decorate([
    (0, common_1.Injectable)()
], MidnightAdapter);
//# sourceMappingURL=midnight.adapter.js.map