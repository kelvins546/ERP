import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/api/base44Client";
import { Edit2, Megaphone, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";

const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const defaultSchedule = {
  name: "",
  description: "",
  expected_time_in: "08:00",
  expected_time_out: "17:00",
  grace_period_mins: 15,
  total_hours: 8,
  required_hours: "08:00",
  work_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
};

const parseTimeToMinutes = (timeValue) => {
  if (!timeValue || typeof timeValue !== "string") return 0;
  const [hours, minutes] = timeValue.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return 0;
  return hours * 60 + minutes;
};

const calculateTotalHours = (startTime, endTime) => {
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);
  const grossMinutes = end >= start ? end - start : end + 24 * 60 - start;
  return Math.max(0, grossMinutes / 60);
};

const formatHours = (value) => {
  const hours = Number(value || 0);
  if (Number.isNaN(hours)) return "0";
  return Number.isInteger(hours) ? String(hours) : hours.toLocaleString("en-US", { maximumFractionDigits: 2 });
};

const normalizeTimeValue = (value, fallback = "08:00") => {
  if (value === null || value === undefined || value === "") return fallback;

  const coerceToTime = (hours, minutes = 0) => {
    const safeHours = Number(hours);
    const safeMinutes = Number(minutes);
    if (
      Number.isNaN(safeHours)
      || Number.isNaN(safeMinutes)
      || safeHours < 0
      || safeHours > 23
      || safeMinutes < 0
      || safeMinutes > 59
    ) {
      return fallback;
    }

    return `${String(safeHours).padStart(2, "0")}:${String(safeMinutes).padStart(2, "0")}`;
  };

  if (typeof value === "number") {
    return coerceToTime(value, 0);
  }

  const raw = String(value).trim();

  if (/^\d{1,2}$/.test(raw)) {
    return coerceToTime(raw, 0);
  }

  if (/^\d{1,2}:\d{1,2}(:\d{1,2})?$/.test(raw)) {
    const [hours, minutes] = raw.split(":");
    return coerceToTime(hours, minutes);
  }

  return fallback;
};

const normalizeScheduleForm = (schedule) => ({
  ...defaultSchedule,
  ...schedule,
  expected_time_in: normalizeTimeValue(schedule?.expected_time_in, defaultSchedule.expected_time_in),
  expected_time_out: normalizeTimeValue(schedule?.expected_time_out, defaultSchedule.expected_time_out),
  required_hours: normalizeTimeValue(schedule?.required_hours, defaultSchedule.required_hours),
});

const ANNOUNCEMENT_TYPES = ["informationals", "urgents", "criticals"];

function toDateInputValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function getDefaultCloseDate(daysAhead = 7) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return toDateInputValue(date);
}

function buildScheduleAnnouncementContent(schedule) {
  if (!schedule) return "";

  const expectedIn = schedule.expected_time_in
    ? normalizeTimeValue(schedule.expected_time_in, defaultSchedule.expected_time_in)
    : defaultSchedule.expected_time_in;
  const expectedOut = schedule.expected_time_out
    ? normalizeTimeValue(schedule.expected_time_out, defaultSchedule.expected_time_out)
    : defaultSchedule.expected_time_out;
  const requiredHours = schedule.required_hours
    ? normalizeTimeValue(schedule.required_hours, defaultSchedule.required_hours)
    : defaultSchedule.required_hours;

  const workDays = Array.isArray(schedule.work_days)
    ? schedule.work_days
    : [];

  return [
    `Schedule: ${schedule.name || "—"}`,
    `Description: ${schedule.description || "—"}`,
    `Start Time: ${expectedIn.slice(0, 5)}`,
    `End Time: ${expectedOut.slice(0, 5)}`,
    `Total Hours: ${formatHours(calculateTotalHours(expectedIn, expectedOut))}`,
    `Required Hours: ${requiredHours.slice(0, 5)}`,
    `Grace Period: ${Number(schedule.grace_period_mins ?? defaultSchedule.grace_period_mins)} mins`,
    `Working Days: ${workDays.length ? workDays.join(", ") : "—"}`,
  ].join("\n");
}

