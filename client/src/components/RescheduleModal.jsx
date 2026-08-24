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
      setError(err?.response?.data?.error || 'Failed to reschedule order delivery');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-[#D9534F] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <RefreshCw className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base font-heading">Reschedule Delivery Attempt</h3>
              <p className="text-xs text-rose-100">Order #{order.tracking_number}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-rose-100 hover:text-white hover:bg-white/10 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 text-[#D9534F] border border-rose-200 rounded-lg text-xs font-medium">
              {error}
            </div>
          )}

          <div className="bg-rose-50/60 p-3 rounded-lg border border-rose-200 text-xs space-y-1">
            <p className="text-[#667085]">Previous Failure Reason:</p>
            <p className="text-[#D9534F] font-semibold">{order.reschedule_reason || 'Customer door locked / unreachable'}</p>
          </div>

          <div>
            <label className="text-xs text-[#1F2933] mb-1 block flex items-center gap-1.5 font-semibold">
              <Calendar className="w-4 h-4 text-[#176B4D]" /> Select New Delivery Date
            </label>
            <input 
              type="date"
              className="logi-input w-full"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div>
            <label className="text-xs text-[#1F2933] mb-1 block flex items-center gap-1.5 font-semibold">
              <FileText className="w-4 h-4 text-[#176B4D]" /> Instructions / Address Correction
            </label>
            <textarea
              className="logi-input w-full h-20 resize-none text-xs"
              placeholder="e.g. Please leave package with security guard or call secondary number..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            ></textarea>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="logi-btn-outline w-1/2 text-xs py-2.5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-1/2 py-2.5 bg-[#176B4D] hover:bg-[#0F5138] text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-2"
            >
              {loading ? 'Reassigning...' : 'Confirm Reschedule'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
