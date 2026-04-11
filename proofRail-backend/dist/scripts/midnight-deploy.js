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
const midnight_js_contracts_1 = require("@midnight-ntwrk/midnight-js-contracts");
const midnight_js_http_client_proof_provider_1 = require("@midnight-ntwrk/midnight-js-http-client-proof-provider");
const midnight_js_indexer_public_data_provider_1 = require("@midnight-ntwrk/midnight-js-indexer-public-data-provider");
const midnight_js_node_zk_config_provider_1 = require("@midnight-ntwrk/midnight-js-node-zk-config-provider");
const wallet_sdk_facade_1 = require("@midnight-ntwrk/wallet-sdk-facade");
const wallet_sdk_dust_wallet_1 = require("@midnight-ntwrk/wallet-sdk-dust-wallet");
const wallet_sdk_hd_1 = require("@midnight-ntwrk/wallet-sdk-hd");
const wallet_sdk_shielded_1 = require("@midnight-ntwrk/wallet-sdk-shielded");
const wallet_sdk_unshielded_wallet_1 = require("@midnight-ntwrk/wallet-sdk-unshielded-wallet");
const ledger = __importStar(require("@midnight-ntwrk/ledger-v8"));
const wallet_sdk_unshielded_wallet_2 = require("@midnight-ntwrk/wallet-sdk-unshielded-wallet");
const midnight_js_network_id_1 = require("@midnight-ntwrk/midnight-js-network-id");
const compact_js_1 = require("@midnight-ntwrk/compact-js");
const buffer_1 = require("buffer");
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
    txHistoryStorage: new wallet_sdk_unshielded_wallet_2.InMemoryTransactionHistoryStorage(),
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
const formatBalance = (balance) => balance.toLocaleString();
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
const buildWalletAndWaitForFunds = async (seed) => {
    console.log('');
    const { wallet, shieldedSecretKeys, dustSecretKey, unshieldedKeystore } = await withStatus('Building wallet', async () => {
        const keys = deriveKeysFromSeed(seed);
        const shieldedSecretKeys = ledger.ZswapSecretKeys.fromSeed(keys[wallet_sdk_hd_1.Roles.Zswap]);
        const dustSecretKey = ledger.DustSecretKey.fromSeed(keys[wallet_sdk_hd_1.Roles.Dust]);
        const unshieldedKeystore = (0, wallet_sdk_unshielded_wallet_2.createKeystore)(keys[wallet_sdk_hd_1.Roles.NightExternal], (0, midnight_js_network_id_1.getNetworkId)());
        const shieldedWallet = (0, wallet_sdk_shielded_1.ShieldedWallet)(buildShieldedConfig()).startWithSecretKeys(shieldedSecretKeys);
        const unshieldedWallet = (0, wallet_sdk_unshielded_wallet_1.UnshieldedWallet)(buildUnshieldedConfig()).startWithPublicKey(wallet_sdk_unshielded_wallet_2.PublicKey.fromKeyStore(unshieldedKeystore));
        const dustWallet = (0, wallet_sdk_dust_wallet_1.DustWallet)(buildDustConfig()).startWithSecretKey(dustSecretKey, ledger.LedgerParameters.initialParameters().dust);
        const wallet = wallet_sdk_facade_1.WalletFacade.combine(shieldedWallet, unshieldedWallet, dustWallet);
        await wallet.start(shieldedSecretKeys, dustSecretKey);
        return { wallet, shieldedSecretKeys, dustSecretKey, unshieldedKeystore };
    });
    console.log('\n📋 Waiting for wallet to sync with network...');
    const syncedState = await withStatus('Syncing with network', () => waitForSync(wallet));
    const balance = syncedState.unshielded.balances[ledger.unshieldedToken().raw] ?? 0n;
    if (balance === 0n) {
        console.log('\n⚠️  Wallet has no balance! Please fund your wallet:');
        console.log(`   Unshielded Address: ${unshieldedKeystore.getBech32Address()}`);
        console.log('   Fund at: https://faucet.preprod.midnight.network');
        console.log('   Then re-run this deployment script.\n');
        await wallet.stop();
        process.exit(1);
    }
    console.log(`   Balance: ${formatBalance(balance)} tNight`);
    return { wallet, shieldedSecretKeys, dustSecretKey, unshieldedKeystore };
};
async function deployContracts() {
    console.log('\n🚀 Starting Midnight Smart Contract Deployment...\n');
    try {
        (0, midnight_js_network_id_1.setNetworkId)('preprod');
        const kycContractPath = path.join(__dirname, '../contracts/managed/proof_rail_kyc');
        const escrowContractPath = path.join(__dirname, '../contracts/managed/proof_rail_escrow');
        console.log('📋 Checking compiled contracts...');
        if (!fs.existsSync(kycContractPath)) {
            console.error(`❌ KYC contract not found at ${kycContractPath}`);
            console.log('\n💡 Please run: npm run midnight:compile');
            process.exit(1);
        }
        if (!fs.existsSync(escrowContractPath)) {
            console.error(`❌ Escrow contract not found at ${escrowContractPath}`);
            console.log('\n💡 Please run: npm run midnight:compile');
            process.exit(1);
        }
        console.log('✅ Compiled contracts found\n');
        const walletSeed = process.env.MIDNIGHT_WALLET_SEED;
        if (!walletSeed) {
            console.error('❌ MIDNIGHT_WALLET_SEED environment variable not set\n' +
                '💡 To generate a wallet seed, run: npm run midnight:generate-wallet');
            process.exit(1);
        }
        console.log('🔐 Wallet seed verified\n');
        console.log('🔑 Building wallet...');
        const { wallet, shieldedSecretKeys, dustSecretKey, unshieldedKeystore } = await buildWalletAndWaitForFunds(walletSeed);
        console.log('\n📦 Loading compiled contracts...');
        const { ProofRailKYC } = await import('@midnight-ntwrk/counter-contract');
        const { ProofRailEscrow } = await import('@midnight-ntwrk/counter-contract');
        console.log('🔨 Deploying contracts...');
        console.log('   Deploying KYC Contract...');
        const proofProvider = (0, midnight_js_http_client_proof_provider_1.httpClientProofProvider)('http://127.0.0.1:6300');
        const indexerProvider = (0, midnight_js_indexer_public_data_provider_1.indexerPublicDataProvider)('https://indexer.preprod.midnight.network/api/v4/graphql');
        const zkConfigProvider = (0, midnight_js_node_zk_config_provider_1.NodeZkConfigProvider)(kycContractPath);
        const kycContract = await (0, midnight_js_contracts_1.deployContract)(wallet, wallet, proofProvider, indexerProvider, zkConfigProvider, compact_js_1.CompiledContract.make('proof_rail_kyc', ProofRailKYC.Contract));
        console.log(`   ✓ KYC Contract deployed at: ${kycContract.address}`);
        console.log('   Deploying Escrow Contract...');
        const escrowContract = await (0, midnight_js_contracts_1.deployContract)(wallet, wallet, proofProvider, indexerProvider, (0, midnight_js_node_zk_config_provider_1.NodeZkConfigProvider)(escrowContractPath), compact_js_1.CompiledContract.make('proof_rail_escrow', ProofRailEscrow.Contract));
        console.log(`   ✓ Escrow Contract deployed at: ${escrowContract.address}`);
        await wallet.stop();
        const deploymentRecord = {
            network: 'preprod',
            timestamp: new Date().toISOString(),
            kycContract: {
                address: kycContract.address,
                deploymentHash: kycContract.txHash,
            },
            escrowContract: {
                address: escrowContract.address,
                deploymentHash: escrowContract.txHash,
            },
        };
        const deploymentPath = path.join(__dirname, '../deployment.json');
        fs.writeFileSync(deploymentPath, JSON.stringify(deploymentRecord, null, 2));
        console.log(`\n📄 Deployment record saved to: deployment.json\n`);
        const legacyRecord = {
            kycContract: kycContract.address,
            escrowContract: escrowContract.address,
        };
        console.log('═══════════════════════════════════════════════════════');
        console.log('✅ DEPLOYMENT COMPLETE\n');
        console.log('📋 Deployment Summary:');
        console.log(`   Network:           preprod`);
        console.log(`   KYC Contract:      ${kycContract.address}`);
        console.log(`   Escrow Contract:   ${escrowContract.address}`);
        console.log(`   Timestamp:         ${deploymentRecord.timestamp}`);
        console.log('\n💡 Next steps:');
        console.log('   1. Update MIDNIGHT_KYC_CONTRACT_ADDRESS in .env');
        console.log('   2. Update MIDNIGHT_ESCROW_CONTRACT_ADDRESS in .env');
        console.log('   3. Run integration tests: npm run test:midnight');
        console.log('   4. Update frontend with contract addresses');
        console.log('═══════════════════════════════════════════════════════\n');
    }
    catch (error) {
        console.error('❌ Deployment failed:', error);
        process.exit(1);
    }
}
deployContracts().catch(console.error);
//# sourceMappingURL=midnight-deploy.js.map