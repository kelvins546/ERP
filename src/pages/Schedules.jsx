import { useState, useEffect } from "react";
import { supabase } from "@/api/base44Client"; // <-- Clean Supabase import
import { Plus, Trash2, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

// --- THE MODAL (CREATE & UPDATE) ---
function ScheduleModal({ schedule, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: "",
    expected_time_in: "08:00",
    expected_time_out: "17:00",
    grace_period_mins: 15,
    work_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    ...schedule,
  });

  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const toggleDay = (day) => {
    const wd = form.work_days || [];
    set(
      "work_days",
      wd.includes(day) ? wd.filter((d) => d !== day) : [...wd, day],
    );
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        expected_time_in: form.expected_time_in,
        expected_time_out: form.expected_time_out,
        grace_period_mins: form.grace_period_mins,
        work_days: form.work_days,
      };

      if (schedule?.id) {
        // UPDATE
        const { error } = await supabase
          .from("schedules")
          .update(payload)
          .eq("id", schedule.id);
        if (error) throw error;
      } else {
        // CREATE
        const { error } = await supabase.from("schedules").insert([payload]);
        if (error) throw error;
      }
      onSaved();
    } catch (error) {
      console.error("Error saving schedule:", error.message);
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
            {schedule ? "Edit Schedule" : "New Schedule"}
          </h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-600">
              Schedule Name *
            </label>
            <Input
              className="mt-1"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Standard Morning Shift"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600">
                Time In
              </label>
              <Input
                className="mt-1"
                type="time"
                value={form.expected_time_in}
                onChange={(e) => set("expected_time_in", e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">
                Time Out
              </label>
              <Input
                className="mt-1"
                type="time"
                value={form.expected_time_out}
                onChange={(e) => set("expected_time_out", e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">
              Grace Period (minutes)
            </label>
            <Input
              className="mt-1"
              type="number"
              value={form.grace_period_mins || ""}
              onChange={(e) => set("grace_period_mins", Number(e.target.value))}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-2">
              Work Days
            </label>
            <div className="flex flex-wrap gap-2">
              {days.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDay(d)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${(form.work_days || []).includes(d) ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                >
                  {d.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving || !form.name}>
            {saving ? "Saving..." : "Save Schedule"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- THE MAIN PAGE (READ & DELETE) ---
export default function Schedules() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editSchedule, setEditSchedule] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("schedules")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      console.error("Failed to load schedules:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return;
    try {
      const { error } = await supabase.from("schedules").delete().eq("id", id);
      if (error) throw error;
      load();
    } catch (error) {
      console.error("Delete failed:", error.message);
      alert("Failed to delete schedule. It may be assigned to employees.");
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Work Schedules</h1>
        <Button
          onClick={() => {
            setEditSchedule(null);
            setShowModal(true);
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" /> New Schedule
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schedules.length === 0 ? (
            <p className="col-span-3 text-center py-16 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
              No schedules configured yet.
            </p>
          ) : (
            schedules.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditSchedule(s);
                        setShowModal(true);
                      }}
                      className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <h3 className="font-semibold text-slate-900 text-lg">
                  {s.name}
                </h3>
                <p className="text-sm text-slate-600 mt-2 font-medium">
                  {s.expected_time_in.slice(0, 5)} –{" "}
                  {s.expected_time_out.slice(0, 5)}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Grace Period:{" "}
                  <span className="text-slate-600">
                    {s.grace_period_mins || 0} mins
                  </span>
                </p>

                <div className="flex flex-wrap gap-1.5 mt-4">
                  {(s.work_days || []).map((d) => (
                    <span
                      key={d}
                      className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full uppercase border border-slate-200"
                    >
                      {d.slice(0, 3)}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
      {showModal && (
        <ScheduleModal
          schedule={editSchedule}
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
