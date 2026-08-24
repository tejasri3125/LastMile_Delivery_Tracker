import React, { useState, useEffect } from 'react';
import { AdminAPI, OrderAPI } from '../api';
import NotificationSandbox from './NotificationSandbox';
import TrackingTimelineModal from './TrackingTimelineModal';
import { 
  BarChart3, DollarSign, Package, Users, Truck, AlertTriangle, 
  MapPin, Settings, Shield, Plus, Edit2, CheckCircle2, ArrowRight, RefreshCw, Layers, Calculator
} from 'lucide-react';

export default function AdminPortal({ user }) {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'zones', 'rates', 'fleet', 'notifications'
  
  const [metrics, setMetrics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [zones, setZones] = useState([]);
  const [pincodes, setPincodes] = useState([]);
  const [rateCards, setRateCards] = useState([]);
  const [config, setConfig] = useState({});
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters for orders
  const [statusFilter, setStatusFilter] = useState('');
  const [zoneFilter, setZoneFilter] = useState('');
  const [orderTypeFilter, setOrderTypeFilter] = useState('');

  // Modals / Editors
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState(null);
  const [assigningOrderId, setAssigningOrderId] = useState(null);
  const [selectedAgentId, setSelectedAgentId] = useState('');

  // Rate card editing state
  const [editingCard, setEditingCard] = useState(null);

  // New Zone state
  const [newZoneCode, setNewZoneCode] = useState('');
  const [newZoneName, setNewZoneName] = useState('');
  const [newPincode, setNewPincode] = useState('');
  const [newAreaName, setNewAreaName] = useState('');
  const [selectedPincodeZoneId, setSelectedPincodeZoneId] = useState('');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [mRes, oRes, zRes, pRes, rRes, cRes, aRes] = await Promise.all([
        AdminAPI.getMetrics(),
        OrderAPI.list(),
        AdminAPI.getZones(),
        AdminAPI.getPincodes(),
        AdminAPI.getRateCards(),
        AdminAPI.getConfig(),
        AdminAPI.getAgents()
      ]);

      setMetrics(mRes.data);
      setOrders(oRes.data);
      setZones(zRes.data);
      setPincodes(pRes.data);
      setRateCards(rRes.data);
      setConfig(cRes.data);
      setAgents(aRes.data);
      if (zRes.data.length > 0) setSelectedPincodeZoneId(zRes.data[0].id);
    } catch (err) {
      console.error('Failed to load admin dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualAssign = async () => {
    if (!assigningOrderId || !selectedAgentId) return;
    try {
      await OrderAPI.adminAssign(assigningOrderId, selectedAgentId);
      setAssigningOrderId(null);
      fetchAllData();
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to assign agent');
    }
  };

  const handleUpdateRateCard = async (e) => {
    e.preventDefault();
    if (!editingCard) return;
    try {
      await AdminAPI.updateRateCard(editingCard.id, {
        baseWeightKg: parseFloat(editingCard.base_weight_kg),
        baseRate: parseFloat(editingCard.base_rate),
        perKgRate: parseFloat(editingCard.per_kg_rate),
        minCharge: parseFloat(editingCard.min_charge)
      });
      setEditingCard(null);
      fetchAllData();
    } catch (err) {
      alert('Failed to update rate card');
    }
  };

  const handleSaveConfig = async (key, val) => {
    try {
      await AdminAPI.saveConfig(key, val);
      fetchAllData();
    } catch (err) {
      alert('Failed to save configuration');
    }
  };

  const handleCreateZone = async (e) => {
    e.preventDefault();
    if (!newZoneCode || !newZoneName) return;
    try {
      await AdminAPI.createZone({ code: newZoneCode, name: newZoneName });
      setNewZoneCode('');
      setNewZoneName('');
      fetchAllData();
    } catch (err) {
      alert('Failed to create zone');
    }
  };

  const handleSavePincode = async (e) => {
    e.preventDefault();
    if (!newPincode || !newAreaName || !selectedPincodeZoneId) return;
    try {
      await AdminAPI.savePincode({ pincode: newPincode, areaName: newAreaName, zoneId: selectedPincodeZoneId });
      setNewPincode('');
      setNewAreaName('');
      fetchAllData();
    } catch (err) {
      alert('Failed to add pincode mapping');
    }
  };

  // Filtered Orders
  const filteredOrders = orders.filter(o => {
    if (statusFilter && o.status !== statusFilter) return false;
    if (zoneFilter && (String(o.pickup_zone_id) !== zoneFilter && String(o.drop_zone_id) !== zoneFilter)) return false;
    if (orderTypeFilter && o.order_type !== orderTypeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200 text-xs font-semibold mb-2 inline-block">ADMINISTRATION DASHBOARD</span>
          <h2 className="text-2xl font-bold text-[#1F2933] font-heading">Operations & Dispatch Control Center</h2>
          <p className="text-xs text-[#667085]">Global orders overview, rate card matrices, zone mapping, and agent workload distribution.</p>
        </div>
        <button 
          onClick={fetchAllData}
          className="logi-btn-outline text-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh All Data
        </button>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        
        <div className="logi-card p-4 space-y-1">
          <div className="flex items-center justify-between text-[#667085] text-xs">
            <span>Total Revenue</span>
            <DollarSign className="w-4 h-4 text-[#176B4D]" />
          </div>
          <p className="text-2xl font-extrabold text-[#1F2933] font-heading">₹{metrics?.totalRevenue || 0}</p>
          <span className="text-[10px] text-[#2E7D5B] font-semibold">Delivered Freight</span>
        </div>

        <div className="logi-card p-4 space-y-1">
          <div className="flex items-center justify-between text-[#667085] text-xs">
            <span>Total Orders</span>
            <Package className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-extrabold text-[#1F2933] font-heading">{metrics?.totalOrders || 0}</p>
          <span className="text-[10px] text-blue-600 font-semibold">Lifetime Volume</span>
        </div>

        <div className="logi-card p-4 space-y-1">
          <div className="flex items-center justify-between text-[#667085] text-xs">
            <span>Active Shipments</span>
            <Truck className="w-4 h-4 text-[#176B4D]" />
          </div>
          <p className="text-2xl font-extrabold text-[#1F2933] font-heading">{metrics?.activeOrders || 0}</p>
          <span className="text-[10px] text-[#176B4D] font-semibold">In Pipeline</span>
        </div>

        <div className="logi-card p-4 space-y-1">
          <div className="flex items-center justify-between text-[#667085] text-xs">
            <span>Failed Deliveries</span>
            <AlertTriangle className="w-4 h-4 text-[#D9534F]" />
          </div>
          <p className="text-2xl font-extrabold text-[#1F2933] font-heading">{metrics?.failedOrders || 0}</p>
          <span className="text-[10px] text-[#D9534F] font-semibold">Reschedule Pending</span>
        </div>

        <div className="logi-card p-4 space-y-1">
          <div className="flex items-center justify-between text-[#667085] text-xs">
            <span>Active Agent Fleet</span>
            <Users className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-extrabold text-[#1F2933] font-heading">{metrics?.activeAgents || 0}</p>
          <span className="text-[10px] text-amber-700 font-semibold">On Duty Now</span>
        </div>

      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
            activeTab === 'orders' ? 'bg-[#176B4D] text-white shadow-sm' : 'bg-white text-[#1F2933] border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Package className="w-4 h-4" /> Global Orders Manager
        </button>

        <button
          onClick={() => setActiveTab('zones')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
            activeTab === 'zones' ? 'bg-[#176B4D] text-white shadow-sm' : 'bg-white text-[#1F2933] border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <MapPin className="w-4 h-4" /> Zones & Pincodes
        </button>

        <button
          onClick={() => setActiveTab('rates')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
            activeTab === 'rates' ? 'bg-[#176B4D] text-white shadow-sm' : 'bg-white text-[#1F2933] border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Calculator className="w-4 h-4" /> Rate Cards Matrix
        </button>

        <button
          onClick={() => setActiveTab('fleet')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
            activeTab === 'fleet' ? 'bg-[#176B4D] text-white shadow-sm' : 'bg-white text-[#1F2933] border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Truck className="w-4 h-4" /> Agent Fleet
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
            activeTab === 'notifications' ? 'bg-[#176B4D] text-white shadow-sm' : 'bg-white text-[#1F2933] border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Shield className="w-4 h-4" /> Notification Logs
        </button>
      </div>

      {/* TAB 1: Global Orders Table */}
      {activeTab === 'orders' && (
        <div className="logi-card p-6 space-y-4">
          
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#F8FAF7] p-3 rounded-lg border border-slate-200 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-bold text-[#667085]">Filter Orders:</span>

              <select 
                className="logi-input text-xs py-1" 
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

              <select 
                className="logi-input text-xs py-1" 
                value={zoneFilter} 
                onChange={(e) => setZoneFilter(e.target.value)}
              >
                <option value="">All Zones</option>
                {zones.map(z => <option key={z.id} value={String(z.id)}>{z.name}</option>)}
              </select>

              <select 
                className="logi-input text-xs py-1" 
                value={orderTypeFilter} 
                onChange={(e) => setOrderTypeFilter(e.target.value)}
              >
                <option value="">All Types (B2B/B2C)</option>
                <option value="B2B">B2B Only</option>
                <option value="B2C">B2C Only</option>
              </select>
            </div>

            <span className="text-xs text-[#667085] font-semibold">Showing {filteredOrders.length} orders</span>
          </div>

          {/* Orders Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F8FAF7] border-b border-slate-200 text-[#667085] uppercase font-bold">
                  <th className="p-3">Tracking #</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Route (Pincodes)</th>
                  <th className="p-3">Freight Charge</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Assigned Agent</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono font-bold text-[#176B4D]">#{ord.tracking_number}</td>
                    <td className="p-3 font-semibold text-[#1F2933]">{ord.customer_name}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-[#1F2933] font-semibold">
                        {ord.order_type} • {ord.payment_type}
                      </span>
                    </td>
                    <td className="p-3 text-[#1F2933]">
                      {ord.pickup_pincode} → {ord.drop_pincode}
                    </td>
                    <td className="p-3 font-extrabold text-[#176B4D]">₹{ord.total_charge}</td>
                    <td className="p-3">
                      <span className={
                        ord.status === 'DELIVERED' ? 'logi-badge-success' :
                        ord.status === 'FAILED' ? 'logi-badge-failed' :
                        ord.status === 'RESCHEDULED' ? 'logi-badge-amber' :
                        'logi-badge-forest'
                      }>
                        {ord.status}
                      </span>
                    </td>
                    <td className="p-3">
                      {ord.agent_name ? (
                        <span className="text-[#1F2933] font-medium">{ord.agent_name}</span>
                      ) : (
                        <button 
                          onClick={() => { setAssigningOrderId(ord.id); setSelectedAgentId(agents[0]?.id || ''); }}
                          className="logi-badge-amber font-bold hover:underline"
                        >
                          + Assign Agent
                        </button>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedOrderForTracking(ord.id)}
                        className="logi-btn-outline text-[11px] py-1"
                      >
                        Audit History
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Zones & Area Pincodes */}
      {activeTab === 'zones' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Defined Operational Zones */}
          <div className="logi-card p-6 space-y-4">
            <h3 className="text-base font-bold text-[#1F2933] font-heading flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#176B4D]" /> Defined Operational Hub Zones
            </h3>

            <form onSubmit={handleCreateZone} className="flex gap-2">
              <input 
                type="text" 
                placeholder="Zone Code (ZONE-NE)" 
                className="logi-input text-xs w-1/3" 
                value={newZoneCode}
                onChange={(e) => setNewZoneCode(e.target.value)}
                required
              />
              <input 
                type="text" 
                placeholder="Zone Name (North East)" 
                className="logi-input text-xs w-2/3" 
                value={newZoneName}
                onChange={(e) => setNewZoneName(e.target.value)}
                required
              />
              <button type="submit" className="logi-btn-primary px-3 text-xs shrink-0">
                + Add
              </button>
            </form>

            <div className="space-y-2">
              {zones.map(z => (
                <div key={z.id} className="p-3 bg-[#F8FAF7] rounded-lg border border-slate-200 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-[#176B4D] font-mono">{z.code}</span> - <span className="font-semibold text-[#1F2933]">{z.name}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-white border border-slate-200 text-[#667085] rounded font-mono font-bold">
                    {z.pincode_count || 0} pincodes
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Area Pincode Mapper */}
          <div className="logi-card p-6 space-y-4">
            <h3 className="text-base font-bold text-[#1F2933] font-heading flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#176B4D]" /> Area Pincode Mapping Engine
            </h3>

            <form onSubmit={handleSavePincode} className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <input 
                  type="text" 
                  placeholder="Pincode (110001)" 
                  className="logi-input text-xs" 
                  value={newPincode}
                  onChange={(e) => setNewPincode(e.target.value)}
                  required
                />
                <input 
                  type="text" 
                  placeholder="Area Name (CP Delhi)" 
                  className="logi-input text-xs" 
                  value={newAreaName}
                  onChange={(e) => setNewAreaName(e.target.value)}
                  required
                />
                <select 
                  className="logi-input text-xs"
                  value={selectedPincodeZoneId}
                  onChange={(e) => setSelectedPincodeZoneId(e.target.value)}
                >
                  {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                </select>
              </div>
              <button type="submit" className="logi-btn-primary w-full text-xs py-2">
                + Save Pincode Mapping
              </button>
            </form>

            <div className="max-h-64 overflow-y-auto space-y-1.5">
              {pincodes.map(p => (
                <div key={p.id} className="p-2.5 bg-white rounded-lg border border-slate-200 flex justify-between text-xs">
                  <div>
                    <span className="font-bold text-[#1F2933] font-mono">{p.pincode}</span> • <span className="text-[#667085]">{p.area_name}</span>
                  </div>
                  <span className="text-[#176B4D] font-bold">{p.zone_name}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: Rate Cards Matrix */}
      {activeTab === 'rates' && (
        <div className="space-y-6">
          
          {/* Volumetric Config Controls */}
          <div className="logi-card p-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <label className="text-[#1F2933] font-bold block">Volumetric Weight Divisor</label>
              <input 
                type="number" 
                className="logi-input text-xs w-full" 
                defaultValue={config.volumetric_divisor || '5000'}
                onBlur={(e) => handleSaveConfig('volumetric_divisor', e.target.value)}
              />
              <span className="text-[10px] text-[#667085]">Standard IATA: 5000 (L x W x H / 5000)</span>
            </div>

            <div className="space-y-1">
              <label className="text-[#1F2933] font-bold block">B2B COD Surcharge (₹)</label>
              <input 
                type="number" 
                className="logi-input text-xs w-full" 
                defaultValue={config.b2b_cod_surcharge || '50'}
                onBlur={(e) => handleSaveConfig('b2b_cod_surcharge', e.target.value)}
              />
              <span className="text-[10px] text-[#667085]">Flat COD surcharge for commercial B2B</span>
            </div>

            <div className="space-y-1">
              <label className="text-[#1F2933] font-bold block">B2C COD Surcharge (₹)</label>
              <input 
                type="number" 
                className="logi-input text-xs w-full" 
                defaultValue={config.b2c_cod_surcharge || '25'}
                onBlur={(e) => handleSaveConfig('b2c_cod_surcharge', e.target.value)}
              />
              <span className="text-[10px] text-[#667085]">Flat COD surcharge for consumer B2C</span>
            </div>
          </div>

          {/* Rate Cards Matrix */}
          <div className="logi-card p-6 space-y-4">
            <h3 className="text-base font-bold text-[#1F2933] font-heading flex items-center gap-2">
              <Calculator className="w-5 h-5 text-[#176B4D]" /> Active Pricing Rate Cards Matrix
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rateCards.map(rc => (
                <div key={rc.id} className="p-4 bg-[#F8FAF7] rounded-xl border border-slate-200 space-y-3 text-xs">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span className="font-extrabold text-[#176B4D] text-sm font-heading">
                      {rc.order_type} • {rc.scope}
                    </span>
                    <button 
                      onClick={() => setEditingCard(rc)}
                      className="logi-btn-outline text-xs py-1"
                    >
                      <Edit2 className="w-3 h-3" /> Edit Matrix
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[#1F2933]">
                    <div>Base Weight Limit: <strong className="text-[#176B4D]">{rc.base_weight_kg} kg</strong></div>
                    <div>Base Rate: <strong className="text-[#2E7D5B]">₹{rc.base_rate}</strong></div>
                    <div>Excess Weight Rate: <strong className="text-[#2E7D5B]">₹{rc.per_kg_rate} / kg</strong></div>
                    <div>Minimum Charge: <strong>₹{rc.min_charge}</strong></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB 4: Agent Fleet Manager */}
      {activeTab === 'fleet' && (
        <div className="logi-card p-6 space-y-4">
          <h3 className="text-base font-bold text-[#1F2933] font-heading flex items-center gap-2">
            <Users className="w-5 h-5 text-[#176B4D]" /> Active Agent Fleet & Workload Balancer
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {agents.map(agent => (
              <div key={agent.id} className="p-4 bg-[#F8FAF7] rounded-xl border border-slate-200 space-y-3 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-[#1F2933] text-sm">{agent.name}</h4>
                    <p className="text-[#667085]">{agent.email}</p>
                  </div>
                  <span className={agent.is_available ? 'logi-badge-success' : 'logi-badge-failed'}>
                    {agent.is_available ? 'ON DUTY' : 'OFFLINE'}
                  </span>
                </div>

                <div className="text-[#1F2933] space-y-1">
                  <p>Assigned Hub Zone: <strong className="text-[#176B4D]">{agent.zone_name || 'Unassigned'}</strong></p>
                  <p>Active Workload: <strong className="text-amber-800 font-extrabold">{agent.active_orders_count || 0} orders</strong></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: Notification Sandbox */}
      {activeTab === 'notifications' && (
        <NotificationSandbox />
      )}

      {/* Manual Agent Assignment Modal */}
      {assigningOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-xl border border-slate-200 p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-[#1F2933] font-heading">Manual Agent Override Assignment</h3>
            <div>
              <label className="text-xs text-[#1F2933] font-semibold mb-1 block">Select Delivery Agent</label>
              <select 
                className="logi-input w-full"
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
              >
                {agents.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.zone_name || 'Zone'}) - Active Workload: {a.active_orders_count || 0}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => setAssigningOrderId(null)} 
                className="logi-btn-outline w-1/2 py-2 text-xs"
              >
                Cancel
              </button>
              <button 
                onClick={handleManualAssign}
                className="logi-btn-primary w-1/2 py-2 text-xs"
              >
                Assign Agent
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Rate Card Modal */}
      {editingCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <form onSubmit={handleUpdateRateCard} className="bg-white w-full max-w-md rounded-xl border border-slate-200 p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-[#1F2933] font-heading">
              Edit Rate Card Matrix: {editingCard.order_type} • {editingCard.scope}
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[#1F2933] font-semibold mb-1 block">Base Weight (kg)</label>
                <input 
                  type="number" step="0.1" className="logi-input w-full"
                  value={editingCard.base_weight_kg}
                  onChange={(e) => setEditingCard({ ...editingCard, base_weight_kg: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="text-[#1F2933] font-semibold mb-1 block">Base Rate (₹)</label>
                <input 
                  type="number" step="0.1" className="logi-input w-full"
                  value={editingCard.base_rate}
                  onChange={(e) => setEditingCard({ ...editingCard, base_rate: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="text-[#1F2933] font-semibold mb-1 block">Per Kg Rate (₹)</label>
                <input 
                  type="number" step="0.1" className="logi-input w-full"
                  value={editingCard.per_kg_rate}
                  onChange={(e) => setEditingCard({ ...editingCard, per_kg_rate: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="text-[#1F2933] font-semibold mb-1 block">Min Charge (₹)</label>
                <input 
                  type="number" step="0.1" className="logi-input w-full"
                  value={editingCard.min_charge}
                  onChange={(e) => setEditingCard({ ...editingCard, min_charge: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                type="button"
                onClick={() => setEditingCard(null)} 
                className="logi-btn-outline w-1/2 py-2 text-xs"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="logi-btn-primary w-1/2 py-2 text-xs"
              >
                Save Matrix
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tracking Modal */}
      <TrackingTimelineModal
        orderId={selectedOrderForTracking}
        isOpen={!!selectedOrderForTracking}
        onClose={() => setSelectedOrderForTracking(null)}
      />

    </div>
  );
}
