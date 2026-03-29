import { useState, useEffect } from "react";
import { supabase } from "@/api/base44Client"; // <-- Clean Supabase import
import { Plus, X, DollarSign } from "lucide-react";
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
    processing_status: period?.status || "draft", // Map DB 'status' to UI state
    ...period,
  });

  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      // Build payload matching standard SQL schema
      const payload = {
        name: form.name || null,
        start_date: form.start_date,
        end_date: form.end_date,
        pay_date: form.pay_date || null,
        status: form.processing_status, // Save as 'status' in DB
      };

      if (period?.id) {
        // UPDATE
        const { error } = await supabase
          .from("payroll_periods")
          .update(payload)
          .eq("id", period.id);
        if (error) throw error;
      } else {
        // CREATE
        const { error } = await supabase
          .from("payroll_periods")
          .insert([payload]);
        if (error) throw error;
      }
      onSaved();
    } catch (error) {
      console.error("Error saving payroll period:", error.message);

      // If Supabase complains the table doesn't exist, provide a helpful alert
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold">
            {period ? "Edit Period" : "New Payroll Period"}
          </h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-600">
              Period Name
            </label>
            <Input
              className="mt-1"
              value={form.name || ""}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. March 1–15 2026"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600">
                Start Date *
              </label>
              <Input
                className="mt-1"
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
                className="mt-1"
                type="date"
                value={form.end_date}
                onChange={(e) => set("end_date", e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">
              Pay Date
            </label>
            <Input
              className="mt-1"
              type="date"
              value={form.pay_date || ""}
              onChange={(e) => set("pay_date", e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Status</label>
            <select
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={form.processing_status}
              onChange={(e) => set("processing_status", e.target.value)}
            >
              {["draft", "processing", "finalized", "paid"].map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={save}
            disabled={saving || !form.start_date || !form.end_date}
          >
            {saving ? "Saving..." : "Save"}
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
      // Supabase Read - Ordered by newest start date first
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

  // Helper to safely format dates
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
        <h1 className="text-2xl font-bold text-slate-900">Payroll Periods</h1>
        <Button
          onClick={() => {
            setEditPeriod(null);
            setShowModal(true);
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" /> New Period
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
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
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-lg">
                      {p.name ||
                        `${formatDate(p.start_date)} – ${formatDate(p.end_date)}`}
                    </p>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Pay Date: {formatDate(p.pay_date)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-right shrink-0">
                  {/* Note: total_gross and total_net might be calculated later based on payslips */}
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
                      <p className="font-semibold text-green-700">
                        ₱{Number(p.total_net).toLocaleString()}
                      </p>
                    </div>
                  )}
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${statusColors[p.status || "draft"]}`}
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
