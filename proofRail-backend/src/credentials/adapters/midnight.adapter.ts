import { Injectable } from '@nestjs/common';

@Injectable()
export class MidnightAdapter {
  format(credential: any) {
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
}
