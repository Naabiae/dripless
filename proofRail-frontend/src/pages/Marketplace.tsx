import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightLeft, DollarSign, Filter, Search } from 'lucide-react';
import { useStore } from '../store/useStore';

const MOCK_TRADES = [
  { id: 'tr_1', sellerId: '0xabc...', assetAmount: 100, assetSymbol: 'USDT', fiatAmount: 100, fiatCurrency: 'USD', status: 'PENDING' },
  { id: 'tr_2', sellerId: '0xdef...', assetAmount: 50, assetSymbol: 'ETH', fiatAmount: 120000, fiatCurrency: 'NGN', status: 'PENDING' },
];

const Marketplace = () => {
  const { user } = useStore();
  const [searchTerm, setSearchTerm] = useState('');

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

      {/* Trade Grid */}
      <div className="grid grid-cols-1 gap-4">
        {MOCK_TRADES.map((trade) => (
          <div key={trade.id} className="bg-surface/30 border border-surfaceHover rounded-xl p-6 hover:border-primary/50 transition flex flex-col md:flex-row justify-between items-center group shadow-lg">
            <div className="flex items-center space-x-6 mb-4 md:mb-0 w-full md:w-auto">
              <div className="h-14 w-14 rounded-full bg-background border border-surfaceHover flex items-center justify-center shadow-inner">
                <DollarSign className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-display text-white">
                  Buy {trade.assetAmount} <span className="text-primary">{trade.assetSymbol}</span>
                </h3>
                <p className="text-gray-400 font-mono text-sm">Seller: {trade.sellerId}</p>
              </div>
            </div>

            <div className="flex flex-col items-end mb-4 md:mb-0 w-full md:w-auto text-right">
              <span className="text-2xl font-bold font-mono text-gray-200">
                {trade.fiatAmount.toLocaleString()} <span className="text-gray-500 text-lg">{trade.fiatCurrency}</span>
              </span>
              <span className="text-sm text-gray-500 uppercase tracking-wider">Total Price</span>
            </div>

            <div className="w-full md:w-auto flex justify-end">
              <Link to={`/trade/${trade.id}`} className="bg-surfaceHover border border-gray-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-black transition duration-300 w-full md:w-auto text-center">
                Accept Offer
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Marketplace;
