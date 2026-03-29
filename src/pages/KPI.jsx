import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Edit, Trash2, X, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function KPIModal({ kpi, onClose, onSaved }) {
  const [form, setForm] = useState({ metric_name: "", target_value: "", unit: "", department_name: "", description: "", ...kpi });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const save = async () => {
    setSaving(true);
    if (kpi?.id) await base44.entities.KPIDefinition.update(kpi.id, form);
    else await base44.entities.KPIDefinition.create(form);
    onSaved();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold">{kpi ? "Edit KPI" : "New KPI"}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div><label className="text-xs font-medium text-slate-600">Metric Name *</label><Input className="mt-1" value={form.metric_name} onChange={e => set("metric_name", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-medium text-slate-600">Target Value *</label><Input className="mt-1" value={form.target_value} onChange={e => set("target_value", e.target.value)} /></div>
            <div><label className="text-xs font-medium text-slate-600">Unit</label><Input className="mt-1" value={form.unit || ""} onChange={e => set("unit", e.target.value)} placeholder="%, pcs, hrs..." /></div>
          </div>
          <div><label className="text-xs font-medium text-slate-600">Department</label><Input className="mt-1" value={form.department_name || ""} onChange={e => set("department_name", e.target.value)} /></div>
          <div><label className="text-xs font-medium text-slate-600">Description</label><textarea className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" rows={3} value={form.description || ""} onChange={e => set("description", e.target.value)} /></div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
        </div>
      </div>
    </div>
  );
}

export default function KPI() {
  const [kpis, setKpis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editKpi, setEditKpi] = useState(null);

  const load = async () => { setLoading(true); const d = await base44.entities.KPIDefinition.list(); setKpis(d); setLoading(false); };
  useEffect(() => { load(); }, []);
  const handleDelete = async (id) => { if (!confirm("Delete?")) return; await base44.entities.KPIDefinition.delete(id); load(); };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">KPI Setup</h1>
        <Button onClick={() => { setEditKpi(null); setShowModal(true); }} className="gap-2"><Plus className="w-4 h-4" /> New KPI</Button>
      </div>
      {loading ? <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {kpis.length === 0 ? <p className="col-span-3 text-center py-16 text-slate-400">No KPIs defined.</p> : kpis.map(k => (
            <div key={k.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center"><Target className="w-5 h-5 text-purple-600" /></div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditKpi(k); setShowModal(true); }} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(k.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <h3 className="font-semibold text-slate-900">{k.metric_name}</h3>
              <p className="text-2xl font-bold text-purple-600 mt-1">{k.target_value}<span className="text-sm font-normal text-slate-400 ml-1">{k.unit}</span></p>
              {k.department_name && <p className="text-xs text-slate-500 mt-1">{k.department_name}</p>}
              {k.description && <p className="text-xs text-slate-400 mt-2">{k.description}</p>}
            </div>
          ))}
        </div>
      )}
      {showModal && <KPIModal kpi={editKpi} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load(); }} />}
    </div>
  );
}