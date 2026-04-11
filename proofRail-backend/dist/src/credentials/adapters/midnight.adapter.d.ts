export declare class MidnightAdapter {
    format(credential: any): {
        witness: {
            kyc_verified: number;
            region_ok: number;
            sanctions_clear: number;
            tier: any;
        };
        proofHint: {
            issuerSignature: any;
            credentialId: any;
        };
    };
}
