import { useState, useEffect } from "react";
import { supabase } from "@/api/base44Client"; // <-- Clean Supabase import
import { Plus, X, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- THE MODAL (CREATE & UPDATE) ---
function PayslipModal({ payslip, onClose, onSaved }) {
  const [form, setForm] = useState({
    employee_id: "",
    period_id: "",
    gross_pay: 0,
    overtime_pay: 0,
    allowances: 0,
    sss_deduction: 0,
    philhealth_deduction: 0,
    pagibig_deduction: 0,
    tax_deduction: 0,
    loan_deductions: 0,
    total_deductions: 0,
    net_pay: 0,
    ...payslip,
  });

  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      // Build payload explicitly. Notice we don't save employee_name or department_name,
      // because the database uses relations (UUIDs) for those.
      const payload = {
        employee_id: form.employee_id || null,
        period_id: form.period_id || null,
        gross_pay: form.gross_pay,
        overtime_pay: form.overtime_pay,
        allowances: form.allowances,
        sss_deduction: form.sss_deduction,
        philhealth_deduction: form.philhealth_deduction,
        pagibig_deduction: form.pagibig_deduction,
        tax_deduction: form.tax_deduction,
        loan_deductions: form.loan_deductions,
        total_deductions: form.total_deductions,
        net_pay: form.net_pay,
      };

      if (payslip?.id) {
        // UPDATE
        const { error } = await supabase
          .from("payslips")
          .update(payload)
          .eq("id", payslip.id);
        if (error) throw error;
      } else {
        // CREATE
        const { error } = await supabase.from("payslips").insert([payload]);
        if (error) throw error;
      }
      onSaved();
    } catch (error) {
      console.error("Error saving payslip:", error.message);
      alert("Failed to save: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Separated IDs from numeric fields for better UI rendering
  const idFields = [
    ["employee_id", "Employee ID (UUID)"],
    ["period_id", "Payroll Period ID (UUID)"],
  ];

  const moneyFields = [
    ["gross_pay", "Gross Pay"],
    ["overtime_pay", "Overtime Pay"],
    ["allowances", "Allowances"],
    ["sss_deduction", "SSS"],
    ["philhealth_deduction", "PhilHealth"],
    ["pagibig_deduction", "Pag-IBIG"],
    ["tax_deduction", "Withholding Tax"],
    ["loan_deductions", "Loan Deductions"],
    ["total_deductions", "Total Deductions"],
    ["net_pay", "Net Pay"],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold">
            {payslip ? "Edit Payslip" : "New Payslip"}
          </h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-5">
          {/* Identifiers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 pb-6 border-b border-slate-100">
            {idFields.map(([key, label]) => (
              <div key={key}>
                <label className="text-xs font-medium text-slate-600">
                  {label} *
                </label>
                <Input
                  className="mt-1"
                  type="text"
                  value={form[key] || ""}
                  onChange={(e) => set(key, e.target.value)}
                  placeholder={`Enter ${label}`}
                />
              </div>
            ))}
          </div>

          {/* Financials */}
          <h3 className="text-sm font-semibold text-slate-800 mb-3">
            Financial Breakdown
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {moneyFields.map(([key, label]) => (
              <div key={key}>
                <label className="text-xs font-medium text-slate-600">
                  {label}
                </label>
                <Input
                  className="mt-1"
                  type="number"
                  step="0.01"
                  value={form[key] || ""}
                  onChange={(e) => set(key, Number(e.target.value))}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 p-5 border-t sticky bottom-0 bg-white z-10">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={save}
            disabled={saving || !form.employee_id || !form.period_id}
          >
            {saving ? "Saving..." : "Save Payslip"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- THE MAIN PAGE (READ & DELETE) ---
export default function Payslips() {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editPayslip, setEditPayslip] = useState(null);
  const [search, setSearch] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      // Supabase Read - Relational Join!
      // This grabs the payslip, and magically reaches into the employees and payroll_periods tables to get names.
      const { data, error } = await supabase
        .from("payslips")
        .select(
          `
          *,
          employees ( first_name, last_name, departments ( name ) ),
          payroll_periods ( name )
        `,
        )
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;
      setPayslips(data || []);
    } catch (error) {
      console.error("Failed to load payslips:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this payslip?")) return;
    try {
      const { error } = await supabase.from("payslips").delete().eq("id", id);
      if (error) throw error;
      load();
    } catch (error) {
      console.error("Delete failed:", error.message);
      alert("Failed to delete payslip.");
    }
  };

  // Custom filter logic to search through the joined data
  const filtered = payslips.filter((p) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();

    // Safely extract joined names
    const empName =
      `${p.employees?.first_name || ""} ${p.employees?.last_name || ""}`.toLowerCase();
    const periodName = (p.payroll_periods?.name || "").toLowerCase();

    return empName.includes(searchLower) || periodName.includes(searchLower);
  });

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Payslips</h1>
        <Button
          onClick={() => {
            setEditPayslip(null);
            setShowModal(true);
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" /> New Payslip
        </Button>
      </div>

      <Input
        placeholder="Search by employee name or period..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-xs bg-white"
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  {[
                    "Employee",
                    "Department",
                    "Period",
                    "Gross",
                    "Deductions",
                    "Net Pay",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center py-12 text-slate-400"
                    >
                      No payslips found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-slate-900 whitespace-nowrap">
                        {p.employees ? (
                          `${p.employees.first_name} ${p.employees.last_name}`
                        ) : (
                          <span className="text-red-500" title={p.employee_id}>
                            ID: {p.employee_id?.substring(0, 8)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">
                        {p.employees?.departments?.name || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">
                        {p.payroll_periods?.name || (
                          <span
                            className="text-xs text-slate-400"
                            title={p.period_id}
                          >
                            {p.period_id?.substring(0, 8)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-800">
                        ₱{(p.gross_pay || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-red-600">
                        ₱{(p.total_deductions || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-green-700">
                        ₱{(p.net_pay || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 flex gap-3">
                        <button
                          onClick={() => {
                            setEditPayslip(p);
                            setShowModal(true);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" /> View/Edit
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="text-xs text-red-500 hover:text-red-700 hover:underline flex items-center gap-1 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <PayslipModal
          payslip={editPayslip}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            load();
          }}
        />
      )}
    </div>
  );
}
