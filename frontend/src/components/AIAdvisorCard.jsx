import React, { useState, useEffect } from 'react';
import { Brain, Zap, TrendingUp, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import useStore from '../store';

const AIAdvisorCard = ({ asin }) => {
  const { getAIPricingAdvice, getAIMarketInsight } = useStore();
  const [advice, setAdvice] = useState('');
  const [insight, setInsight] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('strategy');

  useEffect(() => {
    const fetchAIIntel = async () => {
      setIsLoading(true);
      const [adviceRes, insightRes] = await Promise.all([
        getAIPricingAdvice(asin),
        getAIMarketInsight(asin)
      ]);
      setAdvice(adviceRes);
      setInsight(insightRes);
      setIsLoading(false);
    };
    fetchAIIntel();
  }, [asin]);

  if (isLoading) {
    return (
      <div className="glass-card p-8 rounded-3xl border-primary/20 bg-white/50 shadow-2xl relative overflow-hidden min-h-[300px] flex flex-col items-center justify-center text-center">
        <Loader2 size={40} className="text-primary animate-spin mb-4" />
        <p className="text-slate-500 font-black uppercase tracking-widest text-xs animate-pulse">Initializing Neural Link...</p>
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-3xl border-primary/10 bg-white/80 shadow-xl relative overflow-hidden flex flex-col group transition-all duration-500 hover:shadow-primary/5">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-sm">
            <Brain size={20} />
          </div>
          <div>
            <h3 className="text-slate-900 font-black uppercase tracking-tighter italic text-lg leading-none">Neural Strategic Advisor</h3>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Llama-3-70B Intelligence Engine</p>
          </div>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
           <button 
             onClick={() => setActiveTab('strategy')}
             className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'strategy' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-primary'}`}
           >
             Strategy
           </button>
           <button 
             onClick={() => setActiveTab('insight')}
             className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'insight' ? 'bg-secondary text-white shadow-lg shadow-secondary/20' : 'text-slate-500 hover:text-secondary'}`}
           >
             Market Pulse
           </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-8 relative min-h-[220px]">
        {activeTab === 'strategy' ? (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className="flex items-start gap-4 p-5 rounded-2xl bg-primary/5 border border-primary/10 shadow-inner">
               <TrendingUp size={24} className="text-primary mt-1 shrink-0" />
               <div>
                  <p className="text-slate-700 text-sm leading-relaxed italic font-bold">"{advice}"</p>
               </div>
            </div>
            <div className="flex items-center gap-2 text-primary">
               <Sparkles size={14} className="animate-pulse" />
               <span className="text-[9px] font-black uppercase tracking-[0.2em]">Live Tactical Recommendation</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6 animate-fade-in">
             <div className="flex items-start gap-4 p-5 rounded-2xl bg-secondary/5 border border-secondary/10 shadow-inner">
                <Zap size={24} className="text-secondary mt-1 shrink-0" />
                <div>
                   <p className="text-slate-700 text-sm leading-relaxed italic font-bold">{insight}</p>
                </div>
             </div>
             <div className="flex items-center gap-2 text-secondary">
                <AlertCircle size={14} className="animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em]">Neural Market Identification</span>
             </div>
          </div>
        )}
      </div>

      {/* Footer Meta */}
      <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
         <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
               <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_#22c55e]"></div>
               <span className="text-[8px] text-slate-500 font-black uppercase">Node Active</span>
            </div>
            <div className="flex items-center gap-1.5">
               <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_5px_#3b82f6]"></div>
               <span className="text-[8px] text-slate-500 font-black uppercase">Groq LPU Enabled</span>
            </div>
         </div>
         <span className="text-[8px] text-slate-400 font-bold uppercase italic tracking-widest">v4.0.2 Intelligence Burst</span>
      </div>

      {/* Visual background accents */}
      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl opacity-50 group-hover:bg-primary/20 transition-all"></div>
      <div className="absolute top-0 left-0 w-20 h-20 bg-secondary/5 rounded-full blur-2xl opacity-30"></div>
    </div>
  );
};

export default AIAdvisorCard;
