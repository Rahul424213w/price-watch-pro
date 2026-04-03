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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {filteredProducts.length > 0 ? filteredProducts.map(p => {
           return (
              <div key={p.asin} className="glass-card p-5 rounded-3xl flex flex-col gap-4 group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 border-white/20">
                 <div className="w-full aspect-square rounded-2xl overflow-hidden bg-slate-50 relative shadow-inner p-4">
                    <img src={p.image_url} alt={p.title} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute top-3 right-3 bg-white/95 px-2 py-1 rounded-lg text-[9px] font-black text-primary shadow-md border border-primary/10 tracking-widest uppercase">
                       {p.asin}
                    </div>
                    <div className="absolute bottom-3 left-3 flex gap-1 items-center">
                       {p.is_out_of_stock ? (
                         <div className="bg-red-500 text-white px-2 py-1 rounded-md text-[8px] font-black uppercase shadow-lg tracking-widest flex items-center gap-1">
                            OOS
                         </div>
                       ) : (
                         <div className="bg-[#00D1FF] text-white px-2 py-1 rounded-md text-[8px] font-black uppercase shadow-lg tracking-widest flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                            LIVE
                         </div>
                       )}
                       <div className="bg-red-500/10 text-red-500 px-1.5 py-1 rounded-md text-[8px] shadow-sm flex items-center justify-center opacity-60 pointer-events-none">
                          <Trash2 size={12} />
                       </div>
                    </div>
                 </div>

                 <div className="flex-1 flex flex-col gap-2">
                    <h3 className="font-extrabold text-slate-800 leading-tight group-hover:text-primary transition-all uppercase text-xs tracking-tighter line-clamp-none h-auto">
                       {p.title}
                    </h3>
                    
                    <div className="flex flex-col gap-2 mt-2">
                       <div className="flex justify-between items-end">
                          <div className="flex flex-col">
                             <span className="text-[9px] text-neutral-custom font-black uppercase tracking-tighter">Local Pulse</span>
                             <p className={`font-black text-xl italic ${p.is_out_of_stock ? 'text-red-500 text-sm' : 'text-primary'}`}>
                                {p.is_out_of_stock ? 'OUT OF STOCK' : `₹${(p.current_price || 0).toLocaleString()}`}
                             </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                             <div className="flex items-center gap-1 text-[9px] font-bold text-neutral-custom bg-slate-100 px-2 py-1 rounded-md uppercase">
                                <Zap size={12} className="text-secondary animate-pulse" /> 
                                Tracking
                             </div>
                          </div>
                       </div>

                       <div className="flex justify-between items-end border-t border-slate-100 pt-2 mt-1">
                          <div className="flex flex-col">
                             <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Regional Floor</span>
                             <p className="text-sm font-black text-secondary italic tracking-tighter">
                                ₹{(p.best_regional_price || 0).toLocaleString()}
                             </p>
                          </div>
                          <div className="flex items-center gap-1 text-[8px] text-slate-400 font-bold uppercase tracking-tighter">
                             {p.last_updated ? formatLocalizedDate(p.last_updated) : "Sync Pending"}
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="flex gap-2">
                    <Link 
                     to={`/regional/${p.asin}`}
                     className="flex-1 py-3 bg-primary text-white rounded-xl font-black flex items-center justify-center gap-2 shadow-lg hover:shadow-primary/30 transition-all uppercase tracking-tighter text-[10px]"
                    >
                       ANALYTICS <ArrowRight size={14} />
                    </Link>
                    <Link 
                     to={`/product/${p.asin}`}
                     className="w-10 h-10 flex items-center justify-center bg-slate-100 text-slate-500 rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
                    >
                       <ExternalLink size={16} />
                    </Link>
                 </div>
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
