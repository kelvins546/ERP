import { useState, useEffect } from "react";
import { supabase } from "@/api/base44Client";
import { Plus, X, DollarSign, Calendar, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const statusColors = {
  draft: "bg-slate-100 text-slate-600 border border-slate-200",
  processing: "bg-yellow-100 text-yellow-700 border border-yellow-200",
  finalized: "bg-blue-100 text-blue-700 border border-blue-200",
  paid: "bg-green-100 text-green-700 border border-green-200",
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold">
            {period ? "Edit Period" : "New Payroll Period"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* SECTION 1: Coverage Dates */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> 1. Coverage Dates
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600">
                  Start Date *
                </label>
                <Input
                  className="mt-1 focus-visible:ring-[#2E6F40]"
                  type="date"
                  value={form.start_date}
                  onChange={(e) => set("start_date", e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">
                  End Date *
                </label>
                <Input
                  className="mt-1 focus-visible:ring-[#2E6F40]"
                  type="date"
                  value={form.end_date}
                  onChange={(e) => set("end_date", e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">
                Period Name *
              </label>
              <Input
                className="mt-1 focus-visible:ring-[#2E6F40]"
                value={form.name || ""}
                onChange={handleNameChange}
                placeholder="e.g. March 1 - 15, 2026"
              />
              {isAutoName && form.start_date && (
                <p className="text-[10px] text-slate-400 mt-1">
                  Auto-generated based on dates.
                </p>
              )}
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* SECTION 2: Processing Workflow */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              2. Disbursement & Status
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600">
                  Target Pay Date
                </label>
                <Input
                  className="mt-1 focus-visible:ring-[#2E6F40]"
                  type="date"
                  value={form.pay_date || ""}
                  onChange={(e) => set("pay_date", e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">
                  Current Status
                </label>
                <select
                  className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E6F40]"
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

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex gap-2 items-start mt-2">
              <Info className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div className="text-[10px] text-slate-600 leading-tight space-y-1">
                <p>
                  <strong>Draft:</strong> Creating the period, importing
                  attendance.
                </p>
                <p>
                  <strong>Processing:</strong> Computing payslips and
                  deductions.
                </p>
                <p>
                  <strong>Finalized:</strong> Locked. Ready for bank
                  disbursement.
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

// --- THE MAIN PAGE (READ) ---
export default function Payroll() {
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editPeriod, setEditPeriod] = useState(null);

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

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payroll Periods</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage processing cycles and disbursement dates.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditPeriod(null);
            setShowModal(true);
          }}
          className="bg-[#2E6F40] hover:bg-[#235330] text-white gap-2"
        >
          <Plus className="w-4 h-4" /> New Period
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-[#2E6F40]/30 border-t-[#2E6F40] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {periods.length === 0 ? (
            <div className="text-center py-16 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
              No payroll periods found.
            </div>
          ) : (
            periods.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center justify-between gap-4 cursor-pointer hover:shadow-md transition-all"
                onClick={() => {
                  setEditPeriod(p);
                  setShowModal(true);
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#2E6F40]/10 rounded-xl flex items-center justify-center shrink-0">
                    <DollarSign className="w-5 h-5 text-[#2E6F40]" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-lg">
                      {p.name ||
                        `${formatDate(p.start_date)} - ${formatDate(p.end_date)}`}
                    </p>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Target Pay Date:{" "}
                      <span className="font-medium text-slate-700">
                        {formatDate(p.pay_date)}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-right shrink-0">
                  {p.total_gross && (
                    <div>
                      <p className="text-xs text-slate-400 font-medium">
                        Gross
                      </p>
                      <p className="font-semibold text-slate-800">
                        ₱{Number(p.total_gross).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {p.total_net && (
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Net</p>
                      <p className="font-semibold text-[#2E6F40]">
                        ₱{Number(p.total_net).toLocaleString()}
                      </p>
                    </div>
                  )}
                  <span
                    className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${statusColors[p.status || "draft"]}`}
                  >
                    {p.status || "draft"}
                  </span>
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
  );
}
