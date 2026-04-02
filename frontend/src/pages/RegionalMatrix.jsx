import React, { useEffect, useState } from 'react';
import { Package, Globe, BarChart3, Search, Zap, Activity, Loader2, ArrowRight, TrendingDown, ShieldCheck, MapPin, ExternalLink, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import useStore from '../store';
import RegionalModal from '../components/RegionalModal';
import { formatLocalizedDate } from '../utils/dateUtils';

const RegionalMatrix = () => {
  const { products, fetchAllProducts, config } = useStore();
  const [isLoading, setIsLoading] = useState(true);
  const [activeRegionalProduct, setActiveRegionalProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadData = async () => {
      await fetchAllProducts();
      setIsLoading(false);
    };
    loadData();
  }, [fetchAllProducts, config.pincode]);

  const filteredProducts = (products || []).filter(p => 
    p.asin.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-6">
        <div className="relative">
           <Globe size={80} className="animate-spin text-primary opacity-20" />
           <div className="absolute inset-0 flex items-center justify-center">
              <Zap size={32} className="text-primary animate-pulse" />
           </div>
        </div>
        <p className="text-xl font-black text-slate-800 uppercase tracking-tighter italic">Mapping Global Fleet Intelligence...</p>
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

      {/* Strategic Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white/40 p-10 rounded-[2.5rem] border border-white/60 shadow-xl backdrop-blur-xl relative overflow-hidden">
          <div className="relative z-10">
             <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 primary-gradient rounded-lg flex items-center justify-center text-white shadow-lg">
                   <Globe size={18} />
                </div>
                <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Fleet Deployment Protocol</h4>
             </div>
             <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">Regional Intelligence Matrix</h3>
             <p className="text-neutral-custom font-medium mt-1 max-w-lg italic text-sm">Multi-node market telemetry and Buy Box sovereignty analysis across all tracked assets.</p>
          </div>
          <div className="flex gap-4 w-full md:w-auto relative z-10">
             <div className="relative flex-1 md:w-80">
                <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Filter Intelligence Universe..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-16 pr-4 py-4 bg-white/80 border border-white/60 rounded-[1.5rem] focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm font-bold shadow-2xl backdrop-blur-lg"
                />
             </div>
          </div>
          {/* Abstract Deco */}
          <div className="absolute top-0 right-0 w-64 h-64 primary-gradient opacity-[0.03] rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
      </div>

      {/* Intelligence Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
        {filteredProducts.length > 0 ? filteredProducts.map(p => {
           return (
              <div key={p.asin} className="glass-card bg-white rounded-[2.5rem] border border-slate-100/50 hover:shadow-[0_30px_60px_rgba(0,0,0,0.1)] hover:-translate-y-2 transition-all duration-500 group flex flex-col relative overflow-hidden">
                 {/* Top Image Section */}
                 <div className="relative p-8 pb-4">
                    <div className="absolute top-6 right-6 z-10">
                       <span className="text-[9px] font-black bg-slate-50 text-slate-400 px-3 py-1.5 rounded-lg uppercase tracking-widest border border-slate-100 shadow-sm">
                          {p.asin}
                       </span>
                    </div>
                    
                    <div className="aspect-square w-full rounded-3xl overflow-hidden group-hover:scale-105 transition-transform duration-700">
                       <img src={p.image_url} alt={p.title} className="w-full h-full object-contain mix-blend-multiply" />
                    </div>

                    {/* Status Overlays */}
                    <div className="absolute bottom-4 left-8 flex items-center gap-2">
                       <div className="bg-[#00D1FF] text-white text-[9px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary/20">
                          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                          LIVE
                       </div>
                       <div className="w-8 h-8 bg-red-50 text-red-300 rounded-xl flex items-center justify-center border border-red-100 opacity-40">
                          <Trash2 size={14} />
                       </div>
                    </div>
                    
                    {p.is_out_of_stock && (
                       <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-20 rounded-[2.5rem]">
                          <span className="bg-red-500 text-white text-[10px] font-black px-6 py-2 rounded-full uppercase tracking-widest shadow-2xl">Stockout Delta</span>
                       </div>
                    )}
                 </div>

                 {/* Content Section */}
                 <div className="px-8 pb-8 flex flex-col gap-6">
                    <h4 className="font-black text-slate-800 text-[11px] uppercase tracking-tighter leading-tight group-hover:text-primary transition-colors line-clamp-2 min-h-[2.4em] px-1">
                       {p.title}
                    </h4>
                    
                    <div className="flex flex-col gap-4">
                       <div className="flex flex-col gap-1">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Local Pulse (INR)</p>
                          <div className="flex items-center justify-between">
                             <p className="text-3xl font-black text-primary italic tracking-tighter leading-none">
                                ₹{(p.current_price || 0).toLocaleString()}
                             </p>
                             <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1 rounded-xl">
                                <Zap size={10} className="text-secondary animate-pulse" />
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Tracking</span>
                             </div>
                          </div>
                       </div>

                       <div className="flex justify-between items-end border-t border-slate-100 pt-4">
                          <div className="flex flex-col">
                             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Regional Floor</p>
                             <p className="text-lg font-black text-secondary italic tracking-tighter mt-0.5">
                                ₹{(p.best_regional_price || 0).toLocaleString()}
                             </p>
                          </div>
                          <div className="text-right">
                             <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest italic">
                                {p.last_updated ? formatLocalizedDate(p.last_updated) : "Sync Pending"}
                             </p>
                          </div>
                       </div>
                    </div>

                    <div className="flex gap-2.5">
                       <button 
                        onClick={() => setActiveRegionalProduct(p)}
                        className="flex-1 primary-gradient text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center justify-center gap-3 group/burst"
                       >
                          ANALYTICS <ArrowRight size={14} className="group-hover/burst:translate-x-1 transition-transform" />
                       </button>
                       <Link 
                        to={`/product/${p.asin}`}
                        className="w-14 h-14 bg-slate-50 border border-slate-100 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-slate-100 transition-all shadow-sm"
                       >
                          <ExternalLink size={18} />
                       </Link>
                    </div>
                 </div>

                 {/* Fleet Decoration */}
                 <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-transparent opacity-30"></div>
              </div>
           );
        }) : (
           <div className="col-span-full py-40 flex flex-col items-center justify-center opacity-30 grayscale italic">
              <Activity size={64} className="mb-4" />
              <p className="font-black uppercase tracking-[0.2em]">No assets matching intelligence criteria</p>
           </div>
        )}
      </div>
    </div>
  );
};

export default RegionalMatrix;
