import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Trash2, CheckCheck, AlertCircle, Clock, ExternalLink } from 'lucide-react';

export default function NotificationDrawer({ 
  isOpen, 
  onClose, 
  notifications, 
  onClearAll, 
  onMarkRead,
  onClearOne
}) {
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-[400px] z-[101] flex flex-col"
            style={{
              background: 'linear-gradient(135deg, rgba(8, 8, 14, 0.98), rgba(15, 15, 25, 0.98))',
              borderLeft: '1px solid rgba(0, 255, 65, 0.1)',
              boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between relative overflow-hidden">
              {/* Scanline effect */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
              
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-shadow-cyan/5 border border-shadow-cyan/10">
                  <Bell size={18} className="text-shadow-cyan" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white tracking-[0.2em] uppercase">
                    Neural Notifications
                  </h3>
                  <p className="text-[9px] font-mono text-white/30 tracking-widest uppercase">
                    {unreadCount} unread payloads
                  </p>
                </div>
              </div>

              <button 
                onClick={onClose}
                className="p-2 rounded-md hover:bg-white/5 transition-colors text-white/40 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Actions Bar */}
            <div className="px-6 py-3 border-b border-white/5 flex items-center justify-between bg-black/20">
              <button 
                onClick={onMarkRead}
                disabled={unreadCount === 0}
                className="flex items-center gap-2 text-[9px] font-mono font-bold text-shadow-cyan/60 hover:text-shadow-cyan transition-colors disabled:opacity-30 uppercase tracking-widest"
              >
                <CheckCheck size={12} />
                Mark all read
              </button>
              <button 
                onClick={onClearAll}
                disabled={notifications.length === 0}
                className="flex items-center gap-2 text-[9px] font-mono font-bold text-red-500/60 hover:text-red-500 transition-colors disabled:opacity-30 uppercase tracking-widest"
              >
                <Trash2 size={12} />
                Purge All
              </button>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-20">
                  <Bell size={48} className="mb-4" />
                  <p className="text-xs font-mono uppercase tracking-[0.3em]">No alerts in deck</p>
                </div>
              ) : (
                notifications.slice().reverse().map((notif) => (
                  <NotificationCard 
                    key={notif.id} 
                    notif={notif} 
                    onDismiss={() => onClearOne(notif.id)} 
                  />
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/5 bg-black/40 text-[8px] font-mono text-white/20 text-center tracking-[0.2em] uppercase">
              Shadow Thread Monitoring // End of Buffer
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function NotificationCard({ notif, onDismiss }) {
  const isCritical = notif.severity === 'critical';
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`relative group p-4 rounded-lg border transition-all duration-300 ${
        notif.read ? 'bg-white/[0.02] border-white/5' : 'bg-white/[0.04] border-white/10'
      }`}
    >
      {!notif.read && (
        <div className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-shadow-cyan animate-pulse shadow-[0_0_8px_rgba(0,212,255,0.5)]" />
      )}

      <div className="flex gap-4">
        <div className={`mt-1 p-1.5 rounded border ${
          isCritical 
            ? 'bg-red-500/10 border-red-500/20 text-red-500' 
            : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'
        }`}>
          <AlertCircle size={14} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className={`text-[10px] font-black uppercase tracking-widest ${
              isCritical ? 'text-red-400' : 'text-yellow-400'
            }`}>
              {notif.failure_type || 'INCIDENT'}
            </span>
            <span className="text-[8px] font-mono text-white/20">
              {notif.time || new Date(notif.timestamp).toLocaleTimeString()}
            </span>
          </div>

          <h4 className="text-[11px] font-bold text-white mb-1 truncate">
            {notif.endpoint_name}
          </h4>
          
          <p className="text-[10px] text-white/50 font-mono leading-relaxed mb-3">
            {notif.message}
          </p>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => window.open(notif.endpoint_url, '_blank')}
              className="flex items-center gap-1.5 text-[8px] font-mono font-bold text-shadow-cyan/50 hover:text-shadow-cyan transition-colors uppercase tracking-widest"
            >
              <ExternalLink size={10} />
              Verify Link
            </button>
            <div className="w-1 h-1 rounded-full bg-white/10" />
            <button 
              onClick={onDismiss}
              className="text-[8px] font-mono font-bold text-white/20 hover:text-red-400 transition-colors uppercase tracking-widest"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>

      {/* Hover glow */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 pointer-events-none transition-opacity duration-500 rounded-lg ${
        isCritical ? 'shadow-[inset_0_0_20px_rgba(255,10,60,0.5)]' : 'shadow-[inset_0_0_20px_rgba(255,214,10,0.5)]'
      }`} />
    </motion.div>
  );
}
