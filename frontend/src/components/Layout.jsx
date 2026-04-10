import { motion } from 'framer-motion';
import { Activity, Wifi, WifiOff, Shield, Hexagon } from 'lucide-react';
import FaultyTerminal from './FaultyTerminal';
import TelemetryBar from './TelemetryBar';

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

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5" style={{
        background: 'rgba(5, 5, 8, 0.85)',
        backdropFilter: 'blur(30px) saturate(1.3)',
      }}>
        <div className="max-w-[1600px] mx-auto px-8 py-5 flex items-center justify-between">
          <motion.div
            className="flex items-center gap-5"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Logo Icon */}
            <div className="relative">
              <div className="p-3 rounded-xl border border-white/5" style={{
                background: 'rgba(0, 255, 65, 0.04)',
              }}>
                <Activity size={24} className="text-neon-green" style={{ color: '#00ff41' }} />
              </div>
              <div 
                className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full animate-pulse"
                style={{ 
                  background: '#00ff41', 
                  boxShadow: '0 0 12px rgba(0, 255, 65, 0.7)' 
                }} 
              />
            </div>

            {/* Title */}
            <div>
              <h1 className="text-2xl font-bold tracking-tighter text-white uppercase" style={{ fontFamily: "'Outfit', sans-serif" }}>
                SHADOW<span style={{ color: '#00ff41' }} className="text-glow-green">API</span>
              </h1>
              <p className="text-[10px] font-mono tracking-[0.4em] uppercase font-bold" style={{ color: 'rgba(0, 255, 65, 0.5)' }}>
                Autonomous Testing Engine v3.0
              </p>
            </div>
          </motion.div>

          <motion.div
            className="flex items-center gap-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          >
            {/* WebSocket Status */}
            <div className={`flex items-center gap-3 px-5 py-2 rounded-full border ${
              wsConnected 
                ? 'border-green-500/20' 
                : 'border-red-500/20'
            }`} style={{
              background: wsConnected ? 'rgba(0, 255, 65, 0.06)' : 'rgba(255, 10, 60, 0.06)',
            }}>
              <div 
                className={`w-2 h-2 rounded-full ${wsConnected ? 'animate-pulse' : ''}`}
                style={{ 
                  background: wsConnected ? '#00ff41' : '#ff0a3c',
                  boxShadow: wsConnected 
                    ? '0 0 10px rgba(0, 255, 65, 0.5)' 
                    : '0 0 10px rgba(255, 10, 60, 0.5)' 
                }} 
              />
              <span className="text-[11px] font-bold font-mono tracking-widest" style={{ color: wsConnected ? '#00ff41' : '#ff0a3c' }}>
                {wsConnected ? 'UPLINK: ACTIVE' : 'UPLINK: SEVERED'}
              </span>
            </div>

            {/* Shield Status */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/5" style={{
              background: 'rgba(191, 90, 242, 0.04)',
            }}>
              <Shield size={14} style={{ color: '#bf5af2' }} />
              <span className="text-[10px] font-mono font-bold tracking-widest" style={{ color: '#bf5af2' }}>
                AI: ARMED
              </span>
            </div>

            {/* Date */}
            <div className="text-right hidden sm:block">
              <p className="text-[11px] uppercase font-mono text-white/30 tracking-[0.2em]">
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </motion.div>
        </div>
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
