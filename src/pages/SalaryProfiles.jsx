import { useState, useEffect, useRef } from "react";
import { supabase } from "@/api/base44Client";
import {
  Plus,
  Edit,
  Trash2,
  X,
  AlertCircle,
  Download,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- CUSTOM MODALS FOR ALERTS & CONFIRMATIONS ---
function CustomAlert({ isOpen, title, message, onClose }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
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

// --- PROFILES PRINT PREVIEW MODAL ---
function ProfilesPreviewModal({ dataToPrint, onClose }) {
  const iframeRef = useRef(null);
  if (!dataToPrint || dataToPrint.length === 0) return null;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Salary Profiles Masterlist</title>
      <style>
        @page { margin: 20mm; size: letter; }
        body { font-family: 'Arial', sans-serif; color: #000; margin: 0; padding: 20px 0; font-size: 12px; }
        .container { max-width: 800px; margin: 0 auto; }
        .header { display: flex; gap: 20px; align-items: flex-start; margin-bottom: 30px; border-bottom: 2px solid #2E6F40; padding-bottom: 20px; }
        .title { font-size: 24px; font-weight: bold; color: #2E6F40; margin: 0; }
        .subtitle { font-size: 12px; color: #666; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background-color: #f1f5f9; color: #334155; font-size: 11px; text-transform: uppercase; padding: 12px 10px; text-align: left; border-bottom: 2px solid #cbd5e1; }
        td { padding: 12px 10px; border-bottom: 1px solid #e2e8f0; color: #0f172a; }
        .val-right { text-align: right; font-family: monospace; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div>
            <h1 class="title">Salary Profiles Masterlist</h1>
            <p class="subtitle">Generated on ${new Date().toLocaleDateString()}</p>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Employee Name</th>
              <th>Employee No.</th>
              <th class="val-right">Basic Salary</th>
              <th>Frequency</th>
            </tr>
          </thead>
          <tbody>
            ${dataToPrint
              .map(
                (p, i) => `
              <tr>
                <td>${i + 1}</td>
                <td><strong>${p.employees?.first_name || ""} ${p.employees?.last_name || ""}</strong></td>
                <td>${p.employees?.employee_code || "—"}</td>
                <td class="val-right">₱${Number(p.basic_salary || p.basic_pay || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td style="text-transform: capitalize;">${(p.pay_frequency || "").replace("_", " ")}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </body>
    </html>
  `;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden border border-slate-100">
        <div className="flex items-center justify-between p-6 border-b shrink-0 bg-white">
          <h2 className="text-xl font-bold text-[#2E6F40] flex items-center gap-2">
            <Printer className="w-5 h-5" /> Salary Profiles Preview
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="flex-1 bg-slate-100 p-6 flex justify-center">
          <iframe
            ref={iframeRef}
            srcDoc={html}
            title="Profiles Print"
            className="w-full max-w-[850px] h-full bg-white shadow-md border rounded"
          />
        </div>
        <div className="p-6 border-t shrink-0 flex justify-end gap-3 bg-white">
          <Button
            variant="outline"
            className="rounded-xl px-6"
            onClick={onClose}
          >
            Close
          </Button>
          <Button
            className="bg-[#2E6F40] hover:bg-[#235330] text-white gap-2 rounded-xl px-6 shadow-md"
            onClick={() => iframeRef.current?.contentWindow.print()}
          >
            <Printer className="w-4 h-4" /> Print Document
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- THE MODAL (CREATE & UPDATE) ---
function ProfileModal({ profile, employeesList, onClose, onSaved }) {
  const [form, setForm] = useState({
    employee_id: "",
    basic_salary: "",
    pay_frequency: "semi_monthly",
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
        sss_contribution: 0,
        philhealth_contribution: 0,
        pagibig_contribution: 0,
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-slate-100 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-6 border-b bg-white shrink-0">
            <h2 className="text-xl font-bold text-slate-900">
              {profile ? "Edit Salary Profile" : "New Salary Profile"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <div className="p-6 space-y-6 flex-1 bg-slate-50/50">
            <div>
              <label className="text-xs font-bold text-slate-600">
                Employee *
              </label>
              <select
                className="mt-1.5 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2E6F40] transition-shadow font-semibold text-slate-800"
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-600">
                  Basic Salary (₱) *
                </label>
                <Input
                  className="mt-1.5 border-slate-200 focus-visible:ring-[#2E6F40] rounded-xl font-mono font-semibold"
                  type="number"
                  value={form.basic_salary || ""}
                  onChange={(e) => set("basic_salary", e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600">
                  Pay Frequency
                </label>
                <select
                  className="mt-1.5 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2E6F40] transition-shadow font-semibold text-slate-800"
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
              className="bg-[#2E6F40] hover:bg-[#235330] text-white rounded-xl shadow-md px-8 font-bold"
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
  const [previewData, setPreviewData] = useState(null);

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
        .select("*, employees(first_name, last_name, employee_code)")
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

  const triggerDelete = (id) =>
    setConfirmConfig({ isOpen: true, idToDelete: id });

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

  const handleExportCSV = () => {
    if (profiles.length === 0) return;
    let csv = "Employee Name,Employee No.,Basic Salary,Pay Frequency\n";
    profiles.forEach((p) => {
      const name = `${p.employees?.last_name || ""}, ${p.employees?.first_name || ""}`;
      const code = p.employees?.employee_code || "";
      const basic = p.basic_salary || p.basic_pay || 0;
      const freq = (p.pay_frequency || "").replace("_", " ");
      csv += `"${name}","${code}",${basic},"${freq}"\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Salary_Profiles_Masterlist.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="p-6 max-w-[1400px] mx-auto pb-10 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Salary Profiles
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Assign base salaries and payment frequencies to your employees.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleExportCSV}
              disabled={profiles.length === 0}
              variant="outline"
              className="border-[#2E6F40] text-[#2E6F40] hover:bg-[#2E6F40]/10 bg-white rounded-xl px-4 gap-2 shadow-sm font-bold"
            >
              <Download className="w-4 h-4" /> Export CSV
            </Button>
            <Button
              onClick={() => setPreviewData(profiles)}
              disabled={profiles.length === 0}
              variant="outline"
              className="border-[#2E6F40] text-[#2E6F40] hover:bg-[#2E6F40]/10 bg-white rounded-xl px-4 gap-2 shadow-sm font-bold"
            >
              <Printer className="w-4 h-4" /> Print Preview
            </Button>
            <Button
              onClick={() => {
                setEditProfile(null);
                setShowModal(true);
              }}
              className="bg-[#2E6F40] hover:bg-[#235330] text-white gap-2 shadow-sm rounded-xl px-5"
            >
              <Plus className="w-4 h-4" /> Add Profile
            </Button>
          </div>
        </div>

        {/* Main Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-[#2E6F40]/30 border-t-[#2E6F40] rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-bold text-[11px] uppercase tracking-wider text-slate-500 w-16">
                      #
                    </th>
                    <th className="px-6 py-4 font-bold text-[11px] uppercase tracking-wider text-slate-500">
                      Employee
                    </th>
                    <th className="px-6 py-4 font-bold text-[11px] uppercase tracking-wider text-slate-500 text-right">
                      Basic Salary
                    </th>
                    <th className="px-6 py-4 font-bold text-[11px] uppercase tracking-wider text-slate-500">
                      Frequency
                    </th>
                    <th className="px-6 py-4 font-bold text-[11px] uppercase tracking-wider text-slate-500 text-center w-28">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {profiles.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center py-16 text-slate-400 font-medium"
                      >
                        No salary profiles configured yet.
                      </td>
                    </tr>
                  ) : (
                    profiles.map((p, index) => (
                      <tr
                        key={p.id}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        <td className="px-6 py-4 text-slate-400 font-medium">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900">
                          {p.employees ? (
                            <div className="flex items-center gap-2">
                              {p.employees.first_name} {p.employees.last_name}
                              <span className="text-[10px] font-mono font-medium bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                                {p.employees.employee_code || "—"}
                              </span>
                            </div>
                          ) : (
                            <span className="text-red-400">
                              ID: {p.employee_id?.substring(0, 8)}...
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-black bg-emerald-50 text-[#2E6F40] border border-emerald-100">
                            ₱
                            {Number(
                              p.basic_salary || p.basic_pay || 0,
                            ).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-600 capitalize">
                          {(p.pay_frequency || "").replace("_", " ")}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setEditProfile(p);
                                setShowModal(true);
                              }}
                              className="p-1.5 border border-slate-200 rounded-lg text-slate-500 hover:text-[#2E6F40] hover:bg-[#2E6F40]/10 hover:border-[#2E6F40]/30 transition-all"
                              title="Edit Profile"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => triggerDelete(p.id)}
                              className="p-1.5 border border-slate-200 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all"
                              title="Delete Profile"
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
      {previewData && (
        <ProfilesPreviewModal
          dataToPrint={previewData}
          onClose={() => setPreviewData(null)}
        />
      )}
    </>
  );
}
