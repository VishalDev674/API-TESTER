import StatsCard from './StatsCard';
import { Activity, CheckCircle, Wrench, Zap, AlertOctagon } from 'lucide-react';

export default function BentoGrid({ stats, manualAlerts = [] }) {
  const hasManualAlerts = manualAlerts.length > 0;

  return (
    <div className="bento-grid">
      <StatsCard
        title="Total Pings"
        value={stats.total_pings.toLocaleString()}
        subtitle={`${stats.pings_last_hour} in the last hour`}
        icon={Activity}
        color="cyan"
        delay={0}
      />
      <StatsCard
        title={hasManualAlerts ? "CRITICAL ALERTS" : "Success Rate"}
        value={hasManualAlerts ? manualAlerts.length : `${stats.success_rate}%`}
        subtitle={hasManualAlerts ? 'MANUAL INTERVENTION REQUIRED' : (stats.success_rate >= 99 ? 'All systems nominal' : 'Degraded performance')}
        icon={hasManualAlerts ? AlertOctagon : CheckCircle}
        color={hasManualAlerts ? 'red' : (stats.success_rate >= 95 ? 'green' : stats.success_rate >= 80 ? 'yellow' : 'red')}
        delay={1}
      />
      <StatsCard
        title="Active Heals"
        value={stats.active_heals}
        subtitle={stats.active_heals > 0 ? 'Auto-healing in progress' : 'No active healing'}
        icon={Wrench}
        color={stats.active_heals > 0 ? 'purple' : 'cyan'}
        delay={2}
      />
      <StatsCard
        title="Avg Response"
        value={`${stats.avg_response_ms.toFixed(0)}ms`}
        subtitle={stats.avg_response_ms < 200 ? 'Excellent latency' : 'Elevated latency'}
        icon={Zap}
        color={stats.avg_response_ms < 200 ? 'green' : stats.avg_response_ms < 500 ? 'yellow' : 'red'}
        delay={3}
      />
    </div>
  );
}
