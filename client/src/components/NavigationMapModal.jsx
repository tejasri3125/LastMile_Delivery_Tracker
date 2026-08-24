import React from 'react';
import { Navigation, MapPin, Phone, CheckCircle2, Clock, Truck, X, ArrowUpRight, ShieldCheck } from 'lucide-react';

export default function NavigationMapModal({ isOpen, onClose, order }) {
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-[#176B4D] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Navigation className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base font-heading">Turn-by-Turn Delivery Route</h3>
              <p className="text-xs text-emerald-100">Order #{order.tracking_number} • Customer: {order.customer_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-emerald-100 hover:text-white hover:bg-white/10 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          
          {/* Top Quick Stats */}
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-[#E7F1EB] rounded-lg border border-[#176B4D]/20">
              <span className="text-[#667085] block">Route Distance:</span>
              <span className="font-extrabold text-[#176B4D] text-sm">4.8 km</span>
            </div>
            <div className="p-3 bg-[#E7F1EB] rounded-lg border border-[#176B4D]/20">
              <span className="text-[#667085] block">Estimated ETA:</span>
              <span className="font-extrabold text-[#176B4D] text-sm">14 mins</span>
            </div>
            <div className="p-3 bg-[#E7F1EB] rounded-lg border border-[#176B4D]/20">
              <span className="text-[#667085] block">Traffic Condition:</span>
              <span className="font-extrabold text-[#2E7D5B] text-sm">Optimal / Clear</span>
            </div>
          </div>

          {/* Map Vector Mock */}
          <div className="relative bg-[#F8FAF7] rounded-xl border border-slate-200 p-4 h-56 flex flex-col justify-between overflow-hidden">
            <svg className="absolute inset-0 w-full h-full text-slate-200 opacity-60" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
              <circle cx="50" cy="40" r="15" fill="#C5DEC9" opacity="0.5" />
              <path d="M 50 40 L 220 70 L 400 160" stroke="#176B4D" strokeWidth="5" fill="none" strokeDasharray="6 3" />
            </svg>

            {/* Origin Node */}
            <div className="relative z-10 bg-white/95 p-2 rounded-lg border border-slate-200 shadow-sm max-w-xs text-xs flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#E7F1EB] text-[#176B4D] flex items-center justify-center font-bold">A</div>
              <div>
                <p className="font-bold text-[#1F2933]">Pickup Node ({order.pickup_pincode})</p>
                <p className="text-[11px] text-[#667085] truncate max-w-[200px]">{order.pickup_address}</p>
              </div>
            </div>

            {/* Vehicle Indicator */}
            <div className="relative z-10 self-center bg-[#176B4D] text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-md flex items-center gap-1.5">
              <Truck className="w-4 h-4 animate-bounce" /> Current Location En Route
            </div>

            {/* Destination Node */}
            <div className="relative z-10 self-end bg-white/95 p-2 rounded-lg border border-slate-200 shadow-sm max-w-xs text-xs flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold">B</div>
              <div>
                <p className="font-bold text-[#1F2933]">Drop Destination ({order.drop_pincode})</p>
                <p className="text-[11px] text-[#667085] truncate max-w-[200px]">{order.drop_address}</p>
              </div>
            </div>
          </div>

          {/* Customer Call & Details Bar */}
          <div className="p-3 bg-[#E7F1EB] rounded-lg border border-[#176B4D]/20 flex items-center justify-between text-xs">
            <div>
              <p className="font-bold text-[#1F2933]">Customer: {order.customer_name}</p>
              <p className="text-[#667085]">Phone: {order.customer_phone || '+1 800-555-0199'}</p>
            </div>
            <a 
              href={`tel:${order.customer_phone || '+18005550199'}`}
              className="logi-btn-primary px-3 py-1.5 text-xs"
            >
              <Phone className="w-3.5 h-3.5" /> Call Customer
            </a>
          </div>

          {/* Turn Directions */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-[#667085] uppercase tracking-wider">Turn-by-Turn Navigation Steps</h4>
            <div className="space-y-1.5 text-xs text-[#1F2933]">
              <div className="p-2 bg-white rounded border border-slate-200 flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-[#176B4D]" /> Head North on Ring Road towards Zone Hub (1.2 km)
              </div>
              <div className="p-2 bg-white rounded border border-slate-200 flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-[#176B4D]" /> Turn right onto Main Commercial Highway (2.1 km)
              </div>
              <div className="p-2 bg-white rounded border border-slate-200 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#2E7D5B]" /> Arrive at Drop Address: {order.drop_address}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
