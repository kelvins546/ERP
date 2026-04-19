import { useState, useEffect } from "react";
import { supabase } from "@/api/base44Client";
import { Plus, X, Calendar, User, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const statusColors = {
  scheduled: "bg-blue-100 text-blue-700 border-blue-200",
  passed: "bg-[#2E6F40]/10 text-[#2E6F40] border-[#2E6F40]/20", // Ark Green for passed
  failed: "bg-red-100 text-red-700 border-red-200",
  no_show: "bg-slate-100 text-slate-600 border-slate-200",
};

// --- THE MODAL (CREATE & UPDATE) ---
function InterviewModal({
  interview,
  applicants,
  employees,
  onClose,
  onSaved,
}) {
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
    format: interview?.format || "in_person",
    status: interview?.status || "scheduled",
    remarks: interview?.remarks || "",
  });

  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const scheduledIso = new Date(
        `${form.interview_date}T${form.interview_time || "00:00"}:00`,
      ).toISOString();

      const payload = {
        applicant_id: form.applicant_id || null,
        interviewer_id: form.interviewer_id || null,
        scheduled_time: scheduledIso,
        remarks: form.remarks,
        status: form.status,
        format: form.format, // Ensure you add this column in your DB if it throws an error!
      };

      if (interview?.id) {
        const { error } = await supabase
          .from("interviews")
          .update(payload)
          .eq("id", interview.id);
        if (error) throw error;
      } else {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">
            {interview ? "Edit Interview" : "Schedule Interview"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          {/* APPLICANT DROPDOWN */}
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 block">
              Applicant *
            </label>
            <select
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#2E6F40] focus:ring-1 focus:ring-[#2E6F40] transition-all bg-white"
              value={form.applicant_id}
              onChange={(e) => set("applicant_id", e.target.value)}
            >
              <option value="" disabled>
                Select an applicant...
              </option>
              {/* If editing an older interview where the applicant is no longer in the "interviewing" stage, keep their name visible */}
              {interview?.applicant_id &&
                !applicants.find((a) => a.id === interview.applicant_id) && (
                  <option value={interview.applicant_id}>
                    {interview.applicants?.first_name}{" "}
                    {interview.applicants?.last_name} (Current)
                  </option>
                )}
              {applicants.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.first_name} {a.last_name} —{" "}
                  {a.job_postings?.post_title ||
                    a.job_postings?.title ||
                    "General"}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
              Only applicants in the "Interviewing" stage appear here.
            </p>
          </div>

          {/* INTERVIEWER DROPDOWN */}
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 block">
              Interviewer (Employee)
            </label>
            <select
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#2E6F40] focus:ring-1 focus:ring-[#2E6F40] transition-all bg-white"
              value={form.interviewer_id}
              onChange={(e) => set("interviewer_id", e.target.value)}
            >
              <option value="">Unassigned / TBD</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 block">
                Date *
              </label>
              <Input
                className="rounded-xl focus-visible:ring-[#2E6F40]"
                type="date"
                value={form.interview_date}
                onChange={(e) => set("interview_date", e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 block">
                Time *
              </label>
              <Input
                className="rounded-xl focus-visible:ring-[#2E6F40]"
                type="time"
                value={form.interview_time}
                onChange={(e) => set("interview_time", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 block">
                Format
              </label>
              <select
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#2E6F40] focus:ring-1 focus:ring-[#2E6F40] transition-all bg-white"
                value={form.format}
                onChange={(e) => set("format", e.target.value)}
              >
                <option value="in_person">In Person</option>
                <option value="video">Video Call</option>
                <option value="phone">Phone</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 block">
                Status
              </label>
              <select
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#2E6F40] focus:ring-1 focus:ring-[#2E6F40] transition-all bg-white"
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
              >
                {["scheduled", "passed", "failed", "no_show"].map((r) => (
                  <option key={r} value={r}>
                    {r.replace("_", " ").toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 block">
              Remarks / Notes
            </label>
            <textarea
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#2E6F40] focus:ring-1 focus:ring-[#2E6F40] transition-all"
              rows={3}
              value={form.remarks}
              onChange={(e) => set("remarks", e.target.value)}
              placeholder="e.g. Bring portfolio, send Zoom link..."
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t border-slate-100 bg-slate-50">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-xl px-6"
          >
            Cancel
          </Button>
          <Button
            className="rounded-xl px-6 bg-[#2E6F40] hover:bg-[#235330] text-white shadow-md"
            onClick={save}
            disabled={
              saving ||
              !form.applicant_id ||
              !form.interview_date ||
              !form.interview_time
            }
          >
            {saving ? "Saving..." : "Save Interview"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- THE MAIN PAGE (READ) ---
export default function Interviews() {
  const [interviews, setInterviews] = useState([]);
  const [applicants, setApplicants] = useState([]); // Holds applicants in 'interviewing' stage
  const [employees, setEmployees] = useState([]); // Holds potential interviewers
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editInterview, setEditInterview] = useState(null);

  const load = async () => {
    try {
      setLoading(true);

      // Parallel fetching for performance
      const [intsRes, appsRes, empsRes] = await Promise.all([
        // 1. Fetch Interviews (and join the related applicant and employee names!)
        supabase
          .from("interviews")
          .select(
            `
            *,
            applicants(first_name, last_name, job_postings(title, post_title)),
            employees(first_name, last_name)
          `,
          )
          .order("scheduled_time", { ascending: true })
          .limit(200),

        // 2. Fetch Applicants who are strictly in the 'interviewing' stage
        supabase
          .from("applicants")
          .select("id, first_name, last_name, job_postings(title, post_title)")
          .eq("status", "interviewing"),

        // 3. Fetch Employees to act as interviewers
        supabase
          .from("employees")
          .select("id, first_name, last_name")
          .eq("status", "regular"), // Only active/regular employees can interview
      ]);

      if (intsRes.error) throw intsRes.error;
      if (appsRes.error) throw appsRes.error;
      if (empsRes.error) throw empsRes.error;

      setInterviews(intsRes.data || []);
      setApplicants(appsRes.data || []);
      setEmployees(empsRes.data || []);
    } catch (error) {
      console.error("Failed to load interview data:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Interviews
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage and schedule candidate interviews.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditInterview(null);
            setShowModal(true);
          }}
          className="gap-2 bg-[#2E6F40] hover:bg-[#235330] text-white rounded-xl shadow-md transition-all hover:scale-[1.02] px-5"
        >
          <Plus className="w-4 h-4" /> Schedule Interview
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-[#2E6F40]/30 border-t-[#2E6F40] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {interviews.length === 0 ? (
            <div className="text-center py-16 text-slate-400 font-medium bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
              No interviews scheduled.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {interviews.map((i) => (
                <div
                  key={i.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between gap-4 cursor-pointer hover:shadow-md hover:border-[#2E6F40]/30 transition-all"
                  onClick={() => {
                    setEditInterview(i);
                    setShowModal(true);
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center shrink-0">
                        <Calendar className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        {/* Display Actual Human Names instead of UUIDs */}
                        <h3 className="font-bold text-slate-900 text-lg leading-tight">
                          {i.applicants?.first_name} {i.applicants?.last_name}
                        </h3>
                        <p className="text-sm font-medium text-[#2E6F40] mt-0.5">
                          {i.applicants?.job_postings?.post_title ||
                            i.applicants?.job_postings?.title ||
                            "General Application"}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shrink-0 border ${statusColors[i.status] || "bg-slate-100 text-slate-600 border-slate-200"}`}
                    >
                      {(i.status || "scheduled").replace("_", " ")}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Schedule
                      </span>
                      <p className="text-sm font-semibold text-slate-700">
                        {new Date(i.scheduled_time).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Interviewer
                      </span>
                      <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {i.employees
                          ? `${i.employees.first_name} ${i.employees.last_name}`
                          : "Unassigned"}
                      </p>
                    </div>
                  </div>

                  {i.remarks && (
                    <p className="text-xs text-slate-500 mt-1 italic border-l-2 border-slate-200 pl-3">
                      "{i.remarks}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showModal && (
        <InterviewModal
          interview={editInterview}
          applicants={applicants}
          employees={employees}
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
