import React from 'react';
import { Loader2, Zap, ShieldCheck, Globe } from 'lucide-react';
import useStore from '../store';

const GlobalSyncOverlay = () => {
  const { isGlobalSyncing, config } = useStore();

  if (!isGlobalSyncing) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-md">
      <div className="glass-card p-12 rounded-3xl flex flex-col items-center gap-6 shadow-2xl border-white/20 bg-white/95 max-w-sm w-full mx-4 relative overflow-hidden">
        {/* Animated background pulse */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-[scan_2s_infinite]"></div>
        
        <div className="relative">
           <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
              <Zap size={48} className="text-primary animate-pulse" />
           </div>
           <Loader2 size={32} className="absolute -top-2 -right-2 text-secondary animate-spin" />
        </div>

        <div className="text-center">
           <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter italic">Global Pulse Sync</h3>
           <p className="text-neutral-custom font-medium mt-1 uppercase text-[10px] tracking-widest">Targeting Node: {config.pincode}</p>
        </div>

        <div className="w-full flex flex-col gap-3 mt-4">
           <div className="flex items-center gap-3 text-xs font-bold text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <ShieldCheck size={16} className="text-green-500" />
              <span>Bypassing Amazon Shields...</span>
           </div>
           <div className="flex items-center gap-3 text-xs font-bold text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <Globe size={16} className="text-primary" />
              <span>Calibrating Regional Intel...</span>
           </div>
        </div>

        <p className="text-[9px] font-black text-neutral-custom uppercase tracking-[0.2em] mt-2 animate-pulse">Initializing Data Extraction Layer</p>
      </div>
    </div>
  );
};

export default GlobalSyncOverlay;
