export declare class FhenixAdapter {
    format(credential: any): {
        encryptedClaims: {
            payload: string;
            algorithm: string;
        };
        attestationHash: any;
    };
}
