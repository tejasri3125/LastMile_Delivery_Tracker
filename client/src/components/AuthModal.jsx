import React, { useState } from 'react';
import { LogIn, UserCheck, ShieldCheck, User, X, Check, ArrowRight, Lock, Mail } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, demoUsers, activeUser, onSelectUser, onLogout }) {
  const [selectedRole, setSelectedRole] = useState('customer'); // 'customer', 'admin', 'agent'
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  if (!isOpen) return null;

  const handleCustomLogin = (e) => {
    e.preventDefault();
    setAuthError('');
    const match = demoUsers.find(u => u.email.toLowerCase() === emailInput.trim().toLowerCase());
    if (match) {
      onSelectUser(match);
      onClose();
    } else {
      setAuthError('User not found. Please select one of the registered role accounts below.');
    }
  };

  const handleDemoSelect = (user) => {
    onSelectUser(user);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-md rounded-xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-[#176B4D] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-lg">
              <LogIn className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base font-heading">Sign In to LogiTrack</h3>
              <p className="text-xs text-emerald-100">Select role or login with credentials</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-emerald-100 hover:text-white hover:bg-white/10 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          
          {/* Current Active Account Status */}
          {activeUser && (
            <div className="p-3.5 bg-[#E7F1EB] rounded-lg border border-[#176B4D]/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#176B4D] text-white flex items-center justify-center font-bold text-sm">
                  {activeUser.name.charAt(0)}
                </div>
                <div>
                  <p className="text-xs text-[#667085]">Currently signed in as:</p>
                  <p className="text-sm font-bold text-[#1F2933]">{activeUser.name}</p>
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-[#176B4D]">
                    {activeUser.role} Account
                  </span>
                </div>
              </div>
              <button
                onClick={() => { onLogout(); }}
                className="text-xs font-semibold text-[#D9534F] hover:underline"
              >
                Sign Out
              </button>
            </div>
          )}

          {/* Custom Login Form */}
          <form onSubmit={handleCustomLogin} className="space-y-3.5">
            {authError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-[#D9534F] text-xs rounded-lg font-medium">
                {authError}
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-[#1F2933] mb-1 block">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input 
                  type="email" 
                  className="logi-input w-full pl-9" 
                  placeholder="e.g. admin@logistics.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#1F2933] mb-1 block">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input 
                  type="password" 
                  className="logi-input w-full pl-9" 
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit"
              className="logi-btn-primary w-full py-2.5 mt-1"
            >
              Sign In to Portal <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Sign-In Selector */}
          <div className="pt-2 border-t border-slate-200">
            <p className="text-xs font-bold text-[#667085] uppercase tracking-wider mb-3">
              Or 1-Click Instant Demo Login:
            </p>

            <div className="space-y-2">
              {demoUsers.map((u) => {
                const isSelected = activeUser?.id === u.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => handleDemoSelect(u)}
                    className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between ${
                      isSelected 
                        ? 'bg-[#E7F1EB] border-[#176B4D] ring-1 ring-[#176B4D]' 
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                        u.role === 'agent' ? 'bg-amber-100 text-amber-800' :
                        'bg-emerald-100 text-[#176B4D]'
                      }`}>
                        {u.role === 'admin' ? <ShieldCheck className="w-4 h-4" /> :
                         u.role === 'agent' ? <UserCheck className="w-4 h-4" /> :
                         <User className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#1F2933]">{u.name}</p>
                        <p className="text-[11px] text-[#667085]">{u.email} • <span className="uppercase font-semibold">{u.role}</span></p>
                      </div>
                    </div>

                    {isSelected ? (
                      <span className="w-5 h-5 rounded-full bg-[#176B4D] text-white flex items-center justify-center text-xs">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-[#176B4D] hover:underline">Select →</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
