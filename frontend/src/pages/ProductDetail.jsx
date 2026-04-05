import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingDown, Package, ShieldCheck, Zap, Info, Clock, AlertTriangle, RefreshCw, BarChart3, Download, Map, PieChart, ExternalLink, Loader2, CheckCircle } from 'lucide-react';
import PriceChart from '../components/PriceChart';
import SellerTable from '../components/SellerTable';
import DashboardCard from '../components/DashboardCard';
import AIAdvisorCard from '../components/AIAdvisorCard';
import useStore from '../store';
import { formatLocalizedDate } from '../utils/dateUtils';

const ProductDetail = () => {
  const navigate = useNavigate();
  const { asin } = useParams();
  const {
    getProductDetails,
    resetProductHistory,
    trackProduct,
    getVolatility,
    getBuyBoxWinRate,
    exportReport,
    sendWhatsAppAnalysis,
    config,
    isLoading: storeLoading
  } = useStore();

  const [data, setData] = useState(null);
  const [volatility, setVolatility] = useState(null);
  const [winRates, setWinRates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWhatsAppSending, setIsWhatsAppSending] = useState(false);
  const [isWhatsAppSuccess, setIsWhatsAppSuccess] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    const [details, vol, rates] = await Promise.all([
      getProductDetails(asin),
      getVolatility(asin),
      getBuyBoxWinRate(asin)
    ]);
    setData(details);
    setVolatility(vol);
    setWinRates(rates);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [asin, config.pincode]);

  const handleReset = async () => {
    if (window.confirm("Purge historical data and re-initialize real-time intelligence for this asset?")) {
      await resetProductHistory(asin);
      await fetchData();
    }
  }

  const handleManualSync = async () => {
    await trackProduct(asin);
    await fetchData();
  }

  if (isLoading || storeLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-6">
        <Zap size={64} className="animate-bounce text-primary" />
        <p className="text-xl font-black text-slate-800 uppercase tracking-tighter italic">Calibrating Market Sensors...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-6">
        <AlertTriangle size={64} className="text-red-500" />
        <p className="text-xl font-black text-slate-800 uppercase tracking-tighter">Asset Not Identified</p>
        <Link to="/dashboard" className="text-primary font-bold hover:underline">Return to Command Center</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10 pb-20">
      {/* Header with Back Button and Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-neutral-custom hover:text-primary transition-all font-bold group">
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          Back
        </button>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-white rounded-xl shadow-sm border border-slate-100 p-1">
            <button
              onClick={() => exportReport(asin, 'csv')}
              className="p-2 hover:bg-slate-50 text-slate-600 rounded-lg transition-all flex items-center gap-2 text-xs font-bold"
              title="Export CSV"
            >
              <Download size={14} /> CSV
            </button>
            <div className="w-[1px] bg-slate-100 my-1"></div>
            <button
              onClick={() => exportReport(asin, 'pdf')}
              className="p-2 hover:bg-slate-50 text-slate-600 rounded-lg transition-all flex items-center gap-2 text-xs font-bold"
              title="Export PDF"
            >
              <Download size={14} /> PDF
            </button>
            <div className="w-[1px] bg-slate-100 my-1"></div>
            <button
              onClick={async () => {
                setIsWhatsAppSending(true);
                await sendWhatsAppAnalysis(asin);
                setIsWhatsAppSending(false);
                setIsWhatsAppSuccess(true);
                setTimeout(() => setIsWhatsAppSuccess(false), 3000);
              }}
              disabled={isWhatsAppSending}
              className={`p-2 rounded-lg transition-all flex items-center gap-2 text-xs font-bold ${
                isWhatsAppSuccess ? 'bg-green-500 text-white' : 
                isWhatsAppSending ? 'bg-slate-100 text-slate-400' :
                'hover:bg-slate-50 text-green-600'
              }`}
              title="Neural Report to WhatsApp"
            >
              {isWhatsAppSending ? <Loader2 size={14} className="animate-spin" /> : 
               isWhatsAppSuccess ? <CheckCircle size={14} /> :
               <><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> WhatsApp</>}
            </button>
          </div>

          <Link
            to={`/regional/${asin}`}
            className="flex items-center gap-2 text-xs font-black text-white bg-secondary px-4 py-2.5 rounded-xl uppercase tracking-tighter shadow-lg shadow-secondary/20 hover:scale-[1.05] active:scale-95 transition-all"
          >
            <Map size={14} />
            Regional Intel
          </Link>

          <button
            onClick={handleManualSync}
            className="flex items-center gap-2 text-xs font-black text-white bg-primary px-4 py-2.5 rounded-xl uppercase tracking-tighter shadow-lg shadow-primary/30 hover:scale-[1.05] active:scale-95 transition-all"
          >
            <Zap size={14} />
            Sync Data
          </button>

          <button
            onClick={handleReset}
            className="flex items-center gap-2 text-xs font-black text-slate-500 bg-white px-4 py-2.5 rounded-xl uppercase tracking-tighter shadow-sm hover:bg-red-50 hover:text-red-500 transition-all border border-slate-100"
          >
            <RefreshCw size={14} />
            Reset
          </button>
        </div>
      </div>

      {/* Main Info Area */}
      <div className="flex flex-col lg:flex-row gap-10">
        <div className="lg:w-1/3 flex flex-col gap-6">
          <div className="glass-card p-6 rounded-3xl shadow-xl border-white/20 relative overflow-hidden group">
            <div className="w-full aspect-square rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 relative z-10 p-4">
              <img src={data.product.image_url} alt={data.product.title} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-1">
              <div className="px-2 py-0.5 bg-primary text-white text-[9px] font-black rounded uppercase tracking-widest shadow-sm">Amazon.in</div>
              <div className="flex items-center gap-1 px-2 py-0.5 bg-secondary text-white text-[9px] font-black rounded uppercase tracking-widest shadow-sm group/asin">
                Verified ASIN: {data.product.asin}
                <a
                  href={`https://www.amazon.in/dp/${data.product.asin}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:scale-110 transition-transform"
                  title="View on Amazon"
                >
                  <ExternalLink size={10} className="ml-1" />
                </a>
              </div>
              {data.product.is_out_of_stock && (
                <div className="px-2 py-0.5 bg-red-500 text-white text-[9px] font-black rounded uppercase tracking-widest shadow-lg animate-pulse">Out of Stock</div>
              )}
            </div>
            <h1 className="text-2xl font-black text-slate-800 leading-tight uppercase tracking-tighter italic">{data.product.title}</h1>
            <p className="text-neutral-custom font-medium mt-1 text-xs">Granular, multi-dimensional intelligence including historical Buy Box trends, volatility metrics, and real-time competitor matrix.</p>
          </div>

          {/* Analytics Cards */}
          <div className="grid grid-cols-1 gap-4">
            <div className="glass-card p-6 rounded-2xl flex flex-col gap-4 border-white/20 shadow-lg relative overflow-hidden">
              <div className="flex justify-between items-center relative z-10">
                <span className="text-[10px] text-neutral-custom font-black uppercase tracking-widest">Volatility Index</span>
                <BarChart3 size={16} className="text-primary" />
              </div>
              <div className="flex items-baseline gap-2 relative z-10">
                <p className="text-4xl font-black text-slate-800 italic">{volatility?.score || 0}</p>
                <span className="text-xs font-bold text-neutral-custom">/ 100</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden relative z-10">
                <div
                  className={`h-full transition-all duration-1000 ${volatility?.score > 50 ? 'bg-secondary shadow-[0_0_10px_#FF6D00]' : 'bg-primary shadow-[0_0_10px_#0060FF]'}`}
                  style={{ width: `${volatility?.score || 0}%` }}
                ></div>
              </div>
              <p className="text-[10px] font-medium text-neutral-custom leading-tight relative z-10 italic">
                {volatility?.score > 30 ? 'High frequency of price changes detected. Monitor for undercut patterns.' : 'Stable pricing trend. Ideal for long-term supply planning.'}
              </p>
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
            </div>

            <div className="glass-card p-6 rounded-2xl flex flex-col gap-4 border-white/20 shadow-lg">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-neutral-custom font-black uppercase tracking-widest">Buy Box Win Rate</span>
                <PieChart size={16} className="text-secondary" />
              </div>
              <div className="flex flex-col gap-3">
                {winRates.map((rate, idx) => (
                  <div key={idx} className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span className="truncate max-w-[120px]">{rate.seller}</span>
                      <span className={idx === 0 ? "text-primary" : "text-neutral-custom"}>{rate.win_rate}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-1000 ${idx === 0 ? 'bg-primary' : 'bg-neutral-custom/40'}`}
                        style={{ width: `${rate.win_rate}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
                {winRates.length === 0 && <p className="text-xs text-neutral-custom italic">Calculating win rate analytics...</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-8">
          <AIAdvisorCard asin={asin} />
          <PriceChart data={data.chart_data} buyBoxPrice={data.chart_data[data.chart_data.length - 1]?.price} />

          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center px-2">
              <div className="flex flex-col">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter italic">Competition Matrix</h3>
                  {storeLoading && (
                    <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse border border-primary/20">
                      <Loader2 size={10} className="animate-spin" />
                      Updating
                    </div>
                  )}
                </div>
                <p className="text-[10px] font-bold text-neutral-custom uppercase tracking-widest">Real-time marketplace dominance</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-custom bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                <Clock size={14} className="text-primary" /> Captured: {formatLocalizedDate(data.chart_data[data.chart_data.length - 1]?.name)}
              </div>
            </div>
            <SellerTable sellers={data.sellers} asin={asin} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
