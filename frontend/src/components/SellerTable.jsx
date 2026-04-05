import React from 'react';
import { ShoppingBag, Truck, CheckCircle, ExternalLink, MoreVertical, AlertTriangle, Plus, Loader2 } from 'lucide-react';
import useStore from '../store';

const SellerTable = ({ sellers, asin }) => {
  const { subscribeWhatsApp, isLoading } = useStore();
  const [subscribing, setSubscribing] = React.useState(null);
  const [subscribed, setSubscribed] = React.useState({});

  const handleSubscribe = async (sellerName) => {
    const number = window.prompt(`Register WhatsApp number for ${sellerName} alerts (E.164 format):`, "+91");
    if (!number) return;
    
    setSubscribing(sellerName);
    const success = await subscribeWhatsApp(asin, number, sellerName);
    setSubscribing(null);
    
    if (success) {
      setSubscribed(prev => ({...prev, [sellerName]: true}));
      setTimeout(() => setSubscribed(prev => ({...prev, [sellerName]: false})), 3000);
    }
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden mt-8">
      <div className="flex justify-between items-center p-6 bg-white/30 border-b border-white/20">
        <h3 className="text-lg font-bold">Competition Matrix</h3>
        <button className="text-primary hover:bg-primary/10 p-2 rounded-lg transition-all">
          <ExternalLink size={20} />
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#f8fafc]">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-neutral-custom uppercase tracking-wider">Seller Name</th>
              <th className="px-6 py-4 text-xs font-bold text-neutral-custom uppercase tracking-wider">Price (INR)</th>
              <th className="px-6 py-4 text-xs font-bold text-neutral-custom uppercase tracking-wider">Type</th>
              <th className="px-6 py-4 text-xs font-bold text-neutral-custom uppercase tracking-wider">Availability</th>
              <th className="px-6 py-4 text-xs font-bold text-neutral-custom uppercase tracking-wider text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sellers.map((seller, idx) => {
              const isSuppressed = seller.name.includes('Suppressed') || seller.name.includes('Options');
              
              return (
                <tr key={idx} className={`hover:bg-primary/5 transition-all duration-300 ${seller.isBuyBox ? (isSuppressed ? 'bg-amber-50/30' : 'bg-primary/[0.03]') : ''}`}>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${seller.isBuyBox ? (isSuppressed ? 'bg-amber-500 text-white' : 'primary-gradient text-white') : 'bg-slate-200 text-slate-500'}`}>
                        {isSuppressed ? <AlertTriangle size={16} /> : seller.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-700">{seller.name}</p>
                        {seller.isBuyBox && (
                          <span className={`text-[10px] text-white px-2 py-0.5 rounded-full font-extrabold uppercase ${isSuppressed ? 'bg-amber-500' : 'bg-secondary'}`}>
                            {isSuppressed ? 'Buy Box Suppressed' : 'Buy Box Winner'}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <p className={`font-extrabold text-lg ${seller.isBuyBox && !isSuppressed ? 'text-primary' : 'text-slate-700'}`}>
                      {seller.price > 0 ? `₹${seller.price.toLocaleString()}` : '--'}
                    </p>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      {!isSuppressed && (
                        seller.isFBA ? (
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-lg text-xs font-bold">
                            <CheckCircle size={14} />
                            FBA
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-xs font-bold">
                            <Truck size={14} />
                            Merchant
                          </div>
                        )
                      )}
                    </div>
                  </td>
                 <td className="px-6 py-5">
                   {seller.isOutOfStock ? (
                     <span className="text-sm font-black text-red-500 uppercase">OOS</span>
                   ) : (
                     <span className="text-sm font-medium text-slate-500">In Stock</span>
                   )}
                 </td>
                <td className="px-6 py-5 text-right">
                   <div className="flex items-center justify-end gap-2">
                     <button 
                       onClick={() => handleSubscribe(seller.name)}
                       disabled={subscribing === seller.name}
                       className={`p-2 rounded-lg transition-all ${
                         subscribed[seller.name] ? 'bg-green-500 text-white' : 
                         'bg-primary/10 text-primary hover:bg-primary hover:text-white'
                       }`}
                       title="Subscribe for WhatsApp Alerts"
                     >
                       {subscribing === seller.name ? <Loader2 size={16} className="animate-spin" /> : 
                        subscribed[seller.name] ? <CheckCircle size={16} /> :
                        <Plus size={16} />}
                     </button>
                     <a 
                       href={`https://www.amazon.in/dp/${asin}`}
                       target="_blank"
                       rel="noreferrer"
                       className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-primary transition-all"
                       title="View Offer on Amazon"
                     >
                       <ExternalLink size={18} />
                     </a>
                   </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SellerTable;
