import { useRef, useEffect, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { PING_MATRIX, COLORS } from '../lib/constants';

export default function PingMatrix({ stressPings }) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const statesRef = useRef(new Array(PING_MATRIX.TOTAL).fill(0));
  const timestampsRef = useRef(new Array(PING_MATRIX.TOTAL).fill(0));
  const rippleRef = useRef([]);

  // Process incoming stress pings
  useEffect(() => {
    if (!stressPings) return;
    const { index, success } = stressPings;
    if (index >= 0 && index < PING_MATRIX.TOTAL) {
      statesRef.current[index] = success ? 1 : 2;
      timestampsRef.current[index] = Date.now();
      rippleRef.current.push({ x: 0, y: 0, index, time: Date.now(), color: success ? COLORS.green : COLORS.red });
    }
  }, [stressPings]);

  const getColor = useCallback((state, age) => {
    const fadeAlpha = Math.max(0.2, 1 - age / 6000);
    switch (state) {
      case 1: return `rgba(167, 239, 158, ${fadeAlpha})`; // primary green - success
      case 2: return `rgba(255, 77, 77, ${fadeAlpha})`;   // terminal red - failure
      case 3: return `rgba(57, 255, 20, ${fadeAlpha})`;   // vibrant green - healing
      default: return 'rgba(167, 239, 158, 0.05)';        // idle (faint green)
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

    // Draw dots
    for (let i = 0; i < PING_MATRIX.TOTAL; i++) {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const x = DOT_GAP + col * cellSize;
      const y = DOT_GAP + row * cellSize;
      const state = statesRef.current[i];
      const age = now - timestampsRef.current[i];

      // Fade out after 8 seconds
      if (state !== 0 && age > 8000) {
        statesRef.current[i] = 0;
      }

      const color = getColor(state, age);

      // Draw dot with rounded rect
      ctx.beginPath();
      ctx.roundRect(x, y, DOT_SIZE, DOT_SIZE, 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Glow effect for active dots
      if (state !== 0 && age < 2000) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.roundRect(x, y, DOT_SIZE, DOT_SIZE, 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // Draw ripple effects
    rippleRef.current = rippleRef.current.filter(r => {
      const age = now - r.time;
      if (age > 600) return false;
      const col = r.index % COLS;
      const row = Math.floor(r.index / COLS);
      const cx = DOT_GAP + col * cellSize + DOT_SIZE / 2;
      const cy = DOT_GAP + row * cellSize + DOT_SIZE / 2;
      const radius = (age / 600) * 20;
      const alpha = 1 - age / 600;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = r.color.replace('1)', `${alpha * 0.3})`).replace('rgb', 'rgba');
      ctx.lineWidth = 1;
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
      className="glass-card clipped-corner p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-sm font-bold text-white tracking-[0.3em] uppercase mb-1">SYSTEM TELEMETRY</h3>
          <p className="text-[10px] text-white/30 font-mono tracking-tighter uppercase">Ping Matrix: 500 Active Nodes</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(167,239,158,0.4)]" style={{ background: COLORS.green }} />
            <span className="text-[9px] font-bold font-mono text-white/40 uppercase tracking-widest">OK</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(255,77,77,0.4)]" style={{ background: COLORS.red }} />
            <span className="text-[9px] font-bold font-mono text-white/40 uppercase tracking-widest">FAIL</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(57,255,20,0.4)]" style={{ background: COLORS.green }} />
            <span className="text-[9px] font-bold font-mono text-white/40 uppercase tracking-widest">HEAL</span>
          </div>
        </div>
      </div>

      <div className="ping-matrix-container p-6 flex justify-center bg-black/50 border border-white/5 shadow-inner">
        <canvas ref={canvasRef} />
      </div>
    </motion.div>
  );
}
