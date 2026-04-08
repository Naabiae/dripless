import { AlertCircle, ShieldAlert } from 'lucide-react';
import { useStore } from '../store/useStore';

const Disputes = () => {
  const { user } = useStore();

  if (!user) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center">
        <h2 className="text-3xl font-display font-bold mb-4">Access Denied</h2>
        <p className="text-gray-400">Please connect your wallet to view disputes.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
      <div className="flex justify-between items-center mb-8 border-b border-surfaceHover pb-4">
        <h1 className="text-4xl font-display font-bold flex items-center space-x-3">
          <ShieldAlert className="h-8 w-8 text-red-500" />
          <span>Dispute Center</span>
        </h1>
      </div>

      <div className="bg-surface/50 border border-surfaceHover rounded-xl p-12 text-center shadow-xl">
        <div className="bg-background w-24 h-24 rounded-full mx-auto flex items-center justify-center border border-surfaceHover shadow-inner mb-6">
          <AlertCircle className="h-12 w-12 text-gray-500" />
        </div>
        <h2 className="text-2xl font-bold font-display text-white mb-4">No Active Disputes</h2>
        <p className="text-gray-400 max-w-lg mx-auto leading-relaxed">
          You currently have no active disputes. If a trade encounters issues after payment is sent, you can raise a dispute from the trade room.
        </p>
      </div>
    </div>
  );
};

export default Disputes;
