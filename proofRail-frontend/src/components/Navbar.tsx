import { Link } from 'react-router-dom';
import { Wallet, ShieldCheck, LayoutDashboard, ShoppingCart, AlertCircle } from 'lucide-react';
import { useStore } from '../store/useStore';

const Navbar = () => {
  const { user, connectWallet, disconnectWallet } = useStore();

  return (
    <nav className="border-b border-surfaceHover bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <span className="font-display font-bold text-xl tracking-tight">PROOF<span className="text-primary">RAIL</span></span>
          </Link>
          
          <div className="hidden md:flex space-x-8">
            <Link to="/dashboard" className="text-gray-300 hover:text-white transition flex items-center space-x-1">
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
            <Link to="/marketplace" className="text-gray-300 hover:text-white transition flex items-center space-x-1">
              <ShoppingCart className="h-4 w-4" />
              <span>Marketplace</span>
            </Link>
            <Link to="/disputes" className="text-gray-300 hover:text-white transition flex items-center space-x-1">
              <AlertCircle className="h-4 w-4" />
              <span>Disputes</span>
            </Link>
          </div>

          <div className="flex items-center">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="px-3 py-1 bg-surface rounded-md border border-surfaceHover flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-sm font-mono text-gray-300">{user.walletAddress}</span>
                </div>
                <button 
                  onClick={disconnectWallet}
                  className="text-sm text-gray-400 hover:text-white transition"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button 
                onClick={connectWallet}
                className="bg-primary text-black px-4 py-2 rounded-md font-semibold hover:bg-primary/90 transition flex items-center space-x-2 shadow-[0_0_15px_rgba(0,240,255,0.3)]"
              >
                <Wallet className="h-4 w-4" />
                <span>Connect Wallet</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
