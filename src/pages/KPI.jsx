import { useState, useEffect } from "react";
import { supabase } from "@/api/base44Client";
import {
  Plus,
  Edit,
  Trash2,
  X,
  Target,
  BarChart,
  AlertCircle,
  Calendar,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const statusColors = {
  "On Track": "bg-blue-50 text-blue-700 border-blue-200",
  Achieved: "bg-[#2E6F40]/10 text-[#2E6F40] border-[#2E6F40]/30",
  "At Risk": "bg-amber-50 text-amber-700 border-amber-200",
  Behind: "bg-red-50 text-red-700 border-red-200",
};

// --- CUSTOM MODALS ---
function CustomAlert({ isOpen, title, message, onClose }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 sm:p-6 text-center">
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 sm:p-6 text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
          <AlertCircle className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 mb-6">{message}</p>
        <div className="flex flex-col sm:flex-row gap-3">
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

// --- PROGRESS BAR HELPER ---
function calculateProgress(actual, target) {
  const a = Number(actual) || 0;
  const t = Number(target) || 1; // Prevent division by zero
  if (t === 0) return 0;
  const percentage = (a / t) * 100;
  return Math.min(Math.max(percentage, 0), 100); // Clamp between 0 and 100
}

// --- THE MODAL (CREATE & UPDATE) ---
function KPIModal({ kpi, departmentsList, onClose, onSaved }) {
  const [form, setForm] = useState({
    metric_name: "",
    target_value: "",
    actual_value: 0,
    unit: "",
    department_id: "",
    description: "",
    frequency: "Quarterly",
    start_date: "",
    end_date: "",
    status: "On Track",
    ...kpi,
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
        metric_name: form.metric_name,
        target_value: form.target_value,
        actual_value: form.actual_value || 0,
        unit: form.unit,
        department_id: form.department_id || null,
        description: form.description,
        frequency: form.frequency,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        status: form.status,
      };

      if (kpi?.id) {
        const { error } = await supabase
          .from("kpi_definitions")
          .update(payload)
          .eq("id", kpi.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("kpi_definitions")
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

  const progressPercent = calculateProgress(
    form.actual_value,
    form.target_value,
  );

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm">
        {/* MOBILE RESPONSIVE CONTAINER: flex-col, overflow-hidden, max-h-[95dvh] ensures it fits on any screen */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-2xl max-h-[95dvh] flex flex-col overflow-hidden">
          {/* HEADER (Fixed) */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b shrink-0 bg-white">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
              <Target className="w-5 h-5 text-[#2E6F40]" />
              {kpi ? "Update KPI Progress" : "Define New KPI"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* SCROLLABLE CONTENT BODY */}
          <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
            {/* 1. DEFINITION */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                1. Target Definition
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                    Metric Name (Objective) *
                  </label>
                  <Input
                    className="mt-1 focus-visible:ring-[#2E6F40]"
                    value={form.metric_name}
                    onChange={(e) => set("metric_name", e.target.value)}
                    placeholder="e.g. Reduce System Downtime, Increase Sales by 10%"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                    Department
                  </label>
                  <select
                    className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white focus-visible:ring-[#2E6F40]"
                    value={form.department_id || ""}
                    onChange={(e) => set("department_id", e.target.value)}
                  >
                    <option value="">-- Company Wide (All) --</option>
                    {departmentsList.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                    Evaluation Cycle
                  </label>
                  <select
                    className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white focus-visible:ring-[#2E6F40]"
                    value={form.frequency}
                    onChange={(e) => set("frequency", e.target.value)}
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Bi-Annually">Bi-Annually</option>
                    <option value="Annually">Annually</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                    Description & Strategy
                  </label>
                  <textarea
                    className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus-visible:ring-[#2E6F40]"
                    rows={2}
                    value={form.description || ""}
                    onChange={(e) => set("description", e.target.value)}
                    placeholder="How will this be achieved?"
                  />
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* 2. TIMEFRAME */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /> 2. Timeframe
              </h3>
              {/* Stacked on mobile, 2 columns on small screens and up */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-600">
                    Start Date *
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
                    End Date / Deadline *
                  </label>
                  <Input
                    className="mt-1 focus-visible:ring-[#2E6F40]"
                    type="date"
                    value={form.end_date || ""}
                    onChange={(e) => set("end_date", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* 3. TRACKING */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-[#2E6F40] uppercase tracking-widest flex items-center gap-1.5">
                <Activity className="w-4 h-4" /> 3. Progress Tracking
              </h3>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 shadow-inner">
                {/* 1 column on mobile, 2 on sm, 4 on md */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Target Goal *
                    </label>
                    <Input
                      className="mt-1 font-bold text-slate-900 border-slate-300 focus-visible:ring-[#2E6F40]"
                      type="number"
                      value={form.target_value}
                      onChange={(e) => set("target_value", e.target.value)}
                      placeholder="e.g. 100"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#2E6F40] uppercase tracking-wider">
                      Current Actual
                    </label>
                    <Input
                      className="mt-1 font-bold text-[#2E6F40] border-[#2E6F40]/50 focus-visible:ring-[#2E6F40]"
                      type="number"
                      value={form.actual_value}
                      onChange={(e) => set("actual_value", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Unit
                    </label>
                    <Input
                      className="mt-1 border-slate-300 focus-visible:ring-[#2E6F40]"
                      value={form.unit || ""}
                      onChange={(e) => set("unit", e.target.value)}
                      placeholder="%, pcs, ₱..."
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      KPI Health
                    </label>
                    <select
                      className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm font-semibold focus-visible:ring-[#2E6F40]"
                      value={form.status}
                      onChange={(e) => set("status", e.target.value)}
                    >
                      <option value="On Track">On Track</option>
                      <option value="Achieved">Achieved</option>
                      <option value="At Risk">At Risk</option>
                      <option value="Behind">Behind / Off Track</option>
                    </select>
                  </div>
                </div>

                {/* VISUAL PROGRESS BAR */}
                <div className="mt-6">
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-500">Progress</span>
                    <span className="text-[#2E6F40]">
                      {Math.round(progressPercent)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden border border-slate-300">
                    <div
                      className="bg-[#2E6F40] h-3 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER (Fixed) - Stacked buttons on small screens */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 p-4 sm:p-6 border-t shrink-0 bg-white">
            <Button
              variant="outline"
              className="w-full sm:w-auto rounded-xl px-5"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              className="w-full sm:w-auto bg-[#2E6F40] hover:bg-[#235330] text-white rounded-xl px-5 shadow-md"
              onClick={save}
              disabled={
                saving ||
                !form.metric_name ||
                !form.target_value ||
                !form.start_date ||
                !form.end_date
              }
            >
              {saving ? "Saving..." : "Save KPI Progress"}
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
export default function KPI() {
  const [kpis, setKpis] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editKpi, setEditKpi] = useState(null);

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
      const { data: kpiData, error: kpiErr } = await supabase
        .from("kpi_definitions")
        .select("*, departments(name)")
        .order("metric_name", { ascending: true });
      if (kpiErr) throw kpiErr;
      setKpis(kpiData || []);

      const { data: deptData, error: deptErr } = await supabase
        .from("departments")
        .select("id, name")
        .order("name", { ascending: true });
      if (deptErr) throw deptErr;
      setDepartmentsList(deptData || []);
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
        .from("kpi_definitions")
        .delete()
        .eq("id", id);
      if (error) throw error;
      load();
    } catch (error) {
      setAlertConfig({
        isOpen: true,
        title: "Delete Failed",
        message: "Failed to delete KPI.",
      });
    }
  };

  return (
    <>
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              OKR & KPI Dashboard
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Track department objectives, key results, and performance health.
            </p>
          </div>
          <Button
            onClick={() => {
              setEditKpi(null);
              setShowModal(true);
            }}
            className="bg-[#2E6F40] hover:bg-[#235330] text-white gap-2 rounded-xl shadow-md w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" /> Define New Target
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#2E6F40]/30 border-t-[#2E6F40] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {kpis.length === 0 ? (
              <p className="col-span-1 xl:col-span-2 text-center py-16 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-white font-medium">
                No active KPIs tracking.
              </p>
            ) : (
              kpis.map((k) => {
                const progress = calculateProgress(
                  k.actual_value,
                  k.target_value,
                );
                return (
                  <div
                    key={k.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <span
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border inline-block mb-3 ${statusColors[k.status || "On Track"]}`}
                          >
                            {k.status || "On Track"}
                          </span>
                          <h3 className="font-bold text-slate-900 text-lg sm:text-xl leading-tight">
                            {k.metric_name}
                          </h3>
                          <p className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wider mt-1.5">
                            {k.departments?.name || "Company Wide"}{" "}
                            <span className="text-slate-300 mx-1">|</span>{" "}
                            {k.frequency || "Quarterly"}
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-1 shrink-0 bg-slate-50 rounded-lg p-1 border border-slate-100">
                          <button
                            onClick={() => {
                              setEditKpi(k);
                              setShowModal(true);
                            }}
                            className="p-2 text-slate-400 hover:text-[#2E6F40] hover:bg-[#2E6F40]/10 rounded-md transition-colors"
                            title="Update Progress"
                          >
                            <BarChart className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => triggerDelete(k.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Delete KPI"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {k.description && (
                        <p className="text-sm text-slate-600 mb-5 border-l-2 border-slate-200 pl-3">
                          "{k.description}"
                        </p>
                      )}
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                      <div className="flex justify-between items-end mb-3">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Current
                          </p>
                          <p className="text-2xl font-black text-[#2E6F40] leading-none mt-1">
                            {Number(k.actual_value || 0).toLocaleString()}{" "}
                            <span className="text-sm font-semibold text-slate-500 ml-0.5">
                              {k.unit}
                            </span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Target Goal
                          </p>
                          <p className="text-lg font-bold text-slate-700 leading-none mt-1">
                            {Number(k.target_value).toLocaleString()}{" "}
                            <span className="text-xs text-slate-500 ml-0.5">
                              {k.unit}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* PROGRESS BAR */}
                      <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden border border-slate-300">
                        <div
                          className={`h-2.5 rounded-full transition-all duration-500 ${k.status === "Behind" ? "bg-red-500" : k.status === "At Risk" ? "bg-amber-500" : "bg-[#2E6F40]"}`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>

                      {k.end_date && (
                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-3 text-right">
                          Deadline:{" "}
                          <span className="text-slate-700">
                            {new Date(k.end_date).toLocaleDateString()}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {showModal && (
          <KPIModal
            kpi={editKpi}
            departmentsList={departmentsList}
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
        title="Delete Target"
        message="Are you sure you want to permanently delete this KPI definition and its progress data?"
        onCancel={() => setConfirmConfig({ isOpen: false, idToDelete: null })}
        onConfirm={executeDelete}
      />
    </>
  );
}
