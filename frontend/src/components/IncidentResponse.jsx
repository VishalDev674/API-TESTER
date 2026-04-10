import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert, AlertTriangle, CheckCircle2, Search, ArrowRight,
  Wrench, RotateCcw, Settings2, Server, Sparkles, Clock, ChevronDown,
  ChevronUp, Zap, Activity, XCircle, Brain,
} from 'lucide-react';
import api from '../lib/api';

const STEP_META = {
  retry: { icon: RotateCcw, label: 'RETRY', color: '#00d4ff', desc: 'Exponential backoff retry' },
  param_adjust: { icon: Settings2, label: 'ADJUST', color: '#ffd60a', desc: 'Parameter adjustment' },
  mock_fallback: { icon: Server, label: 'FALLBACK', color: '#bf5af2', desc: 'Mock API fallback' },
  schema_auto_fix: { icon: Sparkles, label: 'SCHEMA FIX', color: '#00ff41', desc: 'Auto schema repair' },
};

const SEVERITY_COLORS = {
  critical: '#ff0a3c',
  high: '#ff6b2b',
  medium: '#ffd60a',
  low: '#00d4ff',
  unknown: '#888',
};

function IncidentCard({ incident, isLatest }) {
  const [expanded, setExpanded] = useState(isLatest);

  const time = new Date(incident.detected_at).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
  const date = new Date(incident.detected_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  });

  const severityColor = SEVERITY_COLORS[incident.ai_rca?.severity] || SEVERITY_COLORS.unknown;
  const hasHealing = incident.heal_steps && incident.heal_steps.length > 0;

  // Determine the pipeline stages
  const stages = [
    { key: 'detected', label: 'DETECTED', icon: AlertTriangle, color: '#ff0a3c', done: true },
    { key: 'diagnosed', label: 'DIAGNOSED', icon: Brain, color: '#bf5af2', done: !!incident.ai_rca },
    { key: 'healing', label: 'HEALING', icon: Wrench, color: '#ffd60a', done: hasHealing },
    {
      key: 'resolved', label: incident.resolved ? 'RESOLVED' : 'UNRESOLVED',
      icon: incident.resolved ? CheckCircle2 : XCircle,
      color: incident.resolved ? '#00ff41' : '#ff0a3c',
      done: true,
    },
  ];

  return (
    <motion.div
      className="rounded-xl border overflow-hidden"
      style={{
        background: isLatest
          ? 'linear-gradient(135deg, rgba(255,10,60,0.04), rgba(191,90,242,0.03))'
          : 'rgba(255,255,255,0.01)',
        borderColor: isLatest
          ? 'rgba(255,10,60,0.15)'
          : 'rgba(255,255,255,0.04)',
      }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      layout
    >
      {/* Compact Header — always shown */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-5 flex items-center gap-4 hover:bg-white/[0.02] transition-colors"
      >
        {/* Status indicator */}
        <div className="relative shrink-0">
          <div
            className="w-11 h-11 rounded-lg flex items-center justify-center border"
            style={{
              background: incident.resolved ? 'rgba(0,255,65,0.06)' : 'rgba(255,10,60,0.08)',
              borderColor: incident.resolved ? 'rgba(0,255,65,0.15)' : 'rgba(255,10,60,0.2)',
            }}
          >
            {incident.resolved
              ? <CheckCircle2 size={20} style={{ color: '#00ff41' }} />
              : <AlertTriangle size={20} style={{ color: '#ff0a3c' }} />
            }
          </div>
          {isLatest && !incident.resolved && (
            <div
              className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full animate-ping"
              style={{ background: '#ff0a3c' }}
            />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-[13px] font-black text-white uppercase tracking-wide truncate">
              {incident.endpoint_name}
            </span>
            {incident.status_code && (
              <span
                className="text-[10px] font-mono font-bold px-2 py-0.5 rounded"
                style={{
                  background: incident.status_code >= 500
                    ? 'rgba(255,10,60,0.15)' : 'rgba(255,107,43,0.15)',
                  color: incident.status_code >= 500 ? '#ff0a3c' : '#ff6b2b',
                }}
              >
                {incident.status_code}
              </span>
            )}
          </div>
          <p className="text-[11px] font-mono truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {incident.error_message || 'Unknown error'}
          </p>
        </div>

        {/* Pipeline mini-indicator */}
        <div className="hidden sm:flex items-center gap-1.5 shrink-0 mr-3">
          {stages.map((s, i) => (
            <div key={s.key} className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  background: s.done ? s.color : 'rgba(255,255,255,0.1)',
                  boxShadow: s.done ? `0 0 6px ${s.color}40` : 'none',
                }}
              />
              {i < stages.length - 1 && (
                <div className="w-3 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
              )}
            </div>
          ))}
        </div>

        {/* Timestamp & expand */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[11px] font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>
            {time}
          </span>
          {expanded
            ? <ChevronUp size={16} style={{ color: 'rgba(255,255,255,0.25)' }} />
            : <ChevronDown size={16} style={{ color: 'rgba(255,255,255,0.25)' }} />
          }
        </div>
      </button>

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4">
              {/* Resolution Pipeline */}
              <div
                className="p-4 rounded-lg"
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.04)' }}
              >
                <div className="text-[9px] font-mono tracking-[0.25em] mb-4 uppercase"
                  style={{ color: 'rgba(255,255,255,0.25)' }}>
                  RESOLUTION PIPELINE
                </div>
                <div className="flex items-center justify-between gap-2">
                  {stages.map((stage, i) => {
                    const Icon = stage.icon;
                    return (
                      <div key={stage.key} className="flex items-center gap-2 flex-1">
                        <motion.div
                          className="flex flex-col items-center gap-2 flex-1"
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: i * 0.12 }}
                        >
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center border"
                            style={{
                              background: stage.done ? `${stage.color}10` : 'rgba(255,255,255,0.02)',
                              borderColor: stage.done ? `${stage.color}30` : 'rgba(255,255,255,0.05)',
                              boxShadow: stage.done ? `0 0 14px ${stage.color}15` : 'none',
                            }}
                          >
                            <Icon
                              size={18}
                              style={{
                                color: stage.done ? stage.color : 'rgba(255,255,255,0.1)',
                                filter: stage.done ? `drop-shadow(0 0 4px ${stage.color})` : 'none',
                              }}
                            />
                          </div>
                          <span
                            className="text-[9px] font-mono font-bold tracking-wider"
                            style={{ color: stage.done ? stage.color : 'rgba(255,255,255,0.1)' }}
                          >
                            {stage.label}
                          </span>
                        </motion.div>
                        {i < stages.length - 1 && (
                          <div className="flex-shrink-0 mb-5">
                            <ArrowRight
                              size={14}
                              style={{ color: stage.done ? `${stage.color}60` : 'rgba(255,255,255,0.06)' }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Error Details */}
              <div
                className="p-4 rounded-lg border-l-[3px]"
                style={{
                  background: 'rgba(255,10,60,0.03)',
                  borderColor: '#ff0a3c',
                }}
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <AlertTriangle size={14} style={{ color: '#ff0a3c' }} />
                  <span className="text-[10px] font-mono font-bold tracking-widest uppercase"
                    style={{ color: '#ff0a3c' }}>
                    ERROR DETECTED
                  </span>
                  <span className="text-[9px] font-mono ml-auto" style={{ color: 'rgba(255,255,255,0.25)' }}>
                    {date} {time}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex gap-3 text-[11px] font-mono">
                    <span style={{ color: 'rgba(255,255,255,0.3)' }}>Endpoint:</span>
                    <span className="text-white font-bold">{incident.endpoint_name}</span>
                  </div>
                  <div className="flex gap-3 text-[11px] font-mono">
                    <span style={{ color: 'rgba(255,255,255,0.3)' }}>URL:</span>
                    <span className="truncate" style={{ color: 'rgba(255,255,255,0.55)' }}>{incident.endpoint_url}</span>
                  </div>
                  {incident.status_code && (
                    <div className="flex gap-3 text-[11px] font-mono">
                      <span style={{ color: 'rgba(255,255,255,0.3)' }}>Status:</span>
                      <span style={{ color: '#ff0a3c' }}>{incident.status_code} — {incident.error_message || 'Server Error'}</span>
                    </div>
                  )}
                  {!incident.status_code && incident.error_message && (
                    <div className="flex gap-3 text-[11px] font-mono">
                      <span style={{ color: 'rgba(255,255,255,0.3)' }}>Error:</span>
                      <span style={{ color: '#ff6b2b' }}>{incident.error_message}</span>
                    </div>
                  )}
                  {incident.response_time_ms != null && (
                    <div className="flex gap-3 text-[11px] font-mono">
                      <span style={{ color: 'rgba(255,255,255,0.3)' }}>Latency:</span>
                      <span style={{ color: incident.response_time_ms > 5000 ? '#ff0a3c' : '#ffd60a' }}>
                        {incident.response_time_ms.toFixed(0)}ms
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* AI Diagnosis */}
              {incident.ai_rca && (
                <motion.div
                  className="p-4 rounded-lg border-l-[3px]"
                  style={{
                    background: 'rgba(191,90,242,0.04)',
                    borderColor: '#bf5af2',
                  }}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <div className="flex items-center gap-2.5 mb-3">
                    <Brain size={15} style={{ color: '#bf5af2' }} />
                    <span className="text-[10px] font-mono font-bold tracking-widest uppercase"
                      style={{ color: '#bf5af2' }}>
                      AI ROOT CAUSE ANALYSIS
                    </span>
                    {incident.ai_rca.confidence > 0 && (
                      <span className="ml-auto text-[9px] font-mono px-2 py-0.5 rounded"
                        style={{
                          background: 'rgba(191,90,242,0.1)',
                          color: '#bf5af2',
                        }}>
                        {incident.ai_rca.confidence}% CONF
                      </span>
                    )}
                  </div>
                  <div className="space-y-2.5">
                    <div className="text-[11px] font-mono">
                      <span style={{ color: 'rgba(255,255,255,0.3)' }}>Cause: </span>
                      <span className="text-white">{incident.ai_rca.cause}</span>
                    </div>
                    {incident.ai_rca.severity && (
                      <div className="flex items-center gap-2.5 text-[11px] font-mono">
                        <span style={{ color: 'rgba(255,255,255,0.3)' }}>Severity:</span>
                        <span
                          className="px-2 py-0.5 rounded text-[9px] font-bold uppercase"
                          style={{
                            background: `${severityColor}15`,
                            color: severityColor,
                            border: `1px solid ${severityColor}30`,
                          }}
                        >
                          {incident.ai_rca.severity}
                        </span>
                      </div>
                    )}
                    {incident.ai_rca.recommendation && (
                      <div className="text-[11px] font-mono p-3 rounded"
                        style={{
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid rgba(191,90,242,0.1)',
                        }}>
                        <span className="text-[9px] font-bold tracking-widest block mb-1.5"
                          style={{ color: 'rgba(191,90,242,0.5)' }}>FIX RECOMMENDATION</span>
                        <span style={{ color: 'rgba(255,255,255,0.7)' }}>{incident.ai_rca.recommendation}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Healing Steps */}
              {hasHealing && (
                <motion.div
                  className="p-4 rounded-lg border-l-[3px]"
                  style={{
                    background: incident.resolved ? 'rgba(0,255,65,0.03)' : 'rgba(255,214,10,0.03)',
                    borderColor: incident.resolved ? '#00ff41' : '#ffd60a',
                  }}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <div className="flex items-center gap-2.5 mb-3">
                    <Wrench size={15} style={{ color: incident.resolved ? '#00ff41' : '#ffd60a' }} />
                    <span className="text-[10px] font-mono font-bold tracking-widest uppercase"
                      style={{ color: incident.resolved ? '#00ff41' : '#ffd60a' }}>
                      {incident.resolved ? 'RESOLUTION APPLIED' : 'HEALING ATTEMPTED'}
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {incident.heal_steps.map((step, i) => {
                      const meta = STEP_META[step.step] || STEP_META.retry;
                      const StepIcon = meta.icon;
                      const isSuccess = step.result === 'success';
                      return (
                        <motion.div
                          key={i}
                          className="flex items-center gap-4 p-3 rounded-lg"
                          style={{
                            background: isSuccess ? 'rgba(0,255,65,0.05)' : 'rgba(255,255,255,0.02)',
                            border: `1px solid ${isSuccess ? 'rgba(0,255,65,0.1)' : 'rgba(255,255,255,0.04)'}`,
                          }}
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * i }}
                        >
                          <div
                            className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
                            style={{
                              background: `${meta.color}10`,
                              border: `1px solid ${meta.color}25`,
                            }}
                          >
                            <StepIcon size={15} style={{ color: meta.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[11px] font-mono font-bold" style={{ color: meta.color }}>
                              {meta.label}: {meta.desc}
                            </div>
                          </div>
                          <div className="shrink-0">
                            {isSuccess ? (
                              <span className="text-[9px] font-mono font-bold px-2 py-1 rounded"
                                style={{ background: 'rgba(0,255,65,0.1)', color: '#00ff41' }}>
                                ✓ FIXED
                              </span>
                            ) : (
                              <span className="text-[9px] font-mono px-2 py-1 rounded"
                                style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.25)' }}>
                                TRIED
                              </span>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}


export default function IncidentResponse() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadIncidents = useCallback(async () => {
    try {
      const data = await api.getIncidents(15);
      setIncidents(data);
    } catch (e) {
      console.error('Failed to load incidents:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIncidents();
    const interval = setInterval(loadIncidents, 8000);

    // Also refresh on heal/ping events from WebSocket
    const onRefresh = () => loadIncidents();
    window.addEventListener('refresh-endpoints', onRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener('refresh-endpoints', onRefresh);
    };
  }, [loadIncidents]);

  const resolvedCount = incidents.filter(i => i.resolved).length;
  const unresolvedCount = incidents.filter(i => !i.resolved).length;

  return (
    <motion.div
      className="glass-card p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-lg border border-white/5" style={{
            background: 'rgba(255, 10, 60, 0.06)',
          }}>
            <ShieldAlert size={24} style={{ color: '#ff0a3c' }} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-[0.3em] uppercase mb-1">
              INCIDENT RESPONSE
            </h3>
            <p className="text-[10px] font-mono tracking-[0.15em] uppercase" style={{ color: 'rgba(255,10,60,0.45)' }}>
              LIVE ERROR DETECTION • AI ROOT CAUSE ANALYSIS • AUTO-HEALING
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: unresolvedCount > 0 ? '#ff0a3c' : '#00ff41', boxShadow: unresolvedCount > 0 ? '0 0 10px rgba(255,10,60,0.5)' : '0 0 10px rgba(0,255,65,0.5)' }} />
          <span className="text-[10px] font-mono font-bold tracking-widest uppercase" style={{ color: unresolvedCount > 0 ? '#ff0a3c' : '#00ff41' }}>
            {unresolvedCount > 0 ? 'ACTIVE INCIDENTS' : 'ALL CLEAR'}
          </span>
        </div>
      </div>

      {/* Summary Badges */}
      <div className="flex items-center gap-4 mb-6">
        <div
          className="flex items-center gap-2 text-[10px] font-mono font-bold px-3 py-1.5 rounded-md"
          style={{
            background: 'rgba(0,255,65,0.05)',
            color: '#00ff41',
            border: '1px solid rgba(0,255,65,0.12)',
          }}
        >
          <CheckCircle2 size={12} />
          {resolvedCount} RESOLVED
        </div>
        {unresolvedCount > 0 && (
          <div
            className="flex items-center gap-2 text-[10px] font-mono font-bold px-3 py-1.5 rounded-md"
            style={{
              background: 'rgba(255,10,60,0.05)',
              color: '#ff0a3c',
              border: '1px solid rgba(255,10,60,0.12)',
            }}
          >
            <AlertTriangle size={12} />
            {unresolvedCount} ACTIVE
          </div>
        )}
        <div className="ml-auto text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>
          {incidents.length} TOTAL
        </div>
      </div>

      {/* Incident List */}
      <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1" style={{
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(255,255,255,0.05) transparent',
      }}>
        {loading ? (
          <div className="text-center py-12">
            <Activity size={28} className="mx-auto mb-4 animate-pulse" style={{ color: 'rgba(255,10,60,0.2)' }} />
            <p className="text-[11px] font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>
              Scanning for incidents...
            </p>
          </div>
        ) : incidents.length === 0 ? (
          <div className="text-center py-14">
            <ShieldAlert size={40} className="mx-auto mb-4" style={{ color: 'rgba(0,255,65,0.1)' }} />
            <p className="text-sm font-mono font-bold tracking-widest mb-1.5" style={{ color: 'rgba(0,255,65,0.3)' }}>
              ALL SYSTEMS NOMINAL
            </p>
            <p className="text-[11px] font-mono" style={{ color: 'rgba(255,255,255,0.15)' }}>
              No incidents detected. The Shadow Worker is monitoring your APIs.
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {incidents.map((incident, i) => (
              <IncidentCard
                key={incident.id}
                incident={incident}
                isLatest={i === 0}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}
