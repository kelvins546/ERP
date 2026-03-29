import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Edit, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function ProfileModal({ profile, onClose, onSaved }) {
  const [form, setForm] = useState({ employee_name: "", basic_salary: "", pay_frequency: "semi_monthly", sss_contribution: "", philhealth_contribution: "", pagibig_contribution: "", ...profile });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const save = async () => {
    setSaving(true);
    if (profile?.id) await base44.entities.SalaryProfile.update(profile.id, form);
    else await base44.entities.SalaryProfile.create({ ...form, employee_id: form.employee_id || "manual" });
    onSaved();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold">{profile ? "Edit Salary Profile" : "New Salary Profile"}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div><label className="text-xs font-medium text-slate-600">Employee</label><Input className="mt-1" value={form.employee_name || ""} onChange={e => set("employee_name", e.target.value)} /></div>
          <div><label className="text-xs font-medium text-slate-600">Basic Salary</label><Input className="mt-1" type="number" value={form.basic_salary || ""} onChange={e => set("basic_salary", Number(e.target.value))} /></div>
          <div><label className="text-xs font-medium text-slate-600">Pay Frequency</label>
            <select className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.pay_frequency || "semi_monthly"} onChange={e => set("pay_frequency", e.target.value)}>
              {["daily","weekly","semi_monthly","monthly"].map(s => <option key={s} value={s}>{s.replace("_"," ")}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-xs font-medium text-slate-600">SSS</label><Input className="mt-1" type="number" value={form.sss_contribution || ""} onChange={e => set("sss_contribution", Number(e.target.value))} /></div>
            <div><label className="text-xs font-medium text-slate-600">PhilHealth</label><Input className="mt-1" type="number" value={form.philhealth_contribution || ""} onChange={e => set("philhealth_contribution", Number(e.target.value))} /></div>
            <div><label className="text-xs font-medium text-slate-600">Pag-IBIG</label><Input className="mt-1" type="number" value={form.pagibig_contribution || ""} onChange={e => set("pagibig_contribution", Number(e.target.value))} /></div>
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

export default function SalaryProfiles() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editProfile, setEditProfile] = useState(null);

  const load = async () => { setLoading(true); const d = await base44.entities.SalaryProfile.list(); setProfiles(d); setLoading(false); };
  useEffect(() => { load(); }, []);
  const handleDelete = async (id) => { if (!confirm("Delete?")) return; await base44.entities.SalaryProfile.delete(id); load(); };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Salary Profiles</h1>
        <Button onClick={() => { setEditProfile(null); setShowModal(true); }} className="gap-2"><Plus className="w-4 h-4" /> Add Profile</Button>
      </div>
      {loading ? <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div> : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b"><tr>{["Employee","Basic Salary","Frequency","SSS","PhilHealth","Pag-IBIG","Actions"].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {profiles.length === 0 ? <tr><td colSpan={7} className="text-center py-12 text-slate-400">No salary profiles.</td></tr> : profiles.map(p => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{p.employee_name}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-800">₱{Number(p.basic_salary || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 capitalize">{(p.pay_frequency || "").replace("_"," ")}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">₱{Number(p.sss_contribution || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">₱{Number(p.philhealth_contribution || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">₱{Number(p.pagibig_contribution || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 flex gap-1">
                    <button onClick={() => { setEditProfile(p); setShowModal(true); }} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showModal && <ProfileModal profile={editProfile} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load(); }} />}
    </div>
  );
}