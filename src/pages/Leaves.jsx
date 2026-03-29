import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, X, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const statusColors = { pending: "bg-yellow-100 text-yellow-700", approved: "bg-green-100 text-green-700", rejected: "bg-red-100 text-red-700", cancelled: "bg-gray-100 text-gray-600" };
const leaveTypes = ["vacation","sick","emergency","maternity","paternity","bereavement","other"];

function LeaveModal({ leave, onClose, onSaved }) {
  const [form, setForm] = useState({ employee_name: "", leave_type: "vacation", start_date: "", end_date: "", total_days: 1, reason: "", status: "pending", ...leave });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const save = async () => {
    setSaving(true);
    if (leave?.id) await base44.entities.LeaveRequest.update(leave.id, form);
    else await base44.entities.LeaveRequest.create({ ...form, employee_id: form.employee_id || "manual" });
    onSaved();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold">{leave ? "Edit Leave Request" : "New Leave Request"}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div><label className="text-xs font-medium text-slate-600">Employee</label><Input className="mt-1" value={form.employee_name || ""} onChange={e => set("employee_name", e.target.value)} /></div>
          <div><label className="text-xs font-medium text-slate-600">Leave Type</label>
            <select className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.leave_type} onChange={e => set("leave_type", e.target.value)}>
              {leaveTypes.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-medium text-slate-600">Start Date</label><Input className="mt-1" type="date" value={form.start_date || ""} onChange={e => set("start_date", e.target.value)} /></div>
            <div><label className="text-xs font-medium text-slate-600">End Date</label><Input className="mt-1" type="date" value={form.end_date || ""} onChange={e => set("end_date", e.target.value)} /></div>
          </div>
          <div><label className="text-xs font-medium text-slate-600">Total Days</label><Input className="mt-1" type="number" value={form.total_days || ""} onChange={e => set("total_days", Number(e.target.value))} /></div>
          <div><label className="text-xs font-medium text-slate-600">Reason</label><textarea className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" rows={3} value={form.reason || ""} onChange={e => set("reason", e.target.value)} /></div>
          <div><label className="text-xs font-medium text-slate-600">Status</label>
            <select className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.status} onChange={e => set("status", e.target.value)}>
              {["pending","approved","rejected","cancelled"].map(s => <option key={s} value={s}>{s}</option>)}
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

export default function Leaves() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editLeave, setEditLeave] = useState(null);
  const [statusFilter, setStatusFilter] = useState("pending");

  const load = async () => { setLoading(true); const d = await base44.entities.LeaveRequest.list("-created_date", 200); setLeaves(d); setLoading(false); };
  useEffect(() => { load(); }, []);

  const quickApprove = async (l, status) => {
    await base44.entities.LeaveRequest.update(l.id, { status });
    load();
  };

  const filtered = statusFilter ? leaves.filter(l => l.status === statusFilter) : leaves;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Leave Requests</h1>
        <Button onClick={() => { setEditLeave(null); setShowModal(true); }} className="gap-2"><Plus className="w-4 h-4" /> New Request</Button>
      </div>
      <div className="flex gap-2 flex-wrap">
        {["","pending","approved","rejected","cancelled"].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${statusFilter === s ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
            {s ? s.charAt(0).toUpperCase()+s.slice(1) : "All"}
          </button>
        ))}
      </div>
      {loading ? <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div> : (
        <div className="space-y-3">
          {filtered.length === 0 ? <div className="text-center py-16 text-slate-400">No leave requests.</div> : filtered.map(l => (
            <div key={l.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <p className="font-semibold text-slate-900">{l.employee_name || l.employee_id}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${statusColors[l.status]}`}>{l.status}</span>
                </div>
                <p className="text-sm text-slate-500 mt-1 capitalize">{l.leave_type} Leave · {l.total_days || "?"} day(s)</p>
                <p className="text-xs text-slate-400">{l.start_date} — {l.end_date}</p>
                {l.reason && <p className="text-xs text-slate-500 mt-1 italic">"{l.reason}"</p>}
              </div>
              <div className="flex gap-2 shrink-0">
                {l.status === "pending" && <>
                  <button onClick={() => quickApprove(l, "approved")} className="p-2 text-green-600 hover:bg-green-50 rounded-lg"><CheckCircle className="w-5 h-5" /></button>
                  <button onClick={() => quickApprove(l, "rejected")} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><XCircle className="w-5 h-5" /></button>
                </>}
                <button onClick={() => { setEditLeave(l); setShowModal(true); }} className="text-xs text-blue-600 hover:underline px-2">Edit</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {showModal && <LeaveModal leave={editLeave} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load(); }} />}
    </div>
  );
}