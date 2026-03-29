import { useState, useEffect } from "react";
import { supabase } from "@/api/base44Client"; // <-- Clean Supabase import
import { Plus, Edit, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const statusColors = {
  active: "bg-blue-100 text-blue-700",
  fully_paid: "bg-green-100 text-green-700",
  defaulted: "bg-red-100 text-red-700",
};

// --- THE MODAL (CREATE & UPDATE) ---
function LoanModal({ loan, onClose, onSaved }) {
  const [form, setForm] = useState({
    employee_id: "", // Changed from employee_name to employee_id
    loan_type: "Company",
    principal_amount: "",
    balance: "",
    deduction_per_period: "",
    start_date: "",
    status: "active",
    ...loan,
  });

  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      // Build payload matching the newly created SQL table
      const payload = {
        employee_id: form.employee_id || null,
        loan_type: form.loan_type,
        principal_amount: form.principal_amount,
        balance: form.balance,
        deduction_per_period: form.deduction_per_period,
        start_date: form.start_date,
        status: form.status,
      };

      if (loan?.id) {
        // UPDATE
        const { error } = await supabase
          .from("company_loans")
          .update(payload)
          .eq("id", loan.id);
        if (error) throw error;
      } else {
        // CREATE
        const { error } = await supabase
          .from("company_loans")
          .insert([payload]);
        if (error) throw error;
      }
      onSaved();
    } catch (error) {
      console.error("Error saving loan:", error.message);
      alert("Failed to save: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold">
            {loan ? "Edit Loan" : "New Loan"}
          </h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-600">
              Employee ID (UUID) *
            </label>
            <Input
              className="mt-1"
              value={form.employee_id || ""}
              onChange={(e) => set("employee_id", e.target.value)}
              placeholder="Enter Employee UUID"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">
              Loan Type
            </label>
            <select
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={form.loan_type}
              onChange={(e) => set("loan_type", e.target.value)}
            >
              {["SSS", "Pag-IBIG", "Company", "Emergency"].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600">
                Principal Amount (₱) *
              </label>
              <Input
                className="mt-1"
                type="number"
                value={form.principal_amount || ""}
                onChange={(e) =>
                  set("principal_amount", Number(e.target.value))
                }
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">
                Balance (₱) *
              </label>
              <Input
                className="mt-1"
                type="number"
                value={form.balance || ""}
                onChange={(e) => set("balance", Number(e.target.value))}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">
              Deduction Per Period (₱) *
            </label>
            <Input
              className="mt-1"
              type="number"
              value={form.deduction_per_period || ""}
              onChange={(e) =>
                set("deduction_per_period", Number(e.target.value))
              }
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">
              Start Date *
            </label>
            <Input
              className="mt-1"
              type="date"
              value={form.start_date || ""}
              onChange={(e) => set("start_date", e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Status</label>
            <select
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
            >
              {["active", "fully_paid", "defaulted"].map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={save}
            disabled={
              saving ||
              !form.employee_id ||
              !form.principal_amount ||
              !form.start_date
            }
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- THE MAIN PAGE (READ & DELETE) ---
export default function Loans() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editLoan, setEditLoan] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      // Supabase Read
      const { data, error } = await supabase
        .from("company_loans")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLoans(data || []);
    } catch (error) {
      console.error("Failed to load loans:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this loan record?")) return;
    try {
      // Supabase Delete
      const { error } = await supabase
        .from("company_loans")
        .delete()
        .eq("id", id);
      if (error) throw error;
      load();
    } catch (error) {
      console.error("Delete failed:", error.message);
      alert("Failed to delete loan.");
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Company Loans</h1>
        <Button
          onClick={() => {
            setEditLoan(null);
            setShowModal(true);
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" /> Add Loan
        </Button>
      </div>

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
                    "Employee ID",
                    "Type",
                    "Principal",
                    "Balance",
                    "Deduction/Period",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loans.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center py-12 text-slate-400"
                    >
                      No active loans.
                    </td>
                  </tr>
                ) : (
                  loans.map((l) => (
                    <tr
                      key={l.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td
                        className="px-4 py-3 text-sm font-medium text-slate-900"
                        title={l.employee_id}
                      >
                        {l.employee_id
                          ? l.employee_id.substring(0, 8) + "..."
                          : "Unknown"}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {l.loan_type}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        ₱{Number(l.principal_amount || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-red-600">
                        ₱{Number(l.balance || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        ₱{Number(l.deduction_per_period || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize border ${statusColors[l.status] || "bg-slate-100 text-slate-600 border-slate-200"}`}
                        >
                          {l.status?.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 flex gap-2">
                        <button
                          onClick={() => {
                            setEditLoan(l);
                            setShowModal(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(l.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
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
        <LoanModal
          loan={editLoan}
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
