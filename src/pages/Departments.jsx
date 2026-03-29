import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Edit, Trash2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

function DeptModal({ dept, onClose, onSaved }) {
  const [form, setForm] = useState({ name: "", description: "", head_employee_name: "", ...dept });
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    if (dept?.id) await base44.entities.Department.update(dept.id, form);
    else await base44.entities.Department.create(form);
    onSaved();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold">{dept ? "Edit Department" : "Add Department"}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div><label className="text-xs font-medium text-slate-600">Name *</label><Input className="mt-1" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div><label className="text-xs font-medium text-slate-600">Department Head</label><Input className="mt-1" value={form.head_employee_name || ""} onChange={e => setForm(f => ({ ...f, head_employee_name: e.target.value }))} /></div>
          <div><label className="text-xs font-medium text-slate-600">Description</label><textarea className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" rows={3} value={form.description || ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
        </div>
      </div>
    </div>
  );
}

export default function Departments() {
  const [depts, setDepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editDept, setEditDept] = useState(null);

  const load = async () => { setLoading(true); const d = await base44.entities.Department.list(); setDepts(d); setLoading(false); };
  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => { if (!confirm("Delete?")) return; await base44.entities.Department.delete(id); load(); };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Departments</h1>
        <Button onClick={() => { setEditDept(null); setShowModal(true); }} className="gap-2"><Plus className="w-4 h-4" /> Add Department</Button>
      </div>
      {loading ? <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {depts.map(d => (
            <div key={d.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditDept(d); setShowModal(true); }} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(d.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <h3 className="font-semibold text-slate-900">{d.name}</h3>
              {d.head_employee_name && <p className="text-sm text-slate-500 mt-1">Head: {d.head_employee_name}</p>}
              {d.description && <p className="text-xs text-slate-400 mt-2 line-clamp-2">{d.description}</p>}
            </div>
          ))}
          {depts.length === 0 && <p className="text-slate-400 col-span-3 text-center py-16">No departments yet.</p>}
        </div>
      )}
      {showModal && <DeptModal dept={editDept} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load(); }} />}
    </div>
  );
}