import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Loader2, Zap, ArrowRight, BarChart3, ExternalLink } from 'lucide-react';
import useStore from '../store';

const SearchPage = () => {
  const { searchResults, searchAmazon, isSearching, trackProduct, config, error } = useStore();
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const handleSearch = async (e, targetPage = 1) => {
    if (e) e.preventDefault();
    console.log(`[PriceWatch UI] Triggering scan for "${query}" on page ${targetPage}`);
    if (!query) {
      console.warn("[PriceWatch UI] Scan aborted: Empty query.");
      return;
    }
    setPage(targetPage);
    try {
      await searchAmazon(query, config.pincode, targetPage);
      console.log("[PriceWatch UI] Scan completed successfully.");
    } catch (err) {
      console.error("[PriceWatch UI] Scan failed:", err);
    }
  };

  const handleNextPage = () => {
    const next = page + 1;
    handleSearch(null, next);
  };

  const handlePrevPage = () => {
    if (page > 1) {
      const prev = page - 1;
      handleSearch(null, prev);
    }
  };

  return (
    <div className="flex flex-col gap-10">
      {/* Search Header */}
      <div className="glass-card p-10 rounded-2xl bg-white/40 border-white/40 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
           <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">Discovery Engine</h2>
           <p className="text-neutral-custom font-medium mt-1 max-w-lg">Enter an Amazon India ASIN or keywords (e.g. SKF 6205) to pull real-time pricing and seller data directly from the ecosystem.</p>
           
           <form onSubmit={(e) => handleSearch(e, 1)} className="mt-8 flex flex-col gap-4 max-w-2xl">
              <div className="flex gap-4">
                 <input 
                   type="text" 
                   value={query}
                   onChange={(e) => setQuery(e.target.value)}
                   placeholder="Product name, brand, or category..." 
                   className="flex-1 bg-white px-6 py-4 rounded-xl border border-slate-200 outline-none focus:border-primary shadow-sm font-medium"
                 />
                 <button 
                   type="submit" 
                   disabled={isSearching}
                   className="px-8 py-4 primary-gradient text-white font-black rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                 >
                   {isSearching ? <Loader2 className="animate-spin" /> : <Search size={20} />}
                   <span>Initialize Scan</span>
                 </button>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-500 text-xs font-black bg-red-50 px-4 py-2 rounded-lg border border-red-100 animate-in slide-in-from-top-2">
                   <Zap size={14} /> SCAN PROTOCOL FAILURE: {error}
                </div>
              )}
           </form>
        </div>
      </div>

      {searchResults && (
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {searchResults.map((result) => (
              <div key={result.asin} className="glass-card p-6 rounded-2xl flex flex-col gap-4 bg-white/70 border-white/40 backdrop-blur-md hover:shadow-2xl transition-all group relative overflow-hidden">
                <div className="w-full aspect-square bg-slate-50 rounded-xl mb-2 p-6 flex items-center justify-center border border-slate-100 group-hover:scale-105 transition-transform duration-500">
                  <img src={result.image_url} alt={result.title} className="max-h-full object-contain" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded uppercase tracking-widest">{result.asin}</span>
                    <a 
                      href={`https://www.amazon.in/dp/${result.asin}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-primary transition-all"
                      title="View on Amazon"
                    >
                       <ExternalLink size={12} />
                    </a>
                    {result.is_tracked && <span className="text-[10px] font-black bg-green-500 text-white px-2 py-0.5 rounded uppercase tracking-widest">Linked to Universe</span>}
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm uppercase tracking-tighter leading-tight group-hover:text-primary transition-colors h-auto line-clamp-none">
                    {result.title}
                  </h3>
                  {result.is_out_of_stock ? (
                    <p className="text-xl font-black text-red-500 italic mt-3">OUT OF STOCK</p>
                  ) : (
                    <p className="text-2xl font-black text-secondary italic mt-3">₹{result.price.toLocaleString()}</p>
                  )}
                </div>

                {result.is_tracked ? (
                  <Link 
                    to={`/product/${result.asin}`}
                    className="w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all shadow-lg bg-slate-900 text-white hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <BarChart3 size={14} />
                    Deep Analytics
                  </Link>
                ) : (
                  <button 
                    onClick={() => trackProduct(result.asin, result.title, result.image_url, config.pincode)}
                    className="w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all shadow-md secondary-gradient text-white hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Zap size={14} />
                    Initialize Tracking
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-center gap-8 py-10 bg-white/20 rounded-3xl border border-white/20">
             <button 
               onClick={handlePrevPage}
               disabled={page === 1 || isSearching}
               className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-600 hover:text-primary transition-all disabled:opacity-30"
             >
                <ArrowRight size={16} className="rotate-180" /> Previous Intelligence Page
             </button>
             
             <div className="w-12 h-12 primary-gradient rounded-full flex items-center justify-center text-white font-black text-lg shadow-lg">
                {page}
             </div>

             <button 
               onClick={handleNextPage}
               disabled={isSearching}
               className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-600 hover:text-primary transition-all disabled:opacity-30"
             >
                Next Intelligence Page <ArrowRight size={16} />
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
