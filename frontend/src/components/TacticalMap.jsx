import { motion } from 'framer-motion';
import { Share2, Crosshair, Cpu, ShieldCheck } from 'lucide-react';

export default function TacticalMap() {
  const nodes = [
    { id: 1, x: 15, y: 25, color: '#00ff41', name: 'CORE_MATRIX' },
    { id: 2, x: 85, y: 20, color: '#00d4ff', name: 'NEURAL_LINK' },
    { id: 3, x: 50, y: 50, color: '#bf5af2', name: 'AI_ORCHESTRATOR' },
    { id: 4, x: 10, y: 80, color: '#00ff41', name: 'SHADOW_WORKER' },
    { id: 5, x: 90, y: 85, color: '#ffd60a', name: 'DATA_EXTRACT' },
  ];

  const connections = [
    [1, 2], [1, 3], [2, 3], [3, 4], [3, 5], [4, 5]
  ];

  return (
    <div className="glass-card relative overflow-hidden h-[500px] border border-white/5 bg-black/40">
      {/* Glow Definition */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* Background Grid */}
      <div className="absolute inset-0 opacity-[0.05]" style={{ 
        backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }} />

      {/* Header */}
      <div className="absolute top-6 left-6 z-10">
        <div className="flex items-center gap-3 mb-1.5">
          <Share2 size={18} className="text-neon-green" />
          <span className="text-[12px] font-mono text-white/50 uppercase tracking-[0.3em]">Neural Orchestration Mesh</span>
        </div>
        <div className="text-[16px] font-black text-white uppercase tracking-[0.4em] text-glow-white">
          Shadow_Net // Active Status
        </div>
      </div>

      {/* Floating Tactical Data */}
      <div className="absolute bottom-6 left-6 z-10 font-mono text-[10px] text-neon-green/50 space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="w-1 h-1 bg-neon-green rounded-full animate-ping" />
          ORCHESTRATION_LAYER: ARMED
        </div>
        <div>UPLINK_PROTOCOL: v4.0 // SHADOW_CONSTRUCT</div>
      </div>

      <div className="absolute top-6 right-6 z-10 flex gap-6">
        <div className="flex items-center gap-2">
          <Cpu size={16} className="text-purple-500" />
          <span className="text-[11px] font-mono text-purple-400">LOAD: 12.4%</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-neon-cyan" />
          <span className="text-[11px] font-mono text-cyan-400">INTEGRITY: 100%</span>
        </div>
      </div>

      {/* SVG Map */}
      <svg className="w-full h-full p-20" viewBox="0 0 100 100">
        {/* Connection Beams */}
        {connections.map(([fromId, toId], i) => {
          const from = nodes.find(n => n.id === fromId);
          const to = nodes.find(n => n.id === toId);
          return (
            <g key={i}>
              <line 
                x1={from.x} y1={from.y} x2={to.x} y2={to.y} 
                stroke="white" strokeWidth="0.2" strokeOpacity="0.15" 
              />
              <motion.circle
                cx={from.x}
                cy={from.y}
                r="0.8"
                fill="#00ff41"
                filter="url(#glow)"
                initial={{ cx: from.x, cy: from.y }}
                animate={{ cx: to.x, cy: to.y }}
                transition={{ 
                  duration: 2 + Math.random() * 2, 
                  repeat: Infinity, 
                  ease: "linear",
                  delay: Math.random() * 2
                }}
              />
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map(node => (
          <g key={node.id}>
            <motion.circle
              cx={node.x}
              cy={node.y}
              r="3.5"
              fill={node.color}
              filter="url(#glow)"
              initial={{ opacity: 0.4, r: 2 }}
              animate={{ opacity: [0.4, 0.9, 0.4], r: [2, 3.5, 2] }}
              transition={{ duration: 3 + Math.random() * 2, repeat: Infinity }}
            />
            <circle
              cx={node.x}
              cy={node.y}
              r="6"
              fill="transparent"
              stroke={node.color}
              strokeWidth="0.4"
              strokeDasharray="2 2"
              className="animate-spin-slow opacity-40"
            />
            <text 
              x={node.x} y={node.y + 11} 
              fontSize="3.5" 
              fill="white" 
              fillOpacity="0.6"
              textAnchor="middle" 
              fontWeight="900"
              className="font-mono uppercase tracking-widest pointer-events-none"
              filter="url(#glow)"
            >
              {node.name}
            </text>
          </g>
        ))}
      </svg>

      {/* Scanning Line */}
      <motion.div
        className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-neon-green/10 to-transparent h-[3px] w-full"
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Corner Overlays */}
      <div className="absolute top-0 right-0 p-2">
        <Crosshair size={40} className="text-white/10 rotate-45" />
      </div>
    </div>
  );
}
