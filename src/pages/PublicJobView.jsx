import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/api/base44Client";
import {
  Briefcase,
  DollarSign,
  Calendar,
  X,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import arkLogo from "@/assets/imgs/ark-logo.png";

export default function PublicJobView() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const { data, error } = await supabase
          .from("job_postings")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        setJob(data);
      } catch (err) {
        console.error("Error fetching job:", err.message);
        setError("The job posting you're looking for could not be found.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchJob();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-[#2E6F40] animate-spin" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full border border-slate-200">
          <img
            src={arkLogo}
            alt="Ark Industries"
            className="h-12 mx-auto mb-4"
          />
          <h1 className="text-xl font-bold text-slate-900 mb-2">
            Job Not Found
          </h1>
          <p className="text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        {" "}
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={arkLogo}
              alt="Ark Industries"
              className="h-8 object-contain"
            />
            <span className="font-bold text-lg text-slate-900 tracking-tight">
              Ark Industries
            </span>
          </div>
          <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">
            Careers
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Job Header Hero - BRAND GREEN */}
        <div className="bg-[#2E6F40] rounded-3xl p-8 md:p-10 text-white shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            <span className="inline-block px-3 py-1 bg-white text-[#2E6F40] text-xs font-bold uppercase tracking-wider rounded-full mb-4 shadow-sm">
              {job.status.replace("_", " ")}
            </span>

            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
              {job.post_title || job.title}
            </h1>
            <p className="text-emerald-50 text-lg mb-8 font-medium">
              {job.department_name || "General Department"}
            </p>

            <div className="flex-wrap items-center gap-6 text-sm font-medium bg-black/10 inline-flex p-3 rounded-2xl backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-emerald-100" />
                <span>{job.positions_available || 1} Vacancy</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-100" />
                <span>
                  Starts:{" "}
                  {job.start_date
                    ? new Date(job.start_date).toLocaleDateString()
                    : "ASAP"}
                </span>
              </div>
              {job.salary_range && (
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-100" />
                  <span>₱{job.salary_range}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 md:p-10 space-y-8">
          <div>
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">
              About the Role
            </h2>
            <div className="prose prose-slate max-w-none text-slate-700 whitespace-pre-wrap leading-relaxed">
              {job.description}
            </div>
          </div>

          {job.requirements && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">
                Requirements
              </h2>
              <div className="prose prose-slate max-w-none text-slate-700 whitespace-pre-wrap leading-relaxed">
                {job.requirements}
              </div>
            </div>
          )}

          <div className="pt-8 border-t border-slate-100 text-center">
            {!applied ? (
              <Button
                className="w-full sm:w-auto text-lg px-10 py-6 bg-[#2E6F40] hover:bg-[#235330] text-white shadow-lg transition-transform hover:scale-105 rounded-xl font-bold"
                size="lg"
                disabled={job.status !== "open"}
                onClick={() => setShowApplyModal(true)}
              >
                {job.status === "open"
                  ? "Apply for this Position"
                  : "Currently Not Accepting Applications"}
              </Button>
            ) : (
              <div className="flex items-center justify-center gap-3 text-[#2E6F40] bg-[#2E6F40]/10 p-5 rounded-xl font-medium border border-[#2E6F40]/20">
                <CheckCircle className="w-6 h-6" />
                Your application has been successfully submitted!
              </div>
            )}
          </div>
        </div>
      </main>

      {showApplyModal && (
        <ApplyModal
          job={job}
          onClose={() => setShowApplyModal(false)}
          onSuccess={() => {
            setShowApplyModal(false);
            setApplied(true);
          }}
        />
      )}
    </div>
  );
}

// --- THE APPLY MODAL COMPONENT ---
function ApplyModal({ job, onClose, onSuccess }) {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    expectedSalary: "",
    availableDate: "",
    message: "",
    consent: false,
  });
  const [showPolicy, setShowPolicy] = useState(false);
  const [hasReadPolicy, setHasReadPolicy] = useState(false);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!file) {
      setError("Please upload your CV.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setError("File size must be less than 3 MB.");
      return;
    }
    if (!form.consent || !hasReadPolicy) {
      setError(
        "You must read and accept the Privacy Policy before submitting.",
      );
      return;
    }

    setSaving(true);

    try {
      // 1. Upload CV to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `applicants-cvs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("documents").getPublicUrl(filePath);

      // 3. Format payload for DB
      const nameParts = form.fullName.trim().split(" ");
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

      const { error: dbError } = await supabase.from("applicants").insert([
        {
          first_name: firstName || "Unknown",
          last_name: lastName || "",
          email: form.email,
          phone: form.phone,
          job_posting_id: job.id,
          status: "applied",
          source: "Website",
          expected_salary: form.expectedSalary,
          available_date: form.availableDate,
          message: form.message,
          cv_url: publicUrl,
        },
      ]);

      if (dbError) throw dbError;

      onSuccess();
    } catch (err) {
      console.error("Application submission failed:", err);
      setError(
        err.message || "An error occurred while submitting your application.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg my-8 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Apply for Role</h2>
            <p className="text-sm text-slate-500">
              {job.post_title || job.title}
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl text-sm font-medium flex items-start gap-2">
              <X className="w-4 h-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-1.5">
              Full Name *
            </label>
            <Input
              required
              className="focus-visible:ring-[#2E6F40]"
              value={form.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              placeholder="e.g. Juan Dela Cruz"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-1.5">
                Email Address *
              </label>
              <Input
                required
                type="email"
                className="focus-visible:ring-[#2E6F40]"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="e.g. juan@example.com"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-1.5">
                Phone Number *
              </label>
              <Input
                required
                type="tel"
                className="focus-visible:ring-[#2E6F40]"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="e.g. +639123456789"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-1.5">
                Expected Salary (₱) *
              </label>
              <Input
                required
                type="number"
                min="0"
                className="focus-visible:ring-[#2E6F40]"
                value={form.expectedSalary}
                onChange={(e) => set("expectedSalary", e.target.value)}
                placeholder="e.g. 25000"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-1.5">
                Available Date *
              </label>
              <Input
                required
                type="date"
                className="focus-visible:ring-[#2E6F40]"
                value={form.availableDate}
                onChange={(e) => set("availableDate", e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-1.5">
              Cover Letter / Message *
            </label>
            <textarea
              required
              rows={4}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-[#2E6F40] outline-none transition-shadow"
              value={form.message}
              onChange={(e) => set("message", e.target.value)}
              placeholder="Tell us why you are a great fit..."
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-1.5">
              Upload CV *
            </label>
            <input
              required
              type="file"
              accept=".pdf,.jpeg,.jpg,.png"
              onChange={(e) => setFile(e.target.files[0])}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#2E6F40]/10 file:text-[#2E6F40] hover:file:bg-[#2E6F40]/20 cursor-pointer transition-colors"
            />
            <p className="text-xs text-slate-400 mt-2 font-medium">
              Accepted format: PDF, JPEG, JPG, PNG (Max size: 3 MB)
            </p>
          </div>

          <label className="flex items-start gap-3 mt-4 cursor-pointer bg-slate-50 p-4 rounded-xl border border-slate-100">
            <input
              required
              type="checkbox"
              className="mt-0.5 w-4 h-4 text-[#2E6F40] rounded border-slate-300 focus:ring-[#2E6F40] disabled:opacity-50"
              checked={form.consent}
              disabled={!hasReadPolicy}
              onChange={(e) => set("consent", e.target.checked)}
            />
            <span className="text-sm text-slate-600 leading-snug">
              By checking this box, I confirm I've read and understood the{" "}
              <button
                type="button"
                onClick={() => setShowPolicy(true)}
                className="text-[#2E6F40] hover:text-[#235330] hover:underline font-bold"
              >
                Privacy Policy
              </button>
              .
            </span>
          </label>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
            <Button
              variant="outline"
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-[#2E6F40] hover:bg-[#235330] text-white rounded-xl px-6 shadow-md"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                  Submitting...
                </>
              ) : (
                "Submit Application"
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Privacy Policy Sub-Modal */}
      {showPolicy && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md flex flex-col max-h-[80vh] overflow-hidden border border-slate-100">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="font-bold text-xl text-slate-900">
                Privacy Policy
              </h3>
              <button
                type="button"
                onClick={() => setShowPolicy(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto text-sm text-slate-600 space-y-4 leading-relaxed bg-slate-50/50">
              <p>
                <strong className="text-slate-800">1. Data Collection:</strong>{" "}
                We collect your personal information (name, email, phone number,
                CV) solely for the purpose of evaluating your application for
                employment at Ark Industries.
              </p>
              <p>
                <strong className="text-slate-800">2. Data Usage:</strong> Your
                data will be shared internally with our HR and management teams
                to assess your qualifications.
              </p>
              <p>
                <strong className="text-slate-800">3. Data Retention:</strong>{" "}
                We will retain your application data for up to 1 year. If you
                wish to have your data removed sooner, please contact our
                support team.
              </p>
              <p>
                <strong className="text-slate-800">4. Consent:</strong> By
                submitting this application, you explicitly consent to our
                collection, processing, and storage of your data as outlined
                above.
              </p>
            </div>
            <div className="p-6 border-t border-slate-100 bg-white flex justify-end">
              <Button
                type="button"
                className="bg-[#2E6F40] hover:bg-[#235330] text-white rounded-xl shadow-md px-6"
                onClick={() => {
                  setHasReadPolicy(true);
                  set("consent", true);
                  setShowPolicy(false);
                }}
              >
                I Agree & Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
