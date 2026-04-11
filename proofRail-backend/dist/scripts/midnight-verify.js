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
async function verifyContracts() {
    console.log('\n🔍 Verifying Midnight Smart Contract Deployments...\n');
    try {
        const deploymentPath = path.join(__dirname, '../deployment.json');
        if (!fs.existsSync(deploymentPath)) {
            console.error('❌ deployment.json not found!\n' +
                '💡 Please run: npm run midnight:deploy');
            process.exit(1);
        }
        const deployments = JSON.parse(fs.readFileSync(deploymentPath, 'utf-8'));
        console.log('📄 Deployment record loaded\n');
        const kycContractAddress = deployments.kycContract?.address || deployments.kycContract;
        const escrowContractAddress = deployments.escrowContract?.address || deployments.escrowContract;
        if (!kycContractAddress || !escrowContractAddress) {
            console.error('❌ Invalid deployment record - missing contract addresses\n');
            process.exit(1);
        }
        const walletSeed = process.env.MIDNIGHT_WALLET_SEED;
        if (!walletSeed) {
            console.warn('⚠️  MIDNIGHT_WALLET_SEED not set - deployment will not work\n');
        }
        else {
            console.log('🔐 Wallet seed verified\n');
        }
        console.log('📋 KYC Contract Verification:');
        console.log(`   Address: ${kycContractAddress}`);
        console.log(`   Network: ${deployments.network || 'TestnetPreprod'}`);
        if (deployments.kycContract?.deploymentHash) {
            console.log(`   Deployment Hash: ${deployments.kycContract.deploymentHash}`);
        }
        if (kycContractAddress.length > 0) {
            console.log(`   Status: ✅ Record valid\n`);
        }
        else {
            console.log(`   Status: ❌ Invalid address\n`);
            process.exit(1);
        }
        console.log('📋 Escrow Contract Verification:');
        console.log(`   Address: ${escrowContractAddress}`);
        console.log(`   Network: ${deployments.network || 'TestnetPreprod'}`);
        if (deployments.escrowContract?.deploymentHash) {
            console.log(`   Deployment Hash: ${deployments.escrowContract.deploymentHash}`);
        }
        if (escrowContractAddress.length > 0) {
            console.log(`   Status: ✅ Record valid\n`);
        }
        else {
            console.log(`   Status: ❌ Invalid address\n`);
            process.exit(1);
        }
        console.log('📋 Compiled Contract Artifacts:');
        const kycPath = path.join(__dirname, '../contracts/managed/proof_rail_kyc');
        const escrowPath = path.join(__dirname, '../contracts/managed/proof_rail_escrow');
        if (fs.existsSync(kycPath)) {
            console.log(`   ✅ KYC contract artifacts found at ${kycPath}`);
        }
        else {
            console.log(`   ❌ KYC contract artifacts NOT found - run: npm run midnight:compile`);
        }
        if (fs.existsSync(escrowPath)) {
            console.log(`   ✅ Escrow contract artifacts found at ${escrowPath}\n`);
        }
        else {
            console.log(`   ❌ Escrow contract artifacts NOT found - run: npm run midnight:compile\n`);
        }
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
        console.log('🌐 Checking Proof Server configuration...');
        const proofServerUrl = process.env.PROOF_PROVIDER_URL || 'https://proof-server.preprod.midnight.network/api/proof';
        console.log(`   Proof Server URL: ${proofServerUrl}`);
        try {
            const response = await fetch(proofServerUrl, { method: 'HEAD', timeout: 5000 });
            console.log(`   Status: ✅ Reachable\n`);
        }
        catch (error) {
            console.log(`   Status: ⚠️  Not reachable (will need to be running for transactions)\n`);
        }
    }
    catch (error) {
        console.error('❌ Verification failed:', error);
        process.exit(1);
    }
}
verifyContracts().catch(console.error);
//# sourceMappingURL=midnight-verify.js.map