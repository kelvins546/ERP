import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, X, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const statusColors = { pending: "bg-yellow-100 text-yellow-700", approved: "bg-green-100 text-green-700", rejected: "bg-red-100 text-red-700" };

function OTModal({ ot, onClose, onSaved }) {
  const [form, setForm] = useState({ employee_name: "", ot_date: "", hours_requested: 1, reason: "", status: "pending", ...ot });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const save = async () => {
    setSaving(true);
    if (ot?.id) await base44.entities.OvertimeRequest.update(ot.id, form);
    else await base44.entities.OvertimeRequest.create({ ...form, employee_id: form.employee_id || "manual" });
    onSaved();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold">{ot ? "Edit OT Request" : "New OT Request"}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div><label className="text-xs font-medium text-slate-600">Employee</label><Input className="mt-1" value={form.employee_name || ""} onChange={e => set("employee_name", e.target.value)} /></div>
          <div><label className="text-xs font-medium text-slate-600">OT Date</label><Input className="mt-1" type="date" value={form.ot_date || ""} onChange={e => set("ot_date", e.target.value)} /></div>
          <div><label className="text-xs font-medium text-slate-600">Hours Requested</label><Input className="mt-1" type="number" step="0.5" value={form.hours_requested || ""} onChange={e => set("hours_requested", Number(e.target.value))} /></div>
          <div><label className="text-xs font-medium text-slate-600">Reason</label><textarea className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" rows={3} value={form.reason || ""} onChange={e => set("reason", e.target.value)} /></div>
          <div><label className="text-xs font-medium text-slate-600">Status</label>
            <select className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.status} onChange={e => set("status", e.target.value)}>
              {["pending","approved","rejected"].map(s => <option key={s} value={s}>{s}</option>)}
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

export default function Overtime() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [statusFilter, setStatusFilter] = useState("pending");

  const load = async () => { setLoading(true); const d = await base44.entities.OvertimeRequest.list("-created_date", 200); setItems(d); setLoading(false); };
  useEffect(() => { load(); }, []);

  const quickUpdate = async (item, status) => { await base44.entities.OvertimeRequest.update(item.id, { status }); load(); };
  const filtered = statusFilter ? items.filter(i => i.status === statusFilter) : items;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Overtime Requests</h1>
        <Button onClick={() => { setEditItem(null); setShowModal(true); }} className="gap-2"><Plus className="w-4 h-4" /> New OT Request</Button>
      </div>
      <div className="flex gap-2">
        {["","pending","approved","rejected"].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${statusFilter === s ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
            {s ? s.charAt(0).toUpperCase()+s.slice(1) : "All"}
          </button>
        ))}
      </div>
      {loading ? <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div> : (
        <div className="space-y-3">
          {filtered.length === 0 ? <div className="text-center py-16 text-slate-400">No overtime requests.</div> : filtered.map(item => (
            <div key={item.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <p className="font-semibold text-slate-900">{item.employee_name || item.employee_id}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[item.status]}`}>{item.status}</span>
                </div>
                <p className="text-sm text-slate-500 mt-1">{item.ot_date} · {item.hours_requested} hour(s)</p>
                {item.reason && <p className="text-xs text-slate-400 mt-1">"{item.reason}"</p>}
              </div>
              <div className="flex gap-2 shrink-0">
                {item.status === "pending" && <>
                  <button onClick={() => quickUpdate(item, "approved")} className="p-2 text-green-600 hover:bg-green-50 rounded-lg"><CheckCircle className="w-5 h-5" /></button>
                  <button onClick={() => quickUpdate(item, "rejected")} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><XCircle className="w-5 h-5" /></button>
                </>}
                <button onClick={() => { setEditItem(item); setShowModal(true); }} className="text-xs text-blue-600 hover:underline px-2">Edit</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {showModal && <OTModal ot={editItem} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load(); }} />}
    </div>
  );
}