import React, { useState, useEffect } from 'react';
import { AuthAPI } from './api';
import Navbar from './components/Navbar';
import CustomerPortal from './components/CustomerPortal';
import AgentPortal from './components/AgentPortal';
import AdminPortal from './components/AdminPortal';
import SystemDesignDocView from './components/SystemDesignDocView';
import { RefreshCw } from 'lucide-react';

const DEFAULT_DEMO_USERS = [
  { id: 1, name: 'Logistics Admin', email: 'admin@logistics.com', role: 'admin', phone: '+18005550199' },
  { id: 2, name: 'Acme Enterprise Solutions', email: 'customer@acme.com', role: 'customer', phone: '+18004443322' },
  { id: 3, name: 'Sarah Jenkins', email: 'sarah@gmail.com', role: 'customer', phone: '+19876543210' },
  { id: 4, name: 'Rajesh Kumar (Agent)', email: 'agent.rajesh@logistics.com', role: 'agent', phone: '+919811122233' }
];

export default function App() {
  const [activeRole, setActiveRole] = useState('admin'); // 'admin', 'customer', 'agent'
  const [activeTab, setActiveTab] = useState('portal'); // 'portal', 'system-design'
  const [user, setUser] = useState(DEFAULT_DEMO_USERS[0]);
  const [demoUsers, setDemoUsers] = useState(DEFAULT_DEMO_USERS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDemoUsers();
  }, []);

  const loadDemoUsers = async () => {
    try {
      const res = await AuthAPI.getDemoUsers();
      if (res.data && res.data.length > 0) {
        setDemoUsers(res.data);
        loginAsRole('admin', res.data);
      }
    } catch (err) {
      console.warn('Network auth sync warning, operating in client interactive mode:', err.message);
      setLoading(false);
    }
  };

  const loginAsRole = async (role, usersList = demoUsers) => {
    const targetUser = usersList.find(u => u.role === role) || DEFAULT_DEMO_USERS.find(u => u.role === role);
    if (targetUser) {
      setUser(targetUser);
      setActiveRole(role);
    }

    try {
      if (targetUser && targetUser.email) {
        const res = await AuthAPI.login(targetUser.email, 'password123');
        if (res.data && res.data.token) {
          localStorage.setItem('delivery_jwt_token', res.data.token);
          setUser(res.data.user);
        }
      }
    } catch (err) {
      console.warn('API login sync warning:', err.message);
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
