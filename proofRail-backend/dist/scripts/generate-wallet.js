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
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const ledger = __importStar(require("@midnight-ntwrk/ledger-v8"));
const wallet_sdk_hd_1 = require("@midnight-ntwrk/wallet-sdk-hd");
const buffer_1 = require("buffer");
const wallet_sdk_unshielded_wallet_1 = require("@midnight-ntwrk/wallet-sdk-unshielded-wallet");
const wallet_sdk_dust_wallet_1 = require("@midnight-ntwrk/wallet-sdk-dust-wallet");
const wallet_sdk_shielded_1 = require("@midnight-ntwrk/wallet-sdk-shielded");
const wallet_sdk_facade_1 = require("@midnight-ntwrk/wallet-sdk-facade");
const midnight_js_network_id_1 = require("@midnight-ntwrk/midnight-js-network-id");
const ws_1 = require("ws");
const Rx = __importStar(require("rxjs"));
globalThis.WebSocket = ws_1.WebSocket;
const buildShieldedConfig = () => ({
    networkId: (0, midnight_js_network_id_1.getNetworkId)(),
    indexerClientConnection: {
        indexerHttpUrl: 'https://indexer.preprod.midnight.network/api/v4/graphql',
        indexerWsUrl: 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws',
    },
    provingServerUrl: new URL('http://127.0.0.1:6300'),
    relayURL: new URL('wss://rpc.preprod.midnight.network'),
});
const buildUnshieldedConfig = () => ({
    networkId: (0, midnight_js_network_id_1.getNetworkId)(),
    indexerClientConnection: {
        indexerHttpUrl: 'https://indexer.preprod.midnight.network/api/v4/graphql',
        indexerWsUrl: 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws',
    },
    txHistoryStorage: new wallet_sdk_unshielded_wallet_1.InMemoryTransactionHistoryStorage(),
});
const buildDustConfig = () => ({
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
});
const deriveKeysFromSeed = (seed) => {
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
};
const waitForSync = (wallet) => Rx.firstValueFrom(wallet.state().pipe(Rx.throttleTime(5_000), Rx.filter((state) => state.isSynced)));
const withStatus = async (message, fn) => {
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let i = 0;
    const interval = setInterval(() => {
        process.stdout.write(`\r  ${frames[i++ % frames.length]} ${message}`);
    }, 80);
    try {
        const result = await fn();
        clearInterval(interval);
        process.stdout.write(`\r  ✓ ${message}\n`);
        return result;
    }
    catch (e) {
        clearInterval(interval);
        process.stdout.write(`\r  ✗ ${message}\n`);
        throw e;
    }
};
async function generateWallet() {
    console.log('\n🔐 Generating a new Midnight wallet for the Preprod testnet...\n');
    try {
        (0, midnight_js_network_id_1.setNetworkId)('preprod');
        const seed = (0, wallet_sdk_hd_1.generateRandomSeed)();
        console.log(`✅ Generated seed (SAVE THIS SAFELY - DO NOT SHARE):\n\n${seed}\n`);
        console.log('🔒 Store this seed in your .env as MIDNIGHT_WALLET_SEED');
        console.log('⚠️  NEVER share this seed or commit it to version control\n');
        console.log('🔑 Deriving wallet keys...');
        const keys = deriveKeysFromSeed(seed);
        const shieldedSecretKeys = ledger.ZswapSecretKeys.fromSeed(keys[wallet_sdk_hd_1.Roles.Zswap]);
        const dustSecretKey = ledger.DustSecretKey.fromSeed(keys[wallet_sdk_hd_1.Roles.Dust]);
        const unshieldedKeystore = (0, wallet_sdk_unshielded_wallet_1.createKeystore)(keys[wallet_sdk_hd_1.Roles.NightExternal], (0, midnight_js_network_id_1.getNetworkId)());
        const shieldedWallet = (0, wallet_sdk_shielded_1.ShieldedWallet)(buildShieldedConfig()).startWithSecretKeys(shieldedSecretKeys);
        const unshieldedWallet = (0, wallet_sdk_unshielded_wallet_1.UnshieldedWallet)(buildUnshieldedConfig()).startWithPublicKey(wallet_sdk_unshielded_wallet_1.PublicKey.fromKeyStore(unshieldedKeystore));
        const dustWallet = (0, wallet_sdk_dust_wallet_1.DustWallet)(buildDustConfig()).startWithSecretKey(dustSecretKey, ledger.LedgerParameters.initialParameters().dust);
        const wallet = wallet_sdk_facade_1.WalletFacade.combine(shieldedWallet, unshieldedWallet, dustWallet);
        console.log('⏳ Starting wallet (this may take a moment)...');
        await wallet.start(shieldedSecretKeys, dustSecretKey);
        const state = await withStatus('Syncing wallet with network', () => waitForSync(wallet));
        const { MidnightBech32m, ShieldedAddress, ShieldedCoinPublicKey, ShieldedEncryptionPublicKey, } = await import('@midnight-ntwrk/wallet-sdk-address-format');
        const coinPubKey = ShieldedCoinPublicKey.fromHexString(state.shielded.coinPublicKey.toHexString());
        const encPubKey = ShieldedEncryptionPublicKey.fromHexString(state.shielded.encryptionPublicKey.toHexString());
        const shieldedAddressEncode = MidnightBech32m.encode((0, midnight_js_network_id_1.getNetworkId)(), new ShieldedAddress(coinPubKey, encPubKey));
        const shieldedAddress = shieldedAddressEncode.toString();
        const unshieldedAddress = unshieldedKeystore.getBech32Address();
        const dustAddress = state.dust.dustAddress;
        console.log('\n═══════════════════════════════════════════════════════');
        console.log('  Wallet Generated Successfully');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log(`\n🛡️  Shielded Address: ${shieldedAddress}`);
        console.log(`💰 Unshielded Address: ${unshieldedAddress}`);
        console.log(`Dust Address: ${dustAddress}`);
        console.log('\n💡 Fund your wallet using the Preprod faucet:');
        console.log('   https://faucet.preprod.midnight.network');
        console.log('   (Send tNIGHT to the unshielded address above)\n');
        const walletConfig = {
            seed,
            networkId: 'preprod',
            createdAt: new Date().toISOString(),
            shieldedAddress,
            unshieldedAddress,
            dustAddress,
        };
        const configPath = path.join(__dirname, '../.wallet-config.json');
        fs.writeFileSync(configPath, JSON.stringify(walletConfig, null, 2));
        console.log(`📝 Wallet config saved to: ${configPath}`);
        console.log(`\n💡 Next steps:`);
        console.log(`1. Fund your wallet using the Preprod faucet`);
        console.log(`2. Set the seed in your environment: MIDNIGHT_WALLET_SEED="${seed}"`);
        console.log(`3. Run: npm run midnight:compile`);
        console.log(`4. Run: npm run midnight:deploy`);
        await wallet.stop();
    }
    catch (error) {
        console.error('❌ Error generating wallet:', error);
        process.exit(1);
    }
}
generateWallet().catch(console.error);
//# sourceMappingURL=generate-wallet.js.map