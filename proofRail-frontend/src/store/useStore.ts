import { create } from 'zustand';
import { ethers } from 'ethers';
import { api } from '../services/api';

export interface User {
  id: string;
  walletAddress: string;
  kycStatus: 'APPROVED' | 'PENDING' | 'NOT_STARTED';
  tier: string;
}

interface AppState {
  user: User | null;
  isConnecting: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  fetchUserStatus: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  user: null,
  isConnecting: false,

  connectWallet: async () => {
    set({ isConnecting: true });
    try {
      let address: string;
      let signature: string;

      // Check if MetaMask or similar is available
      if ((window as any).ethereum) {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        address = await signer.getAddress();

        // Get nonce from backend
        const { data: nonceData } = await api.post('/auth/wallet/nonce', { address });
        const nonce = nonceData.nonce;

        // Sign message
        signature = await signer.signMessage(nonce);
      } else {
        // Fallback: Generate a random wallet for testing if no provider is injected
        console.warn("No Web3 provider found. Using a random mock wallet for testing.");
        
        // Try to load mock wallet from local storage to persist session during testing
        let mockPrivateKey = localStorage.getItem('mockPrivateKey');
        let wallet: any;
        
        if (mockPrivateKey) {
          wallet = new ethers.Wallet(mockPrivateKey);
        } else {
          wallet = ethers.Wallet.createRandom();
          localStorage.setItem('mockPrivateKey', wallet.privateKey);
        }

        address = wallet.address;
        
        const { data: nonceData } = await api.post('/auth/wallet/nonce', { address });
        const nonce = nonceData.nonce;
        signature = await wallet.signMessage(nonce);
      }

      // Verify signature with backend
      const { data: tokens } = await api.post('/auth/wallet/verify', { address, signature });
      
      // Store tokens
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);

      // Fetch user KYC status
      await get().fetchUserStatus();
      
    } catch (error) {
      console.error("Failed to connect wallet", error);
      alert("Failed to connect wallet. See console for details.");
    } finally {
      set({ isConnecting: false });
    }
  },

  disconnectWallet: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null });
  },

  fetchUserStatus: async () => {
    try {
      // In a real scenario, you'd fetch user details from /users/me or similar.
      // For now, we fetch KYC status and reputation.
      
      let kycStatus = 'NOT_STARTED';
      try {
        const { data: kycData } = await api.get('/kyc/status');
        kycStatus = kycData.status || 'NOT_STARTED';
      } catch (e) {
        // KYC endpoint might 404 if no session exists, which is fine
        console.log("No KYC session found");
      }

      let tier = 'BRONZE';
      try {
        const { data: repData } = await api.get('/reputation/me');
        tier = repData.tier || 'BRONZE';
      } catch (e) {
        console.log("No reputation found, defaulting to BRONZE");
      }

      // Assuming we have wallet address stored in a local way, or we can decode JWT
      const token = localStorage.getItem('accessToken');
      let userId = 'unknown';
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          userId = payload.sub || payload.id;
        } catch (e) {
          console.error("Failed to decode token");
        }
      }

      set({
        user: {
          id: userId,
          walletAddress: (window as any).ethereum ? ((window as any).ethereum as any).selectedAddress || '0x...' : localStorage.getItem('mockPrivateKey') ? new ethers.Wallet(localStorage.getItem('mockPrivateKey')!).address : '0x...',
          kycStatus: kycStatus as any,
          tier,
        }
      });
    } catch (error) {
      console.error("Failed to fetch user status", error);
    }
  }
}));
