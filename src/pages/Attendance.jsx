import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, X, Clock, MapPin, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function LogModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ employee_name: "", type: "time_in", log_date: new Date().toISOString().split("T")[0], notes: "" });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const save = async () => {
    setSaving(true);
    await base44.entities.AttendanceLog.create({ ...form, employee_id: form.employee_id || "manual", device_timestamp: new Date().toISOString(), server_time: new Date().toISOString() });
    onSaved();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold">Add Attendance Log</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div><label className="text-xs font-medium text-slate-600">Employee</label><Input className="mt-1" value={form.employee_name || ""} onChange={e => set("employee_name", e.target.value)} /></div>
          <div><label className="text-xs font-medium text-slate-600">Type</label>
            <select className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.type} onChange={e => set("type", e.target.value)}>
              <option value="time_in">Time In</option>
              <option value="time_out">Time Out</option>
            </select>
          </div>
          <div><label className="text-xs font-medium text-slate-600">Date</label><Input className="mt-1" type="date" value={form.log_date} onChange={e => set("log_date", e.target.value)} /></div>
          <div><label className="text-xs font-medium text-slate-600">Notes</label><Input className="mt-1" value={form.notes || ""} onChange={e => set("notes", e.target.value)} /></div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
        </div>
      </div>
    </div>
  );
}

export default function Attendance() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split("T")[0]);

  const load = async () => {
    setLoading(true);
    const d = dateFilter
      ? await base44.entities.AttendanceLog.filter({ log_date: dateFilter }, "-server_time", 200)
      : await base44.entities.AttendanceLog.list("-server_time", 100);
    setLogs(d);
    setLoading(false);
  };
  useEffect(() => { load(); }, [dateFilter]);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Time Logs</h1>
        <Button onClick={() => setShowModal(true)} className="gap-2"><Plus className="w-4 h-4" /> Add Log</Button>
      </div>
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-slate-600">Date:</label>
        <Input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="w-40" />
        <button onClick={() => setDateFilter("")} className="text-sm text-blue-600 hover:underline">Show All</button>
      </div>
      {loading ? <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div> : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b"><tr>{["Employee","Type","Date","Time","Geofence","Late","Notes"].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? <tr><td colSpan={7} className="text-center py-12 text-slate-400">No logs found.</td></tr> : logs.map(l => (
                <tr key={l.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{l.employee_name || l.employee_id}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${l.type === "time_in" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>{l.type === "time_in" ? "Time In" : "Time Out"}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{l.log_date}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{l.device_timestamp ? new Date(l.device_timestamp).toLocaleTimeString() : "—"}</td>
                  <td className="px-4 py-3">
                    {l.is_within_geofence === true ? <span className="text-green-600 text-xs flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Within</span>
                      : l.is_within_geofence === false ? <span className="text-red-500 text-xs flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Outside</span>
                      : <span className="text-slate-300 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {l.is_late ? <span className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {l.minutes_late}m</span> : <span className="text-slate-300 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{l.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showModal && <LogModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load(); }} />}
    </div>
  );
}