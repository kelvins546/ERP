import { useState, useEffect } from "react";
import { supabase } from "@/api/base44Client";
import {
  Plus,
  X,
  Star,
  Edit,
  Trash2,
  AlertCircle,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const statusColors = {
  draft: "bg-slate-100 text-slate-600 border-slate-200",
  submitted: "bg-blue-50 text-blue-700 border-blue-200",
  acknowledged: "bg-[#2E6F40]/10 text-[#2E6F40] border-[#2E6F40]/30",
};

const ratingDescriptions = {
  1: "Poor / Unacceptable",
  2: "Needs Improvement",
  3: "Meets Expectations",
  4: "Exceeds Expectations",
  5: "Outstanding / Role Model",
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

// --- THE MODAL ---
function EvalModal({ eval_, employeesList, onClose, onSaved }) {
  const [form, setForm] = useState({
    employee_id: "",
    evaluator_id: "",
    period_start: "",
    period_end: "",
    total_score: 3,
    recommendation: "None",
    feedback: "",
    status: "draft",
    ...eval_,
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
        evaluator_id: form.evaluator_id || null,
        total_score: form.total_score,
        recommendation: form.recommendation,
        feedback: form.feedback,
        period_start: form.period_start,
        period_end: form.period_end,
        status: form.status,
      };

      if (eval_?.id) {
        const { error } = await supabase
          .from("evaluations")
          .update(payload)
          .eq("id", eval_.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("evaluations").insert([payload]);
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto">
        {/* MOBILE RESPONSIVE CONTAINER */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-2xl max-h-[95dvh] flex flex-col overflow-hidden my-auto">
          {/* HEADER */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b sticky top-0 bg-white z-10 shrink-0">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#2E6F40]" />
              {eval_
                ? "Edit Performance Appraisal"
                : "New Performance Appraisal"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* SCROLLABLE BODY */}
          <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
            {/* 1. PARTICIPANTS */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                1. Appraisal Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                    Employee *
                  </label>
                  <select
                    className="mt-1.5 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus-visible:ring-[#2E6F40]"
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
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                    Evaluated By (Manager)
                  </label>
                  <select
                    className="mt-1.5 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus-visible:ring-[#2E6F40]"
                    value={form.evaluator_id || ""}
                    onChange={(e) => set("evaluator_id", e.target.value)}
                  >
                    <option value="">-- Select Manager --</option>
                    {employeesList.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">
                    Period Start *
                  </label>
                  <Input
                    className="mt-1.5 focus-visible:ring-[#2E6F40] rounded-xl"
                    type="date"
                    value={form.period_start}
                    onChange={(e) => set("period_start", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">
                    Period End *
                  </label>
                  <Input
                    className="mt-1.5 focus-visible:ring-[#2E6F40] rounded-xl"
                    type="date"
                    value={form.period_end}
                    onChange={(e) => set("period_end", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* 2. RATING */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-[#2E6F40] uppercase tracking-widest">
                2. Performance Rating
              </h3>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-3">
                  Overall Score
                </label>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => set("total_score", r)}
                      className={`w-12 h-12 rounded-xl font-black text-lg transition-all ${form.total_score >= r ? "bg-[#2E6F40] text-white shadow-md scale-105" : "bg-white border border-slate-300 text-slate-400 hover:bg-slate-100"}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <div className="mt-3">
                  <p className="text-sm font-bold text-[#2E6F40]">
                    Result: {ratingDescriptions[form.total_score]}
                  </p>
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* 3. OUTCOME & FEEDBACK */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                3. HR Action & Feedback
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                    HR Recommendation
                  </label>
                  <select
                    className="mt-1.5 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white font-medium focus-visible:ring-[#2E6F40]"
                    value={form.recommendation || "None"}
                    onChange={(e) => set("recommendation", e.target.value)}
                  >
                    <option value="None">None / Routine Review</option>
                    <option value="Regularization">
                      Recommend for Regularization
                    </option>
                    <option value="Promotion">Recommend for Promotion</option>
                    <option value="Salary Increase">
                      Recommend for Salary Increase
                    </option>
                    <option value="PIP">
                      Performance Improvement Plan (PIP)
                    </option>
                    <option value="Termination">
                      Recommend for Termination
                    </option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                    Status
                  </label>
                  <select
                    className="mt-1.5 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus-visible:ring-[#2E6F40]"
                    value={form.status}
                    onChange={(e) => set("status", e.target.value)}
                  >
                    <option value="draft">Draft</option>
                    <option value="submitted">Submitted to HR</option>
                    <option value="acknowledged">
                      Acknowledged by Employee
                    </option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                    Manager Comments / Feedback
                  </label>
                  <textarea
                    className="mt-1.5 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus-visible:ring-[#2E6F40]"
                    rows={4}
                    value={form.feedback || ""}
                    onChange={(e) => set("feedback", e.target.value)}
                    placeholder="Summarize strengths, weaknesses, and goals..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 p-4 sm:p-6 border-t bg-white shrink-0">
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
                !form.employee_id ||
                !form.period_start ||
                !form.period_end
              }
            >
              {saving ? "Saving..." : "Save Appraisal"}
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
export default function Evaluations() {
  const [evals, setEvals] = useState([]);
  const [employeesList, setEmployeesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editEval, setEditEval] = useState(null);

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
      const { data: evalsData, error: evalsErr } = await supabase
        .from("evaluations")
        .select(
          "*, employee:employee_id(first_name, last_name), evaluator:evaluator_id(first_name, last_name)",
        )
        .order("period_end", { ascending: false })
        .limit(200);
      if (evalsErr) throw evalsErr;
      setEvals(evalsData || []);

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
        .from("evaluations")
        .delete()
        .eq("id", id);
      if (error) throw error;
      load();
    } catch (error) {
      setAlertConfig({
        isOpen: true,
        title: "Delete Failed",
        message: "Failed to delete evaluation.",
      });
    }
  };

  return (
    <>
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Performance Appraisals
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Conduct standard HR reviews and log actionable recommendations.
            </p>
          </div>
          <Button
            onClick={() => {
              setEditEval(null);
              setShowModal(true);
            }}
            className="bg-[#2E6F40] hover:bg-[#235330] text-white gap-2 rounded-xl shadow-md w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" /> New Appraisal
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#2E6F40]/30 border-t-[#2E6F40] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {evals.length === 0 ? (
              <div className="text-center py-16 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-white font-medium">
                No performance appraisals found.
              </div>
            ) : (
              evals.map((e) => (
                <div
                  key={e.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center shrink-0 border border-yellow-100 mt-1">
                      <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-bold text-slate-900 text-lg">
                          {e.employee
                            ? `${e.employee.first_name} ${e.employee.last_name}`
                            : "Unknown Employee"}
                        </h3>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${statusColors[e.status] || "bg-slate-100 text-slate-600 border-slate-200"}`}
                        >
                          {e.status || "draft"}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-500">
                        Manager:{" "}
                        <span className="text-slate-700">
                          {e.evaluator
                            ? `${e.evaluator.first_name} ${e.evaluator.last_name}`
                            : "System"}
                        </span>
                        <span className="mx-2 text-slate-300">|</span>
                        <span className="text-slate-600">
                          {new Date(e.period_start).toLocaleDateString()} -{" "}
                          {new Date(e.period_end).toLocaleDateString()}
                        </span>
                      </p>

                      {e.recommendation && e.recommendation !== "None" && (
                        <p className="text-xs font-bold text-indigo-600 bg-indigo-50 inline-block px-2.5 py-1 rounded-lg mt-3 border border-indigo-100">
                          Action: {e.recommendation}
                        </p>
                      )}

                      {e.feedback && (
                        <p className="text-sm text-slate-600 mt-3 bg-slate-50 p-3 rounded-xl border border-slate-100 italic line-clamp-2">
                          "{e.feedback}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3 shrink-0 bg-slate-50 p-4 rounded-xl border border-slate-100 md:w-48">
                    <div className="text-right w-full">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Overall Rating
                      </p>
                      <p className="font-black text-[#2E6F40] text-3xl leading-none mt-1">
                        {e.total_score}{" "}
                        <span className="text-sm text-slate-400 font-medium">
                          / 5
                        </span>
                      </p>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase mt-1">
                        {ratingDescriptions[e.total_score] || ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-auto pt-4 w-full justify-end border-t border-slate-200">
                      <button
                        onClick={() => {
                          setEditEval(e);
                          setShowModal(true);
                        }}
                        className="p-2 text-slate-400 hover:text-[#2E6F40] hover:bg-[#2E6F40]/10 rounded-lg transition-colors border border-transparent hover:border-[#2E6F40]/20"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => triggerDelete(e.id)}
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
          <EvalModal
            eval_={editEval}
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
        title="Delete Evaluation"
        message="Are you sure you want to permanently delete this performance appraisal?"
        onCancel={() => setConfirmConfig({ isOpen: false, idToDelete: null })}
        onConfirm={executeDelete}
      />
    </>
  );
}
