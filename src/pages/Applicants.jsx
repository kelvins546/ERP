import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const stages = ["applied","screening","interview","offer","hired","rejected"];
const stageColors = {
  applied: "bg-slate-100 text-slate-700",
  screening: "bg-blue-100 text-blue-700",
  interview: "bg-yellow-100 text-yellow-700",
  offer: "bg-purple-100 text-purple-700",
  hired: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

function ApplicantModal({ applicant, onClose, onSaved }) {
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "", job_posting_title: "", status: "applied", source: "", notes: "", ...applicant });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const save = async () => {
    setSaving(true);
    if (applicant?.id) await base44.entities.Applicant.update(applicant.id, form);
    else await base44.entities.Applicant.create(form);
    onSaved();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold">{applicant ? "Edit Applicant" : "Add Applicant"}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-medium text-slate-600">First Name *</label><Input className="mt-1" value={form.first_name} onChange={e => set("first_name", e.target.value)} /></div>
            <div><label className="text-xs font-medium text-slate-600">Last Name *</label><Input className="mt-1" value={form.last_name} onChange={e => set("last_name", e.target.value)} /></div>
          </div>
          <div><label className="text-xs font-medium text-slate-600">Email</label><Input className="mt-1" type="email" value={form.email || ""} onChange={e => set("email", e.target.value)} /></div>
          <div><label className="text-xs font-medium text-slate-600">Phone</label><Input className="mt-1" value={form.phone || ""} onChange={e => set("phone", e.target.value)} /></div>
          <div><label className="text-xs font-medium text-slate-600">Applied Position</label><Input className="mt-1" value={form.job_posting_title || ""} onChange={e => set("job_posting_title", e.target.value)} /></div>
          <div><label className="text-xs font-medium text-slate-600">Source</label><Input className="mt-1" value={form.source || ""} onChange={e => set("source", e.target.value)} placeholder="LinkedIn, Referral, Walk-in..." /></div>
          <div><label className="text-xs font-medium text-slate-600">Status</label>
            <select className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.status} onChange={e => set("status", e.target.value)}>
              {stages.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
            </select>
          </div>
          <div><label className="text-xs font-medium text-slate-600">Notes</label><textarea className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" rows={3} value={form.notes || ""} onChange={e => set("notes", e.target.value)} /></div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
        </div>
      </div>
    </div>
  );
}

export default function Applicants() {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editApplicant, setEditApplicant] = useState(null);

  const load = async () => { setLoading(true); const d = await base44.entities.Applicant.list("-created_date", 200); setApplicants(d); setLoading(false); };
  useEffect(() => { load(); }, []);

  const byStage = (stage) => applicants.filter(a => a.status === stage);

  const moveStage = async (applicant, direction) => {
    const idx = stages.indexOf(applicant.status);
    const next = stages[idx + direction];
    if (!next) return;
    await base44.entities.Applicant.update(applicant.id, { status: next });
    load();
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Applicant Tracking</h1>
          <p className="text-slate-500 text-sm">{applicants.length} total applicants</p>
        </div>
        <Button onClick={() => { setEditApplicant(null); setShowModal(true); }} className="gap-2"><Plus className="w-4 h-4" /> Add Applicant</Button>
      </div>

      {loading ? <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div> : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map(stage => (
            <div key={stage} className="flex-shrink-0 w-64">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${stageColors[stage]}`}>{stage}</span>
                <span className="text-xs text-slate-400 font-medium">{byStage(stage).length}</span>
              </div>
              <div className="space-y-2">
                {byStage(stage).map(a => (
                  <div key={a.id} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setEditApplicant(a); setShowModal(true); }}>
                    <p className="font-medium text-slate-900 text-sm">{a.first_name} {a.last_name}</p>
                    {a.job_posting_title && <p className="text-xs text-slate-500 mt-0.5">{a.job_posting_title}</p>}
                    {a.email && <p className="text-xs text-slate-400 mt-1">{a.email}</p>}
                    {a.source && <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded mt-1 inline-block">{a.source}</span>}
                    <div className="flex gap-1 mt-2">
                      {stages.indexOf(a.status) > 0 && (
                        <button onClick={e => { e.stopPropagation(); moveStage(a, -1); }} className="text-xs text-slate-400 hover:text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 hover:bg-slate-50">← Back</button>
                      )}
                      {stages.indexOf(a.status) < stages.length - 1 && (
                        <button onClick={e => { e.stopPropagation(); moveStage(a, 1); }} className="text-xs text-blue-600 hover:text-blue-700 px-1.5 py-0.5 rounded border border-blue-200 hover:bg-blue-50 ml-auto">Next →</button>
                      )}
                    </div>
                  </div>
                ))}
                {byStage(stage).length === 0 && <div className="text-center py-6 text-slate-300 text-xs border-2 border-dashed border-slate-200 rounded-xl">Empty</div>}
              </div>
            </div>
          ))}
        </div>
      )}
      {showModal && <ApplicantModal applicant={editApplicant} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load(); }} />}
    </div>
  );
}