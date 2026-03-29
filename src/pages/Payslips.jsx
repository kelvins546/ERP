import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function PayslipModal({ payslip, onClose, onSaved }) {
  const [form, setForm] = useState({ employee_name: "", department_name: "", period_name: "", gross_pay: 0, total_deductions: 0, net_pay: 0, sss_deduction: 0, philhealth_deduction: 0, pagibig_deduction: 0, tax_deduction: 0, loan_deductions: 0, overtime_pay: 0, allowances: 0, ...payslip });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const save = async () => {
    setSaving(true);
    if (payslip?.id) await base44.entities.Payslip.update(payslip.id, form);
    else await base44.entities.Payslip.create({ ...form, employee_id: form.employee_id || "manual", period_id: form.period_id || "manual" });
    onSaved();
  };
  const fields = [
    ["employee_name","Employee"],["department_name","Department"],["period_name","Period"],
    ["gross_pay","Gross Pay","number"],["overtime_pay","Overtime Pay","number"],["allowances","Allowances","number"],
    ["sss_deduction","SSS","number"],["philhealth_deduction","PhilHealth","number"],["pagibig_deduction","Pag-IBIG","number"],
    ["tax_deduction","Withholding Tax","number"],["loan_deductions","Loan Deductions","number"],
    ["total_deductions","Total Deductions","number"],["net_pay","Net Pay","number"],
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold">{payslip ? "Edit Payslip" : "New Payslip"}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-5 grid grid-cols-2 gap-3">
          {fields.map(([key, label, type]) => (
            <div key={key}><label className="text-xs font-medium text-slate-600">{label}</label>
              <Input className="mt-1" type={type || "text"} value={form[key] || ""} onChange={e => set(key, type === "number" ? Number(e.target.value) : e.target.value)} />
            </div>
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

export default function Payslips() {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editPayslip, setEditPayslip] = useState(null);
  const [search, setSearch] = useState("");

  const load = async () => { setLoading(true); const d = await base44.entities.Payslip.list("-created_date", 200); setPayslips(d); setLoading(false); };
  useEffect(() => { load(); }, []);

  const filtered = payslips.filter(p => !search || p.employee_name?.toLowerCase().includes(search.toLowerCase()) || p.period_name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Payslips</h1>
        <Button onClick={() => { setEditPayslip(null); setShowModal(true); }} className="gap-2"><Plus className="w-4 h-4" /> New Payslip</Button>
      </div>
      <Input placeholder="Search by employee or period..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
      {loading ? <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div> : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b"><tr>{["Employee","Department","Period","Gross","Deductions","Net Pay",""].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? <tr><td colSpan={7} className="text-center py-12 text-slate-400">No payslips.</td></tr> : filtered.map(p => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{p.employee_name}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{p.department_name || "—"}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{p.period_name || "—"}</td>
                  <td className="px-4 py-3 text-sm text-slate-800">₱{(p.gross_pay || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-red-600">₱{(p.total_deductions || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-green-700">₱{(p.net_pay || 0).toLocaleString()}</td>
                  <td className="px-4 py-3"><button onClick={() => { setEditPayslip(p); setShowModal(true); }} className="text-xs text-blue-600 hover:underline flex items-center gap-1"><FileText className="w-3.5 h-3.5" />View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showModal && <PayslipModal payslip={editPayslip} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load(); }} />}
    </div>
  );
}