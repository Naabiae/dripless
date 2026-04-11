import { Chain } from '@prisma/client';
import { MidnightEscrowService } from '../midnight/midnight-escrow.service';
export declare class EscrowService {
    private midnightEscrowService;
    private readonly logger;
    constructor(midnightEscrowService: MidnightEscrowService);
    validateEscrowTx(chain: Chain, tradeId: string, txHash: string, expectedAmount: number): Promise<boolean>;
    releaseInstruction(tradeId: string, resolution?: 'BUYER' | 'SELLER'): Promise<{
        tradeId: string;
        action: string;
        recipient: "BUYER" | "SELLER";
        timestamp: number;
        txHash: string;
    }>;
}
