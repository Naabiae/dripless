import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as ledger from '@midnight-ntwrk/ledger-v8';
import { HDWallet, Roles } from '@midnight-ntwrk/wallet-sdk-hd';
import { createKeystore, type UnshieldedKeystore } from '@midnight-ntwrk/wallet-sdk-unshielded-wallet';
import { setNetworkId, getNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { Buffer } from 'buffer';

@Injectable()
export class WalletService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WalletService.name);
  private shieldedSecretKeys: ledger.ZswapSecretKeys | null = null;
  private dustSecretKey: ledger.DustSecretKey | null = null;
  private unshieldedKeystore: UnshieldedKeystore | null = null;
  private walletAddress: string = '';
  private dustAddress: string = '';

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const seed = this.configService.get<string>('MIDNIGHT_WALLET_SEED');
    if (!seed) {
      this.logger.warn('MIDNIGHT_WALLET_SEED is not set. Midnight admin transactions will fail.');
      return;
    }

    try {
      setNetworkId('prepod');
      await this.initializeWallet(seed);
    } catch (error) {
      this.logger.error('Failed to initialize Midnight wallet', error);
    }
  }

  async onModuleDestroy() {
    this.logger.log('Midnight wallet service shutting down');
  }

  private deriveKeysFromSeed(seed: string) {
    const hdWallet = HDWallet.fromSeed(Buffer.from(seed, 'hex'));
    if (hdWallet.type !== 'seedOk') {
      throw new Error('Failed to initialize HDWallet from seed');
    }

    const derivationResult = hdWallet.hdWallet
      .selectAccount(0)
      .selectRoles([Roles.Zswap, Roles.NightExternal, Roles.Dust])
      .deriveKeysAt(0);

    if (derivationResult.type !== 'keysDerived') {
      throw new Error('Failed to derive keys');
    }

    hdWallet.hdWallet.clear();
    return derivationResult.keys;
  }

  private async initializeWallet(seed: string) {
    const keys = this.deriveKeysFromSeed(seed);
    this.shieldedSecretKeys = ledger.ZswapSecretKeys.fromSeed(keys[Roles.Zswap]);
    this.dustSecretKey = ledger.DustSecretKey.fromSeed(keys[Roles.Dust]);
    this.unshieldedKeystore = createKeystore(keys[Roles.NightExternal], getNetworkId());

    this.walletAddress = this.unshieldedKeystore.getBech32Address();
    this.logger.log(`Initialized Midnight wallet: ${this.walletAddress}`);
  }

  getWallet() {
    if (!this.unshieldedKeystore) {
      return {
        address: this.walletAddress,
        sign: async (data: string) => `mock-signature-${data}`,
      };
    }

    return {
      address: this.walletAddress,
      dustAddress: this.dustAddress,
      sign: async (data: string) => {
        if (!this.unshieldedKeystore) {
          throw new Error('Wallet not initialized');
        }
        const payload = Buffer.from(data, 'utf8');
        return this.unshieldedKeystore.signData(payload).toString();
      },
      getShieldedSecretKeys: () => this.shieldedSecretKeys,
      getDustSecretKey: () => this.dustSecretKey,
      getUnshieldedKeystore: () => this.unshieldedKeystore,
    };
  }

  getAddress(): string {
    return this.walletAddress;
  }

  getDustAddress(): string {
    return this.dustAddress;
  }

  async getBalance(): Promise<bigint> {
    return 0n;
  }

  isInitialized(): boolean {
    return this.unshieldedKeystore !== null;
  }
}