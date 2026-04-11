import { ProviderService } from './provider.service';
import { WalletService } from './wallet.service';
import { ConfigService } from '@nestjs/config';
export declare class MidnightKycService {
    private provider;
    private wallet;
    private configService;
    private readonly logger;
    private contractAddress;
    constructor(provider: ProviderService, wallet: WalletService, configService: ConfigService);
    deployKycContract(): Promise<string>;
    registerCredential(userId: string, credential: any): Promise<string>;
    verifyCredential(userId: string, walletAddress: string, credential: any): Promise<string>;
    isVerified(walletAddress: string): Promise<boolean>;
    revokeCredential(walletAddress: string): Promise<string>;
}
