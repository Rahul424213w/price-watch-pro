import React from 'react';
import { Home, Search, Bell, History, Settings, User, MapPin, Globe, Brain } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import ConfigPanel from './ConfigPanel';
import GlobalSyncOverlay from './GlobalSyncOverlay';
import useStore from '../store';

const NavItem = ({ to, icon: Icon, label, active }) => (
  <Link to={to} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
    active ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-neutral-custom hover:bg-primary/10'
  }`}>
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </Link>
);

const LiveClock = () => {
  const [time, setTime] = React.useState(new Date());
  
  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-3 glass-card px-4 py-2 rounded-xl border-white/40">
      <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
      <span className="text-sm font-black text-slate-700 italic tracking-tighter">
        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </span>
    </div>
  );
};

const Logo = () => (
  <div className="flex items-center gap-3 px-2 group cursor-pointer">
    <div className="relative">
      <div className="w-10 h-10 primary-gradient rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/20 group-hover:rotate-12 transition-transform duration-500">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <path d="M12 8v4"/>
          <path d="M12 16h.01"/>
        </svg>
      </div>
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-secondary rounded-full border-2 border-white animate-ping"></div>
    </div>
    <div>
      <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60 uppercase tracking-tighter leading-none">PriceWatch</h1>
      <p className="text-[8px] font-black text-secondary tracking-[0.3em] uppercase opacity-70">Intelligence Pro</p>
    </div>
  </div>
);

const Layout = ({ children }) => {
  const location = useLocation();
  const { config, isConfigOpen, setConfigOpen } = useStore();

  const isLanding = location.pathname === '/';

  if (isLanding) {
    return <main className="w-full min-h-screen bg-slate-50">{children}</main>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f0f7ff]">
      {/* Global Indicators */}
      <GlobalSyncOverlay />
 
      {/* Sidebar - Fixed Height & Non-scrolling */}
      <aside className="w-72 glass-card h-[calc(100vh-2rem)] m-4 rounded-[2rem] p-8 hidden md:flex flex-col gap-10 shadow-xl border-white/40 bg-white/70 backdrop-blur-2xl shrink-0">
        <Logo />
        
        <nav className="flex flex-col gap-2 mt-4">
          <NavItem to="/dashboard" icon={Home} label="Strategic Center" active={location.pathname === '/dashboard'} />
          <NavItem to="/search" icon={Search} label="Asset Discovery" active={location.pathname === '/search'} />
          <NavItem to="/alerts" icon={Bell} label="Monitoring Sentinels" active={location.pathname === '/alerts'} />
          <NavItem to="/tracked" icon={History} label="Tracked Universe" active={location.pathname === '/tracked'} />
          <NavItem to="/regional-matrix" icon={Globe} label="Regional Intelligence" active={location.pathname === '/regional-matrix'} />
          <NavItem to="/ai-analysis" icon={Brain} label="AI Strategic Analysis" active={location.pathname === '/ai-analysis'} />
        </nav>
        
        <div className="mt-auto flex flex-col gap-6">
           <button 
             onClick={() => setConfigOpen(true)}
             className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-slate-600 hover:bg-slate-100 transition-all font-bold text-sm border border-transparent hover:border-slate-200 group"
           >
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                <Settings size={20} />
              </div>
              <span className="uppercase tracking-widest text-[10px]">System Protocol</span>
           </button>
           
           <div className="glass-card p-5 rounded-[1.5rem] flex items-center gap-4 border-white/20 bg-slate-900 shadow-2xl group cursor-pointer hover:scale-[1.02] transition-transform">
             <div className="w-12 h-12 primary-gradient rounded-full flex items-center justify-center text-white shadow-lg shadow-primary/20 ring-4 ring-white/10">
               <User size={24} />
             </div>
             <div className="flex flex-col leading-tight">
               <p className="text-xs font-black text-white tracking-widest">VIVEK S.</p>
               <p className="text-[9px] text-primary font-black uppercase tracking-[0.2em] mt-0.5">Master Protocol</p>
             </div>
           </div>
        </div>
      </aside>

      {/* Main Content - Independent Scrolling */}
      <main className="flex-1 h-screen overflow-y-auto p-4 md:p-10 relative scroll-smooth bg-[#f0f7ff]/50">
        <header className="flex justify-between items-center mb-10 bg-white/60 backdrop-blur-2xl p-6 rounded-[2rem] border border-white/60 shadow-lg sticky top-0 z-[40]">
          <div className="flex items-center gap-4">
             <div>
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter italic">Strategic Intelligence</h2>
                <div className="flex items-center gap-2 text-[10px] text-neutral-custom font-black uppercase tracking-widest mt-1">
                   <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]"></div>
                   Monitoring active in <span className="text-primary font-bold">{config.pincode}</span>
                </div>
             </div>
          </div>
          
          <div className="flex items-center gap-4">
             <LiveClock />
             <div className="glass-card px-4 py-2 rounded-xl flex items-center gap-3 border-white/40">
                <MapPin size={18} className="text-secondary" />
                <div className="flex flex-col leading-none">
                   <span className="text-[8px] text-neutral-custom font-black uppercase tracking-widest">Regional Node</span>
                   <span className="text-sm font-black text-slate-700">{config.pincode}</span>
                </div>
             </div>
             <button 
                onClick={() => setConfigOpen(true)}
                className="primary-gradient text-white p-2 md:px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all font-black uppercase italic text-xs"
             >
                <Settings size={18} className="md:hidden" />
                <span className="hidden md:inline">Protocol Config</span>
             </button>
          </div>
        </header>

        {children}

        {/* Floating Settings Trigger for Mobile */}
        <button 
           onClick={() => setConfigOpen(true)}
           className="fixed bottom-6 right-6 w-14 h-14 primary-gradient text-white rounded-full flex items-center justify-center shadow-2xl md:hidden z-50 animate-bounce"
        >
           <Settings size={28} />
        </button>

        <ConfigPanel isOpen={isConfigOpen} onClose={() => setConfigOpen(false)} />
      </main>
    </div>
  );
};

export default Layout;
