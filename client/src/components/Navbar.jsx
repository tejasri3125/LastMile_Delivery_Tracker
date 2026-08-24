import React from 'react';
import { Truck, ShieldCheck, UserCheck, Cpu, User } from 'lucide-react';

export default function Navbar({ activeRole, demoUsers, onSwitchRole, activeTab, onSwitchTab }) {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Brand Logo & Navigation */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-cyan-600 to-blue-600 rounded-xl shadow-lg shadow-cyan-500/20 text-white">
              <Truck className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
                Last-Mile Delivery Tracker
              </h1>
              <p className="text-[11px] text-cyan-400 font-semibold tracking-wider">LOGISTICS MANAGEMENT PLATFORM</p>
            </div>
          </div>

          {/* View Switcher: Portal vs System Architecture Writeup */}
          <div className="hidden sm:flex items-center bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => onSwitchTab('portal')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === 'portal' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              Interactive Portal
            </button>
            <button
              onClick={() => onSwitchTab('system-design')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'system-design' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" /> System Design Write-Up
            </button>
          </div>
        </div>

        {/* Quick Role Switcher Bar */}
        <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 shadow-inner">
          <span className="text-[11px] text-slate-400 font-bold px-2 hidden sm:inline">Role Switcher:</span>

          <button
            onClick={() => onSwitchRole('admin')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeRole === 'admin' 
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/30' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Admin
          </button>

          <button
            onClick={() => onSwitchRole('customer')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeRole === 'customer' 
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/30' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <User className="w-3.5 h-3.5" /> Customer
          </button>

          <button
            onClick={() => onSwitchRole('agent')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeRole === 'agent' 
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/30' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" /> Agent
          </button>
        </div>

      </div>
    </header>
  );
}
