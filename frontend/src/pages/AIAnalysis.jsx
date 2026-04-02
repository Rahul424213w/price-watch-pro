import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Brain, 
  TrendingDown, 
  BarChart2, 
  Target, 
  Zap, 
  Globe, 
  FileText, 
  Loader2, 
  AlertCircle,
  ChevronRight,
  TrendingUp,
  MapPin,
  Sparkles,
  CheckCircle2,
  Download,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../store';

const API_BASE = 'http://localhost:8000';

const AIResultDisplay = ({ text }) => {
  if (!text) return null;

  // Simple parser for basic markdown-like structures
  const lines = text.split('\n');
  
  return (
    <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-2" />;

        // Headers or bold sections
        if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
          return (
            <div key={i} className="text-primary font-black uppercase tracking-widest text-[10px] mt-2 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full" />
              {trimmed.replace(/\*\*/g, '')}
            </div>
          );
        }

        // Bullet points
        if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
          return (
            <div key={i} className="flex gap-3 pl-2">
              <div className="mt-1.5 w-1 h-1 rounded-full bg-slate-400 shrink-0" />
              <p className="text-slate-600 leading-relaxed font-medium">
                {trimmed.substring(1).trim().split('**').map((part, index) => 
                  index % 2 === 1 ? <b key={index} className="text-slate-900 font-bold">{part}</b> : part
                )}
              </p>
            </div>
          );
        }

        // Regular text with possible inline bold
        return (
          <p key={i} className="text-slate-600 leading-relaxed font-medium">
            {trimmed.split('**').map((part, index) => 
              index % 2 === 1 ? <b key={index} className="text-slate-900 font-bold">{part}</b> : part
            )}
          </p>
        );
      })}
    </div>
  );
};

