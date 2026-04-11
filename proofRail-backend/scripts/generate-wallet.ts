import { randomBytes, createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as ledger from '@midnight-ntwrk/ledger-v8';
import { HDWallet, Roles, generateRandomSeed } from '@midnight-ntwrk/wallet-sdk-hd';
import { Buffer } from 'buffer';
import { createKeystore } from '@midnight-ntwrk/wallet-sdk-unshielded-wallet';
import { setNetworkId, getNetworkId } from '@midnight-ntwrk/midnight-js-network-id';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface WalletConfig {
  seed: string;
  networkId: string;
  createdAt: string;
  unshieldedAddress: string;
  shieldedPublicKey?: string;
  encryptionPublicKey?: string;
}

const deriveKeysFromSeed = (seed: Uint8Array) => {
  const hdWallet = HDWallet.fromSeed(seed);
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
};

function getBech32Address(pk: Buffer, networkId: string): string {
  const hash = createHash('sha256').update(pk).digest();
  const addr = 'midnight_' + hash.toString('base64').replace(/[/+]/g, '').substring(0, 58);
  return addr;
}

async function generateWallet() {
  console.log('\n🔐 Generating a new Midnight wallet for the Preprod testnet...\n');

  setNetworkId('preprod');

  const seed = generateRandomSeed();
  const seedHex = Buffer.from(seed).toString('hex');
  console.log(`✅ Generated seed (SAVE THIS SAFELY - DO NOT SHARE):\n\n${seedHex}\n`);
  console.log('🔒 Store this seed in your .env as MIDNIGHT_WALLET_SEED');
  console.log('⚠️  NEVER share this seed or commit it to version control\n');

  console.log('🔑 Deriving wallet keys...');
  const keys = deriveKeysFromSeed(seed);
  
  ledger.ZswapSecretKeys.fromSeed(keys[Roles.Zswap]);
  ledger.DustSecretKey.fromSeed(keys[Roles.Dust]);
  const unshieldedKeystore = createKeystore(Buffer.from(keys[Roles.NightExternal]), getNetworkId());

  const unshieldedAddress = unshieldedKeystore.getBech32Address();

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  Wallet Generated Successfully');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`\n💰 Unshielded Address: ${unshieldedAddress}`);
  console.log('\n💡 Fund your wallet using the Preprod faucet:');
  console.log('   https://faucet.preprod.midnight.network');
  console.log('   (Send tNIGHT to the unshielded address above)\n');

  const walletConfig: WalletConfig = {
    seed: seedHex,
    networkId: 'preprod',
    createdAt: new Date().toISOString(),
    unshieldedAddress: unshieldedAddress.asString(),
  };

  const configPath = path.join(__dirname, '../.wallet-config.json');
  fs.writeFileSync(configPath, JSON.stringify(walletConfig, null, 2));
  console.log(`📝 Wallet config saved to: ${configPath}`);

  console.log(`\n💡 Next steps:`);
  console.log(`1. Fund your wallet using the Preprod faucet`);
  console.log(`2. Set the seed in your environment: MIDNIGHT_WALLET_SEED="${seedHex}"`);
  console.log(`3. Run: npm run midnight:compile`);
  console.log(`4. Run: npm run midnight:deploy`);
}

generateWallet().catch(console.error);