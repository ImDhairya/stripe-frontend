import { useState } from 'react';
import { Sparkles, Zap, Shield, Layers, ArrowRight } from 'lucide-react';
import { ProductShowcase } from '../showcase/ProductShowcase';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const [showShowcase, setShowShowcase] = useState(false);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Column: Information Panel (Hidden on small screens) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-zinc-950 flex-col justify-between p-12 overflow-hidden border-r border-white/10">
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-zinc-950 to-zinc-950" />
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full blur-[120px] bg-blue-500/10 pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] bg-purple-500/10 pointer-events-none" />
        
        {/* Top Section: Branding */}
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3 w-fit group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">PayGate</span>
          </Link>
        </div>

        {/* Middle Section: Project Info */}
        <div className="relative z-10 max-w-xl my-12">
          <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
            A production-grade payment gateway simulator.
          </h1>
          <p className="text-lg text-zinc-400 mb-8 leading-relaxed">
            Create an account to explore a fully functional payment state machine, real-time webhooks, API rate limiting, and role-based access control. No credit card required.
          </p>
          
          <div className="space-y-4 mb-10">
            <div className="flex items-start gap-4">
              <div className="mt-1 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-white font-medium mb-1">Admin Access</h3>
                <p className="text-sm text-zinc-400">
                  Sign up with an <code className="text-cyan-400 bg-cyan-400/10 px-1.5 py-0.5 rounded">@paygate.com</code> email address to automatically gain <span className="text-white font-medium">Admin privileges</span> and get a complete overview of the system and its users.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="mt-1 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <h3 className="text-white font-medium mb-1">Dual Processor Engine</h3>
                <p className="text-sm text-zinc-400">
                  Switch seamlessly between a deterministic dummy simulator for fast testing, or live Stripe API integration.
                </p>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setShowShowcase(true)}
            className="group flex items-center gap-3 px-5 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-300 text-white w-fit shadow-xl"
          >
            <div className="p-1.5 rounded-md bg-amber-500/20 group-hover:bg-amber-500/30 transition-colors">
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <span className="font-medium tracking-wide">Explore System Architecture</span>
            <ArrowRight className="w-4 h-4 text-white/50 group-hover:text-white transition-colors group-hover:translate-x-1" />
          </button>
        </div>

        {/* Bottom Section: Footer / Badges */}
        <div className="relative z-10 flex flex-wrap gap-3 opacity-60">
          {['Node.js', 'React', 'PostgreSQL', 'Redis', 'BullMQ'].map(tech => (
            <span key={tech} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-zinc-300">
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* Right Column: Form Panel */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 relative overflow-hidden bg-background">
        {/* Mobile Background (since left column is hidden) */}
        <div className="lg:hidden absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-background to-background" />
        
        {/* Mobile branding and showcase button */}
        <div className="lg:hidden absolute top-6 left-6 right-6 flex items-center justify-between z-10">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">PayGate</span>
          </Link>
          <button
            onClick={() => setShowShowcase(true)}
            className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            title="Explore Architecture"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
          </button>
        </div>

        <div className="w-full max-w-md relative z-10">
          {children}
        </div>
      </div>

      {showShowcase && <ProductShowcase onClose={() => setShowShowcase(false)} />}
    </div>
  );
}
