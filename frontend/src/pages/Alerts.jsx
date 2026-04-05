import React, { useEffect, useState } from 'react';
import { Bell, Plus, Trash2, ArrowDownCircle, AlertCircle, ShoppingBag, CheckCircle, ShieldCheck, TrendingDown, Clock, Zap, BarChart3, X, Loader2 } from 'lucide-react';
import useStore from '../store';
import { formatLocalizedDate } from '../utils/dateUtils';

const AlertsPage = () => {
  const { alerts, fetchAlerts, createAlert, deleteAlert, getProductDetails, sendWhatsAppStatus, error, clearError } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [newAlert, setNewAlert] = useState({ asin: '', target: '' });
  const [preview, setPreview] = useState(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [sendingStatus, setSendingStatus] = useState({}); // { asin: 'idle' | 'sending' | 'success' | 'error' }

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  useEffect(() => {
    const fetchPreview = async () => {
      if (newAlert.asin.length >= 10) {
        setIsPreviewLoading(true);
        const details = await getProductDetails(newAlert.asin);
        setPreview(details);
        setIsPreviewLoading(false);
      } else {
        setPreview(null);
      }
    };
    const timer = setTimeout(fetchPreview, 800);
    return () => clearTimeout(timer);
  }, [newAlert.asin, getProductDetails]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newAlert.asin || !newAlert.target) return;

    try {
      await createAlert(newAlert.asin, newAlert.target);
      setNewAlert({ asin: '', target: '' });
      setPreview(null);
      setShowAdd(false);
      console.log("[PriceWatch Alerts] Sentinel Activated Successfully.");
    } catch (err) {
      console.error("[PriceWatch Alerts] activation failed:", err);
    }
  };

  return (
    <div className="flex flex-col gap-10">
      {/* Alerts Header */}
      <div className="flex justify-between items-center bg-white/40 p-10 rounded-2xl border border-white/40 glass-card shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary">
              <Bell size={24} />
            </div>
            <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Active Monitoring</h2>
          </div>
          <p className="text-neutral-custom font-medium max-w-lg">Configure automated sentinels to monitor price thresholds and volatility events across your fleet of tracked assets.</p>
        </div>

        <button
          onClick={() => setShowAdd(!showAdd)}
          className="px-8 py-5 secondary-gradient text-white font-black rounded-xl shadow-xl shadow-secondary/30 flex items-center gap-3 hover:scale-[1.03] active:scale-95 transition-all uppercase tracking-tighter z-10"
        >
          <Plus size={24} />
          <span>{showAdd ? 'Close Protocol' : 'Initialize Sentinel'}</span>
        </button>

        {/* Abstract Sphere */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      </div>

      {showAdd && (
        <div className="flex flex-col gap-6 animate-in zoom-in-95 duration-300">
          <form onSubmit={handleSubmit} className="glass-card p-8 rounded-2xl flex flex-col md:flex-row gap-6 bg-white/70 border-primary/20 shadow-2xl">
            <div className="flex-[2] flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck size={14} className="text-primary" /> Target Product ASIN
              </label>
              <input
                type="text"
                value={newAlert.asin}
                onChange={(e) => setNewAlert({ ...newAlert, asin: e.target.value.toUpperCase() })}
                placeholder="Enter ASIN (e.g. B000X2D8L6)"
                className="bg-white px-5 py-4 rounded-xl border border-slate-200 outline-none focus:border-primary shadow-sm font-bold transition-all text-slate-800"
              />
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <TrendingDown size={14} className="text-secondary" /> Alert Threshold (INR)
              </label>
              <input
                type="number"
                value={newAlert.target}
                onChange={(e) => setNewAlert({ ...newAlert, target: e.target.value })}
                placeholder="Set price ₹"
                className="bg-white px-5 py-4 rounded-xl border border-slate-200 outline-none focus:border-secondary shadow-sm font-bold transition-all text-secondary"
              />
            </div>
            <div className="flex items-end flex-initial">
              <button
                type="submit"
                disabled={!newAlert.asin || !newAlert.target}
                className="w-full h-[60px] px-10 primary-gradient text-white font-black rounded-xl shadow-lg transition-all hover:shadow-primary/30 active:scale-95 uppercase tracking-tighter disabled:opacity-50"
              >
                Create Sentinel
              </button>
            </div>
          </form>

          {error && (
            <div className="flex items-center gap-2 text-red-500 text-[10px] font-black bg-red-50 px-4 py-2 rounded-lg border border-red-100 animate-in slide-in-from-top-2 mx-8">
              <AlertCircle size={14} /> SENTINEL ACTIVATION REFUSED: {error}
            </div>
          )}

          {/* Asset Preview Block */}
          {(isPreviewLoading || preview) && (
            <div className="glass-card p-6 rounded-2xl bg-slate-900 border-none flex items-center gap-6 shadow-2xl relative overflow-hidden">
              {isPreviewLoading ? (
                <div className="flex items-center gap-4 py-4 px-2 w-full">
                  <Loader2 className="animate-spin text-primary" size={24} />
                  <span className="text-white font-black uppercase tracking-widest text-[10px]">Loading Asset Intelligence...</span>
                </div>
              ) : preview ? (
                <>
                  <div className="w-24 h-24 bg-white rounded-xl p-3 flex items-center justify-center shrink-0">
                    <img src={preview.product?.image_url} alt={preview.product?.title} className="max-h-full object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-black bg-primary/20 text-primary px-2 py-0.5 rounded uppercase tracking-widest">Preview Mode</span>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{preview.product?.asin}</span>
                    </div>
                    <h4 className="text-white font-bold text-sm truncate uppercase tracking-tighter">{preview.product?.title}</h4>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest uppercase">Current Point</span>
                        <span className="text-xl font-black text-green-400 italic leading-none">
                          ₹{(preview.chart_data?.[preview.chart_data.length - 1]?.price || 0).toLocaleString()}
                        </span>
                      </div>
                      {newAlert.target && (
                        <div className="flex flex-col border-l border-white/10 pl-4">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest uppercase">Target Vector</span>
                          <span className="text-xl font-black text-secondary italic leading-none">₹{parseFloat(newAlert.target).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
                </>
              ) : null}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {alerts.length > 0 ? (
          alerts.map((alert) => (
            <div key={alert.id} className="glass-card p-8 rounded-3xl flex items-center justify-between group hover:border-primary/40 transition-all duration-500 shadow-lg hover:shadow-2xl relative overflow-hidden">
              {alert.is_triggered && <div className="absolute top-0 right-0 w-2 h-full bg-secondary"></div>}

              <div className="flex items-center gap-6 relative z-10">
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center relative overflow-hidden ${alert.is_triggered ? 'bg-orange-100 text-secondary' : 'bg-primary/10 text-primary'}`}>
                  {alert.is_triggered ? (
                    <><AlertCircle size={40} className="animate-pulse relative z-10" /><div className="absolute inset-0 bg-orange-200 animate-ping opacity-10"></div></>
                  ) : (
                    <Bell size={40} />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black text-neutral-custom uppercase">Product Asset</span>
                    <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                  </div>
                  <h3 className="font-black text-2xl text-slate-800 tracking-tighter uppercase">{alert.asin}</h3>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
                      <TrendingDown size={14} className="text-secondary" />
                      <span className="text-xs font-black text-slate-500 uppercase">Target:</span>
                      <span className="font-black text-secondary">₹{alert.target_price}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-neutral-custom uppercase">
                      <Clock size={12} /> Created: {formatLocalizedDate(alert.created_at)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-4 z-10">
                {alert.is_triggered ? (
                  <div className="flex flex-col items-end">
                    <span className="bg-secondary text-white px-4 py-2 rounded-xl text-xs font-black uppercase shadow-xl shadow-secondary/40 tracking-widest animate-bounce">Price Drop!</span>
                    <span className="text-[10px] font-bold text-neutral-custom mt-2">Detected: <span className="text-secondary">{formatLocalizedDate(alert.triggered_at)}</span></span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-4 py-2 bg-green-50 text-green-600 rounded-xl text-xs font-black uppercase tracking-widest">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    Live Monitor
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      setSendingStatus(prev => ({ ...prev, [alert.asin]: 'sending' }));
                      await sendWhatsAppStatus(alert.asin);
                      setSendingStatus(prev => ({ ...prev, [alert.asin]: 'success' }));
                      setTimeout(() => setSendingStatus(prev => ({ ...prev, [alert.asin]: 'idle' })), 3000);
                    }}
                    disabled={sendingStatus[alert.asin] === 'sending'}
                    className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all border shadow-sm group/btn relative ${sendingStatus[alert.asin] === 'success' ? 'bg-green-500 text-white border-green-600' :
                        sendingStatus[alert.asin] === 'sending' ? 'bg-slate-100 text-primary border-slate-200' :
                          'bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-primary border-slate-100'
                      }`}
                    title="Teleport to WhatsApp"
                  >
                    {sendingStatus[alert.asin] === 'success' ? <CheckCircle size={20} /> :
                      sendingStatus[alert.asin] === 'sending' ? <Loader2 size={20} className="animate-spin" /> :
                        <Plus size={20} className="group-hover/btn:rotate-90 transition-transform" />}
                  </button>
                  <button
                    onClick={() => deleteAlert(alert.id)}
                    className="w-12 h-12 flex items-center justify-center bg-slate-50 text-red-400 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all border border-slate-100 shadow-sm"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>

              {/* Internal Shadow for triggered state */}
              {alert.is_triggered && <div className="absolute inset-0 bg-secondary/5 pointer-events-none"></div>}
            </div>
          ))
        ) : (
          <div className="col-span-2 py-32 flex flex-col items-center justify-center gap-6 text-neutral-custom bg-white/20 rounded-3xl border border-white/20 backdrop-blur-sm grayscale opacity-50">
            <ShoppingBag size={80} className="stroke-[1]" />
            <div className="text-center">
              <p className="font-black text-2xl uppercase tracking-widest">Sentinels Inactive</p>
              <p className="font-medium mt-2">Clear alerts will appear here once configured.</p>
            </div>
            <button onClick={() => setShowAdd(true)} className="px-6 py-3 bg-slate-200 text-slate-600 rounded-xl font-bold hover:bg-primary hover:text-white transition-all uppercase text-xs tracking-widest">Initialize Sentinel</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertsPage;
