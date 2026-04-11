import { PrismaService } from '../core/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
export declare class ReputationService {
    private prisma;
    private eventEmitter;
    private readonly logger;
    constructor(prisma: PrismaService, eventEmitter: EventEmitter2);
    initialize(userId: string): Promise<void>;
    onTradeCompleted(payload: {
        tradeId: string;
        buyerId: string;
        sellerId: string;
    }): Promise<void>;
    onDisputeResolved(payload: {
        disputeId: string;
        tradeId: string;
        winnerId: string;
        loserId: string;
    }): Promise<void>;
    onTradeCancelled(payload: {
        tradeId: string;
        userId: string;
    }): Promise<void>;
    private updateScore;
    checkDisputeRate(userId: string): Promise<void>;
    getTier(userId: string): Promise<{
        tier: any;
        tradeCount: any;
        score: any;
    }>;
    getRepProof(userId: string, chain: 'midnight' | 'aleo' | 'fhenix'): Promise<{
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
}
