import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, X, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const docTypes = ["Resume","Contract","NBI Clearance","Medical Certificate","SSS","PhilHealth","Pag-IBIG","TIN","Birth Certificate","Diploma","Transcript","Other"];

function DocModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ employee_name: "", document_type: "Resume", file_name: "", notes: "" });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    let file_url = form.file_url || "";
    if (file) {
      const result = await base44.integrations.Core.UploadFile({ file });
      file_url = result.file_url;
    }
    await base44.entities.EmployeeDocument.create({ ...form, employee_id: form.employee_id || "manual", file_url, file_name: file ? file.name : form.file_name });
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold">Upload Document</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div><label className="text-xs font-medium text-slate-600">Employee</label><Input className="mt-1" value={form.employee_name || ""} onChange={e => set("employee_name", e.target.value)} /></div>
          <div><label className="text-xs font-medium text-slate-600">Document Type</label>
            <select className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.document_type} onChange={e => set("document_type", e.target.value)}>
              {docTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">File</label>
            <input type="file" className="mt-1 block w-full text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" onChange={e => setFile(e.target.files[0])} />
          </div>
          <div><label className="text-xs font-medium text-slate-600">Notes</label><Input className="mt-1" value={form.notes || ""} onChange={e => set("notes", e.target.value)} /></div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Uploading..." : "Upload"}</Button>
        </div>
      </div>
    </div>
  );
}

export default function Documents() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [empFilter, setEmpFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const load = async () => { setLoading(true); const d = await base44.entities.EmployeeDocument.list("-created_date", 200); setDocs(d); setLoading(false); };
  useEffect(() => { load(); }, []);
  const handleDelete = async (id) => { if (!confirm("Delete?")) return; await base44.entities.EmployeeDocument.delete(id); load(); };

  const filtered = docs.filter(d =>
    (!empFilter || (d.employee_name || "").toLowerCase().includes(empFilter.toLowerCase())) &&
    (!typeFilter || d.document_type === typeFilter)
  );

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">201 File Management</h1>
        <Button onClick={() => setShowModal(true)} className="gap-2"><Plus className="w-4 h-4" /> Upload Document</Button>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <Input placeholder="Filter by employee..." value={empFilter} onChange={e => setEmpFilter(e.target.value)} className="flex-1" />
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 bg-white">
          <option value="">All Types</option>
          {docTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      {loading ? <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length === 0 ? <p className="col-span-3 text-center py-16 text-slate-400">No documents found.</p> : filtered.map(d => (
            <div key={d.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center shrink-0"><FileText className="w-4 h-4 text-blue-600" /></div>
                  <div>
                    <p className="font-medium text-slate-900 text-sm">{d.employee_name}</p>
                    <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{d.document_type}</span>
                    {d.file_name && <p className="text-xs text-slate-400 mt-1">{d.file_name}</p>}
                    {d.notes && <p className="text-xs text-slate-400 mt-1">{d.notes}</p>}
                    <p className="text-xs text-slate-300 mt-1">{new Date(d.created_date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {d.file_url && <a href={d.file_url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Download className="w-4 h-4" /></a>}
                  <button onClick={() => handleDelete(d.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {showModal && <DocModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load(); }} />}
    </div>
  );
}