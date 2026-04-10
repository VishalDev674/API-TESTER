import { useState, useCallback } from 'react';
import Layout from './components/Layout';
import BentoGrid from './components/BentoGrid';
import AIThoughtStream from './components/AIThoughtStream';
import EndpointManager from './components/EndpointManager';
import HealTimeline from './components/HealTimeline';
import SystemMonitor from './components/SystemMonitor';
import IncidentResponse from './components/IncidentResponse';
import AnalyticsGraph from './components/AnalyticsGraph';
import useWebSocket from './hooks/useWebSocket';
import useStats from './hooks/useStats';

export default function App() {
  const { stats, refresh: refreshStats } = useStats(3000);
  const [thoughts, setThoughts] = useState([]);
  const [systemMetrics, setSystemMetrics] = useState({
    cpu_percent: 0,
    ram_percent: 0,
    ram_used_gb: 0,
    ram_total_gb: 0,
    throttle_level: 'normal',
    shadow_interval: 10,
  });
  const [aiExpanded, setAiExpanded] = useState(false);

  const handleWSMessage = useCallback((msg) => {
    const { channel, data, timestamp } = msg;
    const time = new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    });

    switch (channel) {
      case 'ai_thoughts':
        setThoughts((prev) => {
          const newThought = { ...data, time };
          const updated = [...prev, newThought];
          return updated.slice(-200); // Keep last 200 entries
        });
        break;

      case 'pings':
        refreshStats();
        // Trigger EndpointManager to reload its list
        window.dispatchEvent(new CustomEvent('refresh-endpoints'));
        break;

      case 'system_metrics':
        setSystemMetrics(data);
        break;

      // Stress channels removed — Incident Response panel auto-refreshes via 'refresh-endpoints' event

      case 'heals':
        refreshStats();
        window.dispatchEvent(new CustomEvent('refresh-endpoints'));
        break;

      default:
        break;
    }
  }, [refreshStats]);

  const { connected } = useWebSocket(handleWSMessage);

  return (
    <Layout wsConnected={connected} stats={stats} systemMetrics={systemMetrics}>
      {/* Bento Grid Stats */}
      <section className="mb-8">
        <BentoGrid stats={stats} />
      </section>

      {/* Performance Analytics Graph */}
      <section className="mb-10">
        <AnalyticsGraph />
      </section>

      {/* Incident Response — Full Width (Bigger) */}
      <section className="mb-8">
        <IncidentResponse />
      </section>

      {/* Network Mux + AI Terminal — Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <EndpointManager />
        <AIThoughtStream 
          thoughts={thoughts} 
          expanded={aiExpanded}
          onToggleExpand={setAiExpanded}
        />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <HealTimeline />
        <SystemMonitor metrics={systemMetrics} />
      </div>
    </Layout>
  );
}
