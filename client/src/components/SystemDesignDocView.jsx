import React from 'react';
import { Cpu, Zap, Layers, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function SystemDesignDocView() {
  return (
    <div className="logi-card p-8 max-w-4xl mx-auto space-y-8 text-[#1F2933]">
      
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-[#E7F1EB] text-[#176B4D] rounded-xl border border-[#176B4D]/30">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-[#1F2933] font-heading">System Design Write-Up</h2>
            <p className="text-xs text-[#176B4D] font-bold uppercase tracking-wider">Architecture Overview & Core Technical Engines</p>
          </div>
        </div>
      </div>

      {/* Section 1 */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-[#176B4D] font-heading flex items-center gap-2">
          <Zap className="w-5 h-5 text-[#176B4D]" /> 1. Rate Calculation Engine & Volumetric Pricing Logic
        </h3>
        <div className="bg-[#F8FAF7] p-4 rounded-xl border border-slate-200 text-sm space-y-2 leading-relaxed">
          <p>
            Logistics pricing dynamically accounts for space consumption (cube) alongside dead weight. Our rate engine implements standard IATA volumetric pricing using the formula:
          </p>
          <div className="bg-white p-3 rounded-lg border border-[#176B4D]/30 text-center font-mono text-[#176B4D] text-sm font-bold shadow-sm">
            Volumetric Weight (kg) = (Length × Width × Height in cm) / Volumetric Divisor (5000)
          </div>
          <p>
            The billable chargeable weight is computed as <code className="bg-[#E7F1EB] px-1.5 py-0.5 rounded text-[#176B4D] font-bold">max(Actual Weight, Volumetric Weight)</code>. The engine evaluates the pickup and drop postal pincodes to classify the delivery scope as either <strong>Intra-Zone</strong> (same region) or <strong>Inter-Zone</strong> (cross region).
          </p>
          <p>
            Rate cards are zero-hardcoded and fully admin-configurable in the database. When an order is processed, the system queries the matrix matching <code className="bg-[#E7F1EB] px-1.5 py-0.5 rounded text-[#176B4D] font-bold">(OrderType: B2B/B2C, Scope: INTRA/INTER)</code>. Base freight covers weight up to <code className="bg-[#E7F1EB] px-1.5 py-0.5 rounded text-[#176B4D] font-bold">base_weight_kg</code>, with excess weight billed incrementally per kg. Cash on Delivery (COD) surcharges are added based on configured thresholds.
          </p>
        </div>
      </div>

      {/* Section 2 */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-[#176B4D] font-heading flex items-center gap-2">
          <Layers className="w-5 h-5 text-[#176B4D]" /> 2. Dynamic Zone Detection Approach
        </h3>
        <div className="bg-[#F8FAF7] p-4 rounded-xl border border-slate-200 text-sm space-y-2 leading-relaxed">
          <p>
            To eliminate hardcoded region maps, postal codes are modeled via a normalized schema: <code className="bg-[#E7F1EB] px-1.5 py-0.5 rounded text-[#176B4D] font-bold">pincodes (pincode, area_name, zone_id)</code> referencing <code className="bg-[#E7F1EB] px-1.5 py-0.5 rounded text-[#176B4D] font-bold">zones (id, code, name)</code>.
          </p>
          <p>
            When a pickup or drop address pincode is entered, the engine executes a fast database lookup. If an exact pincode mapping is present, it retrieves the associated zone ID. If an unmapped pincode is submitted, a fallback heuristic detects regional prefix patterns or maps to the default regional hub. Comparing <code className="bg-[#E7F1EB] px-1.5 py-0.5 rounded text-[#176B4D] font-bold">pickup_zone_id == drop_zone_id</code> instantly determines whether intra-zone rates or inter-zone surcharges apply.
          </p>
        </div>
      </div>

      {/* Section 3 */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-[#176B4D] font-heading flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#176B4D]" /> 3. Intelligent Auto-Assignment & Workload Balancer
        </h3>
        <div className="bg-[#F8FAF7] p-4 rounded-xl border border-slate-200 text-sm space-y-2 leading-relaxed">
          <p>
            The auto-assignment module eliminates manual dispatch overhead while allowing admin manual overrides. The system selects agents based on a two-tier optimization score:
          </p>
          <ul className="list-disc list-inside space-y-1 text-[#1F2933] pl-2">
            <li><strong>Zone Proximity Preference</strong>: Filters agents assigned to the order's pickup zone who are active (<code className="bg-[#E7F1EB] px-1 py-0.5 rounded text-[#176B4D] font-bold">is_available = 1</code>).</li>
            <li><strong>Workload Balancing Score</strong>: Counts active orders currently in state <code className="bg-[#E7F1EB] px-1 py-0.5 rounded text-[#176B4D] font-bold">['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY']</code> per candidate agent.</li>
          </ul>
          <p>
            The agent with the minimum active workload in the pickup zone is selected. If no in-zone agent is active, the algorithm falls back to the lowest-workload available agent across the network.
          </p>
        </div>
      </div>

      {/* Section 4 */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-[#176B4D] font-heading flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-[#176B4D]" /> 4. Failed Delivery Handling & Reschedule Lifecycle
        </h3>
        <div className="bg-[#F8FAF7] p-4 rounded-xl border border-slate-200 text-sm space-y-2 leading-relaxed">
          <p>
            Delivery failures (e.g., door locked, customer unreachable) are handled through a dedicated state lifecycle:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-center text-xs font-bold font-mono py-2">
            <div className="p-2 bg-rose-50 border border-rose-200 text-[#D9534F] rounded-lg">1. Flag Status: FAILED</div>
            <div className="p-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg">2. Dispatch Alert (SMS/Email)</div>
            <div className="p-2 bg-[#E7F1EB] border border-[#176B4D]/30 text-[#176B4D] rounded-lg">3. Capture Reschedule Date</div>
            <div className="p-2 bg-emerald-50 border border-emerald-200 text-[#2E7D5B] rounded-lg">4. Reassign Agent & Resume</div>
          </div>
          <p>
            When marked as <code className="bg-rose-50 px-1.5 py-0.5 rounded text-[#D9534F] font-bold">FAILED</code> by an agent, the failure reason is recorded in the immutable audit log, and an urgent SMS/Email alert is dispatched. The customer portal prompts the user to select a new preferred delivery date and provide address notes. Rescheduling transitions the order to <code className="bg-[#E7F1EB] px-1.5 py-0.5 rounded text-[#176B4D] font-bold">RESCHEDULED</code>, automatically re-triggering the assignment engine.
          </p>
        </div>
      </div>

    </div>
  );
}
