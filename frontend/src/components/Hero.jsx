import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { Shield, Zap, Target, Cpu, ArrowRight, Activity, Layers, Network } from 'lucide-react';

// ── Floating Hex Particle Background ──────────────────────────────
function HeroParticles() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let particles = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    // Create floating particles
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.3 + 0.05,
        color: ['#00ff41', '#00d4ff', '#bf5af2'][Math.floor(Math.random() * 3)],
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
      });

      // Draw connections between nearby particles
      ctx.globalAlpha = 0.04;
      ctx.strokeStyle = '#00ff41';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.6 }}
    />
  );
}

// ── Animated Counter ──────────────────────────────────
function AnimatedNumber({ target, suffix = '', duration = 2000 }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setValue(target);
        clearInterval(timer);
      } else {
        setValue(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return <>{value.toLocaleString()}{suffix}</>;
}

// ── Typing Effect ──────────────────────────────────
function TypeWriter({ text, delay = 0 }) {
  const [displayed, setDisplayed] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    let timeout;
    timeout = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        setDisplayed(text.slice(0, i + 1));
        i++;
        if (i >= text.length) {
          clearInterval(interval);
          // Keep cursor blinking after done
        }
      }, 35);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [text, delay]);

  useEffect(() => {
    const blink = setInterval(() => setShowCursor(v => !v), 530);
    return () => clearInterval(blink);
  }, []);

  return (
    <span className="font-mono">
      {displayed}
      <span className={`text-neon-green ${showCursor ? 'opacity-100' : 'opacity-0'}`}>▊</span>
    </span>
  );
}

