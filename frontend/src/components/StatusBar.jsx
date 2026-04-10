import { motion } from 'framer-motion';
import { Shield, Zap, Cpu, Bell, Activity } from 'lucide-react';

export default function StatusBar({ stats, wsConnected, systemMetrics }) {
  const status = wsConnected ? 'OPERATIONAL' : 'OFFLINE';
  const statusColor = wsConnected ? 'text-shadow-green' : 'text-shadow-red';
  const apiHealth = stats.total_endpoints > 0 
    ? Math.round((stats.active_endpoints / stats.total_endpoints) * 100) 
    : 100;

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-[100] h-10 bg-black/80 backdrop-blur-md border-t border-shadow-cyan/20 px-6 flex items-center justify-between pointer-events-auto">
      {/* Left Section: System Status */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2.5">
          <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-shadow-green shadow-[0_0_8px_rgba(57,255,20,0.4)] animate-pulse' : 'bg-shadow-red'}`} />
          <span className="text-[10px] font-black font-mono tracking-widest text-white/50">
            SYSTEM: <span className={statusColor}>{status}</span>
          </span>
        </div>
        
        <div className="h-4 w-px bg-white/5" />
        
        <div className="flex items-center gap-2">
          <Activity size={12} className="text-shadow-cyan/50" />
          <span className="text-[9px] font-mono text-white/40 tracking-wider">
            HEALTH: <span className="text-white font-bold">{apiHealth}%</span>
          </span>
        </div>

        <div className="h-4 w-px bg-white/5" />

        <div className="flex items-center gap-2">
          <Cpu size={12} className="text-shadow-cyan/50" />
          <span className="text-[9px] font-mono text-white/40 tracking-wider uppercase">
            LOAD: <span className="text-white font-bold">{Math.round(systemMetrics?.cpu_percent || 0)}%</span>
          </span>
        </div>
      </div>

      {/* Center Section: Ticker / Marquee (Optional or Static) */}
      <div className="hidden md:flex items-center gap-4 flex-1 justify-center px-20">
        <div className="h-1px flex-1 bg-gradient-to-r from-transparent via-shadow-cyan/10 to-transparent" />
        <span className="text-[8px] font-mono text-shadow-cyan/30 tracking-[0.5em] uppercase animate-flicker">
          Autonomous Testing Engine active // Shadow Thread Running // No Production Impact
        </span>
        <div className="h-1px flex-1 bg-gradient-to-r from-shadow-cyan/10 via-shadow-cyan/10 to-transparent" />
      </div>

      {/* Right Section: Stats & Alerts */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Shield size={12} className="text-shadow-cyan/50" />
            <span className="text-[9px] font-mono text-white/40">SEC: <span className="text-shadow-green">AUTO</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap size={12} className="text-shadow-cyan/50" />
            <span className="text-[9px] font-mono text-white/40">LAT: <span className="text-white font-bold">{Math.round(stats.avg_response_ms || 0)}ms</span></span>
          </div>
        </div>

        <div className="h-4 w-px bg-white/5" />

        <button className="flex items-center gap-2 hover:bg-white/5 px-2 py-1 transition-colors rounded">
          <Bell size={12} className="text-shadow-cyan/50" />
          <span className="text-[9px] font-mono text-white/60">0 ALERTS</span>
        </button>
      </div>
    </footer>
  );
}
