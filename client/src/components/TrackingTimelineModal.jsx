import React, { useState, useEffect } from 'react';
import { OrderAPI } from '../api';
import { Truck, CheckCircle2, Clock, MapPin, User, Package, RefreshCw, X, ShieldAlert, PhoneCall } from 'lucide-react';

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
      setError(err?.response?.data?.error || 'Failed to fetch tracking history');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-[#176B4D] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base font-heading flex items-center gap-2">
                Order Tracking #{order?.tracking_number || orderId}
              </h3>
              <p className="text-xs text-emerald-100">Live Status & Immutable Lifecycle History</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-emerald-100 hover:text-white hover:bg-white/10 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="py-16 text-center text-[#667085] flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-8 h-8 animate-spin text-[#176B4D]" />
              <span className="text-xs font-semibold">Fetching status history logs...</span>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 text-[#D9534F] border border-rose-200 rounded-lg text-center text-xs font-medium">
              {error}
            </div>
          ) : (
            <div className="space-y-8">
              
              {/* Failed Delivery Alert Banner */}
              {order?.status === 'FAILED' && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="w-6 h-6 text-[#D9534F] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-[#D9534F] text-sm">Delivery Attempt Failed</h4>
                      <p className="text-xs text-[#1F2933] mt-0.5">
                        Reason: <span className="font-semibold">{order.reschedule_reason || 'Customer door locked / unreachable'}</span>
                      </p>
                    </div>
                  </div>
                  {onOpenReschedule && (
                    <button
                      onClick={() => { onClose(); onOpenReschedule(order); }}
                      className="px-4 py-2 bg-[#D9534F] hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-sm shrink-0 flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-4 h-4" /> Reschedule Delivery Now
                    </button>
                  )}
                </div>
              )}

              {/* Visual Horizontal Timeline */}
              <div className="bg-[#F8FAF7] p-5 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold text-[#667085] uppercase tracking-wider mb-4">Delivery Progress Timeline</h4>
                
                <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                  {steps.map((step, idx) => {
                    const status = getStepStatus(step.key);
                    return (
                      <div key={step.key} className="flex flex-col items-center text-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mb-2 transition-all ${
                          status === 'completed' ? 'bg-[#2E7D5B] text-white shadow-sm' :
                          status === 'active' ? 'bg-[#176B4D] text-white ring-4 ring-[#176B4D]/20 animate-pulse' :
                          status === 'failed' ? 'bg-[#D9534F] text-white' :
                          'bg-white text-slate-400 border border-slate-300'
                        }`}>
                          {status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                        </div>
                        <span className={`text-xs font-semibold ${
                          status === 'completed' || status === 'active' ? 'text-[#1F2933]' : 'text-slate-400'
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
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[#667085] font-semibold block flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#176B4D]" /> PICKUP LOCATION
                  </span>
                  <p className="text-[#1F2933] font-medium">{order?.pickup_address}</p>
                  <p className="text-[#667085]">Pincode: <span className="text-[#176B4D] font-bold">{order?.pickup_pincode}</span> ({order?.pickup_zone_name || 'Zone'})</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[#667085] font-semibold block flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#2E7D5B]" /> DROP LOCATION
                  </span>
                  <p className="text-[#1F2933] font-medium">{order?.drop_address}</p>
                  <p className="text-[#667085]">Pincode: <span className="text-[#2E7D5B] font-bold">{order?.drop_pincode}</span> ({order?.drop_zone_name || 'Zone'})</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[#667085] font-semibold block flex items-center gap-1.5">
                    <User className="w-4 h-4 text-amber-700" /> ASSIGNED AGENT
                  </span>
                  {order?.agent_name ? (
                    <div>
                      <p className="text-[#1F2933] font-bold">{order.agent_name}</p>
                      <p className="text-[#667085]">Phone: {order.agent_phone || 'N/A'}</p>
                    </div>
                  ) : (
                    <p className="text-amber-800 italic font-medium">Unassigned (Awaiting System Dispatch)</p>
                  )}
                </div>
              </div>

              {/* Immutable Tracking Logs */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-[#667085] uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#176B4D]" /> Event Audit Log ({history.length} events recorded)
                </h4>

                <div className="bg-[#F8FAF7] rounded-xl border border-slate-200 p-4 max-h-64 overflow-y-auto space-y-3">
                  {history.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 border-l-2 border-[#176B4D] pl-4 py-1">
                      <div className="shrink-0 text-[#667085] text-[11px] font-mono w-28">
                        {new Date(log.timestamp).toLocaleString(undefined, {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={
                            log.status === 'DELIVERED' ? 'logi-badge-success' :
                            log.status === 'FAILED' ? 'logi-badge-failed' :
                            'logi-badge-forest'
                          }>
                            {log.status}
                          </span>
                          <span className="text-[#1F2933] text-xs font-semibold">{log.actor_name} ({log.actor_role})</span>
                        </div>
                        {log.notes && <p className="text-xs text-[#667085]">{log.notes}</p>}
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
