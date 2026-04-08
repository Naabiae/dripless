## 1. Architecture Design
```mermaid
graph TD
    subgraph Frontend [ProofRail Frontend App]
        A[React UI Components] --> B[Zustand State Management]
        B --> C[Ethers/viem Wallet Integration]
        C --> D[NestJS Backend API]
        D --> E[Midnight / Aleo / Fhenix Chains]
    end
```

## 2. Technology Description
- **Frontend**: React@18 + Tailwind CSS v3 + Vite
- **Initialization Tool**: `npm create vite@latest . -- --template react-ts`
- **State Management**: Zustand
- **Wallet Connection**: `viem` or `ethers` for signature generation.
- **Routing**: React Router DOM v6
- **Styling**: Tailwind CSS + `framer-motion` for animations.
- **Icons**: `lucide-react`

## 3. Route Definitions
| Route | Purpose |
|-------|---------|
| `/` | Landing page for unauthenticated users |
| `/dashboard` | User dashboard, KYC status, credential display |
| `/marketplace` | P2P trade listings and offer creation |
| `/trade/:id` | Specific trade escrow room (LOCKED, PAYMENT_SENT, COMPLETED) |
| `/disputes` | Dispute management (admin or user) |

## 4. API Definitions
The backend exposes REST endpoints built with NestJS. The frontend interacts using `axios` or `fetch`.

```typescript
type User = {
  id: string;
  walletAddress: string;
  role: 'USER' | 'ADMIN';
  kycStatus: 'APPROVED' | 'PENDING' | 'NOT_STARTED';
};

type Trade = {
  id: string;
  buyerId: string;
  sellerId: string;
  status: 'PENDING' | 'ESCROW_LOCKED' | 'PAYMENT_SENT' | 'COMPLETED' | 'DISPUTED';
  fiatAmount: number;
  fiatCurrency: string;
  assetAmount: number;
  assetSymbol: string;
};
```

## 5. Server Architecture Diagram
```mermaid
graph TD
    A[Frontend React] --> B[Auth Controller]
    A --> C[KYC Controller]
    A --> D[Trades Controller]
    B --> E[JWT / Wallet Verification]
    C --> F[Didit Webhooks]
    D --> G[Midnight DApp Driver]
    G --> H[Midnight Preprod Network]
```

## 6. Data Model
### 6.1 Data Model Definition
The frontend primarily maintains UI state and caches server responses.
```mermaid
erDiagram
    UI_STATE ||--o{ TRADE_CACHE : manages
    UI_STATE ||--o{ USER_SESSION : stores
    TRADE_CACHE {
        string id
        string status
    }
    USER_SESSION {
        string token
        string walletAddress
    }
```
