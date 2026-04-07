import { create } from 'zustand';

interface User {
  id: string;
  walletAddress: string;
  kycStatus: 'APPROVED' | 'PENDING' | 'NOT_STARTED';
  tier: string;
}

interface AppState {
  user: User | null;
  connectWallet: () => void;
  disconnectWallet: () => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  connectWallet: () => set({
    user: {
      id: 'mock-user-id',
      walletAddress: '0x1234...abcd',
      kycStatus: 'APPROVED',
      tier: 'GOLD',
    }
  }),
  disconnectWallet: () => set({ user: null }),
}));
