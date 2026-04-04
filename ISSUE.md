# ISSUE.md — P2P Compliant Rail: Backend Build Plan

## What Is This?

**ProofRail** is the shared compliance backend powering a Privacy-first P2P fiat-to-crypto on/off-ramp that runs across three blockchains: **Midnight Network**, **Aleo**, and **Fhenix (Arbitrum)**. It is not a blockchain project. It is the infrastructure layer that sits between the user and every chain.

The core idea: a user verifies their identity **once**. The backend issues a **universal credential** that gets formatted per chain. When they switch chains on the frontend, their KYC, reputation, and trade history travel with them — no re-verification needed.

---

## What It Does

| Responsibility | Module |
|---|---|
| User auth (wallet + email) | `auth` |
| KYC session lifecycle | `kyc` |
| Compliance screening (AML/sanctions) | `compliance` |
| Universal credential issuance | `credentials` |
| Chain-specific proof formatting | `adapters` |
| Trade lifecycle (escrow state machine) | `trades` |
| Dispute handling | `disputes` |
| Reputation scoring | `reputation` |
| Real-time events (WebSocket) | `events` |
| Queue processing | `queue` |
| Health, metrics, docs | `core` |

---

## Tech Stack

```
Runtime:      Node.js 20 LTS
Framework:    NestJS 10 (modular, DI-first)
Language:     TypeScript (strict mode)
Database:     PostgreSQL via Prisma ORM
Cache:        Redis (sessions, rate limits, idempotency keys)
Queue:        BullMQ (webhook retry, credential issuance jobs)
Auth:         JWT (access + refresh), wallet signature verification
KYC:          Didit v3 API + webhooks
AML:          Didit AML (free tier) + manual flag system
Docs:         Swagger via @nestjs/swagger
Testing:      Jest (unit) + Supertest (e2e)
Containerize: Docker + docker-compose
```

---

## Folder Structure

```
proofRail-backend/
│
├── prisma/
│   ├── schema.prisma               # All DB models
│   └── migrations/                 # Auto-generated
│
├── src/
│   ├── main.ts                     # Bootstrap, Swagger, global pipes
│   ├── app.module.ts               # Root module, imports all features
│   │
│   ├── core/                       # Shared infrastructure
│   │   ├── config/
│   │   │   ├── app.config.ts
│   │   │   ├── database.config.ts
│   │   │   ├── redis.config.ts
│   │   │   └── jwt.config.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── kyc-verified.guard.ts
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   └── public.decorator.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── interceptors/
│   │   │   └── logging.interceptor.ts
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts
│   │   └── health/
│   │       └── health.controller.ts
│   │
│   ├── auth/                       # Issue 1
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts
│   │   │   └── wallet.strategy.ts
│   │   └── dto/
│   │       ├── register.dto.ts
│   │       ├── login.dto.ts
│   │       └── wallet-auth.dto.ts
│   │
│   ├── kyc/                        # Issue 2
│   │   ├── kyc.module.ts
│   │   ├── kyc.controller.ts
│   │   ├── kyc.service.ts
│   │   ├── kyc.webhook.ts
│   │   └── dto/
│   │       └── kyc-session.dto.ts
│   │
│   ├── compliance/                 # Issue 3
│   │   ├── compliance.module.ts
│   │   ├── compliance.service.ts
│   │   ├── aml.service.ts
│   │   ├── sanctions.service.ts
│   │   └── tx-monitor.service.ts
│   │
│   ├── credentials/                # Issue 4
│   │   ├── credentials.module.ts
│   │   ├── credentials.service.ts
│   │   ├── credentials.controller.ts
│   │   └── adapters/
│   │       ├── midnight.adapter.ts
│   │       ├── aleo.adapter.ts
│   │       └── fhenix.adapter.ts
│   │
│   ├── trades/                     # Issue 5
│   │   ├── trades.module.ts
│   │   ├── trades.controller.ts
│   │   ├── trades.service.ts
│   │   ├── escrow.service.ts
│   │   └── dto/
│   │       ├── create-trade.dto.ts
│   │       └── confirm-payment.dto.ts
│   │
│   ├── disputes/                   # Issue 6
│   │   ├── disputes.module.ts
│   │   ├── disputes.controller.ts
│   │   ├── disputes.service.ts
│   │   └── dto/
│   │       └── raise-dispute.dto.ts
│   │
│   ├── reputation/                 # Issue 7
│   │   ├── reputation.module.ts
│   │   ├── reputation.service.ts
│   │   └── reputation.controller.ts
│   │
│   ├── events/                     # Issue 8
│   │   ├── events.module.ts
│   │   └── events.gateway.ts
│   │
│   └── queue/                      # Issue 8 (shared)
│       ├── queue.module.ts
│       ├── credential.processor.ts
│       └── webhook.processor.ts
│
├── test/
│   ├── auth.e2e-spec.ts
│   ├── kyc.e2e-spec.ts
│   ├── trades.e2e-spec.ts
│   └── jest-e2e.json
│
├── docker-compose.yml
├── .env.example
└── package.json
```

