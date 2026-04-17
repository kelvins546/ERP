import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/api/base44Client";
import { ChevronDown, Plus, Search, Edit, Trash2, Eye, Pin, PinOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

const typeColors = {
  informationals: "bg-blue-100 text-blue-700 border-blue-200",
  urgents: "bg-orange-100 text-orange-700 border-orange-200",
  criticals: "bg-red-100 text-red-700 border-red-200",
};

const TYPE_OPTIONS = ["informationals", "urgents", "criticals"];

function toDateInputValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function toTimeInputValue(value) {
  if (!value) return "";
  if (typeof value === "string") {
    const match = value.match(/^(\d{2}:\d{2})/);
    if (match) return match[1];
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(11, 16);
}

function splitDelimitedValues(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value)
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatDelimitedLabel(value) {
  return splitDelimitedValues(value).join(", ") || "All departments";
}

function getDepartmentLabel(department) {
  return department?.name || department?.department_name || department?.title || "Unnamed department";
}

function formatSimpleTime(value) {
  if (!value) return "—";
  const date = new Date(`1970-01-01T${value}`);
  if (Number.isNaN(date.getTime())) return "—";
  return date
    .toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    .toLowerCase();
}

function getAnnouncementType(ann) {
  const value = ann?.type || ann?.priority || "informationals";
  if (value === "informational") return "informationals";
  if (value === "urgent") return "urgents";
  if (value === "critical") return "criticals";
  return value;
}

function AnnouncementModal({ ann, onClose, onSaved, departments }) {
  const initialTargetIds = splitDelimitedValues(ann?.target_department_id || ann?.target_department_ids);
  const initialTargetNames = splitDelimitedValues(ann?.target_department_name || ann?.target_department_names);
  const [form, setForm] = useState({
    title: "",
    content: "",
    type: "informationals",
    close_date: "",
    close_time: "",
    is_pinned: false,
    target_department_ids: [],
    target_department_names: [],
    ...ann,
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setForm({
      title: "",
      content: "",
      type: "informationals",
      close_date: "",
      close_time: "",
      is_pinned: false,
      target_department_ids: [],
      target_department_names: [],
      ...ann,
      type: getAnnouncementType(ann),
      close_date: toDateInputValue(ann?.close_date || ann?.close_at || ann?.closeDate),
      close_time: toTimeInputValue(ann?.close_time || ann?.close_at || ann?.closeTime),
      target_department_ids: initialTargetIds,
      target_department_names: initialTargetNames,
    });
    setErrors({});
  }, [ann]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const validate = () => {
    const nextErrors = {};
    if (!form.title?.trim()) nextErrors.title = "Title is required.";
    if (!form.content?.trim()) nextErrors.content = "Content is required.";
    if (!form.type) nextErrors.type = "Type is required.";
    if (!form.close_date) nextErrors.close_date = "Close date is required.";
    if (!form.close_time) nextErrors.close_time = "Close time is required.";
    setErrors(nextErrors);
    return nextErrors;
  };

  const save = async () => {
    const formErrors = validate();
    if (Object.keys(formErrors).length > 0) return;

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        content: form.content.trim(),
        type: form.type,
        close_date: form.close_date,
        close_time: form.close_time,
        is_pinned: Boolean(form.is_pinned),
        target_department_id: form.target_department_ids.length ? form.target_department_ids.join(",") : null,
        target_department_name: form.target_department_names.length ? form.target_department_names.join(",") : null,
      };

      if (ann?.id) {
        const { error } = await supabase
          .from("announcements")
          .update(payload)
          .eq("id", ann.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("announcements").insert([payload]);
        if (error) throw error;
      }

      onSaved();
    } catch (error) {
      console.error("Error saving announcement:", error.message);
      setErrors({ form: error.message || "Failed to save announcement." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold">
            {ann ? "Edit Announcement" : "New Announcement"}
          </h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-slate-400 hover:text-slate-700" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {errors.form && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {errors.form}
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-slate-600">Title *</label>
            <Input
              className={`mt-1 ${errors.title ? "border-red-500" : ""}`}
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Announcement title"
            />
            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">Content *</label>
            <textarea
              className={`mt-1 w-full border rounded-lg px-3 py-2 text-sm ${errors.content ? "border-red-500" : "border-slate-200"}`}
              rows={5}
              value={form.content}
              onChange={(e) => set("content", e.target.value)}
              placeholder="Write the announcement details here"
            />
            {errors.content && <p className="mt-1 text-xs text-red-600">{errors.content}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600">Type *</label>
              <Select value={form.type} onValueChange={(value) => set("type", value)}>
                <SelectTrigger className={`mt-1 ${errors.type ? "border-red-500" : ""}`}>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && <p className="mt-1 text-xs text-red-600">{errors.type}</p>}
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600">Target Departments</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="mt-1 flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                  >
                    <span className="truncate text-left">
                      {form.target_department_ids.length === 0
                        ? "All departments"
                        : `${form.target_department_names.length} selected`}
                    </span>
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-72 overflow-y-auto p-1">
                  <DropdownMenuCheckboxItem
                    checked={form.target_department_ids.length === 0}
                    onSelect={(event) => event.preventDefault()}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        set("target_department_ids", []);
                        set("target_department_names", []);
                      }
                    }}
                  >
                    All departments
                  </DropdownMenuCheckboxItem>
                  {departments.map((department) => {
                    const departmentName = getDepartmentLabel(department);
                    return (
                      <DropdownMenuCheckboxItem
                        key={department.id}
                        checked={form.target_department_ids.includes(department.id)}
                        onSelect={(event) => event.preventDefault()}
                        onCheckedChange={(checked) => {
                          const nextIds = checked
                            ? [...form.target_department_ids, department.id]
                            : form.target_department_ids.filter((id) => id !== department.id);
                          const nextNames = checked
                            ? [...form.target_department_names, departmentName]
                            : form.target_department_names.filter((name) => name !== departmentName);
                          set("target_department_ids", nextIds);
                          set("target_department_names", nextNames);
                        }}
                      >
                        {departmentName}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
              <p className="mt-1 text-[11px] text-slate-500">
                Leave all unchecked to send to all departments.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600">Close Date *</label>
              <Input
                type="date"
                className={`mt-1 ${errors.close_date ? "border-red-500" : ""}`}
                value={form.close_date}
                onChange={(e) => set("close_date", e.target.value)}
              />
              {errors.close_date && <p className="mt-1 text-xs text-red-600">{errors.close_date}</p>}
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600">Close Time *</label>
              <Input
                type="time"
                className={`mt-1 ${errors.close_time ? "border-red-500" : ""}`}
                value={form.close_time}
                onChange={(e) => set("close_time", e.target.value)}
              />
              {errors.close_time && <p className="mt-1 text-xs text-red-600">{errors.close_time}</p>}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.is_pinned || false}
              onChange={(e) => set("is_pinned", e.target.checked)}
            />
            <span className="text-sm text-slate-600">Pin this announcement</span>
          </label>
        </div>

        <div className="flex justify-end gap-3 p-5 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving..." : ann ? "Save Changes" : "Post"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function AnnouncementViewModal({ ann, onClose }) {
  if (!ann) return null;

  const closeAt = ann.close_at || ann.close_date || null;
  const displayDate = closeAt ? new Date(closeAt) : null;
  const closeLabel = displayDate && !Number.isNaN(displayDate.getTime())
    ? displayDate.toLocaleString()
    : "—";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold">View Announcement</h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-slate-400 hover:text-slate-700" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize border ${typeColors[getAnnouncementType(ann)] || typeColors.informationals}`}
            >
              {getAnnouncementType(ann)}
            </span>
            {ann.is_pinned && (
              <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Pin className="w-3.5 h-3.5" /> Pinned
              </span>
            )}
            {ann.target_department_id && (
              <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                Department: {ann.target_department_name || ann.target_department_id}
              </span>
            )}
          </div>

          <div>
            <h3 className="text-xl font-semibold text-slate-900">{ann.title}</h3>
            <p className="text-xs text-slate-400 mt-1">
              Posted: {ann.created_at ? new Date(ann.created_at).toLocaleString() : "—"}
            </p>
            <p className="text-xs text-slate-400 mt-1">Closes: {closeLabel}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="whitespace-pre-wrap text-sm text-slate-700 leading-6">
              {ann.content}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-5 border-t">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}

function AnnouncementRow({ a, onView, onEdit, onDelete, onTogglePin, pinning }) {
  const closeAt = a.close_at || a.close_date || null;
  const displayDate = closeAt ? new Date(closeAt) : null;
  const announcementType = getAnnouncementType(a);
  const closeLabel = displayDate && !Number.isNaN(displayDate.getTime())
    ? displayDate.toLocaleDateString()
    : "—";
  const closeTime = displayDate && !Number.isNaN(displayDate.getTime())
    ? formatSimpleTime(a.close_time || displayDate.toTimeString().slice(0, 5))
    : "—";
  const targetDepartments = a.target_department_name || a.target_department_id;

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-slate-900 truncate max-w-[260px]">
            {a.title}
          </p>
          {a.is_pinned && <Pin className="w-3.5 h-3.5 text-red-500 shrink-0" />}
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">
        <span
          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize border ${typeColors[announcementType] || typeColors.informationals}`}
        >
          {announcementType}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">{closeLabel}</td>
      <td className="px-4 py-3 text-sm text-slate-600">{closeTime}</td>
      <td className="px-4 py-3 text-sm text-slate-600 max-w-[360px]">
        <p className="truncate" title={a.content}>
          {a.content}
        </p>
      </td>
      <td className="px-4 py-3 text-sm text-slate-500">
        {a.created_at ? new Date(a.created_at).toLocaleDateString() : "—"}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2 w-full">
          <div className="flex items-center gap-2">
          <button
            onClick={onView}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
            title="View full announcement"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={onEdit}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="Edit announcement"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Delete announcement"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          </div>
          <button
            onClick={onTogglePin}
            disabled={pinning}
            className={`ml-auto p-1.5 rounded transition-colors ${a.is_pinned ? "text-red-600 hover:text-red-700 hover:bg-red-50" : "text-red-500 hover:text-red-600 hover:bg-red-50"}`}
            title={a.is_pinned ? "Unpin announcement" : "Pin announcement"}
          >
                  {a.is_pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function Announcements() {
  const [items, setItems] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [pinningId, setPinningId] = useState(null);
  const [pinCandidate, setPinCandidate] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setLoadError("");
      const [announcementsResult, departmentsResult] = await Promise.all([
        supabase
          .from("announcements")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase.from("departments").select("id, name").order("name", { ascending: true }),
      ]);

      const { data, error } = announcementsResult;
      const { data: departmentData, error: departmentError } = departmentsResult;

      if (error) throw error;
      if (departmentError) throw departmentError;
      setItems(data || []);
      setDepartments(departmentData || []);
    } catch (error) {
      console.error("Failed to load announcements:", error.message);
      setLoadError(error.message || "Failed to load announcements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchType = typeFilter === "all" ? true : getAnnouncementType(item) === typeFilter;
      const matchSearch =
        !term ||
        (item.title || "").toLowerCase().includes(term) ||
        (item.content || "").toLowerCase().includes(term) ||
        (item.type || "").toLowerCase().includes(term);
      return matchType && matchSearch;
    });
  }, [items, search, typeFilter]);

  const pinned = filtered.filter((item) => item.is_pinned);
  const rest = filtered.filter((item) => !item.is_pinned);

  const handleDelete = async () => {
    if (!deleteCandidate?.id) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("announcements")
        .delete()
        .eq("id", deleteCandidate.id);
      if (error) throw error;
      setDeleteCandidate(null);
      load();
    } catch (error) {
      console.error("Delete failed:", error.message);
      alert("Failed to delete announcement: " + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleTogglePin = async (announcement) => {
    if (!announcement?.id) return;

    setPinningId(announcement.id);
    try {
      const { error } = await supabase
        .from("announcements")
        .update({ is_pinned: !announcement.is_pinned })
        .eq("id", announcement.id);

      if (error) throw error;
      load();
    } catch (error) {
      console.error("Pin toggle failed:", error.message);
      alert("Failed to update pin state: " + error.message);
    } finally {
      setPinningId(null);
    }
  };

  const requestTogglePin = (announcement) => {
    setPinCandidate(announcement);
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Announcements</h1>
          <p className="text-slate-500 text-sm">{items.length} total announcements</p>
        </div>
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

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search announcements..."
            className="pl-9 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-56 bg-white">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {TYPE_OPTIONS.map((type) => (
              <SelectItem key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
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
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {loadError && (
            <div className="mx-4 mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              Error loading announcements: {loadError}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {[
                    "Title",
                    "Type",
                    "Close Date",
                    "Close Time",
                    "Message",
                    "Posted",
                    "Actions",
                  ].map((header) => (
                    <th
                      key={header}
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-slate-400">
                      No announcements found.
                    </td>
                  </tr>
                ) : (
                  <>
                    {pinned.map((a) => (
                      <AnnouncementRow
                        key={a.id}
                        a={a}
                        pinning={pinningId === a.id}
                        onView={() => setViewItem(a)}
                        onEdit={() => {
                          setEditItem(a);
                          setShowModal(true);
                        }}
                        onDelete={() => setDeleteCandidate(a)}
                        onTogglePin={() => requestTogglePin(a)}
                      />
                    ))}
                    {rest.map((a) => (
                      <AnnouncementRow
                        key={a.id}
                        a={a}
                        pinning={pinningId === a.id}
                        onView={() => setViewItem(a)}
                        onEdit={() => {
                          setEditItem(a);
                          setShowModal(true);
                        }}
                        onDelete={() => setDeleteCandidate(a)}
                        onTogglePin={() => requestTogglePin(a)}
                      />
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <AnnouncementModal
          ann={editItem}
          departments={departments}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            load();
          }}
        />
      )}

      {viewItem && (
        <AnnouncementViewModal
          ann={viewItem}
          onClose={() => setViewItem(null)}
        />
      )}

      <AlertDialog
        open={Boolean(deleteCandidate)}
        onOpenChange={(open) => {
          if (!open) setDeleteCandidate(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
            <AlertDialogDescription>
              Delete {deleteCandidate?.title}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(pinCandidate)}
        onOpenChange={(open) => {
          if (!open) setPinCandidate(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pinCandidate?.is_pinned ? "Unpin Announcement" : "Pin Announcement"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pinCandidate?.is_pinned
                ? `Remove pin from ${pinCandidate?.title}?`
                : `Pin ${pinCandidate?.title} so it stays at the top?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(pinningId)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pinCandidate) {
                  handleTogglePin(pinCandidate);
                  setPinCandidate(null);
                }
              }}
              disabled={Boolean(pinningId)}
              className="bg-red-600 hover:bg-red-700"
            >
              {pinCandidate?.is_pinned ? "Unpin" : "Pin"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
