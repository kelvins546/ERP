import { useState, useEffect } from "react";
import { supabase } from "@/api/base44Client";
import {
  Plus,
  X,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  User,
  Eye,
  Edit,
  FileText,
  ExternalLink,
  Settings,
  UserPlus,
  Check,
  Circle,
  MoreHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import emailjs from "@emailjs/browser";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

// --- ONBOARDING COMPONENTS ---
function ViewOnboardingModal({ onboarding, onClose }) {
  if (!onboarding) return null;
  const completedCount = onboarding.steps.filter(s => s.status === 'completed').length;
  const totalSteps = onboarding.steps.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#2E6F40]/10 flex items-center justify-center text-[#2E6F40]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Onboarding for {onboarding.onboardee}
              </h2>
              <p className="text-sm font-medium text-slate-500 mt-0.5 flex items-center gap-2">
                <span>Officer: {onboarding.officer}</span>
                <span>•</span>
                <span>{onboarding.start_date} to {onboarding.end_date}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          <div className="mb-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="text-sm font-bold text-slate-700">Start</div>
            <div className="flex-1 mx-4 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#2E6F40] transition-all" style={{ width: `${(completedCount / totalSteps) * 100}%` }}></div>
            </div>
            <div className="text-sm font-bold text-[#2E6F40]">Completed ({completedCount}/{totalSteps})</div>
          </div>

          <div className="space-y-3">
            {onboarding.steps.map((step, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step.status === 'completed' ? 'bg-[#2E6F40] text-white' : 'bg-slate-100 text-slate-400'}`}>
                    {step.status === 'completed' ? <Check className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                  </div>
                  <span className={`font-semibold ${step.status === 'completed' ? 'text-slate-900' : 'text-slate-500'}`}>{step.name}</span>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider ${step.status === 'completed' ? 'bg-[#2E6F40]/10 text-[#2E6F40]' : 'bg-slate-100 text-slate-500'}`}>
                  {step.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end p-5 border-t border-slate-100 bg-white shrink-0">
          <Button onClick={onClose} className="bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl px-8 shadow-sm">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

function PerformOnboardingModal({ onboarding, onClose, onUpdateStep, onAddStep }) {
  const [confirmStep, setConfirmStep] = useState(null);
  const [newStepName, setNewStepName] = useState("");
  const [showAddStep, setShowAddStep] = useState(false);

  if (!onboarding) return null;
  const completedCount = onboarding.steps.filter(s => s.status === 'completed').length;
  const totalSteps = onboarding.steps.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Perform Onboarding: {onboarding.onboardee}
              </h2>
              <p className="text-sm font-medium text-slate-500 mt-0.5 flex items-center gap-2">
                <span>Officer: {onboarding.officer}</span>
                <span>•</span>
                <span>{onboarding.start_date} to {onboarding.end_date}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          <div className="mb-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="text-sm font-bold text-slate-700">Start</div>
            <div className="flex-1 mx-4 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 transition-all" style={{ width: `${(completedCount / totalSteps) * 100}%` }}></div>
            </div>
            <div className="text-sm font-bold text-blue-600">Completed ({completedCount}/{totalSteps})</div>
          </div>

          <div className="space-y-3">
            {onboarding.steps.map((step, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => { if (step.status !== 'completed') setConfirmStep(step); }}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${step.status === 'completed' ? 'bg-[#2E6F40] text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600'}`}>
                    {step.status === 'completed' ? <Check className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                  </div>
                  <span className={`font-semibold ${step.status === 'completed' ? 'text-slate-900' : 'text-slate-700'}`}>{step.name}</span>
                </div>
                {step.status !== 'completed' ? (
                  <Button variant="outline" size="sm" className="text-xs h-7 rounded-lg">Mark Done</Button>
                ) : (
                  <span className="text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider bg-[#2E6F40]/10 text-[#2E6F40]">
                    Completed
                  </span>
                )}
              </div>
            ))}
          </div>

          {showAddStep ? (
            <div className="mt-4 p-4 bg-white rounded-xl border border-blue-200 shadow-sm flex items-center gap-3">
              <Input value={newStepName} onChange={e => setNewStepName(e.target.value)} placeholder="New step name..." className="flex-1 focus-visible:ring-blue-500" autoFocus />
              <Button onClick={() => { if (newStepName) { onAddStep(onboarding.id, newStepName); setNewStepName(""); setShowAddStep(false); } }} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">Add</Button>
              <Button variant="ghost" onClick={() => setShowAddStep(false)}>Cancel</Button>
            </div>
          ) : (
            <button onClick={() => setShowAddStep(true)} className="mt-4 w-full p-4 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center gap-2 text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50 transition-all font-semibold">
              <Plus className="w-5 h-5" /> Add Custom Step
            </button>
          )}
        </div>

        <div className="flex justify-end p-5 border-t border-slate-100 bg-white shrink-0">
          <Button onClick={onClose} className="bg-slate-800 hover:bg-slate-900 text-white rounded-xl px-8 shadow-sm">
            Done
          </Button>
        </div>
      </div>

      {confirmStep && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-8 text-center animate-in zoom-in-95 duration-200">
            <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-5 bg-blue-50">
              <CheckCircle className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Confirm Action</h3>
            <p className="text-sm text-slate-500 mb-8 leading-relaxed">
              Are you sure the step <strong className="text-slate-800">"{confirmStep.name}"</strong> is properly performed to the employee?
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" className="rounded-xl px-6" onClick={() => setConfirmStep(null)}>Cancel</Button>
              <Button className="rounded-xl px-6 bg-blue-600 hover:bg-blue-700 text-white shadow-md" onClick={() => {
                onUpdateStep(onboarding.id, confirmStep.id, 'completed');
                setConfirmStep(null);
              }}>
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ReassignOfficerModal({ onboarding, employees, onClose, onConfirm }) {
  const [newOfficerId, setNewOfficerId] = useState("");

  if (!onboarding) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 text-center animate-in zoom-in-95 duration-200">
        <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-5 bg-purple-50">
          <UserPlus className="w-8 h-8 text-purple-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Reassign Officer</h3>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          Select a new onboarding officer for <strong className="text-slate-800">{onboarding.onboardee}</strong>. Current officer: {onboarding.officer}.
        </p>
        <div className="text-left mb-8">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1.5">New Officer</label>
          <select className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-all bg-white" value={newOfficerId} onChange={e => setNewOfficerId(e.target.value)}>
            <option value="">Select Employee...</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" className="rounded-xl px-6" onClick={onClose}>Cancel</Button>
          <Button disabled={!newOfficerId} className="rounded-xl px-6 bg-purple-600 hover:bg-purple-700 text-white shadow-md" onClick={() => {
            const officer = employees.find(e => e.id === newOfficerId);
            onConfirm(onboarding.id, officer ? `${officer.first_name} ${officer.last_name}` : "Unknown");
          }}>
            Confirm Reassignment
          </Button>
        </div>
      </div>
    </div>
  );
}

function CancelOnboardingModal({ onboarding, onClose, onConfirm }) {
  if (!onboarding) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-8 text-center animate-in zoom-in-95 duration-200">
        <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-5 bg-red-50">
          <XCircle className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Cancel Onboarding</h3>
        <p className="text-sm text-slate-500 mb-8 leading-relaxed">
          Are you sure you want to cancel the onboarding process for <strong className="text-slate-800">{onboarding.onboardee}</strong>? This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" className="rounded-xl px-6" onClick={onClose}>Back</Button>
          <Button className="rounded-xl px-6 bg-red-600 hover:bg-red-700 text-white shadow-md" onClick={() => onConfirm(onboarding.id)}>
            Confirm Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- THE MAIN PAGE (READ & KANBAN LOGIC) ---

function SetupOnboardingModal({ applicants, employees, onClose, onSave }) {
  const [applicantId, setApplicantId] = useState("");
  const [officerId, setOfficerId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const save = () => {
    if (!applicantId || !officerId || !startDate || !endDate) return alert("Please fill all fields");
    const app = applicants.find(a => a.id === applicantId);
    const emp = employees.find(e => e.id === officerId);
    if (!app || !emp) return;

    onSave({
      id: Date.now(),
      employee_no: `EMP-${new Date().getFullYear()}-${Math.floor(Math.random()*1000).toString().padStart(3,'0')}`,
      onboardee: `${app.first_name} ${app.last_name}`,
      start_date: startDate,
      end_date: endDate,
      officer: `${emp.first_name} ${emp.last_name}`,
      steps: [
        { id: 1, name: "Employee profile", status: "pending" },
        { id: 2, name: "Job contract", status: "pending" },
        { id: 3, name: "Discuss company policy", status: "pending" },
        { id: 4, name: "Set Employee schedule", status: "pending" },
        { id: 5, name: "Setup statutory forms", status: "pending" },
        { id: 6, name: "Setup benefits and deductions", status: "pending" }
      ]
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 animate-in zoom-in-95 duration-200">
        <h3 className="text-xl font-bold text-slate-900 mb-6">Set up new onboarding</h3>
        <div className="space-y-4 text-left mb-8">
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1.5">Select Applicant</label>
            <select className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#2E6F40] focus:ring-1 focus:ring-[#2E6F40] transition-all bg-white" value={applicantId} onChange={e => setApplicantId(e.target.value)}>
              <option value="">Select...</option>
              {applicants.map(app => (
                <option key={app.id} value={app.id}>{app.first_name} {app.last_name} ({app.status})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1.5">Onboarding Officer</label>
            <select className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#2E6F40] focus:ring-1 focus:ring-[#2E6F40] transition-all bg-white" value={officerId} onChange={e => setOfficerId(e.target.value)}>
              <option value="">Select...</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1.5">Start Date</label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1.5">End Date</label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" className="rounded-xl px-6" onClick={onClose}>Cancel</Button>
          <Button className="rounded-xl px-6 bg-[#2E6F40] hover:bg-[#235330] text-white shadow-md" onClick={save}>
            Set up Onboarding
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Applicants() {
  const [activeTab, setActiveTab] = useState("applicants");
  const [showSetupOnboarding, setShowSetupOnboarding] = useState(false);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editApplicant, setEditApplicant] = useState(null);
  const [viewApplicant, setViewApplicant] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("");
  const [interviewerId, setInterviewerId] = useState("");
  const [interviewFormat, setInterviewFormat] = useState("video");
  const [interviewRemarks, setInterviewRemarks] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);
  const [employees, setEmployees] = useState([]);

  // --- ONBOARDING STATES ---
  const [onboardings, setOnboardings] = useState([
    {
      id: 1,
      employee_no: "EMP-2026-01",
      onboardee: "Alex Mercer",
      start_date: "2026-05-01",
      end_date: "2026-05-15",
      officer: "Sarah Connor",
      steps: [
        { id: 1, name: "Employee profile", status: "completed" },
        { id: 2, name: "Job contract", status: "completed" },
        { id: 3, name: "Discuss company policy", status: "pending" },
        { id: 4, name: "Set Employee schedule", status: "pending" },
        { id: 5, name: "Setup statutory forms", status: "pending" },
        { id: 6, name: "Setup benefits and deductions", status: "pending" }
      ]
    },
    {
      id: 2,
      employee_no: "EMP-2026-02",
      onboardee: "Jordan Lee",
      start_date: "2026-05-02",
      end_date: "2026-05-16",
      officer: "Sarah Connor",
      steps: [
        { id: 1, name: "Employee profile", status: "completed" },
        { id: 2, name: "Job contract", status: "pending" },
        { id: 3, name: "Discuss company policy", status: "pending" },
        { id: 4, name: "Set Employee schedule", status: "pending" },
        { id: 5, name: "Setup statutory forms", status: "pending" },
        { id: 6, name: "Setup benefits and deductions", status: "pending" }
      ]
    }
  ]);
  const [viewOnboarding, setViewOnboarding] = useState(null);
  const [performOnboarding, setPerformOnboarding] = useState(null);
  const [reassignOnboarding, setReassignOnboarding] = useState(null);
  const [cancelOnboarding, setCancelOnboarding] = useState(null);

  // --- NEW STATES FOR FILTERING AND SEARCHING ---
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState([]);

  // --- ONBOARDING FILTERING & SORTING STATES ---
  const [onboardingSearchTerm, setOnboardingSearchTerm] = useState("");
  const [onboardingStatusFilter, setOnboardingStatusFilter] = useState("all");
  const [onboardingSortConfig, setOnboardingSortConfig] = useState({ key: 'start_date', direction: 'desc' });

  const handleOnboardingSort = (key) => {
    let direction = 'asc';
    if (onboardingSortConfig.key === key && onboardingSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setOnboardingSortConfig({ key, direction });
  };

  const handleUpdateStep = (onboardingId, stepId, newStatus) => {
    setOnboardings(prev => prev.map(o => {
      if (o.id === onboardingId) {
        return {
          ...o,
          steps: o.steps.map(s => s.id === stepId ? { ...s, status: newStatus } : s)
        };
      }
      return o;
    }));
  };

  const handleAddStep = (onboardingId, stepName) => {
    setOnboardings(prev => prev.map(o => {
      if (o.id === onboardingId) {
        return {
          ...o,
          steps: [...o.steps, { id: Date.now(), name: stepName, status: 'pending' }]
        };
      }
      return o;
    }));
  };

  const handleReassign = (onboardingId, newOfficerName) => {
    setOnboardings(prev => prev.map(o => o.id === onboardingId ? { ...o, officer: newOfficerName } : o));
    setReassignOnboarding(null);
  };

  const handleCancelOnboarding = (onboardingId) => {
    setOnboardings(prev => prev.filter(o => o.id !== onboardingId));
    setCancelOnboarding(null);
  };

  const load = async () => {
    try {
      setLoading(true);
      const [appsRes, empsRes] = await Promise.all([
        supabase
          .from("applicants")
          .select("*, job_postings(*)")
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("employees")
          .select("id, first_name, last_name")
          .eq("status", "regular"),
      ]);

      if (appsRes.error) throw appsRes.error;
      setApplicants(appsRes.data || []);
      if (!empsRes.error) setEmployees(empsRes.data || []);
    } catch (error) {
      console.error("Failed to load applicants:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // --- FILTERING LOGIC ---
  const filteredApplicants = applicants.filter((a) => {
    const matchesSearch =
      searchTerm === "" ||
      `${a.first_name} ${a.last_name} ${a.email} ${a.phone} ${a.job_postings?.post_title} ${a.job_postings?.title} ${a.source} ${a.status}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const displayedStages = activeFilters.length === 0 ? stages : activeFilters;
  const byStage = (stage) => filteredApplicants.filter((a) => a.status === stage);

  // --- ONBOARDING FILTERING LOGIC ---
  const filteredAndSortedOnboardings = [...onboardings]
    .filter((o) => {
      const matchesSearch =
        onboardingSearchTerm === "" ||
        `${o.employee_no} ${o.onboardee} ${o.officer}`
          .toLowerCase()
          .includes(onboardingSearchTerm.toLowerCase());

      const isCompleted = o.steps.every(s => s.status === 'completed');
      const matchesStatus = 
        onboardingStatusFilter === "all" ||
        (onboardingStatusFilter === "completed" && isCompleted) ||
        (onboardingStatusFilter === "pending" && !isCompleted);

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aVal = a[onboardingSortConfig.key];
      let bVal = b[onboardingSortConfig.key];
      
      // Handle string comparisons gracefully
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return onboardingSortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return onboardingSortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

  const SortIcon = ({ column }) => {
    if (onboardingSortConfig.key !== column) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-50" />;
    return onboardingSortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />;
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <Tabs defaultValue="applicants" className="w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Applicant Tracking
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {applicants.length} total applicants in pipeline
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <TabsList className="grid w-full sm:w-auto grid-cols-2 bg-slate-100 p-1 rounded-xl">
              <TabsTrigger value="applicants" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#2E6F40] data-[state=active]:shadow-sm">Applicants</TabsTrigger>
              <TabsTrigger value="onboarding" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#2E6F40] data-[state=active]:shadow-sm">Onboarding</TabsTrigger>
            </TabsList>
            <Button
              onClick={() => {
                setEditApplicant(null);
                setShowModal(true);
              }}
              className="gap-2 px-5 py-2.5 rounded-xl shadow-md bg-[#2E6F40] hover:bg-[#235330] text-white font-semibold transition-all hover:scale-[1.02] w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" /> Add Applicant
            </Button>
          </div>
        </div>

        <TabsContent value="applicants" className="space-y-6 mt-0 border-0 p-0 outline-none">
          {/* --- SEARCH AND FILTER CONTROLS --- */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative w-full lg:w-96 shrink-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinelinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <Input
            type="text"
            placeholder="Search name, email, role..."
            className="pl-10 w-full rounded-xl border-slate-200 focus-visible:ring-[#2E6F40] shadow-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full lg:w-auto justify-start lg:justify-end">
          <button
            onClick={() => setActiveFilters([])}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeFilters.length === 0
                ? "bg-slate-800 text-white shadow-md scale-105"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Stages
          </button>
          {stages.map((stage) => (
            <button
              key={stage}
              onClick={() => {
                if (activeFilters.includes(stage)) {
                  setActiveFilters(activeFilters.filter((s) => s !== stage));
                } else {
                  const newFilters = [...activeFilters, stage];
                  if (newFilters.length >= 5) {
                    setActiveFilters([]);
                  } else {
                    setActiveFilters(newFilters);
                  }
                }
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                activeFilters.includes(stage)
                  ? "bg-[#2E6F40] text-white shadow-md scale-105"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {stage.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className={`grid grid-cols-1 ${
          activeFilters.length === 0 ? "lg:grid-cols-5" : 
          activeFilters.length === 1 ? "lg:grid-cols-1" :
          activeFilters.length === 2 ? "lg:grid-cols-2" :
          activeFilters.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4"
        } gap-4 pb-4 pt-2`}>
          {(activeFilters.length === 0 ? [1, 2, 3, 4, 5] : activeFilters).map((i) => (
            <div key={i} className="flex flex-col space-y-3 min-w-0">
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="w-24 h-6 bg-slate-200 animate-pulse rounded-full" />
                <div className="w-6 h-6 bg-slate-200 animate-pulse rounded-md" />
              </div>
              {[1, 2, 3].map((j) => (
                <div key={j} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm animate-pulse h-[140px] w-full" />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className={`grid grid-cols-1 ${
          activeFilters.length === 0 ? "lg:grid-cols-5" : 
          activeFilters.length === 1 ? "lg:grid-cols-1 md:grid-cols-2 xl:grid-cols-3" :
          activeFilters.length === 2 ? "lg:grid-cols-2" :
          activeFilters.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4"
        } gap-4 pb-4 pt-2 items-start`}>
          {displayedStages.map((stage) => (
            <div key={stage} className="flex flex-col min-w-0 animate-in fade-in duration-300">
              <div className="flex items-center justify-between mb-4 px-1 sticky top-0 z-10 bg-slate-50/80 backdrop-blur-md py-2 rounded-lg">
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
                {byStage(stage).map((a, index) => (
                  <div
                    key={a.id}
                    className="bg-white rounded-2xl border border-slate-200 p-3 xl:p-4 shadow-sm hover:shadow-md transition-all flex flex-col animate-in slide-in-from-bottom-4 fade-in duration-500 fill-mode-both"
                    style={{ animationDelay: `${index * 50}ms` }}
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
                              Invite to Interview
                            </button>
                          </>
                        ) : (
                          (a.status === "interviewing" || a.status === "offered") ? (
                            <button
                              onClick={() => setConfirmAction({ type: "decline", applicant: a })}
                              className="px-2 py-1.5 text-[10px] xl:text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg transition-colors ml-auto"
                            >
                              Reject
                            </button>
                          ) : (
                            a.status === "rejected" ? (
                              <select
                                className="px-2 py-1 text-[10px] xl:text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg transition-colors ml-auto outline-none cursor-pointer"
                                onChange={(e) => {
                                  const newStatus = e.target.value;
                                  if (newStatus === "interviewing") {
                                    setConfirmAction({ type: "accept", applicant: a });
                                  } else if (newStatus === "offered") {
                                    setConfirmAction({ type: "move", applicant: a, targetStatus: newStatus });
                                  }
                                  e.target.value = "";
                                }}
                                value=""
                              >
                                <option value="" disabled>Move to...</option>
                                <option value="interviewing">Interviewing</option>
                                <option value="offered">Offered</option>
                              </select>
                            ) : null
                          )
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
      </TabsContent>

      <TabsContent value="onboarding" className="space-y-6 mt-0 border-0 p-0 outline-none">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="relative w-full lg:w-96 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search onboardee, officer, emp no..."
              className="pl-10 w-full rounded-xl border-slate-200 focus-visible:ring-[#2E6F40] shadow-sm transition-all"
              value={onboardingSearchTerm}
              onChange={(e) => setOnboardingSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto">
            <Filter className="h-5 w-5 text-slate-400 hidden lg:block" />
            <select
              className="w-full lg:w-48 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#2E6F40] focus:ring-1 focus:ring-[#2E6F40] transition-all bg-white shadow-sm font-semibold text-slate-700"
              value={onboardingStatusFilter}
              onChange={(e) => setOnboardingStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Incomplete Onboarding</option>
              <option value="completed">Completed Onboarding</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleOnboardingSort('employee_no')}>
                    <div className="flex items-center">Employee No. <SortIcon column="employee_no" /></div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleOnboardingSort('onboardee')}>
                    <div className="flex items-center">Onboardee <SortIcon column="onboardee" /></div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleOnboardingSort('start_date')}>
                    <div className="flex items-center">Onboarding Start <SortIcon column="start_date" /></div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleOnboardingSort('end_date')}>
                    <div className="flex items-center">Onboarding End <SortIcon column="end_date" /></div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleOnboardingSort('officer')}>
                    <div className="flex items-center">Onboarding Officer <SortIcon column="officer" /></div>
                  </th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAndSortedOnboardings.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                      No onboarding records found.
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedOnboardings.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">{o.employee_no}</td>
                      <td className="px-6 py-4 font-semibold text-slate-800">{o.onboardee}</td>
                      <td className="px-6 py-4 text-slate-600">{o.start_date}</td>
                      <td className="px-6 py-4 text-slate-600">{o.end_date}</td>
                      <td className="px-6 py-4 text-slate-600">
                        <span className="inline-flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-400" />
                          {o.officer}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" className="h-8 text-xs font-semibold text-[#2E6F40] border-[#2E6F40]/20 bg-[#2E6F40]/5 hover:bg-[#2E6F40]/10" onClick={() => setViewOnboarding(o)}>
                            View
                          </Button>
                          <Button variant="outline" size="sm" className="h-8 text-xs font-semibold text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100" onClick={() => setPerformOnboarding(o)}>
                            Perform
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 px-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50" title="Reassign Officer" onClick={() => setReassignOnboarding(o)}>
                            <UserPlus className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 px-2 text-slate-400 hover:text-red-600 hover:bg-red-50" title="Cancel Onboarding" onClick={() => setCancelOnboarding(o)}>
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </TabsContent>

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
              className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-5 ${confirmAction.type === "accept" || confirmAction.type === "move" ? "bg-[#2E6F40]/10" : "bg-red-50"}`}
            >
              {confirmAction.type === "accept" || confirmAction.type === "move" ? (
                <CheckCircle className="w-8 h-8 text-[#2E6F40]" />
              ) : (
                <XCircle className="w-8 h-8 text-red-600" />
              )}
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {confirmAction.type === "accept"
                ? "Invite to Interview?"
                : confirmAction.type === "move"
                ? "Move Applicant?"
                : "Decline Applicant?"}
            </h3>
            <p className="text-sm text-slate-500 mb-8 leading-relaxed">
              Are you sure you want to {confirmAction.type === "move" ? "move" : confirmAction.type}{" "}
              <strong className="text-slate-800">
                {confirmAction.applicant.first_name}{" "}
                {confirmAction.applicant.last_name}
              </strong>
              {confirmAction.type === "move" ? ` to the ${confirmAction.targetStatus.replace("_", " ")} stage?` : "?"}
              {confirmAction.type === "accept" && " They will be moved to the Interviewing stage and sent an email invite."}
              {confirmAction.type === "decline" && " They will be moved to the Rejected stage."}
              {confirmAction.type === "move" && confirmAction.targetStatus === "offered" && " A new or existing job offer will be set to pending."}
            </p>

            {confirmAction.type === "accept" && (
              <div className="mb-8 text-left space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100 max-h-64 overflow-y-auto">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1.5">
                    Interviewer (Employee)
                  </label>
                  <select
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#2E6F40] focus:ring-1 focus:ring-[#2E6F40] transition-all bg-white"
                    value={interviewerId}
                    onChange={(e) => setInterviewerId(e.target.value)}
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
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1.5">
                      Interview Date *
                    </label>
                    <Input
                      type="date"
                      value={interviewDate}
                      onChange={(e) => setInterviewDate(e.target.value)}
                      className="focus-visible:ring-[#2E6F40]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1.5">
                      Interview Time *
                    </label>
                    <Input
                      type="time"
                      value={interviewTime}
                      onChange={(e) => setInterviewTime(e.target.value)}
                      className="focus-visible:ring-[#2E6F40]"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1.5">
                    Format
                  </label>
                  <select
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#2E6F40] focus:ring-1 focus:ring-[#2E6F40] transition-all bg-white"
                    value={interviewFormat}
                    onChange={(e) => setInterviewFormat(e.target.value)}
                  >
                    <option value="in_person">In Person</option>
                    <option value="video">Video Call</option>
                    <option value="phone">Phone</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1.5">
                    Remarks / Notes
                  </label>
                  <textarea
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#2E6F40] focus:ring-1 focus:ring-[#2E6F40] transition-all"
                    rows={2}
                    value={interviewRemarks}
                    onChange={(e) => setInterviewRemarks(e.target.value)}
                    placeholder="e.g. Bring portfolio..."
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                className="rounded-xl px-6"
                onClick={() => {
                  setConfirmAction(null);
                  setInterviewDate("");
                  setInterviewTime("");
                  setInterviewerId("");
                  setInterviewFormat("video");
                  setInterviewRemarks("");
                }}
                disabled={sendingInvite}
              >
                Cancel
              </Button>
              <Button
                disabled={sendingInvite}
                className={`rounded-xl px-6 transition-all ${confirmAction.type === "accept" || confirmAction.type === "move" ? "bg-[#2E6F40] hover:bg-[#235330] text-white shadow-md" : "bg-red-600 hover:bg-red-700 text-white shadow-md"}`}
                onClick={async () => {
                  if (confirmAction.type === "move") {
                    setSendingInvite(true);
                    try {
                      await supabase
                        .from("applicants")
                        .update({ status: confirmAction.targetStatus })
                        .eq("id", confirmAction.applicant.id);
                      
                      if (confirmAction.targetStatus === "offered") {
                        const { data: latestOffer } = await supabase.from('job_offers').select('id').eq('applicant_id', confirmAction.applicant.id).order('created_at', { ascending: false }).limit(1);
                        if (latestOffer && latestOffer.length > 0) {
                           await supabase.from('job_offers').update({ status: 'pending' }).eq('id', latestOffer[0].id);
                        } else {
                           await supabase.from('job_offers').insert([{
                              applicant_id: confirmAction.applicant.id,
                              status: 'pending',
                              offered_salary: confirmAction.applicant.expected_salary || 0
                           }]);
                        }
                      }

                      load();
                      setConfirmAction(null);
                    } catch (e) {
                      console.error(e);
                      alert("Failed to move applicant: " + e.message);
                    } finally {
                      setSendingInvite(false);
                    }
                    return;
                  }

                  const status =
                    confirmAction.type === "accept"
                      ? "interviewing"
                      : "rejected";
                  try {
                    if (confirmAction.type === "accept") {
                      if (!interviewDate || !interviewTime) {
                        alert("Please select both an interview date and time.");
                        return;
                      }
                      if (!confirmAction.applicant.email) {
                        alert("This applicant does not have an email address.");
                        return;
                      }
                      
                      setSendingInvite(true);
                      
                      const templateParams = {
                        applicant_name: `${confirmAction.applicant.first_name} ${confirmAction.applicant.last_name}`,
                        applicant_email: confirmAction.applicant.email,
                        to_email: confirmAction.applicant.email,
                        interview_date: interviewDate,
                        interview_time: interviewTime,
                      };

                      await emailjs.send(
                        import.meta.env.VITE_EMAILJS_SERVICE_ID_NEW || "service_6gfuxme",
                        import.meta.env.VITE_EMAILJS_TEMPLATE_ID_NEW || "template_fwm5tau",
                        templateParams,
                        import.meta.env.VITE_EMAILJS_PUBLIC_KEY_NEW || "fAh7fSwX2e7yd9FNx"
                      );
                      
                      const scheduledIso = new Date(
                        `${interviewDate}T${interviewTime || "00:00"}:00`,
                      ).toISOString();

                      const { error: intError } = await supabase.from("interviews").insert([{
                        applicant_id: confirmAction.applicant.id,
                        interviewer_id: interviewerId || null,
                        scheduled_time: scheduledIso,
                        format: interviewFormat,
                        remarks: interviewRemarks,
                        status: "scheduled",
                      }]);
                      if (intError) throw intError;
                      
                      alert("Success! Interview invitation sent.");
                    }

                    await supabase
                      .from("applicants")
                      .update({ status })
                      .eq("id", confirmAction.applicant.id);

                    if (confirmAction.type === "decline") {
                      if (confirmAction.applicant.status === "interviewing") {
                         const { data: latestInt } = await supabase.from('interviews').select('id').eq('applicant_id', confirmAction.applicant.id).order('created_at', { ascending: false }).limit(1);
                         if (latestInt && latestInt.length > 0) {
                            await supabase.from('interviews').update({ status: 'failed' }).eq('id', latestInt[0].id);
                         }
                      } else if (confirmAction.applicant.status === "offered") {
                         const { data: latestOffer } = await supabase.from('job_offers').select('id').eq('applicant_id', confirmAction.applicant.id).order('created_at', { ascending: false }).limit(1);
                         if (latestOffer && latestOffer.length > 0) {
                            await supabase.from('job_offers').update({ status: 'declined' }).eq('id', latestOffer[0].id);
                         }
                      }
                    }

                    load();
                    setConfirmAction(null);
                    setInterviewDate("");
                    setInterviewTime("");
                    setInterviewerId("");
                    setInterviewFormat("video");
                    setInterviewRemarks("");
                  } catch (e) {
                    console.error("Error processing applicant:", e);
                    alert("Failed to process request: " + (e.message || e.text || "Unknown error"));
                  } finally {
                    setSendingInvite(false);
                  }
                }}
              >
                {sendingInvite 
                  ? "Sending..." 
                  : `Confirm ${confirmAction.type === "accept" ? "Invite" : "Decline"}`
                }
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* --- ONBOARDING MODALS --- */}
      {viewOnboarding && (
        <ViewOnboardingModal onboarding={viewOnboarding} onClose={() => setViewOnboarding(null)} />
      )}
      {performOnboarding && (
        <PerformOnboardingModal onboarding={performOnboarding} onClose={() => setPerformOnboarding(null)} onUpdateStep={handleUpdateStep} onAddStep={handleAddStep} />
      )}
      {reassignOnboarding && (
        <ReassignOfficerModal onboarding={reassignOnboarding} employees={employees} onClose={() => setReassignOnboarding(null)} onConfirm={handleReassign} />
      )}
      {cancelOnboarding && (
        <CancelOnboardingModal onboarding={cancelOnboarding} onClose={() => setCancelOnboarding(null)} onConfirm={handleCancelOnboarding} />
      )}
      {showSetupOnboarding && (
        <SetupOnboardingModal
          applicants={applicants}
          employees={employees}
          onClose={() => setShowSetupOnboarding(false)}
          onSave={(newOnboarding) => {
            setOnboardings(prev => [newOnboarding, ...prev]);
            setShowSetupOnboarding(false);
          }}
        />
      )}
      </Tabs>
    </div>
  );
}
