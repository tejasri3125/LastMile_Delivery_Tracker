import React, { useState, useEffect } from 'react';
import { AuthAPI, OrderAPI } from './api';
import Navbar from './components/Navbar';
import Homepage from './components/Homepage';
import CustomerPortal from './components/CustomerPortal';
import AgentPortal from './components/AgentPortal';
import AdminPortal from './components/AdminPortal';
import SystemDesignDocView from './components/SystemDesignDocView';
import RateCalculatorModal from './components/RateCalculatorModal';
import TrackingTimelineModal from './components/TrackingTimelineModal';
import AuthModal from './components/AuthModal';
import { RefreshCw, Truck } from 'lucide-react';

const DEFAULT_DEMO_USERS = [
  { id: 1, name: 'Logistics Admin', email: 'admin@logistics.com', role: 'admin', phone: '+18005550199' },
  { id: 2, name: 'Acme Enterprise Solutions', email: 'customer@acme.com', role: 'customer', phone: '+18004443322' },
  { id: 3, name: 'Sarah Jenkins', email: 'sarah@gmail.com', role: 'customer', phone: '+19876543210' },
  { id: 4, name: 'Rajesh Kumar (Agent)', email: 'agent.rajesh@logistics.com', role: 'agent', phone: '+919811122233' }
];

export default function App() {
  const [activeRole, setActiveRole] = useState('customer'); // 'customer', 'admin', 'agent'
  const [activeTab, setActiveTab] = useState('home'); // 'home', 'portal', 'system-design'
  const [user, setUser] = useState(DEFAULT_DEMO_USERS[1]); // Default to Acme customer
  const [demoUsers, setDemoUsers] = useState(DEFAULT_DEMO_USERS);
  const [loading, setLoading] = useState(false);

  // Global Modal States
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCalcModal, setShowCalcModal] = useState(false);
  const [trackedOrderId, setTrackedOrderId] = useState(null);

  useEffect(() => {
    loadDemoUsers();
  }, []);

  const loadDemoUsers = async () => {
    try {
      const res = await AuthAPI.getDemoUsers();
      if (res.data && res.data.length > 0) {
        setDemoUsers(res.data);
      }
    } catch (err) {
      console.warn('Network auth sync warning, operating in client interactive mode:', err.message);
    } finally {
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
    }
  };

  const handleSelectUser = (selectedUser) => {
    setUser(selectedUser);
    setActiveRole(selectedUser.role);
    setActiveTab('portal');
  };

  const handleSwitchRole = (newRole) => {
    loginAsRole(newRole);
    setActiveTab('portal');
  };

  const handleNavigateRole = (role) => {
    loginAsRole(role);
    setActiveTab('portal');
  };

  const handleTrackFromHome = (query) => {
    setTrackedOrderId(query);
  };

  const handleCreateOrderFromCalc = async (formData, estimate) => {
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
      setActiveRole('customer');
      setActiveTab('portal');
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to place order');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF7] text-[#1F2933] flex flex-col font-sans">
      
      {/* Top Navbar */}
      <Navbar
        activeRole={activeRole}
        demoUsers={demoUsers}
        activeUser={user}
        onSwitchRole={handleSwitchRole}
        activeTab={activeTab}
        onSwitchTab={setActiveTab}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenCalc={() => setShowCalcModal(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        
        {loading ? (
          <div className="py-24 text-center text-[#667085] flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-[#176B4D]" />
            <span className="font-semibold text-sm">Initializing platform & role context...</span>
          </div>
        ) : activeTab === 'home' ? (
          <Homepage
            onOpenCalc={() => setShowCalcModal(true)}
            onTrackOrder={handleTrackFromHome}
            onNavigateRole={handleNavigateRole}
          />
        ) : activeTab === 'system-design' ? (
          <SystemDesignDocView />
        ) : (
          <div>
            {activeRole === 'customer' && (
              <CustomerPortal 
                user={user} 
                onOpenCalc={() => setShowCalcModal(true)} 
              />
            )}
            {activeRole === 'agent' && <AgentPortal user={user} />}
            {activeRole === 'admin' && <AdminPortal user={user} />}
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-xs text-[#667085]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-semibold text-[#1F2933]">
            <Truck className="w-4 h-4 text-[#176B4D]" />
            <span>LogiTrack Last-Mile Delivery Platform</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[#667085]">
            <span>Volumetric Rate Engine</span>
            <span>•</span>
            <span>Dynamic Zone Detection</span>
            <span>•</span>
            <span>Immutable Lifecycle Audit</span>
            <span>•</span>
            <span>Fleet Workload Balancer</span>
          </div>
          <span className="text-slate-400">© 2026 LogiTrack Inc. All rights reserved.</span>
        </div>
      </footer>

      {/* Global Modals */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        demoUsers={demoUsers}
        activeUser={user}
        onSelectUser={handleSelectUser}
        onLogout={() => { setUser(null); setShowAuthModal(false); }}
      />

      <RateCalculatorModal
        isOpen={showCalcModal}
        onClose={() => setShowCalcModal(false)}
        onConfirm={handleCreateOrderFromCalc}
      />

      <TrackingTimelineModal
        orderId={trackedOrderId}
        isOpen={!!trackedOrderId}
        onClose={() => setTrackedOrderId(null)}
      />

    </div>
  );
}
