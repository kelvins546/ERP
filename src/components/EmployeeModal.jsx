import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function EmployeeModal({ employee, onClose, onSaved }) {
  const [form, setForm] = useState({
    employee_code: "", first_name: "", last_name: "", middle_name: "",
    email: "", phone: "", department_name: "", position_name: "",
    status: "probationary", hire_date: "", address: "",
    sss_number: "", philhealth_number: "", pagibig_number: "", tin_number: "",
    emergency_contact_name: "", emergency_contact_phone: "",
    ...employee
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    if (employee?.id) {
      await base44.entities.Employee.update(employee.id, form);
    } else {
      await base44.entities.Employee.create(form);
    }
    onSaved();
  };

  const fields = [
    { key: "employee_code", label: "Employee Code", required: true },
    { key: "first_name", label: "First Name", required: true },
    { key: "last_name", label: "Last Name", required: true },
    { key: "middle_name", label: "Middle Name" },
    { key: "email", label: "Email", type: "email" },
    { key: "phone", label: "Phone" },
    { key: "department_name", label: "Department" },
    { key: "position_name", label: "Position" },
    { key: "hire_date", label: "Hire Date", type: "date" },
    { key: "address", label: "Address" },
    { key: "sss_number", label: "SSS Number" },
    { key: "philhealth_number", label: "PhilHealth Number" },
    { key: "pagibig_number", label: "Pag-IBIG Number" },
    { key: "tin_number", label: "TIN Number" },
    { key: "emergency_contact_name", label: "Emergency Contact" },
    { key: "emergency_contact_phone", label: "Emergency Contact Phone" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold">{employee ? "Edit Employee" : "Add Employee"}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400 hover:text-slate-700" /></button>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map(f => (
              <div key={f.key}>
                <label className="block text-xs font-medium text-slate-600 mb-1">{f.label}{f.required && " *"}</label>
                <Input type={f.type || "text"} value={form[f.key] || ""} onChange={e => set(f.key, e.target.value)} placeholder={f.label} />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Employment Status *</label>
              <select value={form.status} onChange={e => set("status", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                {["probationary", "regular", "contractual", "resigned", "terminated"].map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save Employee"}</Button>
        </div>
      </div>
    </div>
  );
}