---

## Transitory Flow (End-to-End)

```
User registers / connects wallet
        │
        ▼
Auth module issues JWT
        │
        ▼
User initiates KYC (Didit session)
        │
        ▼
Didit webhook → KYC module updates status
        │
        ▼
KYC approved → Compliance module runs AML + sanctions check
        │
        ▼
Both pass → Credentials module issues Universal Credential
        │
     ┌──┴─────────────────────────┐
     ▼                            ▼
Chain adapter formats        Stored in DB +
proof per target chain       cached in Redis
(Midnight / Aleo / Fhenix)
        │
        ▼
User initiates trade → Trades module creates escrow record
        │
        ▼
Fiat payment confirmed by buyer → seller releases or dispute raised
        │
        ▼
Trade completes → Reputation module updates score
        │
        ▼
Reputation proof issued (also chain-formatted)
```

---
---

## Issue 1 — Project Scaffold + Auth Module

### Status: `[ ] Open`

### What This Is

Bootstrap the entire NestJS project with production-grade configuration. Implement the authentication module supporting both email/password login and wallet-based signature verification. This is the entry gate for every other module.

### Why Wallet Auth Matters

Users on this platform are blockchain-native. They shouldn't need to manage a password. Instead they sign a challenge message with their wallet private key and the backend verifies the signature on-chain style. This is how Binance P2P, Uniswap, and every modern DeFi app handles login.

### Research Notes

- NestJS `@nestjs/passport` with `passport-jwt` handles the JWT strategy. Access tokens should be short-lived (15 min). Refresh tokens long-lived (7d), stored in Redis to allow invalidation.
- Wallet auth uses a "sign message" flow: backend issues a nonce → user signs with their wallet → backend recovers the signing address via `ethers.utils.verifyMessage` (or equivalent for Aleo/Midnight wallet addresses). If recovered address matches registered address, auth succeeds.
- Argon2 for password hashing (not bcrypt — argon2 won the Password Hashing Competition and is the 2024+ standard).
- Redis-backed token blacklist for logout without waiting for expiry.

### Tasks

- [ ] `nest new proofRail-backend` with strict TypeScript config
- [ ] Install and configure: `@nestjs/config`, `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`, `argon2`, `prisma`, `@prisma/client`, `ioredis`, `class-validator`, `class-transformer`
- [ ] Set up `docker-compose.yml` with PostgreSQL + Redis services
- [ ] Create `prisma/schema.prisma` with `User` model (id, walletAddress, email?, passwordHash?, refreshToken?, role, createdAt)
- [ ] Implement `ConfigModule` (global) loading from `.env` with `zod` validation schema
- [ ] `auth.module.ts`: register `JwtModule` with asymmetric RS256 keys
- [ ] `jwt.strategy.ts`: validate access token, attach user to request
- [ ] `auth.service.ts`:
  - `register(email, password)` — hash with argon2, store user
  - `login(email, password)` — verify hash, issue access + refresh tokens
  - `walletNonce(address)` — generate and cache nonce in Redis (TTL 5 min)
  - `walletVerify(address, signature)` — recover signer, match nonce, issue tokens
  - `refreshTokens(userId, refreshToken)` — validate against Redis, rotate tokens
  - `logout(userId)` — blacklist access token in Redis
- [ ] `current-user.decorator.ts` — extract user from request
- [ ] `kyc-verified.guard.ts` — reusable guard checking `user.kycStatus === 'APPROVED'`
- [ ] Global validation pipe, exception filter, logging interceptor in `main.ts`
- [ ] `health.controller.ts` — `GET /health` returns `{ status: 'ok', timestamp }`
- [ ] Swagger setup (`@nestjs/swagger`) — visible at `/api/docs`
- [ ] `.env.example` with all required keys documented

### Testing Phase 1

```
✅ POST /auth/register         → creates user, returns tokens
✅ POST /auth/login            → valid credentials return tokens
✅ POST /auth/login            → wrong password returns 401
✅ POST /auth/wallet/nonce     → returns nonce for address
✅ POST /auth/wallet/verify    → valid sig returns tokens
✅ POST /auth/wallet/verify    → invalid sig returns 401
✅ POST /auth/refresh          → valid refresh token rotates tokens
✅ POST /auth/logout           → access token blacklisted
✅ GET  /health                → 200 ok
✅ GET  /api/docs              → Swagger UI loads
```

---

## Issue 2 — KYC Module (Didit v3 Integration)

### Status: `[ ] Open`
### Depends On: Issue 1 ✅

### What This Is

Integrate Didit's v3 KYC API into NestJS. This module manages the full lifecycle of a user's identity verification session: creation, status polling, and real-time webhook reception. When Didit fires a webhook saying a user is `Approved`, this module updates the user's `kycStatus` and triggers the compliance pipeline.

### Research Notes

