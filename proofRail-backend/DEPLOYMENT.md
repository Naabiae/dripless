# Midnight Smart Contract Deployment Guide

This guide provides step-by-step instructions for building, deploying, and verifying your Midnight smart contracts.

## Prerequisites

### Required Tools

1. **Node.js 22+** - Download from [nodejs.org](https://nodejs.org/)

2. **Compact CLI** - Install the Compact compiler:
   ```bash
   curl --proto '=https' --tlsv1.2 -LsSf https://github.com/midnightntwrk/compact/releases/latest/download/compact-installer.sh | sh
   ```

3. **Docker & Docker Compose** - For running the proof server locally
   - [Docker Desktop](https://www.docker.com/products/docker-desktop)

4. **npm dependencies** - Already configured in `package.json`

### Account Requirements

- A Midnight wallet with a seed phrase
- Funds on the Preprod testnet (use the [faucet](https://faucet.preprod.midnight.network))

---

## Step 1: Generate a Wallet

If you don't already have a wallet, generate one:

```bash
npm run midnight:generate-wallet
```

This will:
- Generate a new random seed (64 hex characters)
- Create a wallet config file at `.wallet-config.json`
- Display your public address

**⚠️ IMPORTANT: Save your seed phrase securely!** You'll need it for deployments.

---

## Step 2: Fund Your Wallet

Once you have a public address, fund it using the Preprod faucet:

1. Visit: https://faucet.preprod.midnight.network
2. Enter your public address
3. Request test funds (you'll receive Dust)
4. Check your balance after a few moments

---

## Step 3: Set Up Environment Variables

Create a `.env` file in the `proofRail-backend` directory:

```bash
# Your wallet seed (from Step 1)
MIDNIGHT_WALLET_SEED=<your_64_character_hex_seed>

# Proof Provider URL (optional - defaults to preprod)
PROOF_PROVIDER_URL=https://proof-server.preprod.midnight.network/api/proof

# Network (optional - defaults to TestnetPreprod)
MIDNIGHT_NETWORK=TestnetPreprod
```

To use the environment variables, you can also set them in your shell:

```bash
export MIDNIGHT_WALLET_SEED="<your_seed_here>"
export PROOF_PROVIDER_URL="https://proof-server.preprod.midnight.network/api/proof"
```

---

## Step 4: Start the Proof Server (Local Development)

The proof server is required to generate zero-knowledge proofs. You have two options:

### Option A: Use Remote Proof Server (Recommended for Initial Setup)

Skip this step and use the remote proof server at:
```
https://proof-server.preprod.midnight.network/api/proof
```

### Option B: Run Proof Server Locally (Development)

```bash
docker-compose up -d proof-server
```

To check if it's running:
```bash
docker-compose ps
```

To stop it:
```bash
docker-compose down
```

---

## Step 5: Compile the Smart Contracts

Compile your Compact contracts to WebAssembly:

```bash
npm run midnight:compile
```

This will:
- Compile `proof_rail_kyc.compact`
- Compile `proof_rail_escrow.compact`
- Generate contract artifacts in `contracts/managed/`

Expected output:
```
✓ Compiled proof_rail_kyc.compact
✓ Compiled proof_rail_escrow.compact
```

---

## Step 6: Deploy to Preprod Testnet

Deploy your compiled contracts:

```bash
npm run midnight:deploy
```

The script will:
1. Verify compiled contracts exist
2. Load your wallet from the seed
3. Check your account balance
4. Deploy the KYC contract
5. Deploy the Escrow contract
6. Save deployment addresses to `deployment.json`

**Expected output:**
```
✅ DEPLOYMENT SUCCESSFUL

📋 Deployment Summary:
   Network:        TestnetPreprod
   Deployer:       <your_public_address>
   KYC Contract:   <contract_address>
   Escrow Contract: <contract_address>
   Timestamp:      2024-XX-XXTXX:XX:XX.XXXZ
```

---

## Step 7: Verify Deployment

Verify that your contracts deployed successfully:

```bash
npm run midnight:verify
```

This will:
1. Load the deployment record
2. Verify contract addresses are valid
3. Check proof server connectivity
4. Display contract information for integration

**Expected output:**
```
✅ VERIFICATION SUCCESSFUL

📝 Contract Addresses:
   KYC:    <contract_address>
   Escrow: <contract_address>
```

---

## Step 8: Test the Contracts

Run the Midnight integration tests:

```bash
npm run test:midnight
```

This will:
- Execute end-to-end tests against the deployed contracts
- Test KYC credential registration and verification
- Test escrow locking and releasing
- Verify zero-knowledge proof generation

**Note:** Tests take 3-5 minutes due to proof generation and block confirmation times.

---

## Full Deployment in One Command

Compile, deploy, and verify all in one go:

```bash
npm run midnight:full-deploy
```

---

## Troubleshooting

### Issue: "MIDNIGHT_WALLET_SEED environment variable not set"

**Solution:** Set your seed in the environment:
```bash
export MIDNIGHT_WALLET_SEED="your_64_character_seed"
```

Or add it to `.env`:
```bash
MIDNIGHT_WALLET_SEED=your_64_character_seed
```

### Issue: "Compiled contracts not found"

**Solution:** Run the compile step:
```bash
npm run midnight:compile
```

### Issue: "deployment.json not found"

**Solution:** Run the deployment step:
```bash
npm run midnight:deploy
```

### Issue: "Low balance detected"

**Solution:** Fund your wallet using the faucet:
https://faucet.preprod.midnight.network

### Issue: "Could not reach Proof Server"

**Solution:** Either:
1. Start the local proof server: `docker-compose up -d proof-server`
2. Or ensure the remote proof server URL is correct in your `.env`

### Issue: Tests timeout or fail with proof generation errors

**Solution:**
1. Ensure proof server is running and accessible
2. Check your internet connection
3. Increase test timeout if needed
4. Run tests individually with `--maxWorkers=1`

---

## Integration with Backend (NestJS)

Once contracts are deployed, integrate them with your NestJS application:

### 1. Update Environment Config

Add deployed contract addresses to your `.env`:

```env
MIDNIGHT_KYC_CONTRACT_ADDRESS=<from_deployment.json>
MIDNIGHT_ESCROW_CONTRACT_ADDRESS=<from_deployment.json>
MIDNIGHT_PROOF_PROVIDER_URL=https://proof-server.preprod.midnight.network/api/proof
```

### 2. Load in Your Services

In your Midnight services (e.g., `midnight-kyc.service.ts`):

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MidnightKycService {
  private kycContractAddress: string;
  private escrowContractAddress: string;

  constructor(private configService: ConfigService) {
    this.kycContractAddress = this.configService.get('MIDNIGHT_KYC_CONTRACT_ADDRESS');
    this.escrowContractAddress = this.configService.get('MIDNIGHT_ESCROW_CONTRACT_ADDRESS');
  }

  async registerCredential(walletAddress: string, commitment: string) {
    // Use this.kycContractAddress to call your deployed contract
  }

  async lockFunds(tradeId: string, amount: bigint) {
    // Use this.escrowContractAddress to call your deployed contract
  }
}
```

### 3. Start the Backend

```bash
npm run start:dev
```

---

## Contract Architecture

### KYC Contract (`proof_rail_kyc.compact`)

**Purpose:** Privacy-preserving credential registration and verification

**Key Circuits:**
- `registerCredential()` - Backend registers a credential commitment
- `verifyCredential()` - User proves they hold matching claims

**State:**
- Registry of credentials (commitment + expiration)
- Credential status: UNREGISTERED → REGISTERED → VERIFIED

### Escrow Contract (`proof_rail_escrow.compact`)

**Purpose:** Shielded P2P escrow for secure trades

**Key Circuits:**
- `lockFunds()` - Seller locks crypto
- `releaseToBuyer()` - Backend authorizes release to buyer
- `releasing()` - Buyer confirms receipt

**State:**
- Escrow entries indexed by trade ID
- Status tracking: LOCKED → RELEASED_BUYER → COMPLETED

---

## Network Details

### Preprod Testnet (Recommended for Development)

- **Network ID:** `TestnetPreprod`
- **RPC Endpoint:** https://preprod.midnight.network
- **Faucet:** https://faucet.preprod.midnight.network
- **Block Time:** ~1 minute
- **Proof Server:** https://proof-server.preprod.midnight.network/api/proof

### Mainnet (Production)

- **Network ID:** `Mainnet`
- **RPC Endpoint:** https://midnight.network
- **Faucet:** None (use exchange or bridge)
- **Block Time:** ~1 minute

**⚠️ Never deploy to mainnet without extensive testing on preprod first!**

---

## Advanced Topics

### Deploying to Mainnet

To deploy to mainnet, modify your .env:

```env
MIDNIGHT_NETWORK=Mainnet
PROOF_PROVIDER_URL=https://proof-server.midnight.network/api/proof
```

Then run deployment:
```bash
npm run midnight:deploy
```

### Custom Proof Server

If running your own proof server:

```env
PROOF_PROVIDER_URL=http://localhost:6300/api/proof
```

Ensure it's running:
```bash
docker-compose up -d proof-server
```

### Manual Wallet Creation

Using the Midnight CLI directly:

```bash
# Generate a new seed
openssl rand -hex 32

# Derive address from seed using midnight-cli (install separately)
midnight-cli wallet derive <seed>
```

---

## Support & Resources

- **Midnight Documentation:** https://docs.midnight.network
- **Compact Documentation:** https://compact.midnightntwrk.com
- **GitHub Issues:** https://github.com/midnightntwrk/midnight-js
- **Community Discord:** https://discord.gg/midnightntwrk

---

## Checklist

- [ ] Node.js 22+ installed
- [ ] Compact CLI installed
- [ ] Docker & Docker Compose installed
- [ ] Generated wallet with `npm run midnight:generate-wallet`
- [ ] Saved seed phrase securely
- [ ] Funded wallet via faucet
- [ ] Set MIDNIGHT_WALLET_SEED environment variable
- [ ] Compiled contracts with `npm run midnight:compile`
- [ ] Deployed contracts with `npm run midnight:deploy`
- [ ] Verified deployment with `npm run midnight:verify`
- [ ] Ran integration tests with `npm run test:midnight`
- [ ] Updated backend services with contract addresses
- [ ] Started backend with `npm run start:dev`

---

**Happy deploying! 🚀**
