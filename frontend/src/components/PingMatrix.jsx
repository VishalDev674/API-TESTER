import { useRef, useEffect, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { PING_MATRIX, COLORS } from '../lib/constants';

export default function PingMatrix({ stressPings }) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const statesRef = useRef(new Array(PING_MATRIX.TOTAL).fill(0));
  const timestampsRef = useRef(new Array(PING_MATRIX.TOTAL).fill(0));
  const pulseRef = useRef(new Array(PING_MATRIX.TOTAL).fill(0)); // Pulse intensity per node
  const rippleRef = useRef([]);
  const [activeCount, setActiveCount] = useState(0);

  // Process incoming stress pings
  useEffect(() => {
    if (!stressPings) return;
    const { index, success } = stressPings;
    if (index >= 0 && index < PING_MATRIX.TOTAL) {
      statesRef.current[index] = success ? 1 : 2;
      timestampsRef.current[index] = Date.now();
      pulseRef.current[index] = 1.0; // Full pulse intensity
      rippleRef.current.push({ 
        x: 0, y: 0, index, time: Date.now(), 
        color: success ? COLORS.green : COLORS.red 
      });
    }
  }, [stressPings]);

  const getColor = useCallback((state, age, pulseIntensity) => {
    const fadeAlpha = Math.max(0.15, 1 - age / 5000);
    const pulse = 0.6 + Math.sin(Date.now() * 0.005 + pulseIntensity * 10) * 0.4;
    
    switch (state) {
      case 1: { // 200 OK — Neon Green
        const a = fadeAlpha * pulse;
        return `rgba(0, 255, 65, ${a})`;
      }
      case 2: { // 500 Error — Cyber Red
        const a = fadeAlpha * pulse;
        return `rgba(255, 10, 60, ${a})`;
      }
      case 3: { // Healing — Electric Purple
        const a = fadeAlpha * pulse;
        return `rgba(191, 90, 242, ${a})`;
      }
      default: // Idle — dim ghost green
        return 'rgba(0, 255, 65, 0.04)';
    }
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { COLS, ROWS, DOT_SIZE, DOT_GAP } = PING_MATRIX;
    const cellSize = DOT_SIZE + DOT_GAP;
    const now = Date.now();

    // Set canvas size
    const dpr = window.devicePixelRatio || 1;
    const width = COLS * cellSize + DOT_GAP;
    const height = ROWS * cellSize + DOT_GAP;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.clearRect(0, 0, width, height);

    let active = 0;

    // Draw dots
    for (let i = 0; i < PING_MATRIX.TOTAL; i++) {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const x = DOT_GAP + col * cellSize;
      const y = DOT_GAP + row * cellSize;
      const state = statesRef.current[i];
      const age = now - timestampsRef.current[i];

      // Decay pulse
      if (pulseRef.current[i] > 0) {
        pulseRef.current[i] = Math.max(0, pulseRef.current[i] - 0.008);
      }

      // Fade out after 8 seconds
      if (state !== 0 && age > 8000) {
        statesRef.current[i] = 0;
      }

      if (state !== 0) active++;

      const color = getColor(state, age, pulseRef.current[i]);

      // Draw dot as rounded rect
      ctx.beginPath();
      ctx.roundRect(x, y, DOT_SIZE, DOT_SIZE, 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Pulsing glow for active + recently triggered nodes
      if (state !== 0 && age < 3000) {
        const glowIntensity = pulseRef.current[i];
        if (glowIntensity > 0.1) {
          ctx.shadowColor = state === 1 ? '#00ff41' : state === 2 ? '#ff0a3c' : '#bf5af2';
          ctx.shadowBlur = 12 * glowIntensity;
          ctx.beginPath();
          ctx.roundRect(x, y, DOT_SIZE, DOT_SIZE, 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
    }

    setActiveCount(active);

    // Draw ripple effects
    rippleRef.current = rippleRef.current.filter(r => {
      const age = now - r.time;
      if (age > 800) return false;
      const col = r.index % COLS;
      const row = Math.floor(r.index / COLS);
      const cx = DOT_GAP + col * cellSize + DOT_SIZE / 2;
      const cy = DOT_GAP + row * cellSize + DOT_SIZE / 2;
      const radius = (age / 800) * 25;
      const alpha = 1 - age / 800;
      
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = `${r.color}${Math.floor(alpha * 0.25 * 255).toString(16).padStart(2, '0')}`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      return true;
    });

    animFrameRef.current = requestAnimationFrame(draw);
  }, [getColor]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(draw);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [draw]);

  return (
    <motion.div
      className="glass-card p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      <div className="flex items-center justify-between mb-7">
        <div className="section-header">
          <h3 className="text-sm font-bold text-white tracking-[0.3em] uppercase mb-1">
            THE MATRIX
          </h3>
          <p className="text-[10px] font-mono tracking-tight uppercase" style={{ color: 'rgba(255,255,255,0.25)' }}>
            {PING_MATRIX.TOTAL} API Nodes • {activeCount} Active
          </p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-sm" style={{ background: '#00ff41', boxShadow: '0 0 8px rgba(0,255,65,0.5)' }} />
            <span className="text-[9px] font-bold font-mono tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>200 OK</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-sm" style={{ background: '#ff0a3c', boxShadow: '0 0 8px rgba(255,10,60,0.5)' }} />
            <span className="text-[9px] font-bold font-mono tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>500 ERR</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-sm" style={{ background: '#bf5af2', boxShadow: '0 0 8px rgba(191,90,242,0.5)' }} />
            <span className="text-[9px] font-bold font-mono tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>HEAL</span>
          </div>
        </div>
      </div>

      <div className="ping-matrix-container p-6 flex justify-center">
        <canvas ref={canvasRef} />
      </div>
    </motion.div>
  );
}
