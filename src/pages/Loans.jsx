import { useState, useEffect } from "react";
import { supabase } from "@/api/base44Client";
import {
  Plus,
  Edit,
  Trash2,
  X,
  Calculator,
  AlertCircle,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const statusColors = {
  active: "bg-blue-100 text-blue-700",
  fully_paid: "bg-green-100 text-green-700",
  defaulted: "bg-red-100 text-red-700",
};

// --- CUSTOM MODALS FOR ALERTS & CONFIRMATIONS ---
function CustomAlert({ isOpen, title, message, onClose }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
          <AlertCircle className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 mb-6">{message}</p>
        <Button
          onClick={onClose}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white"
        >
          Acknowledge
        </Button>
      </div>
    </div>
  );
}

function CustomConfirm({ isOpen, title, message, onCancel, onConfirm }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
          <AlertCircle className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 mb-6">{message}</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} className="w-full">
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            Confirm Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- THE MODAL (CREATE & UPDATE) ---
function LoanModal({ loan, employeesList, onClose, onSaved }) {
  const [form, setForm] = useState({
    employee_id: "",
    loan_type: "Company",
    principal_amount: "",
    balance: "",
    deduction_per_period: "",
    start_date: "",
    status: "active",
    ...loan,
  });

  const [saving, setSaving] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Auto-sync Balance with Principal for NEW loans
  const handlePrincipalChange = (val) => {
    const numVal = Number(val);
    setForm((f) => ({
      ...f,
      principal_amount: numVal,
      balance: !loan ? numVal : f.balance,
    }));
  };

  // Calculate how many periods it will take to pay off
  const estimatedPeriods =
    form.balance > 0 && form.deduction_per_period > 0
      ? Math.ceil(form.balance / form.deduction_per_period)
      : 0;

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        employee_id: form.employee_id || null,
        loan_type: form.loan_type,
        principal_amount: Number(form.principal_amount),
        balance: Number(form.balance),
        deduction_per_period: Number(form.deduction_per_period),
        start_date: form.start_date,
        status: form.status,
      };

      if (loan?.id) {
        const { error } = await supabase
          .from("company_loans")
          .update(payload)
          .eq("id", loan.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("company_loans")
          .insert([payload]);
        if (error) throw error;
      }
      onSaved();
    } catch (error) {
      console.error("Error saving loan:", error.message);
      setAlertConfig({
        isOpen: true,
        title: "Save Failed",
        message: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
            <h2 className="text-lg font-semibold">
              {loan ? "Edit Loan Record" : "Issue New Loan"}
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* SECTION 1: Borrower Details */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                1. Borrower Details
              </h3>
              <div>
                <label className="text-xs font-medium text-slate-600">
                  Employee *
                </label>
                <select
                  className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus-visible:ring-[#2E6F40] focus-visible:border-[#2E6F40]"
                  value={form.employee_id || ""}
                  onChange={(e) => set("employee_id", e.target.value)}
                >
                  <option value="">-- Select Employee --</option>
                  {employeesList.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name} ({emp.employee_code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">
                  Loan Category
                </label>
                <select
                  className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E6F40]"
                  value={form.loan_type}
                  onChange={(e) => set("loan_type", e.target.value)}
                >
                  {["SSS", "Pag-IBIG", "Company", "Emergency"].map((t) => (
                    <option key={t} value={t}>
                      {t} Loan
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* SECTION 2: Financial Terms */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                2. Financial Terms
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600">
                    Principal Amount (₱) *
                  </label>
                  <Input
                    className="mt-1 focus-visible:ring-[#2E6F40]"
                    type="number"
                    placeholder="0.00"
                    value={form.principal_amount || ""}
                    onChange={(e) => handlePrincipalChange(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">
                    Current Balance (₱) *
                  </label>
                  <Input
                    className="mt-1 bg-slate-50 focus-visible:ring-[#2E6F40]"
                    type="number"
                    placeholder="0.00"
                    value={form.balance || ""}
                    onChange={(e) => set("balance", Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600">
                  Deduction Per Payroll Period (₱) *
                </label>
                <Input
                  className="mt-1 border-[#2E6F40]/30 focus-visible:ring-[#2E6F40]"
                  type="number"
                  placeholder="0.00"
                  value={form.deduction_per_period || ""}
                  onChange={(e) =>
                    set("deduction_per_period", Number(e.target.value))
                  }
                />
              </div>

              {/* SMART ASSISTANT BOX */}
              <div className="bg-[#2E6F40]/5 border border-[#2E6F40]/20 rounded-xl p-3 flex gap-3 items-start mt-2">
                <Calculator className="w-4 h-4 text-[#2E6F40] mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    Repayment Estimate
                  </p>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-tight">
                    At ₱{(form.deduction_per_period || 0).toLocaleString()} per
                    period, it will take approximately{" "}
                    <strong className="text-[#2E6F40] bg-[#2E6F40]/10 px-1 rounded">
                      {estimatedPeriods} pay periods
                    </strong>{" "}
                    to fully settle the ₱{(form.balance || 0).toLocaleString()}{" "}
                    balance.
                  </p>
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* SECTION 3: Scheduling & Status */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                3. Schedule & Status
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600">
                    Deduction Start Date *
                  </label>
                  <Input
                    className="mt-1 focus-visible:ring-[#2E6F40]"
                    type="date"
                    value={form.start_date || ""}
                    onChange={(e) => set("start_date", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">
                    Account Status
                  </label>
                  <select
                    className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E6F40]"
                    value={form.status}
                    onChange={(e) => set("status", e.target.value)}
                  >
                    <option value="active">Active</option>
                    <option value="fully_paid">Fully Paid</option>
                    <option value="defaulted">Defaulted</option>
                  </select>
                </div>
              </div>

              {/* USER FRIENDLY STATUS EXPLANATION */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex gap-2 items-start mt-2">
                <Info className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div className="text-[10px] text-slate-600 leading-tight space-y-1">
                  <p>
                    <strong>Active:</strong> Deductions will automatically apply
                    to payslips.
                  </p>
                  <p>
                    <strong>Fully Paid:</strong> Balance is zero. Deductions
                    automatically stop.
                  </p>
                  <p>
                    <strong>Defaulted:</strong> Employee left or cannot pay.
                    Requires manual resolution.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 p-5 border-t sticky bottom-0 bg-white z-10">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className="bg-[#2E6F40] hover:bg-[#235330] text-white"
              onClick={save}
              disabled={
                saving ||
                !form.employee_id ||
                !form.principal_amount ||
                !form.start_date ||
                !form.deduction_per_period
              }
            >
              {saving ? "Saving..." : "Save Loan Record"}
            </Button>
          </div>
        </div>
      </div>

      <CustomAlert
        isOpen={alertConfig.isOpen}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() =>
          setAlertConfig({ isOpen: false, title: "", message: "" })
        }
      />
    </>
  );
}

// --- THE MAIN PAGE (READ & DELETE) ---
export default function Loans() {
  const [loans, setLoans] = useState([]);
  const [employeesList, setEmployeesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editLoan, setEditLoan] = useState(null);

  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
  });
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    idToDelete: null,
  });

  const load = async () => {
    try {
      setLoading(true);
      // Fetch Loans
      const { data, error } = await supabase
        .from("company_loans")
        .select("*, employees(first_name, last_name)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLoans(data || []);

      // Fetch Employees for dropdown
      const { data: empData, error: empErr } = await supabase
        .from("employees")
        .select("id, first_name, last_name, employee_code")
        .order("first_name", { ascending: true });
      if (!empErr) setEmployeesList(empData || []);
    } catch (error) {
      console.error("Failed to load loans:", error.message);
      setAlertConfig({
        isOpen: true,
        title: "Load Failed",
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const triggerDelete = (id) => {
    setConfirmConfig({ isOpen: true, idToDelete: id });
  };

  const executeDelete = async () => {
    const id = confirmConfig.idToDelete;
    setConfirmConfig({ isOpen: false, idToDelete: null });
    try {
      const { error } = await supabase
        .from("company_loans")
        .delete()
        .eq("id", id);
      if (error) throw error;
      load();
    } catch (error) {
      console.error("Delete failed:", error.message);
      setAlertConfig({
        isOpen: true,
        title: "Delete Failed",
        message: "Failed to delete the loan record.",
      });
    }
  };

  return (
    <>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Company Loans</h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage employee cash advances and statutory loans.
            </p>
          </div>
          <Button
            onClick={() => {
              setEditLoan(null);
              setShowModal(true);
            }}
            className="bg-[#2E6F40] hover:bg-[#235330] text-white gap-2"
          >
            <Plus className="w-4 h-4" /> Issue New Loan
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#2E6F40]/30 border-t-[#2E6F40] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    {[
                      "Employee",
                      "Type",
                      "Principal",
                      "Balance",
                      "Deduction/Period",
                      "Status",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
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
                        No active loans found.
                      </td>
                    </tr>
                  ) : (
                    loans.map((l) => (
                      <tr
                        key={l.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm font-medium text-slate-900 whitespace-nowrap">
                          {l.employees ? (
                            `${l.employees.first_name} ${l.employees.last_name}`
                          ) : (
                            <span className="text-red-400">
                              ID: {l.employee_id?.substring(0, 8)}...
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 font-medium">
                          {l.loan_type}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          ₱{Number(l.principal_amount || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-red-600">
                          ₱{Number(l.balance || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          ₱
                          {Number(l.deduction_per_period || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${statusColors[l.status] || "bg-slate-100 text-slate-600 border-slate-200"}`}
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
                            className="p-1.5 text-slate-400 hover:text-[#2E6F40] hover:bg-[#2E6F40]/10 rounded transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => triggerDelete(l.id)}
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
            employeesList={employeesList}
            onClose={() => setShowModal(false)}
            onSaved={() => {
              setShowModal(false);
              load();
            }}
          />
        )}
      </div>

      <CustomAlert
        isOpen={alertConfig.isOpen}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() =>
          setAlertConfig({ isOpen: false, title: "", message: "" })
        }
      />
      <CustomConfirm
        isOpen={confirmConfig.isOpen}
        title="Delete Loan"
        message="Are you sure you want to permanently delete this loan record? This action cannot be undone."
        onCancel={() => setConfirmConfig({ isOpen: false, idToDelete: null })}
        onConfirm={executeDelete}
      />
    </>
  );
}
