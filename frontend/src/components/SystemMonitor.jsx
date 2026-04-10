import { motion } from 'framer-motion';
import { Cpu, HardDrive, Activity } from 'lucide-react';

const SegmentedGauge = ({ value, label, sublabel, color = '#A7EF9E' }) => {
  const segments = 10;
  const radius = 36;
  const stroke = 6;
  const normalizedValue = Math.min(100, Math.max(0, value));
  const activeSegments = Math.round((normalizedValue / 100) * segments);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          {[...Array(segments)].map((_, i) => {
            const angle = (i * (360 / segments)) * (Math.PI / 180);
            const isActive = i < activeSegments;
            const dashArray = 2 * Math.PI * radius / segments;
            return (
              <circle
                key={i}
                cx="48"
                cy="48"
                r={radius}
                fill="none"
                stroke={isActive ? color : 'rgba(255,255,255,0.05)'}
                strokeWidth={stroke}
                strokeDasharray={`${dashArray - 4} 4`}
                strokeDashoffset="0"
                className={isActive ? "glow-bloom transition-all duration-700" : ""}
                style={{ opacity: isActive ? 1 : 0.3 }}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-black text-white font-heading tracking-tighter">{Math.round(value)}%</span>
        </div>
      </div>
      <span className="mt-3 text-[10px] font-bold text-white/40 tracking-[0.2em] uppercase">{label}</span>
      {sublabel && <span className="text-[8px] font-mono opacity-30 mt-0.5">{sublabel}</span>}
    </div>
  );
};

export default function SystemMonitor({ metrics }) {
  const cpuColor = metrics.cpu_percent > 80 ? '#ff4d4d' : metrics.cpu_percent > 60 ? '#f4d03f' : '#A7EF9E';
  const ramColor = metrics.ram_percent > 85 ? '#ff4d4d' : metrics.ram_percent > 70 ? '#f4d03f' : '#39ff14';

  const throttleColors = {
    normal: { bg: 'rgba(167,239,158,0.08)', border: 'rgba(167,239,158,0.3)', text: '#A7EF9E' },
    throttled: { bg: 'rgba(244,208,63,0.08)', border: 'rgba(244,208,63,0.3)', text: '#f4d03f' },
    paused: { bg: 'rgba(255,77,77,0.08)', border: 'rgba(255,77,77,0.3)', text: '#ff4d4d' },
  };
  const tc = throttleColors[metrics.throttle_level] || throttleColors.normal;

  return (
    <motion.div
      className="glass-card clipped-corner p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.7 }}
    >
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-shadow-cyan/5 border border-shadow-cyan/10">
            <Activity size={20} className="text-shadow-cyan" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-[0.3em] uppercase mb-1">HARDWARE TELEMETRY</h3>
            <p className="text-[9px] font-mono text-white/30 tracking-[0.2em] uppercase">SYSTEM LOAD: {metrics.throttle_level || 'STABLE'}</p>
          </div>
        </div>
        <div className="px-5 py-1.5 border border-white/10 bg-white/[0.02] text-[10px] font-black uppercase tracking-[0.4em] text-shadow-cyan">
          {metrics.throttle_level || 'OPTIMAL'}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-10">
        <SegmentedGauge
          value={metrics.cpu_percent}
          label="CPU LOAD"
          sublabel="Neural Core"
          color={cpuColor}
        />
        <SegmentedGauge
          value={metrics.ram_percent}
          label="RAM USAGE"
          sublabel="Memory Buffer"
          color={ramColor}
        />
      </div>

      <div className="pt-8 border-t border-white/5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-sm bg-shadow-cyan shadow-[0_0_8px_rgba(167,239,158,0.5)]" />
            <span className="text-[10px] font-bold text-white/40 tracking-[0.2em] uppercase">RAM ALLOCATION</span>
          </div>
          <span className="text-[11px] font-mono font-black text-white">{metrics.ram_used_gb || 0} / {metrics.ram_total_gb || 0} GB</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-sm bg-shadow-cyan shadow-[0_0_8px_rgba(167,239,158,0.5)]" />
            <span className="text-[10px] font-bold text-white/40 tracking-[0.2em] uppercase">SHADOW INTERVAL</span>
          </div>
          <span className="text-[11px] font-mono font-black text-white">{metrics.shadow_interval || 10}s</span>
        </div>
      </div>
    </motion.div>
  );
}
