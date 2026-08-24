import React from 'react';
import { Truck, ShieldCheck, UserCheck, Cpu, User, Calculator, LogIn, LogOut, ChevronDown, Search } from 'lucide-react';

export default function Navbar({ activeRole, demoUsers, activeUser, onSwitchRole, activeTab, onSwitchTab, onOpenAuth, onOpenCalc }) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Brand Logo & Main Nav */}
        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-start">
          <button 
            onClick={() => { onSwitchTab('home'); }}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="p-2 bg-[#176B4D] group-hover:bg-[#0F5138] rounded-xl shadow-sm text-white transition-colors">
              <Truck className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-[#1F2933] font-heading tracking-tight flex items-center gap-2">
                LogiTrack
              </h1>
              <p className="text-[10px] text-[#176B4D] font-bold tracking-wider uppercase">LAST-MILE LOGISTICS PLATFORM</p>
            </div>
          </button>

          {/* Nav Tabs */}
          <nav className="hidden lg:flex items-center bg-[#F8FAF7] p-1 rounded-lg border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => onSwitchTab('home')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'home' ? 'bg-white text-[#176B4D] font-bold shadow-sm' : 'text-[#667085] hover:text-[#1F2933]'
              }`}
            >
              Home
            </button>

            <button
              onClick={() => { onSwitchTab('portal'); onSwitchRole('customer'); }}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'portal' && activeRole === 'customer' ? 'bg-white text-[#176B4D] font-bold shadow-sm' : 'text-[#667085] hover:text-[#1F2933]'
              }`}
            >
              Customer Portal
            </button>

            <button
              onClick={() => { onSwitchTab('portal'); onSwitchRole('admin'); }}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'portal' && activeRole === 'admin' ? 'bg-white text-[#176B4D] font-bold shadow-sm' : 'text-[#667085] hover:text-[#1F2933]'
              }`}
            >
              Admin Dashboard
            </button>

            <button
              onClick={() => { onSwitchTab('portal'); onSwitchRole('agent'); }}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'portal' && activeRole === 'agent' ? 'bg-white text-[#176B4D] font-bold shadow-sm' : 'text-[#667085] hover:text-[#1F2933]'
              }`}
            >
              Delivery Agent
            </button>

            <button
              onClick={() => onSwitchTab('system-design')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1 ${
                activeTab === 'system-design' ? 'bg-white text-[#176B4D] font-bold shadow-sm' : 'text-[#667085] hover:text-[#1F2933]'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" /> Architecture
            </button>
          </nav>
        </div>

        {/* Quick Action CTAs & Auth Sign In Button */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          
          {/* Quick Rate Calculator Trigger */}
          <button
            onClick={onOpenCalc}
            className="logi-btn-outline text-xs py-2 px-3 hidden sm:flex items-center gap-1.5"
            title="Calculate Delivery Charges"
          >
            <Calculator className="w-3.5 h-3.5 text-[#176B4D]" />
            <span>Calculate Rate</span>
          </button>

          {/* Quick Role Switcher */}
          <div className="flex items-center bg-[#F8FAF7] p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => { onSwitchTab('portal'); onSwitchRole('customer'); }}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
                activeRole === 'customer' && activeTab === 'portal'
                  ? 'bg-[#176B4D] text-white shadow-sm' 
                  : 'text-[#667085] hover:text-[#1F2933]'
              }`}
              title="Switch to Customer Role"
            >
              <User className="w-3.5 h-3.5" /> Customer
            </button>

            <button
              onClick={() => { onSwitchTab('portal'); onSwitchRole('admin'); }}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
                activeRole === 'admin' && activeTab === 'portal'
                  ? 'bg-[#176B4D] text-white shadow-sm' 
                  : 'text-[#667085] hover:text-[#1F2933]'
              }`}
              title="Switch to Admin Role"
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Admin
            </button>

            <button
              onClick={() => { onSwitchTab('portal'); onSwitchRole('agent'); }}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
                activeRole === 'agent' && activeTab === 'portal'
                  ? 'bg-[#176B4D] text-white shadow-sm' 
                  : 'text-[#667085] hover:text-[#1F2933]'
              }`}
              title="Switch to Agent Role"
            >
              <UserCheck className="w-3.5 h-3.5" /> Agent
            </button>
          </div>

          {/* Sign In / Account Button */}
          <button
            onClick={onOpenAuth}
            className="logi-btn-primary py-2 px-3.5 text-xs shadow-sm"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span className="font-bold">
              {activeUser ? activeUser.name.split(' ')[0] : 'Sign In'}
            </span>
          </button>

        </div>

      </div>
    </header>
  );
}
