import { motion } from 'framer-motion';
import { Share2, Crosshair, Cpu, ShieldCheck } from 'lucide-react';

export default function TacticalMap() {
  const nodes = [
    { id: 1, x: 20, y: 30, color: '#00ff41', name: 'CORE_MATRIX' },
    { id: 2, x: 80, y: 25, color: '#00d4ff', name: 'NEURAL_LINK' },
    { id: 3, x: 50, y: 55, color: '#bf5af2', name: 'AI_ORCHESTRATOR' },
    { id: 4, x: 15, y: 75, color: '#00ff41', name: 'SHADOW_WORKER' },
    { id: 5, x: 85, y: 80, color: '#ffd60a', name: 'DATA_EXTRACT' },
  ];

  const connections = [
    [1, 2], [1, 3], [2, 3], [3, 4], [3, 5], [4, 5]
  ];

  return (
    <div className="glass-card relative overflow-hidden h-[300px] border border-white/5 bg-black/40">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ 
        backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
        backgroundSize: '30px 30px'
      }} />

      {/* Header */}
      <div className="absolute top-4 left-4 z-10">
        <div className="flex items-center gap-2 mb-1">
          <Share2 size={14} className="text-neon-green" />
          <span className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em]">Neural Orchestration Mesh</span>
        </div>
        <div className="text-[12px] font-black text-white/90 uppercase tracking-widest">
          Shadow_Net // Active Status
        </div>
      </div>

      {/* Floating Tactical Data */}
      <div className="absolute bottom-4 left-4 z-10 font-mono text-[8px] text-neon-green/40 space-y-1">
        <div>ORCHESTRATION_LAYER: ARMED</div>
        <div>UPLINK_PROTOCOL: v3.0 // SHADOW</div>
      </div>

      <div className="absolute top-4 right-4 z-10 flex gap-4">
        <div className="flex items-center gap-1.5">
          <Cpu size={12} className="text-purple-500" />
          <span className="text-[9px] font-mono text-purple-400/70">ORCHESTRATION_LOAD: 12.4%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={12} className="text-neon-cyan" />
          <span className="text-[9px] font-mono text-cyan-400/70">DATA_INTEGRITY: 100%</span>
        </div>
      </div>

      {/* SVG Map */}
      <svg className="w-full h-full p-10" viewBox="0 0 100 100">
        {/* Connection Beams */}
        {connections.map(([fromId, toId], i) => {
          const from = nodes.find(n => n.id === fromId);
          const to = nodes.find(n => n.id === toId);
          return (
            <g key={i}>
              <line 
                x1={from.x} y1={from.y} x2={to.x} y2={to.y} 
                stroke="white" strokeWidth="0.15" strokeOpacity="0.1" 
              />
              <motion.circle
                cx={from.x}
                cy={from.y}
                r="0.5"
                fill="#00ff41"
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
              r="2"
              fill={node.color}
              initial={{ opacity: 0.3, r: 1 }}
              animate={{ opacity: [0.3, 0.8, 0.3], r: [1, 2, 1] }}
              transition={{ duration: 3 + Math.random() * 2, repeat: Infinity }}
            />
            <circle
              cx={node.x}
              cy={node.y}
              r="4"
              fill="transparent"
              stroke={node.color}
              strokeWidth="0.2"
              strokeDasharray="1 1"
              className="animate-spin-slow"
            />
            <text 
              x={node.x} y={node.y + 7} 
              fontSize="2" 
              fill="white" 
              fillOpacity="0.4"
              textAnchor="middle" 
              className="font-mono uppercase tracking-tighter pointer-events-none"
            >
              {node.name}
            </text>
          </g>
        ))}
      </svg>

      {/* Scanning Line */}
      <motion.div
        className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-neon-green/5 to-transparent h-[2px] w-full"
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Corner Overlays */}
      <div className="absolute top-0 right-0 p-1">
        <Crosshair size={30} className="text-white/5 rotate-45" />
      </div>
    </div>
  );
}