- Didit v3 API flow: `POST /sessions` → get `session_id` + `verification_url` → redirect user → Didit fires webhook to your `/kyc/webhook` endpoint.
- Webhook contains `webhook_type` (`status.updated` or `data.updated`) and a `decision` object when status is terminal (Approved/Declined).
- Three signature methods available: `X-Signature-V2` is recommended (immune to JSON re-encoding issues with unicode names). Validate using HMAC-SHA256 with your `WEBHOOK_SECRET_KEY`.
- `vendor_data` field in the session creation is how you tie a Didit session back to your internal user ID — always pass `userId` here.
- Didit retries webhooks up to 5x with exponential backoff on non-200 responses. Your webhook handler must return 200 fast and process async via BullMQ queue to avoid timeouts.
- Free tier gives 500 verifications/month. Sufficient for hackathon + early users.
- Idempotency: store processed `session_id` in Redis with TTL to prevent duplicate processing on retry.
- Add a cronjob (`@nestjs/schedule`) to mark abandoned sessions (no status after 30 min) as `EXPIRED`.

### Prisma Schema Additions

```prisma
model KycSession {
  id           String   @id @default(uuid())
  userId       String
  sessionId    String   @unique   // Didit session_id
  status       KycStatus @default(NOT_STARTED)
  decisionData Json?              // raw decision from webhook
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  user         User     @relation(fields: [userId], references: [id])
}

enum KycStatus {
  NOT_STARTED
  IN_PROGRESS
  IN_REVIEW
  APPROVED
  DECLINED
  EXPIRED
  ABANDONED
}
```

### Tasks

- [ ] Create `kyc.module.ts`, import `BullModule.registerQueue({ name: 'kyc' })`
- [ ] `kyc.service.ts`:
  - `createSession(userId)` — call Didit `POST /v3/sessions`, store `KycSession` record, return `verificationUrl`
  - `getStatus(userId)` — return current `KycSession` status from DB
  - `processWebhook(payload)` — update `KycSession` status, emit event if terminal
- [ ] `kyc.webhook.ts` — raw body parser required for signature verification:
  - Use `@nestjs/platform-express` with `bodyParser.raw()` on this route only
  - Verify `X-Signature-V2` header with HMAC-SHA256
  - Push job to BullMQ `kyc` queue, return 200 immediately
- [ ] `webhook.processor.ts` in `queue/` — consume `kyc` queue, call `kyc.service.processWebhook()`
- [ ] Idempotency check: before processing, check Redis for `kyc:processed:{session_id}` key
- [ ] On `APPROVED`: update `User.kycStatus`, emit internal event `kyc.approved` for compliance module to consume
- [ ] `@Cron` job: every 30 minutes, find `IN_PROGRESS` sessions older than 30 min, mark as `ABANDONED`
- [ ] `GET /kyc/status` — protected route, returns current KYC status + session URL if pending
- [ ] `POST /kyc/initiate` — protected route, creates new session if not already verified

### Testing Phase 2

```
✅ POST /kyc/initiate           → returns verificationUrl
✅ POST /kyc/initiate           → calling again returns existing session if IN_PROGRESS
✅ GET  /kyc/status             → returns current status
✅ POST /kyc/webhook            → invalid signature returns 401
✅ POST /kyc/webhook            → valid Approved payload updates user kycStatus
✅ POST /kyc/webhook            → duplicate webhook (same session_id) is ignored (idempotency)
✅ POST /kyc/webhook            → Declined payload sets status DECLINED
✅ Cron                         → abandoned sessions are marked EXPIRED after 30 min
✅ @UseGuard(KycVerified)       → unverified user cannot access protected route
```

---

## Issue 3 — Compliance Module (AML + Sanctions)

### Status: `[ ] Open`
### Depends On: Issue 2 ✅

### What This Is

The compliance module runs automatically after KYC approval. It performs AML (Anti-Money Laundering) screening and sanctions list checking. It also monitors ongoing transactions for suspicious patterns. This is what separates ProofRail from a raw P2P exchange — every verified user has a live compliance score, not just a one-time KYC check.

### Research Notes

- AML screening: Didit offers AML as a paid add-on. For hackathon/MVP, use a fallback approach: integrate the **OpenSanctions** dataset (free, updated daily, covers UN/OFAC/EU lists) via their API at `https://api.opensanctions.org`. It's genuinely free for open-source/non-commercial use.
- Sanctions check at registration: hit OpenSanctions `GET /match/` endpoint with user's name + DOB from KYC decision data.
- Transaction monitoring: maintain a rolling 30-day trade volume per user. Flag if: single trade > $10,000 USD equivalent, or rolling 30d volume > $50,000. These are standard FATF thresholds. Flagged users enter manual review queue.
- Store compliance results separately from KYC — a user can be KYC-approved but compliance-flagged.
- ComplianceStatus enum: `CLEAR`, `FLAGGED`, `BLOCKED`, `PENDING_REVIEW`.
- Admin endpoint to manually `CLEAR` or `BLOCK` a flagged user.

