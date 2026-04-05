import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WalletService implements OnModuleInit {
  private readonly logger = new Logger(WalletService.name);
  private walletAddress: string;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const seed = this.configService.get<string>('MIDNIGHT_WALLET_SEED');
    if (!seed) {
      this.logger.warn('MIDNIGHT_WALLET_SEED is not set. Midnight admin transactions will fail.');
    }
    // Mock wallet initialization
    this.walletAddress = '0xMockMidnightWalletAddress';
    this.logger.log(`Initialized Midnight wallet: ${this.walletAddress}`);
  }

  getWallet() {
    return {
      address: this.walletAddress,
      sign: async (data: string) => `mock-signature-${data}`,
    };
  }

  getAddress(): string {
    return this.walletAddress;
  }

  async getBalance(): Promise<number> {
    // Mock balance
    return 1000;
  }
}
