import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Edit, Trash2, X, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const statusColors = { open: "bg-green-100 text-green-700", closed: "bg-gray-100 text-gray-600", on_hold: "bg-yellow-100 text-yellow-700" };

function PostingModal({ posting, onClose, onSaved }) {
  const [form, setForm] = useState({ title: "", description: "", requirements: "", salary_range: "", department_name: "", status: "open", positions_available: 1, ...posting });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const save = async () => {
    setSaving(true);
    if (posting?.id) await base44.entities.JobPosting.update(posting.id, form);
    else await base44.entities.JobPosting.create(form);
    onSaved();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold">{posting ? "Edit Job Posting" : "New Job Posting"}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div><label className="text-xs font-medium text-slate-600">Job Title *</label><Input className="mt-1" value={form.title} onChange={e => set("title", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-medium text-slate-600">Department</label><Input className="mt-1" value={form.department_name || ""} onChange={e => set("department_name", e.target.value)} /></div>
            <div><label className="text-xs font-medium text-slate-600">Positions Available</label><Input className="mt-1" type="number" value={form.positions_available || ""} onChange={e => set("positions_available", Number(e.target.value))} /></div>
          </div>
          <div><label className="text-xs font-medium text-slate-600">Salary Range</label><Input className="mt-1" value={form.salary_range || ""} onChange={e => set("salary_range", e.target.value)} placeholder="e.g. ₱25,000 – ₱35,000" /></div>
          <div><label className="text-xs font-medium text-slate-600">Description *</label><textarea className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" rows={4} value={form.description || ""} onChange={e => set("description", e.target.value)} /></div>
          <div><label className="text-xs font-medium text-slate-600">Requirements</label><textarea className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" rows={3} value={form.requirements || ""} onChange={e => set("requirements", e.target.value)} /></div>
          <div><label className="text-xs font-medium text-slate-600">Status</label>
            <select className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.status} onChange={e => set("status", e.target.value)}>
              {["open","closed","on_hold"].map(s => <option key={s} value={s}>{s.replace("_"," ")}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
        </div>
      </div>
    </div>
  );
}

export default function JobPostings() {
  const [postings, setPostings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editPosting, setEditPosting] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");

  const load = async () => { setLoading(true); const d = await base44.entities.JobPosting.list("-created_date"); setPostings(d); setLoading(false); };
  useEffect(() => { load(); }, []);
  const handleDelete = async (id) => { if (!confirm("Delete?")) return; await base44.entities.JobPosting.delete(id); load(); };
  const filtered = statusFilter ? postings.filter(p => p.status === statusFilter) : postings;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Job Postings</h1>
        <Button onClick={() => { setEditPosting(null); setShowModal(true); }} className="gap-2"><Plus className="w-4 h-4" /> New Posting</Button>
      </div>
      <div className="flex gap-2">
        {["","open","closed","on_hold"].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${statusFilter === s ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
            {s ? s.replace("_"," ") : "All"}
          </button>
        ))}
      </div>
      {loading ? <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length === 0 ? <p className="col-span-3 text-center py-16 text-slate-400">No job postings.</p> : filtered.map(p => (
            <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${statusColors[p.status]}`}>{p.status.replace("_"," ")}</span>
              </div>
              <h3 className="font-semibold text-slate-900">{p.title}</h3>
              <p className="text-sm text-slate-500 mt-1">{p.department_name || "General"}</p>
              {p.salary_range && <p className="text-sm text-green-600 mt-1 font-medium">{p.salary_range}</p>}
              <p className="text-xs text-slate-400 mt-2">{p.positions_available || 1} position(s) available</p>
              <p className="text-xs text-slate-500 mt-2 line-clamp-2">{p.description}</p>
              <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
                <button onClick={() => { setEditPosting(p); setShowModal(true); }} className="text-xs text-blue-600 hover:underline flex items-center gap-1"><Edit className="w-3.5 h-3.5" /> Edit</button>
                <button onClick={() => handleDelete(p.id)} className="text-xs text-red-500 hover:underline flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {showModal && <PostingModal posting={editPosting} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load(); }} />}
    </div>
  );
}