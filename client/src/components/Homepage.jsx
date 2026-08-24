import React, { useState } from 'react';
import { 
  Truck, Package, Search, Calculator, ShieldCheck, MapPin, 
  ArrowRight, Clock, CheckCircle2, Navigation, Layers, Zap, PhoneCall
} from 'lucide-react';

export default function Homepage({ onOpenCalc, onTrackOrder, onNavigateRole }) {
  const [trackingInput, setTrackingInput] = useState('');

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    if (trackingInput.trim()) {
      onTrackOrder(trackingInput.trim());
    }
  };

  return (
    <div className="space-y-12 pb-8">
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-white via-[#F8FAF7] to-[#E7F1EB]/50 rounded-2xl border border-slate-200/90 p-6 md:p-10 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Headlines & CTAs */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#E7F1EB] border border-[#176B4D]/30 rounded-full text-[#176B4D] text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#176B4D] animate-ping" />
              Real-Time Last-Mile Logistics Infrastructure
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl md:text-5xl font-extrabold text-[#1F2933] font-heading tracking-tight leading-tight">
                Deliver Smarter. <br />
                <span className="text-[#176B4D]">Track Everything.</span>
              </h1>
              <p className="text-base text-[#667085] leading-relaxed max-w-xl font-normal">
                Enterprise-grade last-mile delivery management platform. Volumetric price estimation, dynamic zone detection, immutable lifecycle event auditing, and automated agent fleet dispatching.
              </p>
            </div>

            {/* Primary CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button 
                onClick={onOpenCalc}
                className="logi-btn-primary px-6 py-3 text-base shadow-md shadow-[#176B4D]/20"
              >
                <Calculator className="w-5 h-5" /> Create a Delivery
              </button>

              <button 
                onClick={() => {
                  const el = document.getElementById('hero-tracker');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="logi-btn-secondary px-6 py-3 text-base"
              >
                <Search className="w-5 h-5 text-[#176B4D]" /> Track Order
              </button>
            </div>

            {/* Quick Track Input Bar */}
            <div id="hero-tracker" className="pt-4 border-t border-slate-200/80">
              <p className="text-xs font-bold text-[#667085] uppercase tracking-wider mb-2">
                Instant Shipment Lookup:
              </p>
              <form onSubmit={handleTrackSubmit} className="flex gap-2 max-w-md">
                <input 
                  type="text" 
                  className="logi-input flex-1 text-sm font-mono" 
                  placeholder="Enter Tracking # (e.g. TRK-849201)"
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value)}
                  required
                />
                <button type="submit" className="logi-btn-primary px-4 text-xs font-bold shrink-0">
                  Track <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200/80 text-xs">
              <div>
                <span className="block font-bold text-lg text-[#176B4D] font-heading">99.8%</span>
                <span className="text-[#667085]">On-Time Fulfillment</span>
              </div>
              <div>
                <span className="block font-bold text-lg text-[#176B4D] font-heading">&lt; 3.2s</span>
                <span className="text-[#667085]">Auto Dispatch Time</span>
              </div>
              <div>
                <span className="block font-bold text-lg text-[#176B4D] font-heading">100%</span>
                <span className="text-[#667085]">Audited Lifecycle</span>
              </div>
            </div>
          </div>

          {/* Right Column: Realistic Delivery Illustration & Interactive Route Map */}
          <div className="lg:col-span-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xl space-y-4">
              
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#2E7D5B] animate-pulse" />
                  <span className="text-xs font-bold text-[#1F2933] uppercase tracking-wider">
                    Live Dispatch Route #TRK-849201
                  </span>
                </div>
                <span className="logi-badge-forest">OUT FOR DELIVERY</span>
              </div>

              {/* Vector Map Graphic Canvas */}
              <div className="relative bg-[#F8FAF7] rounded-xl border border-slate-200 p-4 h-64 overflow-hidden flex flex-col justify-between">
                
                {/* Simulated Grid Road Network SVG */}
                <svg className="absolute inset-0 w-full h-full text-slate-200 opacity-60" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
                  <line x1="10%" y1="20%" x2="90%" y2="20%" stroke="currentColor" strokeWidth="3" strokeDasharray="6 4" />
                  <line x1="90%" y1="20%" x2="90%" y2="80%" stroke="currentColor" strokeWidth="3" strokeDasharray="6 4" />
                  <line x1="10%" y1="80%" x2="90%" y2="80%" stroke="currentColor" strokeWidth="3" />
                  <path d="M 40 50 Q 150 150 280 120" stroke="#176B4D" strokeWidth="4" fill="none" strokeDasharray="4 2" />
                </svg>

                {/* Pickup Node Marker */}
                <div className="relative z-10 flex items-center justify-between text-xs bg-white/95 p-2.5 rounded-lg border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#E7F1EB] text-[#176B4D] flex items-center justify-center">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-[#1F2933]">Hub Zone North (110001)</p>
                      <p className="text-[11px] text-[#667085]">Picked up at 09:15 AM</p>
                    </div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-[#2E7D5B]" />
                </div>

                {/* Moving Driver Vehicle Badge */}
                <div className="relative z-10 self-center bg-[#176B4D] text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 text-xs font-bold animate-bounce">
                  <Truck className="w-4 h-4" />
                  <span>Rajesh K. (Agent) • 1.2 km away</span>
                </div>

                {/* Destination Drop Marker */}
                <div className="relative z-10 flex items-center justify-between text-xs bg-white/95 p-2.5 rounded-lg border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-amber-50 text-amber-800 flex items-center justify-center">
                      <Navigation className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-[#1F2933]">Connaught Place Drop (110002)</p>
                      <p className="text-[11px] text-[#667085]">Estimated Arrival: <strong className="text-[#176B4D]">10:45 AM</strong></p>
                    </div>
                  </div>
                  <span className="logi-badge-amber">COD ₹450</span>
                </div>

              </div>

              {/* Package Card Details */}
              <div className="bg-[#E7F1EB]/60 p-3 rounded-lg border border-[#176B4D]/20 text-xs flex justify-between items-center">
                <div>
                  <span className="text-[#667085] block">Package Dimensions:</span>
                  <span className="font-bold text-[#1F2933]">35 × 25 × 20 cm (Billed 3.5 kg)</span>
                </div>
                <div className="text-right">
                  <span className="text-[#667085] block">Total Charge:</span>
                  <span className="font-extrabold text-[#176B4D] text-sm">₹210.00</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Main Features Grid */}
      <div className="space-y-4">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <h2 className="text-2xl font-bold text-[#1F2933] font-heading">Complete Logistics Management Core</h2>
          <p className="text-xs text-[#667085]">Designed for enterprise transparency, speed, and real-world operational reliability.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          <div className="logi-card p-5 space-y-2">
            <div className="w-10 h-10 rounded-lg bg-[#E7F1EB] text-[#176B4D] flex items-center justify-center">
              <Calculator className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-[#1F2933]">Volumetric Price Engine</h3>
            <p className="text-xs text-[#667085]">
              Automatic IATA volumetric calculation <code className="text-[#176B4D] font-mono">(L×W×H)/5000</code> with transparent base freight and COD surcharges.
            </p>
          </div>

          <div className="logi-card p-5 space-y-2">
            <div className="w-10 h-10 rounded-lg bg-[#E7F1EB] text-[#176B4D] flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-[#1F2933]">Dynamic Zone Detection</h3>
            <p className="text-xs text-[#667085]">
              Instant postal code lookup detecting intra-zone and inter-zone delivery scopes without hardcoded region strings.
            </p>
          </div>

          <div className="logi-card p-5 space-y-2">
            <div className="w-10 h-10 rounded-lg bg-[#E7F1EB] text-[#176B4D] flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-[#1F2933]">Auto-Assignment Fleet</h3>
            <p className="text-xs text-[#667085]">
              Intelligent workload balancer matching active on-duty delivery agents based on geographical hub proximity.
            </p>
          </div>

          <div className="logi-card p-5 space-y-2">
            <div className="w-10 h-10 rounded-lg bg-[#E7F1EB] text-[#176B4D] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-[#1F2933]">Immutable Event Audit</h3>
            <p className="text-xs text-[#667085]">
              Full timestamped tracking logs, failed attempt handling, and automated customer SMS/Email alerts.
            </p>
          </div>

        </div>
      </div>

      {/* Role Navigation Quick Access Banners */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-sm">
        <h3 className="font-bold text-[#1F2933] text-base font-heading">Explore Platform Interfaces by Role</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <button 
            onClick={() => onNavigateRole('customer')}
            className="p-4 rounded-xl border border-slate-200 hover:border-[#176B4D] bg-[#F8FAF7] hover:bg-white text-left transition-all space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <span className="logi-badge-forest">CUSTOMER PORTAL</span>
              <ArrowRight className="w-4 h-4 text-[#176B4D] group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="font-bold text-[#1F2933] text-sm">Place Shipments & Track Live</p>
            <p className="text-xs text-[#667085]">Create orders with instant volumetric pricing, manage active deliveries, and reschedule attempts.</p>
          </button>

          <button 
            onClick={() => onNavigateRole('admin')}
            className="p-4 rounded-xl border border-slate-200 hover:border-[#176B4D] bg-[#F8FAF7] hover:bg-white text-left transition-all space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200 text-xs font-semibold">ADMIN DASHBOARD</span>
              <ArrowRight className="w-4 h-4 text-purple-700 group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="font-bold text-[#1F2933] text-sm">Operations & Matrix Control</p>
            <p className="text-xs text-[#667085]">Monitor revenue, manage rate cards, define pincode zones, override assignments, and view dispatch logs.</p>
          </button>

          <button 
            onClick={() => onNavigateRole('agent')}
            className="p-4 rounded-xl border border-slate-200 hover:border-[#176B4D] bg-[#F8FAF7] hover:bg-white text-left transition-all space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <span className="logi-badge-amber">DELIVERY AGENT</span>
              <ArrowRight className="w-4 h-4 text-amber-800 group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="font-bold text-[#1F2933] text-sm">Fulfillment & Status Updates</p>
            <p className="text-xs text-[#667085]">View assigned deliveries, navigate turn-by-turn routes, update status milestones, and flag failure reasons.</p>
          </button>

        </div>
      </div>

    </div>
  );
}