### Prisma Schema Additions

```prisma
model ComplianceRecord {
  id               String           @id @default(uuid())
  userId           String           @unique
  status           ComplianceStatus @default(PENDING_REVIEW)
  sanctionsResult  Json?            // raw OpenSanctions response
  amlResult        Json?
  lastCheckedAt    DateTime?
  flagReason       String?
  reviewedBy       String?          // admin user ID
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt
  user             User             @relation(fields: [userId], references: [id])
}

enum ComplianceStatus {
  PENDING_REVIEW
  CLEAR
  FLAGGED
  BLOCKED
}
```

### Tasks

- [ ] `compliance.module.ts` — listen for internal `kyc.approved` event via `EventEmitter2`
- [ ] `sanctions.service.ts`:
  - `screen(userId)` — fetch user KYC decision data, call OpenSanctions `/match/` API
  - Map response to `CLEAR` or `FLAGGED`
- [ ] `aml.service.ts`:
  - `runAml(userId)` — for MVP: check rolling trade volume against thresholds. For production: Didit AML add-on
  - Expose internal `checkThresholds(userId, tradeAmountUsd)` for trades module to call before each trade
- [ ] `tx-monitor.service.ts`:
  - `recordTradeVolume(userId, amountUsd)` — update rolling 30d aggregate in Redis `compliance:volume:{userId}`
  - `checkVolume(userId)` — returns `{ withinLimits: boolean, totalVolumeUsd: number }`
- [ ] `compliance.service.ts`:
  - `runFullCheck(userId)` — orchestrates sanctions + AML, saves `ComplianceRecord`
  - `getStatus(userId)` — returns current compliance status
  - `flagUser(userId, reason)` — sets FLAGGED, notifies admin queue
  - `blockUser(userId)` — sets BLOCKED (admin only)
  - `clearUser(userId)` — sets CLEAR (admin only)
- [ ] On `kyc.approved` event: auto-trigger `compliance.service.runFullCheck(userId)`
- [ ] Admin routes (`@Roles('ADMIN')`) for manual review
- [ ] `GET /compliance/status` — user sees their own compliance status (not the raw data)

### Testing Phase 3

```
✅ On kyc.approved event       → compliance check runs automatically
✅ sanctions.service           → known sanctioned name returns FLAGGED
✅ sanctions.service           → clean name returns CLEAR
✅ aml.service                 → trade above $10k threshold sets FLAGGED
✅ tx-monitor                  → rolling volume tracked correctly in Redis
✅ GET /compliance/status       → returns CLEAR / FLAGGED (not raw data)
✅ PATCH /admin/compliance/block → ADMIN blocks user
✅ PATCH /admin/compliance/clear → ADMIN clears user
✅ Non-admin cannot hit admin routes (403)
```

---

## Issue 4 — Credentials Module (Universal Proof Engine)

### Status: `[ ] Open`
### Depends On: Issue 3 ✅

### What This Is

This is the **core differentiator** of the entire system. When a user passes KYC + compliance, this module issues a **Universal Credential** — a structured JSON object capturing their verified status. Then, three chain adapters format that credential into chain-native proof structures: one for Midnight (Compact-compatible), one for Aleo (Leo record format), one for Fhenix (FHE attestation with encrypted payload).

The user never touches the raw KYC data. Smart contracts on each chain verify the proof, not the person.

### Research Notes

**Universal Credential structure** (inspired by W3C Verifiable Credentials + zk-creds research):
```json
{
  "credentialId": "uuid",
  "userId": "internal-user-id",
  "walletAddress": "0x...",
  "issuedAt": 1712345678,
  "expiresAt": 1743881678,
  "claims": {
    "kycVerified": true,
    "kycTier": 1,
    "regionAllowed": true,
    "sanctionsClear": true,
    "complianceStatus": "CLEAR",
    "ageVerified": true
  },
  "signature": "HMAC-SHA256(payload, CREDENTIAL_SECRET)"
}
```

**Midnight adapter:** Formats as a Compact-compatible witness object. Compact contracts verify the signature and read the boolean claims. The raw data never goes on-chain — the circuit proves the claims hold without revealing them. Output: `{ witness: {...}, proofHint: {...} }`.

**Aleo adapter:** Formats as a Leo `record` struct. In Leo, records are private by default and owned by an address. The credential becomes an Aleo record that the user holds in their private state. Output: `{ record: "{ owner: aleo1..., data: { kyc_verified: true, tier: 1u8, ... } }", programId: "proof_rail_kyc.aleo" }`.

**Fhenix adapter:** Formats as an FHE-encrypted attestation. Using Fhenix's CoFHE SDK, the credential claims are encoded as `euint8` / `ebool` types and encrypted with the user's FHE public key. The smart contract can check `e_kyc_verified` without decrypting. Output: `{ encryptedClaims: {...}, attestationHash: "0x..." }`.

All three adapters consume the same internal credential. Only the output format differs.

### Prisma Schema Additions

