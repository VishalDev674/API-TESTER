import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, StopCircle, Loader, BarChart3, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import api from '../lib/api';

export default function StressControl({ stressResult }) {
  const [running, setRunning] = useState(false);
  const [concurrency, setConcurrency] = useState(500);

  const handleStart = async () => {
    setRunning(true);
    try {
      await api.startStressTest({ concurrency });
    } catch (e) {
      console.error('Failed to start stress test:', e);
      setRunning(false);
    }
  };

  const handleStop = async () => {
    try {
      await api.stopStressTest();
    } catch (e) {
      console.error('Failed to stop:', e);
    }
    setRunning(false);
  };

  // Auto-detect completion from WS result
  if (stressResult?.status === 'completed' && running) {
    setTimeout(() => setRunning(false), 500);
  }

  const successRate = stressResult?.total > 0 
    ? ((stressResult.success / stressResult.total) * 100).toFixed(1)
    : null;

  return (
    <motion.div
      className="glass-card p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
    >
      <div className="flex items-center gap-4 mb-7">
        <div className="p-2.5 rounded-lg border border-white/5" style={{
          background: 'rgba(255, 107, 43, 0.05)',
        }}>
          <Zap size={20} style={{ color: '#ff6b2b' }} />
        </div>
        <div className="section-header">
          <h3 className="text-sm font-bold text-white tracking-[0.3em] uppercase mb-0.5">
            STRESS SIMULATOR
          </h3>
          <p className="text-[9px] font-mono tracking-[0.2em] uppercase" style={{ color: 'rgba(255,107,43,0.5)' }}>
            CONCURRENT LOAD INJECTION
          </p>
        </div>
      </div>

      {/* Concurrency Slider */}
      <div className="mb-6">
        <label className="text-[10px] font-mono mb-2 block tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Concurrent Users
        </label>
        <div className="relative">
          <input
            type="range"
            min="10"
            max="500"
            step="10"
            value={concurrency}
            onChange={(e) => setConcurrency(parseInt(e.target.value))}
            disabled={running}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{ 
              accentColor: '#ff6b2b',
              background: `linear-gradient(to right, #ff6b2b ${(concurrency/500)*100}%, rgba(255,255,255,0.06) ${(concurrency/500)*100}%)`,
            }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono mt-2" style={{ color: 'rgba(255,255,255,0.2)' }}>
          <span>10</span>
          <span className="text-white font-bold text-sm" style={{ 
            color: '#ff6b2b',
            textShadow: '0 0 8px rgba(255,107,43,0.4)',
          }}>
            {concurrency}
          </span>
          <span>500</span>
        </div>
      </div>

      {/* Action Button */}
      {!running ? (
        <button 
          className="btn-storm w-full flex items-center justify-center gap-3" 
          onClick={handleStart}
          style={{
            borderImage: 'linear-gradient(135deg, #ff6b2b, #ff0a3c) 1',
            background: 'linear-gradient(135deg, rgba(255,107,43,0.1), rgba(255,10,60,0.1))',
          }}
        >
          <Zap size={18} />
          LAUNCH {concurrency}-USER STORM
        </button>
      ) : (
        <button 
          className="btn-neon btn-danger w-full flex items-center justify-center gap-2" 
          onClick={handleStop}
        >
          <StopCircle size={18} />
          ABORT STRESS TEST
        </button>
      )}

      {/* Results Panel */}
      <AnimatePresence>
        {stressResult && stressResult.status === 'completed' && (
          <motion.div
            className="mt-5 p-5 rounded-xl"
            style={{ 
              background: 'rgba(0, 0, 0, 0.4)', 
              border: '1px solid rgba(0, 255, 65, 0.1)' 
            }}
            initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10 }}
          >
            {/* Success Rate Bar */}
            {successRate && (
              <div className="mb-4">
                <div className="flex justify-between text-[9px] font-mono mb-1.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  <span>SUCCESS RATE</span>
                  <span style={{ color: parseFloat(successRate) >= 95 ? '#00ff41' : '#ff0a3c' }}>
                    {successRate}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <motion.div 
                    className="h-full rounded-full"
                    style={{ 
                      background: parseFloat(successRate) >= 95 
                        ? 'linear-gradient(90deg, rgba(0,255,65,0.5), #00ff41)' 
                        : 'linear-gradient(90deg, rgba(255,10,60,0.5), #ff0a3c)',
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${successRate}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="flex items-center gap-2 mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  <BarChart3 size={10} />
                  <span className="text-[9px] tracking-widest">SUCCESS</span>
                </div>
                <p className="font-bold" style={{ color: '#00ff41' }}>
                  {stressResult.success}/{stressResult.total}
                </p>
              </div>
              <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="flex items-center gap-2 mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  <Clock size={10} />
                  <span className="text-[9px] tracking-widest">DURATION</span>
                </div>
                <p className="font-bold text-white">{stressResult.duration_s}s</p>
              </div>
              <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="flex items-center gap-2 mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  <TrendingUp size={10} />
                  <span className="text-[9px] tracking-widest">AVG RESP</span>
                </div>
                <p className="font-bold" style={{ color: '#00d4ff' }}>{stressResult.avg_ms}ms</p>
              </div>
              <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="flex items-center gap-2 mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  <AlertCircle size={10} />
                  <span className="text-[9px] tracking-widest">MAX RESP</span>
                </div>
                <p className="font-bold" style={{ color: '#ffd60a' }}>{stressResult.max_ms}ms</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Running Indicator */}
      <AnimatePresence>
        {running && (
          <motion.div 
            className="mt-4 flex items-center justify-center gap-2.5 text-xs font-mono py-3 rounded-lg"
            style={{ 
              background: 'rgba(255,107,43,0.04)', 
              border: '1px solid rgba(255,107,43,0.1)',
              color: '#ff6b2b',
            }}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Loader size={14} className="animate-spin" />
            Storm in progress... Watch the Matrix
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
