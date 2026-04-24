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

// --- MATH ENGINE FOR UI PREVIEW ---
// --- MATH ENGINE FOR UI PREVIEW ---
const computeAutoDeductionsPreview = (basicSalary, frequency) => {
  const monthlyBasic =
    frequency === "monthly" ? Number(basicSalary) : Number(basicSalary) * 2;

  let sss = 0;
  if (monthlyBasic > 0) {
    const cappedSalary = Math.min(monthlyBasic, 30000);
    sss = cappedSalary * 0.045; // 4.5% Employee share
  }

  // FIXED PHILHEALTH LOGIC (With Minimum Floor)
  let philhealth = 0;
  if (monthlyBasic > 0) {
    if (monthlyBasic <= 10000) {
      philhealth = 250; // Minimum fixed employee share for 10k and below
    } else {
      const cappedSalary = Math.min(monthlyBasic, 100000);
      philhealth = cappedSalary * 0.025; // 2.5% Employee share
    }
  }

  let pagibig = monthlyBasic > 1500 ? 200 : 0;

  return {
    sss: Math.round(sss * 100) / 100,
    philhealth: Math.round(philhealth * 100) / 100,
    pagibig: pagibig,
  };
};

// --- THE MODAL (CREATE & UPDATE) ---
function ProfileModal({ profile, employeesList, onClose, onSaved }) {
  const [form, setForm] = useState({
    employee_id: "",
    basic_salary: "",
    pay_frequency: "semi_monthly",
    sss_contribution: 0,
    philhealth_contribution: 0,
    pagibig_contribution: 0,
    ...profile,
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
        basic_pay: Number(form.basic_salary),
        basic_salary: Number(form.basic_salary),
        pay_frequency: form.pay_frequency,
        sss_contribution: Number(form.sss_contribution),
        philhealth_contribution: Number(form.philhealth_contribution),
        pagibig_contribution: Number(form.pagibig_contribution),
      };

      if (profile?.id) {
        const { error } = await supabase
          .from("salary_profiles")
          .update(payload)
          .eq("id", profile.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("salary_profiles")
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
          <div className="flex items-center justify-between p-5 border-b">
            <h2 className="text-lg font-semibold">
              {profile ? "Edit Salary Profile" : "New Salary Profile"}
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-600">
                Employee *
              </label>
              <select
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus-visible:outline-none focus-visible:border-[#2E6F40] focus-visible:ring-1 focus-visible:ring-[#2E6F40]"
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600">
                  Basic Salary (₱) *
                </label>
                <Input
                  className="mt-1 focus-visible:ring-[#2E6F40]"
                  type="number"
                  value={form.basic_salary || ""}
                  onChange={(e) => set("basic_salary", e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">
                  Pay Frequency
                </label>
                <select
                  className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus-visible:outline-none focus-visible:border-[#2E6F40] focus-visible:ring-1 focus-visible:ring-[#2E6F40]"
                  value={form.pay_frequency || "semi_monthly"}
                  onChange={(e) => set("pay_frequency", e.target.value)}
                >
                  {["daily", "weekly", "semi_monthly", "monthly"].map((s) => (
                    <option key={s} value={s}>
                      {s.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-2">
              <div className="flex items-start gap-2 mb-3">
                <Info className="w-4 h-4 text-[#2E6F40] flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-bold text-slate-800">
                    Manual Deduction Overrides
                  </h3>
                  <p className="text-[10px] text-slate-500 leading-tight mt-1">
                    Leave these at <strong>0</strong> to let the system
                    auto-calculate standard government rates during payroll.
                    Only enter a number here if the employee requested a fixed
                    voluntary deduction (e.g., ₱500 fixed Pag-IBIG).
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Fixed SSS (₱)
                  </label>
                  <Input
                    className="mt-1 text-sm focus-visible:ring-[#2E6F40]"
                    type="number"
                    value={form.sss_contribution ?? ""}
                    onChange={(e) => set("sss_contribution", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Fixed PhilHealth
                  </label>
                  <Input
                    className="mt-1 text-sm focus-visible:ring-[#2E6F40]"
                    type="number"
                    value={form.philhealth_contribution ?? ""}
                    onChange={(e) =>
                      set("philhealth_contribution", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Fixed Pag-IBIG
                  </label>
                  <Input
                    className="mt-1 text-sm focus-visible:ring-[#2E6F40]"
                    type="number"
                    value={form.pagibig_contribution ?? ""}
                    onChange={(e) =>
                      set("pagibig_contribution", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 p-5 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className="bg-[#2E6F40] hover:bg-[#235330] text-white"
              onClick={save}
              disabled={saving || !form.employee_id || !form.basic_salary}
            >
              {saving ? "Saving..." : "Save Profile"}
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

// --- THE MAIN PAGE ---
export default function SalaryProfiles() {
  const [profiles, setProfiles] = useState([]);
  const [employeesList, setEmployeesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editProfile, setEditProfile] = useState(null);

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
        .from("salary_profiles")
        .select("*, employees(first_name, last_name)")
        .order("id", { ascending: false });

      if (error) throw error;
      setProfiles(data || []);

      const { data: empData, error: empErr } = await supabase
        .from("employees")
        .select("id, first_name, last_name, employee_code")
        .order("first_name", { ascending: true });
      if (!empErr) setEmployeesList(empData || []);
    } catch (error) {
      console.error("Failed to load data:", error.message);
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
        .from("salary_profiles")
        .delete()
        .eq("id", id);
      if (error) throw error;
      load();
    } catch (error) {
      setAlertConfig({
        isOpen: true,
        title: "Delete Failed",
        message: "Failed to delete the salary profile.",
      });
    }
  };

  return (
    <>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Salary Profiles</h1>
          <Button
            onClick={() => {
              setEditProfile(null);
              setShowModal(true);
            }}
            className="bg-[#2E6F40] hover:bg-[#235330] text-white gap-2"
          >
            <Plus className="w-4 h-4" /> Add Profile
          </Button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-[#2E6F40]/30 border-t-[#2E6F40] rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    {[
                      "Employee",
                      "Basic Salary",
                      "Frequency",
                      "Override SSS",
                      "Override PhilHealth",
                      "Override Pag-IBIG",
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
                  {profiles.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-center py-12 text-slate-400"
                      >
                        No salary profiles found.
                      </td>
                    </tr>
                  ) : (
                    profiles.map((p) => {
                      const autoDeductions = computeAutoDeductionsPreview(
                        p.basic_salary || p.basic_pay || 0,
                        p.pay_frequency,
                      );

                      return (
                        <tr
                          key={p.id}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-4 py-3 text-sm font-medium text-slate-900">
                            {p.employees ? (
                              `${p.employees.first_name} ${p.employees.last_name}`
                            ) : (
                              <span className="text-red-400">
                                ID: {p.employee_id?.substring(0, 8)}...
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-slate-800">
                            ₱
                            {Number(
                              p.basic_salary || p.basic_pay || 0,
                            ).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600 capitalize">
                            {(p.pay_frequency || "").replace("_", " ")}
                          </td>

                          <td className="px-4 py-3 text-sm text-slate-600">
                            {p.sss_contribution > 0 ? (
                              <span className="font-bold text-[#2E6F40]">
                                ₱{Number(p.sss_contribution).toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-slate-600">
                                ₱
                                {autoDeductions.sss.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                })}{" "}
                                <span className="text-slate-400 italic text-[10px]">
                                  (Auto/mo)
                                </span>
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {p.philhealth_contribution > 0 ? (
                              <span className="font-bold text-[#2E6F40]">
                                ₱
                                {Number(
                                  p.philhealth_contribution,
                                ).toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-slate-600">
                                ₱
                                {autoDeductions.philhealth.toLocaleString(
                                  undefined,
                                  { minimumFractionDigits: 2 },
                                )}{" "}
                                <span className="text-slate-400 italic text-[10px]">
                                  (Auto/mo)
                                </span>
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {p.pagibig_contribution > 0 ? (
                              <span className="font-bold text-[#2E6F40]">
                                ₱
                                {Number(
                                  p.pagibig_contribution,
                                ).toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-slate-600">
                                ₱
                                {autoDeductions.pagibig.toLocaleString(
                                  undefined,
                                  { minimumFractionDigits: 2 },
                                )}{" "}
                                <span className="text-slate-400 italic text-[10px]">
                                  (Auto/mo)
                                </span>
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditProfile(p);
                                  setShowModal(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-[#2E6F40] hover:bg-[#2E6F40]/10 rounded transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => triggerDelete(p.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showModal && (
          <ProfileModal
            profile={editProfile}
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
        title="Delete Salary Profile"
        message="Are you sure you want to permanently delete this salary profile? This action cannot be undone."
        onCancel={() => setConfirmConfig({ isOpen: false, idToDelete: null })}
        onConfirm={executeDelete}
      />
    </>
  );
}
