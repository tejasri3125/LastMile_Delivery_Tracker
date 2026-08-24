import React, { useState, useEffect } from 'react';
import { AdminAPI } from '../api';
import { Mail, MessageSquare, RefreshCw, Clock, CheckCircle2 } from 'lucide-react';

export default function NotificationSandbox() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
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
    <div className="logi-card p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#E7F1EB] text-[#176B4D] rounded-lg">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#1F2933] font-heading">Live Notification Sandbox Logs</h3>
            <p className="text-xs text-[#667085]">Real-time Email & SMS Customer Dispatch Logs</p>
          </div>
        </div>
        <button 
          onClick={fetchLogs} 
          className="logi-btn-outline text-xs py-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
        {logs.length === 0 ? (
          <div className="py-8 text-center text-[#667085] text-xs">
            No notifications dispatched yet. Change an order status to generate live email/SMS logs!
          </div>
        ) : (
          logs.map((item) => (
            <div key={item.id} className="bg-[#F8FAF7] p-3.5 rounded-lg border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <span className={item.channel === 'EMAIL' ? 'logi-badge-forest' : 'logi-badge-success'}>
                    {item.channel}
                  </span>
                  <span className="font-semibold text-[#1F2933]">
                    To: {item.recipient_email || item.recipient_phone}
                  </span>
                </div>
                <span className="text-[11px] text-[#667085] font-mono">
                  {new Date(item.timestamp).toLocaleString()}
                </span>
              </div>

              {item.subject && (
                <p className="font-bold text-[#176B4D] text-xs">{item.subject}</p>
              )}
              
              <p className="text-[#1F2933] whitespace-pre-line text-xs font-mono bg-white p-2.5 rounded border border-slate-200">
                {item.body}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
