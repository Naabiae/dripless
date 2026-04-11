import { ProviderService } from './provider.service';
import { WalletService } from './wallet.service';
import { ConfigService } from '@nestjs/config';
export declare class MidnightEscrowService {
    private provider;
    private wallet;
    private configService;
    private readonly logger;
    private contractAddress;
    constructor(provider: ProviderService, wallet: WalletService, configService: ConfigService);
    deployEscrowContract(): Promise<string>;
    lockFunds(tradeId: string, buyerWalletAddress: string, amountUsd: number): Promise<string>;
    releaseToBuyer(tradeId: string): Promise<string>;
    releaseToSeller(tradeId: string): Promise<string>;
    cancelEscrow(tradeId: string, sellerWalletAddress: string): Promise<string>;
    getEscrowStatus(tradeId: string): Promise<string>;
}
