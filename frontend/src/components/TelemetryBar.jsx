import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Cpu, HardDrive, Activity, Zap, Shield, Bell, Radio, Layers } from 'lucide-react';

/* Micro-Sparkline Component */
function Sparkline({ data = [], color = '#00ff41', height = 20, width = 60 }) {
  const bars = data.slice(-20); // Show last 20 data points
  const max = Math.max(...bars, 1);

  return (
    <div className="sparkline-container" style={{ height, width, gap: '1px' }}>
      {bars.map((val, i) => (
        <div
          key={i}
          className="sparkline-bar"
          style={{
            height: `${Math.max(8, (val / max) * 100)}%`,
            background: `linear-gradient(to top, ${color}40, ${color})`,
            boxShadow: i === bars.length - 1 ? `0 0 6px ${color}60` : 'none',
            opacity: 0.4 + (i / bars.length) * 0.6,
          }}
        />
      ))}
    </div>
  );
}

export default function TelemetryBar({ stats, wsConnected, systemMetrics }) {
  const [cpuHistory, setCpuHistory] = useState(Array(20).fill(0));
  const [ramHistory, setRamHistory] = useState(Array(20).fill(0));
  const [threadCount, setThreadCount] = useState(0);
  const frameRef = useRef(0);

  // Track metric history for sparklines
  useEffect(() => {
    if (systemMetrics) {
      setCpuHistory(prev => [...prev.slice(-19), systemMetrics.cpu_percent || 0]);
      setRamHistory(prev => [...prev.slice(-19), systemMetrics.ram_percent || 0]);
      // Simulate shadow threads based on throttle level
      setThreadCount(prev => {
        if (systemMetrics.throttle_level === 'paused') return 0;
        if (systemMetrics.throttle_level === 'throttled') return Math.max(1, prev - 1);
        return Math.min(12, Math.floor(Math.random() * 4) + 6);
      });
    }
  }, [systemMetrics]);

  // Animated thread pulse
  useEffect(() => {
    const interval = setInterval(() => {
      frameRef.current = (frameRef.current + 1) % 100;
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const cpuColor = (systemMetrics?.cpu_percent || 0) > 80 ? '#ff0a3c' : (systemMetrics?.cpu_percent || 0) > 60 ? '#ffd60a' : '#00ff41';
  const ramColor = (systemMetrics?.ram_percent || 0) > 85 ? '#ff0a3c' : (systemMetrics?.ram_percent || 0) > 70 ? '#ffd60a' : '#00d4ff';

  return (
    <footer className="telemetry-bar fixed bottom-0 left-0 right-0 z-[100] h-11 px-6 flex items-center justify-between pointer-events-auto">
      {/* Left: System Status */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2.5">
          <div 
            className={`w-2 h-2 rounded-full ${wsConnected ? 'animate-pulse' : ''}`}
            style={{ 
              background: wsConnected ? '#00ff41' : '#ff0a3c',
              boxShadow: wsConnected ? '0 0 8px rgba(0,255,65,0.5)' : '0 0 8px rgba(255,10,60,0.5)' 
            }} 
          />
          <span className="text-[10px] font-black font-mono tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
            SYS: <span style={{ color: wsConnected ? '#00ff41' : '#ff0a3c' }}>
              {wsConnected ? 'ONLINE' : 'OFFLINE'}
            </span>
          </span>
        </div>

        <div className="h-4 w-px bg-white/5" />

        {/* CPU with Sparkline */}
        <div className="flex items-center gap-2">
          <Cpu size={12} style={{ color: cpuColor, opacity: 0.7 }} />
          <span className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.35)' }}>
            CPU
          </span>
          <Sparkline data={cpuHistory} color={cpuColor} width={50} height={16} />
          <span className="text-[10px] font-mono font-bold text-white">
            {Math.round(systemMetrics?.cpu_percent || 0)}%
          </span>
        </div>

        <div className="h-4 w-px bg-white/5" />

        {/* RAM with Sparkline */}
        <div className="flex items-center gap-2">
          <HardDrive size={12} style={{ color: ramColor, opacity: 0.7 }} />
          <span className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.35)' }}>
            RAM
          </span>
          <Sparkline data={ramHistory} color={ramColor} width={50} height={16} />
          <span className="text-[10px] font-mono font-bold text-white">
            {Math.round(systemMetrics?.ram_percent || 0)}%
          </span>
        </div>
      </div>

      {/* Center: Active Shadow Threads */}
      <div className="hidden md:flex items-center gap-4 flex-1 justify-center px-10">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
        
        <div className="flex items-center gap-3">
          <Layers size={12} style={{ color: '#bf5af2', opacity: 0.7 }} />
          <span className="text-[9px] font-mono tracking-[0.3em] uppercase" style={{ color: 'rgba(191,90,242,0.6)' }}>
            Shadow Threads
          </span>
          <div className="flex items-center gap-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="w-1.5 h-4 rounded-sm transition-all duration-300"
                style={{
                  background: i < threadCount 
                    ? `linear-gradient(to top, rgba(191,90,242,0.3), rgba(191,90,242,0.9))` 
                    : 'rgba(255,255,255,0.03)',
                  boxShadow: i < threadCount ? '0 0 4px rgba(191,90,242,0.3)' : 'none',
                  opacity: i < threadCount ? 0.5 + (i / threadCount) * 0.5 : 0.3,
                }}
              />
            ))}
          </div>
          <span className="text-[10px] font-mono font-bold" style={{ color: '#bf5af2' }}>
            {threadCount}
          </span>
        </div>

        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      </div>

      {/* Right: Quick Stats */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2">
          <Activity size={12} style={{ color: '#00d4ff', opacity: 0.6 }} />
          <span className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.35)' }}>
            HEALTH
          </span>
          <span className="text-[10px] font-mono font-bold" style={{ 
            color: (stats?.success_rate || 0) >= 95 ? '#00ff41' : '#ff0a3c' 
          }}>
            {stats?.success_rate || 100}%
          </span>
        </div>

        <div className="h-4 w-px bg-white/5" />

        <div className="flex items-center gap-2">
          <Zap size={12} style={{ color: '#ffd60a', opacity: 0.6 }} />
          <span className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.35)' }}>
            LAT
          </span>
          <span className="text-[10px] font-mono font-bold text-white">
            {Math.round(stats?.avg_response_ms || 0)}ms
          </span>
        </div>

        <div className="h-4 w-px bg-white/5" />

        <div className="flex items-center gap-2">
          <Shield size={12} style={{ color: '#00ff41', opacity: 0.6 }} />
          <span className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.35)' }}>
            HEALS
          </span>
          <span className="text-[10px] font-mono font-bold" style={{ color: '#bf5af2' }}>
            {stats?.active_heals || 0}
          </span>
        </div>
      </div>
    </footer>
  );
}