```prisma
model Credential {
  id              String   @id @default(uuid())
  userId          String   @unique
  walletAddress   String
  claims          Json     // universal claims object
  signature       String   // HMAC signature for tamper-proofing
  issuedAt        DateTime @default(now())
  expiresAt       DateTime // 12 months from issuance
  revokedAt       DateTime?
  midnightProof   Json?    // cached adapter output
  aleoRecord      Json?    // cached adapter output
  fhenixAttestation Json?  // cached adapter output
  user            User     @relation(fields: [userId], references: [id])
}
```

### Tasks

- [ ] `credentials.service.ts`:
  - `issue(userId)` — build universal credential from user's KYC + compliance record, sign with `CREDENTIAL_SECRET`, store in DB
  - `getCredential(userId)` — return credential if valid (not expired, not revoked)
  - `revoke(userId)` — set `revokedAt`, invalidate Redis cache
  - `refresh(userId)` — re-issue credential (for annual renewal)
- [ ] `adapters/midnight.adapter.ts`:
  - `format(credential)` → returns Compact witness JSON structure
  - Claims: `kyc_verified`, `region_ok`, `sanctions_clear`, `tier`
- [ ] `adapters/aleo.adapter.ts`:
  - `format(credential)` → returns Leo record JSON structure
  - Maps claims to Leo primitive types (`bool`, `u8`, `field`)
- [ ] `adapters/fhenix.adapter.ts`:
  - `format(credential)` → returns encrypted attestation payload
  - Uses AES-256-GCM as placeholder for FHE encryption (actual CoFHE encryption happens client-side or in smart contract; backend provides the plaintext attestation that the contract will encrypt)
- [ ] `credentials.controller.ts`:
  - `GET /credentials/me` — returns universal credential (requires KYC + compliance CLEAR)
  - `GET /credentials/midnight` — returns Midnight-formatted proof
  - `GET /credentials/aleo` — returns Aleo-formatted record
  - `GET /credentials/fhenix` — returns Fhenix attestation payload
  - All routes protected with `JwtAuthGuard` + `KycVerifiedGuard`
- [ ] Redis cache for formatted adapter outputs: `credentials:midnight:{userId}` (TTL = credential expiry)
- [ ] On `compliance.cleared` event: auto-trigger `credentials.service.issue(userId)`

### Testing Phase 4

```
✅ GET /credentials/me          → unverified user returns 403
✅ GET /credentials/me          → verified + clear user returns credential
✅ GET /credentials/midnight    → returns Compact-compatible witness JSON
✅ GET /credentials/aleo        → returns Leo record structure
✅ GET /credentials/fhenix      → returns FHE attestation payload
✅ credentials.service.revoke() → revoked credential returns 403
✅ Redis cache                  → second call returns cached result (no DB hit)
✅ Auto-issue on compliance.cleared event
✅ Expired credential (mock future date) → refresh required
```

---

## Issue 5 — Trades Module (Escrow State Machine)

### Status: `[ ] Open`
### Depends On: Issue 4 ✅

### What This Is

