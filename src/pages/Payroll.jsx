import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, X, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const statusColors = { draft: "bg-slate-100 text-slate-600", processing: "bg-yellow-100 text-yellow-700", finalized: "bg-blue-100 text-blue-700", paid: "bg-green-100 text-green-700" };

function PeriodModal({ period, onClose, onSaved }) {
  const [form, setForm] = useState({ name: "", start_date: "", end_date: "", pay_date: "", processing_status: "draft", ...period });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const save = async () => {
    setSaving(true);
    if (period?.id) await base44.entities.PayrollPeriod.update(period.id, form);
    else await base44.entities.PayrollPeriod.create(form);
    onSaved();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold">{period ? "Edit Period" : "New Payroll Period"}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div><label className="text-xs font-medium text-slate-600">Period Name</label><Input className="mt-1" value={form.name || ""} onChange={e => set("name", e.target.value)} placeholder="e.g. March 1–15 2026" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-medium text-slate-600">Start Date *</label><Input className="mt-1" type="date" value={form.start_date} onChange={e => set("start_date", e.target.value)} /></div>
            <div><label className="text-xs font-medium text-slate-600">End Date *</label><Input className="mt-1" type="date" value={form.end_date} onChange={e => set("end_date", e.target.value)} /></div>
          </div>
          <div><label className="text-xs font-medium text-slate-600">Pay Date</label><Input className="mt-1" type="date" value={form.pay_date || ""} onChange={e => set("pay_date", e.target.value)} /></div>
          <div><label className="text-xs font-medium text-slate-600">Status</label>
            <select className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.processing_status} onChange={e => set("processing_status", e.target.value)}>
              {["draft","processing","finalized","paid"].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
        </div>
      </div>
    </div>
  );
}

export default function Payroll() {
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editPeriod, setEditPeriod] = useState(null);

  const load = async () => { setLoading(true); const d = await base44.entities.PayrollPeriod.list("-start_date"); setPeriods(d); setLoading(false); };
  useEffect(() => { load(); }, []);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Payroll Periods</h1>
        <Button onClick={() => { setEditPeriod(null); setShowModal(true); }} className="gap-2"><Plus className="w-4 h-4" /> New Period</Button>
      </div>
      {loading ? <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div> : (
        <div className="space-y-3">
          {periods.length === 0 ? <div className="text-center py-16 text-slate-400">No payroll periods.</div> : periods.map(p => (
            <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center justify-between gap-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setEditPeriod(p); setShowModal(true); }}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{p.name || `${p.start_date} – ${p.end_date}`}</p>
                  <p className="text-sm text-slate-500">Pay Date: {p.pay_date || "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-right">
                {p.total_gross && <div><p className="text-xs text-slate-400">Gross</p><p className="font-semibold text-slate-800">₱{p.total_gross?.toLocaleString()}</p></div>}
                {p.total_net && <div><p className="text-xs text-slate-400">Net</p><p className="font-semibold text-green-700">₱{p.total_net?.toLocaleString()}</p></div>}
                <span className={`text-xs font-medium px-3 py-1 rounded-full capitalize ${statusColors[p.processing_status]}`}>{p.processing_status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {showModal && <PeriodModal period={editPeriod} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load(); }} />}
    </div>
  );
}