import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Shield, Cpu, Radio, Clock, Zap, Hexagon, Radar, Satellite } from 'lucide-react';
import FaultyTerminal from './FaultyTerminal';
import TelemetryBar from './TelemetryBar';

// ── Live Digital Clock ──────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hours = time.getHours().toString().padStart(2, '0');
  const mins = time.getMinutes().toString().padStart(2, '0');
  const secs = time.getSeconds().toString().padStart(2, '0');
  const date = time.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="text-right flex flex-col items-end gap-0.5">
      <div className="flex items-center gap-1">
        <span className="text-[15px] font-mono font-black tracking-tight" style={{ color: '#00ff41' }}>
          {hours}
        </span>
        <motion.span
          className="text-[15px] font-mono font-black"
          animate={{ opacity: [1, 0.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          style={{ color: '#00ff41' }}
        >:</motion.span>
        <span className="text-[15px] font-mono font-black tracking-tight" style={{ color: '#00ff41' }}>
          {mins}
        </span>
        <motion.span
          className="text-[15px] font-mono font-black"
          animate={{ opacity: [1, 0.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          style={{ color: '#00ff41' }}
        >:</motion.span>
        <span className="text-[15px] font-mono font-black tracking-tight text-white/40">
          {secs}
        </span>
      </div>
      <span className="text-[8px] font-mono text-white/20 uppercase tracking-[0.3em]">{date}</span>
    </div>
  );
}

// ── Simple Logo Mark ──────────────────────────────────
function LogoMark() {
  return (
    <div className="relative">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
        background: 'rgba(0, 255, 65, 0.06)',
        border: '1px solid rgba(0, 255, 65, 0.15)',
      }}>
        <Activity size={20} style={{ color: '#00ff41' }} />
      </div>
      <div
        className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-pulse"
        style={{ background: '#00ff41', boxShadow: '0 0 8px rgba(0,255,65,0.6)' }}
      />
    </div>
  );
}

export default function Layout({ children, wsConnected, stats, systemMetrics }) {
  return (
    <div className="scanline-overlay min-h-screen relative overflow-hidden">
      {/* CRT Vignette Overlay */}
      <div className="vignette" />

      {/* WebGL Background — fixed fullscreen behind everything */}
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 0.5,
      }}>
        <FaultyTerminal
          scale={1.5}
          gridMul={[2, 1]}
          digitSize={1.2}
          timeScale={0.4}
          pause={false}
          scanlineIntensity={0.3}
          glitchAmount={1}
          flickerAmount={1}
          noiseAmp={1}
          chromaticAberration={0}
          dither={0}
          curvature={0.1}
          tint="#00ff41"
          mouseReact
          mouseStrength={0.5}
          pageLoadAnimation
          brightness={0.3}
          style={{ pointerEvents: 'auto' }}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════
           HEADER — Premium Cyberpunk Command Bar
           ═══════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50" style={{
        background: 'linear-gradient(180deg, rgba(5, 5, 10, 0.92) 0%, rgba(8, 8, 14, 0.88) 100%)',
        backdropFilter: 'blur(40px) saturate(1.5)',
        WebkitBackdropFilter: 'blur(40px) saturate(1.5)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
      }}>
        {/* Top accent line — animated gradient sweep */}
        <div className="absolute top-0 left-0 right-0 h-[1px] overflow-hidden">
          <motion.div
            className="h-full w-1/3"
            style={{ background: 'linear-gradient(90deg, transparent, #00ff41, #00d4ff, #bf5af2, transparent)' }}
            animate={{ x: ['-33%', '133%'] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
          />
        </div>

        <div className="max-w-[1600px] mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-[70px]">

            {/* ── Left: Logo + Brand ── */}
            <motion.div
              className="flex items-center gap-4"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <LogoMark />

              <div className="flex flex-col">
                {/* Title */}
                <div className="flex items-baseline gap-1.5">
                  <h1
                    className="text-[22px] font-black tracking-[-0.02em] uppercase text-white"
                    style={{ fontFamily: "'Sora', 'Outfit', sans-serif" }}
                  >
                    Shadow
                  </h1>
                  <span
                    className="text-[22px] font-black tracking-[-0.02em] uppercase text-white"
                    style={{ fontFamily: "'Sora', 'Outfit', sans-serif" }}
                  >
                    API
                  </span>
                  <span
                    className="text-[22px] font-black tracking-[-0.02em] uppercase text-white"
                    style={{ fontFamily: "'Sora', 'Outfit', sans-serif" }}
                  >
                    Tester
                  </span>
                </div>

                {/* Subtitle with version tag */}
                <div className="flex items-center gap-2 -mt-0.5">
                  <span className="text-[8px] font-mono font-bold tracking-[0.35em] uppercase" style={{ color: 'rgba(0, 255, 65, 0.4)' }}>
                    Autonomous Testing Engine
                  </span>
                  <span className="px-1.5 py-[1px] rounded text-[7px] font-mono font-black" style={{
                    background: 'rgba(0, 255, 65, 0.08)',
                    border: '1px solid rgba(0, 255, 65, 0.15)',
                    color: '#00ff41',
                  }}>
                    v3.0
                  </span>
                </div>
              </div>
            </motion.div>

            {/* ── Center: Command Indicators ── */}
            <motion.div
              className="hidden lg:flex items-center gap-3"
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Uplink Status */}
              <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border transition-all duration-300 cursor-default hover:scale-[1.03] ${
                wsConnected
                  ? 'border-green-500/15 hover:border-green-500/25'
                  : 'border-red-500/15 hover:border-red-500/25'
              }`} style={{
                background: wsConnected ? 'rgba(0, 255, 65, 0.04)' : 'rgba(255, 10, 60, 0.04)',
              }}>
                <div className={`w-1.5 h-1.5 rounded-full ${wsConnected ? 'animate-pulse' : ''}`}
                  style={{ background: wsConnected ? '#00ff41' : '#ff0a3c', boxShadow: wsConnected ? '0 0 6px rgba(0,255,65,0.5)' : '0 0 6px rgba(255,10,60,0.5)' }}
                />
                <Satellite size={12} style={{ color: wsConnected ? '#00ff41' : '#ff0a3c', opacity: 0.7 }} />
                <span className="text-[10px] font-mono font-bold tracking-widest uppercase" style={{
                  color: wsConnected ? '#00ff41' : '#ff0a3c',
                }}>
                  {wsConnected ? 'UPLINK' : 'OFFLINE'}
                </span>
              </div>

              {/* AI Core Status */}
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-purple-500/15 hover:border-purple-500/25 transition-all duration-300 cursor-default hover:scale-[1.03]" style={{
                background: 'rgba(191, 90, 242, 0.04)',
              }}>
                <div className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: '#bf5af2', boxShadow: '0 0 6px rgba(191,90,242,0.5)' }}
                />
                <Cpu size={12} style={{ color: '#bf5af2', opacity: 0.7 }} />
                <span className="text-[10px] font-mono font-bold tracking-widest uppercase" style={{ color: '#bf5af2' }}>
                  AI CORE
                </span>
              </div>

              {/* Defense Status */}
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/15 hover:border-cyan-500/25 transition-all duration-300 cursor-default hover:scale-[1.03]" style={{
                background: 'rgba(0, 212, 255, 0.04)',
              }}>
                <div className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: '#00d4ff', boxShadow: '0 0 6px rgba(0,212,255,0.5)' }}
                />
                <Shield size={12} style={{ color: '#00d4ff', opacity: 0.7 }} />
                <span className="text-[10px] font-mono font-bold tracking-widest uppercase" style={{ color: '#00d4ff' }}>
                  SHIELDED
                </span>
              </div>
            </motion.div>

            {/* ── Right: Clock + Separator + Mini-Equalizer ── */}
            <motion.div
              className="flex items-center gap-5"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Mini audio-style equalizer bars */}
              <div className="hidden sm:flex items-end gap-[2px] h-5">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-[2.5px] rounded-sm"
                    style={{ background: `linear-gradient(to top, rgba(0,255,65,0.3), rgba(0,212,255,0.5))` }}
                    animate={{ height: [3 + i * 2, 14 + Math.sin(i) * 4, 5 + i, 18 - i * 2, 3 + i * 2] }}
                    transition={{ duration: 1.5 + i * 0.1, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
                  />
                ))}
              </div>

              {/* Separator */}
              <div className="hidden sm:block w-[1px] h-8 bg-white/5" />

              {/* Live Clock */}
              <LiveClock />
            </motion.div>
          </div>
        </div>

        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px]" style={{
          background: 'linear-gradient(90deg, transparent 5%, rgba(0,255,65,0.08) 20%, rgba(0,212,255,0.06) 50%, rgba(191,90,242,0.08) 80%, transparent 95%)',
        }} />
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-8 pt-10 pb-28 relative z-10">
        {children}
      </main>

      {/* Sticky Telemetry Bar */}
      <TelemetryBar stats={stats} wsConnected={wsConnected} systemMetrics={systemMetrics} />
    </div>
  );
}
