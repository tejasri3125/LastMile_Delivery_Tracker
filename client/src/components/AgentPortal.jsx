import React, { useState, useEffect } from 'react';
import { OrderAPI, AdminAPI } from '../api';
import { Truck, CheckCircle2, AlertTriangle, MapPin, Navigation, Phone, ShieldAlert, RefreshCw, Power } from 'lucide-react';

export default function AgentPortal({ user }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);

  // Failed delivery reason modal state
  const [failingOrderId, setFailingOrderId] = useState(null);
  const [failureReason, setFailureReason] = useState('Customer unavailable / door locked');
  const [customNotes, setCustomNotes] = useState('');

  useEffect(() => {
    fetchAgentOrders();
  }, []);

  const fetchAgentOrders = async () => {
    setLoading(true);
    try {
      const res = await OrderAPI.list();
      setOrders(res.data);
    } catch (err) {
      console.error('Failed to load agent assigned orders', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus, reason = '') => {
    try {
      await OrderAPI.updateStatus(orderId, {
        status: newStatus,
        failureReason: reason,
        notes: reason || `Status updated to ${newStatus}`
      });

      setFailingOrderId(null);
      fetchAgentOrders();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update order status');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Agent Status Bar */}
      <div className="glass-card p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Truck className="w-6 h-6 text-cyan-400" /> Agent Duty Dashboard - {user?.name || 'Agent'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time status updater & customer delivery fulfillment portal.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-800">
            <Power className={`w-4 h-4 ${isAvailable ? 'text-emerald-400' : 'text-slate-500'}`} />
            <span className="text-xs font-semibold text-slate-300">
              Status: <strong className={isAvailable ? 'text-emerald-400' : 'text-slate-400'}>
                {isAvailable ? 'ON DUTY (Available for Auto-Assignment)' : 'OFFLINE'}
              </strong>
            </span>
          </div>
          <button
            onClick={() => setIsAvailable(!isAvailable)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              isAvailable 
                ? 'bg-rose-600/20 text-rose-300 border border-rose-500/40 hover:bg-rose-600/30' 
                : 'bg-emerald-600 text-white hover:bg-emerald-500'
            }`}
          >
            {isAvailable ? 'Go Offline' : 'Go On Duty'}
          </button>
        </div>
      </div>

      {/* Assigned Orders List */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Navigation className="w-5 h-5 text-cyan-400" /> Assigned Deliveries ({orders.length})
          </h3>
          <button 
            onClick={fetchAgentOrders}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 text-xs font-medium flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Tasks
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
            <span>Loading assigned orders...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center text-slate-500 space-y-2">
            <Truck className="w-12 h-12 mx-auto text-slate-700" />
            <p className="text-sm font-medium">No deliveries assigned currently.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {orders.map((order) => (
              <div 
                key={order.id}
                className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-md"
              >
                {/* Header info */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-white text-base">#{order.tracking_number}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      order.status === 'DELIVERED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      order.status === 'FAILED' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                      'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    }`}>
                      {order.status}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-bold">
                      {order.order_type} • {order.payment_type}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 font-semibold">
                    Customer: <span className="text-white">{order.customer_name}</span> ({order.customer_phone || 'No phone'})
                  </div>
                </div>

                {/* Pickup & Drop Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-1">
                    <span className="text-cyan-400 font-bold flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> PICKUP ADDRESS ({order.pickup_pincode})
                    </span>
                    <p className="text-slate-200 font-medium">{order.pickup_address}</p>
                  </div>

                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-1">
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> DROP DESTINATION ({order.drop_pincode})
                    </span>
                    <p className="text-slate-200 font-medium">{order.drop_address}</p>
                  </div>
                </div>

                {/* Status Update Quick Action Controls */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800">
                  <span className="text-xs font-semibold text-slate-400">Update Status Action:</span>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'PICKED_UP')}
                      disabled={order.status === 'DELIVERED' || order.status === 'FAILED'}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold rounded-lg disabled:opacity-40"
                    >
                      Picked Up
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'IN_TRANSIT')}
                      disabled={order.status === 'DELIVERED' || order.status === 'FAILED'}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-300 text-xs font-semibold rounded-lg disabled:opacity-40"
                    >
                      In Transit
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'OUT_FOR_DELIVERY')}
                      disabled={order.status === 'DELIVERED' || order.status === 'FAILED'}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold rounded-lg disabled:opacity-40"
                    >
                      Out for Delivery
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                      disabled={order.status === 'DELIVERED'}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-md shadow-emerald-600/30 flex items-center gap-1 disabled:opacity-40"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Mark Delivered
                    </button>
                    <button
                      onClick={() => setFailingOrderId(order.id)}
                      disabled={order.status === 'DELIVERED' || order.status === 'FAILED'}
                      className="px-3 py-1.5 bg-rose-600/20 text-rose-300 hover:bg-rose-600/40 border border-rose-500/30 text-xs font-bold rounded-lg flex items-center gap-1 disabled:opacity-40"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" /> Flag Failed
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* Flag Failed Delivery Modal */}
      {failingOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="glass-card w-full max-w-md border border-rose-500/30 p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-400" /> Flag Delivery Failure Reason
            </h3>
            
            <div>
              <label className="text-xs text-slate-300 mb-1 block">Reason Category</label>
              <select 
                className="glass-input w-full text-sm"
                value={failureReason}
                onChange={(e) => setFailureReason(e.target.value)}
              >
                <option value="Customer door locked / unreachable">Customer door locked / unreachable</option>
                <option value="Customer refused order delivery">Customer refused order delivery</option>
                <option value="Incorrect or incomplete address">Incorrect or incomplete address</option>
                <option value="Customer requested reschedule">Customer requested reschedule</option>
                <option value="Package damaged / unfit for delivery">Package damaged / unfit for delivery</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-300 mb-1 block">Additional Notes</label>
              <input 
                type="text" 
                className="glass-input w-full text-sm" 
                placeholder="Tried calling customer 3 times..." 
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setFailingOrderId(null)} 
                className="w-1/2 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleUpdateStatus(failingOrderId, 'FAILED', `${failureReason}. ${customNotes}`)}
                className="w-1/2 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/30"
              >
                Confirm Failure Alert
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
