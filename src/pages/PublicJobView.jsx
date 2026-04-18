import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/api/base44Client";
import { Briefcase, DollarSign, Calendar, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function PublicJobView() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applied, setApplied] = useState(false);

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
      } catch (error) {
        console.error("Error fetching job:", error.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchJob();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-center px-4">
        <h1 className="text-4xl font-bold text-slate-800 mb-2">404</h1>
        <p className="text-slate-600 mb-6">The job posting you're looking for could not be found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
          <div className="p-8 border-b border-slate-100 bg-blue-600">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  {job.post_title || job.title}
                </h1>
                <p className="text-blue-100 text-lg">{job.department_name || "General Department"}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white text-blue-700`}>
                {job.status.replace("_", " ")}
              </span>
            </div>
          </div>
          
          <div className="bg-white p-6 flex flex-wrap gap-6 text-sm text-slate-600">
            {job.salary_range && (
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-slate-400" />
                <span className="font-medium text-slate-800">₱{job.salary_range}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-slate-400" />
              <span>{job.positions_available || 1} Position(s)</span>
            </div>
            {job.start_date && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Starts: {new Date(job.start_date).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-8">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">About the Role</h2>
            <div className="prose prose-slate max-w-none text-slate-600 whitespace-pre-wrap">
              {job.description}
            </div>
          </div>

          {job.requirements && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Requirements</h2>
              <div className="prose prose-slate max-w-none text-slate-600 whitespace-pre-wrap">
                {job.requirements}
              </div>
            </div>
          )}

          <div className="pt-8 border-t border-slate-100">
            {!applied ? (
              <Button 
                className="w-full sm:w-auto text-lg px-8 py-6" 
                size="lg" 
                disabled={job.status !== 'open'}
                onClick={() => setShowApplyModal(true)}
              >
                {job.status === 'open' ? 'Apply for this Position' : 'Currently Not Accepting Applications'}
              </Button>
            ) : (
              <div className="flex items-center justify-center sm:justify-start gap-3 text-green-700 bg-green-50 p-4 rounded-xl font-medium border border-green-200">
                <CheckCircle className="w-6 h-6" />
                Your application has been successfully submitted!
              </div>
            )}
          </div>
        </div>
      </div>

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
      setError("You must read and accept the Privacy Policy before submitting.");
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
      const { data: { publicUrl } } = supabase.storage
        .from("documents")
        .getPublicUrl(filePath);

      // 3. Format payload for DB
      const nameParts = form.fullName.trim().split(" ");
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

      const { error: dbError } = await supabase
        .from("applicants")
        .insert([{
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
          cv_url: publicUrl
        }]);

      if (dbError) throw dbError;

      onSuccess();
    } catch (err) {
      console.error("Application submission failed:", err);
      setError(err.message || "An error occurred while submitting your application.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-8">
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-lg font-semibold text-slate-800">
            Apply for {job.post_title || job.title}
          </h2>
          <button onClick={onClose} type="button">
            <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Full Name *</label>
            <Input
              required
              value={form.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              placeholder="e.g. Juan Dela Cruz"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Email Address *</label>
              <Input
                required
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="e.g. juan@example.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Phone Number *</label>
              <Input
                required
                type="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="e.g. +639123456789"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Expected Salary (₱) *</label>
              <Input
                required
                type="number"
                min="0"
                value={form.expectedSalary}
                onChange={(e) => set("expectedSalary", e.target.value)}
                placeholder="e.g. 25000"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Available Date For Interview *</label>
              <Input
                required
                type="date"
                value={form.availableDate}
                onChange={(e) => set("availableDate", e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Message *</label>
            <textarea
              required
              rows={4}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
              value={form.message}
              onChange={(e) => set("message", e.target.value)}
              placeholder="Tell us why you are a great fit..."
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Upload CV *</label>
            <input
              required
              type="file"
              accept=".pdf,.jpeg,.jpg,.png"
              onChange={(e) => setFile(e.target.files[0])}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
            <p className="text-xs text-slate-500 mt-2">Accepted format: PDF, JPEG, JPG, PNG - Max size: 3 MB</p>
          </div>

          <label className="flex items-start gap-3 mt-4 cursor-pointer">
            <input
              required
              type="checkbox"
              className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 disabled:opacity-50"
              checked={form.consent}
              disabled={!hasReadPolicy}
              onChange={(e) => set("consent", e.target.checked)}
            />
            <span className="text-sm text-slate-600 leading-snug">
              By checking this box, I confirm I've read and understood the{" "}
              <button
                type="button"
                onClick={() => setShowPolicy(true)}
                className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
              >
                Privacy Policy
              </button>.
            </span>
          </label>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
            <Button variant="outline" type="button" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </form>
      </div>

      {/* Privacy Policy Sub-Modal */}
      {showPolicy && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[80vh]">
            <div className="p-5 border-b flex justify-between items-center sticky top-0 bg-white rounded-t-2xl">
              <h3 className="font-bold text-lg">Privacy Policy</h3>
              <button type="button" onClick={() => setShowPolicy(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600 transition-colors" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto text-sm text-slate-600 space-y-4">
              <p><strong>1. Data Collection:</strong> We collect your personal information (name, email, phone number, CV) solely for the purpose of evaluating your application for employment.</p>
              <p><strong>2. Data Usage:</strong> Your data will be shared internally with our HR and management teams to assess your qualifications.</p>
              <p><strong>3. Data Retention:</strong> We will retain your application data for up to 1 year. If you wish to have your data removed sooner, please contact our support team.</p>
              <p><strong>4. Consent:</strong> By submitting this application, you explicitly consent to our collection, processing, and storage of your data as outlined above.</p>
            </div>
            <div className="p-5 border-t bg-slate-50 rounded-b-2xl flex justify-end">
              <Button type="button" onClick={() => {
                setHasReadPolicy(true);
                set("consent", true);
                setShowPolicy(false);
              }}>
                I Agree & Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}