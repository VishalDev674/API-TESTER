import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Cpu, HardDrive, Activity, Gauge, Thermometer } from 'lucide-react';

/* Segmented Arc Gauge */
const SegmentedGauge = ({ value, label, sublabel, color = '#00ff41', icon: Icon }) => {
  const segments = 12;
  const radius = 38;
  const stroke = 5;
  const normalizedValue = Math.min(100, Math.max(0, value));
  const activeSegments = Math.round((normalizedValue / 100) * segments);
  const circumference = 2 * Math.PI * radius;
  const segmentLength = circumference / segments;
  const gapLength = 4;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-28 h-28 flex items-center justify-center">
        <svg className="w-full h-full" viewBox="0 0 96 96" style={{ transform: 'rotate(-90deg)' }}>
          {/* Background segments */}
          {[...Array(segments)].map((_, i) => {
            const rotation = (i * 360) / segments;
            return (
              <circle
                key={`bg-${i}`}
                cx="48" cy="48" r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.04)"
                strokeWidth={stroke}
                strokeDasharray={`${segmentLength - gapLength} ${gapLength}`}
                strokeDashoffset={-(i * segmentLength)}
                strokeLinecap="round"
              />
            );
          })}
          
          {/* Active segments */}
          {[...Array(segments)].map((_, i) => {
            const isActive = i < activeSegments;
            if (!isActive) return null;
            
            const opacity = 0.4 + (i / segments) * 0.6;
            return (
              <circle
                key={`active-${i}`}
                cx="48" cy="48" r={radius}
                fill="none"
                stroke={color}
                strokeWidth={stroke}
                strokeDasharray={`${segmentLength - gapLength} ${gapLength}`}
                strokeDashoffset={-(i * segmentLength)}
                strokeLinecap="round"
                className="transition-all duration-500"
                style={{ 
                  opacity,
                  filter: i >= activeSegments - 2 ? `drop-shadow(0 0 4px ${color})` : 'none',
                }}
              />
            );
          })}
        </svg>
        
        {/* Center value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {Icon && <Icon size={14} style={{ color, opacity: 0.5 }} className="mb-1" />}
          <span 
            className="text-xl font-black text-white tracking-tighter"
            style={{ 
              fontFamily: "'Outfit', sans-serif",
              textShadow: normalizedValue > 80 ? `0 0 10px ${color}40` : 'none',
            }}
          >
            {Math.round(value)}%
          </span>
        </div>
      </div>
      <span className="mt-3 text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>
        {label}
      </span>
      {sublabel && (
        <span className="text-[8px] font-mono mt-0.5" style={{ color: 'rgba(255,255,255,0.15)' }}>
          {sublabel}
        </span>
      )}
    </div>
  );
};

export default function SystemMonitor({ metrics }) {
  const cpuColor = metrics.cpu_percent > 80 ? '#ff0a3c' : metrics.cpu_percent > 60 ? '#ffd60a' : '#00ff41';
  const ramColor = metrics.ram_percent > 85 ? '#ff0a3c' : metrics.ram_percent > 70 ? '#ffd60a' : '#00d4ff';

  const throttleConfig = useMemo(() => ({
    normal: { color: '#00ff41', label: 'OPTIMAL', bg: 'rgba(0,255,65,0.04)', border: 'rgba(0,255,65,0.15)' },
    throttled: { color: '#ffd60a', label: 'THROTTLED', bg: 'rgba(255,214,10,0.04)', border: 'rgba(255,214,10,0.15)' },
    paused: { color: '#ff0a3c', label: 'CRITICAL', bg: 'rgba(255,10,60,0.04)', border: 'rgba(255,10,60,0.15)' },
  }), []);

  const tc = throttleConfig[metrics.throttle_level] || throttleConfig.normal;

  return (
    <motion.div
      className="glass-card p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.7 }}
    >
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-lg border border-white/5" style={{
            background: 'rgba(0, 212, 255, 0.05)',
          }}>
            <Gauge size={20} style={{ color: '#00d4ff' }} />
          </div>
          <div className="section-header">
            <h3 className="text-sm font-bold text-white tracking-[0.3em] uppercase mb-0.5">
              HARDWARE TELEMETRY
            </h3>
            <p className="text-[9px] font-mono tracking-[0.2em] uppercase" style={{ color: 'rgba(255,255,255,0.25)' }}>
              SYSTEM LOAD: {(metrics.throttle_level || 'STABLE').toUpperCase()}
            </p>
          </div>
        </div>
        <div 
          className="px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-[0.3em]"
          style={{ 
            background: tc.bg, 
            borderColor: tc.border, 
            color: tc.color,
            boxShadow: `0 0 15px ${tc.color}15`,
          }}
        >
          {tc.label}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <SegmentedGauge
          value={metrics.cpu_percent}
          label="CPU LOAD"
          sublabel="Neural Core"
          color={cpuColor}
          icon={Cpu}
        />
        <SegmentedGauge
          value={metrics.ram_percent}
          label="RAM USAGE"
          sublabel="Memory Buffer"
          color={ramColor}
          icon={HardDrive}
        />
      </div>

      <div className="pt-6 border-t border-white/5 space-y-4">
        {/* RAM Allocation Bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-sm" style={{ 
                background: '#00d4ff', 
                boxShadow: '0 0 6px rgba(0,212,255,0.5)' 
              }} />
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>
                RAM ALLOCATION
              </span>
            </div>
            <span className="text-[11px] font-mono font-black text-white">
              {metrics.ram_used_gb || 0} / {metrics.ram_total_gb || 0} GB
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <motion.div 
              className="h-full rounded-full"
              style={{ 
                background: `linear-gradient(90deg, ${ramColor}60, ${ramColor})`,
                boxShadow: `0 0 8px ${ramColor}40`,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${metrics.ram_percent || 0}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Shadow Interval */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-sm" style={{ 
              background: '#bf5af2', 
              boxShadow: '0 0 6px rgba(191,90,242,0.5)' 
            }} />
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>
              SHADOW INTERVAL
            </span>
          </div>
          <span className="text-[11px] font-mono font-black text-white">{metrics.shadow_interval || 10}s</span>
        </div>

        {/* Throttle Level Indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-sm" style={{ 
              background: tc.color, 
              boxShadow: `0 0 6px ${tc.color}80` 
            }} />
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>
              THROTTLE LEVEL
            </span>
          </div>
          <span className="text-[11px] font-mono font-black" style={{ color: tc.color }}>
            {(metrics.throttle_level || 'NORMAL').toUpperCase()}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
