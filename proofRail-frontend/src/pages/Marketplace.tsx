import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRightLeft, DollarSign, Filter, Search, Activity } from 'lucide-react';
import { useStore } from '../store/useStore';
import { api } from '../services/api';

const MOCK_OFFERS = [
  { id: 'offer_1', sellerId: '0x1234567890abcdef1234567890abcdef12345678', assetAmount: 100, assetSymbol: 'USDT', fiatAmount: 100, fiatCurrency: 'USD', chain: 'MIDNIGHT', paymentMethod: 'BANK_TRANSFER' },
  { id: 'offer_2', sellerId: '0xabcdef1234567890abcdef1234567890abcdef12', assetAmount: 50, assetSymbol: 'ETH', fiatAmount: 120000, fiatCurrency: 'NGN', chain: 'ALEO', paymentMethod: 'MOBILE_MONEY' },
];

const Marketplace = () => {
  const { user } = useStore();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTrades, setActiveTrades] = useState<any[]>([]);
  const [creatingTradeId, setCreatingTradeId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchActiveTrades();
    }
  }, [user]);

  const fetchActiveTrades = async () => {
    try {
      const { data } = await api.get('/trades/active');
      setActiveTrades(data);
    } catch (error) {
      console.error('Failed to fetch active trades:', error);
    }
  };

  const handleAcceptOffer = async (offer: any) => {
    setCreatingTradeId(offer.id);
    try {
      const { data: newTrade } = await api.post('/trades', {
        sellerId: offer.sellerId,
        chain: offer.chain,
        assetSymbol: offer.assetSymbol,
        assetAmount: offer.assetAmount,
        fiatCurrency: offer.fiatCurrency,
        fiatAmount: offer.fiatAmount,
        fiatRate: offer.fiatAmount / offer.assetAmount,
        paymentMethod: offer.paymentMethod,
      });
      navigate(`/trade/${newTrade.id}`);
    } catch (error: any) {
      console.error('Failed to accept offer:', error);
      alert(error.response?.data?.message || 'Failed to create trade. Ensure your KYC is APPROVED and Compliance is CLEAR.');
    } finally {
      setCreatingTradeId(null);
    }
  };

  if (!user) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center">
        <h2 className="text-3xl font-display font-bold mb-4">Access Denied</h2>
        <p className="text-gray-400">Please connect your wallet to view the marketplace.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
      <div className="flex justify-between items-center mb-8 border-b border-surfaceHover pb-4">
        <h1 className="text-4xl font-display font-bold flex items-center space-x-3">
          <ArrowRightLeft className="h-8 w-8 text-primary" />
          <span>P2P Offers</span>
        </h1>
        <button className="bg-primary text-black px-6 py-3 rounded-lg font-bold hover:bg-primary/90 transition shadow-[0_0_15px_rgba(0,240,255,0.2)]">
          Create Offer
        </button>
      </div>

      {/* Active Trades Summary */}
      {activeTrades.length > 0 && (
        <div className="mb-12 bg-surface/50 border border-primary/30 rounded-xl p-6 shadow-[0_0_20px_rgba(0,240,255,0.05)]">
          <h2 className="text-xl font-bold font-display text-white mb-4 flex items-center space-x-2">
            <Activity className="h-5 w-5 text-primary" />
            <span>My Active Trades ({activeTrades.length})</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeTrades.map(trade => (
              <Link 
                key={trade.id} 
                to={`/trade/${trade.id}`}
                className="bg-background rounded-lg p-4 border border-surfaceHover hover:border-primary/50 transition block group"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm text-gray-400 font-mono">ID: {trade.id.slice(0, 8)}...</span>
                  <span className="text-xs font-bold px-2 py-1 rounded bg-surfaceHover text-primary uppercase">{trade.status}</span>
                </div>
                <div className="text-lg font-bold text-white mb-1">
                  {trade.assetAmount} {trade.assetSymbol} 
                  <span className="text-gray-500 mx-2">→</span> 
                  {trade.fiatAmount} {trade.fiatCurrency}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by asset or currency..." 
            className="w-full bg-surface border border-surfaceHover text-white rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-primary transition"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-4">
          <select className="bg-surface border border-surfaceHover text-white rounded-lg px-4 py-3 focus:outline-none focus:border-primary appearance-none cursor-pointer">
            <option>All Chains</option>
            <option>Midnight</option>
            <option>Aleo</option>
            <option>Fhenix</option>
          </select>
          <button className="bg-surface border border-surfaceHover text-white rounded-lg px-4 py-3 hover:bg-surfaceHover transition flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Offers Grid */}
      <div className="grid grid-cols-1 gap-4">
        {MOCK_OFFERS.map((offer) => (
          <div key={offer.id} className="bg-surface/30 border border-surfaceHover rounded-xl p-6 hover:border-primary/50 transition flex flex-col md:flex-row justify-between items-center group shadow-lg">
            <div className="flex items-center space-x-6 mb-4 md:mb-0 w-full md:w-auto">
              <div className="h-14 w-14 rounded-full bg-background border border-surfaceHover flex items-center justify-center shadow-inner">
                <DollarSign className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-display text-white">
                  Buy {offer.assetAmount} <span className="text-primary">{offer.assetSymbol}</span>
                </h3>
                <p className="text-gray-400 font-mono text-sm">Seller: {offer.sellerId.slice(0, 10)}...{offer.sellerId.slice(-4)}</p>
                <div className="flex gap-2 mt-1">
                  <span className="text-xs bg-surfaceHover px-2 py-0.5 rounded text-gray-300">{offer.chain}</span>
                  <span className="text-xs bg-surfaceHover px-2 py-0.5 rounded text-gray-300">{offer.paymentMethod.replace('_', ' ')}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end mb-4 md:mb-0 w-full md:w-auto text-right">
              <span className="text-2xl font-bold font-mono text-gray-200">
                {offer.fiatAmount.toLocaleString()} <span className="text-gray-500 text-lg">{offer.fiatCurrency}</span>
              </span>
              <span className="text-sm text-gray-500 uppercase tracking-wider">Total Price</span>
            </div>

            <div className="w-full md:w-auto flex justify-end">
              <button 
                onClick={() => handleAcceptOffer(offer)}
                disabled={creatingTradeId === offer.id}
                className="bg-surfaceHover border border-gray-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-black transition duration-300 w-full md:w-auto text-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingTradeId === offer.id ? 'Accepting...' : 'Accept Offer'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Marketplace;
