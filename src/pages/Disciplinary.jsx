import { useState, useEffect } from "react";
import { supabase } from "@/api/base44Client";
import {
  Plus,
  X,
  AlertTriangle,
  Edit,
  Trash2,
  AlertCircle,
  Scale,
  CalendarClock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const statusColors = {
  "Pending Investigation": "bg-slate-100 text-slate-700 border-slate-200",
  "NTE Issued": "bg-yellow-50 text-yellow-700 border-yellow-200",
  "Resolved/Sanctioned": "bg-[#2E6F40]/10 text-[#2E6F40] border-[#2E6F40]/30",
  Appealed: "bg-orange-50 text-orange-700 border-orange-200",
};

// --- CUSTOM MODALS ---
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

// --- THE MODAL ---
function DisModal({ record, employeesList, onClose, onSaved }) {
  const [form, setForm] = useState({
    employee_id: "",
    incident_date: "",
    violation_type: "",
    description: "",
    nte_issued_date: "",
    explanation_received_date: "",
    nod_issued_date: "",
    sanction: "",
    days_suspended: 0,
    status: "Pending Investigation",
    ...record,
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
        incident_date: form.incident_date,
        violation_type: form.violation_type,
        description: form.description,
        nte_issued_date: form.nte_issued_date || null,
        explanation_received_date: form.explanation_received_date || null,
        nod_issued_date: form.nod_issued_date || null,
        sanction: form.sanction,
        days_suspended: form.days_suspended || 0,
        status: form.status,
      };

      if (record?.id) {
        const { error } = await supabase
          .from("disciplinary_records")
          .update(payload)
          .eq("id", record.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("disciplinary_records")
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
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Scale className="w-5 h-5 text-[#2E6F40]" />
              {record ? "Edit Disciplinary Case" : "New Disciplinary Case"}
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <div className="p-5 space-y-6">
            {/* SECTION 1: INCIDENT DETAILS */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> 1. Incident Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-600">
                    Employee *
                  </label>
                  <select
                    className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white focus-visible:ring-[#2E6F40]"
                    value={form.employee_id || ""}
                    onChange={(e) => set("employee_id", e.target.value)}
                  >
                    <option value="">-- Select Employee --</option>
                    {employeesList.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">
                    Incident Date *
                  </label>
                  <Input
                    className="mt-1 focus-visible:ring-[#2E6F40] h-10"
                    type="date"
                    value={form.incident_date}
                    onChange={(e) => set("incident_date", e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-slate-600">
                    Violation Type (Code of Conduct) *
                  </label>
                  <Input
                    className="mt-1 focus-visible:ring-[#2E6F40] h-10"
                    value={form.violation_type}
                    onChange={(e) => set("violation_type", e.target.value)}
                    placeholder="e.g. Excessive Tardiness, Insubordination, AWOL"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-slate-600">
                    Incident Description / Context
                  </label>
                  <textarea
                    className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus-visible:ring-[#2E6F40]"
                    rows={3}
                    value={form.description || ""}
                    onChange={(e) => set("description", e.target.value)}
                    placeholder="Describe what happened..."
                  />
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* SECTION 2: DUE PROCESS (DOLE STANDARD) */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                <CalendarClock className="w-4 h-4" /> 2. DOLE Due Process
                Timeline
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <div>
                  <label
                    className="text-xs font-medium text-slate-600"
                    title="Notice to Explain"
                  >
                    NTE Issued Date
                  </label>
                  <Input
                    className="mt-1 bg-white focus-visible:ring-[#2E6F40]"
                    type="date"
                    value={form.nte_issued_date || ""}
                    onChange={(e) => set("nte_issued_date", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">
                    Explanation Received
                  </label>
                  <Input
                    className="mt-1 bg-white focus-visible:ring-[#2E6F40]"
                    type="date"
                    value={form.explanation_received_date || ""}
                    onChange={(e) =>
                      set("explanation_received_date", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label
                    className="text-xs font-medium text-slate-600"
                    title="Notice of Decision"
                  >
                    NOD Issued Date
                  </label>
                  <Input
                    className="mt-1 bg-white focus-visible:ring-[#2E6F40]"
                    type="date"
                    value={form.nod_issued_date || ""}
                    onChange={(e) => set("nod_issued_date", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* SECTION 3: DECISION & STATUS */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-[#2E6F40] uppercase tracking-widest flex items-center gap-1.5">
                3. Final Decision & Status
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-slate-600">
                    Sanction / Disciplinary Action
                  </label>
                  <Input
                    className="mt-1 focus-visible:ring-[#2E6F40] h-10"
                    value={form.sanction || ""}
                    onChange={(e) => set("sanction", e.target.value)}
                    placeholder="e.g. Written Warning, 3-Day Suspension, Termination"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">
                    If Suspension (Days)
                  </label>
                  <Input
                    className="mt-1 focus-visible:ring-[#2E6F40] h-10"
                    type="number"
                    min="0"
                    value={form.days_suspended}
                    onChange={(e) =>
                      set("days_suspended", Number(e.target.value))
                    }
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="text-xs font-medium text-slate-600">
                    Current Case Status *
                  </label>
                  <select
                    className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-semibold focus-visible:ring-[#2E6F40]"
                    value={form.status}
                    onChange={(e) => set("status", e.target.value)}
                  >
                    <option value="Pending Investigation">
                      Pending Investigation
                    </option>
                    <option value="NTE Issued">
                      NTE Issued (Awaiting Explanation)
                    </option>
                    <option value="Resolved/Sanctioned">
                      Resolved / Sanctioned
                    </option>
                    <option value="Appealed">Appealed</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 p-5 border-t sticky bottom-0 bg-white z-10">
            <Button
              variant="outline"
              onClick={onClose}
              className="rounded-xl px-5"
            >
              Cancel
            </Button>
            <Button
              className="bg-[#2E6F40] hover:bg-[#235330] text-white rounded-xl px-5 shadow-md"
              onClick={save}
              disabled={
                saving ||
                !form.employee_id ||
                !form.incident_date ||
                !form.violation_type
              }
            >
              {saving ? "Saving..." : "Save Case Record"}
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
export default function Disciplinary() {
  const [records, setRecords] = useState([]);
  const [employeesList, setEmployeesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editRecord, setEditRecord] = useState(null);

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
      const { data: recData, error: recErr } = await supabase
        .from("disciplinary_records")
        .select("*, employees(first_name, last_name)")
        .order("incident_date", { ascending: false })
        .limit(200);
      if (recErr) throw recErr;
      setRecords(recData || []);

      const { data: empData, error: empErr } = await supabase
        .from("employees")
        .select("id, first_name, last_name")
        .order("first_name", { ascending: true });
      if (empErr) throw empErr;
      setEmployeesList(empData || []);
    } catch (error) {
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

  const triggerDelete = (id) =>
    setConfirmConfig({ isOpen: true, idToDelete: id });

  const executeDelete = async () => {
    const id = confirmConfig.idToDelete;
    setConfirmConfig({ isOpen: false, idToDelete: null });
    try {
      const { error } = await supabase
        .from("disciplinary_records")
        .delete()
        .eq("id", id);
      if (error) throw error;
      load();
    } catch (error) {
      setAlertConfig({
        isOpen: true,
        title: "Delete Failed",
        message: "Failed to delete record.",
      });
    }
  };

  return (
    <>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Disciplinary Records
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage DOLE-compliant disciplinary cases and twin notice logs.
            </p>
          </div>
          <Button
            onClick={() => {
              setEditRecord(null);
              setShowModal(true);
            }}
            className="bg-[#2E6F40] hover:bg-[#235330] text-white gap-2 rounded-xl shadow-md"
          >
            <Plus className="w-4 h-4" /> Add Case
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#2E6F40]/30 border-t-[#2E6F40] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {records.length === 0 ? (
              <div className="text-center py-16 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-white">
                No disciplinary records.
              </div>
            ) : (
              records.map((r) => (
                <div
                  key={r.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-6 hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center shrink-0 border border-red-100">
                      <Scale className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <p className="font-bold text-slate-900 text-lg">
                          {r.employees
                            ? `${r.employees.first_name} ${r.employees.last_name}`
                            : "Unknown Employee"}
                        </p>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${statusColors[r.status] || "bg-slate-100 text-slate-700"}`}
                        >
                          {r.status}
                        </span>
                      </div>

                      <p className="text-sm font-medium text-red-600 mt-1 flex items-center gap-2">
                        {r.violation_type}{" "}
                        <span className="text-slate-300">|</span>{" "}
                        <span className="text-slate-600">
                          Incident:{" "}
                          {new Date(r.incident_date).toLocaleDateString()}
                        </span>
                      </p>

                      <div className="flex flex-wrap gap-4 mt-3 bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
                        <div>
                          <span className="text-slate-400 font-semibold uppercase block mb-0.5">
                            NTE Issued
                          </span>
                          <span className="font-medium text-slate-700">
                            {r.nte_issued_date
                              ? new Date(r.nte_issued_date).toLocaleDateString()
                              : "Pending"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold uppercase block mb-0.5">
                            Explanation
                          </span>
                          <span className="font-medium text-slate-700">
                            {r.explanation_received_date
                              ? new Date(
                                  r.explanation_received_date,
                                ).toLocaleDateString()
                              : "Pending"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold uppercase block mb-0.5">
                            NOD Issued
                          </span>
                          <span className="font-medium text-slate-700">
                            {r.nod_issued_date
                              ? new Date(r.nod_issued_date).toLocaleDateString()
                              : "Pending"}
                          </span>
                        </div>
                      </div>

                      {r.description && (
                        <p className="text-sm text-slate-500 mt-3 border-l-2 border-slate-200 pl-3">
                          "{r.description}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3 shrink-0 md:w-48 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="text-right w-full">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Sanction
                      </p>
                      <p className="font-bold text-slate-800 leading-tight">
                        {r.sanction || "Pending Decision"}
                      </p>
                      {r.days_suspended > 0 && (
                        <p className="text-xs font-bold text-red-600 mt-1 bg-red-100 inline-block px-2 py-0.5 rounded">
                          {r.days_suspended} Day Suspension
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-auto pt-4 w-full justify-end border-t border-slate-200">
                      <button
                        onClick={() => {
                          setEditRecord(r);
                          setShowModal(true);
                        }}
                        className="p-2 text-slate-400 hover:text-[#2E6F40] hover:bg-[#2E6F40]/10 rounded-lg transition-colors border border-transparent hover:border-[#2E6F40]/20"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => triggerDelete(r.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        {showModal && (
          <DisModal
            record={editRecord}
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
        title="Delete Record"
        message="Are you sure you want to permanently delete this disciplinary record?"
        onCancel={() => setConfirmConfig({ isOpen: false, idToDelete: null })}
        onConfirm={executeDelete}
      />
    </>
  );
}
