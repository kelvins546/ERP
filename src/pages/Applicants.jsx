import { useState, useEffect } from "react";
import { supabase } from "@/api/base44Client"; // <-- Clean Supabase import
import { Plus, X, ChevronRight, Mail, Phone, CheckCircle, XCircle, User, Eye, Edit, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// These statuses MUST match the 'applicant_status' ENUM in your SQL database
const stages = ["applied", "interviewing", "offered", "rejected", "hired"];

const stageColors = {
  applied: "bg-slate-100 text-slate-700",
  interviewing: "bg-blue-100 text-blue-700",
  offered: "bg-purple-100 text-purple-700",
  hired: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

// --- VIEW APPLICANT MODAL ---
function ApplicantViewModal({ applicant, onClose }) {
  if (!applicant) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-slate-900">
            View Applicant: {applicant.first_name} {applicant.last_name}
          </h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
          </button>
        </div>
        <div className="p-5 space-y-3 text-sm text-slate-700">
          <p><span className="font-semibold text-slate-500 w-32 inline-block">Full Name:</span> {applicant.first_name} {applicant.last_name}</p>
          <p><span className="font-semibold text-slate-500 w-32 inline-block">Email:</span> {applicant.email || "—"}</p>
          <p><span className="font-semibold text-slate-500 w-32 inline-block">Phone:</span> {applicant.phone || "—"}</p>
          <p><span className="font-semibold text-slate-500 w-32 inline-block">Status:</span> <span className="capitalize">{applicant.status.replace("_", " ")}</span></p>
          <p><span className="font-semibold text-slate-500 w-32 inline-block">Applied For:</span> {applicant.job_postings?.post_title || applicant.job_postings?.title || 'N/A'}</p>
          <p><span className="font-semibold text-slate-500 w-32 inline-block">Source:</span> {applicant.source || "—"}</p>
          <p><span className="font-semibold text-slate-500 w-32 inline-block">Expected Salary:</span> {applicant.expected_salary ? `₱${Number(applicant.expected_salary).toLocaleString()}` : "—"}</p>
          <p><span className="font-semibold text-slate-500 w-32 inline-block">Available Date:</span> {applicant.available_date ? new Date(applicant.available_date).toLocaleDateString() : "—"}</p>
          {applicant.cv_url && (
            <div className="flex items-center gap-2 mt-2">
              <span className="font-semibold text-slate-500 w-32 inline-block">CV/Resume:</span> 
              <a href={applicant.cv_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md font-medium transition-colors">
                <Eye className="w-4 h-4" /> View Document
              </a>
            </div>
          )}
          <div className="mt-4">
            <span className="font-semibold text-slate-500 block mb-1">Message:</span>
            <p className="bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-wrap">{applicant.message || "—"}</p>
          </div>
        </div>
        <div className="flex justify-end p-5 border-t sticky bottom-0 bg-white z-10">
          <Button variant="outline" onClick={onClose}>Close</Button>
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
      const { error } = await supabase.from("applicants").update(payload).eq("id", applicant.id);
      if (error) throw error;
      onSaved();
    } catch (error) {
      console.error("Error updating status:", error.message);
      alert("Failed to update status: " + error.message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto border border-slate-100 no-scrollbar" style={{overflowX: 'hidden'}}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-xl font-bold tracking-tight text-slate-800">
            {applicant ? "Edit Applicant" : "Add Applicant"}
          </h2>
          <button onClick={onClose} className="hover:bg-slate-100 rounded-full p-1 transition">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-2 block">
                First Name *
              </label>
              <Input
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
              <label className="text-xs font-semibold text-slate-600 mb-2 block">
                Last Name *
              </label>
              <Input
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
              <label className="text-xs font-semibold text-slate-600 mb-2 block">
                Email Address
              </label>
              <Input
                type="email"
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
              <label className="text-xs font-semibold text-slate-600 mb-2 block">
                Phone Number
              </label>
              <div className="flex gap-2">
                <select
                  className="border border-slate-200 bg-slate-50 text-slate-700 rounded-md px-3 py-2 text-sm w-24 shrink-0 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
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
                  className="flex-1"
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
              <label className="text-xs font-semibold text-slate-600 mb-2 block">
                Job Posting ID
              </label>
              <Input
                value={form.job_posting_id || ""}
                onChange={(e) => set("job_posting_id", e.target.value)}
                placeholder="UUID (Optional)"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-2 block">
                Status
              </label>
              <select
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
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
              <label className="text-xs font-semibold text-slate-600 mb-2 block">
                Expected Salary
              </label>
              <Input
                type="number"
                min="0"
                value={form.expected_salary || ""}
                onChange={e => set("expected_salary", e.target.value)}
                placeholder="e.g. 35000"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-2 block">
                Available Date
              </label>
              <Input
                type="date"
                value={form.available_date || ""}
                onChange={e => set("available_date", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-2 block">
                Message
              </label>
              <textarea
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all min-h-[70px]"
                rows={3}
                value={form.message || ""}
                onChange={e => set("message", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-2 block">
                Source
              </label>
              <Input
                value={form.source || ""}
                onChange={(e) => set("source", e.target.value)}
                placeholder="LinkedIn, Referral, Walk-in..."
              />
            </div>
            <div className="flex items-end gap-2 pt-2">
              <label className="text-xs font-semibold text-slate-600 mb-2 block flex-1">
                CV
              </label>
              {form.cv_url && (
                <a
                  href={form.cv_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 p-2 transition border border-blue-100"
                  title="View CV"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </a>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-2 block">
                Notes
              </label>
              <textarea
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all min-h-[70px]"
                rows={3}
                value={form.notes || ""}
                onChange={(e) => set("notes", e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-3xl">
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
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                  onClick={() => handleQuickAction("interviewing")}
                  disabled={saving}
                >
                  <CheckCircle className="w-4 h-4 mr-2" /> Accept for Interview
                </Button>
              </>
            )}
          </div>
          <div className="flex gap-3 w-full sm:w-auto justify-end">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving || !form.first_name || !form.last_name}>
              {saving ? "Saving..." : "Save Changes"}
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
      alert("Failed to update status.");
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
            {applicants.length} total applicants
          </p>
        </div>
        <Button
          onClick={() => {
            setEditApplicant(null);
            setShowModal(true);
          }}
          className="gap-2 px-4 py-2 rounded-lg shadow-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold"
        >
          <Plus className="w-4 h-4" /> Add Applicant
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex gap-5 overflow-x-auto pb-4">
          {stages.map((stage) => (
            <div key={stage} className="flex-shrink-0 w-72">
              <div className="flex items-center justify-between mb-3">
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full capitalize tracking-wide ${stageColors[stage] || "bg-slate-100"}`}
                >
                  {stage}
                </span>
                <span className="text-xs text-slate-400 font-semibold">
                  {byStage(stage).length}
                </span>
              </div>
              <div className="space-y-3">
                {byStage(stage).map((a) => (
                  <div
                  key={a.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${stageColors[a.status] || "bg-slate-100 text-slate-600"}`}
                      >
                        {a.status.replace("_", " ")}
                      </span>
                    </div>

                    <div className="flex-grow">
                      <h3 className="font-semibold text-slate-900 text-base">
                          {a.first_name} {a.last_name}
                      </h3>
                      <p className="text-sm text-slate-500 mt-1 truncate" title={a.job_postings?.post_title || a.job_postings?.title || 'N/A'}>
                          For: {a.job_postings?.post_title || a.job_postings?.title || 'N/A'}
                      </p>
                      
                      <p className="text-xs text-slate-500 mt-2 line-clamp-2 h-8">
                          {a.message || 'No message provided.'}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-2 mt-4 pt-3 border-t border-slate-100">
                        <button
                            onClick={() => setViewApplicant(a)}
                            className="text-xs text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1 transition-colors"
                        >
                            <Eye className="w-3.5 h-3.5" /> View
                        </button>
                        {a.status !== "applied" && (
                            <button
                                onClick={() => {
                                    setEditApplicant(a);
                                    setShowModal(true);
                                }}
                                className="text-xs text-blue-500 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors"
                            >
                                <Edit className="w-3.5 h-3.5" /> Edit
                            </button>
                        )}
                        
                        <div className="ml-auto flex gap-1">
                            {a.status === "applied" ? (
                                <>
                                    <button onClick={() => setConfirmAction({ type: 'decline', applicant: a })} className="px-3 py-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 rounded-md transition-colors">
                                        Decline
                                    </button>
                                    <button onClick={() => setConfirmAction({ type: 'accept', applicant: a })} className="px-3 py-1 text-xs font-semibold text-green-600 bg-green-50 hover:bg-green-100 border border-green-100 rounded-md transition-colors">
                                        Accept
                                    </button>
                                </>
                            ) : (
                                <>
                                    {stages.indexOf(a.status) > 0 && (
                                        <button onClick={() => moveStage(a, -1)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors" title="Move Back" >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                    )}
                                    {stages.indexOf(a.status) < stages.length - 1 && (
                                        <button onClick={() => moveStage(a, 1)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors" title="Move Next" >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                  </div>
                ))}
                {byStage(stage).length === 0 && (
                  <div className="text-center py-8 text-slate-300 text-xs border-2 border-dashed border-slate-200 rounded-2xl">
                    Empty
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-slate-50">
              {confirmAction.type === 'accept' ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600" />
              )}
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {confirmAction.type === 'accept' ? 'Accept Applicant?' : 'Decline Applicant?'}
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to {confirmAction.type} <strong className="text-slate-700">{confirmAction.applicant.first_name} {confirmAction.applicant.last_name}</strong>?
              {confirmAction.type === 'accept' && " They will be moved to the Interviewing stage."}
              {confirmAction.type === 'decline' && " They will be moved to the Rejected stage."}
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setConfirmAction(null)}>Cancel</Button>
              <Button 
                className={confirmAction.type === 'accept' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}
                onClick={async () => {
                  const status = confirmAction.type === 'accept' ? 'interviewing' : 'rejected';
                  try {
                    await supabase.from("applicants").update({ status }).eq("id", confirmAction.applicant.id);
                    load();
                    setConfirmAction(null);
                  } catch (e) { alert("Failed to update status"); }
                }}
              >
                Confirm {confirmAction.type === 'accept' ? 'Accept' : 'Decline'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
