import { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, StopCircle, Loader } from 'lucide-react';
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

  return (
    <motion.div
      className="glass-card clipped-corner p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
    >
      <div className="flex items-center gap-4 mb-8">
        <div className="p-2.5 rounded-lg bg-shadow-cyan/5 border border-shadow-cyan/10">
          <Zap size={20} className="text-shadow-cyan" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white tracking-widest uppercase mb-1">STRESS SIMULATOR</h3>
          <p className="text-[10px] font-mono text-white/30 tracking-[0.2em] uppercase">CONCURRENT LOAD INJECTION</p>
        </div>
      </div>

      <div className="mb-4">
        <label className="text-xs text-shadow-text-dim font-mono mb-1 block">Concurrent Users</label>
        <input
          type="range"
          min="10"
          max="500"
          step="10"
          value={concurrency}
          onChange={(e) => setConcurrency(parseInt(e.target.value))}
          disabled={running}
          className="w-full accent-shadow-cyan"
          style={{ accentColor: '#A7EF9E' }}
        />
        <div className="flex justify-between text-[10px] font-mono text-shadow-text-dim mt-1">
          <span>10</span>
          <span className="text-white font-bold">{concurrency}</span>
          <span>500</span>
        </div>
      </div>

      {!running ? (
        <button className="btn-storm w-full flex items-center justify-center gap-2" onClick={handleStart}>
          <Zap size={18} />
          LAUNCH {concurrency}-USER STORM
        </button>
      ) : (
        <button className="btn-neon btn-danger w-full flex items-center justify-center gap-2" onClick={handleStop}>
          <StopCircle size={18} />
          ABORT STRESS TEST
        </button>
      )}

      {/* Results */}
      {stressResult && stressResult.status === 'completed' && (
        <motion.div
          className="mt-4 p-3 rounded-lg"
          style={{ background: 'rgba(167,239,158,0.05)', border: '1px solid rgba(167,239,158,0.15)' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div>
              <span className="text-shadow-text-dim">Success</span>
              <p className="text-shadow-green font-bold">{stressResult.success}/{stressResult.total}</p>
            </div>
            <div>
              <span className="text-shadow-text-dim">Duration</span>
              <p className="text-white font-bold">{stressResult.duration_s}s</p>
            </div>
            <div>
              <span className="text-shadow-text-dim">Avg Response</span>
              <p className="text-shadow-cyan font-bold">{stressResult.avg_ms}ms</p>
            </div>
            <div>
              <span className="text-shadow-text-dim">Max Response</span>
              <p className="text-shadow-yellow font-bold">{stressResult.max_ms}ms</p>
            </div>
          </div>
        </motion.div>
      )}

      {running && (
        <div className="mt-3 flex items-center justify-center gap-2 text-xs text-shadow-cyan font-mono">
          <Loader size={14} className="animate-spin" />
          Storm in progress... Watch the Ping Matrix
        </div>
      )}
    </motion.div>
  );
}