The heart of the P2P exchange logic. A trade has a strict state machine: `PENDING → ESCROW_LOCKED → PAYMENT_SENT → PAYMENT_CONFIRMED → COMPLETED` (or `DISPUTED` / `CANCELLED` at certain stages). The backend manages this state. The actual crypto escrow lives on-chain (smart contracts in future issues), but the backend tracks the state and is the source of truth for fiat confirmation (since fiat can't be read on-chain).

### Research Notes

- Trade lifecycle: Seller creates offer → Buyer takes it → Backend records trade as `PENDING` → Seller locks crypto in on-chain escrow → Backend moves to `ESCROW_LOCKED` (confirmed via chain event or manual signal for MVP) → Buyer pays fiat (bank/mobile money) → Buyer marks payment sent (`PAYMENT_SENT`) → Seller verifies fiat receipt → Seller confirms (`PAYMENT_CONFIRMED` → `COMPLETED`) or disputes → `DISPUTED`.
- Dispute window: after `PAYMENT_SENT`, seller has 30 minutes to confirm or dispute. After 30 min with no action, auto-escalate to `DISPUTED`.
- Compliance check before trade: call `aml.service.checkThresholds(userId, amountUsd)` before creating trade. If over threshold, block trade + flag user.
- Payment method stored as free text + enum (BANK_TRANSFER, MOBILE_MONEY, CASH) — backend never touches fiat, just records the method.
- Chain field: `midnight | aleo | fhenix` — used by frontend to route to correct smart contract.

### Prisma Schema Additions

```prisma
model Trade {
  id              String      @id @default(uuid())
  buyerId         String
  sellerId        String
  chain           Chain
  assetSymbol     String      // USDT, ETH, etc
  assetAmount     Decimal     @db.Decimal(20, 8)
  fiatCurrency    String      // NGN, USD, etc
  fiatAmount      Decimal     @db.Decimal(20, 2)
  fiatRate        Decimal     @db.Decimal(20, 6)
  paymentMethod   PaymentMethod
  paymentDetails  String?     // seller's bank/wallet info (encrypted at rest)
  status          TradeStatus @default(PENDING)
  escrowTxHash    String?     // on-chain escrow tx
  completedAt     DateTime?
  expiresAt       DateTime    // 30 min auto-cancel if escrow not locked
  buyer           User        @relation("BuyerTrades", fields: [buyerId], references: [id])
  seller          User        @relation("SellerTrades", fields: [sellerId], references: [id])
  dispute         Dispute?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
}

enum TradeStatus {
  PENDING
  ESCROW_LOCKED
  PAYMENT_SENT
  PAYMENT_CONFIRMED
  COMPLETED
  DISPUTED
  CANCELLED
  EXPIRED
}

enum PaymentMethod {
  BANK_TRANSFER
  MOBILE_MONEY
  CASH
  CRYPTO_WALLET
}

enum Chain {
  MIDNIGHT
  ALEO
  FHENIX
}
```

### Tasks

- [ ] `trades.service.ts`:
  - `createTrade(buyerId, dto)` — compliance check, create trade record, emit `trade.created`
  - `lockEscrow(tradeId, txHash)` — seller calls this after locking on-chain, moves to `ESCROW_LOCKED`
  - `markPaymentSent(tradeId, buyerId)` — buyer marks fiat sent, starts 30-min dispute window
  - `confirmPayment(tradeId, sellerId)` — seller confirms fiat received, moves to `COMPLETED`, update reputation
  - `cancelTrade(tradeId, userId)` — only valid in `PENDING` state
  - `getActiveTrades(userId)` — returns all open trades for user
- [ ] `escrow.service.ts`:
  - `validateEscrowTx(chain, txHash, expectedAmount)` — for MVP: store hash and trust it. For production: query chain RPC to verify tx.
  - `releaseInstruction(tradeId)` — generates the instruction payload for the smart contract to release funds
- [ ] BullMQ delayed jobs:
  - On `PENDING`: schedule job 30 min → if still `PENDING`, set `EXPIRED`
  - On `PAYMENT_SENT`: schedule job 30 min → if still `PAYMENT_SENT` (seller no action), auto-escalate to `DISPUTED`
- [ ] `trades.controller.ts`:
  - `POST /trades` — create trade (buyer)
  - `POST /trades/:id/lock-escrow` — seller confirms escrow
  - `POST /trades/:id/payment-sent` — buyer marks payment sent
  - `POST /trades/:id/confirm-payment` — seller confirms receipt
  - `POST /trades/:id/cancel` — cancel (PENDING only)
  - `GET /trades/active` — list active trades
  - `GET /trades/:id` — get trade detail
- [ ] All trade routes require `KycVerifiedGuard` + compliance `CLEAR` status check inline

### Testing Phase 5

```
✅ POST /trades                 → unverified user returns 403
✅ POST /trades                 → over-threshold amount flags + blocks trade
✅ POST /trades                 → valid trade creates PENDING record
✅ POST /trades/:id/lock-escrow → moves to ESCROW_LOCKED, stores txHash
✅ POST /trades/:id/payment-sent → buyer can only call this, moves to PAYMENT_SENT
✅ POST /trades/:id/confirm-payment → seller only, moves to COMPLETED
✅ BullMQ PENDING expiry job    → PENDING trade expires after 30 min (use short TTL in test)
✅ BullMQ dispute escalation    → PAYMENT_SENT with no seller action escalates to DISPUTED
✅ GET /trades/active           → only returns caller's trades
✅ POST /trades/:id/cancel      → only works in PENDING state
```

---

## Issue 6 — Disputes Module

### Status: `[ ] Open`
### Depends On: Issue 5 ✅

### What This Is

When a trade enters `DISPUTED` state (either manually raised or auto-escalated), the disputes module manages the resolution process. For MVP this is a human arbitration queue — an admin reviews evidence and resolves in favor of buyer or seller. The architecture is designed to be replaceable with a staking/slashing model later.

### Research Notes

- Evidence submission: both parties can upload text notes and transaction screenshots. Store in a structured JSON field (no actual file upload for MVP — just URLs or base64 strings they paste in).
- Resolution: `RESOLVED_BUYER` (crypto released back to buyer) or `RESOLVED_SELLER` (crypto released to seller).
- Resolution triggers: admin calls `resolve(disputeId, resolution)` → backend calls `escrow.service.releaseInstruction(tradeId)` with direction → this instruction is what the smart contract executes.
- SLA tracking: disputes must be resolved within 48 hours. After 48h unresolved, escalate to super-admin.
- Both parties notified via WebSocket events on status change.

### Prisma Schema Additions

```prisma
model Dispute {
  id             String          @id @default(uuid())
  tradeId        String          @unique
  raisedBy       String          // userId
  reason         String
  buyerEvidence  Json?
  sellerEvidence Json?
  status         DisputeStatus   @default(OPEN)
  resolution     DisputeResolution?
  resolvedBy     String?         // admin userId
  resolvedAt     DateTime?
  notes          String?
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
  trade          Trade           @relation(fields: [tradeId], references: [id])
}

enum DisputeStatus {
  OPEN
  UNDER_REVIEW
  RESOLVED
  ESCALATED
}

enum DisputeResolution {
  RESOLVED_BUYER
  RESOLVED_SELLER
}
```

### Tasks

- [ ] `disputes.service.ts`:
  - `raise(tradeId, userId, reason)` — creates `Dispute`, sets trade to `DISPUTED`
  - `submitEvidence(disputeId, userId, evidence)` — adds buyer/seller evidence JSON
  - `resolve(disputeId, adminId, resolution)` — sets resolution, calls `escrow.releaseInstruction()`
  - `getDispute(disputeId)` — returns full dispute with evidence
  - `listOpen()` — admin: lists all open disputes
- [ ] BullMQ delayed job: after 48h if dispute still `OPEN`, set `ESCALATED`, notify super-admin
- [ ] `disputes.controller.ts`:
  - `POST /disputes` — raise dispute (trade parties only)
  - `POST /disputes/:id/evidence` — submit evidence
  - `GET /disputes/:id` — get dispute (trade parties + admin)
  - `POST /admin/disputes/:id/resolve` — admin resolves
  - `GET /admin/disputes` — admin lists all open

### Testing Phase 6

```
✅ POST /disputes               → non-trade party cannot raise dispute (403)
✅ POST /disputes               → trade party raises dispute, trade moves to DISPUTED
✅ POST /disputes/:id/evidence  → buyer submits evidence, stored in buyerEvidence
✅ POST /disputes/:id/evidence  → seller submits evidence, stored in sellerEvidence
✅ POST /admin/disputes/:id/resolve → RESOLVED_BUYER sets resolution correctly
✅ POST /admin/disputes/:id/resolve → calls escrow.releaseInstruction()
✅ BullMQ 48h escalation job    → OPEN dispute escalates (test with short TTL)
✅ Non-admin cannot access admin routes (403)
```

---

## Issue 7 — Reputation Module

### Status: `[ ] Open`
### Depends On: Issue 5 ✅ (can be built in parallel with Issue 6)

### What This Is

Reputation is the trust layer that makes P2P trading work. After each completed trade, both parties receive a reputation update. The score is stored privately — users only see a tier (Bronze/Silver/Gold/Platinum) and a trade count, not the raw breakdown. A reputation proof is also issued per-chain so smart contracts can gate access (e.g., large trades require Gold tier).

### Research Notes

- Reputation score formula: `base = completed_trades * 10`. Deductions: `dispute_raised_against -= 20`, `cancelled_trade -= 5`. Bonuses: `dispute_won += 15`. Cap at 1000.
- Tier thresholds: Bronze (0-99), Silver (100-299), Gold (300-599), Platinum (600+).
- Reputation proof format follows the same adapter pattern as credentials: `{ tier, tradeCount, disputeRate }` — boolean claims only, not raw numbers, for privacy.
- Dispute rate: `disputes_lost / total_trades`. If > 10%, auto-flag for compliance review.

### Prisma Schema Additions

```prisma
model Reputation {
  id              String   @id @default(uuid())
  userId          String   @unique
  score           Int      @default(0)
  tier            RepTier  @default(BRONZE)
  completedTrades Int      @default(0)
  disputesWon     Int      @default(0)
  disputesLost    Int      @default(0)
  cancelledTrades Int      @default(0)
  updatedAt       DateTime @updatedAt
  user            User     @relation(fields: [userId], references: [id])
}

enum RepTier {
  BRONZE
  SILVER
  GOLD
  PLATINUM
}
```

### Tasks

- [ ] `reputation.service.ts`:
  - `initialize(userId)` — create reputation record on user registration
  - `onTradeCompleted(buyerId, sellerId)` — update both parties' scores
  - `onDisputeResolved(winnerId, loserId)` — apply win/loss modifiers
  - `onTradeCancelled(userId)` — deduct from canceller
  - `getTier(userId)` — returns `{ tier, tradeCount, score }` (not raw breakdown)
  - `getRepProof(userId, chain)` — returns chain-formatted reputation proof using same adapter pattern as credentials module
  - `checkDisputeRate(userId)` — if > 10%, emit `compliance.flagged` event
- [ ] `reputation.controller.ts`:
  - `GET /reputation/me` — user's own tier + count
  - `GET /reputation/me/:chain` — reputation proof for specific chain
  - `GET /reputation/user/:walletAddress` — public: returns only tier + trade count (privacy-preserving)
- [ ] Listen to `trade.completed` and `dispute.resolved` events via `EventEmitter2`

### Testing Phase 7

```
✅ New user has BRONZE tier, score 0
✅ trade.completed event        → both buyer and seller scores increase
✅ dispute.resolved BUYER       → buyer score +15, seller score -20
✅ Tier thresholds              → score 100 moves user to SILVER
✅ GET /reputation/me           → returns tier + tradeCount (not raw score)
✅ GET /reputation/user/:addr   → public endpoint returns tier only
✅ disputeRate > 10%            → emits compliance.flagged event
✅ getRepProof                  → returns chain-formatted proof
```

---

## Issue 8 — Events Gateway + Queue Hardening + Final Integration Test

### Status: `[ ] Open`
### Depends On: Issues 1-7 ✅

### What This Is

Wire everything together. Add WebSocket real-time events so the frontend knows the moment a trade status changes, a KYC gets approved, or a dispute resolves. Harden the BullMQ setup with dead-letter queues, retry strategies, and job monitoring. Run a full end-to-end integration test from registration → KYC → trade → completion.

### Research Notes

- `@nestjs/websockets` with `socket.io` adapter. Room-based: each user joins a room named by their userId. Trade events are emitted to both buyer and seller rooms.
- BullMQ dead-letter queue: failed jobs after 3 retries go to a `failed` queue. An admin dashboard endpoint exposes these for manual retry.
- `@bull-board/nestjs` package provides a web UI for queue monitoring at `/admin/queues`.
- Rate limiting: `@nestjs/throttler` on all public endpoints (10 req/min for webhook, 60 req/min for auth, 100 req/min for protected routes).
- Final integration: use Supertest to simulate the complete user journey in a single test file.

### Tasks

- [ ] `events.gateway.ts`:
  - `@WebSocketGateway({ cors: true })`
  - On connect: authenticate JWT from `socket.handshake.auth.token`, join user room
  - Emit: `trade.status_changed`, `kyc.status_changed`, `dispute.status_changed`, `credential.issued`
  - All service emit points wired: `EventEmitter2` → gateway broadcasts to relevant rooms
- [ ] BullMQ hardening:
  - Set `attempts: 3, backoff: { type: 'exponential', delay: 5000 }` on all queues
  - Dead-letter handler: on `failed` event, log with full context to DB `FailedJob` table
  - `@bull-board/nestjs` mounted at `/admin/queues` (admin-only)
- [ ] `@nestjs/throttler` configured globally, with override decorators on webhook route (higher limit)
- [ ] Final `.env.example` audit — all vars documented with descriptions
- [ ] Docker Compose final: postgres + redis + app service + optional pgAdmin
- [ ] README.md: local setup instructions, env var reference, API overview, architecture diagram link

### Testing Phase 8 (Full Integration)

```
✅ E2E: Register → login → initiate KYC → mock webhook Approved → compliance clears
       → credential issued → credential fetched (all 3 chains) → create trade
       → lock escrow → buyer marks payment sent → seller confirms → trade COMPLETED
       → reputation updated for both parties

✅ E2E: Trade → buyer marks payment sent → seller ignores → auto DISPUTED after 30s (test TTL)
       → admin submits resolution → escrow instruction emitted

✅ WebSocket: trade status change emitted to buyer + seller rooms in real time

✅ Rate limiting: 11th request in 1 min returns 429

✅ BullMQ: failed job retries 3x, lands in failed queue, visible in bull-board

✅ GET /health → 200 (all services connected: DB, Redis, BullMQ)
```

---

## Build Summary

| Issue | Module | Est. Time | Gate |
|---|---|---|---|
| 1 | Scaffold + Auth | 1–2 days | — |
| 2 | KYC (Didit) | 1–2 days | Issue 1 done |
| 3 | Compliance | 1 day | Issue 2 done |
| 4 | Credentials + Adapters | 1–2 days | Issue 3 done |
| 5 | Trades + Escrow | 2 days | Issue 4 done |
| 6 | Disputes | 1 day | Issue 5 done |
| 7 | Reputation | 1 day | Issue 5 done |
| 8 | Events + Integration | 1–2 days | Issues 6+7 done |
| **Total** | | **~10–12 days** | |

---

## Environment Variables Reference

```env
# App
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/proofRail

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT (RS256 — generate with: openssl genrsa -out private.pem 2048)
JWT_PRIVATE_KEY=<base64-encoded-private-key>
JWT_PUBLIC_KEY=<base64-encoded-public-key>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Didit KYC
DIDIT_API_KEY=<from-business.didit.me>
DIDIT_WEBHOOK_SECRET=<from-business.didit.me>
DIDIT_BASE_URL=https://apx.didit.me

# Compliance
OPENSANCTIONS_API_KEY=<free-from-opensanctions.org>
AML_VOLUME_THRESHOLD_USD=10000
AML_ROLLING_30D_THRESHOLD_USD=50000

# Credentials
CREDENTIAL_SECRET=<random-32-byte-hex>
CREDENTIAL_EXPIRY_DAYS=365

# Admin
ADMIN_SECRET=<for-seeding-first-admin-user>
```

---

*Backend complete → proceed to smart contracts (Fhenix → Midnight → Aleo)*
