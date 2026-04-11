import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertOctagon, X, Clock, ExternalLink,
  RadioTower, Sparkles
} from 'lucide-react';
import api from '../lib/api';

/**
 * ManualAlertBanner — Prominent alert that appears when the circuit breaker
 * trips and auto-healing has failed. Tells the user to fix the issue manually.
 */
export default function ManualAlertBanner({ alerts, onDismiss }) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none">
      <div className="max-w-5xl mx-auto px-4 pt-4 space-y-3 pointer-events-auto">
        <AnimatePresence>
          {alerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} onDismiss={onDismiss} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function AlertCard({ alert, onDismiss }) {
  const [countdown, setCountdown] = useState(alert.cooldown_remaining_seconds || 0);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleReset = async () => {
    try {
      setIsResetting(true);
      await api.resetCircuit(alert.endpoint_id);
      // Dismiss the alert after successful reset
      onDismiss(alert.id);
      // Refresh endpoints to see the status change
      window.dispatchEvent(new CustomEvent('refresh-endpoints'));
    } catch (err) {
      console.error('Failed to reset circuit:', err);
    } finally {
      setIsResetting(false);
    }
  };

  const handleManualCheck = () => {
    if (alert.endpoint_url) {
      window.open(alert.endpoint_url, '_blank');
    }
  };

  const mins = Math.floor(countdown / 60);
  const secs = countdown % 60;

  return (
    <motion.div
      initial={{ opacity: 0, y: -60, scale: 0.9, rotateX: -20 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: 1, 
        rotateX: 0,
        x: [0, -2, 2, -1, 1, 0] // Subtle glitch shake
      }}
      exit={{ opacity: 0, y: -40, scale: 0.95 }}
      transition={{ 
        type: 'spring', 
        damping: 15, 
        stiffness: 400,
        x: { duration: 0.3, repeat: 0 } 
      }}
      className="relative rounded-xl overflow-hidden group"
      style={{
        background: 'linear-gradient(135deg, rgba(30, 0, 8, 0.98), rgba(60, 0, 15, 0.98))',
        border: '1px solid rgba(255, 10, 60, 0.6)',
        boxShadow: '0 0 60px rgba(255, 10, 60, 0.2), 0 12px 48px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1)',
        backdropFilter: 'blur(24px)',
      }}
    >
      {/* Decorative Glitch Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay" />
      
      {/* Scanning Line */}
      <motion.div 
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: 'linear-gradient(to bottom, transparent, rgba(255,10,60,0.1), transparent)',
          height: '20px'
        }}
        animate={{ top: ['-20%', '120%'] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      />
      {/* Top red pulse bar */}
      <div className="absolute top-0 left-0 right-0 h-[2px]">
        <motion.div
          className="h-full"
          style={{ background: 'linear-gradient(90deg, transparent, #ff0a3c, #ff6b2b, #ff0a3c, transparent)' }}
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      <div className="p-5">
        {/* Header Row */}
        <div className="flex items-start gap-4">
          {/* Alert Icon */}
          <div className="shrink-0">
            <motion.div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{
                background: 'rgba(255, 10, 60, 0.12)',
                border: '1px solid rgba(255, 10, 60, 0.25)',
              }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <AlertOctagon size={24} style={{ color: '#ff0a3c', filter: 'drop-shadow(0 0 8px rgba(255,10,60,0.6))' }} />
            </motion.div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-black text-red-400 tracking-[0.3em] uppercase">
                ⚠ MANUAL INTERVENTION REQUIRED
              </span>
              <motion.div
                className="w-2 h-2 rounded-full"
                style={{ background: '#ff0a3c' }}
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            </div>

            <p className="text-[13px] text-white/80 font-mono mb-4">
              Auto-healing failed for <span className="text-white font-bold">{alert.endpoint_name}</span> after{' '}
              <span className="text-red-400 font-bold">{alert.attempts_exhausted}</span> attempts.
              {alert.status_code && (
                <span className="text-red-400"> HTTP {alert.status_code}</span>
              )}
              {alert.error_message && (
                <span className="text-white/40"> — {alert.error_message}</span>
              )}
            </p>

            {/* Action row — The Three Functional Options */}
            <div className="flex items-center gap-4 flex-wrap">
              {/* Option 1: Retry / Reset Circuit */}
              <motion.button
                onClick={handleReset}
                disabled={isResetting}
                className={`flex items-center gap-2 text-[10px] font-mono px-3 py-1.5 rounded-md transition-all ${
                  isResetting ? 'opacity-50 cursor-wait' : 'hover:scale-[1.05] hover:brightness-125'
                }`}
                style={{
                  background: 'rgba(255, 214, 10, 0.08)',
                  border: '1px solid rgba(255, 214, 10, 0.25)',
                  color: '#ffd60a',
                  boxShadow: '0 0 10px rgba(255, 214, 10, 0.1)',
                }}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                <Clock size={12} className={isResetting ? 'animate-spin' : ''} />
                {isResetting ? 'RESETTING...' : (countdown > 0 ? `RETRY NOW (${mins}m ${secs.toString().padStart(2, '0')}s)` : 'RETRY NOW')}
              </motion.button>

              {/* Option 2: Diagnosis / Failure Type (Acts as a re-trigger) */}
              <motion.button
                onClick={handleReset} 
                className="flex items-center gap-2 text-[10px] font-mono font-bold px-3 py-1.5 rounded-md uppercase hover:scale-[1.05] transition-all"
                style={{
                  background: 'rgba(255, 10, 60, 0.12)',
                  border: '1px solid rgba(255, 10, 60, 0.25)',
                  color: '#ff0a3c',
                  boxShadow: '0 0 10px rgba(255, 10, 60, 0.1)',
                }}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                <RadioTower size={12} />
                {alert.failure_type || 'ANOMALY DETECTED'}
              </motion.button>

              {/* Option 3: Manual Check (Opens URL) */}
              <motion.button
                onClick={handleManualCheck}
                className="flex items-center gap-2 text-[10px] font-mono px-3 py-1.5 rounded-md hover:scale-[1.05] transition-all"
                style={{
                  background: 'rgba(0, 212, 255, 0.08)',
                  border: '1px solid rgba(0, 212, 255, 0.25)',
                  color: '#00d4ff',
                  boxShadow: '0 0 10px rgba(0, 212, 255, 0.1)',
                }}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                <ExternalLink size={12} />
                CHECK ENDPOINT MANUALLY
              </motion.button>
            </div>
          </div>

          {/* Dismiss button */}
          <button
            onClick={() => onDismiss(alert.id)}
            className="shrink-0 p-2 rounded-lg hover:bg-white/5 transition-colors"
            title="Dismiss alert"
          >
            <X size={18} style={{ color: 'rgba(255,255,255,0.3)' }} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
