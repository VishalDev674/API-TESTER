import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Brain } from 'lucide-react';

const LOG_COLORS = {
  info: '#A7EF9E',
  warning: '#f4d03f',
  error: '#ff4d4d',
  heal: '#39ff14',
  analysis: '#58d68d',
};

const LOG_PREFIX = {
  info: '  INFO ',
  warning: '  WARN ',
  error: ' ERROR ',
  heal: '  HEAL ',
  analysis: '   RCA ',
};

export default function AIThoughtStream({ thoughts }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thoughts]);

  return (
    <motion.div
      className="glass-card clipped-corner p-8 flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      style={{ maxHeight: '460px' }}
    >
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-shadow-cyan/5 border border-shadow-cyan/10">
            <Brain size={20} className="text-shadow-cyan" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-[0.3em] uppercase mb-1">COGNITIVE STREAM</h3>
            <p className="text-[9px] font-mono text-white/30 tracking-[0.2em] uppercase">NEURAL ENGINE ANALYSIS</p>
          </div>
        </div>
        <div className="badge-tactical px-3 py-1.5 border-shadow-cyan/30 text-shadow-cyan">
          <div className="w-1.5 h-1.5 bg-shadow-cyan animate-pulse shadow-[0_0_8px_rgba(167,239,158,0.5)]" />
          UPLINK
        </div>
      </div>

      <div
        ref={scrollRef}
        className="thought-stream flex-1 rounded-lg p-6 overflow-y-auto"
        style={{ 
          background: 'rgba(0,0,0,0.5)', 
          border: '1px solid rgba(167,239,158,0.1)',
          boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.5)'
        }}
      >
        {thoughts.length === 0 ? (
          <div className="text-white/20 text-center py-12">
            <Terminal size={32} className="mx-auto mb-3 opacity-20" />
            <p className="text-[10px] uppercase font-mono tracking-widest">Awaiting Neural Link...</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {thoughts.map((thought, i) => (
              <motion.div
                key={i}
                className={`flex gap-3 mb-1.5 font-mono ${i === thoughts.length - 1 ? 'terminal-cursor' : ''}`}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
              >
                <span className="text-white/20 text-[9px] shrink-0 pt-0.5">
                  [{thought.time}]
                </span>
                <div className="flex flex-col min-w-0">
                  <span
                    className={`text-[11px] leading-relaxed break-words log-${thought.level}`}
                    style={{ color: LOG_COLORS[thought.level] || LOG_COLORS.info }}
                  >
                    <span className="opacity-50 mr-2">{LOG_PREFIX[thought.level]}</span>
                    {thought.message}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}
