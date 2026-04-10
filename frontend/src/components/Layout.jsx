import { motion } from 'framer-motion';
import { Activity, Wifi, WifiOff } from 'lucide-react';
import FaultyTerminal from './FaultyTerminal';
import StatusBar from './StatusBar';

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
        opacity: 0.7,
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
          tint="#A7EF9E"
          mouseReact
          mouseStrength={0.5}
          pageLoadAnimation
          brightness={0.4}
          style={{ pointerEvents: 'auto' }}
        />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 backdrop-blur-2xl bg-black/40">
        <div className="max-w-[1600px] mx-auto px-10 py-6 flex items-center justify-between">
          <motion.div
            className="flex items-center gap-5"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="relative p-3 rounded-lg bg-shadow-cyan/5 border border-shadow-cyan/10">
              <Activity size={24} className="text-shadow-cyan" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-shadow-green rounded-full animate-pulse shadow-[0_0_10px_rgba(57,255,20,0.6)]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tighter text-white uppercase">
                SHADOW<span className="text-shadow-cyan">API</span>
              </h1>
              <p className="text-[10px] font-mono text-shadow-green/60 tracking-[0.4em] uppercase font-bold">
                Autonomous Testing Engine v2.0
              </p>
            </div>
          </motion.div>

          <motion.div
            className="flex items-center gap-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          >
            <div className={`flex items-center gap-3 px-5 py-2 rounded-full border ${
              wsConnected ? 'border-shadow-green/30 bg-shadow-green/10' : 'border-shadow-red/30 bg-shadow-red/10'
            }`}>
              <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-shadow-green animate-pulse shadow-[0_0_8px_rgba(57,255,20,0.4)]' : 'bg-shadow-red'}`} />
              <span className="text-[11px] font-bold font-mono tracking-widest" style={{ color: wsConnected ? '#39ff14' : '#ff4d4d' }}>
                {wsConnected ? 'NETWORK: ACTIVE' : 'NETWORK: DISCONNECTED'}
              </span>
            </div>

            <div className="text-right hidden sm:block">
              <p className="text-[11px] uppercase font-mono text-white/40 tracking-[0.2em]">
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-10 pt-12 pb-24 relative z-10">
        {children}
      </main>

      <StatusBar stats={stats} wsConnected={wsConnected} systemMetrics={systemMetrics} />
    </div>
  );
}
