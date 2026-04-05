import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, Clock, Info } from 'lucide-react';
import { formatShortDate, formatLiveDate, formatHistoricalDate } from '../utils/dateUtils';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const date = new Date(label);
    return (
      <div className="glass-card p-4 rounded-xl shadow-xl border border-white/40 backdrop-blur-2xl">
        <div className="flex flex-col gap-1 mb-2">
          <p className="text-[10px] font-black text-neutral-custom uppercase tracking-widest">
            {date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })}
          </p>
          <p className="text-sm font-black text-slate-800 italic">
            {date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })}
          </p>
        </div>
        <p className="text-2xl font-black text-primary italic">₹{payload[0].value.toLocaleString()}</p>
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
          <div className={`w-2 h-2 rounded-full ${payload[0].payload.isBuyBox ? 'bg-secondary animate-pulse' : 'bg-slate-300'}`}></div>
          <p className="text-[10px] font-bold text-slate-600 uppercase">Seller: {payload[0].payload.seller}</p>
        </div>
      </div>
    );
  }
  return null;
};

const PriceChart = ({ data, buyBoxPrice }) => {
  const [timeFilter, setTimeFilter] = React.useState('live'); // 'live' or '3m'

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-[400px] glass-card p-6 rounded-3xl flex flex-col items-center justify-center border-white/20">
        <Clock size={48} className="text-primary/20 mb-4" />
        <p className="text-slate-800 font-extrabold text-lg uppercase tracking-tighter">Insufficient Data Points</p>
        <p className="text-neutral-custom font-medium mt-2">Waiting for first real-time intelligence scan...</p>
      </div>
    );
  }

  // Filtering Logic for 3m
  const filteredData = React.useMemo(() => {
    // Standardize all points with numerical timestamps for linear sorting
    const processed = data.map(point => ({
      ...point,
      timestamp: point.timestamp || new Date(point.name).getTime()
    })).sort((a, b) => a.timestamp - b.timestamp);

    if (timeFilter === 'live') return processed;

    const threeMonthsAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
    return processed.filter(point => point.timestamp >= threeMonthsAgo);
  }, [data, timeFilter]);

  return (
    <div className="w-full h-[400px] glass-card p-6 rounded-3xl relative overflow-hidden shadow-2xl border-white/20">
      <div className="flex justify-between items-center mb-8 relative z-10 px-2 pt-2">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp size={20} className="text-primary" />
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Market Volatility Index</h3>
          </div>
          <p className="text-[10px] font-black text-neutral-custom uppercase tracking-[0.2em] mt-1 ml-7">Linear Chronological Flux</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTimeFilter('live')}
            className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-tighter transition-all ${timeFilter === 'live' ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
          >
            Live
          </button>
          <button
            onClick={() => setTimeFilter('3m')}
            className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-tighter transition-all ${timeFilter === '3m' ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
          >
            Historical
          </button>
        </div>
      </div>

      <div className="h-[280px] w-full pr-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0060FF" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#0060FF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" strokeOpacity={0.5} />
            <XAxis 
              dataKey="timestamp" 
              type="number"
              scale="time"
              domain={['auto', 'auto']}
              axisLine={false} 
              tickLine={false} 
              tickFormatter={timeFilter === 'live' ? formatLiveDate : formatHistoricalDate} 
              tick={{ fill: '#4B7E8F', fontSize: 10, fontWeight: 'bold' }} 
              dy={10} 
            />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#4B7E8F', fontSize: 10, fontWeight: 'bold' }} dx={-5} domain={['auto', 'auto']} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#0060FF', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Area type="stepAfter" dataKey="price" stroke="#0060FF" strokeWidth={4} fillOpacity={1} fill="url(#colorPrice)" animationDuration={1000} />

            {buyBoxPrice && (
              <ReferenceLine y={buyBoxPrice} stroke="#FF6D00" strokeDasharray="6 6" strokeWidth={2} label={{ position: 'right', value: 'BUY BOX', fill: '#FF6D00', fontSize: 9, fontWeight: 900, dy: -10 }} />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Background Layering */}
      <div className="absolute top-0 right-0 w-80 h-80 primary-gradient opacity-[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
    </div>
  );
};

export default PriceChart;
