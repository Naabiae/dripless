"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var WalletService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ledger = __importStar(require("@midnight-ntwrk/ledger-v8"));
const wallet_sdk_hd_1 = require("@midnight-ntwrk/wallet-sdk-hd");
const wallet_sdk_shielded_1 = require("@midnight-ntwrk/wallet-sdk-shielded");
const wallet_sdk_dust_wallet_1 = require("@midnight-ntwrk/wallet-sdk-dust-wallet");
const wallet_sdk_unshielded_wallet_1 = require("@midnight-ntwrk/wallet-sdk-unshielded-wallet");
const wallet_sdk_facade_1 = require("@midnight-ntwrk/wallet-sdk-facade");
const wallet_sdk_unshielded_wallet_2 = require("@midnight-ntwrk/wallet-sdk-unshielded-wallet");
const midnight_js_network_id_1 = require("@midnight-ntwrk/midnight-js-network-id");
const buffer_1 = require("buffer");
const Rx = __importStar(require("rxjs"));
let WalletService = WalletService_1 = class WalletService {
    configService;
    logger = new common_1.Logger(WalletService_1.name);
    wallet = null;
    shieldedSecretKeys = null;
    dustSecretKey = null;
    unshieldedKeystore = null;
    walletAddress = '';
    dustAddress = '';
    constructor(configService) {
        this.configService = configService;
    }
    async onModuleInit() {
        const seed = this.configService.get('MIDNIGHT_WALLET_SEED');
        if (!seed) {
            this.logger.warn('MIDNIGHT_WALLET_SEED is not set. Midnight admin transactions will fail.');
            return;
        }
        try {
            (0, midnight_js_network_id_1.setNetworkId)('preprod');
            await this.initializeWallet(seed);
        }
        catch (error) {
            this.logger.error('Failed to initialize Midnight wallet', error);
        }
    }
    async onModuleDestroy() {
        if (this.wallet) {
            await this.wallet.stop();
        }
    }
    deriveKeysFromSeed(seed) {
        const hdWallet = wallet_sdk_hd_1.HDWallet.fromSeed(buffer_1.Buffer.from(seed, 'hex'));
        if (hdWallet.type !== 'seedOk') {
            throw new Error('Failed to initialize HDWallet from seed');
        }
        const derivationResult = hdWallet.hdWallet
            .selectAccount(0)
            .selectRoles([wallet_sdk_hd_1.Roles.Zswap, wallet_sdk_hd_1.Roles.NightExternal, wallet_sdk_hd_1.Roles.Dust])
            .deriveKeysAt(0);
        if (derivationResult.type !== 'keysDerived') {
            throw new Error('Failed to derive keys');
        }
        hdWallet.hdWallet.clear();
        return derivationResult.keys;
    }
    async initializeWallet(seed) {
        const keys = this.deriveKeysFromSeed(seed);
        this.shieldedSecretKeys = ledger.ZswapSecretKeys.fromSeed(keys[wallet_sdk_hd_1.Roles.Zswap]);
        this.dustSecretKey = ledger.DustSecretKey.fromSeed(keys[wallet_sdk_hd_1.Roles.Dust]);
        this.unshieldedKeystore = (0, wallet_sdk_unshielded_wallet_2.createKeystore)(keys[wallet_sdk_hd_1.Roles.NightExternal], (0, midnight_js_network_id_1.getNetworkId)());
        const shieldedWallet = (0, wallet_sdk_shielded_1.ShieldedWallet)({
            networkId: (0, midnight_js_network_id_1.getNetworkId)(),
            indexerClientConnection: {
                indexerHttpUrl: 'https://indexer.preprod.midnight.network/api/v4/graphql',
                indexerWsUrl: 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws',
            },
            provingServerUrl: new URL('http://127.0.0.1:6300'),
            relayURL: new URL('wss://rpc.preprod.midnight.network'),
        }).startWithSecretKeys(this.shieldedSecretKeys);
        const unshieldedWallet = (0, wallet_sdk_unshielded_wallet_1.UnshieldedWallet)({
            networkId: (0, midnight_js_network_id_1.getNetworkId)(),
            indexerClientConnection: {
                indexerHttpUrl: 'https://indexer.preprod.midnight.network/api/v4/graphql',
                indexerWsUrl: 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws',
            },
            txHistoryStorage: new wallet_sdk_unshielded_wallet_2.InMemoryTransactionHistoryStorage(),
        }).startWithPublicKey(wallet_sdk_unshielded_wallet_2.PublicKey.fromKeyStore(this.unshieldedKeystore));
        const dustWallet = (0, wallet_sdk_dust_wallet_1.DustWallet)({
            networkId: (0, midnight_js_network_id_1.getNetworkId)(),
            costParameters: {
                additionalFeeOverhead: 300000000000000n,
                feeBlocksMargin: 5,
            },
            indexerClientConnection: {
                indexerHttpUrl: 'https://indexer.preprod.midnight.network/api/v4/graphql',
                indexerWsUrl: 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws',
            },
            provingServerUrl: new URL('http://127.0.0.1:6300'),
            relayURL: new URL('wss://rpc.preprod.midnight.network'),
        }).startWithSecretKey(this.dustSecretKey, ledger.LedgerParameters.initialParameters().dust);
        this.wallet = wallet_sdk_facade_1.WalletFacade.combine(shieldedWallet, unshieldedWallet, dustWallet);
        await this.wallet.start(this.shieldedSecretKeys, this.dustSecretKey);
        const state = await Rx.firstValueFrom(this.wallet.state().pipe(Rx.filter((s) => s.isSynced)));
        this.walletAddress = this.unshieldedKeystore.getBech32Address();
        this.dustAddress = state.dust.dustAddress;
        this.logger.log(`Initialized Midnight wallet: ${this.walletAddress}`);
        this.logger.log(`Dust address: ${this.dustAddress}`);
    }
    getWallet() {
        if (!this.wallet || !this.unshieldedKeystore) {
            return {
                address: this.walletAddress,
                sign: async (data) => `mock-signature-${data}`,
            };
        }
        return {
            address: this.walletAddress,
            dustAddress: this.dustAddress,
            sign: async (data) => {
                if (!this.unshieldedKeystore) {
                    throw new Error('Wallet not initialized');
                }
                const payload = buffer_1.Buffer.from(data, 'utf8');
                return this.unshieldedKeystore.signData(payload).toString();
            },
            getWalletFacade: () => this.wallet,
            getShieldedSecretKeys: () => this.shieldedSecretKeys,
            getDustSecretKey: () => this.dustSecretKey,
            getUnshieldedKeystore: () => this.unshieldedKeystore,
        };
    }
    getAddress() {
        return this.walletAddress;
    }
    getDustAddress() {
        return this.dustAddress;
    }
    async getBalance() {
        if (!this.wallet) {
            return 0n;
        }
        try {
            const state = await Rx.firstValueFrom(this.wallet.state().pipe(Rx.filter((s) => s.isSynced)));
            return state.unshielded.balances[ledger.unshieldedToken().raw] ?? 0n;
        }
        catch (error) {
            this.logger.error('Failed to get wallet balance', error);
            return 0n;
        }
    }
    isInitialized() {
        return this.wallet !== null;
    }
};
exports.WalletService = WalletService;
exports.WalletService = WalletService = WalletService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], WalletService);
//# sourceMappingURL=wallet.service.js.map