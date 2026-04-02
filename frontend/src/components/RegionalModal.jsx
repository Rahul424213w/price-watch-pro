import React, { useEffect, useState } from 'react';
import { Zap, Globe, Loader2, Activity } from 'lucide-react';
import useStore from '../store';
import { formatLocalizedDate } from '../utils/dateUtils';

const RegionalModal = ({ product, onClose }) => {
  const { getRegionalComparison, triggerRegionalScrape, exportReport } = useStore();
  const [data, setData] = useState([]);
  const [isScraping, setIsScraping] = useState(false);

  const fetchRegionalData = async () => {
    const results = await getRegionalComparison(product.asin);
    setData(results);
  };

  useEffect(() => {
    fetchRegionalData();
  }, [product.asin]);

  const handleRefresh = async () => {
    setIsScraping(true);
    await triggerRegionalScrape(product.asin);
    await fetchRegionalData();
    setIsScraping(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="glass-card w-full max-w-4xl bg-white rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white rounded-2xl p-2 border border-slate-200 shadow-sm">
              <img src={product.image_url} alt="" className="w-full h-full object-contain" />
            </div>
            <div>
               <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter italic leading-none">{product.asin}</h3>
               <p className="text-slate-500 text-sm font-bold mt-1 truncate max-w-md">{product.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-slate-200 flex items-center justify-center transition-colors text-slate-400">
             <Zap size={20} className="rotate-45" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
           <div className="flex justify-between items-center mb-8">
              <h4 className="text-lg font-black text-slate-800 uppercase tracking-tighter italic flex items-center gap-2">
                 <Globe size={20} className="text-primary" /> Regional Analysis Matrix
              </h4>
              <div className="flex gap-2">
                 <button 
                  onClick={handleRefresh}
                  disabled={isScraping}
                  className="px-4 py-2 bg-primary/10 text-primary text-xs font-black uppercase tracking-widest rounded-xl hover:bg-primary hover:text-white transition-all flex items-center gap-2"
                 >
                    {isScraping ? <Loader2 size={14} className="animate-spin" /> : <Activity size={14} />}
                    {isScraping ? "Scraping Zones..." : "Refresh Intelligence"}
                 </button>
                 <button onClick={() => exportReport(product.asin, 'csv')} className="px-4 py-2 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-all">CSV</button>
                 <button onClick={() => exportReport(product.asin, 'pdf')} className="px-4 py-2 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-all">Report PDF</button>
              </div>
           </div>

           <div className="grid grid-cols-1 gap-4">
              <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-xl border border-white/10">
                 <table className="w-full text-left border-collapse">
                    <thead>
                       <tr className="bg-white/5 border-b border-white/10">
                          <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Node</th>
                          <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Buy Box Holder</th>
                          <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Price</th>
                          <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Scrape</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                       {data.map((item, idx) => (
                          <tr key={idx} className="hover:bg-white/5 transition-colors group text-white">
                             <td className="p-5">
                                <div className="flex items-center gap-3">
                                   <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_5px_#0060FF]"></div>
                                   <span className="text-white font-black text-sm tracking-tighter italic">{item.pincode}</span>
                                </div>
                             </td>
                             <td className="p-5 font-bold text-slate-300 text-sm">{item.seller}</td>
                             <td className="p-5">
                                <span className="text-secondary font-black text-lg italic tracking-tighter">₹{(item.price || 0).toLocaleString()}</span>
                             </td>
                             <td className="p-5 text-slate-500 text-[10px] font-black uppercase">
                                {item.timestamp ? formatLocalizedDate(item.timestamp) : "Initial Scan Pending"}
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-center italic text-slate-400 text-[10px] font-bold uppercase tracking-widest">
           PriceWatch Pro Global Intelligence Node • Multi-Location Burst Protocol
        </div>
      </div>
    </div>
  );
};

export default RegionalModal;
