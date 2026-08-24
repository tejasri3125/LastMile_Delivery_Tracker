import React, { useState, useEffect } from 'react';
import { OrderAPI } from '../api';
import { Truck, CheckCircle2, Clock, AlertTriangle, MapPin, User, Package, RefreshCw, X, ShieldAlert } from 'lucide-react';

export default function TrackingTimelineModal({ orderId, isOpen, onClose, onOpenReschedule }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && orderId) {
      fetchDetails();
    }
  }, [isOpen, orderId]);

  const fetchDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await OrderAPI.getDetails(orderId);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch tracking history');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const order = data?.order;
  const history = data?.trackingHistory || [];

  const steps = [
    { key: 'CREATED', label: 'Order Placed' },
    { key: 'ASSIGNED', label: 'Agent Assigned' },
    { key: 'PICKED_UP', label: 'Picked Up' },
    { key: 'IN_TRANSIT', label: 'In Transit' },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
    { key: 'DELIVERED', label: 'Delivered' }
  ];

  // Helper to determine step status
  const getStepStatus = (stepKey) => {
    if (!order) return 'upcoming';
    if (order.status === 'FAILED') {
      if (stepKey === 'DELIVERED') return 'failed';
    }
    
    const statusOrder = ['CREATED', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'];
    const currentIndex = statusOrder.indexOf(order.status);
    const stepIndex = statusOrder.indexOf(stepKey);

    if (stepIndex === -1) return 'upcoming';
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'upcoming';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="glass-card w-full max-w-4xl border border-cyan-500/30 overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/40">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Order Tracking #{order?.tracking_number || orderId}
              </h3>
              <p className="text-xs text-slate-400">Live Status & Immutable Lifecycle History</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
              <span>Fetching live order status logs...</span>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-xl text-center">
              {error}
            </div>
          ) : (
            <div className="space-y-8">
              
              {/* Failed Delivery Alert Banner & Reschedule Button */}
              {order.status === 'FAILED' && (
                <div className="p-4 bg-rose-950/70 border border-rose-600/60 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg shadow-rose-950/50">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-rose-200 text-sm">Delivery Attempt Failed</h4>
                      <p className="text-xs text-rose-300/80 mt-0.5">
                        Reason: <span className="font-semibold text-rose-100">{order.reschedule_reason || 'Customer door locked / unreachable'}</span>
                      </p>
                    </div>
                  </div>
                  {onOpenReschedule && (
                    <button
                      onClick={() => { onClose(); onOpenReschedule(order); }}
                      className="px-4 py-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold rounded-xl shadow-md transition-all shrink-0 flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-4 h-4" /> Reschedule Delivery Now
                    </button>
                  )}
                </div>
              )}

              {/* Status Visual Timeline Tracker */}
              <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Delivery Progress Lifecycle</h4>
                
                <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                  {steps.map((step, idx) => {
                    const status = getStepStatus(step.key);
                    return (
                      <div key={step.key} className="flex flex-col items-center text-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mb-2 transition-all ${
                          status === 'completed' ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' :
                          status === 'active' ? 'bg-cyan-500 text-slate-950 ring-4 ring-cyan-500/30 animate-pulse' :
                          status === 'failed' ? 'bg-rose-500 text-white' :
                          'bg-slate-800 text-slate-500 border border-slate-700'
                        }`}>
                          {status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                        </div>
                        <span className={`text-xs font-semibold ${
                          status === 'completed' || status === 'active' ? 'text-white' : 'text-slate-500'
                        }`}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Info Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-slate-400 font-semibold block flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-cyan-400" /> PICKUP LOCATION
                  </span>
                  <p className="text-slate-200 font-medium">{order.pickup_address}</p>
                  <p className="text-slate-400">Pincode: <span className="text-cyan-300 font-bold">{order.pickup_pincode}</span> ({order.pickup_zone_name || 'Zone'})</p>
                </div>

                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-slate-400 font-semibold block flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-400" /> DROP LOCATION
                  </span>
                  <p className="text-slate-200 font-medium">{order.drop_address}</p>
                  <p className="text-slate-400">Pincode: <span className="text-emerald-300 font-bold">{order.drop_pincode}</span> ({order.drop_zone_name || 'Zone'})</p>
                </div>

                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-slate-400 font-semibold block flex items-center gap-1.5">
                    <User className="w-4 h-4 text-amber-400" /> ASSIGNED AGENT
                  </span>
                  {order.agent_name ? (
                    <div>
                      <p className="text-slate-200 font-bold">{order.agent_name}</p>
                      <p className="text-slate-400">Phone: {order.agent_phone || 'N/A'}</p>
                    </div>
                  ) : (
                    <p className="text-amber-400 italic">Unassigned (Awaiting System / Admin Allocation)</p>
                  )}
                </div>
              </div>

              {/* Immutable Tracking History Logs */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" /> Immutable Event Audit Log ({history.length} events logged)
                </h4>

                <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 max-h-64 overflow-y-auto space-y-4">
                  {history.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 border-l-2 border-cyan-500/40 pl-4 py-1">
                      <div className="shrink-0 text-slate-400 text-[11px] font-mono w-28">
                        {new Date(log.timestamp).toLocaleString(undefined, {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            log.status === 'DELIVERED' ? 'bg-emerald-500/20 text-emerald-300' :
                            log.status === 'FAILED' ? 'bg-rose-500/20 text-rose-300' :
                            'bg-cyan-500/20 text-cyan-300'
                          }`}>
                            {log.status}
                          </span>
                          <span className="text-slate-300 text-xs font-semibold">{log.actor_name} ({log.actor_role})</span>
                        </div>
                        {log.notes && <p className="text-xs text-slate-400">{log.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
