import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

export default function useStats(refreshInterval = 5000) {
  const [stats, setStats] = useState({
    total_pings: 0,
    success_rate: 100,
    active_heals: 0,
    avg_response_ms: 0,
    total_endpoints: 0,
    active_endpoints: 0,
    uptime_percent: 100,
    pings_last_hour: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const data = await api.getStats();
      setStats(data);
      setLoading(false);
    } catch (e) {
      console.error('Failed to fetch stats:', e);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchStats, refreshInterval]);

  return { stats, loading, refresh: fetchStats };
}
