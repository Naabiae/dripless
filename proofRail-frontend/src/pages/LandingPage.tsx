import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Globe, Lock } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[150px] -z-10"></div>
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] -z-10"></div>
      
      <div className="max-w-4xl space-y-8 animate-fade-in-up">
        <h1 className="text-5xl sm:text-7xl font-extrabold font-display tracking-tighter leading-tight">
          Privacy-First <br /> P2P On/Off-Ramp
        </h1>
        <p className="text-xl sm:text-2xl text-gray-400 font-light max-w-2xl mx-auto">
          Verify your identity once. Trade securely across Midnight, Aleo, and Fhenix with a universal compliance credential.
        </p>
        <div className="flex justify-center space-x-6">
          <Link to="/marketplace" className="bg-primary text-background px-8 py-4 rounded-lg font-bold text-lg hover:bg-primary/90 transition flex items-center space-x-2 shadow-[0_0_25px_rgba(0,240,255,0.4)]">
            <span>Start Trading</span>
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link to="/dashboard" className="border border-surfaceHover bg-surface/50 backdrop-blur-sm px-8 py-4 rounded-lg font-bold text-lg hover:bg-surface transition">
            Get Verified
          </Link>
        </div>
      </div>

      <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
        <FeatureCard 
          icon={<Shield className="h-10 w-10 text-primary" />}
          title="Universal KYC"
          description="Complete KYC once and use your credential seamlessly across multiple blockchain networks."
        />
        <FeatureCard 
          icon={<Lock className="h-10 w-10 text-primary" />}
          title="Shielded Escrow"
          description="Trade details are kept completely private through zero-knowledge proofs on the Midnight network."
        />
        <FeatureCard 
          icon={<Globe className="h-10 w-10 text-primary" />}
          title="Cross-Chain Compatibility"
          description="Native support for Midnight, Aleo, and Fhenix with chain-specific credential formatting."
        />
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: ReactNode, title: string, description: string }) => (
  <div className="bg-surface/40 border border-surfaceHover rounded-xl p-8 text-left hover:border-primary/50 transition duration-300">
    <div className="mb-6 bg-background rounded-full w-16 h-16 flex items-center justify-center border border-surfaceHover shadow-inner">
      {icon}
    </div>
    <h3 className="text-2xl font-bold font-display mb-3">{title}</h3>
    <p className="text-gray-400 leading-relaxed">{description}</p>
  </div>
);

export default LandingPage;
