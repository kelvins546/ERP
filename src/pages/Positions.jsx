import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Edit, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function PosModal({ pos, onClose, onSaved }) {
  const [form, setForm] = useState({ title: "", salary_grade: "", base_salary_min: "", base_salary_max: "", department_name: "", ...pos });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const save = async () => {
    setSaving(true);
    if (pos?.id) await base44.entities.Position.update(pos.id, form);
    else await base44.entities.Position.create(form);
    onSaved();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold">{pos ? "Edit Position" : "Add Position"}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-3">
          {[["title", "Position Title *", "text"], ["salary_grade", "Salary Grade", "text"], ["base_salary_min", "Min Salary", "number"], ["base_salary_max", "Max Salary", "number"], ["department_name", "Department", "text"]].map(([k, l, t]) => (
            <div key={k}><label className="text-xs font-medium text-slate-600">{l}</label><Input className="mt-1" type={t} value={form[k] || ""} onChange={e => set(k, e.target.value)} /></div>
          ))}
        </div>
        <div className="flex justify-end gap-3 p-5 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
        </div>
      </div>
    </div>
  );
}

export default function Positions() {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editPos, setEditPos] = useState(null);

  const load = async () => { setLoading(true); const d = await base44.entities.Position.list(); setPositions(d); setLoading(false); };
  useEffect(() => { load(); }, []);
  const handleDelete = async (id) => { if (!confirm("Delete?")) return; await base44.entities.Position.delete(id); load(); };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Positions</h1>
        <Button onClick={() => { setEditPos(null); setShowModal(true); }} className="gap-2"><Plus className="w-4 h-4" /> Add Position</Button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div> : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b"><tr>{["Title", "Grade", "Salary Range", "Department", "Actions"].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {positions.length === 0 ? <tr><td colSpan={5} className="text-center py-12 text-slate-400">No positions yet.</td></tr> : positions.map(p => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900 text-sm">{p.title}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{p.salary_grade || "—"}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{p.base_salary_min && p.base_salary_max ? `₱${Number(p.base_salary_min).toLocaleString()} – ₱${Number(p.base_salary_max).toLocaleString()}` : "—"}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{p.department_name || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => { setEditPos(p); setShowModal(true); }} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {showModal && <PosModal pos={editPos} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load(); }} />}
    </div>
  );
}