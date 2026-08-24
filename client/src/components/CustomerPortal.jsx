import React, { useState, useEffect } from 'react';
import { OrderAPI } from '../api';
import RateCalculatorModal from './RateCalculatorModal';
import TrackingTimelineModal from './TrackingTimelineModal';
import RescheduleModal from './RescheduleModal';
import { Plus, Package, MapPin, Calendar, Clock, ArrowRight, RefreshCw, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function CustomerPortal({ user }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCalcModal, setShowCalcModal] = useState(false);
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState(null);
  const [selectedOrderForReschedule, setSelectedOrderForReschedule] = useState(null);

  useEffect(() => {
    fetchCustomerOrders();
  }, []);

  const fetchCustomerOrders = async () => {
    setLoading(true);
    try {
      const res = await OrderAPI.list();
      setOrders(res.data);
    } catch (err) {
      console.error('Failed to load customer orders', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmNewOrder = async (formData, estimate) => {
    try {
      await OrderAPI.create({
        pickupAddress: `${formData.orderType} Pickup Address, ${formData.pickupPincode}`,
        pickupPincode: formData.pickupPincode,
        dropAddress: `${formData.orderType} Drop Destination, ${formData.dropPincode}`,
        dropPincode: formData.dropPincode,
        lengthCm: formData.lengthCm,
        widthCm: formData.widthCm,
        heightCm: formData.heightCm,
        actualWeightKg: formData.actualWeightKg,
        orderType: formData.orderType,
        paymentType: formData.paymentType
      });

      setShowCalcModal(false);
      fetchCustomerOrders();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to place order');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="glass-card p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950/40 border border-slate-700/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            Welcome back, {user?.name || 'Valued Customer'} 👋
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage your B2B & B2C shipments, calculate dynamic charges, and track real-time delivery timelines.
          </p>
        </div>
        <button
          onClick={() => setShowCalcModal(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4 stroke-[3]" /> Create New Order (Auto-Pricing)
        </button>
      </div>

      {/* Orders List */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-cyan-400" /> Your Orders ({orders.length})
          </h3>
          <button 
            onClick={fetchCustomerOrders}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 text-xs font-medium flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh List
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
            <span>Loading your shipment orders...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center text-slate-500 space-y-3">
            <Package className="w-12 h-12 mx-auto text-slate-700" />
            <p className="text-sm font-medium">You haven't placed any delivery orders yet.</p>
            <button
              onClick={() => setShowCalcModal(true)}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl"
            >
              Calculate Rate & Place First Order
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div 
                key={order.id} 
                className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  order.status === 'FAILED' 
                    ? 'bg-rose-950/30 border-rose-600/50 hover:border-rose-500' 
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Order Details */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white text-sm">#{order.tracking_number}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      order.status === 'DELIVERED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      order.status === 'FAILED' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                      order.status === 'RESCHEDULED' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                      'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    }`}>
                      {order.status}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-bold">
                      {order.order_type} • {order.payment_type}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span>Pickup: <strong className="text-slate-200">{order.pickup_pincode}</strong></span>
                    <span>→</span>
                    <span>Drop: <strong className="text-slate-200">{order.drop_pincode}</strong></span>
                    <span>Charge: <strong className="text-cyan-400 font-bold">₹{order.total_charge}</strong></span>
                    <span>Billed Weight: <strong className="text-slate-200">{order.billed_weight_kg}kg</strong></span>
                  </div>

                  {order.status === 'FAILED' && (
                    <p className="text-xs text-rose-400 font-semibold flex items-center gap-1 mt-1">
                      <ShieldAlert className="w-3.5 h-3.5" /> Failure Reason: {order.reschedule_reason || 'Delivery attempt failed'}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {order.status === 'FAILED' && (
                    <button
                      onClick={() => setSelectedOrderForReschedule(order)}
                      className="px-3 py-1.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold rounded-lg shadow-md transition-all flex items-center gap-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Reschedule
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedOrderForTracking(order.id)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-semibold rounded-lg transition-all flex items-center gap-1"
                  >
                    Track Live Timeline <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <RateCalculatorModal 
        isOpen={showCalcModal} 
        onClose={() => setShowCalcModal(false)}
        onConfirm={handleConfirmNewOrder}
      />

      <TrackingTimelineModal
        orderId={selectedOrderForTracking}
        isOpen={!!selectedOrderForTracking}
        onClose={() => setSelectedOrderForTracking(null)}
        onOpenReschedule={(ord) => setSelectedOrderForReschedule(ord)}
      />

      <RescheduleModal
        order={selectedOrderForReschedule}
        isOpen={!!selectedOrderForReschedule}
        onClose={() => setSelectedOrderForReschedule(null)}
        onSuccess={() => fetchCustomerOrders()}
      />

    </div>
  );
}
