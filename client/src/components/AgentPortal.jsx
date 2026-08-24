import React, { useState, useEffect } from 'react';
import { OrderAPI } from '../api';
import NavigationMapModal from './NavigationMapModal';
import { Truck, CheckCircle2, MapPin, Navigation, Phone, ShieldAlert, RefreshCw, Power, ArrowRight } from 'lucide-react';

export default function AgentPortal({ user }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);

  // Modals state
  const [selectedOrderForNav, setSelectedOrderForNav] = useState(null);
  const [failingOrderId, setFailingOrderId] = useState(null);
  const [failureReason, setFailureReason] = useState('Customer door locked / unreachable');
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
      alert(err?.response?.data?.error || 'Failed to update order status');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Duty Status Bar */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="logi-badge-amber mb-2 inline-block">DELIVERY AGENT PORTAL</span>
          <h2 className="text-2xl font-bold text-[#1F2933] font-heading flex items-center gap-2">
            <Truck className="w-6 h-6 text-[#176B4D]" /> Agent Duty Dashboard - {user?.name || 'Agent'}
          </h2>
          <p className="text-xs text-[#667085] mt-1">
            Assigned deliveries, turn-by-turn route navigation, and status milestone updates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#F8FAF7] px-3.5 py-2 rounded-lg border border-slate-200">
            <Power className={`w-4 h-4 ${isAvailable ? 'text-[#2E7D5B]' : 'text-slate-400'}`} />
            <span className="text-xs font-semibold text-[#1F2933]">
              Duty Status: <strong className={isAvailable ? 'text-[#176B4D]' : 'text-slate-500'}>
                {isAvailable ? 'ON DUTY (Active Fleet)' : 'OFFLINE'}
              </strong>
            </span>
          </div>
          
          <button
            onClick={() => setIsAvailable(!isAvailable)}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              isAvailable 
                ? 'bg-rose-50 text-[#D9534F] border border-rose-200 hover:bg-rose-100' 
                : 'bg-[#176B4D] text-white hover:bg-[#0F5138]'
            }`}
          >
            {isAvailable ? 'Go Offline' : 'Go On Duty'}
          </button>
        </div>
      </div>

      {/* Assigned Orders List */}
      <div className="logi-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-[#1F2933] font-heading flex items-center gap-2">
            <Navigation className="w-5 h-5 text-[#176B4D]" /> Active Assigned Deliveries ({orders.length})
          </h3>
          <button 
            onClick={fetchAgentOrders}
            className="logi-btn-outline text-xs py-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Tasks
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-[#667085] flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-[#176B4D]" />
            <span className="text-xs font-semibold">Loading assigned deliveries...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center text-[#667085] space-y-2">
            <Truck className="w-12 h-12 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-[#1F2933]">No active deliveries assigned currently.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {orders.map((order) => (
              <div 
                key={order.id}
                className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 shadow-sm hover:border-[#176B4D]/40 transition-all"
              >
                {/* Header Info */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-[#1F2933] text-base">#{order.tracking_number}</span>
                    <span className={
                      order.status === 'DELIVERED' ? 'logi-badge-success' :
                      order.status === 'FAILED' ? 'logi-badge-failed' :
                      'logi-badge-forest'
                    }>
                      {order.status}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] text-[#667085] font-bold">
                      {order.order_type} • {order.payment_type}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    {order.payment_type === 'COD' && (
                      <span className="logi-badge-amber font-bold">
                        COD Collect: ₹{order.total_charge}
                      </span>
                    )}

                    <span className="text-[#667085] font-semibold">
                      Customer: <strong className="text-[#1F2933]">{order.customer_name}</strong>
                    </span>

                    <button
                      onClick={() => setSelectedOrderForNav(order)}
                      className="logi-btn-secondary px-3 py-1.5 text-xs"
                    >
                      <Navigation className="w-3.5 h-3.5" /> Route Map
                    </button>
                  </div>
                </div>

                {/* Pickup & Drop Address Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-[#F8FAF7] p-3 rounded-lg border border-slate-200 space-y-1">
                    <span className="text-[#176B4D] font-bold flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> PICKUP LOCATION ({order.pickup_pincode})
                    </span>
                    <p className="text-[#1F2933] font-medium">{order.pickup_address}</p>
                  </div>

                  <div className="bg-[#F8FAF7] p-3 rounded-lg border border-slate-200 space-y-1">
                    <span className="text-[#2E7D5B] font-bold flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> DROP DESTINATION ({order.drop_pincode})
                    </span>
                    <p className="text-[#1F2933] font-medium">{order.drop_address}</p>
                  </div>
                </div>

                {/* Action Buttons: Picked Up -> In Transit -> Out for Delivery -> Delivered / Failed */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
                  <span className="text-xs font-bold text-[#667085]">Update Delivery Milestone:</span>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'PICKED_UP')}
                      disabled={order.status === 'DELIVERED' || order.status === 'FAILED'}
                      className="logi-btn-outline text-xs py-1.5 disabled:opacity-40"
                    >
                      Picked Up
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(order.id, 'IN_TRANSIT')}
                      disabled={order.status === 'DELIVERED' || order.status === 'FAILED'}
                      className="logi-btn-outline text-xs py-1.5 disabled:opacity-40"
                    >
                      In Transit
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(order.id, 'OUT_FOR_DELIVERY')}
                      disabled={order.status === 'DELIVERED' || order.status === 'FAILED'}
                      className="logi-btn-outline text-xs py-1.5 disabled:opacity-40"
                    >
                      Out for Delivery
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                      disabled={order.status === 'DELIVERED'}
                      className="px-3.5 py-1.5 bg-[#2E7D5B] hover:bg-[#25664A] text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1 disabled:opacity-40"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Delivered
                    </button>

                    <button
                      onClick={() => setFailingOrderId(order.id)}
                      disabled={order.status === 'DELIVERED' || order.status === 'FAILED'}
                      className="px-3 py-1.5 bg-rose-50 text-[#D9534F] border border-rose-200 hover:bg-rose-100 text-xs font-bold rounded-lg flex items-center gap-1 disabled:opacity-40"
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

      {/* Navigation Map Modal */}
      <NavigationMapModal 
        isOpen={!!selectedOrderForNav}
        onClose={() => setSelectedOrderForNav(null)}
        order={selectedOrderForNav}
      />

      {/* Flag Failed Delivery Modal */}
      {failingOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-xl border border-rose-200 p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-[#D9534F] flex items-center gap-2 font-heading">
              <ShieldAlert className="w-5 h-5 text-[#D9534F]" /> Flag Delivery Attempt Failure
            </h3>
            
            <div>
              <label className="text-xs font-semibold text-[#1F2933] mb-1 block">Failure Reason Category</label>
              <select 
                className="logi-input w-full"
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
              <label className="text-xs font-semibold text-[#1F2933] mb-1 block">Additional Notes</label>
              <input 
                type="text" 
                className="logi-input w-full" 
                placeholder="Called customer 3 times..." 
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setFailingOrderId(null)} 
                className="logi-btn-outline w-1/2 text-xs py-2"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleUpdateStatus(failingOrderId, 'FAILED', `${failureReason}. ${customNotes}`)}
                className="w-1/2 py-2 bg-[#D9534F] hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-sm"
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
