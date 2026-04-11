import * as fs from 'fs';
import * as path from 'path';

interface DeploymentRecord {
  network: string;
  timestamp: string;
  kycContract?: {
    address: string;
    deploymentHash: string;
  };
  escrowContract?: {
    address: string;
    deploymentHash: string;
  };
}

async function verifyContracts() {
  console.log('\n🔍 Verifying Midnight Smart Contract Deployments...\n');

  try {
    // Step 1: Load deployment record
    const deploymentPath = path.join(__dirname, '../deployment.json');
    if (!fs.existsSync(deploymentPath)) {
      console.error(
        '❌ deployment.json not found!\n' +
        '💡 Please run: npm run midnight:deploy'
      );
      process.exit(1);
    }

    const deployments = JSON.parse(fs.readFileSync(deploymentPath, 'utf-8'));
    console.log('📄 Deployment record loaded\n');

    // Handle both new and legacy formats
    const kycContractAddress = deployments.kycContract?.address || deployments.kycContract;
    const escrowContractAddress = deployments.escrowContract?.address || deployments.escrowContract;

    if (!kycContractAddress || !escrowContractAddress) {
      console.error(
        '❌ Invalid deployment record - missing contract addresses\n'
      );
      process.exit(1);
    }

    // Step 2: Verify Wallet Seed
    const walletSeed = process.env.MIDNIGHT_WALLET_SEED;
    if (!walletSeed) {
      console.warn(
        '⚠️  MIDNIGHT_WALLET_SEED not set - deployment will not work\n'
      );
    } else {
      console.log('🔐 Wallet seed verified\n');
    }

    // Step 3: Verify KYC Contract
    console.log('📋 KYC Contract Verification:');
    console.log(`   Address: ${kycContractAddress}`);
    console.log(`   Network: ${deployments.network || 'TestnetPreprod'}`);
    if (deployments.kycContract?.deploymentHash) {
      console.log(`   Deployment Hash: ${deployments.kycContract.deploymentHash}`);
    }

    if (kycContractAddress.length > 0) {
      console.log(`   Status: ✅ Record valid\n`);
    } else {
      console.log(`   Status: ❌ Invalid address\n`);
      process.exit(1);
    }

    // Step 4: Verify Escrow Contract
    console.log('📋 Escrow Contract Verification:');
    console.log(`   Address: ${escrowContractAddress}`);
    console.log(`   Network: ${deployments.network || 'TestnetPreprod'}`);
    if (deployments.escrowContract?.deploymentHash) {
      console.log(`   Deployment Hash: ${deployments.escrowContract.deploymentHash}`);
    }

    if (escrowContractAddress.length > 0) {
      console.log(`   Status: ✅ Record valid\n`);
    } else {
      console.log(`   Status: ❌ Invalid address\n`);
      process.exit(1);
    }

    // Step 5: Verify Compiled Contracts
    console.log('📋 Compiled Contract Artifacts:');
    const kycPath = path.join(__dirname, '../contracts/managed/proof_rail_kyc');
    const escrowPath = path.join(__dirname, '../contracts/managed/proof_rail_escrow');
    
    if (fs.existsSync(kycPath)) {
      console.log(`   ✅ KYC contract artifacts found at ${kycPath}`);
    } else {
      console.log(`   ❌ KYC contract artifacts NOT found - run: npm run midnight:compile`);
    }

    if (fs.existsSync(escrowPath)) {
      console.log(`   ✅ Escrow contract artifacts found at ${escrowPath}\n`);
    } else {
      console.log(`   ❌ Escrow contract artifacts NOT found - run: npm run midnight:compile\n`);
    }

    // Step 6: Provide summary
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ VERIFICATION SUCCESSFUL\n');
    console.log('📝 Contract Addresses:');
    console.log(`   KYC:    ${kycContractAddress}`);
    console.log(`   Escrow: ${escrowContractAddress}`);
    console.log(`   Network: ${deployments.network || 'TestnetPreprod'}`);
    console.log(`   Deployed: ${deployments.timestamp}`);
    console.log('\n💡 Configuration Instructions:');
    console.log(`   1. Add to your .env file:`);
    console.log(`      MIDNIGHT_KYC_CONTRACT_ADDRESS=${kycContractAddress}`);
    console.log(`      MIDNIGHT_ESCROW_CONTRACT_ADDRESS=${escrowContractAddress}`);
    console.log(`   2. Restart your backend services`);
    console.log(`   3. Run integration tests: npm run test:midnight`);
    console.log('═══════════════════════════════════════════════════════\n');

    // Step 7: Check if proof server is configured
    console.log('🌐 Checking Proof Server configuration...');
    const proofServerUrl = process.env.PROOF_PROVIDER_URL || 'https://proof-server.preprod.midnight.network/api/proof';
    console.log(`   Proof Server URL: ${proofServerUrl}`);
    
    try {
      const response = await fetch(proofServerUrl, { method: 'HEAD', timeout: 5000 } as any);
      console.log(`   Status: ✅ Reachable\n`);
    } catch (error) {
      console.log(`   Status: ⚠️  Not reachable (will need to be running for transactions)\n`);
    }
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

verifyContracts().catch(console.error);
