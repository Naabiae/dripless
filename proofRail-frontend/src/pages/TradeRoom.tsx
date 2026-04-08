import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, AlertTriangle, ShieldCheck, Lock } from 'lucide-react';
import { useStore } from '../store/useStore';
import { api } from '../services/api';

const TradeRoom = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useStore();
  const [trade, setTrade] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const fetchTrade = async () => {
    if (!id) return;
    try {
      const { data } = await api.get(`/trades/${id}`);
      setTrade(data);
    } catch (e) {
      console.error("Failed to fetch trade", e);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTrade();
      // Optional: Set up polling or websocket here
      const interval = setInterval(fetchTrade, 5000);
      return () => clearInterval(interval);
    }
  }, [user, id]);

  if (!user) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center">
        <h2 className="text-3xl font-display font-bold mb-4">Access Denied</h2>
        <p className="text-gray-400">Please connect your wallet to view the trade room.</p>
      </div>
    );
  }

  if (fetching && !trade) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center">
        <p className="text-gray-400">Loading trade details...</p>
      </div>
    );
  }

  if (!trade) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center">
        <h2 className="text-3xl font-display font-bold mb-4">Trade Not Found</h2>
        <p className="text-gray-400">The requested trade does not exist or you do not have access.</p>
      </div>
    );
  }

  const isSeller = user.id === trade.sellerId;
  const isBuyer = user.id === trade.buyerId;
  const status = trade.status;

  const handleAction = async () => {
    setLoading(true);
    try {
      if (status === 'PENDING' && isSeller) {
        // Mock a txHash for the lock-escrow action
        await api.post(`/trades/${id}/lock-escrow`, { txHash: '0xMockEscrowHash1234567890' });
      } else if (status === 'ESCROW_LOCKED' && isBuyer) {
        await api.post(`/trades/${id}/payment-sent`);
      } else if (status === 'PAYMENT_SENT' && isSeller) {
        await api.post(`/trades/${id}/confirm-payment`);
      }
      await fetchTrade();
    } catch (e: any) {
      console.error("Failed to perform action", e);
      alert(e.response?.data?.message || "Action failed");
    } finally {
      setLoading(false);
    }
  };

  let buttonText = 'Waiting for other party...';
  let buttonDisabled = true;

  if (status === 'PENDING' && isSeller) {
    buttonText = 'Lock Escrow (Simulate)';
    buttonDisabled = false;
  } else if (status === 'ESCROW_LOCKED' && isBuyer) {
    buttonText = 'Mark Payment Sent';
    buttonDisabled = false;
  } else if (status === 'PAYMENT_SENT' && isSeller) {
    buttonText = 'Confirm Fiat Received & Release';
    buttonDisabled = false;
  } else if (status === 'COMPLETED') {
    buttonText = 'Trade Completed';
    buttonDisabled = true;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
      <div className="bg-surface/50 border border-surfaceHover rounded-xl p-8 shadow-2xl relative overflow-hidden">
        
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

        <div className="flex justify-between items-center mb-8 border-b border-surfaceHover pb-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-white flex items-center space-x-3">
              <Lock className="h-6 w-6 text-primary" />
              <span>Escrow Room</span>
            </h1>
            <p className="text-gray-400 font-mono text-sm mt-2 tracking-wider">Trade ID: {id}</p>
          </div>
          
          <div className="bg-background px-6 py-2 rounded-lg border border-surfaceHover flex items-center space-x-2">
            <span className={`h-3 w-3 rounded-full ${status === 'COMPLETED' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
            <span className={`font-bold text-sm tracking-wider ${status === 'COMPLETED' ? 'text-green-400' : 'text-yellow-400'}`}>{status}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="space-y-6">
            <div className="bg-surface/80 rounded-lg p-6 border border-surfaceHover">
              <h3 className="text-lg font-bold font-display text-gray-200 mb-4 border-b border-surfaceHover pb-2">Trade Details</h3>
              <div className="flex justify-between py-2">
                <span className="text-gray-400">Asset</span>
                <span className="font-bold text-white">{trade.assetAmount} {trade.assetSymbol}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-400">Fiat Payment</span>
                <span className="font-bold text-white">{trade.fiatAmount} {trade.fiatCurrency}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-400">Network</span>
                <span className="font-bold text-primary">{trade.chain}</span>
              </div>
            </div>

            <div className="bg-surface/80 rounded-lg p-6 border border-surfaceHover">
              <h3 className="text-lg font-bold font-display text-gray-200 mb-4 border-b border-surfaceHover pb-2">Counterparty</h3>
              <div className="flex items-center space-x-4 mb-4">
                <div className="bg-background rounded-full p-3 border border-surfaceHover">
                  <ShieldCheck className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <p className="font-mono text-sm text-white">
                    {isBuyer ? `Seller: ${trade.sellerId.slice(0,8)}...` : `Buyer: ${trade.buyerId.slice(0,8)}...`}
                  </p>
                  <p className="text-xs text-green-400 font-semibold tracking-wider">KYC Verified</p>
                </div>
              </div>
              <div className="text-sm text-gray-400 bg-background p-3 rounded border border-surfaceHover font-mono break-all">
                Escrow Hash: {trade.escrowTxHash || '(Pending)'}
              </div>
            </div>
          </div>

          {/* Action Panel */}
          <div className="bg-background rounded-lg p-6 border border-surfaceHover shadow-inner flex flex-col justify-between relative">
            <div className="space-y-4">
              <h3 className="text-xl font-bold font-display text-white mb-6">Action Required</h3>
              
              <ul className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-surfaceHover before:to-transparent">
                <li className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active`}>
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow bg-background ${status === 'PENDING' ? 'border-primary text-primary' : 'border-green-500 text-green-500'}`}>
                    {status === 'PENDING' ? <Lock className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-surfaceHover shadow bg-surface/50">
                    <div className="font-bold text-gray-200">1. Lock Escrow</div>
                    <div className="text-sm text-gray-400">Seller locks crypto</div>
                  </div>
                </li>
                
                <li className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group`}>
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow bg-background ${status === 'ESCROW_LOCKED' ? 'border-primary text-primary' : status === 'PAYMENT_SENT' || status === 'COMPLETED' ? 'border-green-500 text-green-500' : 'border-surfaceHover text-gray-500'}`}>
                    {status === 'ESCROW_LOCKED' ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-surfaceHover shadow bg-surface/50">
                    <div className="font-bold text-gray-200">2. Fiat Payment</div>
                    <div className="text-sm text-gray-400">Buyer sends fiat</div>
                  </div>
                </li>

                <li className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group`}>
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow bg-background ${status === 'COMPLETED' ? 'border-green-500 text-green-500' : 'border-surfaceHover text-gray-500'}`}>
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-surfaceHover shadow bg-surface/50">
                    <div className="font-bold text-gray-200">3. Release</div>
                    <div className="text-sm text-gray-400">Seller confirms</div>
                  </div>
                </li>
              </ul>
            </div>

            <button 
              onClick={handleAction}
              disabled={buttonDisabled || loading}
              className={`mt-8 w-full py-4 rounded-lg font-bold text-lg transition duration-300 shadow-[0_0_20px_rgba(0,240,255,0.3)] ${
                buttonDisabled 
                ? 'bg-surfaceHover text-gray-400 border border-gray-600 cursor-not-allowed shadow-none' 
                : 'bg-primary text-black hover:bg-primary/90'
              }`}
            >
              {loading ? 'Processing...' : buttonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradeRoom;
