import { useState, useEffect } from "react";
import { supabase } from "@/api/base44Client"; // <-- Clean Supabase import
import { Plus, Edit, Trash2, X, Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const priorityColors = {
  low: "bg-gray-100 text-gray-600",
  normal: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

// --- THE MODAL (CREATE & UPDATE) ---
function AnnouncementModal({ ann, onClose, onSaved }) {
  // Note: Added missing fields (priority, is_pinned) that weren't in your SQL but are in the UI.
  // We will pass them anyway. If Supabase rejects them, we'll need to update the SQL table.
  const [form, setForm] = useState({
    title: "",
    content: "",
    priority: "normal",
    is_pinned: false,
    target_department_id: null, // Changed from name to ID
    ...ann,
  });

  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      if (ann?.id) {
        // UPDATE Existing
        const { error } = await supabase
          .from("announcements")
          .update({
            title: form.title,
            content: form.content,
            target_department_id: form.target_department_id || null, // Ensure null if empty
            // Note: priority and is_pinned were not in the SQL schema I provided earlier.
            // If you want to use them, you must alter the announcements table in Supabase to add them.
          })
          .eq("id", ann.id);
        if (error) throw error;
      } else {
        // CREATE New
        const { error } = await supabase.from("announcements").insert([
          {
            title: form.title,
            content: form.content,
            target_department_id: form.target_department_id || null,
          },
        ]);
        if (error) throw error;
      }
      onSaved();
    } catch (error) {
      console.error("Error saving announcement:", error.message);
      alert("Failed to save: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold">
            {ann ? "Edit Announcement" : "New Announcement"}
          </h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-600">
              Title *
            </label>
            <Input
              className="mt-1"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">
              Content *
            </label>
            <textarea
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              rows={4}
              value={form.content}
              onChange={(e) => set("content", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600">
                Priority (Requires SQL update to save)
              </label>
              <select
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                value={form.priority}
                onChange={(e) => set("priority", e.target.value)}
              >
                {["low", "normal", "high", "urgent"].map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">
                Target Department ID (UUID)
              </label>
              <Input
                className="mt-1"
                value={form.target_department_id || ""}
                onChange={(e) => set("target_department_id", e.target.value)}
                placeholder="Leave blank for All"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_pinned || false}
              onChange={(e) => set("is_pinned", e.target.checked)}
            />
            <span className="text-sm text-slate-600">
              Pin this announcement (Requires SQL update to save)
            </span>
          </label>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={save}
            disabled={saving || !form.title || !form.content}
          >
            {saving ? "Saving..." : "Post"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- THE MAIN PAGE (READ & DELETE) ---
export default function Announcements() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      // Supabase Read - Ordered by newest first
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Failed to load announcements:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;
    try {
      // Supabase Delete
      const { error } = await supabase
        .from("announcements")
        .delete()
        .eq("id", id);
      if (error) throw error;
      load();
    } catch (error) {
      console.error("Delete failed:", error.message);
      alert("Failed to delete.");
    }
  };

  // Safe fallback for UI properties that might not exist in the database yet
  const pinned = items.filter((a) => a.is_pinned);
  const rest = items.filter((a) => !a.is_pinned);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Announcements</h1>
        <Button
          onClick={() => {
            setEditItem(null);
            setShowModal(true);
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" /> New Announcement
        </Button>
      </div>
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {pinned.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                <Pin className="w-4 h-4" /> Pinned
              </h2>
              {pinned.map((a) => (
                <AnnouncementCard
                  key={a.id}
                  a={a}
                  onEdit={() => {
                    setEditItem(a);
                    setShowModal(true);
                  }}
                  onDelete={() => handleDelete(a.id)}
                />
              ))}
            </div>
          )}

          {rest.map((a) => (
            <AnnouncementCard
              key={a.id}
              a={a}
              onEdit={() => {
                setEditItem(a);
                setShowModal(true);
              }}
              onDelete={() => handleDelete(a.id)}
            />
          ))}

          {items.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              No announcements yet.
            </div>
          )}
        </div>
      )}
      {showModal && (
        <AnnouncementModal
          ann={editItem}
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

// --- INDIVIDUAL CARD COMPONENT ---
function AnnouncementCard({ a, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${priorityColors[a.priority || "normal"]}`}
            >
              {a.priority || "normal"}
            </span>
            {a.target_department_id && (
              <span
                className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full"
                title={a.target_department_id}
              >
                Dept: {a.target_department_id.substring(0, 8)}...
              </span>
            )}
            {a.is_pinned && <Pin className="w-3.5 h-3.5 text-slate-400" />}
          </div>
          <h3 className="font-semibold text-slate-900">{a.title}</h3>
          <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">
            {a.content}
          </p>
          <p className="text-xs text-slate-400 mt-2">
            {new Date(a.created_at).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={onEdit}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
