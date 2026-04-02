import React from 'react';
import { ArrowUpRight, ArrowDownRight, TrendingUp, DollarSign, Package, ShoppingCart } from 'lucide-react';

const DashboardCard = ({ title, value, change, icon: Icon, colorClass }) => {
  const isPositive = change > 0;
  
  return (
    <div className="glass-card p-6 rounded-2xl flex flex-col gap-4 min-w-[240px]">
      <div className="flex justify-between items-center">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg ${colorClass}`}>
          <Icon size={24} />
        </div>
        <div className={`flex items-center gap-1 text-sm font-bold ${isPositive ? 'text-red-500' : 'text-green-500'}`}>
          {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
          {Math.abs(change)}%
        </div>
      </div>
      
      <div>
        <p className="text-slate-600 text-sm font-medium">{title}</p>
        <h3 className="text-2xl font-bold mt-1 text-slate-800">{value}</h3>
      </div>
    </div>
  );
};

export default DashboardCard;
