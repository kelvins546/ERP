import { useState, useEffect } from "react";
import { supabase } from "@/api/base44Client"; // <-- Clean Supabase import
import { Plus, Edit, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    employee_id: "", // Changed from employee_name to match SQL
    status: "pending",
    priority: "medium",
    due_date: "",
    ...task,
  });

  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        employee_id: form.employee_id || null,
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
      onSaved();
    } catch (error) {
      console.error("Error saving task:", error.message);
      alert("Failed to save: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold">
            {task ? "Edit Task" : "New Task"}
          </h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-600">
              Task Title *
            </label>
            <Input
              className="mt-1"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Submit Q1 Reports"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">
              Assigned To (Employee UUID)
            </label>
            <Input
              className="mt-1"
              value={form.employee_id || ""}
              onChange={(e) => set("employee_id", e.target.value)}
              placeholder="Enter UUID..."
            />
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
                  ),
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
                    {p}
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
              className="mt-1"
              type="date"
              value={form.due_date || ""}
              onChange={(e) => set("due_date", e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving || !form.title}>
            {saving ? "Saving..." : "Save Task"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- THE MAIN PAGE (READ & DELETE) ---
export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      // Supabase Read with Join to get Employee names
      const { data, error } = await supabase
        .from("employee_tasks")
        .select("*, employees(first_name, last_name)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error("Failed to load tasks:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Delete this task?")) return;
    try {
      await supabase.from("employee_tasks").delete().eq("id", id);
      load();
    } catch (error) {
      alert("Delete failed.");
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
                            onClick={() => handleDelete(t.id)}
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
    </div>
  );
}
