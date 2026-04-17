import { useState, useEffect } from "react";
import { supabase } from "@/api/base44Client";
import { Plus, Edit, Trash2, X } from "lucide-react";
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
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  in_progress: "bg-blue-100 text-blue-700 border-blue-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-gray-100 text-gray-600 border-gray-200",
};

const priorityColors = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-orange-100 text-orange-700 border-orange-200",
  high: "bg-red-100 text-red-700 border-red-200",
};

// --- THE MODAL (CREATE & UPDATE) ---
function TaskModal({ task, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    employee_id: "",
    status: "pending",
    priority: "medium",
    due_date: "",
    ...task,
  });
  const [employees, setEmployees] = useState([]);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [cleanForm, setCleanForm] = useState({
    title: "",
    description: "",
    employee_id: "",
    status: "pending",
    priority: "medium",
    due_date: "",
    ...task,
  });

  const validateForm = (currentForm) => {
    const nextErrors = {};
    if (!currentForm.title?.trim()) {
      nextErrors.title = "Task title is required.";
    }

    if (currentForm.due_date) {
      const selectedDate = new Date(currentForm.due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        nextErrors.due_date = "Due date cannot be in the past.";
      }
    }

    return nextErrors;
  };

  const set = (key, value) => {
    setForm((prev) => {
      const nextForm = { ...prev, [key]: value };
      setErrors(validateForm(nextForm));
      return nextForm;
    });
    setTouched((prev) => ({ ...prev, [key]: true }));
  };

  const showError = (key) => (touched[key] || submitted) && errors[key];

  const hasUnsavedChanges = () => {
    return JSON.stringify(form) !== JSON.stringify(cleanForm);
  };

  const handleCloseClick = () => {
    if (hasUnsavedChanges()) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  };

  useEffect(() => {
    setForm({
      title: "",
      description: "",
      employee_id: "",
      status: "pending",
      priority: "medium",
      due_date: "",
      ...task,
    });
    setCleanForm({
      title: "",
      description: "",
      employee_id: "",
      status: "pending",
      priority: "medium",
      due_date: "",
      ...task,
    });
    setErrors({});
    setTouched({});
    setSubmitted(false);
  }, [task]);

  useEffect(() => {
    const loadEmployees = async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name")
        .order("first_name");
      if (!error) setEmployees(data || []);
    };
    loadEmployees();
  }, []);

  const requestSaveConfirmation = () => {
    setSubmitted(true);
    const formErrors = validateForm(form);
    setErrors(formErrors);
    if (Object.keys(formErrors).length === 0) {
      setShowSaveConfirm(true);
    }
  };

  const persistTask = async () => {
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description?.trim() || null,
        employee_id: form.employee_id?.trim() || null,
        status: form.status,
        priority: form.priority,
        due_date: form.due_date || null,
      };

      if (task?.id) {
        const { error } = await supabase
          .from("employee_tasks")
          .update(payload)
          .eq("id", task.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("employee_tasks")
          .insert([payload]);
        if (error) throw error;
      }
      setShowSaveConfirm(false);
      onSaved();
    } catch (error) {
      console.error("Error saving task:", error.message);
      setErrors({ form: "Failed to save: " + error.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-semibold">
            {task ? "Edit Task" : "New Task"}
          </h2>
          <button onClick={handleCloseClick}>
            <X className="w-5 h-5 text-slate-400 hover:text-slate-700" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {errors.form && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {errors.form}
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-slate-600">
              Task Title *
            </label>
            <Input
              className={`mt-1 ${showError("title") ? "border-red-500" : ""}`}
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Submit Q1 Reports"
            />
            {showError("title") && (
              <p className="text-xs text-red-600 mt-1">{errors.title}</p>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">
              Assigned To
            </label>
            <select
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={form.employee_id || ""}
              onChange={(e) => set("employee_id", e.target.value)}
            >
              <option value="">Unassigned</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">
              Description
            </label>
            <textarea
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              rows={3}
              value={form.description || ""}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600">
                Status
              </label>
              <select
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
              >
                {["pending", "in_progress", "completed", "cancelled"].map(
                  (s) => (
                    <option key={s} value={s}>
                      {s.replace("_", " ")}
                    </option>
                  )
                )}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">
                Priority
              </label>
              <select
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                value={form.priority}
                onChange={(e) => set("priority", e.target.value)}
              >
                {["low", "medium", "high"].map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">
              Due Date
            </label>
            <Input
              className={`mt-1 ${showError("due_date") ? "border-red-500" : ""}`}
              type="date"
              value={form.due_date || ""}
              onChange={(e) => set("due_date", e.target.value)}
            />
            {showError("due_date") && (
              <p className="text-xs text-red-600 mt-1">{errors.due_date}</p>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t sticky bottom-0 bg-white">
          <Button variant="outline" onClick={handleCloseClick}>
            Cancel
          </Button>
          <Button onClick={requestSaveConfirmation} disabled={saving}>
            {saving ? "Saving..." : "Save Task"}
          </Button>
        </div>
      </div>

      <AlertDialog open={showSaveConfirm} onOpenChange={setShowSaveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {task ? "Confirm Task Update" : "Confirm New Task"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {task
                ? "Are you sure the edited task information is correct?"
                : "Are you sure the task information is correct before adding this record?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>
              Review Details
            </AlertDialogCancel>
            <AlertDialogAction onClick={persistTask} disabled={saving}>
              {saving ? "Saving..." : task ? "Confirm Update" : "Confirm Add"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard Changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to close without
              saving?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={onClose}
              className="bg-red-600 hover:bg-red-700"
            >
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// --- THE MAIN PAGE (READ & DELETE) ---
export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [employeesById, setEmployeesById] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setLoadError("");

      const employeesResult = await supabase
        .from("employees")
        .select("id, first_name, last_name");
      if (!employeesResult.error) {
        const map = (employeesResult.data || []).reduce((acc, emp) => {
          acc[emp.id] = `${emp.first_name || ""} ${emp.last_name || ""}`.trim();
          return acc;
        }, {});
        setEmployeesById(map);
      }

      // Try with join first. If relationship metadata is missing, fallback to plain task query.
      const { data, error } = await supabase
        .from("employee_tasks")
        .select("*, employees(first_name, last_name)")
        .order("created_at", { ascending: false });

      if (!error) {
        setTasks(data || []);
        return;
      }

      const fallback = await supabase
        .from("employee_tasks")
        .select("*")
        .order("created_at", { ascending: false });

      if (fallback.error) throw fallback.error;
      setTasks(fallback.data || []);
    } catch (error) {
      console.error("Failed to load tasks:", error.message);
      setLoadError(error.message || "Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async () => {
    if (!deleteCandidate) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("employee_tasks")
        .delete()
        .eq("id", deleteCandidate.id);
      if (error) throw error;
      setDeleteCandidate(null);
      load();
    } catch (error) {
      console.error("Delete failed:", error.message);
      alert("Failed to delete task.");
    } finally {
      setDeleting(false);
    }
  };

  const filtered = statusFilter
    ? tasks.filter((t) => t.status === statusFilter)
    : tasks;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Employee Tasks</h1>
        <Button
          onClick={() => {
            setEditTask(null);
            setShowModal(true);
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" /> New Task
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["", "pending", "in_progress", "completed", "cancelled"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${statusFilter === s ? "bg-blue-600 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
          >
            {s
              ? s.replace("_", " ").charAt(0).toUpperCase() +
                s.slice(1).replace("_", " ")
              : "All"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : loadError ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          Failed to load tasks: {loadError}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  {[
                    "Task",
                    "Assigned To",
                    "Priority",
                    "Status",
                    "Due Date",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-12 text-slate-400"
                    >
                      No tasks found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((t) => (
                    <tr
                      key={t.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-slate-900">
                          {t.title}
                        </p>
                        {t.description && (
                          <p className="text-xs text-slate-400 line-clamp-1">
                            {t.description}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {t.employees ? (
                          `${t.employees.first_name} ${t.employees.last_name}`
                        ) : employeesById[t.employee_id] ? (
                          employeesById[t.employee_id]
                        ) : (
                          <span className="text-slate-400 italic">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${priorityColors[t.priority] || ""}`}
                        >
                          {t.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${statusColors[t.status] || ""}`}
                        >
                          {t.status?.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {t.due_date
                          ? new Date(t.due_date).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              setEditTask(t);
                              setShowModal(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteCandidate(t)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {showModal && (
        <TaskModal
          task={editTask}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            load();
          }}
        />
      )}

      <AlertDialog open={!!deleteCandidate} onOpenChange={() => setDeleteCandidate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Delete "{deleteCandidate?.title}"? This action cannot be undone.
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
    </div>
  );
}
