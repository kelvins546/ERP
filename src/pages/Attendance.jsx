import { useState, useEffect } from "react";
import { supabase } from "@/api/base44Client"; // <-- Clean Supabase import
import { Plus, X, Clock, MapPin, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- THE MODAL (CREATE LOG) ---
function LogModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    employee_id: "", // Changed from employee_name to ID
    type: "time_in",
    log_date: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      // Create accurate timestamps for the database
      const timestamp = new Date().toISOString();

      // Supabase Insert
      const { error } = await supabase.from("attendance_logs").insert([
        {
          employee_id: form.employee_id || null,
          type: form.type, // Maps perfectly to the 'attendance_type' ENUM in SQL
          device_timestamp: timestamp,
          calculated_server_time: timestamp,
          // Notes is not in your SQL schema, but we pass it anyway.
          // You'll need to add a 'notes' text column to the database if you want to keep this!
          // notes: form.notes
        },
      ]);

      if (error) throw error;
      onSaved();
    } catch (error) {
      console.error("Error saving log:", error.message);
      alert("Failed to save: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold">Add Attendance Log</h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-600">
              Employee ID (UUID)
            </label>
            <Input
              className="mt-1"
              value={form.employee_id}
              onChange={(e) => set("employee_id", e.target.value)}
              placeholder="Enter Employee UUID..."
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Type</label>
            <select
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={form.type}
              onChange={(e) => set("type", e.target.value)}
            >
              <option value="time_in">Time In</option>
              <option value="time_out">Time Out</option>
            </select>
          </div>
          {/* Note: The UI lets you pick a date, but our DB records exact timestamps. 
              In a real app, you'd combine this date with a time input. */}
          <div>
            <label className="text-xs font-medium text-slate-600">
              Date (Used for UI sorting)
            </label>
            <Input
              className="mt-1"
              type="date"
              value={form.log_date}
              onChange={(e) => set("log_date", e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">
              Notes (Requires DB Column)
            </label>
            <Input
              className="mt-1"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
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

// --- THE MAIN PAGE (READ & FILTER) ---
export default function Attendance() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [dateFilter, setDateFilter] = useState(
    new Date().toISOString().split("T")[0],
  );

  const load = async () => {
    try {
      setLoading(true);

      // Start building the Supabase query
      let query = supabase
        .from("attendance_logs")
        .select("*")
        .order("calculated_server_time", { ascending: false })
        .limit(200);

      // If a date is selected, filter by a timestamp range for that specific day
      if (dateFilter) {
        // Creates a range from 00:00:00 to 23:59:59 for the selected date
        const startOfDay = new Date(`${dateFilter}T00:00:00`).toISOString();
        const endOfDay = new Date(`${dateFilter}T23:59:59.999`).toISOString();
        query = query
          .gte("calculated_server_time", startOfDay)
          .lte("calculated_server_time", endOfDay);
      }

      const { data, error } = await query;
      if (error) throw error;

      setLogs(data || []);
    } catch (error) {
      console.error("Failed to load attendance logs:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [dateFilter]);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Time Logs</h1>
        <Button onClick={() => setShowModal(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Add Log
        </Button>
      </div>

      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm w-fit">
        <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
          <Clock className="w-4 h-4" /> Filter Date:
        </label>
        <Input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="w-40 h-8 text-sm"
        />
        {dateFilter && (
          <button
            onClick={() => setDateFilter("")}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium px-2"
          >
            Show All Logs
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                {[
                  "Employee ID",
                  "Type",
                  "Date",
                  "Time",
                  "Geofence",
                  "Late",
                  "Notes",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No logs found for this date.
                  </td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td
                      className="px-4 py-3 text-sm font-medium text-slate-900"
                      title={l.employee_id}
                    >
                      {l.employee_id
                        ? l.employee_id.substring(0, 8) + "..."
                        : "N/A"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${l.type === "time_in" ? "bg-green-100 text-green-700 border border-green-200" : "bg-orange-100 text-orange-700 border border-orange-200"}`}
                      >
                        {l.type === "time_in" ? "Time In" : "Time Out"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {/* Extracting just the date from the timestamp */}
                      {new Date(l.calculated_server_time).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-700">
                      {new Date(l.device_timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      {l.is_within_geofence === true ? (
                        <span className="text-green-600 text-xs flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" /> Within
                        </span>
                      ) : l.is_within_geofence === false ? (
                        <span className="text-red-500 text-xs flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" /> Outside
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {/* The SQL doesn't track 'is_late', this is usually calculated via a function later */}
                      {l.is_late ? (
                        <span className="text-red-500 text-xs flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />{" "}
                          {l.minutes_late}m
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {l.notes || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      {showModal && (
        <LogModal
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
