import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, X, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const resultColors = { pending: "bg-yellow-100 text-yellow-700", passed: "bg-green-100 text-green-700", failed: "bg-red-100 text-red-700", no_show: "bg-gray-100 text-gray-600" };

function InterviewModal({ interview, onClose, onSaved }) {
  const [form, setForm] = useState({ applicant_name: "", interviewer_name: "", interview_date: "", interview_time: "", format: "in_person", result: "pending", notes: "", ...interview });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const save = async () => {
    setSaving(true);
    if (interview?.id) await base44.entities.Interview.update(interview.id, form);
    else await base44.entities.Interview.create({ ...form, applicant_id: form.applicant_id || "manual" });
    onSaved();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold">{interview ? "Edit Interview" : "Schedule Interview"}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div><label className="text-xs font-medium text-slate-600">Applicant</label><Input className="mt-1" value={form.applicant_name || ""} onChange={e => set("applicant_name", e.target.value)} /></div>
          <div><label className="text-xs font-medium text-slate-600">Interviewer</label><Input className="mt-1" value={form.interviewer_name || ""} onChange={e => set("interviewer_name", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-medium text-slate-600">Date</label><Input className="mt-1" type="date" value={form.interview_date || ""} onChange={e => set("interview_date", e.target.value)} /></div>
            <div><label className="text-xs font-medium text-slate-600">Time</label><Input className="mt-1" type="time" value={form.interview_time || ""} onChange={e => set("interview_time", e.target.value)} /></div>
          </div>
          <div><label className="text-xs font-medium text-slate-600">Format</label>
            <select className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.format} onChange={e => set("format", e.target.value)}>
              <option value="in_person">In Person</option>
              <option value="video">Video Call</option>
              <option value="phone">Phone</option>
            </select>
          </div>
          <div><label className="text-xs font-medium text-slate-600">Result</label>
            <select className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.result} onChange={e => set("result", e.target.value)}>
              {["pending","passed","failed","no_show"].map(r => <option key={r} value={r}>{r.replace("_"," ")}</option>)}
            </select>
          </div>
          <div><label className="text-xs font-medium text-slate-600">Notes</label><textarea className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" rows={3} value={form.notes || ""} onChange={e => set("notes", e.target.value)} /></div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
        </div>
      </div>
    </div>
  );
}

export default function Interviews() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editInterview, setEditInterview] = useState(null);

  const load = async () => { setLoading(true); const d = await base44.entities.Interview.list("-interview_date", 200); setInterviews(d); setLoading(false); };
  useEffect(() => { load(); }, []);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Interviews</h1>
        <Button onClick={() => { setEditInterview(null); setShowModal(true); }} className="gap-2"><Plus className="w-4 h-4" /> Schedule Interview</Button>
      </div>
      {loading ? <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div> : (
        <div className="space-y-3">
          {interviews.length === 0 ? <div className="text-center py-16 text-slate-400">No interviews scheduled.</div> : interviews.map(i => (
            <div key={i.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between gap-4 cursor-pointer hover:shadow-md" onClick={() => { setEditInterview(i); setShowModal(true); }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center shrink-0"><Calendar className="w-5 h-5 text-purple-600" /></div>
                <div>
                  <p className="font-semibold text-slate-900">{i.applicant_name}</p>
                  <p className="text-sm text-slate-500">with {i.interviewer_name || "TBD"} · {i.interview_date} {i.interview_time}</p>
                  <p className="text-xs text-slate-400 capitalize">{i.format?.replace("_"," ")}</p>
                </div>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize shrink-0 ${resultColors[i.result]}`}>{i.result?.replace("_"," ")}</span>
            </div>
          ))}
        </div>
      )}
      {showModal && <InterviewModal interview={editInterview} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load(); }} />}
    </div>
  );
}