import { useState, useEffect } from "react";
import { supabase } from "@/api/base44Client"; // <-- Clean Supabase import
import { 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Briefcase, 
  Eye, 
  ExternalLink, 
  Share2, 
  Copy, 
  Facebook, 
  Linkedin, 
  Twitter, 
  Globe 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const statusColors = {
  open: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-600",
  on_hold: "bg-yellow-100 text-yellow-700",
};

// --- THE MODAL (CREATE & UPDATE) ---
function PostingModal({ posting, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: "",
    post_title: "",
    start_date: "",
    end_date: "",
    description: "",
    requirements: "",
    status: "open",
    // These fields below are in the UI, but not in your original SQL schema.
    // I am including them in the state so the UI doesn't break.
    salary_range: "",
    department_name: "",
    positions_available: 1,
    ...posting,
  });

  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      // Build payload matching SQL schema EXACTLY
      if (form.start_date && form.end_date && new Date(form.start_date) > new Date(form.end_date)) {
        alert("End Date cannot be earlier than the Start Date.");
        setSaving(false);
        return;
      }

      const payload = {
        title: form.title,
        post_title: form.post_title,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        description: form.description,
        requirements: form.requirements,
        status: form.status,
        // If you want to save these extra fields, you must run an ALTER TABLE command in Supabase:
        // ALTER TABLE job_postings ADD COLUMN salary_range text;
        // ALTER TABLE job_postings ADD COLUMN department_name text;
        // ALTER TABLE job_postings ADD COLUMN positions_available integer;
      };

      if (posting?.id) {
        // UPDATE
        const { error } = await supabase
          .from("job_postings")
          .update(payload)
          .eq("id", posting.id);
        if (error) throw error;
      } else {
        // CREATE
        const { error } = await supabase.from("job_postings").insert([payload]);
        if (error) throw error;
      }
      onSaved();
    } catch (error) {
      console.error("Error saving job posting:", error.message);
      alert("Failed to save: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold">
            {posting ? "Edit Job Posting" : "New Job Posting"}
          </h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600">
                Job Title *
              </label>
              <Input
                className="mt-1"
                value={form.title}
                onChange={(e) => {
                  if (/^[a-zA-Z\s]*$/.test(e.target.value)) {
                    set("title", e.target.value);
                  }
                }}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">
                Post Title
              </label>
              <Input
                className="mt-1"
                value={form.post_title || ""}
                onChange={(e) => {
                  if (/^[a-zA-Z0-9\s.,-]*$/.test(e.target.value)) {
                    set("post_title", e.target.value);
                  }
                }}
                placeholder="e.g. Senior Software Engineer"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600">
                Start Date
              </label>
              <Input
                className="mt-1"
                type="date"
                value={form.start_date || ""}
                onChange={(e) => set("start_date", e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">
                End Date
              </label>
              <Input
                className="mt-1"
                type="date"
                value={form.end_date || ""}
                onChange={(e) => set("end_date", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600">
                Department (Requires DB Column)
              </label>
              <Input
                className="mt-1"
                value={form.department_name || ""}
                onChange={(e) => {
                  if (/^[a-zA-Z\s]*$/.test(e.target.value)) {
                    set("department_name", e.target.value);
                  }
                }}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">
                Positions (Requires DB Column)
              </label>
              <Input
                className="mt-1"
                type="number"
                value={form.positions_available || ""}
                onChange={(e) =>
                  set("positions_available", Number(e.target.value))
                }
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">
              Salary Range (Requires DB Column)
            </label>
            <Input
              className="mt-1"
              value={form.salary_range || ""}
              onChange={(e) => {
                if (/^[0-9]*$/.test(e.target.value)) {
                  set("salary_range", e.target.value);
                }
              }}
              placeholder="e.g. 25000"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">
              Description *
            </label>
            <textarea
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              rows={4}
              value={form.description || ""}
              onChange={(e) => {
                if (/^[a-zA-Z0-9\s]*$/.test(e.target.value)) {
                  set("description", e.target.value);
                }
              }}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">
              Requirements
            </label>
            <textarea
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              rows={3}
              value={form.requirements || ""}
              onChange={(e) => {
                if (/^[a-zA-Z0-9\s]*$/.test(e.target.value)) {
                  set("requirements", e.target.value);
                }
              }}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Status</label>
            <select
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
            >
              {["open", "closed", "on_hold"].map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1).replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={save}
            disabled={saving || !form.title || !form.description}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- VIEW JOB POSTING MODAL ---
function ViewModal({ posting, onClose }) {
  if (!posting) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-slate-900">View Job Posting</h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
          </button>
        </div>
        <div className="p-5 space-y-3 text-sm text-slate-700">
          <p><span className="font-semibold text-slate-500 w-32 inline-block">Job Title:</span> {posting.title}</p>
          <p><span className="font-semibold text-slate-500 w-32 inline-block">Post Title:</span> {posting.post_title || "—"}</p>
          <p><span className="font-semibold text-slate-500 w-32 inline-block">Department:</span> {posting.department_name || "—"}</p>
          <p><span className="font-semibold text-slate-500 w-32 inline-block">Salary Range:</span> {posting.salary_range ? `₱${posting.salary_range}` : "—"}</p>
          <p><span className="font-semibold text-slate-500 w-32 inline-block">Positions:</span> {posting.positions_available || 1}</p>
          <p><span className="font-semibold text-slate-500 w-32 inline-block">Start Date:</span> {posting.start_date || "—"}</p>
          <p><span className="font-semibold text-slate-500 w-32 inline-block">End Date:</span> {posting.end_date || "—"}</p>
          <p><span className="font-semibold text-slate-500 w-32 inline-block">Status:</span> <span className="capitalize">{posting.status.replace("_", " ")}</span></p>
          <div className="mt-4">
            <span className="font-semibold text-slate-500 block mb-1">Description:</span>
            <p className="bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-wrap">{posting.description}</p>
          </div>
          <div className="mt-4">
            <span className="font-semibold text-slate-500 block mb-1">Requirements:</span>
            <p className="bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-wrap">{posting.requirements || "—"}</p>
          </div>
        </div>
        <div className="flex justify-end p-5 border-t sticky bottom-0 bg-white z-10">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}

// --- SHARE JOB POSTING MODAL ---
function ShareModal({ posting, onClose }) {
  if (!posting) return null;
  
  const baseUrl = import.meta.env.VITE_PUBLIC_SITE_URL || window.location.origin;
  const url = `${baseUrl}/jobs/${posting.id}`;
  const encodedUrl = encodeURIComponent(url);
  const tweetText = encodeURIComponent(`We are hiring a ${posting.post_title || posting.title}!\n\nApply here: ${url}`);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(url);
    alert("Job posting URL copied to clipboard!");
  };

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(posting, null, 2));
    alert("Job posting JSON data copied! (For Website CMS Integration)");
  };

  const copyPostText = () => {
    const text = `🚀 We are hiring a ${posting.post_title || posting.title}!\n\n🏢 Department: ${posting.department_name || "General"}\n💼 Positions Available: ${posting.positions_available || 1}\n\n📝 About the role:\n${posting.description}\n\nApply here: ${url}`;
    navigator.clipboard.writeText(text);
    alert("Post text copied! You can now paste this directly into Facebook or LinkedIn.");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold">Publish & Share</h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
          </button>
        </div>
        <div className="p-5 space-y-5">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Live Job URL</label>
            <div className="flex items-center gap-2">
              <Input readOnly value={url} className="bg-slate-50 text-slate-500 font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={copyToClipboard} title="Copy Link">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div>
            <p className="text-xs font-medium text-slate-600 mb-2 block">Share Externally</p>
            <div className="flex gap-3">
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} target="_blank" rel="noopener noreferrer" className="p-3 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors" title="Share on Facebook">
                <Facebook className="w-5 h-5" />
              </a>
              <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`} target="_blank" rel="noopener noreferrer" className="p-3 bg-sky-50 text-sky-600 rounded-full hover:bg-sky-100 transition-colors" title="Share on LinkedIn">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href={`https://twitter.com/intent/tweet?text=${tweetText}`} target="_blank" rel="noopener noreferrer" className="p-3 bg-slate-50 text-slate-700 rounded-full hover:bg-slate-200 transition-colors" title="Share on X / Twitter">
                <Twitter className="w-5 h-5" />
              </a>
              <button onClick={copyJson} className="p-3 bg-emerald-50 text-emerald-600 rounded-full hover:bg-emerald-100 transition-colors" title="Copy Website JSON">
                <Globe className="w-5 h-5" />
              </button>
              <Button variant="outline" className="ml-auto text-xs h-auto py-2 border-slate-200 hover:bg-slate-50" onClick={copyPostText}>
                Copy Post Text
              </Button>
            </div>
          </div>
        </div>
        <div className="flex justify-end p-5 border-t">
          <Button onClick={onClose}>Done</Button>
        </div>
      </div>
    </div>
  );
}

// --- THE MAIN PAGE (READ & DELETE) ---
export default function JobPostings() {
  const [postings, setPostings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editPosting, setEditPosting] = useState(null);
  const [viewPosting, setViewPosting] = useState(null);
  const [sharePosting, setSharePosting] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      // Supabase Read
      const { data, error } = await supabase
        .from("job_postings")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPostings(data || []);
    } catch (error) {
      console.error("Failed to load job postings:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this job posting?")) return;
    try {
      // Supabase Delete
      const { error } = await supabase
        .from("job_postings")
        .delete()
        .eq("id", id);
      if (error) throw error;
      load();
    } catch (error) {
      console.error("Delete failed:", error.message);
      alert("Failed to delete job posting.");
    }
  };

  const filtered = statusFilter
    ? postings.filter((p) => p.status === statusFilter)
    : postings;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Job Postings</h1>
        <Button
          onClick={() => {
            setEditPosting(null);
            setShowModal(true);
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" /> New Posting
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {["", "open", "closed", "on_hold"].map((s) => (
          <button
            key={s || "all"}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === s ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
          >
            {s
              ? s.charAt(0).toUpperCase() + s.slice(1).replace("_", " ")
              : "All"}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length === 0 ? (
            <p className="col-span-3 text-center py-16 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
              No job postings found.
            </p>
          ) : (
            filtered.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${statusColors[p.status] || "bg-slate-100 text-slate-600 border border-slate-200"}`}
                  >
                    {p.status.replace("_", " ")}
                  </span>
                </div>
                <h3 className="font-semibold text-slate-900 text-lg">
                  {p.post_title || p.title}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {p.department_name || "General"} {p.post_title ? `(${p.title})` : ""}
                </p>
                {p.salary_range && (
                  <p className="text-sm text-green-600 mt-1 font-medium">
                    {p.salary_range}
                  </p>
                )}
                <p className="text-xs text-slate-400 mt-2">
                  {p.positions_available || 1} position(s) available
                </p>
                <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                  {p.description}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-3 mt-4 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setViewPosting(p)}
                    className="text-xs text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>
                  <button
                    onClick={() => {
                      setEditPosting(p);
                      setShowModal(true);
                    }}
                    className="text-xs text-blue-500 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                  <a
                    href={`/jobs/${p.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1 transition-colors ml-auto"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Open
                  </a>
                  <button
                    onClick={() => setSharePosting(p)}
                    className="text-xs text-emerald-600 hover:text-emerald-800 font-medium flex items-center gap-1 transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" /> Share
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showModal && (
        <PostingModal
          posting={editPosting}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            load();
          }}
        />
      )}

      {viewPosting && (
        <ViewModal
          posting={viewPosting}
          onClose={() => setViewPosting(null)}
        />
      )}

      {sharePosting && (
        <ShareModal
          posting={sharePosting}
          onClose={() => setSharePosting(null)}
        />
      )}
    </div>
  );
}
