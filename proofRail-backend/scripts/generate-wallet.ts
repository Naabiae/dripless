import { WalletBuilder } from '@midnight-ntwrk/wallet';
import { NetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { randomBytes } from 'crypto';

async function generateWallet() {
  console.log('Generating a new Midnight wallet for the Preprod testnet...');
  
  // Generate a random 32-byte seed (64 hex characters)
  const seed = randomBytes(32).toString('hex');
  console.log(`\nSeed (save this!): ${seed}`);

  // We only need the public address, which can be derived from the seed using the WalletBuilder
  // Wait, WalletBuilder.build requires a proofProvider and other dependencies if we try to instantiate fully.
  // But we can check if it has a simpler method to just get the address from a seed.
}

generateWallet().catch(console.error);