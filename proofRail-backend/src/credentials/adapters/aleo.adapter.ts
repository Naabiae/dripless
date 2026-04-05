import { Injectable } from '@nestjs/common';

@Injectable()
export class AleoAdapter {
  format(credential: any) {
    const claims = credential.claims;
    
    // Leo record structure mock format
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
}