function ScheduleAnnouncementModal({ schedule, onClose, onSaved }) {
  const navigate = useNavigate();

  const initialForm = useMemo(() => {
    const scheduleName = schedule?.name || "Schedule";
    const scheduleEnd = normalizeTimeValue(
      schedule?.expected_time_out,
      defaultSchedule.expected_time_out,
    ).slice(0, 5);

    return {
      title: `Schedule Update: ${scheduleName}`,
      content: buildScheduleAnnouncementContent(schedule),
      type: "informationals",
      close_date: getDefaultCloseDate(7),
      close_time: scheduleEnd || "17:00",
      is_pinned: false,
    };
  }, [schedule]);

  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setForm(initialForm);
    setErrors({});
  }, [initialForm]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const validate = () => {
    const nextErrors = {};
    if (!form.title?.trim()) nextErrors.title = "Title is required.";
    if (!form.content?.trim()) nextErrors.content = "Content is required.";
    if (!form.type) nextErrors.type = "Type is required.";
    if (!form.close_date) nextErrors.close_date = "Close date is required.";
    if (!form.close_time) nextErrors.close_time = "Close time is required.";
    setErrors(nextErrors);
    return nextErrors;
  };

  const post = async () => {
    const formErrors = validate();
    if (Object.keys(formErrors).length > 0) return;

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        content: form.content.trim(),
        type: form.type,
        close_date: form.close_date,
        close_time: form.close_time,
        is_pinned: Boolean(form.is_pinned),
      };

      const { error } = await supabase.from("announcements").insert([payload]);
      if (error) throw error;

      onSaved?.();
      navigate("/announcements");
    } catch (error) {
      console.error("Error posting announcement:", error.message);
      setErrors({ form: error.message || "Failed to post announcement." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-semibold">Announce Schedule</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Posts an announcement using this schedule’s details.
            </p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {errors.form && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {errors.form}
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-slate-600">Title *</label>
            <Input
              className={`mt-1 ${errors.title ? "border-red-500" : ""}`}
              value={form.title}
              onChange={(event) => set("title", event.target.value)}
              placeholder="Announcement title"
            />
            {errors.title && (
              <p className="mt-1 text-xs text-red-600">{errors.title}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">Type *</label>
            <Select value={form.type} onValueChange={(value) => set("type", value)}>
              <SelectTrigger className={`mt-1 ${errors.type ? "border-red-500" : ""}`}>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {ANNOUNCEMENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="mt-1 text-xs text-red-600">{errors.type}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600">Close Date *</label>
              <Input
                type="date"
                className={`mt-1 ${errors.close_date ? "border-red-500" : ""}`}
                value={form.close_date}
                onChange={(event) => set("close_date", event.target.value)}
              />
              {errors.close_date && (
                <p className="mt-1 text-xs text-red-600">{errors.close_date}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Close Time *</label>
              <Input
                type="time"
                className={`mt-1 ${errors.close_time ? "border-red-500" : ""}`}
                value={form.close_time}
                onChange={(event) => set("close_time", event.target.value)}
              />
              {errors.close_time && (
                <p className="mt-1 text-xs text-red-600">{errors.close_time}</p>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">Content *</label>
            <textarea
              className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                errors.content ? "border-red-500" : "border-slate-200"
              }`}
              rows={8}
              value={form.content}
              onChange={(event) => set("content", event.target.value)}
              placeholder="Announcement message"
            />
            {errors.content && (
              <p className="mt-1 text-xs text-red-600">{errors.content}</p>
            )}
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={Boolean(form.is_pinned)}
              onChange={(event) => set("is_pinned", event.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-slate-600">Pin this announcement</span>
          </label>
        </div>

        <div className="flex justify-end gap-3 p-5 border-t">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={post} disabled={saving}>
            {saving ? "Posting..." : "Post to Announcements"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ScheduleModal({ schedule, onClose, onSaved }) {
  const [form, setForm] = useState(normalizeScheduleForm(schedule));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(normalizeScheduleForm(schedule));
  }, [schedule]);

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const toggleDay = (day) => {
    const currentDays = form.work_days || [];
    set(
      "work_days",
      currentDays.includes(day)
        ? currentDays.filter((value) => value !== day)
        : [...currentDays, day],
    );
  };

  const save = async () => {
    setSaving(true);
    try {
      const expectedTimeIn = normalizeTimeValue(form.expected_time_in, defaultSchedule.expected_time_in);
      const expectedTimeOut = normalizeTimeValue(form.expected_time_out, defaultSchedule.expected_time_out);
      const requiredHours = normalizeTimeValue(form.required_hours, defaultSchedule.required_hours);

      const payload = {
        name: form.name,
        description: form.description,
        expected_time_in: expectedTimeIn,
        expected_time_out: expectedTimeOut,
        grace_period_mins: Number(form.grace_period_mins || 0),
        total_hours: calculateTotalHours(expectedTimeIn, expectedTimeOut),
        required_hours: requiredHours,
        work_days: form.work_days || [],
      };

      if (schedule?.id) {
        const { error } = await supabase
          .from("schedules")
          .update(payload)
          .eq("id", schedule.id);
        if (error) throw error;
      } else {
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

  const computedTotalHours = calculateTotalHours(
    form.expected_time_in,
    form.expected_time_out,
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold">
            {schedule ? "Edit Schedule" : "New Schedule"}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Schedule Details
            </h3>
            <div>
              <label className="text-xs font-medium text-slate-600">Name *</label>
              <Input
                className="mt-1"
                value={form.name}
                onChange={(event) => set("name", event.target.value)}
                placeholder="e.g. Standard Morning Shift"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Description</label>
              <textarea
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                rows={3}
                value={form.description || ""}
                onChange={(event) => set("description", event.target.value)}
                placeholder="Short description of the schedule"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600">Start Time</label>
                <Input
                  className="mt-1"
                  type="time"
                  value={form.expected_time_in}
                  onChange={(event) => set("expected_time_in", event.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">End Time</label>
                <Input
                  className="mt-1"
                  type="time"
                  value={form.expected_time_out}
                  onChange={(event) => set("expected_time_out", event.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600">Required Hours</label>
                <Input
                  className="mt-1"
                  type="time"
                  value={form.required_hours ?? ""}
                  onChange={(event) => set("required_hours", event.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Grace Period (minutes)</label>
                <Input
                  className="mt-1"
                  type="number"
                  value={form.grace_period_mins ?? ""}
                  onChange={(event) => set("grace_period_mins", Number(event.target.value))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-medium text-slate-500">Total Hours</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {formatHours(computedTotalHours)} hrs
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-medium text-slate-500">Work Days</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {(form.work_days || []).length} selected
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 block mb-2">Working Days</label>
            <div className="flex flex-wrap gap-2">
              {days.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    (form.work_days || []).includes(day)
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {day.slice(0, 3)}
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

export default function Schedules() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editSchedule, setEditSchedule] = useState(null);
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [announceSchedule, setAnnounceSchedule] = useState(null);

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

  const filteredSchedules = schedules.filter((schedule) => {
    if (!search) return true;
    const haystack = [
      schedule.name,
      schedule.description,
      schedule.expected_time_in,
      schedule.expected_time_out,
      schedule.required_hours,
      (schedule.work_days || []).join(" "),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Work Schedules</h1>
          <p className="text-sm text-slate-500 mt-1">Shift templates, breaks, and working days</p>
        </div>
        <Button
          onClick={() => {
            setEditSchedule(null);
            setShowScheduleModal(true);
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" /> New Schedule
        </Button>
      </div>

      <div className="w-full max-w-sm">
        <Input
          placeholder="Search schedules..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  {[
                    "Name",
                    "Description",
                    "Start Time",
                    "End Time",
                    "Total Hours",
                    "Required Hours",
                    "Working Day",
                    "Actions",
                  ].map((header) => (
                    <th
                      key={header}
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase whitespace-nowrap"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSchedules.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400">
                      No schedules configured yet.
                    </td>
                  </tr>
                ) : (
                  filteredSchedules.map((schedule) => {
                    return (
                      <tr key={schedule.id} className="hover:bg-slate-50 align-top">
                        <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                          {schedule.name}
                        </td>
                        <td className="px-4 py-3 text-slate-600 max-w-xs">
                          <div className="truncate">{schedule.description || "—"}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                          {schedule.expected_time_in ? schedule.expected_time_in.slice(0, 5) : "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                          {schedule.expected_time_out ? schedule.expected_time_out.slice(0, 5) : "—"}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                          {formatHours(schedule.total_hours)} hrs
                        </td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                          {schedule.required_hours ? schedule.required_hours.slice(0, 5) : "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          <div className="flex flex-wrap gap-1.5 max-w-[220px]">
                            {(schedule.work_days || []).length > 0 ? (
                              schedule.work_days.map((day) => (
                                <span
                                  key={`${schedule.id}-${day}`}
                                  className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full uppercase border border-slate-200"
                                >
                                  {day.slice(0, 3)}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setAnnounceSchedule(schedule);
                                setShowAnnounceModal(true);
                              }}
                              className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                              title="Announce this schedule"
                            >
                              <Megaphone className="w-3.5 h-3.5" />
                              Announce
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditSchedule(schedule);
                                setShowScheduleModal(true);
                              }}
                              className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(schedule.id)}
                              className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 hover:text-red-700"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showScheduleModal && (
        <ScheduleModal
          schedule={editSchedule}
          onClose={() => setShowScheduleModal(false)}
          onSaved={() => {
            setShowScheduleModal(false);
            load();
          }}
        />
      )}

      {showAnnounceModal && (
        <ScheduleAnnouncementModal
          schedule={announceSchedule}
          onClose={() => {
            setShowAnnounceModal(false);
            setAnnounceSchedule(null);
          }}
          onSaved={() => {
            setShowAnnounceModal(false);
            setAnnounceSchedule(null);
          }}
        />
      )}
    </div>
  );
}