// ── Main Hero Component ──────────────────────────────────
export default function Hero() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0, filter: 'blur(8px)' },
    visible: { 
      y: 0, opacity: 1, filter: 'blur(0px)',
      transition: { type: 'spring', damping: 20, stiffness: 100 },
    },
  };

  const stats = [
    { label: 'Endpoints Monitored', value: 500, suffix: '+', icon: Network },
    { label: 'Avg Heal Time', value: 1.2, suffix: 's', icon: Zap },
    { label: 'RCA Accuracy', value: 99, suffix: '%', icon: Target },
  ];

  return (
    <motion.section
      className="relative mb-10 rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, rgba(5, 5, 10, 0.45) 0%, rgba(10, 15, 12, 0.35) 40%, rgba(8, 8, 18, 0.45) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 0 80px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255,255,255,0.06), inset 0 0 60px rgba(255,255,255,0.01)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
      }}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Background layers */}
      <HeroParticles />
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] grid-lines" />

      {/* Gradient orbs */}
      <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0, 255, 65, 0.08), transparent 70%)' }}
      />
      <div className="absolute -bottom-60 -right-40 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(191, 90, 242, 0.06), transparent 70%)' }}
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0, 212, 255, 0.03), transparent 60%)' }}
      />

      {/* Top decorative line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] overflow-hidden">
        <motion.div
          className="h-full w-1/3"
          style={{ background: 'linear-gradient(90deg, transparent, #00ff41, #00d4ff, transparent)' }}
          animate={{ x: ['-33%', '133%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 px-8 lg:px-14 py-12 lg:py-16">
        <div className="flex flex-col lg:flex-row items-start gap-14">

          {/* ── Left Column: Branding ── */}
          <div className="flex-1 min-w-0">
            {/* Protocol badge */}
            <motion.div variants={itemVariants} className="mb-8">
              <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full"
                style={{
                  background: 'rgba(0, 255, 65, 0.04)',
                  border: '1px solid rgba(0, 255, 65, 0.12)',
                }}
              >
                <motion.span
                  className="w-2 h-2 rounded-full bg-neon-green"
                  animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-[10px] font-mono font-bold text-neon-green/80 uppercase tracking-[0.25em]">
                  Autonomous Testing Protocol v3.0
                </span>
              </div>
            </motion.div>

            {/* Main title */}
            <motion.h1 variants={itemVariants} className="mb-8">
              <span className="block text-5xl lg:text-7xl font-black text-white uppercase tracking-tight leading-[0.9]"
                style={{ fontFamily: "'Sora', sans-serif" }}
              >
                SHADOW
              </span>
              <span className="block text-5xl lg:text-7xl font-black uppercase tracking-tight leading-[0.9] mt-2"
                style={{
                  fontFamily: "'Sora', sans-serif",
                  background: 'linear-gradient(135deg, #00ff41 0%, #00d4ff 50%, #bf5af2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 0 30px rgba(0, 255, 65, 0.3))',
                }}
              >
                API TESTER
              </span>
            </motion.h1>

            {/* Description */}
            <motion.div variants={itemVariants} className="mb-10 max-w-xl">
              <p className="text-[17px] text-white/60 leading-[1.8] tracking-wide"
                style={{ fontFamily: "'Sora', sans-serif" }}
              >
                <span className="text-white font-semibold">Define.</span>{' '}
                <span className="text-white font-semibold">Stress.</span>{' '}
                <span className="text-white font-bold">Heal.</span>{' '}
                The ultimate{' '}
                <span className="text-neon-cyan font-semibold">high-fidelity engine</span>{' '}
                for API resilience. Shadow API{' '}
                <span className="italic text-white/80">intercepts, monitors,</span> and{' '}
                <span className="relative inline-block mx-0.5">
                  <span className="relative z-10 text-neon-green font-bold">autonomously repairs</span>
                  <motion.span
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-neon-green/50"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 1.5, duration: 0.6 }}
                    style={{ transformOrigin: 'left' }}
                  />
                </span>{' '}
                infrastructure failures before they reach your production mesh.
              </p>
            </motion.div>

            {/* Feature pills */}
            <motion.div variants={itemVariants} className="flex flex-wrap gap-3 mb-10">
              <FeaturePill icon={Shield} label="Self-Healing" color="#00ff41" />
              <FeaturePill icon={Zap} label="Low Latency" color="#00d4ff" />
              <FeaturePill icon={Target} label="Precise RCA" color="#bf5af2" />
              <FeaturePill icon={Cpu} label="Agentic AI" color="#ff6b2b" />
            </motion.div>

            {/* Terminal line */}
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center gap-3 px-5 py-3 rounded-lg"
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(0, 255, 65, 0.08)',
              }}
            >
              <span className="text-[10px] text-neon-green/40 font-mono">$</span>
              <span className="text-[12px] text-white/50 font-mono">
                <TypeWriter text="shadow --mode=autonomous --heal=true --ai=gemini" delay={2000} />
              </span>
            </motion.div>
          </div>

          {/* ── Right Column: Live Stats + Status ── */}
          <motion.div variants={itemVariants} className="shrink-0 w-full lg:w-[340px] space-y-5">

            {/* Live stats cards */}
            <div className="grid grid-cols-3 gap-3">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  className="text-center p-4 rounded-xl relative overflow-hidden group"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.04)',
                  }}
                  whileHover={{ borderColor: 'rgba(0, 255, 65, 0.15)', y: -2 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <stat.icon size={14} className="mx-auto mb-2 text-white/20 group-hover:text-neon-green/50 transition-colors" />
                  <div className="text-xl font-black text-white" style={{ fontFamily: "'Sora', sans-serif" }}>
                    <AnimatedNumber target={stat.value} suffix={stat.suffix} duration={2000 + i * 500} />
                  </div>
                  <div className="text-[8px] font-mono text-white/25 uppercase tracking-wider mt-1">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Tactical panel */}
            <div
              className="p-5 rounded-xl relative overflow-hidden"
              style={{
                background: 'linear-gradient(180deg, rgba(0,0,0,0.5), rgba(0,0,0,0.3))',
                border: '1px solid rgba(0, 255, 65, 0.06)',
                boxShadow: 'inset 0 0 30px rgba(0,0,0,0.3)',
              }}
            >
              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-neon-green/20" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-neon-green/20" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-neon-green/20" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-neon-green/20" />

              <div className="flex justify-between items-end mb-5 pb-3 border-b border-white/5">
                <div>
                  <div className="text-[9px] font-mono text-white/25 uppercase tracking-[0.3em]">System Status</div>
                  <div className="text-[13px] font-black text-neon-green tracking-tight text-glow-green mt-0.5">
                    ALL SYSTEMS NOMINAL
                  </div>
                </div>
                <div className="flex gap-[3px] items-end h-4">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-[3px] bg-neon-green rounded-sm"
                      animate={{ 
                        height: [4 + i * 2, 12 + i, 6 + i * 2, 14, 8 + i] 
                      }}
                      transition={{ duration: 1.2, repeat: Infinity, repeatType: 'reverse', delay: i * 0.08 }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2.5">
                <StatusRow label="Core Matrix" value="ONLINE" dot="#00ff41" />
                <StatusRow label="Neural Link" value="SYNCED" dot="#00d4ff" />
                <StatusRow label="Shadow Worker" value="ACTIVE" dot="#00ff41" />
                <StatusRow label="Circuit Breaker" value="ARMED" dot="#ffd60a" />
              </div>

              {/* Signal bar */}
              <div className="mt-5 pt-4 border-t border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Signal</span>
                  <span className="text-[10px] font-mono font-bold text-neon-green/60">98.4%</span>
                </div>
                <div className="h-[3px] bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: 'linear-gradient(90deg, #00ff41, #00d4ff)',
                      boxShadow: '0 0 12px rgba(0, 255, 65, 0.4)',
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: '98.4%' }}
                    transition={{ duration: 1.5, delay: 0.8, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </div>

            {/* Protocol footer */}
            <div className="flex items-center justify-center gap-2 text-[8px] font-mono text-white/15 uppercase tracking-[0.2em]">
              <motion.span
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-neon-green"
              >●</motion.span>
              PROTOCOL 0xAF42 // RESEARCH DIVISION
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom decorative line */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px]"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(0,255,65,0.1), rgba(0,212,255,0.1), transparent)' }}
      />
    </motion.section>
  );
}

// ── Sub-Components ──────────────────────────────────

function FeaturePill({ icon: Icon, label, color }) {
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.02 }}
      className="flex items-center gap-2 px-4 py-2 rounded-lg cursor-default transition-all"
      style={{
        background: `${color}06`,
        border: `1px solid ${color}18`,
      }}
    >
      <Icon size={12} style={{ color, opacity: 0.7 }} />
      <span className="text-[10px] font-mono font-bold uppercase tracking-widest" style={{ color, opacity: 0.8 }}>
        {label}
      </span>
    </motion.div>
  );
}

function StatusRow({ label, value, dot }) {
  return (
    <div className="flex justify-between items-center group cursor-default">
      <div className="flex items-center gap-2">
        <div className="w-[5px] h-[5px] rounded-full animate-pulse" style={{ background: dot, boxShadow: `0 0 6px ${dot}` }} />
        <span className="text-[10px] font-mono text-white/35 group-hover:text-white/55 transition-colors uppercase tracking-tight">
          {label}
        </span>
      </div>
      <span className="text-[10px] font-mono font-black uppercase" style={{ color: dot }}>
        {value}
      </span>
    </div>
  );
}
