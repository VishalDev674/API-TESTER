import { motion } from 'framer-motion';

export default function StatsCard({ title, value, subtitle, icon: Icon, color, delay = 0 }) {
  const colorMap = {
    cyan: { text: '#00d4ff', bg: 'rgba(0,212,255,0.04)', border: 'rgba(0,212,255,0.12)', glow: '0 0 20px rgba(0,212,255,0.15)' },
    green: { text: '#00ff41', bg: 'rgba(0,255,65,0.04)', border: 'rgba(0,255,65,0.12)', glow: '0 0 20px rgba(0,255,65,0.15)' },
    red: { text: '#ff0a3c', bg: 'rgba(255,10,60,0.04)', border: 'rgba(255,10,60,0.12)', glow: '0 0 20px rgba(255,10,60,0.15)' },
    purple: { text: '#bf5af2', bg: 'rgba(191,90,242,0.04)', border: 'rgba(191,90,242,0.12)', glow: '0 0 20px rgba(191,90,242,0.15)' },
    yellow: { text: '#ffd60a', bg: 'rgba(255,214,10,0.04)', border: 'rgba(255,214,10,0.12)', glow: '0 0 20px rgba(255,214,10,0.15)' },
    magenta: { text: '#ff2d7b', bg: 'rgba(255,45,123,0.04)', border: 'rgba(255,45,123,0.12)', glow: '0 0 20px rgba(255,45,123,0.15)' },
    blue: { text: '#00d4ff', bg: 'rgba(0,212,255,0.04)', border: 'rgba(0,212,255,0.12)', glow: '0 0 20px rgba(0,212,255,0.15)' },
  };

  const c = colorMap[color] || colorMap.cyan;

  return (
    <motion.div
      className="glass-card bento-item p-7 relative overflow-hidden group"
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay: delay * 0.1, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.25 } }}
    >
      {/* Hover Aura */}
      <div 
        className="absolute -inset-4 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-3xl pointer-events-none"
        style={{ background: `radial-gradient(circle at 50% 120%, ${c.text}15, transparent 60%)` }}
      />
      
      {/* Grid Micro-Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none grid-lines"
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-5">
          <span 
            className="text-[10px] font-bold tracking-[0.25em] uppercase"
            style={{ color: c.text, opacity: 0.75 }}
          >
            {title}
          </span>
          {Icon && (
            <div 
              className="p-2.5 rounded-lg border border-white/5"
              style={{ background: c.bg, color: c.text }}
            >
              <Icon size={16} />
            </div>
          )}
        </div>

        <motion.div
          className="text-4xl font-black text-white mb-2.5 tracking-tighter"
          style={{ fontFamily: "'Outfit', sans-serif" }}
          key={value}
          initial={{ opacity: 0, x: -10, filter: 'blur(4px)' }}
          animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.5 }}
        >
          {value}
        </motion.div>

        {subtitle && (
          <p className="text-[10px] font-mono uppercase tracking-[0.15em]" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Bottom accent line */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-60 transition-opacity duration-500"
        style={{ background: `linear-gradient(90deg, transparent, ${c.text}, transparent)` }}
      />
    </motion.div>
  );
}
