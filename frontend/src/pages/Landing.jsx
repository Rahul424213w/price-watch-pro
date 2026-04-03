import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, ShieldCheck, Globe, BarChart3, ArrowRight, Activity, Cpu, Brain, Network, Bell } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center">
      {/* Hero Section */}
      <div className="w-full max-w-7xl px-6 pt-20 pb-32 flex flex-col items-center text-center gap-8">
        <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full border border-primary/20 animate-fade-in">
          <Zap size={16} className="text-primary fill-primary" />
          <span className="text-xs font-black text-primary uppercase tracking-widest leading-none">v2.0 Performance Engine Active</span>
        </div>
        
        <h1 className="text-6xl md:text-8xl font-black text-slate-900 leading-[0.9] uppercase tracking-tighter italic">
          PriceWatch<span className="text-primary">Pro</span>
        </h1>
        
        <p className="max-w-2xl text-xl text-slate-600 font-medium leading-relaxed">
          The ultimate Amazon India competitive intelligence platform. 
          Real-time Buy Box tracking, multi-location analysis, and production-grade anti-bot bypass.
        </p>

        <div className="flex gap-4 mt-4">
          <Link to="/dashboard" className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-tighter italic hover:bg-primary transition-all shadow-xl shadow-slate-200 flex items-center gap-3 group">
            Launch Protocol <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <a href="#features" className="bg-white text-slate-900 border-2 border-slate-100 px-10 py-5 rounded-2xl font-black uppercase tracking-tighter italic hover:border-primary transition-all flex items-center gap-3">
            Specs Overview
          </a>
        </div>

        {/* Floating Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mt-20">
          <div className="glass-card p-8 rounded-3xl flex flex-col items-center gap-4 hover:-translate-y-2 transition-all">
             <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-600">
                <ShieldCheck size={32} />
             </div>
             <h3 className="font-black text-xl uppercase tracking-tighter italic">Anti-Bot Hardened</h3>
             <p className="text-sm text-slate-500 font-medium leading-snug">ScraperAPI rotation with curl_cffi TLS impersonation for 99.9% success rates.</p>
          </div>
          <div className="glass-card p-8 rounded-3xl flex flex-col items-center gap-4 hover:-translate-y-2 transition-all border-primary/20 shadow-xl shadow-primary/5">
             <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <Globe size={32} />
             </div>
             <h3 className="font-black text-xl uppercase tracking-tighter italic">Regional Intel</h3>
             <p className="text-sm text-slate-500 font-medium leading-snug">Simulate delivery across 10,000+ PIN codes to uncover geographic price shifts.</p>
          </div>
          <div className="glass-card p-8 rounded-3xl flex flex-col items-center gap-4 hover:-translate-y-2 transition-all">
             <div className="w-14 h-14 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary">
                <BarChart3 size={32} />
              </div>
              <h3 className="font-black text-xl uppercase tracking-tighter italic">Alpha Analytics</h3>
              <p className="text-sm text-slate-500 font-medium leading-snug">Buy Box win rate calculations and price volatility scoring for strategic edges.</p>
           </div>
          <div className="glass-card p-8 rounded-3xl flex flex-col items-center gap-4 hover:-translate-y-2 transition-all border-primary/20 shadow-xl shadow-primary/5">
             <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <Brain size={32} />
             </div>
             <h3 className="font-black text-xl uppercase tracking-tighter italic">Neural Advisor</h3>
             <p className="text-sm text-slate-500 font-medium leading-snug">Llama 3 powered pricing strategies, undercut predictions, and regional intelligence.</p>
          </div>
          <div className="glass-card p-8 rounded-3xl flex flex-col items-center gap-4 hover:-translate-y-2 transition-all">
             <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500">
                <Network size={32} />
             </div>
             <h3 className="font-black text-xl uppercase tracking-tighter italic">Distributed Scale</h3>
             <p className="text-sm text-slate-500 font-medium leading-snug">Celery and Redis powered task execution architecture for global concurrency.</p>
          </div>
          <div className="glass-card p-8 rounded-3xl flex flex-col items-center gap-4 hover:-translate-y-2 transition-all border-primary/20 shadow-xl shadow-primary/5">
             <div className="w-14 h-14 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500">
                <Bell size={32} />
             </div>
             <h3 className="font-black text-xl uppercase tracking-tighter italic">Sentinel Alerts</h3>
             <p className="text-sm text-slate-500 font-medium leading-snug">Autonomous SMTP protocols trigger when vital market thresholds are breached.</p>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div id="features" className="w-full bg-slate-900 py-32 flex flex-col items-center px-6">
         <div className="max-w-7xl w-full">
            <h2 className="text-slate-100 text-4xl md:text-5xl font-black uppercase tracking-tighter italic mb-20 text-center">
               Engineered for <span className="text-primary">Dominance</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
               <div className="flex flex-col gap-4">
                  <Activity className="text-primary" size={40} />
                  <h4 className="text-white font-black uppercase tracking-widest text-sm">Real-Time Telemetry</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">Instant updates on price drops, new sellers, and stock fluctuations with zero latency.</p>
               </div>
               <div className="flex flex-col gap-4">
                  <Cpu className="text-secondary" size={40} />
                  <h4 className="text-white font-black uppercase tracking-widest text-sm">Safe Concurrency</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">Massive-scale monitoring via controlled parallel scraping and intelligent rate limiting.</p>
               </div>
               <div className="flex flex-col gap-4">
                  <ShieldCheck className="text-tertiary" size={40} />
                  <h4 className="text-white font-black uppercase tracking-widest text-sm">Secure Vault</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">Enterprise-grade database scalability with full historical data preservation.</p>
               </div>
               <div className="flex flex-col gap-4">
                  <BarChart3 className="text-green-500" size={40} />
                  <h4 className="text-white font-black uppercase tracking-widest text-sm">Data Export</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">Download deep-dive intelligence reports in CSV and high-fidelity PDF formats.</p>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Landing;
