import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Edit, Trash2, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const statusColors = { probationary: "bg-yellow-100 text-yellow-700", regular: "bg-green-100 text-green-700", contractual: "bg-blue-100 text-blue-700", resigned: "bg-gray-100 text-gray-600", terminated: "bg-red-100 text-red-700" };

function EmpModal({ emp, onClose, onSaved }) {
  const [form, setForm] = useState({ employee_code: "", first_name: "", last_name: "", middle_name: "", email: "", phone: "", department_name: "", position_name: "", status: "probationary", hire_date: "", address: "", sss_number: "", philhealth_number: "", pagibig_number: "", tin_number: "", emergency_contact_name: "", emergency_contact_phone: "", ...emp });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const save = async () => { setSaving(true); if (emp?.id) await base44.entities.Employee.update(emp.id, form); else await base44.entities.Employee.create(form); onSaved(); };
  const fields = [["employee_code","Employee Code",true],["first_name","First Name",true],["last_name","Last Name",true],["middle_name","Middle Name"],["email","Email"],["phone","Phone"],["department_name","Department"],["position_name","Position"],["hire_date","Hire Date","date"],["address","Address"],["sss_number","SSS Number"],["philhealth_number","PhilHealth Number"],["pagibig_number","Pag-IBIG Number"],["tin_number","TIN Number"],["emergency_contact_name","Emergency Contact"],["emergency_contact_phone","EC Phone"]];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-semibold">{emp ? "Edit Employee" : "Add Employee"}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map(([k, label, req]) => (
            <div key={k}><label className="text-xs font-medium text-slate-600">{label}{req ? " *" : ""}</label><Input className="mt-1" type={k === "hire_date" ? "date" : "text"} value={form[k] || ""} onChange={e => set(k, e.target.value)} /></div>
          ))}
          <div><label className="text-xs font-medium text-slate-600">Employment Status *</label>
            <select className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.status} onChange={e => set("status", e.target.value)}>
              {["probationary","regular","contractual","resigned","terminated"].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t sticky bottom-0 bg-white">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save Employee"}</Button>
        </div>
      </div>
    </div>
  );
}

export default function EmployeeMasterlist() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editEmp, setEditEmp] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const load = async () => { setLoading(true); const d = await base44.entities.Employee.list("-created_date", 500); setEmployees(d); setLoading(false); };
  useEffect(() => { load(); }, []);
  const del = async (id) => { if (!confirm("Delete this employee?")) return; await base44.entities.Employee.delete(id); load(); };

  const filtered = employees.filter(e => {
    const matchSearch = !search || `${e.first_name} ${e.last_name} ${e.employee_code}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-900">Employee Masterlist</h1><p className="text-sm text-slate-500 mt-1">Employment Status Tracking</p></div>
        <Button onClick={() => { setEditEmp(null); setShowModal(true); }} className="gap-2"><Plus className="w-4 h-4" /> Add Employee</Button>
      </div>
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input className="pl-9" placeholder="Search name or code..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          {["probationary","regular","contractual","resigned","terminated"].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
        </select>
      </div>
      {loading ? <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"/></div> : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b"><tr>{["Code","Name","Department","Position","Status","Hire Date","Actions"].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? <tr><td colSpan={7} className="text-center py-12 text-slate-400">No employees found.</td></tr> : filtered.map(e => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{e.employee_code}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{e.first_name} {e.last_name}</td>
                  <td className="px-4 py-3 text-slate-600">{e.department_name || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{e.position_name || "—"}</td>
                  <td className="px-4 py-3"><span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${statusColors[e.status] || "bg-gray-100 text-gray-600"}`}>{e.status}</span></td>
                  <td className="px-4 py-3 text-slate-500">{e.hire_date || "—"}</td>
                  <td className="px-4 py-3 flex gap-1">
                    <button onClick={() => { setEditEmp(e); setShowModal(true); }} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-4 h-4"/></button>
                    <button onClick={() => del(e.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4"/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showModal && <EmpModal emp={editEmp} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load(); }} />}
    </div>
  );
}