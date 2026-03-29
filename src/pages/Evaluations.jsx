import { useState, useEffect } from "react";
import { supabase } from "@/api/base44Client"; // <-- Clean Supabase import
import { Plus, X, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const statusColors = {
  draft: "bg-slate-100 text-slate-600",
  submitted: "bg-blue-100 text-blue-700",
  acknowledged: "bg-green-100 text-green-700",
};

// --- THE MODAL (CREATE & UPDATE) ---
function EvalModal({ eval_, onClose, onSaved }) {
  const [form, setForm] = useState({
    employee_id: "",
    evaluator_id: "",
    period: "", // UI only, we will fake the dates for the DB below
    total_score: 3,
    feedback: "",
    status: "draft",
    ...eval_,
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      // Build payload matching SQL schema exactly
      const payload = {
        employee_id: form.employee_id || null,
        evaluator_id: form.evaluator_id || null,
        total_score: form.total_score,
        feedback: form.feedback,
        // The DB requires dates. Since the UI just has a "Period" string, we inject dummy dates to prevent DB crashes.
        // In a real app, you would change the UI to have start/end date pickers.
        period_start: new Date().toISOString(),
        period_end: new Date(
          new Date().setMonth(new Date().getMonth() + 3),
        ).toISOString(),
        // Note: 'status' and 'period' string are not in your current SQL schema.
        // We pass them anyway in case you update the DB later.
        // status: form.status,
      };

      if (eval_?.id) {
        // UPDATE
        const { error } = await supabase
          .from("evaluations")
          .update(payload)
          .eq("id", eval_.id);
        if (error) throw error;
      } else {
        // CREATE
        const { error } = await supabase.from("evaluations").insert([payload]);
        if (error) throw error;
      }
      onSaved();
    } catch (error) {
      console.error("Error saving evaluation:", error.message);
      alert("Failed to save: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold">
            {eval_ ? "Edit Evaluation" : "New Evaluation"}
          </h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-600">
              Employee ID (UUID) *
            </label>
            <Input
              className="mt-1"
              value={form.employee_id || ""}
              onChange={(e) => set("employee_id", e.target.value)}
              placeholder="Enter Employee UUID"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">
              Evaluator ID (UUID)
            </label>
            <Input
              className="mt-1"
              value={form.evaluator_id || ""}
              onChange={(e) => set("evaluator_id", e.target.value)}
              placeholder="Enter Evaluator UUID"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">
              Period (Requires DB Column)
            </label>
            <Input
              className="mt-1"
              value={form.period || ""}
              onChange={(e) => set("period", e.target.value)}
              placeholder="e.g. Q1 2026"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-2">
              Overall Rating: {form.total_score}/5
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => set("total_score", r)}
                  className={`w-10 h-10 rounded-lg font-semibold transition-colors ${form.total_score >= r ? "bg-yellow-400 text-white shadow-inner" : "bg-slate-100 text-slate-400 hover:bg-slate-200"}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">
              Comments / Feedback
            </label>
            <textarea
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              rows={3}
              value={form.feedback || ""}
              onChange={(e) => set("feedback", e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">
              Status (Requires DB Column)
            </label>
            <select
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
            >
              {["draft", "submitted", "acknowledged"].map((s) => (
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
          <Button onClick={save} disabled={saving || !form.employee_id}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- THE MAIN PAGE (READ) ---
export default function Evaluations() {
  const [evals, setEvals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editEval, setEditEval] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      // Supabase Read
      const { data, error } = await supabase
        .from("evaluations")
        .select("*")
        .order("id", { ascending: false }) // Fallback ordering since there's no created_at in the SQL
        .limit(200);

      if (error) throw error;
      setEvals(data || []);
    } catch (error) {
      console.error("Failed to load evaluations:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">
          Performance Evaluations
        </h1>
        <Button
          onClick={() => {
            setEditEval(null);
            setShowModal(true);
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" /> New Evaluation
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {evals.length === 0 ? (
            <div className="text-center py-16 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
              No evaluations found.
            </div>
          ) : (
            evals.map((e) => (
              <div
                key={e.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between gap-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  setEditEval(e);
                  setShowModal(true);
                }}
              >
                <div>
                  <p
                    className="font-semibold text-slate-900"
                    title={e.employee_id}
                  >
                    Emp ID:{" "}
                    {e.employee_id
                      ? e.employee_id.substring(0, 8) + "..."
                      : "N/A"}
                  </p>
                  <p className="text-sm text-slate-500">
                    by{" "}
                    {e.evaluator_id
                      ? e.evaluator_id.substring(0, 8) + "..."
                      : "System"}
                    {/* Using the DB date fields if the UI string isn't there */}
                    ·{" "}
                    {e.period ||
                      (e.period_start
                        ? new Date(e.period_start).toLocaleDateString()
                        : "—")}
                  </p>
                  {e.feedback && (
                    <p className="text-xs text-slate-400 mt-1 italic line-clamp-1">
                      "{e.feedback}"
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="flex items-center gap-1">
                    {/* Mapping the 'total_score' from DB back to the stars */}
                    {[1, 2, 3, 4, 5].map((r) => (
                      <Star
                        key={r}
                        className={`w-4 h-4 ${r <= (e.total_score || 0) ? "text-yellow-400 fill-yellow-400" : "text-slate-200"}`}
                      />
                    ))}
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${statusColors[e.status] || "bg-slate-100 text-slate-600"}`}
                  >
                    {e.status || "draft"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showModal && (
        <EvalModal
          eval_={editEval}
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
