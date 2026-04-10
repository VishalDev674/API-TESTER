import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Brain, ChevronDown, ChevronUp, Maximize2, Minimize2 } from 'lucide-react';

const LOG_COLORS = {
  info: '#00d4ff',    // Cyan for info
  warning: '#ffd60a', // Yellow for warnings
  error: '#ff0a3c',   // Cyber Red for errors
  heal: '#bf5af2',    // Electric Purple for AI heals
  analysis: '#00ff41', // Neon Green for RCA
};

const LOG_PREFIX = {
  info: '  INFO ',
  warning: '  WARN ',
  error: ' ERROR ',
  heal: '  HEAL ',
  analysis: '   RCA ',
};

const LOG_ICONS = {
  info: '▸',
  warning: '⚠',
  error: '✖',
  heal: '◈',
  analysis: '◉',
};

export default function AIThoughtStream({ thoughts, expanded, onToggleExpand }) {
  const scrollRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  const [lastFix, setLastFix] = useState(null);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    onToggleExpand?.(!isExpanded);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thoughts]);

  // Auto-expand when error or heal detected
  useEffect(() => {
    const lastThought = thoughts[thoughts.length - 1];
    
    if (lastThought?.level === 'error') {
      setHasError(true);
      setIsExpanded(true);
      onToggleExpand?.(true);
      setTimeout(() => setHasError(false), 3000);
    }
    
    if (lastThought?.level === 'heal' || lastThought?.level === 'analysis') {
      setIsRepairing(true);
      setIsExpanded(true);
      onToggleExpand?.(true);
      setLastFix(lastThought.message);
      
      // Auto-hide repair banner after some time
      const timer = setTimeout(() => setIsRepairing(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [thoughts, onToggleExpand]);

  const maxHeight = isExpanded ? '800px' : '480px';

  return (
    <motion.div
      className={`glass-card p-8 flex flex-col ${hasError ? 'glitch-effect' : ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      layout
      style={{ 
        maxHeight,
        borderColor: hasError ? 'rgba(255, 10, 60, 0.3)' : undefined,
        boxShadow: hasError ? '0 0 40px rgba(255, 10, 60, 0.15)' : undefined,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-lg border border-white/5" style={{
            background: 'rgba(191, 90, 242, 0.06)',
          }}>
            <Brain size={20} style={{ color: '#bf5af2' }} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-[0.3em] uppercase mb-0.5">
              AI TERMINAL
            </h3>
            <p className="text-[9px] font-mono tracking-[0.2em] uppercase" style={{ color: 'rgba(191,90,242,0.5)' }}>
              RCA ENGINE • NEURAL STREAM
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="badge-tactical" style={{ 
            borderColor: 'rgba(191,90,242,0.3)', 
            color: '#bf5af2',
            background: 'rgba(191,90,242,0.05)',
          }}>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ 
              background: '#bf5af2', 
              boxShadow: '0 0 6px rgba(191,90,242,0.6)' 
            }} />
            COGNITIVE
          </div>
          <button 
            onClick={toggleExpand}
            className="p-1.5 rounded border border-white/5 hover:border-white/10 transition-colors"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      <div
        ref={scrollRef}
        className="thought-stream flex-1 rounded-lg p-5 overflow-y-auto relative"
        style={{ 
          background: 'rgba(0, 0, 0, 0.6)',
          border: '1px solid rgba(191, 90, 242, 0.08)',
          boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.6)',
        }}
      >
        {/* Terminal scanline effect */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(191,90,242,0.1) 2px, rgba(191,90,242,0.1) 4px)',
          }}
        />

        {/* Terminal Header */}
        <div className="mb-4 pb-3 border-b border-white/5">
          <span className="text-[9px] font-mono" style={{ color: 'rgba(191,90,242,0.4)' }}>
            ╔══ SHADOW API // NEURAL RCA ENGINE v3.0 ══╗
          </span>
        </div>

        {/* Active Repair Banner */}
        <AnimatePresence>
          {isRepairing && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div 
                className="p-3 rounded border border-purple-500/30 bg-purple-500/10 flex flex-col gap-2"
                style={{ boxShadow: '0 0 20px rgba(191, 90, 242, 0.15)' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-purple-400 font-bold text-[10px] tracking-widest uppercase">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-ping" />
                    Autonomous Repair Sequence Active
                  </div>
                  <span className="text-[9px] font-mono text-purple-400/50">PROTOCOL.0X7F</span>
                </div>
                {lastFix && (
                  <div className="text-[11px] text-white/90 font-mono leading-tight bg-black/40 p-2 border-l-2 border-purple-500">
                    <span className="text-purple-400 block mb-1 font-bold">FIX RECOMMENDATION:</span>
                    {lastFix}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {thoughts.length === 0 ? (
          <div className="text-center py-10">
            <Terminal size={28} className="mx-auto mb-3" style={{ color: 'rgba(191,90,242,0.15)' }} />
            <p className="text-[10px] uppercase font-mono tracking-[0.3em]" style={{ color: 'rgba(191,90,242,0.25)' }}>
              Awaiting Neural Link...
            </p>
            <p className="text-[8px] font-mono mt-1" style={{ color: 'rgba(255,255,255,0.1)' }}>
              AI analysis will appear here when tests run
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {thoughts.map((thought, i) => (
              <motion.div
                key={i}
                className={`flex gap-3 mb-1.5 font-mono relative ${
                  i === thoughts.length - 1 ? 'terminal-cursor' : ''
                }`}
                initial={{ opacity: 0, x: -8, filter: 'blur(2px)' }}
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.25 }}
              >
                {/* Timestamp */}
                <span className="text-[9px] shrink-0 pt-0.5" style={{ color: 'rgba(255,255,255,0.15)' }}>
                  [{thought.time}]
                </span>
                
                {/* Icon */}
                <span className="text-[10px] shrink-0 pt-0.5" style={{ color: LOG_COLORS[thought.level] || LOG_COLORS.info }}>
                  {LOG_ICONS[thought.level] || '▸'}
                </span>

                {/* Message */}
                <div className="flex flex-col min-w-0">
                  <span
                    className={`text-[11px] leading-relaxed break-words log-${thought.level}`}
                    style={{ color: LOG_COLORS[thought.level] || LOG_COLORS.info }}
                  >
                    <span className="opacity-40 mr-2 font-bold">{LOG_PREFIX[thought.level]}</span>
                    {thought.message}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Footer Stats */}
      <div className="flex items-center justify-between mt-4 text-[8px] font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>
        <span>{thoughts.length} entries in buffer</span>
        <span>
          {thoughts.filter(t => t.level === 'error').length} errors • {' '}
          {thoughts.filter(t => t.level === 'heal').length} heals
        </span>
      </div>
    </motion.div>
  );
}
