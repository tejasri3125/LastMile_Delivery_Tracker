import React, { useState } from 'react';
import { OrderAPI } from '../api';
import { Calculator, Box, MapPin, CreditCard, ShieldCheck, ArrowRight, X } from 'lucide-react';

export default function RateCalculatorModal({ isOpen, onClose, onConfirm, initialData = {} }) {
  const [formData, setFormData] = useState({
    pickupPincode: initialData.pickupPincode || '110001',
    dropPincode: initialData.dropPincode || '110002',
    lengthCm: initialData.lengthCm || 35,
    widthCm: initialData.widthCm || 25,
    heightCm: initialData.heightCm || 20,
    actualWeightKg: initialData.actualWeightKg || 2.5,
    orderType: initialData.orderType || 'B2B',
    paymentType: initialData.paymentType || 'Prepaid'
  });

  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleCalculate = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await OrderAPI.estimate(formData);
      setEstimate(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to calculate rate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="glass-card w-full max-w-3xl border border-cyan-500/30 overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/40">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Rate Calculation Engine</h3>
              <p className="text-xs text-slate-400">Volumetric & Zone-Based Transparent Billing</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Inputs Column */}
          <form onSubmit={handleCalculate} className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Box className="w-4 h-4" /> Package & Location Details
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-300 mb-1 block">Pickup Pincode</label>
                <input 
                  type="text" 
                  className="glass-input w-full text-sm" 
                  value={formData.pickupPincode}
                  onChange={(e) => setFormData({ ...formData, pickupPincode: e.target.value })}
                  placeholder="e.g. 110001"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-slate-300 mb-1 block">Drop Pincode</label>
                <input 
                  type="text" 
                  className="glass-input w-full text-sm" 
                  value={formData.dropPincode}
                  onChange={(e) => setFormData({ ...formData, dropPincode: e.target.value })}
                  placeholder="e.g. 110002"
                  required
                />
              </div>
            </div>

            {/* Dimensions */}
            <div>
              <label className="text-xs text-slate-300 mb-1 block">Dimensions (L × W × H in cm)</label>
              <div className="grid grid-cols-3 gap-2">
                <input 
                  type="number" step="0.1" className="glass-input w-full text-sm text-center" 
                  value={formData.lengthCm} 
                  onChange={(e) => setFormData({ ...formData, lengthCm: e.target.value })}
                  placeholder="Length" required 
                />
                <input 
                  type="number" step="0.1" className="glass-input w-full text-sm text-center" 
                  value={formData.widthCm} 
                  onChange={(e) => setFormData({ ...formData, widthCm: e.target.value })}
                  placeholder="Width" required 
                />
                <input 
                  type="number" step="0.1" className="glass-input w-full text-sm text-center" 
                  value={formData.heightCm} 
                  onChange={(e) => setFormData({ ...formData, heightCm: e.target.value })}
                  placeholder="Height" required 
                />
              </div>
            </div>

            {/* Actual Weight */}
            <div>
              <label className="text-xs text-slate-300 mb-1 block">Actual Dead Weight (kg)</label>
              <input 
                type="number" step="0.1" className="glass-input w-full text-sm" 
                value={formData.actualWeightKg}
                onChange={(e) => setFormData({ ...formData, actualWeightKg: e.target.value })}
                required
              />
            </div>

            {/* Selectors */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-300 mb-1 block">Order Type</label>
                <select 
                  className="glass-input w-full text-sm"
                  value={formData.orderType}
                  onChange={(e) => setFormData({ ...formData, orderType: e.target.value })}
                >
                  <option value="B2B">B2B (Business)</option>
                  <option value="B2C">B2C (Consumer)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-300 mb-1 block">Payment Mode</label>
                <select 
                  className="glass-input w-full text-sm"
                  value={formData.paymentType}
                  onChange={(e) => setFormData({ ...formData, paymentType: e.target.value })}
                >
                  <option value="Prepaid">Prepaid</option>
                  <option value="COD">Cash on Delivery</option>
                </select>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-2 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
            >
              {loading ? 'Calculating Engine...' : 'Calculate Delivery Charge'}
            </button>
          </form>

          {/* Results Output Column */}
          <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 flex flex-col justify-between">
            {error && (
              <div className="p-3 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-xl text-xs">
                {error}
              </div>
            )}

            {!estimate && !error && (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <Calculator className="w-12 h-12 mb-3 text-slate-700 animate-pulse" />
                <p className="text-sm font-medium">Click "Calculate Delivery Charge" to preview the live pricing breakdown.</p>
              </div>
            )}

            {estimate && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-semibold text-slate-400">ZONE DETECTION</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    estimate.scope === 'INTRA_ZONE' 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {estimate.scope === 'INTRA_ZONE' ? 'Intra-Zone (Same Area)' : 'Inter-Zone (Cross Region)'}
                  </span>
                </div>

                {/* Zone Cards */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <div>
                    <span className="text-slate-500 block">Pickup Zone</span>
                    <span className="font-semibold text-cyan-300">{estimate.pickupZone.zoneName} ({estimate.pickupZone.pincode})</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Drop Zone</span>
                    <span className="font-semibold text-cyan-300">{estimate.dropZone.zoneName} ({estimate.dropZone.pincode})</span>
                  </div>
                </div>

                {/* Weight Calculation comparison */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Actual Weight:</span>
                    <span className="text-slate-200 font-medium">{estimate.weightBreakdown.actualWeightKg} kg</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Volumetric Weight ({estimate.dimensions.lengthCm}×{estimate.dimensions.widthCm}×{estimate.dimensions.heightCm}/5000):</span>
                    <span className="text-slate-200 font-medium">{estimate.weightBreakdown.volumetricWeightKg} kg</span>
                  </div>
                  <div className="flex justify-between text-xs p-2 bg-cyan-950/40 rounded border border-cyan-800/40">
                    <span className="font-bold text-cyan-300">Billed Chargeable Weight:</span>
                    <span className="font-bold text-cyan-300">{estimate.weightBreakdown.billedWeightKg} kg</span>
                  </div>
                  {estimate.weightBreakdown.billedOnVolumetric && (
                    <p className="text-[11px] text-amber-400 italic">
                      * Billed on Volumetric Weight as it exceeds actual dead weight.
                    </p>
                  )}
                </div>

                {/* Charge Line Items */}
                <div className="border-t border-slate-800 pt-3 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Base Freight Charge ({estimate.rateCardApplied.orderType} - {estimate.scope}):</span>
                    <span>₹{estimate.chargeBreakdown.baseCharge}</span>
                  </div>
                  {estimate.chargeBreakdown.codSurcharge > 0 && (
                    <div className="flex justify-between text-amber-400">
                      <span>COD Surcharge ({formData.orderType}):</span>
                      <span>+ ₹{estimate.chargeBreakdown.codSurcharge}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-extrabold text-white pt-2 border-t border-slate-800">
                    <span>Total Estimated Charge:</span>
                    <span className="text-cyan-400">₹{estimate.chargeBreakdown.totalCharge}</span>
                  </div>
                </div>

                {onConfirm && (
                  <button 
                    onClick={() => onConfirm(formData, estimate)}
                    className="w-full mt-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
                  >
                    Confirm & Submit Order <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
