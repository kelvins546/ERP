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
  Banknote,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const statusColors = {
  active: "bg-blue-50 text-blue-700 border-blue-200",
  fully_paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  defaulted: "bg-red-50 text-red-700 border-red-200",
};

// --- CUSTOM MODALS FOR ALERTS & CONFIRMATIONS ---
function CustomAlert({ isOpen, title, message, onClose }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 text-center border border-slate-100">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
          <AlertCircle className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 mb-6">{message}</p>
        <Button
          onClick={onClose}
          className="w-full bg-[#2E6F40] hover:bg-[#235330] text-white rounded-xl"
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 text-center border border-slate-100">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
          <AlertCircle className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 mb-6">{message}</p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            className="w-full rounded-xl"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl"
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-100">
          <div className="flex items-center justify-between p-6 border-b bg-white shrink-0">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Banknote className="w-5 h-5 text-[#2E6F40]" />
              {loan ? "Edit Loan Record" : "Issue New Loan"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 space-y-8">
            {/* SECTION 1: Borrower Details */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-[#2E6F40] uppercase tracking-widest border-b pb-2">
                1. Borrower Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600">
                    Employee *
                  </label>
                  <select
                    className="mt-1.5 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E6F40] transition-shadow font-semibold text-slate-800"
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
                  <label className="text-xs font-bold text-slate-600">
                    Loan Category
                  </label>
                  <select
                    className="mt-1.5 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E6F40] transition-shadow"
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
            </div>

            {/* SECTION 2: Financial Terms */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-[#2E6F40] uppercase tracking-widest border-b pb-2">
                2. Financial Terms
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600">
                    Principal Amount (₱) *
                  </label>
                  <Input
                    className="mt-1.5 border-slate-200 focus-visible:ring-[#2E6F40] rounded-xl font-mono text-base"
                    type="number"
                    placeholder="0.00"
                    value={form.principal_amount || ""}
                    onChange={(e) => handlePrincipalChange(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">
                    Current Balance (₱) *
                  </label>
                  <Input
                    className="mt-1.5 bg-red-50/50 border-red-100 text-red-700 font-bold focus-visible:ring-red-500 rounded-xl font-mono text-base"
                    type="number"
                    placeholder="0.00"
                    value={form.balance || ""}
                    onChange={(e) => set("balance", Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">
                    Deduct Per Cutoff (₱) *
                  </label>
                  <Input
                    className="mt-1.5 border-slate-200 focus-visible:ring-[#2E6F40] rounded-xl font-mono text-base font-bold text-[#2E6F40]"
                    type="number"
                    placeholder="0.00"
                    value={form.deduction_per_period || ""}
                    onChange={(e) =>
                      set("deduction_per_period", Number(e.target.value))
                    }
                  />
                </div>
              </div>

              {/* SMART ASSISTANT BOX */}
              <div className="bg-[#2E6F40]/5 border border-[#2E6F40]/20 rounded-xl p-4 flex gap-3 items-start mt-2 shadow-sm">
                <Calculator className="w-5 h-5 text-[#2E6F40] mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Repayment Estimate
                  </p>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    At ₱{(form.deduction_per_period || 0).toLocaleString()} per
                    payroll period, it will take approximately{" "}
                    <strong className="text-[#2E6F40] bg-[#2E6F40]/10 px-1.5 py-0.5 rounded">
                      {estimatedPeriods} pay periods
                    </strong>{" "}
                    to fully settle the outstanding ₱
                    {(form.balance || 0).toLocaleString()} balance.
                  </p>
                </div>
              </div>
            </div>

            {/* SECTION 3: Scheduling & Status */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-[#2E6F40] uppercase tracking-widest border-b pb-2">
                3. Schedule & Status
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600">
                    Deduction Start Date *
                  </label>
                  <Input
                    className="mt-1.5 border-slate-200 focus-visible:ring-[#2E6F40] rounded-xl"
                    type="date"
                    value={form.start_date || ""}
                    onChange={(e) => set("start_date", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">
                    Account Status
                  </label>
                  <select
                    className="mt-1.5 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E6F40] transition-shadow"
                    value={form.status}
                    onChange={(e) => set("status", e.target.value)}
                  >
                    <option value="active">🟢 Active</option>
                    <option value="fully_paid">✅ Fully Paid</option>
                    <option value="defaulted">🔴 Defaulted</option>
                  </select>
                </div>
              </div>

              {/* USER FRIENDLY STATUS EXPLANATION */}
              <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 flex gap-3 items-start mt-2">
                <Info className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                <div className="text-xs text-slate-600 leading-relaxed space-y-1.5">
                  <p>
                    <strong className="text-slate-800">Active:</strong>{" "}
                    Deductions will automatically apply to generated payslips.
                  </p>
                  <p>
                    <strong className="text-slate-800">Fully Paid:</strong>{" "}
                    Balance is zero. Deductions automatically stop.
                  </p>
                  <p>
                    <strong className="text-slate-800">Defaulted:</strong>{" "}
                    Employee left or cannot pay. Requires manual resolution.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 p-6 border-t bg-white shrink-0">
            <Button
              variant="outline"
              onClick={onClose}
              className="rounded-xl px-6"
            >
              Cancel
            </Button>
            <Button
              className="bg-[#2E6F40] hover:bg-[#235330] text-white rounded-xl px-8 shadow-md font-bold"
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
  const [search, setSearch] = useState("");
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
        .select("*, employees(first_name, last_name, employee_code)")
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

  // Search Filter
  const filteredLoans = loans.filter((l) => {
    if (!search) return true;
    const name =
      `${l.employees?.first_name || ""} ${l.employees?.last_name || ""}`.toLowerCase();
    const code = (l.employees?.employee_code || "").toLowerCase();
    const lType = (l.loan_type || "").toLowerCase();
    return (
      name.includes(search.toLowerCase()) ||
      code.includes(search.toLowerCase()) ||
      lType.includes(search.toLowerCase())
    );
  });

  return (
    <>
      <div className="p-6 max-w-[1400px] mx-auto pb-10 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 bg-[#2E6F40]/10 text-[#2E6F40] rounded-xl flex items-center justify-center">
                <Banknote className="w-5 h-5" />
              </div>
              Company Loans
            </h1>
            <p className="text-sm text-slate-500 mt-1 ml-14">
              Manage employee cash advances, SSS, and Pag-IBIG loans.
            </p>
          </div>
          <Button
            onClick={() => {
              setEditLoan(null);
              setShowModal(true);
            }}
            className="bg-[#2E6F40] hover:bg-[#235330] text-white gap-2 rounded-xl px-5 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Issue New Loan
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search employee or loan type..."
            className="pl-9 bg-white border-slate-200 rounded-xl focus-visible:ring-[#2E6F40]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Main Table */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#2E6F40]/30 border-t-[#2E6F40] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-left font-bold text-[11px] text-slate-500 uppercase tracking-wider w-16">
                      #
                    </th>
                    <th className="px-6 py-4 text-left font-bold text-[11px] text-slate-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-4 text-left font-bold text-[11px] text-slate-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 text-right font-bold text-[11px] text-slate-500 uppercase tracking-wider">
                      Principal
                    </th>
                    <th className="px-6 py-4 text-right font-bold text-[11px] text-slate-500 uppercase tracking-wider">
                      Balance
                    </th>
                    <th className="px-6 py-4 text-right font-bold text-[11px] text-slate-500 uppercase tracking-wider">
                      Deduct/Period
                    </th>
                    <th className="px-6 py-4 text-center font-bold text-[11px] text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-center font-bold text-[11px] text-slate-500 uppercase tracking-wider w-28">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLoans.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="text-center py-16 text-slate-400 font-medium"
                      >
                        No active loans found.
                      </td>
                    </tr>
                  ) : (
                    filteredLoans.map((l, index) => (
                      <tr
                        key={l.id}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        <td className="px-6 py-4 text-slate-400 font-medium text-sm">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900">
                          {l.employees ? (
                            <div className="flex items-center gap-2">
                              {l.employees.first_name} {l.employees.last_name}
                              <span className="text-[10px] font-mono font-medium bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                                {l.employees.employee_code || "—"}
                              </span>
                            </div>
                          ) : (
                            <span className="text-red-400">
                              ID: {l.employee_id?.substring(0, 8)}...
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 font-semibold">
                          {l.loan_type}
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-slate-500 text-right">
                          ₱
                          {Number(l.principal_amount || 0).toLocaleString(
                            undefined,
                            { minimumFractionDigits: 2 },
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold font-mono text-red-600 bg-red-50/30 text-right">
                          ₱
                          {Number(l.balance || 0).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-6 py-4 text-sm font-mono font-bold text-[#2E6F40] bg-emerald-50/30 text-right">
                          ₱
                          {Number(l.deduction_per_period || 0).toLocaleString(
                            undefined,
                            { minimumFractionDigits: 2 },
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase border ${statusColors[l.status] || "bg-slate-100 text-slate-600 border-slate-200"}`}
                          >
                            {l.status?.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setEditLoan(l);
                                setShowModal(true);
                              }}
                              className="p-1.5 border border-slate-200 rounded-lg text-slate-500 hover:text-[#2E6F40] hover:bg-[#2E6F40]/10 hover:border-[#2E6F40]/30 transition-all"
                              title="Edit Loan"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => triggerDelete(l.id)}
                              className="p-1.5 border border-slate-200 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all"
                              title="Delete Loan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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
