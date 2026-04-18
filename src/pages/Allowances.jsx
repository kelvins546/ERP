import { useState, useEffect } from "react";
import { supabase } from "@/api/base44Client";
import { Plus, Edit, Trash2, X, Info, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
function AllowanceModal({ item, employeesList, onClose, onSaved }) {
  const [form, setForm] = useState({
    employee_id: "",
    allowance_name: "",
    amount: "",
    frequency: "monthly",
    is_taxable: false,
    ...item,
  });

  const [saving, setSaving] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        employee_id: form.employee_id || null,
        allowance_name: form.allowance_name,
        amount: Number(form.amount),
        frequency: form.frequency,
        is_taxable: form.is_taxable,
      };

      if (item?.id) {
        const { error } = await supabase
          .from("employee_allowances")
          .update(payload)
          .eq("id", item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("employee_allowances")
          .insert([payload]);
        if (error) throw error;
      }
      onSaved();
    } catch (error) {
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
              {item ? "Edit Allowance" : "Add Allowance"}
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* SECTION 1: Assignment */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                1. Assignment
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
            </div>

            <hr className="border-slate-100" />

            {/* SECTION 2: Allowance Details */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                2. Allowance Details
              </h3>
              <div>
                <label className="text-xs font-medium text-slate-600">
                  Allowance Name *
                </label>
                <Input
                  className="mt-1 focus-visible:ring-[#2E6F40]"
                  placeholder="e.g. Rice Subsidy, Transportation, Communication..."
                  value={form.allowance_name || ""}
                  onChange={(e) => set("allowance_name", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600">
                    Amount (₱) *
                  </label>
                  <Input
                    className="mt-1 focus-visible:ring-[#2E6F40]"
                    type="number"
                    placeholder="0.00"
                    value={form.amount || ""}
                    onChange={(e) => set("amount", Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">
                    Frequency
                  </label>
                  <select
                    className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E6F40]"
                    value={form.frequency}
                    onChange={(e) => set("frequency", e.target.value)}
                  >
                    {["daily", "weekly", "semi_monthly", "monthly"].map((f) => (
                      <option key={f} value={f}>
                        {f.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 3: Tax Settings */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex items-start gap-2 mb-3">
                <Info className="w-4 h-4 text-[#2E6F40] flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-bold text-slate-800">
                    Tax Configuration
                  </h3>
                  <p className="text-[10px] text-slate-500 leading-tight mt-1">
                    If checked, this amount will be added to the basic pay
                    before computing the withholding tax. If unchecked (De
                    Minimis), it will be added to the Net Pay without being
                    taxed.
                  </p>
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-colors">
                <input
                  type="checkbox"
                  checked={form.is_taxable || false}
                  onChange={(e) => set("is_taxable", e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#2E6F40] focus:ring-[#2E6F40]"
                />
                <span className="text-sm font-medium text-slate-700">
                  This allowance is taxable
                </span>
              </label>
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
                !form.allowance_name ||
                !form.amount
              }
            >
              {saving ? "Saving..." : "Save Allowance"}
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
export default function Allowances() {
  const [allowances, setAllowances] = useState([]);
  const [employeesList, setEmployeesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);

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
      const { data, error } = await supabase
        .from("employee_allowances")
        .select("*, employees(first_name, last_name)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAllowances(data || []);

      const { data: empData, error: empErr } = await supabase
        .from("employees")
        .select("id, first_name, last_name, employee_code")
        .order("first_name", { ascending: true });
      if (!empErr) setEmployeesList(empData || []);
    } catch (error) {
      console.error(error);
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
        .from("employee_allowances")
        .delete()
        .eq("id", id);
      if (error) throw error;
      load();
    } catch (error) {
      setAlertConfig({
        isOpen: true,
        title: "Delete Failed",
        message: "Failed to delete the allowance.",
      });
    }
  };

  return (
    <>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Employee Allowances
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage recurring bonuses, subsidies, and incentives.
            </p>
          </div>
          <Button
            onClick={() => {
              setEditItem(null);
              setShowModal(true);
            }}
            className="bg-[#2E6F40] hover:bg-[#235330] text-white gap-2"
          >
            <Plus className="w-4 h-4" /> Add Allowance
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#2E6F40]/30 border-t-[#2E6F40] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    {[
                      "Employee",
                      "Allowance",
                      "Amount",
                      "Frequency",
                      "Taxable",
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
                  {allowances.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center py-12 text-slate-400"
                      >
                        No allowances assigned yet.
                      </td>
                    </tr>
                  ) : (
                    allowances.map((a) => (
                      <tr
                        key={a.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                          {a.employees ? (
                            `${a.employees.first_name} ${a.employees.last_name}`
                          ) : (
                            <span className="text-slate-400">
                              ID: {a.employee_id?.slice(0, 8)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-700 font-medium">
                          {a.allowance_name}
                        </td>
                        <td className="px-4 py-3 font-semibold text-green-700">
                          ₱{Number(a.amount || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-slate-600 capitalize">
                          {(a.frequency || "").replace("_", " ")}
                        </td>
                        <td className="px-4 py-3">
                          {a.is_taxable ? (
                            <span className="text-[10px] font-bold bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-full uppercase">
                              Taxable
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold bg-green-50 text-green-600 border border-green-100 px-2 py-0.5 rounded-full uppercase">
                              Non-taxable
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 flex gap-2">
                          <button
                            onClick={() => {
                              setEditItem(a);
                              setShowModal(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-[#2E6F40] hover:bg-[#2E6F40]/10 rounded transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => triggerDelete(a.id)}
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
          <AllowanceModal
            item={editItem}
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
        title="Delete Allowance"
        message="Are you sure you want to permanently delete this allowance? This action cannot be undone."
        onCancel={() => setConfirmConfig({ isOpen: false, idToDelete: null })}
        onConfirm={executeDelete}
      />
    </>
  );
}
