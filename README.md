# ProofRail

**ProofRail** is a shared compliance backend powering a **Privacy-first P2P fiat-to-crypto on/off-ramp** that runs across three blockchains: **Midnight Network**, **Aleo**, and **Fhenix (Arbitrum)**. It acts as the infrastructure layer that sits between the user and every chain.

## 🚀 What Are We Building?

The core idea of ProofRail is to solve the fragmented identity problem in web3: a user verifies their identity **once**. The backend issues a **universal credential** that gets formatted natively per chain. When users switch chains on the frontend, their KYC, reputation, and trade history travel with them — no re-verification needed.

### Key Features
- **Universal Credential Issuance**: Single KYC verification via Didit v3 integration, mapped across multiple chains.
- **Privacy-Preserving On-Chain Verification**: Smart contracts on Midnight (Compact), Aleo (Leo), and Fhenix verify the proof without exposing raw KYC data.
- **Compliance Module**: Built-in AML (Anti-Money Laundering) and sanctions list screening.
- **P2P Escrow State Machine**: Backend manages the strict state machine of the trade lifecycle (`PENDING` → `ESCROW_LOCKED` → `PAYMENT_SENT` → `PAYMENT_CONFIRMED` → `COMPLETED`).
- **Dispute Handling & Reputation**: Human arbitration queue for disputes and a tier-based reputation score for all users.
- **Real-Time Events**: WebSocket real-time events to inform the frontend of trade, KYC, or dispute status changes.

## 🏗️ Architecture

1. **Backend**: NestJS 10, TypeScript, PostgreSQL (Prisma), Redis, BullMQ.
2. **Smart Contracts (Midnight)**: Compact contracts (`proof_rail_kyc.compact`, `proof_rail_escrow.compact`) compiled to ZK circuits.
3. **Frontend**: React-based UI integrating the backend APIs and wallet interactions.

## 📂 Project Structure

```
/workspace
│
├── proofRail-backend/          # NestJS backend and smart contract DApp drivers
│   ├── src/                    # Backend source code
│   ├── contracts/              # Midnight Compact contracts
│   ├── prisma/                 # Database schema and migrations
│   └── scripts/                # Deployment scripts for smart contracts
│
├── .trae/                      # PRD and Technical Architecture docs
│
└── README.md                   # This file
```

## ⚙️ How It Works (End-to-End Flow)

1. **Registration & Auth**: User connects their wallet and signs a challenge message to authenticate.
2. **KYC Verification**: User completes a Didit KYC session. Upon approval, the compliance module runs AML + sanctions checks.
3. **Credential Issuance**: If cleared, the user receives a Universal Credential, which is cached and formatted for the target chain.
4. **P2P Trading**: 
   - A trade is initiated.
   - The seller locks crypto in the on-chain escrow contract (shielded).
   - The buyer pays fiat (bank transfer, mobile money, etc.) and marks the payment as sent.
   - The seller confirms the fiat receipt, and the backend instructs the smart contract to release the funds.
5. **Reputation**: Upon completion, reputation scores are updated for both parties.

## 🛠️ Getting Started

### Backend
1. Navigate to `proofRail-backend`.
2. Install dependencies: `npm install`.
3. Start the Docker containers (PostgreSQL, Redis, Midnight Proof Server): `docker-compose up -d`.
4. Run the backend: `npm run start:dev`.

### Smart Contracts (Midnight)
1. Deploy the mock smart contracts: `npm run midnight:deploy`.
2. Verify deployment: `npm run midnight:verify`.

### Frontend
Frontend development is currently in progress. PRD and Technical Architecture documents are located in `.trae/documents/`.
