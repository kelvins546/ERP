import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/api/base44Client";
import { Plus, X, DollarSign, User, Briefcase, FileText, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const statusColors = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  accepted: "bg-[#2E6F40]/10 text-[#2E6F40] border-[#2E6F40]/20", // Ark Green
  declined: "bg-red-100 text-red-700 border-red-200",
  withdrawn: "bg-slate-100 text-slate-600 border-slate-200",
};

// --- THE MODAL (CREATE & UPDATE) ---
function OfferModal({ offer, applicants, onClose, onSaved }) {
  const [form, setForm] = useState({
    applicant_id: offer?.applicant_id || "",
    position_title: offer?.position_title || "",
    offered_salary: offer?.offered_salary || 0,
    payment_type: offer?.applicants?.payment_type || "monthly",
    start_date: offer?.start_date || "",
    status: offer?.status || "pending",
    notes: offer?.notes || "",
  });

  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Auto-fill position title when an applicant is selected
  const handleApplicantChange = (e) => {
    const selectedId = e.target.value;
    const selectedApplicant = applicants.find((a) => a.id === selectedId);

    setForm((prev) => ({
      ...prev,
      applicant_id: selectedId,
      // Auto-grab their job posting title if it exists
      position_title:
        selectedApplicant?.job_postings?.post_title ||
        selectedApplicant?.job_postings?.title ||
        prev.position_title,
      payment_type: selectedApplicant?.payment_type || "monthly",
    }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        applicant_id: form.applicant_id || null,
        offered_salary: form.offered_salary,
        start_date: form.start_date || null,
        status: form.status,
        position_title: form.position_title || null,
        notes: form.notes || null,
      };

      if (offer?.id) {
        const { error } = await supabase
          .from("job_offers")
          .update(payload)
          .eq("id", offer.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("job_offers").insert([payload]);
        if (error) throw error;
      }

      if (form.applicant_id && form.payment_type) {
        const { error: appError } = await supabase
          .from("applicants")
          .update({ payment_type: form.payment_type })
          .eq("id", form.applicant_id);
        if (appError) console.error("Failed to update applicant payment type:", appError);
      }

      onSaved();
    } catch (error) {
      console.error("Error saving job offer:", error.message);
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
            {offer ? "Edit Offer" : "Draft Job Offer"}
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
              onChange={handleApplicantChange}
            >
              <option value="" disabled>
                Select an applicant...
              </option>
              {/* If editing an offer where the applicant moved stages (e.g. to Hired), keep them visible */}
              {offer?.applicant_id &&
                !applicants.find((a) => a.id === offer.applicant_id) && (
                  <option value={offer.applicant_id}>
                    {offer.applicants?.first_name} {offer.applicants?.last_name}{" "}
                    (Current)
                  </option>
                )}
              {applicants.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.first_name} {a.last_name}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
              Only applicants in the "Offered" stage appear here.
            </p>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 block">
              Official Position Title
            </label>
            <Input
              className="rounded-xl focus-visible:ring-[#2E6F40]"
              value={form.position_title}
              onChange={(e) => set("position_title", e.target.value)}
              placeholder="e.g. Senior React Developer"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 block">
                Offered Salary *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                  ₱
                </span>
                <Input
                  className="pl-7 rounded-xl focus-visible:ring-[#2E6F40]"
                  type="number"
                  min="0"
                  value={form.offered_salary || ""}
                  onChange={(e) =>
                    set("offered_salary", Number(e.target.value))
                  }
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 block">
                Payment Type
              </label>
              <select
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#2E6F40] focus:ring-1 focus:ring-[#2E6F40] transition-all bg-white"
                value={form.payment_type}
                onChange={(e) => set("payment_type", e.target.value)}
              >
                <option value="weekly">Weekly</option>
                <option value="bi-weekly">Bi-weekly</option>
                <option value="semi-monthly">Semi-monthly</option>
                <option value="monthly">Monthly</option>
                <option value="anually">Annually</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 block">
                Target Start Date
              </label>
              <Input
                className="rounded-xl focus-visible:ring-[#2E6F40]"
                type="date"
                value={form.start_date || ""}
                onChange={(e) => set("start_date", e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 block">
                Offer Status
              </label>
              <select
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#2E6F40] focus:ring-1 focus:ring-[#2E6F40] transition-all bg-white"
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
              >
                {["pending", "accepted", "declined", "withdrawn"].map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 block">
              Internal Notes
            </label>
            <textarea
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#2E6F40] focus:ring-1 focus:ring-[#2E6F40] transition-all"
              rows={3}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="e.g. Negotiated up from 45k, waiting for signed contract..."
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
            disabled={saving || !form.applicant_id || !form.offered_salary}
          >
            {saving ? "Saving..." : "Save Offer"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- THE MAIN PAGE (READ) ---
export default function JobOffers() {
  const [offers, setOffers] = useState([]);
  const [applicants, setApplicants] = useState([]); // Holds applicants in 'offered' stage
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editOffer, setEditOffer] = useState(null);
  const [actionModal, setActionModal] = useState(null);
  const navigate = useNavigate();

  const load = async () => {
    try {
      setLoading(true);

      // Parallel fetching
      const [offersRes, appsRes] = await Promise.all([
        // 1. Fetch Offers + their related Applicant names
        supabase
          .from("job_offers")
          .select(
            "*, applicants!inner(first_name, last_name, payment_type, status, job_postings(title, post_title))",
          )
          .eq("applicants.status", "offered")
          .order("created_at", { ascending: false })
          .limit(200),

        // 2. Fetch Applicants specifically in the 'offered' pipeline stage
        supabase
          .from("applicants")
          .select("id, first_name, last_name, payment_type, job_postings(title, post_title)")
          .eq("status", "offered"),
      ]);

      if (offersRes.error) throw offersRes.error;
      if (appsRes.error) throw appsRes.error;

      setOffers(offersRes.data || []);
      setApplicants(appsRes.data || []);
    } catch (error) {
      console.error("Failed to load job offers:", error.message);
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
            Job Offers
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage salary proposals and official offers.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditOffer(null);
            setShowModal(true);
          }}
          className="gap-2 bg-[#2E6F40] hover:bg-[#235330] text-white rounded-xl shadow-md transition-all hover:scale-[1.02] px-5"
        >
          <Plus className="w-4 h-4" /> Draft Offer
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-[#2E6F40]/30 border-t-[#2E6F40] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {offers.length === 0 ? (
            <div className="text-center py-16 text-slate-400 font-medium bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
              No job offers drafted yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {offers.map((o) => (
                <div
                  key={o.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between gap-4 cursor-pointer hover:shadow-md hover:border-[#2E6F40]/30 transition-all"
                  onClick={() => {
                    setEditOffer(o);
                    setShowModal(true);
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-center shrink-0">
                        <FileText className="w-6 h-6 text-amber-600" />
                      </div>
                      <div>
                        {/* ACTUAL HUMAN NAME INSTEAD OF UUID */}
                        <h3 className="font-bold text-slate-900 text-lg leading-tight">
                          {o.applicants?.first_name} {o.applicants?.last_name}
                        </h3>
                        <p className="text-sm font-medium text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5" />
                          {o.position_title ||
                            o.applicants?.job_postings?.post_title ||
                            "Position TBD"}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shrink-0 border ${statusColors[o.status] || "bg-slate-100 text-slate-600 border-slate-200"}`}
                    >
                      {o.status}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between mt-2">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Proposed Start
                      </span>
                      <p className="text-sm font-semibold text-slate-700">
                        {o.start_date
                          ? new Date(o.start_date).toLocaleDateString(
                              undefined,
                              {
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                              },
                            )
                          : "TBD"}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Offered Salary
                      </span>
                      <p className="text-lg font-extrabold text-[#2E6F40] flex items-center justify-end">
                        ₱{(o.offered_salary || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {o.notes && (
                    <p className="text-xs text-slate-500 mt-1 italic border-l-2 border-slate-200 pl-3 line-clamp-2">
                      "{o.notes}"
                    </p>
                  )}

                  {(!o.status || o.status === "pending") && (
                    <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
                      <Button
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); setActionModal({ type: "hire", offer: o }); }}
                        className="flex-1 font-bold text-[#2E6F40] bg-[#2E6F40]/10 hover:bg-[#2E6F40]/20 border-transparent shadow-none"
                      >
                        Hire
                      </Button>
                      <Button
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); setActionModal({ type: "reject", offer: o }); }}
                        className="flex-1 font-bold text-red-600 bg-red-50 hover:bg-red-100 border-transparent shadow-none"
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showModal && (
        <OfferModal
          offer={editOffer}
          applicants={applicants}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            load();
          }}
        />
      )}

      {actionModal && (
        <AlertDialog open={!!actionModal} onOpenChange={(open) => { if (!open) setActionModal(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {actionModal.type === "hire" ? "Hire Applicant?" : "Reject Offer?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to {actionModal.type} <strong className="text-slate-800">{actionModal.offer.applicants?.first_name} {actionModal.offer.applicants?.last_name}</strong>?
                {actionModal.type === "hire" ? " They will be moved to the Hired stage." : " They will be moved to the Rejected stage."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={actionModal.processing}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={actionModal.processing}
                className={actionModal.type === "hire" ? "bg-[#2E6F40] hover:bg-[#235330] text-white" : "bg-red-600 hover:bg-red-700 text-white"}
                onClick={async (e) => {
                  e.preventDefault();
                  setActionModal(prev => ({...prev, processing: true}));
                  try {
                    if (actionModal.type === "hire") {
                      await supabase.from("job_offers").update({ status: "accepted" }).eq("id", actionModal.offer.id);
                      await supabase.from("applicants").update({ status: "hired" }).eq("id", actionModal.offer.applicant_id);
                      navigate("/applicants");
                    } else {
                      await supabase.from("job_offers").update({ status: "declined" }).eq("id", actionModal.offer.id);
                      await supabase.from("applicants").update({ status: "rejected" }).eq("id", actionModal.offer.applicant_id);
                      navigate("/applicants");
                    }
                  } catch (error) {
                    console.error(error);
                    alert("Action failed: " + error.message);
                    setActionModal(prev => ({...prev, processing: false}));
                  }
                }}
              >
                {actionModal.processing ? "Processing..." : `Confirm ${actionModal.type === "hire" ? "Hire" : "Reject"}`}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

    </div>
  );
}
