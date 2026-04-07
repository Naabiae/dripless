import { ShieldCheck, CheckCircle, AlertTriangle, Fingerprint } from 'lucide-react';
import { useStore } from '../store/useStore';

const Dashboard = () => {
  const { user } = useStore();

  if (!user) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center">
        <h2 className="text-3xl font-display font-bold mb-4">Access Denied</h2>
        <p className="text-gray-400">Please connect your wallet to view your dashboard.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
      <h1 className="text-4xl font-display font-bold mb-8 flex items-center space-x-3">
        <Fingerprint className="h-8 w-8 text-primary" />
        <span>Identity Dashboard</span>
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Status Card */}
        <div className="bg-surface/50 border border-surfaceHover rounded-xl p-8 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold font-display text-gray-200">KYC Status</h2>
            {user.kycStatus === 'APPROVED' ? (
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full border border-green-500/50 flex items-center space-x-1 text-sm font-semibold">
                <CheckCircle className="h-4 w-4" />
                <span>Verified</span>
              </span>
            ) : (
              <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full border border-yellow-500/50 flex items-center space-x-1 text-sm font-semibold">
                <AlertTriangle className="h-4 w-4" />
                <span>Pending</span>
              </span>
            )}
          </div>
          
          <div className="space-y-4">
            <div className="bg-background rounded-lg p-4 border border-surfaceHover flex justify-between items-center">
              <span className="text-gray-400 text-sm">Universal Credential ID</span>
              <span className="font-mono text-sm text-gray-200">cred_8f92a1...</span>
            </div>
            <div className="bg-background rounded-lg p-4 border border-surfaceHover flex justify-between items-center">
              <span className="text-gray-400 text-sm">Issued At</span>
              <span className="font-mono text-sm text-gray-200">2026-04-01 14:30 UTC</span>
            </div>
            <div className="bg-background rounded-lg p-4 border border-surfaceHover flex justify-between items-center">
              <span className="text-gray-400 text-sm">Compliance Tier</span>
              <span className="font-bold text-primary">{user.tier}</span>
            </div>
          </div>
          
          <button className="mt-8 w-full bg-surfaceHover hover:bg-surface text-white border border-gray-600 rounded-lg py-3 font-semibold transition">
            View Raw Credential (JSON)
          </button>
        </div>

        {/* Reputation Card */}
        <div className="bg-surface/50 border border-surfaceHover rounded-xl p-8 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold font-display text-gray-200">Reputation</h2>
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>

          <div className="flex justify-center items-center py-8">
            <div className="relative w-48 h-48 rounded-full border-4 border-surfaceHover flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin-slow"></div>
              <div className="text-center">
                <span className="block text-4xl font-bold font-display text-white">850</span>
                <span className="text-sm text-gray-400 tracking-wider uppercase">Score</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-background rounded-lg p-4 text-center border border-surfaceHover">
              <span className="block text-2xl font-bold text-green-400">12</span>
              <span className="text-xs text-gray-400 uppercase tracking-wide">Trades Won</span>
            </div>
            <div className="bg-background rounded-lg p-4 text-center border border-surfaceHover">
              <span className="block text-2xl font-bold text-red-400">0</span>
              <span className="text-xs text-gray-400 uppercase tracking-wide">Disputes Lost</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
