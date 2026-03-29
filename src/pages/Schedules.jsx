import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

function ScheduleModal({ schedule, onClose, onSaved }) {
  const [form, setForm] = useState({ name: "", expected_time_in: "08:00", expected_time_out: "17:00", grace_period_mins: 15, work_days: ["Monday","Tuesday","Wednesday","Thursday","Friday"], ...schedule });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleDay = (day) => {
    const wd = form.work_days || [];
    set("work_days", wd.includes(day) ? wd.filter(d => d !== day) : [...wd, day]);
  };
  const save = async () => {
    setSaving(true);
    if (schedule?.id) await base44.entities.Schedule.update(schedule.id, form);
    else await base44.entities.Schedule.create(form);
    onSaved();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold">{schedule ? "Edit Schedule" : "New Schedule"}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div><label className="text-xs font-medium text-slate-600">Schedule Name *</label><Input className="mt-1" value={form.name} onChange={e => set("name", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-medium text-slate-600">Time In</label><Input className="mt-1" type="time" value={form.expected_time_in} onChange={e => set("expected_time_in", e.target.value)} /></div>
            <div><label className="text-xs font-medium text-slate-600">Time Out</label><Input className="mt-1" type="time" value={form.expected_time_out} onChange={e => set("expected_time_out", e.target.value)} /></div>
          </div>
          <div><label className="text-xs font-medium text-slate-600">Grace Period (minutes)</label><Input className="mt-1" type="number" value={form.grace_period_mins || ""} onChange={e => set("grace_period_mins", Number(e.target.value))} /></div>
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-2">Work Days</label>
            <div className="flex flex-wrap gap-2">
              {days.map(d => (
                <button key={d} type="button" onClick={() => toggleDay(d)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${(form.work_days || []).includes(d) ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                  {d.slice(0,3)}
                </button>
              ))}
            </div>
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

export default function Schedules() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editSchedule, setEditSchedule] = useState(null);

  const load = async () => { setLoading(true); const d = await base44.entities.Schedule.list("name"); setSchedules(d); setLoading(false); };
  useEffect(() => { load(); }, []);
  const handleDelete = async (id) => { if (!confirm("Delete?")) return; await base44.entities.Schedule.delete(id); load(); };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Work Schedules</h1>
        <Button onClick={() => { setEditSchedule(null); setShowModal(true); }} className="gap-2"><Plus className="w-4 h-4" /> New Schedule</Button>
      </div>
      {loading ? <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schedules.length === 0 ? <p className="col-span-3 text-center py-16 text-slate-400">No schedules yet.</p> : schedules.map(s => (
            <div key={s.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-900">{s.name}</h3>
              <p className="text-sm text-slate-500 mt-2">{s.expected_time_in} – {s.expected_time_out}</p>
              <p className="text-xs text-slate-400 mt-1">Grace: {s.grace_period_mins || 0} min</p>
              <div className="flex flex-wrap gap-1 mt-3">
                {(s.work_days || []).map(d => <span key={d} className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">{d.slice(0,3)}</span>)}
              </div>
              <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
                <button onClick={() => { setEditSchedule(s); setShowModal(true); }} className="text-xs text-blue-600 hover:underline">Edit</button>
                <button onClick={() => handleDelete(s.id)} className="text-xs text-red-500 hover:underline ml-auto flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {showModal && <ScheduleModal schedule={editSchedule} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load(); }} />}
    </div>
  );
}