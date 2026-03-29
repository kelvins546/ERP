import { useState, useEffect } from "react";
import { supabase } from "@/api/base44Client"; // <-- Clean Supabase import
import { Plus, X, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Adjusted to match typical interview statuses
const statusColors = {
  scheduled: "bg-blue-100 text-blue-700",
  passed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  no_show: "bg-gray-100 text-gray-600",
};

// --- THE MODAL (CREATE & UPDATE) ---
function InterviewModal({ interview, onClose, onSaved }) {
  // Parse the DB's 'scheduled_time' back into separate date and time for the HTML inputs
  const initialDate = interview?.scheduled_time
    ? new Date(interview.scheduled_time).toISOString().split("T")[0]
    : "";
  const initialTime = interview?.scheduled_time
    ? new Date(interview.scheduled_time).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const [form, setForm] = useState({
    applicant_id: interview?.applicant_id || "",
    interviewer_id: interview?.interviewer_id || "",
    interview_date: initialDate,
    interview_time: initialTime,
    format: "in_person", // UI only, see note below
    status: interview?.status || "scheduled",
    remarks: interview?.remarks || "",
  });

  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      // Stitch the date and time together for Supabase
      const scheduledIso = new Date(
        `${form.interview_date}T${form.interview_time || "00:00"}:00`,
      ).toISOString();

      // Build payload matching SQL schema exactly
      const payload = {
        applicant_id: form.applicant_id || null,
        interviewer_id: form.interviewer_id || null,
        scheduled_time: scheduledIso,
        remarks: form.remarks,
        status: form.status,
        // Note: The UI asks for "format" (in_person, video, phone), but your DB doesn't have a format column.
        // You'll need to run: ALTER TABLE interviews ADD COLUMN format text; if you want to save it!
      };

      if (interview?.id) {
        // UPDATE
        const { error } = await supabase
          .from("interviews")
          .update(payload)
          .eq("id", interview.id);
        if (error) throw error;
      } else {
        // CREATE
        const { error } = await supabase.from("interviews").insert([payload]);
        if (error) throw error;
      }
      onSaved();
    } catch (error) {
      console.error("Error saving interview:", error.message);
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
            {interview ? "Edit Interview" : "Schedule Interview"}
          </h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-600">
              Applicant ID (UUID) *
            </label>
            <Input
              className="mt-1"
              value={form.applicant_id}
              onChange={(e) => set("applicant_id", e.target.value)}
              placeholder="Enter Applicant UUID"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">
              Interviewer ID (UUID)
            </label>
            <Input
              className="mt-1"
              value={form.interviewer_id}
              onChange={(e) => set("interviewer_id", e.target.value)}
              placeholder="Enter Interviewer UUID"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600">
                Date *
              </label>
              <Input
                className="mt-1"
                type="date"
                value={form.interview_date}
                onChange={(e) => set("interview_date", e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">
                Time *
              </label>
              <Input
                className="mt-1"
                type="time"
                value={form.interview_time}
                onChange={(e) => set("interview_time", e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">
              Format (Requires DB Column)
            </label>
            <select
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={form.format}
              onChange={(e) => set("format", e.target.value)}
            >
              <option value="in_person">In Person</option>
              <option value="video">Video Call</option>
              <option value="phone">Phone</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Status</label>
            <select
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
            >
              {["scheduled", "passed", "failed", "no_show"].map((r) => (
                <option key={r} value={r}>
                  {r.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">
              Remarks / Notes
            </label>
            <textarea
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              rows={3}
              value={form.remarks}
              onChange={(e) => set("remarks", e.target.value)}
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
              !form.applicant_id ||
              !form.interview_date ||
              !form.interview_time
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
export default function Interviews() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editInterview, setEditInterview] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      // Supabase Read
      const { data, error } = await supabase
        .from("interviews")
        .select("*")
        .order("scheduled_time", { ascending: true }) // Upcoming interviews first
        .limit(200);

      if (error) throw error;
      setInterviews(data || []);
    } catch (error) {
      console.error("Failed to load interviews:", error.message);
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
        <h1 className="text-2xl font-bold text-slate-900">Interviews</h1>
        <Button
          onClick={() => {
            setEditInterview(null);
            setShowModal(true);
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" /> Schedule Interview
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {interviews.length === 0 ? (
            <div className="text-center py-16 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
              No interviews scheduled.
            </div>
          ) : (
            interviews.map((i) => (
              <div
                key={i.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between gap-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  setEditInterview(i);
                  setShowModal(true);
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p
                      className="font-semibold text-slate-900"
                      title={i.applicant_id}
                    >
                      App ID:{" "}
                      {i.applicant_id
                        ? i.applicant_id.substring(0, 8) + "..."
                        : "Unknown"}
                    </p>
                    <p className="text-sm text-slate-500">
                      with Int ID:{" "}
                      {i.interviewer_id
                        ? i.interviewer_id.substring(0, 8) + "..."
                        : "TBD"}{" "}
                      ·{" "}
                      {new Date(i.scheduled_time).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                    {i.remarks && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1 italic">
                        "{i.remarks}"
                      </p>
                    )}
                  </div>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize shrink-0 ${statusColors[i.status] || "bg-slate-100 text-slate-600"}`}
                >
                  {(i.status || "scheduled").replace("_", " ")}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {showModal && (
        <InterviewModal
          interview={editInterview}
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
