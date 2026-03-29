import { useState, useEffect } from "react";
import { supabase } from "@/api/base44Client"; // <-- Clean Supabase import
import { Plus, X, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  approved: "bg-green-100 text-green-700 border-green-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
};

// --- THE MODAL (CREATE & UPDATE) ---
function OTModal({ ot, onClose, onSaved }) {
  const [form, setForm] = useState({
    employee_id: "", // Changed from employee_name to match SQL
    ot_date: "", // We map this to 'date' in the DB
    hours_requested: 1,
    reason: "",
    status: "pending",
    ...ot,
  });

  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      // Build payload matching SQL schema
      const payload = {
        employee_id: form.employee_id || null,
        date: form.ot_date || form.date, // Handle both in case of edit mode
        hours_requested: form.hours_requested,
        reason: form.reason,
        status: form.status,
      };

      if (ot?.id) {
        // UPDATE
        const { error } = await supabase
          .from("overtime_requests")
          .update(payload)
          .eq("id", ot.id);
        if (error) throw error;
      } else {
        // CREATE
        const { error } = await supabase
          .from("overtime_requests")
          .insert([payload]);
        if (error) throw error;
      }
      onSaved();
    } catch (error) {
      console.error("Error saving OT request:", error.message);
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
            {ot ? "Edit OT Request" : "New OT Request"}
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600">
                OT Date *
              </label>
              <Input
                className="mt-1"
                type="date"
                value={form.ot_date || form.date || ""}
                onChange={(e) => set("ot_date", e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">
                Hours Requested *
              </label>
              <Input
                className="mt-1"
                type="number"
                step="0.5"
                value={form.hours_requested || ""}
                onChange={(e) => set("hours_requested", Number(e.target.value))}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">
              Reason / Justification
            </label>
            <textarea
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              rows={3}
              value={form.reason || ""}
              onChange={(e) => set("reason", e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Status</label>
            <select
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
            >
              {["pending", "approved", "rejected"].map((s) => (
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
            disabled={
              saving || !form.employee_id || (!form.ot_date && !form.date)
            }
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- THE MAIN PAGE (READ & QUICK UPDATE) ---
export default function Overtime() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [statusFilter, setStatusFilter] = useState("pending");

  const load = async () => {
    try {
      setLoading(true);
      // Supabase Read - Ordered by newest first
      const { data, error } = await supabase
        .from("overtime_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Failed to load OT requests:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Quick Approval/Rejection function
  const quickUpdate = async (item, status) => {
    try {
      const { error } = await supabase
        .from("overtime_requests")
        .update({ status })
        .eq("id", item.id);
      if (error) throw error;
      load(); // Refresh the board
    } catch (error) {
      console.error(`Failed to mark as ${status}:`, error.message);
      alert("Action failed.");
    }
  };

  const filtered = statusFilter
    ? items.filter((i) => i.status === statusFilter)
    : items;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Overtime Requests</h1>
        <Button
          onClick={() => {
            setEditItem(null);
            setShowModal(true);
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" /> New OT Request
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {["", "pending", "approved", "rejected"].map((s) => (
          <button
            key={s || "all"}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === s ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
          >
            {s ? s.charAt(0).toUpperCase() + s.slice(1) : "All"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
              No overtime requests found.
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between gap-4 hover:shadow-md transition-shadow"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <p
                      className="font-semibold text-slate-900"
                      title={item.employee_id}
                    >
                      Emp ID:{" "}
                      {item.employee_id
                        ? item.employee_id.substring(0, 8) + "..."
                        : "Unknown"}
                    </p>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize border ${statusColors[item.status] || "bg-slate-100 text-slate-600 border-slate-200"}`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    {new Date(item.date).toLocaleDateString()} ·{" "}
                    <span className="font-semibold text-slate-700">
                      {item.hours_requested} hour(s)
                    </span>
                  </p>
                  {item.reason && (
                    <p className="text-xs text-slate-500 mt-2 italic border-l-2 border-slate-200 pl-2">
                      "{item.reason}"
                    </p>
                  )}
                </div>

                <div className="flex gap-2 shrink-0">
                  {item.status === "pending" && (
                    <>
                      <button
                        onClick={() => quickUpdate(item, "approved")}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Approve"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => quickUpdate(item, "rejected")}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Reject"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      setEditItem(item);
                      setShowModal(true);
                    }}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline px-2 transition-colors"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showModal && (
        <OTModal
          ot={editItem}
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
