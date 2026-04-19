import { useState, useEffect } from "react";
import { supabase } from "@/api/base44Client";
import {
  Plus,
  X,
  ChevronRight,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  User,
  Eye,
  Edit,
  ChevronLeft,
  FileText,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// These statuses MUST match the 'applicant_status' ENUM in your SQL database
const stages = ["applied", "interviewing", "offered", "rejected", "hired"];

const stageColors = {
  applied: "bg-slate-100 text-slate-700 border-slate-200",
  interviewing: "bg-blue-50 text-blue-700 border-blue-200",
  offered: "bg-purple-50 text-purple-700 border-purple-200",
  hired: "bg-[#2E6F40]/10 text-[#2E6F40] border-[#2E6F40]/20", // Ark Brand Green
  rejected: "bg-red-50 text-red-700 border-red-200",
};

// --- VIEW APPLICANT MODAL (WITH EMBEDDED CV) ---
function ApplicantViewModal({ applicant, onClose }) {
  if (!applicant) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white z-10 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {applicant.first_name} {applicant.last_name}
            </h2>
            <p className="text-sm font-medium text-[#2E6F40] mt-0.5">
              Applying for:{" "}
              {applicant.job_postings?.post_title ||
                applicant.job_postings?.title ||
                "General Application"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6">
          {/* Details Sidebar */}
          <div className="w-full md:w-1/3 space-y-6 shrink-0">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
              <h3 className="font-bold text-slate-800 border-b border-slate-200 pb-2">
                Applicant Details
              </h3>

              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Status
                </span>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${stageColors[applicant.status]}`}
                >
                  {applicant.status.replace("_", " ")}
                </span>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Contact
                </span>
                <p className="text-sm font-medium text-slate-800 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />{" "}
                  {applicant.email || "—"}
                </p>
                <p className="text-sm font-medium text-slate-800 flex items-center gap-2 mt-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />{" "}
                  {applicant.phone || "—"}
                </p>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Expectations
                </span>
                <p className="text-sm font-medium text-slate-800">
                  Salary:{" "}
                  {applicant.expected_salary
                    ? `₱${Number(applicant.expected_salary).toLocaleString()}`
                    : "—"}
                </p>
                <p className="text-sm font-medium text-slate-800 mt-1">
                  Available:{" "}
                  {applicant.available_date
                    ? new Date(applicant.available_date).toLocaleDateString()
                    : "—"}
                </p>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Source
                </span>
                <p className="text-sm font-medium text-slate-800">
                  {applicant.source || "Website"}
                </p>
              </div>
            </div>

            {applicant.message && (
              <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100">
                <h3 className="font-bold text-blue-900 border-b border-blue-200 pb-2 mb-3">
                  Cover Letter / Message
                </h3>
                <p className="text-sm text-blue-800 whitespace-pre-wrap leading-relaxed">
                  {applicant.message}
                </p>
              </div>
            )}
          </div>

          {/* CV Embedded Viewer */}
          <div className="w-full md:w-2/3 flex flex-col">
            <h3 className="font-bold text-slate-800 mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#2E6F40]" /> Resume / CV
              </span>
              {applicant.cv_url && (
                <a
                  href={applicant.cv_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-[#2E6F40] hover:text-[#235330] flex items-center gap-1 bg-[#2E6F40]/10 hover:bg-[#2E6F40]/20 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Open in new tab <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </h3>

            <div className="flex-1 bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden min-h-[500px] flex items-center justify-center relative">
              {applicant.cv_url ? (
                <iframe
                  src={`${applicant.cv_url}#toolbar=0`}
                  className="w-full h-full absolute inset-0"
                  title="Applicant CV"
                >
                  <p className="text-slate-500 text-sm">
                    Your browser does not support PDFs.{" "}
                    <a
                      href={applicant.cv_url}
                      className="text-[#2E6F40] underline"
                    >
                      Download the PDF
                    </a>
                    .
                  </p>
                </iframe>
              ) : (
                <div className="text-center text-slate-400 p-6">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No document attached to this application.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end p-5 border-t border-slate-100 bg-slate-50 shrink-0">
          <Button
            onClick={onClose}
            className="bg-[#2E6F40] hover:bg-[#235330] text-white rounded-xl shadow-sm px-8"
          >
            Close Viewer
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- THE MODAL (CREATE & UPDATE) ---
function ApplicantModal({ applicant, onClose, onSaved }) {
  const [form, setForm] = useState(() => {
    let phonePrefix = "+63";
    let phoneNum = applicant?.phone || "";
    if (phoneNum.startsWith("+")) {
      const match = phoneNum.match(/^(\+\d{1,4})(.*)$/);
      if (match) {
        phonePrefix = match[1];
        phoneNum = match[2];
      }
    }
    return {
      first_name: "",
      last_name: "",
      email: "",
      job_posting_title: "",
      status: "applied",
      source: "",
      notes: "",
      job_posting_id: null,
      expected_salary: applicant?.expected_salary || "",
      available_date: applicant?.available_date || "",
      message: applicant?.message || "",
      cv_url: applicant?.cv_url || "",
      ...applicant,
      phone_prefix: phonePrefix,
      phone: phoneNum,
    };
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        first_name: form.first_name,
        last_name: form.last_name,
        status: form.status,
        job_posting_id: form.job_posting_id || null,
        email: form.email,
        phone: form.phone ? `${form.phone_prefix}${form.phone}` : null,
        source: form.source,
        notes: form.notes,
        expected_salary: form.expected_salary,
        available_date: form.available_date,
        message: form.message,
        cv_url: form.cv_url,
      };
      if (applicant?.id) {
        const { error } = await supabase
          .from("applicants")
          .update(payload)
          .eq("id", applicant.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("applicants").insert([payload]);
        if (error) throw error;
      }
      onSaved();
    } catch (error) {
      console.error("Error saving applicant:", error.message);
      alert("Failed to save: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleQuickAction = async (newStatus) => {
    if (!applicant?.id) return;
    setSaving(true);
    try {
      const payload = {
        first_name: form.first_name,
        last_name: form.last_name,
        status: newStatus,
        job_posting_id: form.job_posting_id || null,
        email: form.email,
        phone: form.phone ? `${form.phone_prefix}${form.phone}` : null,
        source: form.source,
        notes: form.notes,
      };
      const { error } = await supabase
        .from("applicants")
        .update(payload)
        .eq("id", applicant.id);
      if (error) throw error;
      onSaved();
    } catch (error) {
      console.error("Error updating status:", error.message);
      alert("Failed to update status: " + error.message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-sm">
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto border border-slate-100 no-scrollbar"
        style={{ overflowX: "hidden" }}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold tracking-tight text-slate-800">
            {applicant ? "Edit Applicant" : "Add Applicant"}
          </h2>
          <button
            onClick={onClose}
            className="hover:bg-slate-100 rounded-full p-1.5 transition"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 block">
                First Name *
              </label>
              <Input
                className="focus-visible:ring-[#2E6F40]"
                value={form.first_name}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^[a-zA-Z\s]*$/.test(val) && !/\s\s/.test(val)) {
                    set("first_name", val);
                  }
                }}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 block">
                Last Name *
              </label>
              <Input
                className="focus-visible:ring-[#2E6F40]"
                value={form.last_name}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^[a-zA-Z\s]*$/.test(val) && !/\s\s/.test(val)) {
                    set("last_name", val);
                  }
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 block">
                Email Address
              </label>
              <Input
                type="email"
                className="focus-visible:ring-[#2E6F40]"
                value={form.email || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  if (
                    !/\s/.test(val) &&
                    (val.match(/@/g) || []).length <= 1 &&
                    !/[^a-zA-Z0-9]{2,}/.test(val)
                  ) {
                    set("email", val);
                  }
                }}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 block">
                Phone Number
              </label>
              <div className="flex gap-2">
                <select
                  className="border border-slate-200 bg-slate-50 text-slate-700 rounded-md px-3 py-2 text-sm w-24 shrink-0 outline-none focus:border-[#2E6F40] focus:ring-1 focus:ring-[#2E6F40] transition-all"
                  value={form.phone_prefix}
                  onChange={(e) => set("phone_prefix", e.target.value)}
                >
                  <option value="+63">+63 (PH)</option>
                  <option value="+1">+1 (US)</option>
                  <option value="+44">+44 (UK)</option>
                  <option value="+61">+61 (AU)</option>
                  <option value="+81">+81 (JP)</option>
                  <option value="+86">+86 (CN)</option>
                  <option value="+65">+65 (SG)</option>
                </select>
                <Input
                  className="flex-1 focus-visible:ring-[#2E6F40]"
                  value={form.phone || ""}
                  onChange={(e) => {
                    if (/^\d{0,10}$/.test(e.target.value)) {
                      set("phone", e.target.value);
                    }
                  }}
                  placeholder="e.g. 9123456789"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 block">
                Job Posting ID
              </label>
              <Input
                className="focus-visible:ring-[#2E6F40]"
                value={form.job_posting_id || ""}
                onChange={(e) => set("job_posting_id", e.target.value)}
                placeholder="UUID (Optional)"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 block">
                Status
              </label>
              <select
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:border-[#2E6F40] focus:ring-1 focus:ring-[#2E6F40] transition-all"
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
              >
                {stages.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 block">
                Expected Salary
              </label>
              <Input
                type="number"
                min="0"
                className="focus-visible:ring-[#2E6F40]"
                value={form.expected_salary || ""}
                onChange={(e) => set("expected_salary", e.target.value)}
                placeholder="e.g. 35000"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 block">
                Available Date
              </label>
              <Input
                type="date"
                className="focus-visible:ring-[#2E6F40]"
                value={form.available_date || ""}
                onChange={(e) => set("available_date", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5">
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 block">
                Message / Cover Letter
              </label>
              <textarea
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:border-[#2E6F40] focus:ring-1 focus:ring-[#2E6F40] transition-all min-h-[70px]"
                rows={3}
                value={form.message || ""}
                onChange={(e) => set("message", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 block">
                Source
              </label>
              <Input
                className="focus-visible:ring-[#2E6F40]"
                value={form.source || ""}
                onChange={(e) => set("source", e.target.value)}
                placeholder="LinkedIn, Referral, Walk-in..."
              />
            </div>
            <div className="flex items-end gap-2 pt-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 block flex-1">
                CV URL
              </label>
              {form.cv_url && (
                <a
                  href={form.cv_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-full bg-[#2E6F40]/10 hover:bg-[#2E6F40]/20 text-[#2E6F40] p-2 transition border border-[#2E6F40]/20"
                  title="View CV"
                >
                  <FileText className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5">
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 block">
                Internal Notes
              </label>
              <textarea
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:border-[#2E6F40] focus:ring-1 focus:ring-[#2E6F40] transition-all min-h-[70px]"
                rows={3}
                value={form.notes || ""}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Interview notes, red flags, etc."
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 sticky bottom-0 z-10">
          <div className="flex gap-2 w-full sm:w-auto mb-2 sm:mb-0">
            {form.status === "applied" && applicant?.id && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="bg-white text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 shadow-sm"
                  onClick={() => handleQuickAction("rejected")}
                  disabled={saving}
                >
                  <XCircle className="w-4 h-4 mr-2" /> Decline
                </Button>
                <Button
                  type="button"
                  className="bg-[#2E6F40] hover:bg-[#235330] text-white shadow-sm"
                  onClick={() => handleQuickAction("interviewing")}
                  disabled={saving}
                >
                  <CheckCircle className="w-4 h-4 mr-2" /> Accept
                </Button>
              </>
            )}
          </div>
          <div className="flex gap-3 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={save}
              disabled={saving || !form.first_name || !form.last_name}
              className="bg-[#2E6F40] hover:bg-[#235330] text-white rounded-xl shadow-sm"
            >
              {saving ? "Saving..." : "Save Applicant"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- THE MAIN PAGE (READ & KANBAN LOGIC) ---
export default function Applicants() {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editApplicant, setEditApplicant] = useState(null);
  const [viewApplicant, setViewApplicant] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      // Supabase Read - Ordered by newest first
      const { data, error } = await supabase
        .from("applicants")
        .select("*, job_postings(*)")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;
      setApplicants(data || []);
    } catch (error) {
      console.error("Failed to load applicants:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const byStage = (stage) => applicants.filter((a) => a.status === stage);

  const moveStage = async (applicant, direction) => {
    const idx = stages.indexOf(applicant.status);
    const next = stages[idx + direction];
    if (!next) return;

    try {
      // Supabase Update Status
      const { error } = await supabase
        .from("applicants")
        .update({ status: next })
        .eq("id", applicant.id);

      if (error) throw error;
      load(); // Refresh board
    } catch (error) {
      console.error("Failed to move applicant:", error.message);
      alert(
        "Failed to update status. Make sure your database ENUMs are updated.",
      );
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Applicant Tracking
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {applicants.length} total applicants in pipeline
          </p>
        </div>
        <Button
          onClick={() => {
            setEditApplicant(null);
            setShowModal(true);
          }}
          className="gap-2 px-5 py-2.5 rounded-xl shadow-md bg-[#2E6F40] hover:bg-[#235330] text-white font-semibold transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" /> Add Applicant
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-[#2E6F40]/30 border-t-[#2E6F40] rounded-full animate-spin" />
        </div>
      ) : (
        /* CHANGED: We now use a responsive grid instead of a scrolling flex container */
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 pb-4 pt-2">
          {stages.map((stage) => (
            /* CHANGED: Removed the fixed w-[22rem] so it compresses automatically */
            <div key={stage} className="flex flex-col min-w-0">
              <div className="flex items-center justify-between mb-4 px-1">
                <span
                  className={`text-[11px] xl:text-xs font-bold px-2 xl:px-3 py-1 rounded-full capitalize tracking-wider border truncate ${stageColors[stage] || "bg-slate-100"}`}
                >
                  {stage.replace("_", " ")}
                </span>
                <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md font-bold shrink-0 ml-1">
                  {byStage(stage).length}
                </span>
              </div>
              <div className="space-y-3">
                {byStage(stage).map((a) => (
                  <div
                    key={a.id}
                    className="bg-white rounded-2xl border border-slate-200 p-3 xl:p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className={`w-8 h-8 xl:w-10 xl:h-10 rounded-xl flex items-center justify-center shrink-0 ${stage === "hired" ? "bg-[#2E6F40] text-white" : "bg-[#2E6F40]/10 text-[#2E6F40]"}`}
                      >
                        <User className="w-4 h-4 xl:w-5 xl:h-5" />
                      </div>
                      <span className="text-[9px] xl:text-[10px] uppercase font-bold text-slate-400">
                        {new Date(a.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex-grow">
                      <h3 className="font-bold text-slate-900 text-base xl:text-lg leading-tight truncate">
                        {a.first_name} {a.last_name}
                      </h3>
                      <p
                        className="text-xs xl:text-sm text-slate-500 mt-1 font-medium truncate"
                        title={
                          a.job_postings?.post_title ||
                          a.job_postings?.title ||
                          "N/A"
                        }
                      >
                        For:{" "}
                        {a.job_postings?.post_title ||
                          a.job_postings?.title ||
                          "General Application"}
                      </p>

                      <p className="text-[10px] xl:text-xs text-slate-500 mt-3 line-clamp-2 h-8 bg-slate-50 p-2 rounded-lg border border-slate-100 italic">
                        "{a.message || "No message provided."}"
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-1 gap-y-2 mt-4 pt-4 border-t border-slate-100">
                      <button
                        onClick={() => setViewApplicant(a)}
                        className="text-[10px] xl:text-xs text-slate-600 hover:text-[#2E6F40] font-semibold flex items-center gap-1 transition-colors bg-slate-50 hover:bg-[#2E6F40]/10 px-2 py-1.5 rounded-lg"
                      >
                        <FileText className="w-3 h-3" />{" "}
                        <span className="hidden xl:inline">View CV</span>
                      </button>
                      {a.status !== "applied" && (
                        <button
                          onClick={() => {
                            setEditApplicant(a);
                            setShowModal(true);
                          }}
                          className="text-[10px] xl:text-xs text-slate-600 hover:text-blue-600 font-semibold flex items-center gap-1 transition-colors bg-slate-50 hover:bg-blue-50 px-2 py-1.5 rounded-lg"
                        >
                          <Edit className="w-3 h-3" />{" "}
                          <span className="hidden xl:inline">Edit</span>
                        </button>
                      )}

                      <div className="ml-auto flex gap-1">
                        {a.status === "applied" ? (
                          <>
                            <button
                              onClick={() =>
                                setConfirmAction({
                                  type: "decline",
                                  applicant: a,
                                })
                              }
                              className="px-2 py-1.5 text-[10px] xl:text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg transition-colors"
                            >
                              Decline
                            </button>
                            <button
                              onClick={() =>
                                setConfirmAction({
                                  type: "accept",
                                  applicant: a,
                                })
                              }
                              className="px-2 py-1.5 text-[10px] xl:text-xs font-bold text-[#2E6F40] bg-[#2E6F40]/10 hover:bg-[#2E6F40]/20 border border-[#2E6F40]/20 rounded-lg transition-colors"
                            >
                              Accept
                            </button>
                          </>
                        ) : (
                          <>
                            {stages.indexOf(a.status) > 0 && (
                              <button
                                onClick={() => moveStage(a, -1)}
                                className="p-1 xl:p-1.5 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-200 border border-slate-100 rounded-lg transition-colors"
                                title="Move Stage Back"
                              >
                                <ChevronLeft className="w-3 h-3 xl:w-4 xl:h-4" />
                              </button>
                            )}
                            {stages.indexOf(a.status) < stages.length - 1 && (
                              <button
                                onClick={() => moveStage(a, 1)}
                                className="p-1 xl:p-1.5 text-[#2E6F40]/70 hover:text-[#2E6F40] bg-[#2E6F40]/10 hover:bg-[#2E6F40]/20 border border-[#2E6F40]/20 rounded-lg transition-colors"
                                title="Move Stage Forward"
                              >
                                <ChevronRight className="w-3 h-3 xl:w-4 xl:h-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {byStage(stage).length === 0 && (
                  <div className="text-center py-8 text-slate-400 font-medium text-xs bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-2xl">
                    No applicants
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <ApplicantModal
          applicant={editApplicant}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            load();
          }}
        />
      )}

      {viewApplicant && (
        <ApplicantViewModal
          applicant={viewApplicant}
          onClose={() => setViewApplicant(null)}
        />
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-8 text-center animate-in zoom-in-95 duration-200">
            <div
              className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-5 ${confirmAction.type === "accept" ? "bg-[#2E6F40]/10" : "bg-red-50"}`}
            >
              {confirmAction.type === "accept" ? (
                <CheckCircle className="w-8 h-8 text-[#2E6F40]" />
              ) : (
                <XCircle className="w-8 h-8 text-red-600" />
              )}
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {confirmAction.type === "accept"
                ? "Accept Applicant?"
                : "Decline Applicant?"}
            </h3>
            <p className="text-sm text-slate-500 mb-8 leading-relaxed">
              Are you sure you want to {confirmAction.type}{" "}
              <strong className="text-slate-800">
                {confirmAction.applicant.first_name}{" "}
                {confirmAction.applicant.last_name}
              </strong>
              ?
              {confirmAction.type === "accept"
                ? " They will be moved to the Interviewing stage."
                : " They will be moved to the Rejected stage."}
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                className="rounded-xl px-6"
                onClick={() => setConfirmAction(null)}
              >
                Cancel
              </Button>
              <Button
                className={`rounded-xl px-6 ${confirmAction.type === "accept" ? "bg-[#2E6F40] hover:bg-[#235330] text-white shadow-md" : "bg-red-600 hover:bg-red-700 text-white shadow-md"}`}
                onClick={async () => {
                  const status =
                    confirmAction.type === "accept"
                      ? "interviewing"
                      : "rejected";
                  try {
                    await supabase
                      .from("applicants")
                      .update({ status })
                      .eq("id", confirmAction.applicant.id);
                    load();
                    setConfirmAction(null);
                  } catch (e) {
                    alert("Failed to update status. Check your ENUMs!");
                  }
                }}
              >
                Confirm {confirmAction.type === "accept" ? "Accept" : "Decline"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
