import React, { useState, useEffect } from 'react';
import { AdminAPI } from '../api';
import { Mail, MessageSquare, RefreshCw, Clock, CheckCircle2 } from 'lucide-react';

export default function NotificationSandbox() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000); // auto refresh every 5s
    return () => clearInterval(interval);
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await AdminAPI.getNotifications();
      setLogs(res.data);
    } catch (err) {
      console.error('Failed to load notification logs', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/40">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Live Notification Sandbox Logs</h3>
            <p className="text-xs text-slate-400">Real-time Email & SMS Customer Alerts Dispatcher</p>
          </div>
        </div>
        <button 
          onClick={fetchLogs} 
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
        {logs.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            No notifications dispatched yet. Change order status to generate live email/SMS logs!
          </div>
        ) : (
          logs.map((item) => (
            <div key={item.id} className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold flex items-center gap-1 ${
                    item.channel === 'EMAIL' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {item.channel === 'EMAIL' ? <Mail className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                    {item.channel}
                  </span>
                  <span className="font-semibold text-slate-200">
                    To: {item.recipient_email || item.recipient_phone}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">
                  {new Date(item.timestamp).toLocaleString()}
                </span>
              </div>

              {item.subject && (
                <p className="font-bold text-cyan-300 text-xs">{item.subject}</p>
              )}
              
              <p className="text-slate-300 whitespace-pre-line text-xs font-mono bg-slate-950/60 p-2.5 rounded-lg border border-slate-900">
                {item.body}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
