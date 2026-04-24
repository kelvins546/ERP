import { useState, useEffect } from "react";
import { supabase } from "@/api/base44Client";
import {
  Plus,
  X,
  DollarSign,
  Calendar,
  Info,
  Wand2,
  Trash2,
  AlertCircle,
} from "lucide-react";
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

const statusColors = {
  draft: "bg-slate-100 text-slate-600 border border-slate-200",
  processing: "bg-yellow-100 text-yellow-700 border border-yellow-200",
  finalized: "bg-blue-100 text-blue-700 border border-blue-200",
  paid: "bg-green-100 text-green-700 border border-green-200",
};

// --- HELPER: Format Date to YYYY-MM-DD for HTML inputs ---
const toYMD = (dateObj) => {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

// --- THE MODAL (CREATE & UPDATE) ---
function PeriodModal({ period, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: "",
    start_date: "",
    end_date: "",
    pay_date: "",
    processing_status: period?.status || "draft",
    ...period,
  });

  const [saving, setSaving] = useState(false);
  const [isAutoName, setIsAutoName] = useState(!period?.id);
  const [targetMonth, setTargetMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (isAutoName && form.start_date && form.end_date) {
      const start = new Date(form.start_date);
      const end = new Date(form.end_date);

      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        const startStr = start.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        const endStr = end.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        set("name", `${startStr} - ${endStr}`);
      }
    }
  }, [form.start_date, form.end_date, isAutoName]);

  const handleNameChange = (e) => {
    setIsAutoName(false);
    set("name", e.target.value);
  };

  // --- CLIENT RULE: 1-15 paid on End of Month ---
  const handleAutoFillFirstHalf = () => {
    const [y, m] = targetMonth.split("-").map(Number);
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m - 1, 15);
    const pay = new Date(y, m, 0); // Last day of the current month

    setForm((f) => ({
      ...f,
      start_date: toYMD(start),
      end_date: toYMD(end),
      pay_date: toYMD(pay),
    }));
    setIsAutoName(true);
  };

  // --- CLIENT RULE: 16-31 paid on 15th of Next Month ---
  const handleAutoFillSecondHalf = () => {
    const [y, m] = targetMonth.split("-").map(Number);
    const start = new Date(y, m - 1, 16);
    const end = new Date(y, m, 0); // Last day of the current month
    const pay = new Date(y, m, 15); // 15th of the next month

    setForm((f) => ({
      ...f,
      start_date: toYMD(start),
      end_date: toYMD(end),
      pay_date: toYMD(pay),
    }));
    setIsAutoName(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        name: form.name || null,
        start_date: form.start_date,
        end_date: form.end_date,
        pay_date: form.pay_date || null,
        status: form.processing_status,
      };

      if (period?.id) {
        const { error } = await supabase
          .from("payroll_periods")
          .update(payload)
          .eq("id", period.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("payroll_periods")
          .insert([payload]);
        if (error) throw error;
      }
      onSaved();
    } catch (error) {
      console.error("Error saving payroll period:", error.message);
      if (error.code === "42P01") {
        alert(
          "Table 'payroll_periods' does not exist in Supabase yet. Please run the SQL schema creation script.",
        );
      } else {
        alert("Failed to save: " + error.message);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-slate-100">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-slate-800">
            {period ? "Edit Period" : "New Payroll Period"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* SMART AUTO-FILL SECTION based on Client Rules */}
          {!period?.id && (
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
                <Wand2 className="w-4 h-4" /> Smart Cutoff Generator
              </h3>
              {/* FIXED OVERLAPPING: Converted to a wrapping flex container */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Input
                  type="month"
                  value={targetMonth}
                  onChange={(e) => setTargetMonth(e.target.value)}
                  className="bg-white border-blue-200 focus-visible:ring-blue-500 w-full sm:w-40 rounded-xl"
                />
                <div className="flex gap-2 flex-1">
                  <Button
                    variant="outline"
                    onClick={handleAutoFillFirstHalf}
                    className="text-xs bg-white text-blue-700 border-blue-200 hover:bg-blue-100 rounded-xl flex-1 px-2"
                  >
                    1st Half (1-15)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleAutoFillSecondHalf}
                    className="text-xs bg-white text-blue-700 border-blue-200 hover:bg-blue-100 rounded-xl flex-1 px-2"
                  >
                    2nd Half (16-EOM)
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 1: Coverage Dates */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> 1. Coverage Dates
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                  Start Date *
                </label>
                <Input
                  className="mt-1.5 focus-visible:ring-[#2E6F40] rounded-xl"
                  type="date"
                  value={form.start_date}
                  onChange={(e) => set("start_date", e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                  End Date *
                </label>
                <Input
                  className="mt-1.5 focus-visible:ring-[#2E6F40] rounded-xl"
                  type="date"
                  value={form.end_date}
                  onChange={(e) => set("end_date", e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Period Name *
              </label>
              <Input
                className="mt-1.5 focus-visible:ring-[#2E6F40] rounded-xl"
                value={form.name || ""}
                onChange={handleNameChange}
                placeholder="e.g. March 1 - 15, 2026"
              />
              {isAutoName && form.start_date && (
                <p className="text-[10px] text-[#2E6F40] font-medium mt-1.5">
                  ✓ Auto-generated based on dates.
                </p>
              )}
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* SECTION 2: Processing Workflow */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              2. Disbursement & Status
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                  Target Pay Date
                </label>
                <Input
                  className="mt-1.5 focus-visible:ring-[#2E6F40] rounded-xl"
                  type="date"
                  value={form.pay_date || ""}
                  onChange={(e) => set("pay_date", e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                  Current Status
                </label>
                <select
                  className="mt-1.5 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2E6F40] bg-white"
                  value={form.processing_status}
                  onChange={(e) => set("processing_status", e.target.value)}
                >
                  <option value="draft">Draft</option>
                  <option value="processing">Processing</option>
                  <option value="finalized">Finalized</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex gap-3 items-start mt-2 shadow-inner">
              <Info className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
              <div className="text-xs text-slate-600 leading-relaxed space-y-1.5">
                <p>
                  <strong className="text-slate-800">Draft:</strong> Creating
                  the period, importing attendance.
                </p>
                <p>
                  <strong className="text-slate-800">Processing:</strong>{" "}
                  Computing payslips and deductions.
                </p>
                <p>
                  <strong className="text-slate-800">Finalized:</strong> Locked.
                  Ready for bank disbursement.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-slate-100 sticky bottom-0 bg-slate-50 z-10">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-xl px-6"
          >
            Cancel
          </Button>
          <Button
            className="bg-[#2E6F40] hover:bg-[#235330] text-white rounded-xl px-6 shadow-md"
            onClick={save}
            disabled={
              saving || !form.start_date || !form.end_date || !form.name
            }
          >
            {saving ? "Saving..." : "Save Period"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- THE MAIN PAGE (READ & DELETE) ---
export default function Payroll() {
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editPeriod, setEditPeriod] = useState(null);

  // States for Delete functionality
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
        .from("payroll_periods")
        .select("*")
        .order("start_date", { ascending: false })
        .limit(100);

      if (error) throw error;
      setPeriods(data || []);
    } catch (error) {
      console.error("Failed to load payroll periods:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // --- DELETE LOGIC ---
  const triggerDelete = (e, id) => {
    e.stopPropagation(); // Prevents the card from opening the Edit Modal when clicking the trash can
    setConfirmConfig({ isOpen: true, idToDelete: id });
  };

  const executeDelete = async () => {
    const id = confirmConfig.idToDelete;
    setConfirmConfig({ isOpen: false, idToDelete: null });
    try {
      const { error } = await supabase
        .from("payroll_periods")
        .delete()
        .eq("id", id);
      if (error) throw error;
      load();
    } catch (error) {
      // 23503 is the PostgreSQL code for Foreign Key Violation (meaning Payslips are still attached to this period)
      if (error.code === "23503") {
        setAlertConfig({
          isOpen: true,
          title: "Cannot Delete Period",
          message:
            "This payroll period has payslips attached to it. Please delete the associated payslips first before deleting the period.",
        });
      } else {
        setAlertConfig({
          isOpen: true,
          title: "Delete Failed",
          message: error.message,
        });
      }
    }
  };

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Payroll Periods
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage processing cycles and disbursement dates.
            </p>
          </div>
          <Button
            onClick={() => {
              setEditPeriod(null);
              setShowModal(true);
            }}
            className="bg-[#2E6F40] hover:bg-[#235330] text-white gap-2 rounded-xl px-5 shadow-md transition-transform hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" /> New Period
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#2E6F40]/30 border-t-[#2E6F40] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {periods.length === 0 ? (
              <div className="text-center py-16 text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50 font-medium">
                No payroll periods found.
              </div>
            ) : (
              periods.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:shadow-md hover:border-[#2E6F40]/30 transition-all"
                  onClick={() => {
                    setEditPeriod(p);
                    setShowModal(true);
                  }}
                >
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-[#2E6F40]/10 rounded-2xl flex items-center justify-center shrink-0">
                      <DollarSign className="w-7 h-7 text-[#2E6F40]" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-xl leading-tight">
                        {p.name ||
                          `${formatDate(p.start_date)} - ${formatDate(p.end_date)}`}
                      </p>
                      <p className="text-sm text-slate-500 mt-1 font-medium flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" /> Target Pay Date:{" "}
                        <span className="text-[#2E6F40] font-bold">
                          {formatDate(p.pay_date)}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right shrink-0 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    {p.total_gross && (
                      <div className="px-2">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                          Gross
                        </p>
                        <p className="font-bold text-slate-800 text-base">
                          ₱{Number(p.total_gross).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {p.total_net && (
                      <div className="px-2">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                          Net
                        </p>
                        <p className="font-black text-[#2E6F40] text-lg">
                          ₱{Number(p.total_net).toLocaleString()}
                        </p>
                      </div>
                    )}
                    <span
                      className={`text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider mx-2 ${statusColors[p.status || "draft"]}`}
                    >
                      {p.status || "draft"}
                    </span>

                    {/* THE DELETE BUTTON */}
                    <div className="pl-3 border-l border-slate-200">
                      <button
                        onClick={(e) => triggerDelete(e, p.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Period"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {showModal && (
          <PeriodModal
            period={editPeriod}
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
        title="Delete Payroll Period"
        message="Are you sure you want to permanently delete this payroll period? This action cannot be undone."
        onCancel={() => setConfirmConfig({ isOpen: false, idToDelete: null })}
        onConfirm={executeDelete}
      />
    </>
  );
}
