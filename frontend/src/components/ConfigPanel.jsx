import React, { useState } from 'react';
import { X, Settings, MapPin, Clock, Shield, Save, Check, Trash2, AlertTriangle } from 'lucide-react';
import useStore from '../store';

const ConfigPanel = ({ isOpen, onClose }) => {
  const { config, updateConfig, resetDatabase } = useStore();
  const [formData, setFormData] = useState({ ...config });
  const [isSaved, setIsSaved] = useState(false);
  const [confirmWipe, setConfirmWipe] = useState(false);

  const handleSave = () => {
    updateConfig(formData);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose}></div>
      
      {/* Sidebar Panel */}
      <div className="relative w-full max-w-md bg-white/90 backdrop-blur-xl h-full shadow-2xl p-8 flex flex-col gap-8 transition-transform duration-500 animate-in slide-in-from-right">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <Settings size={24} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Scraping Configuration</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <MapPin size={14} className="text-primary" /> Target Location (PIN Code)
            </label>
            <input 
              type="text" 
              value={formData.pincode}
              onChange={(e) => setFormData({...formData, pincode: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:border-primary outline-none text-slate-800 font-bold"
              placeholder="e.g. 400001"
            />
            <p className="text-[10px] text-slate-500 font-medium italic">Simulate regional Amazon India availability for precise Buy Box data.</p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <Clock size={14} className="text-secondary" /> Refresh Frequency (Minutes)
            </label>
            <select 
              value={formData.frequency}
              onChange={(e) => setFormData({...formData, frequency: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:border-secondary outline-none text-slate-800 font-bold appearance-none cursor-pointer"
            >
              <option value="15">Every 15 Minutes</option>
              <option value="30">Every 30 Minutes</option>
              <option value="60">Every 1 Hour (Recommended)</option>
              <option value="120">Every 2 Hours</option>
            </select>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <label className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <Shield size={14} className="text-green-500" /> Proxy Network Status
            </label>
            <div className="flex items-center justify-between p-5 bg-slate-900 rounded-2xl shadow-xl shadow-slate-200 relative overflow-hidden">
               <div className="flex flex-col z-10">
                  <span className="text-sm font-black text-white uppercase tracking-tighter italic">Anti-Blocking Shield</span>
                  <div className="flex items-center gap-2 mt-1">
                     <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]"></div>
                     <span className="text-[10px] text-green-400 font-bold uppercase tracking-widest">Network Operational</span>
                  </div>
               </div>
               <div className="w-12 h-6 bg-green-500/20 rounded-full flex items-center px-1 relative cursor-not-allowed z-10 border border-green-500/30">
                  <div className="w-4 h-4 bg-green-500 rounded-full translate-x-6 shadow-[0_0_10px_#22c55e]"></div>
               </div>
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
            </div>
          </div>
          <div className="flex flex-col gap-3 mt-4 pt-6 border-t border-slate-100">
             <label className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
               <AlertTriangle size={12} /> System Maintenance
             </label>
             <button 
               onClick={async () => {
                 if (confirmWipe) {
                   await resetDatabase();
                   setConfirmWipe(false);
                   onClose();
                 } else {
                   setConfirmWipe(true);
                 }
               }}
               className={`w-full py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all duration-300 ${
                 confirmWipe ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-200' : 'bg-red-50 text-red-500 hover:bg-red-100'
               }`}
             >
               {confirmWipe ? (
                 <span className="text-xs">YES, PERMANENTLY WIPE ALL DATA</span>
               ) : (
                 <><Trash2 size={16} /> Wipe Intelligence Data</>
               )}
             </button>
             {confirmWipe && (
               <button 
                 onClick={() => setConfirmWipe(false)}
                 className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
               >
                 Cancel Reset
               </button>
             )}
          </div>
        </div>

        <button 
          onClick={handleSave}
          className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg transition-all duration-300 ${
            isSaved ? 'bg-green-500 text-white' : 'primary-gradient text-white hover:shadow-primary/30'
          }`}
        >
          {isSaved ? (
            <><Check size={20} /> Configuration Saved</>
          ) : (
            <><Save size={20} /> Save Changes</>
          )}
        </button>
      </div>
    </div>
  );
};

export default ConfigPanel;
