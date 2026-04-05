import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Shield, Zap, Globe, Cpu, CheckCircle2, AlertCircle } from 'lucide-react';

const IntelligenceFeed = () => {
  const [logs, setLogs] = useState([
    { id: 1, type: 'system', text: 'Initializing Distributed Monitoring Fleet...', time: new Date() },
    { id: 2, type: 'proxy', text: 'ScraperAPI Proxy Rotation Protocol: Active', time: new Date() }
  ]);
  const scrollRef = useRef(null);


  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const response = await fetch('http://localhost:8000/system/latest-activity');
        const data = await response.json();
        
        if (data && data.length > 0) {
          const mappedLogs = data.map(item => ({
            id: item.id,
            type: item.type,
            text: item.text,
            time: new Date(item.timestamp),
            Icon: item.type === 'success' ? CheckCircle2 : item.type === 'alert' ? AlertCircle : Cpu,
            color: item.type === 'success' ? 'text-green-400' : item.type === 'alert' ? 'text-rose-500' : 'text-slate-400'
          }));
          setLogs(mappedLogs);
        }
      } catch (error) {
        console.error("Intelligence Stream Error:", error);
      }
    };

    fetchActivity();
    const interval = setInterval(fetchActivity, 8000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="glass-card bg-white/90 border-slate-100 rounded-3xl overflow-hidden shadow-xl flex flex-col h-[400px] group transition-all hover:border-primary/20">
      <div className="px-5 py-3 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-primary" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Live Intelligence Stream</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]"></div>
          <span className="text-[8px] font-black text-green-600 uppercase tracking-widest">Node Array Active</span>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 p-5 overflow-y-auto scrollbar-hide font-mono text-[9px] flex flex-col gap-3"
      >
        {logs.map((log) => (
          <div key={log.id} className="flex gap-3 animate-fade-in slide-in-from-left-1 duration-500">
            <span className="text-slate-400 shrink-0 font-bold">[{log.time.toLocaleTimeString()}]</span>
            <div className="flex items-start gap-2">
              {log.Icon && <log.Icon size={12} className={`${log.color} mt-0.5`} />}
              <span className={`${log.color || 'text-slate-600'} font-bold leading-relaxed`}>
                {log.text}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 bg-slate-50/80 border-t border-slate-100 space-y-1">
        <div className="flex items-center justify-between px-2">
           <span className="text-[7px] text-slate-400 font-black uppercase tracking-widest">Fleet Status: Optimal</span>
           <span className="text-[7px] text-slate-400 font-black uppercase tracking-widest">Buffer: 98% Clear</span>
        </div>
        <div className="w-full h-0.5 bg-slate-200 rounded-full overflow-hidden">
           <div className="h-full bg-primary w-2/3 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default IntelligenceFeed;
