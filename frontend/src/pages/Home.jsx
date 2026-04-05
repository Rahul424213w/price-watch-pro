import React, { useEffect, useState } from 'react';
import DashboardCard from '../components/DashboardCard';
import PriceChart from '../components/PriceChart';
import { TrendingDown, Package, ShoppingCart, UserCheck, ArrowRight, ShieldCheck, Search, Loader2, Zap, Globe, BarChart3, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import useStore from '../store';
import { formatLocalizedDate } from '../utils/dateUtils';
import RegionalModal from '../components/RegionalModal';
import IntelligenceFeed from '../components/IntelligenceFeed';

const Home = () => {
  const { dashboardStats, fetchDashboardStats, products, fetchAllProducts, config, setConfigOpen, syncAllProducts, exportReport } = useStore();
  const [isLoading, setIsLoading] = useState(true);
  const [activeRegionalProduct, setActiveRegionalProduct] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchDashboardStats(), fetchAllProducts()]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchDashboardStats, fetchAllProducts, config.pincode]);

  const handleGlobalSync = async () => {
    await syncAllProducts();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-6">
        <Zap size={64} className="animate-pulse text-primary opacity-20" />
        <p className="text-xl font-black text-slate-800 uppercase tracking-tighter italic">Synchronizing Intelligence Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10 pb-20">
      {activeRegionalProduct && (
        <RegionalModal 
          product={activeRegionalProduct} 
          onClose={() => setActiveRegionalProduct(null)} 
        />
      )}

      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
             <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">Command Center</h3>
             <p className="text-neutral-custom font-medium mt-1 max-w-lg">High-level strategic overview of your entire competitive monitoring universe and market health dynamics.</p>
          </div>
          <div className="flex gap-3">
             <span className="text-[10px] font-black text-primary bg-primary/10 px-4 py-2.5 rounded-xl uppercase tracking-widest shadow-sm border border-primary/10">
                Proxy: ScraperAPI Active
             </span>
             <span className="text-[10px] font-black text-secondary bg-secondary/10 px-4 py-2.5 rounded-xl uppercase tracking-widest shadow-sm border border-secondary/10">
                Node: {config.pincode}
             </span>
          </div>
      </div>

      {/* Strategic Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link to="/search" className="glass-card p-6 rounded-2xl flex flex-col gap-4 group hover:border-primary/40 transition-all duration-300 relative overflow-hidden bg-white">
           <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-md">
             <Search size={22} />
           </div>
           <div>
              <h4 className="font-black text-slate-800 text-lg uppercase tracking-tighter group-hover:text-primary">Discovery</h4>
              <p className="text-neutral-custom text-xs mt-1 font-medium italic">Scan Amazon ecosystem for new assets</p>
           </div>
           <ArrowRight size={16} className="absolute bottom-6 right-6 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </Link>
        <Link to="/tracked" className="glass-card p-6 rounded-2xl flex flex-col gap-4 group hover:border-secondary/40 transition-all duration-300 relative overflow-hidden bg-white">
           <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-white transition-all shadow-md">
             <Package size={22} />
           </div>
           <div>
              <h4 className="font-black text-slate-800 text-lg uppercase tracking-tighter group-hover:text-secondary">Universe</h4>
              <p className="text-neutral-custom text-xs mt-1 font-medium italic">Manage active asset collection</p>
           </div>
           <ArrowRight size={16} className="absolute bottom-6 right-6 text-slate-300 group-hover:text-secondary group-hover:translate-x-1 transition-all" />
        </Link>
        <Link to="/alerts" className="glass-card p-6 rounded-2xl flex flex-col gap-4 group hover:border-primary/40 transition-all duration-300 relative overflow-hidden bg-white">
           <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-md">
             <ShieldCheck size={22} />
           </div>
           <div>
              <h4 className="font-black text-slate-800 text-lg uppercase tracking-tighter group-hover:text-primary">Sentinels</h4>
              <p className="text-neutral-custom text-xs mt-1 font-medium italic">Configure automated triggers</p>
           </div>
           <ArrowRight size={16} className="absolute bottom-6 right-6 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </Link>
        <div 
          onClick={() => setConfigOpen(true)}
          className="glass-card p-6 rounded-2xl flex flex-col gap-4 bg-white border-none group transition-all duration-300 relative overflow-hidden cursor-pointer hover:shadow-xl"
        >
           <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-md">
             <Globe size={22} />
           </div>
           <div>
              <h4 className="font-black text-slate-800 text-lg uppercase tracking-tighter">Global Nodes</h4>
              <p className="text-slate-600 text-xs mt-1 font-medium italic">Switch location simulation</p>
           </div>
           <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl"></div>
           <ArrowRight size={16} className="absolute bottom-6 right-6 text-slate-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard 
          title="Total Market Value" 
          value={`₹${(dashboardStats.total_market_value || 0).toLocaleString()}`} 
          icon={TrendingDown} 
          colorClass="bg-green-500 shadow-green-100" 
          change={2.4}
        />
        <DashboardCard 
          title="Tracked Assets" 
          value={dashboardStats.tracked_count || 0} 
          icon={Package} 
          colorClass="bg-primary shadow-primary/20" 
          change={-1.2}
        />
        <DashboardCard 
          title="Avg Market Price" 
          value={`₹${Math.round(dashboardStats.avg_market_price || 0).toLocaleString()}`} 
          icon={UserCheck} 
          colorClass="bg-secondary shadow-secondary/20" 
          change={0.5}
        />
        <DashboardCard 
          title="Active Sentinels" 
          value={dashboardStats.active_alerts || 0} 
          icon={ShieldCheck} 
          colorClass="bg-tertiary shadow-tertiary/20" 
          change={0}
        />
      </div>

      {/* Main Grid: Multi-Column Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         {/* Left 2/3 Column: Intelligence Stream */}
         <div className="lg:col-span-2 flex flex-col gap-10">
            {/* 1. Active Monitoring Section */}
            <div className="flex flex-col gap-6">
               <div className="flex justify-between items-center px-1">
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter italic flex items-center gap-2">
                    <Activity size={20} className="text-primary" /> Active Monitoring
                  </h3>
                  <Link to="/tracked" className="text-[10px] font-black text-primary uppercase border-b-2 border-primary/20 hover:border-primary transition-all pb-1">Universe Explorer</Link>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(products || []).length > 0 ? products.slice(0, 4).map(p => (
                     <Link key={p.asin} to={`/product/${p.asin}`} className="glass-card p-5 rounded-2xl flex items-center gap-5 hover:shadow-xl transition-all border-white/20 group bg-white">
                        <div className="w-20 h-20 bg-slate-50 rounded-xl overflow-hidden p-3 border border-slate-100 group-hover:scale-105 transition-transform">
                           <img src={p.image_url} alt={p.title} className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                           <div className="flex items-center gap-2 mb-1">
                              <span className="text-[8px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded uppercase">{p.asin}</span>
                              {p.is_out_of_stock && <span className="text-[8px] font-black bg-red-500 text-white px-2 py-0.5 rounded uppercase">OOS</span>}
                           </div>
                           <h4 className="font-bold text-slate-700 text-sm truncate uppercase tracking-tighter group-hover:text-primary transition-colors">{p.title}</h4>
                           <p className="text-secondary font-black text-xl italic mt-1 leading-none">₹{(p.current_price || 0).toLocaleString()}</p>
                        </div>
                     </Link>
                  )) : (
                     <div className="col-span-2 glass-card p-20 flex flex-col items-center justify-center opacity-40 grayscale italic border-dashed">
                        <Package size={48} className="mb-4" />
                        <p className="font-black uppercase tracking-widest">No Active Telemetry</p>
                     </div>
                  )}
               </div>
            </div>

            {/* 2. Evolutionary Intel Feed */}
            <div className="flex flex-col gap-6">
               <div className="flex justify-between items-center px-1">
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter italic flex items-center gap-2">
                    <Zap size={20} className="text-secondary" /> Latest Fleet Fluctuations
                  </h3>
               </div>
               <div className="glass-card p-6 rounded-3xl bg-white border-none shadow-xl flex flex-col gap-0 divide-y divide-slate-100 italic">
                  {(products || []).length > 0 ? products.slice(0, 5).map((p, idx) => (
                     <div key={idx} className="py-4 flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-slate-50 rounded-lg overflow-hidden p-1 border border-slate-100">
                              <img src={p.image_url} alt="" className="w-full h-full object-contain" />
                           </div>
                           <div className="overflow-hidden">
                              <p className="text-[10px] font-black text-primary uppercase tracking-widest">{p.asin}</p>
                              <p className="text-[10px] font-bold text-slate-700 truncate max-w-[200px]">{p.title}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-xs font-black text-secondary italic">₹{(p.current_price || 0).toLocaleString()}</p>
                           <p className="text-[8px] font-bold text-neutral-custom uppercase">Localized: {formatLocalizedDate(p.last_updated)}</p>
                        </div>
                     </div>
                  )) : (
                     <p className="py-10 text-center text-xs font-bold text-neutral-custom">Waiting for intelligence stream...</p>
                  )}
               </div>
            </div>

            {/* 3. Fleet Buy Box Analysis */}
            <div className="flex flex-col gap-6">
               <div className="flex justify-between items-center px-1">
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter italic flex items-center gap-2">
                    <ShieldCheck size={20} className="text-primary" /> Buy Box Dominance Leaderboard
                  </h3>
               </div>
               <div className="glass-card p-8 rounded-3xl bg-white border-none shadow-xl relative overflow-hidden">
                  <div className="relative z-10 flex flex-col gap-6">
                     <div className="flex items-center justify-between">
                        <div>
                           <p className="text-primary font-black text-4xl italic leading-none">{dashboardStats.buybox_coverage_rate || 0}%</p>
                           <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2">Global Marketplace Coverage</p>
                        </div>
                        <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-pulse shadow-[0_0_20px_rgba(0,111,255,0.1)]"></div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-secondary/40 transition-all">
                           <p className="text-secondary font-black text-2xl italic">{(products || []).filter(p => !p.is_out_of_stock).length}</p>
                           <p className="text-slate-600 text-[8px] font-black uppercase tracking-widest mt-1">Assets In Stock</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-primary/40 transition-all">
                           <p className="text-primary font-black text-2xl italic">{dashboardStats.active_alerts || 0}</p>
                           <p className="text-slate-600 text-[8px] font-black uppercase tracking-widest mt-1">Active Monitors</p>
                        </div>
                     </div>
                  </div>
                  {/* Visual Accents */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/5 rounded-full blur-3xl"></div>
               </div>
            </div>
         </div>

         {/* Right Column: Strategic Intel Sidebar */}
         <div className="flex flex-col gap-8">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter italic px-1">Tactical Side-Ops</h3>
            
            <div className="glass-card p-6 rounded-3xl bg-white/90 border-slate-100 relative overflow-hidden shadow-xl">
               <div className="relative z-10">
                  <h4 className="text-slate-500 font-black uppercase tracking-widest text-[10px] mb-4 opacity-70">Market Integrity Index</h4>
                  <div className="flex flex-col gap-4">
                     <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">In-Stock Rate</span>
                        <span className="text-secondary text-xs font-black uppercase">{dashboardStats.in_stock_rate || 0}%</span>
                      </div>
                      <div className="w-full h-1 bg-slate-100 rounded-full">
                         <div 
                           className="h-full bg-secondary rounded-full shadow-sm" 
                           style={{ width: `${dashboardStats.in_stock_rate || 0}%` }}
                         ></div>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                         <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Buy Box Mastery</span>
                         <span className="text-primary text-xs font-black uppercase">{dashboardStats.buybox_coverage_rate || 0}%</span>
                      </div>
                      <div className="flex gap-1">
                         {[1,2,3,4,5,6,7,8,9,10].map(i => (
                            <div 
                               key={i} 
                               className={`flex-1 h-3 rounded-sm transition-all duration-500 ${i <= (dashboardStats.buybox_coverage_rate / 10) ? 'bg-primary shadow-sm' : 'bg-slate-100'}`}
                            ></div>
                         ))}
                      </div>
                   </div>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
             </div>

             {/* Regional Analysis Section */}
             <div className="glass-card p-6 rounded-3xl border-white/20 bg-white shadow-xl flex flex-col gap-6">
                <h4 className="text-slate-800 font-black uppercase tracking-widest text-[10px] opacity-100">Regional Intelligence Matrix</h4>
                <div className="flex flex-col gap-3">
                   {(products || []).slice(0, 3).map(p => (
                      <div 
                        key={p.asin} 
                        onClick={() => setActiveRegionalProduct(p)}
                        className="p-4 rounded-xl border border-slate-100 hover:border-primary/40 hover:bg-slate-50 transition-all cursor-pointer group flex items-center justify-between"
                      >
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg border border-slate-200 overflow-hidden p-1 bg-white">
                               <img src={p.image_url} alt="" className="w-full h-full object-contain" />
                            </div>
                            <span className="text-[10px] font-black text-slate-800 uppercase italic group-hover:text-primary transition-colors">{p.asin}</span>
                         </div>
                         <BarChart3 size={14} className="text-slate-300 group-hover:text-primary group-hover:scale-110 transition-all" />
                      </div>
                   ))}
                   <Link to="/regional-matrix" className="text-center text-[8px] font-black text-primary uppercase tracking-[0.2em] mt-2 hover:underline">Expand Full Universe</Link>
                </div>
             </div>

             <IntelligenceFeed />

             <div className="glass-card p-6 rounded-3xl border-white/20 bg-white shadow-xl">
                <h4 className="text-slate-800 font-black uppercase tracking-widest text-[10px] mb-4 opacity-100">Combat Protocols</h4>
                <div className="flex flex-col gap-2">
                   <button 
                     onClick={() => exportReport('all', 'pdf')}
                     className="w-full text-left p-4 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-between group border border-transparent hover:border-slate-100"
                   >
                      <span className="text-xs font-black text-slate-800 uppercase tracking-tighter">Execute Intelligence Export</span>
                      <ArrowRight size={14} className="text-slate-300 group-hover:text-primary transition-all" />
                   </button>
                   <button 
                     onClick={handleGlobalSync}
                     className="w-full text-left p-4 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-between group border border-transparent hover:border-slate-100"
                   >
                      <span className="text-xs font-black text-slate-800 uppercase tracking-tighter">Global Fleet Synchronization</span>
                      <ArrowRight size={14} className="text-slate-300 group-hover:text-primary transition-all" />
                   </button>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};

export default Home;
