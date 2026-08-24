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
      alert(err.response?.data?.error || 'Failed to assign agent');
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
      
      {/* Top Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="glass-card p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-extrabold text-white">₹{metrics?.totalRevenue || 0}</p>
          <span className="text-[10px] text-emerald-400 font-semibold">Delivered Freight</span>
        </div>

        <div className="glass-card p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Orders</span>
            <Package className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-xl font-extrabold text-white">{metrics?.totalOrders || 0}</p>
          <span className="text-[10px] text-cyan-400 font-semibold">Lifetime Volume</span>
        </div>

        <div className="glass-card p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Active Shipments</span>
            <Truck className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-xl font-extrabold text-white">{metrics?.activeOrders || 0}</p>
          <span className="text-[10px] text-blue-400 font-semibold">In Pipeline</span>
        </div>

        <div className="glass-card p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Failed Delivery Rate</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-xl font-extrabold text-white">{metrics?.failedOrders || 0}</p>
          <span className="text-[10px] text-rose-400 font-semibold">Reschedule Pending</span>
        </div>

        <div className="glass-card p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Active Agent Fleet</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl font-extrabold text-white">{metrics?.activeAgents || 0}</p>
          <span className="text-[10px] text-amber-400 font-semibold">On Duty Now</span>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'orders' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <Package className="w-4 h-4" /> Global Orders Manager
        </button>

        <button
          onClick={() => setActiveTab('zones')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'zones' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <MapPin className="w-4 h-4" /> Zones & Pincodes
        </button>

        <button
          onClick={() => setActiveTab('rates')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'rates' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <Calculator className="w-4 h-4" /> Rate Cards & Config
        </button>

        <button
          onClick={() => setActiveTab('fleet')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'fleet' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <Truck className="w-4 h-4" /> Agent Fleet
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'notifications' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <Shield className="w-4 h-4" /> Notification Logs
        </button>
      </div>

      {/* TAB 1: Global Orders Table */}
      {activeTab === 'orders' && (
        <div className="glass-card p-6 space-y-4">
          
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-bold text-slate-400">Filters:</span>

              <select 
                className="glass-input text-xs" 
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
                className="glass-input text-xs" 
                value={zoneFilter} 
                onChange={(e) => setZoneFilter(e.target.value)}
              >
                <option value="">All Zones</option>
                {zones.map(z => <option key={z.id} value={String(z.id)}>{z.name}</option>)}
              </select>

              <select 
                className="glass-input text-xs" 
                value={orderTypeFilter} 
                onChange={(e) => setOrderTypeFilter(e.target.value)}
              >
                <option value="">All Types (B2B/B2C)</option>
                <option value="B2B">B2B Only</option>
                <option value="B2C">B2C Only</option>
              </select>
            </div>

            <button 
              onClick={fetchAllData} 
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 text-xs font-medium flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>

          {/* Orders Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold">
                  <th className="p-3">Tracking #</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Route (Pincodes)</th>
                  <th className="p-3">Charge</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Assigned Agent</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-mono font-bold text-cyan-300">#{ord.tracking_number}</td>
                    <td className="p-3 font-semibold text-slate-200">{ord.customer_name}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                        {ord.order_type} • {ord.payment_type}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300">
                      {ord.pickup_pincode} → {ord.drop_pincode}
                    </td>
                    <td className="p-3 font-extrabold text-emerald-400">₹{ord.total_charge}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        ord.status === 'DELIVERED' ? 'bg-emerald-500/20 text-emerald-300' :
                        ord.status === 'FAILED' ? 'bg-rose-500/20 text-rose-300' :
                        ord.status === 'RESCHEDULED' ? 'bg-purple-500/20 text-purple-300' :
                        'bg-cyan-500/20 text-cyan-300'
                      }`}>
                        {ord.status}
                      </span>
                    </td>
                    <td className="p-3">
                      {ord.agent_name ? (
                        <span className="text-slate-200 font-medium">{ord.agent_name}</span>
                      ) : (
                        <button 
                          onClick={() => { setAssigningOrderId(ord.id); setSelectedAgentId(agents[0]?.id || ''); }}
                          className="px-2 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[11px] font-bold hover:bg-amber-500/30"
                        >
                          + Assign Agent
                        </button>
                      )}
                    </td>
                    <td className="p-3 text-right space-x-1">
                      <button
                        onClick={() => setSelectedOrderForTracking(ord.id)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-semibold rounded"
                      >
                        Track History
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
          {/* Zones Manager */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-cyan-400" /> Defined Operational Zones
            </h3>

            <form onSubmit={handleCreateZone} className="flex gap-2">
              <input 
                type="text" 
                placeholder="Zone Code (e.g. ZONE-NE)" 
                className="glass-input text-xs w-1/3" 
                value={newZoneCode}
                onChange={(e) => setNewZoneCode(e.target.value)}
                required
              />
              <input 
                type="text" 
                placeholder="Zone Name (e.g. North East Region)" 
                className="glass-input text-xs w-2/3" 
                value={newZoneName}
                onChange={(e) => setNewZoneName(e.target.value)}
                required
              />
              <button type="submit" className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs shrink-0">
                + Add
              </button>
            </form>

            <div className="space-y-2">
              {zones.map(z => (
                <div key={z.id} className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-cyan-300 font-mono">{z.code}</span> - <span className="font-semibold text-white">{z.name}</span>
                    {z.description && <p className="text-slate-400 text-[11px]">{z.description}</p>}
                  </div>
                  <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-mono font-bold">
                    {z.pincode_count || 0} pincodes mapped
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Area Pincode Mapper */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" /> Area Pincode Mapping Engine
            </h3>

            <form onSubmit={handleSavePincode} className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <input 
                  type="text" 
                  placeholder="Pincode (110001)" 
                  className="glass-input text-xs" 
                  value={newPincode}
                  onChange={(e) => setNewPincode(e.target.value)}
                  required
                />
                <input 
                  type="text" 
                  placeholder="Area Name (CP, Delhi)" 
                  className="glass-input text-xs" 
                  value={newAreaName}
                  onChange={(e) => setNewAreaName(e.target.value)}
                  required
                />
                <select 
                  className="glass-input text-xs"
                  value={selectedPincodeZoneId}
                  onChange={(e) => setSelectedPincodeZoneId(e.target.value)}
                >
                  {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                </select>
              </div>
              <button type="submit" className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs">
                + Save Pincode Mapping
              </button>
            </form>

            <div className="max-h-64 overflow-y-auto space-y-2">
              {pincodes.map(p => (
                <div key={p.id} className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 flex justify-between text-xs">
                  <div>
                    <span className="font-bold text-white font-mono">{p.pincode}</span> • <span className="text-slate-300">{p.area_name}</span>
                  </div>
                  <span className="text-cyan-400 font-bold">{p.zone_name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Rate Cards & Configuration */}
      {activeTab === 'rates' && (
        <div className="space-y-6">
          
          {/* Config Controls */}
          <div className="glass-card p-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <label className="text-slate-400 font-bold block">Volumetric Weight Divisor</label>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  className="glass-input text-xs w-full" 
                  defaultValue={config.volumetric_divisor || '5000'}
                  onBlur={(e) => handleSaveConfig('volumetric_divisor', e.target.value)}
                />
              </div>
              <span className="text-[10px] text-slate-500">Standard: 5000 (L x B x H / Divisor)</span>
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 font-bold block">B2B COD Surcharge (₹)</label>
              <input 
                type="number" 
                className="glass-input text-xs w-full" 
                defaultValue={config.b2b_cod_surcharge || '50'}
                onBlur={(e) => handleSaveConfig('b2b_cod_surcharge', e.target.value)}
              />
              <span className="text-[10px] text-slate-500">Flat surcharge for B2B orders</span>
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 font-bold block">B2C COD Surcharge (₹)</label>
              <input 
                type="number" 
                className="glass-input text-xs w-full" 
                defaultValue={config.b2c_cod_surcharge || '25'}
                onBlur={(e) => handleSaveConfig('b2c_cod_surcharge', e.target.value)}
              />
              <span className="text-[10px] text-slate-500">Flat surcharge for B2C orders</span>
            </div>
          </div>

          {/* Rate Cards Table */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calculator className="w-5 h-5 text-cyan-400" /> Configured Rate Cards Matrix
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rateCards.map(rc => (
                <div key={rc.id} className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-3 text-xs">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="font-extrabold text-cyan-300 text-sm">
                      {rc.order_type} • {rc.scope}
                    </span>
                    <button 
                      onClick={() => setEditingCard(rc)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-bold flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" /> Edit Card
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-slate-300">
                    <div>Base Weight Limit: <strong className="text-white">{rc.base_weight_kg} kg</strong></div>
                    <div>Base Rate: <strong className="text-emerald-400">₹{rc.base_rate}</strong></div>
                    <div>Excess Weight Rate: <strong className="text-emerald-400">₹{rc.per_kg_rate} / kg</strong></div>
                    <div>Minimum Charge: <strong className="text-white">₹{rc.min_charge}</strong></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB 4: Agent Fleet Manager */}
      {activeTab === 'fleet' && (
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" /> Active Agent Fleet & Workload Balancer
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {agents.map(agent => (
              <div key={agent.id} className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-3 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-white text-sm">{agent.name}</h4>
                    <p className="text-slate-400">{agent.email}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                    agent.is_available ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'
                  }`}>
                    {agent.is_available ? 'ON DUTY' : 'OFFLINE'}
                  </span>
                </div>

                <div className="text-slate-300 space-y-1">
                  <p>Assigned Hub Zone: <strong className="text-cyan-300">{agent.zone_name || 'Unassigned'}</strong></p>
                  <p>Active Assigned Workload: <strong className="text-amber-400 font-extrabold">{agent.active_orders_count || 0} orders</strong></p>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="glass-card w-full max-w-md border border-cyan-500/30 p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Manual Agent Override Assignment</h3>
            <div>
              <label className="text-xs text-slate-300 mb-1 block">Select Delivery Agent</label>
              <select 
                className="glass-input w-full text-sm"
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
                className="w-1/2 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button 
                onClick={handleManualAssign}
                className="w-1/2 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-600/30"
              >
                Assign Agent
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Rate Card Modal */}
      {editingCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <form onSubmit={handleUpdateRateCard} className="glass-card w-full max-w-md border border-cyan-500/30 p-6 space-y-4">
            <h3 className="text-base font-bold text-white">
              Edit Rate Card: {editingCard.order_type} • {editingCard.scope}
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-300 mb-1 block">Base Weight (kg)</label>
                <input 
                  type="number" step="0.1" className="glass-input w-full text-sm"
                  value={editingCard.base_weight_kg}
                  onChange={(e) => setEditingCard({ ...editingCard, base_weight_kg: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 mb-1 block">Base Freight Rate (₹)</label>
                <input 
                  type="number" step="0.1" className="glass-input w-full text-sm"
                  value={editingCard.base_rate}
                  onChange={(e) => setEditingCard({ ...editingCard, base_rate: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 mb-1 block">Per Kg Rate (Excess) (₹)</label>
                <input 
                  type="number" step="0.1" className="glass-input w-full text-sm"
                  value={editingCard.per_kg_rate}
                  onChange={(e) => setEditingCard({ ...editingCard, per_kg_rate: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 mb-1 block">Min Charge (₹)</label>
                <input 
                  type="number" step="0.1" className="glass-input w-full text-sm"
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
                className="w-1/2 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="w-1/2 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-600/30"
              >
                Save Rate Card
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
