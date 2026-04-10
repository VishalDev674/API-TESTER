import { useState, useCallback } from 'react';
import Layout from './components/Layout';
import BentoGrid from './components/BentoGrid';
import PingMatrix from './components/PingMatrix';
import AIThoughtStream from './components/AIThoughtStream';
import EndpointManager from './components/EndpointManager';
import HealTimeline from './components/HealTimeline';
import SystemMonitor from './components/SystemMonitor';
import StressControl from './components/StressControl';
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
  const [lastStressPing, setLastStressPing] = useState(null);
  const [stressResult, setStressResult] = useState(null);

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

      case 'stress_ping':
        setLastStressPing(data);
        break;

      case 'stress':
        setStressResult(data);
        if (data.status === 'completed') {
            refreshStats();
            window.dispatchEvent(new CustomEvent('refresh-endpoints'));
        }
        break;

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
      <section className="mb-10">
        <BentoGrid stats={stats} />
      </section>

      {/* Performance Analytics Graph */}
      <section className="mb-10">
        <AnalyticsGraph />
      </section>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-10">
        {/* Left Column - Ping Matrix + Stress Control */}
        <div className="lg:col-span-2 space-y-10">
          <PingMatrix stressPings={lastStressPing} />
          <EndpointManager />
        </div>

        {/* Right Column - AI Stream + System */}
        <div className="space-y-10">
          <AIThoughtStream thoughts={thoughts} />
          <StressControl stressResult={stressResult} />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <HealTimeline />
        <SystemMonitor metrics={systemMetrics} />
      </div>
    </Layout>
  );
}
