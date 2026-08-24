import React, { useState, useEffect } from 'react';
import { OrderAPI } from '../api';
import RateCalculatorModal from './RateCalculatorModal';
import TrackingTimelineModal from './TrackingTimelineModal';
import RescheduleModal from './RescheduleModal';
import { Plus, Package, MapPin, Calendar, Clock, ArrowRight, RefreshCw, ShieldAlert, CheckCircle2, Search, Filter } from 'lucide-react';

export default function CustomerPortal({ user, onOpenCalc }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCalcModal, setShowCalcModal] = useState(false);
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState(null);
  const [selectedOrderForReschedule, setSelectedOrderForReschedule] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

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
      alert(err?.response?.data?.error || 'Failed to place order');
    }
  };

  const filteredOrders = orders.filter(o => {
    if (statusFilter && o.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        o.tracking_number.toLowerCase().includes(q) ||
        o.pickup_pincode.includes(q) ||
        o.drop_pincode.includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="bg-[#E7F1EB] p-6 rounded-xl border border-[#176B4D]/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="logi-badge-forest mb-2 inline-block">CUSTOMER PORTAL</span>
          <h2 className="text-2xl font-bold text-[#1F2933] font-heading flex items-center gap-2">
            Welcome back, {user?.name || 'Valued Customer'} 👋
          </h2>
          <p className="text-xs text-[#667085] mt-1">
            Manage your B2B & B2C shipments, calculate dynamic volumetric charges, and track real-time delivery timelines.
          </p>
        </div>
        
        <button
          onClick={() => setShowCalcModal(true)}
          className="logi-btn-primary px-5 py-2.5 shadow-md shadow-[#176B4D]/20 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" /> Create New Delivery
        </button>
      </div>

      {/* Orders List Container */}
      <div className="logi-card p-6 space-y-4">
        
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <h3 className="text-base font-bold text-[#1F2933] font-heading flex items-center gap-2">
            <Package className="w-5 h-5 text-[#176B4D]" /> Active & Recent Shipments ({filteredOrders.length})
          </h3>

          {/* Search & Refresh */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input 
                type="text"
                placeholder="Search tracking # or pincode..."
                className="logi-input w-full pl-9 py-1.5 text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              className="logi-input text-xs py-1.5"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="CREATED">CREATED</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="PICKED_UP">PICKED_UP</option>
              <option value="IN_TRANSIT">IN_TRANSIT</option>
              <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="FAILED">FAILED</option>
              <option value="RESCHEDULED">RESCHEDULED</option>
            </select>

            <button 
              onClick={fetchCustomerOrders}
              className="logi-btn-outline text-xs py-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>

        {/* List Content */}
        {loading ? (
          <div className="py-16 text-center text-[#667085] flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-[#176B4D]" />
            <span className="text-xs font-semibold">Loading shipment orders...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center text-[#667085] space-y-3">
            <Package className="w-12 h-12 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-[#1F2933]">No shipments found.</p>
            <p className="text-xs text-[#667085]">Calculate delivery rate and place your first shipment!</p>
            <button
              onClick={() => setShowCalcModal(true)}
              className="logi-btn-primary mx-auto text-xs px-4 py-2"
            >
              Calculate Rate & Place Order
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <div 
                key={order.id} 
                className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  order.status === 'FAILED' 
                    ? 'bg-rose-50/50 border-rose-200' 
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Order Details */}
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-[#1F2933] text-sm">#{order.tracking_number}</span>
                    <span className={
                      order.status === 'DELIVERED' ? 'logi-badge-success' :
                      order.status === 'FAILED' ? 'logi-badge-failed' :
                      order.status === 'RESCHEDULED' ? 'logi-badge-amber' :
                      'logi-badge-forest'
                    }>
                      {order.status}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] text-[#667085] font-bold">
                      {order.order_type} • {order.payment_type}
                    </span>
                  </div>

                  <div className="text-xs text-[#667085] flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span>Pickup: <strong className="text-[#1F2933]">{order.pickup_pincode}</strong></span>
                    <span>→</span>
                    <span>Drop: <strong className="text-[#1F2933]">{order.drop_pincode}</strong></span>
                    <span>Charge: <strong className="text-[#176B4D] font-bold">₹{order.total_charge}</strong></span>
                    <span>Billed Weight: <strong className="text-[#1F2933]">{order.billed_weight_kg}kg</strong></span>
                  </div>

                  {order.status === 'FAILED' && (
                    <p className="text-xs text-[#D9534F] font-semibold flex items-center gap-1 mt-1">
                      <ShieldAlert className="w-3.5 h-3.5" /> Failure Reason: {order.reschedule_reason || 'Delivery attempt failed'}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {order.status === 'FAILED' && (
                    <button
                      onClick={() => setSelectedOrderForReschedule(order)}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1 shadow-sm"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Reschedule
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedOrderForTracking(order.id)}
                    className="logi-btn-outline text-xs py-1.5"
                  >
                    Track Timeline <ArrowRight className="w-3.5 h-3.5 text-[#176B4D]" />
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
