import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitBranch, RotateCcw, Settings2, Server, Sparkles, Activity, Clock, CheckCircle } from 'lucide-react';
import api from '../lib/api';

const STEP_ICONS = {
  retry: RotateCcw,
  param_adjust: Settings2,
  mock_fallback: Server,
  schema_auto_fix: Sparkles,
};

const STEP_COLORS = {
  retry: '#00d4ff',
  param_adjust: '#ffd60a',
  mock_fallback: '#00ff41',
  schema_auto_fix: '#bf5af2',
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
      className="glass-card p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.6 }}
    >
      <div className="flex items-center justify-between mb-7">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-lg border border-white/5" style={{
            background: 'rgba(191, 90, 242, 0.05)',
          }}>
            <Sparkles size={20} style={{ color: '#bf5af2' }} />
          </div>
          <div className="section-header">
            <h3 className="text-sm font-bold text-white tracking-[0.3em] uppercase mb-0.5">
              REPAIR PROTOCOLS
            </h3>
            <p className="text-[9px] font-mono tracking-[0.2em] uppercase" style={{ color: 'rgba(191,90,242,0.4)' }}>
              AI AUTO-HEAL TIMELINE
            </p>
          </div>
        </div>
        <div className="text-[10px] font-mono font-bold" style={{ color: '#bf5af2' }}>
          {heals.length} EVENTS
        </div>
      </div>

      <div className="space-y-2 max-h-[380px] overflow-y-auto pr-2">
        {heals.length === 0 ? (
          <div className="text-center py-8">
            <GitBranch size={28} className="mx-auto mb-3" style={{ color: 'rgba(191,90,242,0.12)' }} />
            <p className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.15)' }}>
              No heal events yet
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {heals.map((heal, i) => {
              const Icon = STEP_ICONS[heal.heal_step] || RotateCcw;
              const color = STEP_COLORS[heal.heal_step] || '#00d4ff';
              const time = new Date(heal.created_at).toLocaleTimeString('en-US', {
                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
              });

              return (
                <motion.div
                  key={heal.id}
                  className="flex items-start gap-5 p-4 rounded-lg border mb-1"
                  style={{
                    background: 'rgba(255,255,255,0.01)',
                    borderColor: 'rgba(255,255,255,0.04)',
                  }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  whileHover={{ 
                    backgroundColor: 'rgba(191,90,242,0.03)',
                    borderColor: 'rgba(191,90,242,0.1)',
                  }}
                >
                  {/* Timeline Icon */}
                  <div className="flex flex-col items-center gap-2 pt-1">
                    <div 
                      className="w-8 h-8 flex items-center justify-center border"
                      style={{ 
                        borderColor: `${color}30`,
                        background: `${color}08`,
                        clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                      }}
                    >
                      <Icon size={14} style={{ color, filter: `drop-shadow(0 0 4px ${color})` }} />
                    </div>
                    {i < heals.length - 1 && (
                      <div className="w-px h-4" style={{ background: 'rgba(191,90,242,0.1)' }} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-black text-white uppercase tracking-[0.1em]">
                        {heal.endpoint_name || 'System Correction'}
                      </span>
                      <span className="badge-tactical scale-75 origin-right" style={{
                        borderColor: 'rgba(0,255,65,0.2)',
                        color: '#00ff41',
                        background: 'rgba(0,255,65,0.04)',
                      }}>
                        <CheckCircle size={8} />
                        RESOLVED
                      </span>
                    </div>
                    <p className="text-[10px] leading-relaxed font-medium mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      Detected {heal.failure_type || 'Anomaly'} in node. AI triggered autonomous repair via {heal.heal_step || 'adaptive strategy'}.
                    </p>
                    <div className="flex items-center gap-4 text-[9px] font-mono uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.2)' }}>
                      <span className="flex items-center gap-1.5"><Clock size={10} /> {time}</span>
                      <span className="opacity-30">|</span>
                      <span className="truncate" style={{ color: 'rgba(191,90,242,0.5)' }}>
                        RCA: {heal.root_cause || 'Structural Drift'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}
