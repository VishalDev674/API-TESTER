import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GitBranch, RotateCcw, Settings2, Server, Sparkles, Activity, Clock } from 'lucide-react';
import api from '../lib/api';

const STEP_ICONS = {
  retry: RotateCcw,
  param_adjust: Settings2,
  mock_fallback: Server,
  schema_auto_fix: Sparkles,
};

const STEP_COLORS = {
  retry: '#A7EF9E',
  param_adjust: '#f4d03f',
  mock_fallback: '#39ff14',
  schema_auto_fix: '#27ae60',
};

export default function HealTimeline() {
  const [heals, setHeals] = useState([]);

  useEffect(() => {
    loadHeals();
    const interval = setInterval(loadHeals, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadHeals = async () => {
    try {
      const data = await api.getHeals(20);
      setHeals(data);
    } catch (e) {
      console.error('Failed to load heals:', e);
    }
  };

  return (
    <motion.div
      className="glass-card clipped-corner p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.6 }}
    >
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-shadow-cyan/5 border border-shadow-cyan/10">
            <Activity size={20} className="text-shadow-cyan" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-[0.3em] uppercase mb-1">REPAIR PROTOCOLS</h3>
            <p className="text-[9px] font-mono text-white/30 tracking-[0.2em] uppercase">SYSTEM AUTO-HEAL LOGS</p>
          </div>
        </div>
      </div>

      <div className="space-y-1 max-h-[380px] overflow-y-auto pr-2">
        {heals.length === 0 ? (
          <div className="text-center py-6 text-shadow-text-dim">
            <GitBranch size={24} className="mx-auto mb-2 opacity-30" />
            <p className="text-xs font-mono">No heal events yet</p>
          </div>
        ) : (
          heals.map((heal, i) => {
            const Icon = STEP_ICONS[heal.heal_step] || RotateCcw;
            const color = STEP_COLORS[heal.heal_step] || '#A7EF9E';
            const time = new Date(heal.created_at).toLocaleTimeString('en-US', {
              hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
            });

            return (
              <motion.div
                key={heal.id}
                className="flex items-start gap-5 p-4 tactical-border bg-white/[0.01] mb-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                {/* Timeline dot & line */}
                <div className="flex flex-col items-center gap-2 pt-1">
                  <div className="w-8 h-8 flex items-center justify-center bg-white/[0.02] border border-white/10"
                    style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}>
                    <Icon size={14} style={{ color }} className="glow-bloom" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-black text-white uppercase tracking-[0.1em]">
                      {heal.endpoint_name || 'System Correction'}
                    </span>
                    <span className="badge-tactical border-shadow-green/20 text-shadow-green scale-75 origin-right">
                      SUCCESS
                    </span>
                  </div>
                  <p className="text-[10px] text-white/50 leading-relaxed font-medium mb-3">
                    Detected {heal.failure_type || 'Anomaly'} in node. Gemini-1.5 AI triggered autonomous repair and RCA broadcast.
                  </p>
                  <div className="flex items-center gap-4 text-[9px] font-mono text-white/30 tracking-widest uppercase">
                    <span className="flex items-center gap-1.5"><Clock size={10} /> {time}</span>
                    <span className="opacity-20">|</span>
                    <span className="truncate">RCA: {heal.root_cause || 'Structural Drift'}</span>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
