# 🚀 Midnight Smart Contract - Quick Start Guide

## ⚡ 5-Minute Setup

### 1. Install Dependencies
```bash
cd proofRail-backend
npm install
```

### 2. Generate Wallet
```bash
npm run midnight:generate-wallet
```
Save your seed phrase securely! You'll see:
```
✅ Generated seed (SAVE THIS SAFELY):
abc123def456...
✅ Public Address: midnight1xyz...
```

### 3. Fund Wallet
Visit: https://faucet.preprod.midnight.network
Paste your public address and request test funds.

### 4. Set Environment Variable
```bash
export MIDNIGHT_WALLET_SEED="your_seed_from_step_2"
```

### 5. Deploy Contracts (All-in-One)
```bash
npm run midnight:full-deploy
```

This runs:
1. ✅ Compile contracts
2. ✅ Deploy to Preprod
3. ✅ Verify deployment
4. ✅ Display contract addresses

---

## 📋 What Gets Deployed?

| Contract | Purpose | Features |
|----------|---------|----------|
| **KYC Contract** | Privacy-preserving identity | `registerCredential()`, `verifyCredential()` |
| **Escrow Contract** | Shielded P2P trading | `lockFunds()`, `releaseToBuyer()` |

---

## ✅ Success Indicators

After deployment, you should see:

```
✅ DEPLOYMENT SUCCESSFUL

📋 Deployment Summary:
   Network:        TestnetPreprod
   Deployer:       midnight1xyz...
   KYC Contract:   0xabc123...
   Escrow Contract: 0xdef456...
```

---

## 🔧 Available Commands

```bash
# Generate a new wallet
npm run midnight:generate-wallet

# Compile contracts
npm run midnight:compile

# Deploy contracts
npm run midnight:deploy

# Verify deployment
npm run midnight:verify

# Full pipeline: compile → deploy → verify
npm run midnight:full-deploy

# Run integration tests (3-5 min)
npm run test:midnight
```

---

## 🆘 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Seed not set | `export MIDNIGHT_WALLET_SEED="..."` |
| Low balance | Use faucet: https://faucet.preprod.midnight.network |
| Compile fails | Ensure `compact` CLI is installed |
| Proof server error | Run: `docker-compose up -d proof-server` |

---

## 📚 Full Documentation

For advanced setup, network details, and troubleshooting:
👉 See [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 🎯 Next Steps

1. **Backend Integration:** Update your NestJS services to use contract addresses
2. **Frontend Integration:** Pass contract addresses to your React app
3. **Testing:** Run `npm run test:midnight` to verify everything works
4. **Production:** Deploy to Mainnet (after thorough testing)

---

## 💡 Pro Tips

- 💾 **Save Recovery Info:** Create a `.midnight-backup.json` with your seed (keep secure!)
- 🔐 **Never Commit:** Add `.env*` to `.gitignore` - seeds are sensitive!
- 📡 **Check Status:** Run `npm run midnight:verify` anytime to check contract status
- ⚡ **Local Development:** `docker-compose up -d` starts all services
- 📊 **Monitor Deployments:** Check `deployment.json` for saved addresses

---

**Ready to deploy? Run: `npm run midnight:full-deploy` 🚀**
