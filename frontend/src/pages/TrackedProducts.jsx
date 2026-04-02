import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ArrowRight, ExternalLink, Activity, Info, Loader2, Search, Trash2, Clock } from 'lucide-react';
import useStore from '../store';
import { formatLocalizedDate } from '../utils/dateUtils';

const TrackedProducts = () => {
  const { products, fetchAllProducts, isLoading, deleteProduct, config } = useStore();

  useEffect(() => {
    fetchAllProducts();
  }, [fetchAllProducts, config.pincode]);

  const handleDelete = async (asin) => {
    if (window.confirm(`Are you sure you want to stop tracking ASIN: ${asin}? This will permanently delete all historical intelligence.`)) {
      await deleteProduct(asin);
    }
  };

  if (isLoading && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-6">
        <Loader2 size={64} className="animate-spin text-primary opacity-20" />
        <p className="text-xl font-black text-slate-800 uppercase tracking-tighter">Syncing Tracked Assets...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="flex justify-between items-end bg-white/40 p-10 rounded-2xl border border-white/40 glass-card shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
             <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <Package size={24} />
             </div>
             <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter italic">My Tracked Universe</h2>
             {isLoading && (
               <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ml-4 border border-primary/20 animate-pulse">
                  <Loader2 size={12} className="animate-spin" />
                  Syncing Sensors
               </div>
             )}
          </div>
          <p className="text-neutral-custom font-medium max-w-lg">Central nervous system for your price intelligence fleet. Track active assets and access granular competitive data across the ecosystem.</p>
        </div>
        
        <Link 
          to="/search"
          className="px-8 py-5 primary-gradient text-white font-black rounded-xl shadow-xl shadow-primary/30 flex items-center gap-3 hover:scale-[1.03] active:scale-95 transition-all uppercase tracking-tighter z-10"
        >
          <Search size={22} />
          <span>Track New Asset</span>
        </Link>

        {/* Abstract Background */}
        <div className="absolute top-0 right-0 w-64 h-64 primary-gradient opacity-[0.05] rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      </div>

      {products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {products.map((product) => (
            <div key={product.asin} className="glass-card p-5 rounded-3xl flex flex-col gap-4 group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 border-white/20">
              <div className="w-full aspect-square rounded-2xl overflow-hidden bg-slate-50 relative shadow-inner p-4">
                <img src={product.image_url} alt={product.title} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute top-3 right-3 bg-white/95 px-2 py-1 rounded-lg text-[9px] font-black text-primary shadow-md border border-primary/10 tracking-widest uppercase">
                  {product.asin}
                </div>
                <div className="absolute bottom-3 left-3 flex gap-1 items-center">
                   {product.is_out_of_stock ? (
                     <div className="bg-red-500 text-white px-2 py-1 rounded-md text-[8px] font-black uppercase shadow-lg tracking-widest flex items-center gap-1">
                        OOS
                     </div>
                   ) : (
                     <div className="bg-green-500 text-white px-2 py-1 rounded-md text-[8px] font-black uppercase shadow-lg tracking-widest flex items-center gap-1">
                        <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
                        Live
                     </div>
                   )}
                   <button 
                     onClick={() => handleDelete(product.asin)}
                     className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white p-1.5 rounded-md transition-all shadow-sm"
                   >
                     <Trash2 size={12} />
                   </button>
                </div>
              </div>
              
              <div className="flex-1 flex flex-col gap-2">
                 <h3 className="font-extrabold text-slate-800 leading-tight group-hover:text-primary transition-all uppercase text-xs tracking-tighter line-clamp-none h-auto">
                   {product.title}
                 </h3>
                 <div className="flex justify-between items-end mt-2">
                    <div className="flex flex-col">
                       <span className="text-[9px] text-neutral-custom font-black uppercase tracking-tighter">Current Floor</span>
                       <p className={`font-black text-xl italic ${product.is_out_of_stock ? 'text-red-500 text-sm' : 'text-primary'}`}>
                         {product.is_out_of_stock ? 'OUT OF STOCK' : `₹${product.current_price.toLocaleString()}`}
                       </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                       <div className="flex items-center gap-1 text-[9px] font-bold text-neutral-custom bg-slate-100 px-2 py-1 rounded-md uppercase">
                          <Activity size={12} className="text-secondary" /> 
                          Tracking
                       </div>
                       <div className="flex items-center gap-1 text-[8px] text-slate-400 font-bold uppercase tracking-tighter">
                          <Clock size={10} />
                          {formatLocalizedDate(product.last_updated)}
                       </div>
                    </div>
                 </div>
              </div>

              <div className="flex gap-2">
                 <Link 
                   to={`/product/${product.asin}`}
                   className="flex-1 py-3 bg-primary text-white rounded-xl font-black flex items-center justify-center gap-2 shadow-lg hover:shadow-primary/30 transition-all uppercase tracking-tighter text-[10px]"
                 >
                    Analytics <ArrowRight size={14} />
                 </Link>
                 <a 
                   href={`https://www.amazon.in/dp/${product.asin}`} 
                   target="_blank" 
                   rel="noreferrer"
                   className="w-10 h-10 flex items-center justify-center bg-slate-100 text-slate-500 rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
                 >
                    <ExternalLink size={16} />
                 </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-40 flex flex-col items-center justify-center gap-6 text-neutral-custom bg-white/20 rounded-3xl border border-white/20 backdrop-blur-sm grayscale opacity-50">
          <Package size={100} className="stroke-[1]" />
          <div className="text-center">
             <p className="font-black text-2xl uppercase tracking-[0.2em] italic">Universe Empty</p>
             <p className="font-medium mt-2 max-w-xs mx-auto">Start tracking products to build your competitive monitoring universe.</p>
          </div>
          <Link to="/search" className="px-8 py-3 primary-gradient text-white rounded-xl font-black shadow-lg hover:shadow-primary/30 transition-all uppercase text-xs tracking-widest">
            Initialize First Asset
          </Link>
        </div>
      )}
    </div>
  );
};

export default TrackedProducts;
