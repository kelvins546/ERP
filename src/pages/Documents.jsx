import { useState, useEffect } from "react";
import { supabase } from "@/api/base44Client"; // <-- Clean Supabase import
import { Plus, Trash2, X, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const docTypes = [
  "Resume",
  "Contract",
  "NBI Clearance",
  "Medical Certificate",
  "SSS",
  "PhilHealth",
  "Pag-IBIG",
  "TIN",
  "Birth Certificate",
  "Diploma",
  "Transcript",
  "Other",
];

// --- THE MODAL (UPLOAD & CREATE) ---
function DocModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    employee_id: "", // Changed to ID to match SQL schema
    document_type: "Resume",
    file_name: "",
    notes: "",
  });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      if (!form.employee_id) throw new Error("Employee ID is required");
      if (!file) throw new Error("Please select a file to upload");

      // 1. Upload file to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const safeFileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${form.employee_id}/${safeFileName}`; // Organizes files by employee inside the bucket

      const { error: uploadError } = await supabase.storage
        .from("documents") // <--- This is the bucket you need to create in Supabase!
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get the public URL for the uploaded file
      const {
        data: { publicUrl },
      } = supabase.storage.from("documents").getPublicUrl(filePath);

      // 3. Save the record in the database
      const { error: dbError } = await supabase
        .from("employee_documents")
        .insert([
          {
            employee_id: form.employee_id,
            document_type: form.document_type,
            file_url: publicUrl,
            // Note: file_name and notes are not in your current SQL schema.
            // You must add them to the employee_documents table if you want to save them.
            // file_name: file.name,
            // notes: form.notes
          },
        ]);

      if (dbError) throw dbError;
      onSaved();
    } catch (error) {
      console.error("Upload error:", error.message);
      alert("Failed to upload: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold">Upload Document</h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-600">
              Employee ID (UUID) *
            </label>
            <Input
              className="mt-1"
              value={form.employee_id || ""}
              onChange={(e) => set("employee_id", e.target.value)}
              placeholder="Enter Employee UUID"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">
              Document Type
            </label>
            <Select
              value={form.document_type}
              onValueChange={(value) => set("document_type", value)}
            >
              <SelectTrigger className="mt-1 w-full border-slate-200 bg-white text-sm">
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {docTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">File *</label>
            <input
              type="file"
              className="mt-1 block w-full text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              onChange={(e) => setFile(e.target.files[0])}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">
              Notes (Requires DB Column)
            </label>
            <Input
              className="mt-1"
              value={form.notes || ""}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={save}
            disabled={saving || !file || !form.employee_id}
          >
            {saving ? "Uploading..." : "Upload"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- THE MAIN PAGE (READ & DELETE) ---
export default function Documents() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [empFilter, setEmpFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      // Supabase Read
      const { data, error } = await supabase
        .from("employee_documents")
        .select("*")
        .order("uploaded_at", { ascending: false })
        .limit(200);

      if (error) throw error;
      setDocs(data || []);
    } catch (error) {
      console.error("Failed to load documents:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id, fileUrl) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      // 1. (Optional but good practice) Delete from Supabase Storage first
      if (fileUrl) {
        // Extract the path from the public URL. This is a basic extraction.
        const pathSegments = fileUrl.split("/documents/")[1];
        if (pathSegments) {
          await supabase.storage.from("documents").remove([pathSegments]);
        }
      }

      // 2. Delete the record from the database
      const { error } = await supabase
        .from("employee_documents")
        .delete()
        .eq("id", id);
      if (error) throw error;

      load();
    } catch (error) {
      console.error("Delete failed:", error.message);
      alert("Failed to delete document.");
    }
  };

  const filtered = docs.filter(
    (d) =>
      (!empFilter ||
        (d.employee_id || "")
          .toLowerCase()
          .includes(empFilter.toLowerCase())) &&
      (!typeFilter || d.document_type === typeFilter),
  );

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">
          201 File Management
        </h1>
        <Button onClick={() => setShowModal(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Upload Document
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Filter by Employee ID..."
          value={empFilter}
          onChange={(e) => setEmpFilter(e.target.value)}
          className="flex-1 bg-white"
        />
        <Select
          value={typeFilter || "all"}
          onValueChange={(value) => setTypeFilter(value === "all" ? "" : value)}
        >
          <SelectTrigger className="w-full sm:w-[220px] border-slate-200 bg-white text-sm text-slate-600">
            <SelectValue placeholder="All Document Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Document Types</SelectItem>
            {docTypes.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length === 0 ? (
            <p className="col-span-3 text-center py-16 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
              No documents found.
            </p>
          ) : (
            filtered.map((d) => (
              <div
                key={d.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p
                        className="font-medium text-slate-900 text-sm"
                        title={d.employee_id}
                      >
                        Emp:{" "}
                        {d.employee_id
                          ? d.employee_id.substring(0, 8) + "..."
                          : "Unknown"}
                      </p>
                      <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded mt-1 inline-block border border-slate-200">
                        {d.document_type}
                      </span>
                      {d.file_name && (
                        <p className="text-xs text-slate-400 mt-2 line-clamp-1">
                          {d.file_name}
                        </p>
                      )}
                      {d.notes && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                          {d.notes}
                        </p>
                      )}
                      <p className="text-xs text-slate-400 mt-2">
                        {new Date(d.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {d.file_url && (
                      <a
                        href={d.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => handleDelete(d.id, d.file_url)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      {showModal && (
        <DocModal
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            load();
          }}
        />
      )}
    </div>
  );
}
