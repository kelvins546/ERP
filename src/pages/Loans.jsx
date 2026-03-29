import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Edit, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const statusColors = { active: "bg-blue-100 text-blue-700", fully_paid: "bg-green-100 text-green-700", defaulted: "bg-red-100 text-red-700" };

function LoanModal({ loan, onClose, onSaved }) {
  const [form, setForm] = useState({ employee_name: "", loan_type: "Company", principal_amount: "", balance: "", deduction_per_period: "", start_date: "", status: "active", ...loan });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const save = async () => {
    setSaving(true);
    if (loan?.id) await base44.entities.CompanyLoan.update(loan.id, form);
    else await base44.entities.CompanyLoan.create({ ...form, employee_id: form.employee_id || "manual" });
    onSaved();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold">{loan ? "Edit Loan" : "New Loan"}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div><label className="text-xs font-medium text-slate-600">Employee</label><Input className="mt-1" value={form.employee_name || ""} onChange={e => set("employee_name", e.target.value)} /></div>
          <div><label className="text-xs font-medium text-slate-600">Loan Type</label>
            <select className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.loan_type} onChange={e => set("loan_type", e.target.value)}>
              {["SSS","Pag-IBIG","Company","Emergency"].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-medium text-slate-600">Principal Amount</label><Input className="mt-1" type="number" value={form.principal_amount || ""} onChange={e => set("principal_amount", Number(e.target.value))} /></div>
            <div><label className="text-xs font-medium text-slate-600">Balance</label><Input className="mt-1" type="number" value={form.balance || ""} onChange={e => set("balance", Number(e.target.value))} /></div>
          </div>
          <div><label className="text-xs font-medium text-slate-600">Deduction Per Period</label><Input className="mt-1" type="number" value={form.deduction_per_period || ""} onChange={e => set("deduction_per_period", Number(e.target.value))} /></div>
          <div><label className="text-xs font-medium text-slate-600">Start Date</label><Input className="mt-1" type="date" value={form.start_date || ""} onChange={e => set("start_date", e.target.value)} /></div>
          <div><label className="text-xs font-medium text-slate-600">Status</label>
            <select className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.status} onChange={e => set("status", e.target.value)}>
              {["active","fully_paid","defaulted"].map(s => <option key={s} value={s}>{s.replace("_"," ")}</option>)}
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

export default function Loans() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editLoan, setEditLoan] = useState(null);

  const load = async () => { setLoading(true); const d = await base44.entities.CompanyLoan.list(); setLoans(d); setLoading(false); };
  useEffect(() => { load(); }, []);
  const handleDelete = async (id) => { if (!confirm("Delete?")) return; await base44.entities.CompanyLoan.delete(id); load(); };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Company Loans</h1>
        <Button onClick={() => { setEditLoan(null); setShowModal(true); }} className="gap-2"><Plus className="w-4 h-4" /> Add Loan</Button>
      </div>
      {loading ? <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div> : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b"><tr>{["Employee","Type","Principal","Balance","Deduction/Period","Status","Actions"].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {loans.length === 0 ? <tr><td colSpan={7} className="text-center py-12 text-slate-400">No loans.</td></tr> : loans.map(l => (
                <tr key={l.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{l.employee_name}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{l.loan_type}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">₱{Number(l.principal_amount || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-red-600">₱{Number(l.balance || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">₱{Number(l.deduction_per_period || 0).toLocaleString()}</td>
                  <td className="px-4 py-3"><span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${statusColors[l.status]}`}>{l.status?.replace("_"," ")}</span></td>
                  <td className="px-4 py-3 flex gap-1">
                    <button onClick={() => { setEditLoan(l); setShowModal(true); }} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(l.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showModal && <LoanModal loan={editLoan} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load(); }} />}
    </div>
  );
}