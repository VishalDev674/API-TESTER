import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ComposedChart, Line, Cell,
} from 'recharts';
import { TrendingUp, Clock, BarChart3, Zap, ChevronDown } from 'lucide-react';
import api from '../lib/api';

const TIME_RANGES = [
  { label: '1H', hours: 1, buckets: 12 },
  { label: '6H', hours: 6, buckets: 18 },
  { label: '24H', hours: 24, buckets: 30 },
  { label: '7D', hours: 168, buckets: 42 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;

  return (
    <div
      className="backdrop-blur-xl border border-white/10 p-4 shadow-2xl"
      style={{
        background: 'linear-gradient(165deg, rgba(10, 10, 15, 0.95), rgba(2, 2, 5, 0.98))',
        boxShadow: '0 0 30px rgba(167, 239, 158, 0.15), 0 20px 40px rgba(0,0,0,0.6)',
        clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
        minWidth: '180px',
      }}
    >
      <p className="text-[10px] font-mono text-white/40 tracking-[0.2em] uppercase mb-3">{label}</p>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-6">
          <span className="text-[10px] font-bold text-[#A7EF9E] tracking-wider uppercase">Avg</span>
          <span className="text-sm font-black text-white font-mono">{data.avg_ms}ms</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-[10px] font-bold text-[#39ff14] tracking-wider uppercase">P95</span>
          <span className="text-sm font-black text-white font-mono">{data.p95_ms}ms</span>
        </div>
        <div className="h-px bg-white/5 my-1" />
        <div className="flex items-center justify-between gap-6">
          <span className="text-[10px] font-bold text-[#58d68d] tracking-wider uppercase">OK</span>
          <span className="text-xs font-mono text-white/80">{data.success}</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-[10px] font-bold text-[#ff4d4d] tracking-wider uppercase">Fail</span>
          <span className="text-xs font-mono text-white/80">{data.failure}</span>
        </div>
        <div className="h-px bg-white/5 my-1" />
        <div className="flex items-center justify-between gap-6">
          <span className="text-[10px] font-bold text-white/30 tracking-wider uppercase">Rate</span>
          <span className="text-xs font-black font-mono" style={{
            color: data.success_rate >= 95 ? '#39ff14' : data.success_rate >= 80 ? '#f4d03f' : '#ff4d4d'
          }}>{data.success_rate}%</span>
        </div>
      </div>
    </div>
  );
};

const MiniStatBox = ({ label, value, unit, color, icon: Icon }) => (
  <div className="flex flex-col items-center gap-1 px-5 py-3 bg-white/[0.02] border border-white/5 relative overflow-hidden"
    style={{ clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}
  >
    <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
      style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '3px 3px', color }}
    />
    <div className="flex items-center gap-2">
      <Icon size={10} style={{ color }} />
      <span className="text-[8px] font-bold uppercase tracking-[0.25em] text-white/30">{label}</span>
    </div>
    <div className="flex items-baseline gap-1">
      <span className="text-lg font-black text-white font-mono tracking-tighter">{value}</span>
      {unit && <span className="text-[9px] font-mono text-white/30">{unit}</span>}
    </div>
    <div className="absolute bottom-0 left-0 right-0 h-[2px] opacity-40"
      style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
    />
  </div>
);

export default function AnalyticsGraph() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeRange, setActiveRange] = useState(2); // Default 24H
  const [chartType, setChartType] = useState('response'); // 'response' | 'throughput'

  const fetchAnalytics = useCallback(async () => {
    try {
      const range = TIME_RANGES[activeRange];
      const data = await api.getAnalytics(range.hours, range.buckets);
      setAnalytics(data);
    } catch (e) {
      console.error('Failed to fetch analytics:', e);
    } finally {
      setLoading(false);
    }
  }, [activeRange]);

  useEffect(() => {
    setLoading(true);
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 15000);
    return () => clearInterval(interval);
  }, [fetchAnalytics]);

  // Listen for refresh events
  useEffect(() => {
    const handler = () => fetchAnalytics();
    window.addEventListener('refresh-endpoints', handler);
    return () => window.removeEventListener('refresh-endpoints', handler);
  }, [fetchAnalytics]);

  const timeline = analytics?.timeline || [];

  // Compute summary stats from timeline
  const summaryAvg = timeline.length
    ? Math.round(timeline.reduce((s, t) => s + t.avg_ms, 0) / timeline.filter(t => t.total > 0).length || 0)
    : 0;
  const summaryP95 = timeline.length
    ? Math.round(Math.max(...timeline.map(t => t.p95_ms)))
    : 0;
  const summaryTotal = analytics?.total_pings || 0;
  const summaryRate = analytics?.overall_success_rate || 100;

  return (
    <motion.div
      className="glass-card clipped-corner p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-shadow-cyan/5 border border-shadow-cyan/10">
            <TrendingUp size={20} className="text-shadow-cyan" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-[0.3em] uppercase mb-1">
              PERFORMANCE ANALYTICS
            </h3>
            <p className="text-[9px] font-mono text-white/30 tracking-[0.2em] uppercase">
              {TIME_RANGES[activeRange].label} Window • {summaryTotal.toLocaleString()} Pings Analyzed
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Chart Type Toggle */}
          <div className="flex bg-black/40 border border-white/5 overflow-hidden"
            style={{ clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)' }}
          >
            <button
              onClick={() => setChartType('response')}
              className={`px-4 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] transition-all duration-300 ${
                chartType === 'response'
                  ? 'bg-shadow-cyan/10 text-shadow-cyan border-b-2 border-shadow-cyan'
                  : 'text-white/30 hover:text-white/50'
              }`}
            >
              Latency
            </button>
            <button
              onClick={() => setChartType('throughput')}
              className={`px-4 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] transition-all duration-300 ${
                chartType === 'throughput'
                  ? 'bg-shadow-cyan/10 text-shadow-cyan border-b-2 border-shadow-cyan'
                  : 'text-white/30 hover:text-white/50'
              }`}
            >
              Throughput
            </button>
          </div>

          {/* Time Range Selector */}
          <div className="flex bg-black/40 border border-white/5 overflow-hidden"
            style={{ clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)' }}
          >
            {TIME_RANGES.map((range, i) => (
              <button
                key={range.label}
                onClick={() => setActiveRange(i)}
                className={`px-4 py-1.5 text-[9px] font-bold uppercase tracking-[0.15em] transition-all duration-300 ${
                  activeRange === i
                    ? 'bg-shadow-cyan/10 text-shadow-cyan border-b-2 border-shadow-cyan'
                    : 'text-white/30 hover:text-white/50'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <MiniStatBox label="Avg Latency" value={summaryAvg} unit="ms" color="#A7EF9E" icon={Clock} />
        <MiniStatBox label="P95 Latency" value={summaryP95} unit="ms" color="#39ff14" icon={Zap} />
        <MiniStatBox label="Total Pings" value={summaryTotal.toLocaleString()} color="#58d68d" icon={BarChart3} />
        <MiniStatBox
          label="Success Rate"
          value={summaryRate + '%'}
          color={summaryRate >= 95 ? '#39ff14' : summaryRate >= 80 ? '#f4d03f' : '#ff4d4d'}
          icon={TrendingUp}
        />
      </div>

      {/* Main Chart */}
      <div className="bg-black/40 border border-white/5 p-4 mb-6"
        style={{
          clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
          minHeight: '280px',
        }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-shadow-cyan animate-pulse" />
              <span className="text-[10px] font-mono text-white/30 tracking-[0.3em] uppercase">Loading Analytics</span>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={chartType + activeRange}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <ResponsiveContainer width="100%" height={260}>
                {chartType === 'response' ? (
                  <ComposedChart data={timeline} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradientAvg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#A7EF9E" stopOpacity={0.35} />
                        <stop offset="50%" stopColor="#A7EF9E" stopOpacity={0.08} />
                        <stop offset="100%" stopColor="#A7EF9E" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradientP95" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#39ff14" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="#39ff14" stopOpacity={0} />
                      </linearGradient>
                      <filter id="glowLine">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(167,239,158,0.06)" vertical={false} />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }}
                      unit="ms"
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(167,239,158,0.15)', strokeWidth: 1 }} />
                    <Area
                      type="monotone"
                      dataKey="p95_ms"
                      stroke="rgba(57,255,20,0.4)"
                      fill="url(#gradientP95)"
                      strokeWidth={1}
                      dot={false}
                      name="P95"
                    />
                    <Area
                      type="monotone"
                      dataKey="avg_ms"
                      stroke="#A7EF9E"
                      fill="url(#gradientAvg)"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: '#A7EF9E', stroke: '#0a0a0f', strokeWidth: 2 }}
                      filter="url(#glowLine)"
                      name="Avg"
                    />
                    <Line
                      type="monotone"
                      dataKey="max_ms"
                      stroke="rgba(255,77,77,0.3)"
                      strokeWidth={1}
                      strokeDasharray="4 4"
                      dot={false}
                      name="Max"
                    />
                  </ComposedChart>
                ) : (
                  <ComposedChart data={timeline} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradientSuccess" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#39ff14" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#39ff14" stopOpacity={0.3} />
                      </linearGradient>
                      <linearGradient id="gradientFailure" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ff4d4d" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#ff4d4d" stopOpacity={0.4} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(167,239,158,0.06)" vertical={false} />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(167,239,158,0.04)' }} />
                    <Bar dataKey="success" stackId="a" fill="url(#gradientSuccess)" radius={[0, 0, 0, 0]} name="Success" />
                    <Bar dataKey="failure" stackId="a" fill="url(#gradientFailure)" radius={[2, 2, 0, 0]} name="Failure" />
                    <Line
                      type="monotone"
                      dataKey="success_rate"
                      stroke="#A7EF9E"
                      strokeWidth={2}
                      dot={false}
                      yAxisId="right"
                      name="Rate"
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'rgba(167,239,158,0.3)', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }}
                      unit="%"
                      domain={[0, 100]}
                    />
                  </ComposedChart>
                )}
              </ResponsiveContainer>
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Chart Legend */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          {chartType === 'response' ? (
            <>
              <div className="flex items-center gap-2">
                <div className="w-6 h-[2px] bg-[#A7EF9E] shadow-[0_0_6px_rgba(167,239,158,0.5)]" />
                <span className="text-[9px] font-bold text-white/40 tracking-[0.15em] uppercase">Avg Latency</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-[2px] bg-[#39ff14]/40" />
                <span className="text-[9px] font-bold text-white/40 tracking-[0.15em] uppercase">P95</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-[2px] border-t border-dashed border-[#ff4d4d]/30" />
                <span className="text-[9px] font-bold text-white/40 tracking-[0.15em] uppercase">Max</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-[#39ff14]/60" />
                <span className="text-[9px] font-bold text-white/40 tracking-[0.15em] uppercase">Success</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-[#ff4d4d]/60" />
                <span className="text-[9px] font-bold text-white/40 tracking-[0.15em] uppercase">Failure</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-[2px] bg-[#A7EF9E]" />
                <span className="text-[9px] font-bold text-white/40 tracking-[0.15em] uppercase">Success Rate</span>
              </div>
            </>
          )}
        </div>

        {/* Endpoint Breakdown */}
        {analytics?.endpoints?.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[8px] font-mono text-white/20 tracking-[0.2em] uppercase">
              {analytics.endpoints.length} Endpoint{analytics.endpoints.length > 1 ? 's' : ''} Tracked
            </span>
          </div>
        )}
      </div>

      {/* Per-Endpoint Breakdown */}
      {analytics?.endpoints?.length > 0 && (
        <div className="mt-6 pt-6 border-t border-white/5">
          <h4 className="text-[10px] font-bold text-white/30 tracking-[0.3em] uppercase mb-4">
            Endpoint Breakdown
          </h4>
          <div className="space-y-3">
            {analytics.endpoints.slice(0, 5).map((ep) => {
              const rate = ep.total_pings > 0
                ? Math.round((ep.success_count / ep.total_pings) * 100)
                : 100;
              const barColor = rate >= 95 ? '#39ff14' : rate >= 80 ? '#f4d03f' : '#ff4d4d';
              return (
                <div key={ep.id} className="group">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: barColor, boxShadow: `0 0 6px ${barColor}40` }} />
                      <span className="text-[10px] font-mono text-white/60 truncate max-w-[200px]">{ep.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[9px] font-mono text-white/30">{ep.avg_ms}ms</span>
                      <span className="text-[9px] font-mono font-bold" style={{ color: barColor }}>{rate}%</span>
                      <span className="text-[9px] font-mono text-white/20">{ep.total_pings}</span>
                    </div>
                  </div>
                  <div className="h-1 bg-white/[0.03] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, ${barColor}80, ${barColor})` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${rate}%` }}
                      transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
