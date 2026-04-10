const API_BASE = '';

const api = {
  // Endpoints
  async getEndpoints() {
    const res = await fetch(`${API_BASE}/api/endpoints/`);
    return res.json();
  },

  async createEndpoint(data) {
    const res = await fetch(`${API_BASE}/api/endpoints/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async updateEndpoint(id, data) {
    const res = await fetch(`${API_BASE}/api/endpoints/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async deleteEndpoint(id) {
    const res = await fetch(`${API_BASE}/api/endpoints/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Dashboard
  async getStats() {
    const res = await fetch(`${API_BASE}/api/dashboard/stats`);
    return res.json();
  },

  async getHistory(limit = 50) {
    const res = await fetch(`${API_BASE}/api/dashboard/history?limit=${limit}`);
    return res.json();
  },

  async getHeals(limit = 50) {
    const res = await fetch(`${API_BASE}/api/dashboard/heals?limit=${limit}`);
    return res.json();
  },

  async getSystemInfo() {
    const res = await fetch(`${API_BASE}/api/dashboard/system`);
    return res.json();
  },

  async startWorker() {
    const res = await fetch(`${API_BASE}/api/dashboard/worker/start`, { method: 'POST' });
    return res.json();
  },

  async stopWorker() {
    const res = await fetch(`${API_BASE}/api/dashboard/worker/stop`, { method: 'POST' });
    return res.json();
  },

  // Stress Test
  async startStressTest(data = {}) {
    const res = await fetch(`${API_BASE}/api/stress/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ concurrency: 500, ...data }),
    });
    return res.json();
  },

  async getStressStatus() {
    const res = await fetch(`${API_BASE}/api/stress/status`);
    return res.json();
  },

  async stopStressTest() {
    const res = await fetch(`${API_BASE}/api/stress/stop`, { method: 'POST' });
    return res.json();
  },

  // Analytics
  async getAnalytics(hours = 24, buckets = 30) {
    const res = await fetch(`${API_BASE}/api/dashboard/analytics?hours=${hours}&buckets=${buckets}`);
    return res.json();
  },
};

export default api;
