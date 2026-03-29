import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, X, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const statusColors = { draft: "bg-slate-100 text-slate-600", submitted: "bg-blue-100 text-blue-700", acknowledged: "bg-green-100 text-green-700" };

function EvalModal({ eval_, onClose, onSaved }) {
  const [form, setForm] = useState({ employee_name: "", evaluator_name: "", period: "", overall_rating: 3, comments: "", status: "draft", ...eval_ });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const save = async () => {
    setSaving(true);
    if (eval_?.id) await base44.entities.Evaluation.update(eval_.id, form);
    else await base44.entities.Evaluation.create({ ...form, employee_id: form.employee_id || "manual" });
    onSaved();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold">{eval_ ? "Edit Evaluation" : "New Evaluation"}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div><label className="text-xs font-medium text-slate-600">Employee</label><Input className="mt-1" value={form.employee_name || ""} onChange={e => set("employee_name", e.target.value)} /></div>
          <div><label className="text-xs font-medium text-slate-600">Evaluator</label><Input className="mt-1" value={form.evaluator_name || ""} onChange={e => set("evaluator_name", e.target.value)} /></div>
          <div><label className="text-xs font-medium text-slate-600">Period</label><Input className="mt-1" value={form.period || ""} onChange={e => set("period", e.target.value)} placeholder="e.g. Q1 2026" /></div>
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-2">Overall Rating: {form.overall_rating}/5</label>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(r => (
                <button key={r} type="button" onClick={() => set("overall_rating", r)}
                  className={`w-10 h-10 rounded-lg font-semibold transition-colors ${form.overall_rating >= r ? "bg-yellow-400 text-white" : "bg-slate-100 text-slate-400"}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div><label className="text-xs font-medium text-slate-600">Comments</label><textarea className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" rows={3} value={form.comments || ""} onChange={e => set("comments", e.target.value)} /></div>
          <div><label className="text-xs font-medium text-slate-600">Status</label>
            <select className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.status} onChange={e => set("status", e.target.value)}>
              {["draft","submitted","acknowledged"].map(s => <option key={s} value={s}>{s}</option>)}
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

export default function Evaluations() {
  const [evals, setEvals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editEval, setEditEval] = useState(null);

  const load = async () => { setLoading(true); const d = await base44.entities.Evaluation.list("-created_date", 200); setEvals(d); setLoading(false); };
  useEffect(() => { load(); }, []);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Performance Evaluations</h1>
        <Button onClick={() => { setEditEval(null); setShowModal(true); }} className="gap-2"><Plus className="w-4 h-4" /> New Evaluation</Button>
      </div>
      {loading ? <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div> : (
        <div className="space-y-3">
          {evals.length === 0 ? <div className="text-center py-16 text-slate-400">No evaluations.</div> : evals.map(e => (
            <div key={e.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between gap-4 cursor-pointer hover:shadow-md" onClick={() => { setEditEval(e); setShowModal(true); }}>
              <div>
                <p className="font-semibold text-slate-900">{e.employee_name}</p>
                <p className="text-sm text-slate-500">by {e.evaluator_name || "—"} · {e.period || "—"}</p>
                {e.comments && <p className="text-xs text-slate-400 mt-1 italic line-clamp-1">"{e.comments}"</p>}
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(r => <Star key={r} className={`w-4 h-4 ${r <= (e.overall_rating || 0) ? "text-yellow-400 fill-yellow-400" : "text-slate-200"}`} />)}
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${statusColors[e.status]}`}>{e.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {showModal && <EvalModal eval_={editEval} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load(); }} />}
    </div>
  );
}