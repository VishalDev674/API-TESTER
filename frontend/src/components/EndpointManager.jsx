import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit, Globe, Power, PowerOff, AlertTriangle } from 'lucide-react';
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

  // Check if an endpoint has a failing status
  const isFailing = (ep) => ep.last_status && ep.last_status !== ep.expected_status;

  return (
    <motion.div
      className="glass-card p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
    >
      <div className="flex items-end justify-between mb-7">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-lg border border-white/5" style={{
            background: 'rgba(0, 212, 255, 0.05)',
          }}>
            <Globe size={20} style={{ color: '#00d4ff' }} />
          </div>
          <div className="section-header">
            <h3 className="text-sm font-bold text-white tracking-[0.3em] uppercase mb-0.5">NETWORK MUX</h3>
            <p className="text-[9px] font-mono tracking-[0.2em] uppercase" style={{ color: 'rgba(255,255,255,0.25)' }}>
              ACTIVE CHANNELS: {endpoints.length.toString().padStart(2, '0')}
            </p>
          </div>
        </div>
        <button
          className="btn-neon flex items-center gap-2.5 text-[10px] py-2 px-6 uppercase font-black tracking-[0.3em]"
          onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ name: '', url: '', method: 'GET', expected_status: 200 }); }}
        >
          <Plus size={14} />
          ADD NODE
        </button>
      </div>

      {/* Add/Edit Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            className="mb-8 p-6 rounded-xl relative overflow-hidden"
            style={{ 
              background: 'rgba(2, 2, 5, 0.8)', 
              border: '1px solid rgba(0, 255, 65, 0.2)',
              boxShadow: '0 0 30px rgba(0, 255, 65, 0.05), inset 0 0 20px rgba(0, 0, 0, 0.5)'
            }}
            initial={{ opacity: 0, height: 0, scale: 0.95 }}
            animate={{ opacity: 1, height: 'auto', scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            onSubmit={handleSubmit}
          >
            {/* Form decorative scanline */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.05] grid-lines" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
                <span className="text-[10px] font-mono text-neon-green/60 tracking-[0.2em] uppercase">
                  Node Registration Protocol // 0xAF42
                </span>
                <div className="flex gap-1">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="w-1 h-1 bg-neon-green/30 rounded-full" />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-white/40 uppercase tracking-widest ml-1">Identifier</label>
                  <input
                    className="input-shadow focus:border-neon-green/50 placeholder:text-white/10"
                    placeholder="API_NAME_NODE"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-white/40 uppercase tracking-widest ml-1">Resource Locator</label>
                  <input
                    className="input-shadow focus:border-neon-green/50 placeholder:text-white/10"
                    placeholder="https://uplink.service/v1/data"
                    value={form.url}
                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div className="space-y-1.5 md:col-span-1">
                  <label className="text-[9px] font-mono text-white/40 uppercase tracking-widest ml-1">Method</label>
                  <select
                    className="input-shadow focus:border-neon-green/50 cursor-pointer"
                    value={form.method}
                    onChange={(e) => setForm({ ...form, method: e.target.value })}
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </div>
                <div className="space-y-1.5 md:col-span-1">
                  <label className="text-[9px] font-mono text-white/40 uppercase tracking-widest ml-1">Assertion.Code</label>
                  <input
                    className="input-shadow focus:border-neon-green/50"
                    type="number"
                    placeholder="200"
                    value={form.expected_status}
                    onChange={(e) => setForm({ ...form, expected_status: parseInt(e.target.value) })}
                  />
                </div>
                <div className="flex items-end gap-3 min-w-0 md:col-span-2">
                  <button 
                    type="submit" 
                    className="btn-neon flex-1 text-[10px] font-bold py-3 px-2 whitespace-nowrap transition-all hover:scale-[1.02]"
                  >
                    {editingId ? 'ESTABLISH_LINK' : 'COMMIT NODE'}
                  </button>
                  <button
                    type="button"
                    className="btn-neon btn-danger text-[10px] px-4 py-3 font-bold whitespace-nowrap transition-all hover:scale-[1.02]"
                    onClick={() => { setShowForm(false); setEditingId(null); }}
                  >
                    ABORT
                  </button>
                </div>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Endpoints List */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 pb-2">
        {endpoints.length === 0 ? (
          <div className="text-center py-8">
            <Globe size={28} className="mx-auto mb-2" style={{ color: 'rgba(255,255,255,0.08)' }} />
            <p className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>
              No endpoints configured. Add one to start monitoring.
            </p>
          </div>
        ) : (
          endpoints.map((ep) => {
            const failing = isFailing(ep);
            return (
              <motion.div
                key={ep.id}
                className={`flex items-center justify-between p-4 rounded-lg group border 
                  ${failing ? 'glitch-effect' : ''}
                `}
                style={{
                  background: failing 
                    ? 'rgba(255, 10, 60, 0.03)' 
                    : 'rgba(255, 255, 255, 0.01)',
                  borderColor: failing 
                    ? 'rgba(255, 10, 60, 0.15)' 
                    : 'rgba(255, 255, 255, 0.04)',
                }}
                whileHover={{ 
                  backgroundColor: failing 
                    ? 'rgba(255, 10, 60, 0.06)' 
                    : 'rgba(0, 255, 65, 0.03)', 
                  x: 4 
                }}
                layout
              >
                <div className="flex items-center gap-5 flex-1 min-w-0">
                  {/* Status Indicator */}
                  <div 
                    className="w-2.5 h-2.5 shrink-0 rounded-sm"
                    style={{ 
                      background: ep.is_active 
                        ? (failing ? '#ff0a3c' : '#00ff41') 
                        : 'rgba(255,255,255,0.15)',
                      boxShadow: ep.is_active 
                        ? (failing 
                          ? '0 0 8px rgba(255,10,60,0.5)' 
                          : '0 0 8px rgba(0,255,65,0.5)') 
                        : 'none',
                      clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                    }} 
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-[13px] font-black text-white uppercase tracking-tight">{ep.name}</span>
                      <span className="badge-tactical scale-75 origin-left">{ep.method}</span>
                      {failing && (
                        <AlertTriangle size={12} style={{ color: '#ff0a3c' }} className="animate-pulse" />
                      )}
                    </div>
                    <div className="text-[10px] font-mono truncate tracking-tight" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      {ep.url}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  {/* Status Code */}
                  <div className="text-right flex flex-col items-end">
                    <span 
                      className="text-[12px] font-black font-mono leading-none mb-1"
                      style={{ 
                        color: ep.last_status === ep.expected_status ? '#00ff41' : '#ff0a3c',
                        textShadow: ep.last_status 
                          ? (ep.last_status === ep.expected_status 
                            ? '0 0 8px rgba(0,255,65,0.4)' 
                            : '0 0 8px rgba(255,10,60,0.4)') 
                          : 'none',
                      }}
                    >
                      {ep.last_status || '---'}
                    </span>
                    <span className="text-[8px] font-mono uppercase tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.15)' }}>
                      STATUS
                    </span>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-1.5">
                    <button
                      className="p-2 rounded transition-all hover:bg-white/5 border border-transparent hover:border-white/10"
                      onClick={() => { setEditingId(ep.id); setForm({ ...ep }); setShowForm(true); }}
                    >
                      <Edit size={14} style={{ color: 'rgba(255,255,255,0.25)' }} />
                    </button>
                    <button
                      className="p-2 rounded transition-all hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
                      onClick={() => handleDelete(ep.id)}
                    >
                      <Trash2 size={14} style={{ color: 'rgba(255,10,60,0.35)' }} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
