import React, { useState } from 'react';
import { OrderAPI } from '../api';
import { RefreshCw, Calendar, FileText, CheckCircle2, X } from 'lucide-react';

export default function RescheduleModal({ order, isOpen, onClose, onSuccess }) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split('T')[0];

  const [newDate, setNewDate] = useState(defaultDateStr);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !order) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await OrderAPI.reschedule(order.id, {
        newDate,
        notes
      });

      if (onSuccess) onSuccess(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reschedule order delivery');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="glass-card w-full max-w-md border border-rose-500/30 overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-rose-950 via-slate-900 to-slate-900 border-b border-rose-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/40">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Reschedule Delivery Attempt</h3>
              <p className="text-xs text-rose-300/80">Order #{order.tracking_number}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-xl text-xs">
              {error}
            </div>
          )}

          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
            <p className="text-slate-400">Previous Failure Reason:</p>
            <p className="text-rose-300 font-semibold">{order.reschedule_reason || 'Customer door locked / unreachable'}</p>
          </div>

          <div>
            <label className="text-xs text-slate-300 mb-1 block flex items-center gap-1.5 font-semibold">
              <Calendar className="w-4 h-4 text-cyan-400" /> Select New Preferred Delivery Date
            </label>
            <input 
              type="date"
              className="glass-input w-full text-sm"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div>
            <label className="text-xs text-slate-300 mb-1 block flex items-center gap-1.5 font-semibold">
              <FileText className="w-4 h-4 text-cyan-400" /> Delivery Instructions / Address Correction
            </label>
            <textarea
              className="glass-input w-full text-sm h-20 resize-none"
              placeholder="e.g. Please leave package with security gate keeper or call secondary number..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            ></textarea>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-1/2 py-2.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2"
            >
              {loading ? 'Reassigning...' : 'Confirm Reschedule'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