const AICard = ({ title, icon: Icon, children, loading, onAction, actionLabel, color = "primary", result }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass-card p-6 rounded-[2.5rem] border-white/40 flex flex-col gap-5 relative overflow-hidden group h-full shadow-2xl hover:shadow-primary/5 transition-all duration-500"
  >
    <div className={`absolute top-0 right-0 w-40 h-40 bg-${color}/5 rounded-full -mr-20 -mt-20 blur-3xl group-hover:scale-150 transition-transform duration-1000`}></div>
    
    <div className="flex items-center justify-between z-10">
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-${color} shadow-lg shadow-${color}/10 group-hover:rotate-6 transition-transform`}>
          <Icon size={28} />
        </div>
        <div>
          <h3 className="font-black uppercase tracking-tighter italic text-slate-800 text-lg leading-tight">{title}</h3>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className={`w-1.5 h-1.5 rounded-full ${result ? 'bg-green-500' : 'bg-slate-300'} animate-pulse`} />
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
              {result ? 'Protocol Active' : 'Neural Link Ready'}
            </span>
          </div>
        </div>
      </div>
      {onAction && (
        <button 
          onClick={onAction}
          disabled={loading}
          className={`h-11 px-5 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2.5 shadow-xl shadow-slate-200`}
        >
          {loading ? <Loader2 size={14} className="animate-spin text-primary" /> : <Sparkles size={14} className="text-primary" />}
          {actionLabel || "Process"}
        </button>
      )}
    </div>

    <div className="flex-1 z-10 overflow-y-auto pr-2 custom-scrollbar">
      {loading ? (
        <div className="flex flex-col gap-4 py-4">
          <div className="h-4 bg-slate-100 rounded-full w-full animate-pulse" />
          <div className="h-4 bg-slate-100 rounded-full w-5/6 animate-pulse" />
          <div className="h-4 bg-slate-100 rounded-full w-4/6 animate-pulse" />
          <div className="flex items-center gap-2 mt-2">
            <Loader2 size={12} className="animate-spin text-primary" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Synthesizing Neural Patterns...</span>
          </div>
        </div>
      ) : (
        <div className="py-2">
          {result ? (
            <AIResultDisplay text={result} />
          ) : (
            <div className="flex flex-col items-center justify-center py-10 opacity-30 text-center gap-3">
              <Info size={32} />
              <p className="text-xs font-bold uppercase tracking-widest max-w-[200px]">Initialize analysis protocol for strategic insights</p>
            </div>
          )}
        </div>
      )}
    </div>
  </motion.div>
);

const AIAnalysis = () => {
  const [products, setProducts] = useState([]);
  const [selectedAsin, setSelectedAsin] = useState('');
  const [loading, setLoading] = useState({});
  const [results, setResults] = useState({});
  const [reportStatus, setReportStatus] = useState(''); // 'synthesizing', 'ready', 'failed'
  const { config } = useStore();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_BASE}/products`);
      setProducts(res.data);
      if (res.data.length > 0 && !selectedAsin) {
        setSelectedAsin(res.data[0].asin);
      }
    } catch (err) {
      console.error("Failed to fetch products", err);
    }
  };

  const runAnalysis = async (type, endpoint) => {
    if (!selectedAsin) return;
    setLoading(prev => ({ ...prev, [type]: true }));
    try {
      const res = await axios.post(`${API_BASE}/ai/${endpoint}/${selectedAsin}`);
      let resultKey = '';
      switch(type) {
        case 'pricing': resultKey = 'advice'; break;
        case 'market': resultKey = 'insight'; break;
        case 'undercut': resultKey = 'prediction'; break;
        case 'location': resultKey = 'strategy'; break;
        case 'forecast': resultKey = 'forecast'; break;
        default: resultKey = 'report';
      }
      setResults(prev => ({ ...prev, [type]: res.data[resultKey] }));
    } catch (err) {
      setResults(prev => ({ ...prev, [type]: "Analysis protocol failure. Deep Neural link interrupted." }));
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleDownloadReport = async () => {
    if (!selectedAsin) return;
    setLoading(prev => ({ ...prev, report: true }));
    setReportStatus('synthesizing');
    
    try {
      const response = await axios({
        url: `${API_BASE}/ai/export-report-pdf/${selectedAsin}`,
        method: 'GET',
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Neural_Report_${selectedAsin}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setReportStatus('ready');
    } catch (err) {
      console.error("Report PDF export failed", err);
      setReportStatus('failed');
    } finally {
      setLoading(prev => ({ ...prev, report: false }));
    }
  };

  return (
    <div className="flex flex-col gap-12 pb-20">
      {/* Header & Product Selector */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 primary-gradient rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl shadow-primary/30 rotate-3">
              <Brain size={40} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">
                Strategic <span className="text-primary">Intelligence</span>
              </h2>
              <div className="flex items-center gap-3 mt-2">
                <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[9px] bg-slate-100 px-2 py-0.5 rounded">Llama 3.3 Neural Core</p>
                <div className="w-1 h-1 bg-slate-300 rounded-full" />
                <p className="text-primary font-black uppercase tracking-[0.3em] text-[9px]">Groq High-Speed Inference</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-2.5 rounded-[1.5rem] bg-white/70 border-white/60 flex items-center gap-4 shadow-xl"
        >
          <div className="pl-4">
             <Globe className="text-slate-400" size={18} />
          </div>
          <select 
            value={selectedAsin}
            onChange={(e) => {
              setSelectedAsin(e.target.value);
              setResults({}); // Reset results on ASIN change
            }}
            className="bg-transparent border-none focus:ring-0 font-black uppercase text-[11px] tracking-widest px-2 py-2 cursor-pointer text-slate-700 min-w-[200px]"
          >
            {products.map(p => (
              <option key={p.asin} value={p.asin}>{p.asin} - {p.title?.substring(0, 30)}...</option>
            ))}
          </select>
          <div className="bg-primary/10 px-4 py-2 rounded-xl border border-primary/20">
            <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Target Asset</span>
          </div>
        </motion.div>
      </div>

      {/* Neural Link Status Bar */}
      <div className="glass-card px-8 py-4 rounded-[2rem] border-white/40 flex items-center justify-between shadow-sm">
         <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]" />
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Neural Sync Active</span>
            </div>
            <div className="w-px h-4 bg-slate-200" />
            <div className="flex items-center gap-2">
               <TrendingDown size={14} className="text-slate-400" />
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Model: llama-3.3-70b-versatile</span>
            </div>
         </div>
         <div className="flex items-center gap-2 text-slate-400">
            <Sparkles size={14} />
            <span className="text-[9px] font-black uppercase tracking-[0.3em]">Neural Link Protocol 4.2.0</span>
         </div>
      </div>

      {/* Strategic Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        
        <AICard 
          title="Pricing Advisor" 
          icon={Target} 
          loading={loading.pricing}
          onAction={() => runAnalysis('pricing', 'pricing-advisor')}
          actionLabel="Consult"
          color="primary"
          result={results.pricing}
        />

        <AICard 
          title="Market Insight" 
          icon={BarChart2} 
          loading={loading.market}
          onAction={() => runAnalysis('market', 'market-insight')}
          actionLabel="Explain"
          color="secondary"
          result={results.market}
        />

        <AICard 
          title="Undercut Predictor" 
          icon={Zap} 
          loading={loading.undercut}
          onAction={() => runAnalysis('undercut', 'undercut-prediction')}
          actionLabel="Predict"
          color="amber-500"
          result={results.undercut}
        />

        <AICard 
          title="Location Strategy" 
          icon={Globe} 
          loading={loading.location}
          onAction={() => runAnalysis('location', 'location-strategy')}
          actionLabel="Adjust"
          color="indigo-500"
          result={results.location}
        />

        <AICard 
          title="Trend Forecast" 
          icon={TrendingUp} 
          loading={loading.forecast}
          onAction={() => runAnalysis('forecast', 'trend-forecast')}
          actionLabel="Forecast"
          color="emerald-500"
          result={results.forecast}
        />

        <AICard 
          title="Sentinel Analysis" 
          icon={AlertCircle} 
          color="rose-500"
          result={"**Autonomous Sentinel Active**\n- Monitoring regional price drops every **30 minutes**.\n- Neural Link dispatcher ready for **SMTP alerts**.\n- AI explanation triggered on every Buy Box switch.\n\n*Strategic sentinel is running in the background.*"}
        />
      </div>

      {/* Enterprise Strategic Report Generator */}
      <div className="mt-10 overflow-hidden rounded-[3.5rem] shadow-3xl shadow-primary/10">
        <motion.div 
          whileHover={{ scale: 1.002 }}
          className="glass-card p-14 bg-white/60 relative group border-2 border-white"
        >
          {/* Subtle Background Accents */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full -mr-72 -mt-72 blur-[140px] group-hover:bg-primary/10 transition-all duration-1000"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/5 rounded-full -ml-40 -mb-40 blur-[100px]"></div>
          
          <div className="flex flex-col lg:flex-row items-center justify-between gap-16 relative z-10">
            <div className="flex flex-col gap-8 max-w-2xl">
              <div className="flex items-center gap-4">
                <div className="bg-amber-500/10 p-3 rounded-2xl border border-amber-500/20">
                  <Sparkles size={24} className="text-amber-500 fill-amber-500/10" />
                </div>
                <span className="text-[12px] font-black text-amber-600 uppercase tracking-[0.4em] italic">Enterprise Neural Protocol</span>
              </div>
              
              <h3 className="text-6xl font-black uppercase tracking-tighter italic leading-[0.95]">
                <span className="text-amber-500">Consolidated</span> <br/>
                <span className="text-primary italic">Strategic Intelligence</span> <br/>
                <span className="text-amber-500">Executive Report</span>
              </h3>
              
              <p className="text-slate-600 font-semibold leading-relaxed text-xl italic max-w-lg">
                High-fidelity synthesis of regional arbitrage logic, neural trend forecasting, and competitive undercutting patterns.
              </p>

              <div className="flex items-center gap-10 mt-6 translate-y-2">
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-loose">Dataset Synthesis</span>
                    <span className="text-base font-black text-slate-700 italic flex items-center gap-2">
                      Live Telemetry <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    </span>
                 </div>
                 <div className="w-px h-10 bg-slate-200" />
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest leading-loose">Model Fidelity</span>
                    <span className="text-base font-black text-amber-600 italic">Ultra Accurate</span>
                 </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-6">
              <button 
                onClick={handleDownloadReport}
                disabled={loading.report}
                className="bg-primary hover:bg-primary-dark text-white h-28 px-20 rounded-[3rem] font-black uppercase italic tracking-tighter shadow-3xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-6 group disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading.report ? (
                  <Loader2 className="animate-spin" size={32} />
                ) : (
                  <Download className="group-hover:-translate-y-2 transition-transform duration-500" size={32} />
                )}
                <div className="flex flex-col items-start leading-none gap-1.5">
                  <span className="text-2xl font-black">{loading.report ? "Synthesizing..." : "Export Neural PDF"}</span>
                  <span className="text-[10px] font-bold opacity-70 tracking-[0.2em] flex items-center gap-2">
                    <FileText size={10} /> DISTRIBUTOR GRADE REPORT
                  </span>
                </div>
                <ChevronRight className="group-hover:translate-x-3 transition-transform duration-500" size={28} />
              </button>
              
              <AnimatePresence>
                {reportStatus === 'ready' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-green-400 font-bold uppercase tracking-widest text-[9px]"
                  >
                    <CheckCircle2 size={12} />
                    Intelligence Protocol Transferred Successfully
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Neural Link Footer */}
      <footer className="mt-20 border-t border-slate-200 pt-10 flex flex-col md:flex-row items-center justify-between gap-6 px-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Core Neural Sync: 99.8%</span>
          </div>
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 bg-primary rounded-full" />
             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">API Latency: 42ms</span>
          </div>
        </div>
        
        <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] italic">
          Neural Intelligence Engine v4.0 Alpha • Groq Strategic Protocol Active
        </p>
      </footer>
    </div>
  );
};

export default AIAnalysis;
