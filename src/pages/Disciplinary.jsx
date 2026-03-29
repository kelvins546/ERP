import { useState, useEffect } from "react";
import { supabase } from "@/api/base44Client"; // <-- Clean Supabase import
import { Plus, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const statusColors = {
  active: "bg-red-100 text-red-700",
  resolved: "bg-green-100 text-green-700",
  appealed: "bg-yellow-100 text-yellow-700",
};

// --- THE MODAL (CREATE & UPDATE) ---
function DisModal({ record, onClose, onSaved }) {
  const [form, setForm] = useState({
    employee_id: "", // Changed from employee_name to employee_id
    incident_date: "",
    violation_type: "",
    description: "",
    sanction: "",
    status: "active",
    ...record,
  });

  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      // Build the payload that matches your SQL table
      const payload = {
        employee_id: form.employee_id || null,
        incident_date: form.incident_date,
        violation_type: form.violation_type,
        sanction: form.sanction,
        status: form.status,
        // Note: 'description' was not in your original SQL for disciplinary_records.
        // If you get an error here, you will need to run:
        // ALTER TABLE disciplinary_records ADD COLUMN description text;
        // description: form.description
      };

      if (record?.id) {
        // UPDATE Existing
        const { error } = await supabase
          .from("disciplinary_records")
          .update(payload)
          .eq("id", record.id);
        if (error) throw error;
      } else {
        // CREATE New
        const { error } = await supabase
          .from("disciplinary_records")
          .insert([payload]);
        if (error) throw error;
      }
      onSaved();
    } catch (error) {
      console.error("Error saving disciplinary record:", error.message);
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
            {record ? "Edit Record" : "New Disciplinary Record"}
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
              Incident Date *
            </label>
            <Input
              className="mt-1"
              type="date"
              value={form.incident_date}
              onChange={(e) => set("incident_date", e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">
              Violation Type *
            </label>
            <Input
              className="mt-1"
              value={form.violation_type}
              onChange={(e) => set("violation_type", e.target.value)}
              placeholder="e.g. Tardiness, Insubordination"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">
              Sanction *
            </label>
            <Input
              className="mt-1"
              value={form.sanction}
              onChange={(e) => set("sanction", e.target.value)}
              placeholder="e.g. Written Warning, Suspension"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Status</label>
            <select
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
            >
              {["active", "resolved", "appealed"].map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">
              Description (Requires DB Column)
            </label>
            <textarea
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              rows={3}
              value={form.description || ""}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={save}
            disabled={
              saving ||
              !form.employee_id ||
              !form.incident_date ||
              !form.violation_type ||
              !form.sanction
            }
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- THE MAIN PAGE (READ) ---
export default function Disciplinary() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editRecord, setEditRecord] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      // Supabase Read - Ordered by newest incident first
      const { data, error } = await supabase
        .from("disciplinary_records")
        .select("*")
        .order("incident_date", { ascending: false })
        .limit(200);

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error("Failed to load disciplinary records:", error.message);
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
          Disciplinary Records
        </h1>
        <Button
          onClick={() => {
            setEditRecord(null);
            setShowModal(true);
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" /> Add Record
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {records.length === 0 ? (
            <div className="text-center py-16 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
              No disciplinary records.
            </div>
          ) : (
            records.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-start justify-between gap-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  setEditRecord(r);
                  setShowModal(true);
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p
                      className="font-semibold text-slate-900"
                      title={r.employee_id}
                    >
                      Emp ID:{" "}
                      {r.employee_id
                        ? r.employee_id.substring(0, 8) + "..."
                        : "N/A"}
                    </p>
                    <p className="text-sm text-slate-600">
                      {r.violation_type} ·{" "}
                      {new Date(r.incident_date).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Sanction: {r.sanction}
                    </p>
                    {r.description && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                        {r.description}
                      </p>
                    )}
                  </div>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize shrink-0 ${statusColors[r.status] || "bg-slate-100 text-slate-700"}`}
                >
                  {r.status}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {showModal && (
        <DisModal
          record={editRecord}
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
