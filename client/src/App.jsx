import React, { useState, useEffect } from 'react';
import { AuthAPI } from './api';
import Navbar from './components/Navbar';
import CustomerPortal from './components/CustomerPortal';
import AgentPortal from './components/AgentPortal';
import AdminPortal from './components/AdminPortal';
import SystemDesignDocView from './components/SystemDesignDocView';
import { RefreshCw, Shield, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [activeRole, setActiveRole] = useState('admin'); // 'admin', 'customer', 'agent'
  const [activeTab, setActiveTab] = useState('portal'); // 'portal', 'system-design'
  const [user, setUser] = useState(null);
  const [demoUsers, setDemoUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDemoUsers();
  }, []);

  const loadDemoUsers = async () => {
    try {
      const res = await AuthAPI.getDemoUsers();
      setDemoUsers(res.data);
      // Auto login as admin initially
      loginAsRole('admin', res.data);
    } catch (err) {
      console.error('Failed to load demo users', err);
      setLoading(false);
    }
  };

  const loginAsRole = async (role, usersList = demoUsers) => {
    setLoading(true);
    const targetUser = usersList.find(u => u.role === role);
    if (!targetUser) {
      setLoading(false);
      return;
    }

    try {
      const res = await AuthAPI.login(targetUser.email, 'password123');
      localStorage.setItem('delivery_jwt_token', res.data.token);
      setUser(res.data.user);
      setActiveRole(role);
    } catch (err) {
      console.error('Login failed', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchRole = (newRole) => {
    loginAsRole(newRole);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950">
      
      {/* Top Navbar */}
      <Navbar
        activeRole={activeRole}
        demoUsers={demoUsers}
        onSwitchRole={handleSwitchRole}
        activeTab={activeTab}
        onSwitchTab={setActiveTab}
      />

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        
        {loading ? (
          <div className="py-24 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
            <span className="font-semibold text-sm">Authenticating & loading role context...</span>
          </div>
        ) : activeTab === 'system-design' ? (
          <SystemDesignDocView />
        ) : (
          <div>
            {activeRole === 'customer' && <CustomerPortal user={user} />}
            {activeRole === 'agent' && <AgentPortal user={user} />}
            {activeRole === 'admin' && <AdminPortal user={user} />}
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>🚚 Last-Mile Delivery Management Platform</span>
          <span className="text-cyan-400/80">Volumetric Pricing • Zone Detection • Immutable Lifecycle • Auto-Assignment</span>
        </div>
      </footer>

    </div>
  );
}
