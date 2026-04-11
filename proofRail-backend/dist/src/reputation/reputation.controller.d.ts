import { ReputationService } from './reputation.service';
export declare class ReputationController {
    private readonly reputationService;
    constructor(reputationService: ReputationService);
    getTier(req: any): Promise<{
        tier: any;
        tradeCount: any;
        score: any;
    }>;
    getRepProof(chain: 'midnight' | 'aleo' | 'fhenix', req: any): Promise<{
        tier: any;
        tradeCount: any;
        disputeRateOk: boolean;
    } | {
        witness: {
            tier: any;
            tradeCount: any;
            disputeRateOk: number;
        };
        record?: undefined;
        encryptedClaims?: undefined;
    } | {
        record: string;
        witness?: undefined;
        encryptedClaims?: undefined;
    } | {
        encryptedClaims: {
            payload: string;
        };
        witness?: undefined;
        record?: undefined;
    } | null>;
    getPublicReputation(walletAddress: string): Promise<{
        tier: any;
        tradeCount: any;
    }>;
}
