import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as ledger from '@midnight-ntwrk/ledger-v8';
import { WalletFacade } from '@midnight-ntwrk/wallet-sdk-facade';
import { type UnshieldedKeystore } from '@midnight-ntwrk/wallet-sdk-unshielded-wallet';
export declare class WalletService implements OnModuleInit, OnModuleDestroy {
    private configService;
    private readonly logger;
    private wallet;
    private shieldedSecretKeys;
    private dustSecretKey;
    private unshieldedKeystore;
    private walletAddress;
    private dustAddress;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    private deriveKeysFromSeed;
    private initializeWallet;
    getWallet(): {
        address: string;
        sign: (data: string) => Promise<string>;
        dustAddress?: undefined;
        getWalletFacade?: undefined;
        getShieldedSecretKeys?: undefined;
        getDustSecretKey?: undefined;
        getUnshieldedKeystore?: undefined;
    } | {
        address: string;
        dustAddress: string;
        sign: (data: string) => Promise<string>;
        getWalletFacade: () => WalletFacade | null;
        getShieldedSecretKeys: () => ledger.ZswapSecretKeys | null;
        getDustSecretKey: () => ledger.DustSecretKey | null;
        getUnshieldedKeystore: () => UnshieldedKeystore | null;
    };
    getAddress(): string;
    getDustAddress(): string;
    getBalance(): Promise<bigint>;
    isInitialized(): boolean;
}
