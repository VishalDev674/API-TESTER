import { motion } from 'framer-motion';

export default function StatsCard({ title, value, subtitle, icon: Icon, color, delay = 0 }) {
  const colorMap = {
    cyan: { text: '#A7EF9E', bg: 'rgba(167,239,158,0.06)', border: 'rgba(167,239,158,0.15)', glow: 'rgba(167,239,158,0.08)' },
    green: { text: '#39ff14', bg: 'rgba(57,255,20,0.06)', border: 'rgba(57,255,20,0.15)', glow: 'rgba(57,255,20,0.08)' },
    magenta: { text: '#2e4a2e', bg: 'rgba(46,74,46,0.06)', border: 'rgba(46,74,46,0.15)', glow: 'rgba(46,74,46,0.08)' },
    red: { text: '#ff4d4d', bg: 'rgba(255,77,77,0.06)', border: 'rgba(255,77,77,0.15)', glow: 'rgba(255,77,77,0.08)' },
    blue: { text: '#58d68d', bg: 'rgba(88,214,141,0.06)', border: 'rgba(88,214,141,0.15)', glow: 'rgba(88,214,141,0.08)' },
    yellow: { text: '#f4d03f', bg: 'rgba(244,208,63,0.06)', border: 'rgba(244,208,63,0.15)', glow: 'rgba(244,208,63,0.08)' },
    purple: { text: '#27ae60', bg: 'rgba(39,174,96,0.06)', border: 'rgba(39,174,96,0.15)', glow: 'rgba(39,174,96,0.08)' },
  };

  const c = colorMap[color] || colorMap.cyan;

  return (
    <motion.div
      className="glass-card clipped-corner tactical-border p-8 relative overflow-hidden group"
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay: delay * 0.1, ease: "easeOut" }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
    >
      {/* Aurora Glow Overlay */}
      <div className="absolute -inset-1 opacity-0 group-hover:opacity-20 transition-opacity duration-700 blur-3xl pointer-events-none"
        style={{ background: `radial-gradient(circle at 50% 120%, ${c.text}, transparent 70%)` }}
      />
      
      {/* Background Micro-mesh */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '4px 4px', color: c.text }}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-70" style={{ color: c.text }}>
            {title}
          </span>
          {Icon && (
            <div className="p-2.5 rounded-lg border border-white/5 bg-white/[0.03]" style={{ color: c.text }}>
              <Icon size={18} />
            </div>
          )}
        </div>

        <motion.div
          className="text-4xl font-black text-white mb-2 font-heading tracking-tighter"
          key={value}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          {value}
        </motion.div>

        {subtitle && (
          <p className="text-[10px] font-mono opacity-50 uppercase tracking-widest">{subtitle}</p>
        )}
      </div>

      {/* Edge highlight line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-white/10" />
      <div className="absolute bottom-0 left-0 right-0 h-[3px] opacity-30"
        style={{ background: `linear-gradient(90deg, transparent, ${c.text}, transparent)` }}
      />
    </motion.div>
  );
}
