import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit, Globe, Power, PowerOff, ExternalLink } from 'lucide-react';
import api from '../lib/api';

export default function EndpointManager() {
  const [endpoints, setEndpoints] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', url: '', method: 'GET', expected_status: 200 });

  useEffect(() => {
    loadEndpoints();
  }, []);

  useEffect(() => {
    window.addEventListener('refresh-endpoints', loadEndpoints);
    return () => window.removeEventListener('refresh-endpoints', loadEndpoints);
  }, []);

  const loadEndpoints = async () => {
    try {
      const data = await api.getEndpoints();
      setEndpoints(data);
    } catch (e) {
      console.error('Failed to load endpoints:', e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateEndpoint(editingId, form);
      } else {
        await api.createEndpoint(form);
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ name: '', url: '', method: 'GET', expected_status: 200 });
      loadEndpoints();
    } catch (e) {
      console.error('Failed to save endpoint:', e);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this endpoint?')) return;
    try {
      await api.deleteEndpoint(id);
      loadEndpoints();
    } catch (e) {
      console.error('Failed to delete:', e);
    }
  };

  const handleEdit = (ep) => {
    setForm({ name: ep.name, url: ep.url, method: ep.method, expected_status: ep.expected_status });
    setEditingId(ep.id);
    setShowForm(true);
  };

  const handleToggle = async (ep) => {
    try {
      await api.updateEndpoint(ep.id, { is_active: !ep.is_active });
      loadEndpoints();
    } catch (e) {
      console.error('Failed to toggle:', e);
    }
  };

  return (
    <motion.div
      className="glass-card clipped-corner p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
    >
      <div className="flex items-end justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-shadow-cyan/5 border border-shadow-cyan/10">
            <Globe size={20} className="text-shadow-cyan" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-[0.3em] uppercase mb-1">NETWORK MUX</h3>
            <p className="text-[9px] font-mono text-white/30 tracking-[0.2em] uppercase">ACTIVE CHANNELS: 0{endpoints.length}</p>
          </div>
        </div>
        <button
          className="btn-neon flex items-center gap-2.5 text-[10px] py-2 px-6 uppercase font-black tracking-[0.3em] bg-white/[0.02]"
          style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%)' }}
          onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ name: '', url: '', method: 'GET', expected_status: 200 }); }}
        >
          <Plus size={14} />
          REGISTRY
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <motion.form
          className="mb-8 p-6 rounded-lg"
          style={{ background: 'rgba(2,2,3,0.6)', border: '1px solid rgba(167,239,158,0.1)' }}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          onSubmit={handleSubmit}
        >
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input
              className="input-shadow"
              placeholder="Endpoint name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <input
              className="input-shadow"
              placeholder="https://api.example.com/endpoint"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <select
              className="input-shadow"
              value={form.method}
              onChange={(e) => setForm({ ...form, method: e.target.value })}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>
            <input
              className="input-shadow"
              type="number"
              placeholder="Expected status (200)"
              value={form.expected_status}
              onChange={(e) => setForm({ ...form, expected_status: parseInt(e.target.value) })}
            />
            <div className="flex gap-2">
              <button type="submit" className="btn-neon flex-1 text-[10px] transition-all">
                {editingId ? 'UPDATE' : 'SAVE'}
              </button>
              <button
                type="button"
                className="btn-neon btn-danger text-[10px] px-4"
                onClick={() => { setShowForm(false); setEditingId(null); }}
              >
                CANCEL
              </button>
            </div>
          </div>
        </motion.form>
      )}

      {/* Endpoints List */}
      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 pb-2">
        {endpoints.length === 0 ? (
          <div className="text-center py-6 text-shadow-text-dim">
            <Globe size={24} className="mx-auto mb-2 opacity-30" />
            <p className="text-xs font-mono">No endpoints configured. Add one to start monitoring.</p>
          </div>
        ) : (
          endpoints.map((ep) => (
            <motion.div
              key={ep.id}
              className="flex items-center justify-between p-4 group tactical-border bg-white/[0.01]"
              whileHover={{ backgroundColor: 'rgba(167,239,158,0.03)', x: 4 }}
            >
              <div className="flex items-center gap-5 flex-1 min-w-0">
                <div className={`w-2 h-2 shrink-0 ${ep.is_active ? 'bg-shadow-green shadow-[0_0_8px_rgba(57,255,20,0.5)]' : 'bg-shadow-red'}`} 
                  style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-[13px] font-black text-white uppercase tracking-tight">{ep.name}</span>
                    <span className="badge-tactical scale-75 origin-left">{ep.method}</span>
                  </div>
                  <div className="text-[10px] font-mono text-white/30 truncate tracking-tight">{ep.url}</div>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="text-right flex flex-col items-end">
                  <span className={`text-[12px] font-black font-mono leading-none mb-1 ${ep.last_status === ep.expected_status ? 'text-shadow-green' : 'text-shadow-red'}`}>
                    {ep.last_status || '---'}
                  </span>
                  <span className="text-[8px] font-mono text-white/20 uppercase tracking-[0.2em]">STATUS</span>
                </div>
                
                <div className="flex gap-2">
                  <button
                    className="p-2 transition-all hover:bg-white/5 border border-transparent hover:border-white/10"
                    onClick={() => { setEditingId(ep.id); setForm({ ...ep }); setShowForm(true); }}
                  >
                    <Edit size={14} className="text-white/30 hover:text-white" />
                  </button>
                  <button
                    className="p-2 transition-all hover:bg-shadow-red/10 border border-transparent hover:border-shadow-red/20"
                    onClick={() => handleDelete(ep.id)}
                  >
                    <Trash2 size={14} className="text-shadow-red/40 hover:text-shadow-red" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
