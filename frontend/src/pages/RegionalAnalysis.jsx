import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapPin, ArrowLeft, RefreshCw, AlertCircle, TrendingDown, Zap, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import useStore from '../store';

const RegionalAnalysis = () => {
  const { asin } = useParams();
  const navigate = useNavigate();
  const { config } = useStore();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [product, setProduct] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [regionalRes, productRes] = await Promise.all([
        axios.get(`http://localhost:8000/regional/comparison/${asin}`),
        axios.get(`http://localhost:8000/product/${asin}`)
      ]);
      setData(regionalRes.data);
      setProduct(productRes.data.product);
    } catch (err) {
      console.error("Failed to fetch regional data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegionalSync = async () => {
    setIsSyncing(true);
    try {
      await axios.post(`http://localhost:8000/regional/scrape/${asin}`);
      await fetchData();
    } catch (err) {
      console.error("Regional sync failed", err);
      alert("Regional Intelligence Pulse Failed. Check network connectivity.");
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [asin]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-6">
        <MapPin size={64} className="animate-bounce text-secondary" />
        <p className="text-xl font-black text-slate-800 uppercase tracking-tighter italic">Mapping Regional Intelligence...</p>
      </div>
    );
  }

  const sortedData = [...data].sort((a, b) => a.price - b.price);
  const minPrice = sortedData[0]?.price || 0;

  return (
    <div className="flex flex-col gap-10">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-6">
           <button onClick={() => navigate(-1)} className="p-3 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all">
              <ArrowLeft size={20} />
           </button>
           <div>
              <p className="text-[10px] font-black text-secondary uppercase tracking-widest leading-none mb-1">Geographic Spread Analysis</p>
              <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">{product?.title}</h1>
              <p className="text-neutral-custom font-medium mt-1 text-[10px]">Real-time comparison of price points and Buy Box sovereignty across multiple geographic nodes.</p>
           </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchData} 
            className="p-4 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all text-slate-600"
            title="Refresh View"
          >
             <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
          
          <button 
            onClick={handleRegionalSync} 
            disabled={isSyncing}
            className="flex items-center gap-3 text-sm font-black text-white bg-primary px-8 py-4 rounded-xl uppercase tracking-tighter shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
          >
            {isSyncing ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
            {isSyncing ? 'Syncing Nodes...' : 'Update Data'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Statistics Column */}
        <div className="flex flex-col gap-6">
           <div className="glass-card p-8 rounded-3xl border-secondary/20 shadow-xl shadow-secondary/5">
              <div className="flex items-center gap-3 mb-6">
                 <Zap size={24} className="text-secondary fill-secondary" />
                 <h3 className="font-black text-lg uppercase tracking-tighter italic">Regional Arbitrage</h3>
              </div>
              <div className="flex flex-col gap-2">
                 <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">Lowest Regional Price</p>
                 <p className="text-4xl font-black text-secondary italic">₹{minPrice.toLocaleString()}</p>
                 <p className="text-xs font-bold text-slate-400 mt-2 flex items-center gap-1">
                    <TrendingDown size={14} className="text-green-500" /> 
                    Detected in Pincode {sortedData[0]?.pincode}
                 </p>
              </div>
           </div>

           <div className="glass-card p-6 rounded-2xl border-white/40">
              <h4 className="font-black text-xs uppercase tracking-widest mb-4">Coverage Status</h4>
              <div className="flex flex-col gap-4">
                 {data.map(item => (
                    <div key={item.pincode} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                       <span className="font-bold text-slate-700">{item.pincode}</span>
                       <span className={`px-2 py-1 rounded-md text-[10px] font-black ${item.price === minPrice ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                          {item.price === minPrice ? 'BEST PRICE' : `+₹${(item.price - minPrice).toLocaleString()}`}
                       </span>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Chart & Matrix Column */}
        <div className="lg:col-span-2 flex flex-col gap-8">
           <div className="glass-card p-8 rounded-3xl border-white/20 h-[400px]">
              <h3 className="font-black text-lg uppercase tracking-tighter italic mb-8">Price Delta by Location</h3>
              <ResponsiveContainer width="100%" height="85%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="pincode" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 700}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 700}} domain={['auto', 'auto']} />
                  <Tooltip 
                    cursor={{fill: '#f1f5f9'}}
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  />
                  <Bar dataKey="price" radius={[8, 8, 0, 0]} barSize={40}>
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.price === minPrice ? '#ec4899' : '#64748b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
           </div>

           <div className="glass-card p-8 rounded-3xl border-white/20 overflow-hidden">
              <h3 className="font-black text-lg uppercase tracking-tighter italic mb-6">Regional Competition Matrix</h3>
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="border-b-2 border-slate-100 uppercase tracking-widest text-[10px] font-black text-slate-400">
                          <th className="pb-4">Location</th>
                          <th className="pb-4">Buy Box Seller</th>
                          <th className="pb-4">Regional Price</th>
                          <th className="pb-4">Last Verified</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {data.map(item => (
                          <tr key={item.pincode} className="group hover:bg-slate-50/50 transition-all">
                             <td className="py-4 font-bold text-slate-700 flex items-center gap-2">
                                <MapPin size={14} className="text-secondary" />
                                {item.pincode}
                             </td>
                             <td className="py-4 font-medium text-slate-600">{item.seller}</td>
                             <td className="py-4 font-black text-slate-900">₹{item.price.toLocaleString()}</td>
                             <td className="py-4 text-xs text-slate-400 font-medium">
                                {new Date(item.timestamp).toLocaleString()}
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default RegionalAnalysis;
