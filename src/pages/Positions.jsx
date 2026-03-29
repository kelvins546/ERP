import { useState, useEffect } from "react";
import { supabase } from "@/api/base44Client"; // <-- Clean Supabase import
import { Plus, Edit, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- THE MODAL (CREATE & UPDATE) ---
function PosModal({ pos, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: "",
    salary_grade: "",
    base_salary_min: "",
    base_salary_max: "",
    department_id: "", // Changed from department_name to match SQL Foreign Key
    ...pos,
  });

  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      // Build payload matching SQL schema
      const payload = {
        title: form.title,
        salary_grade: form.salary_grade,
        base_salary_min: form.base_salary_min
          ? Number(form.base_salary_min)
          : null,
        base_salary_max: form.base_salary_max
          ? Number(form.base_salary_max)
          : null,
        department_id: form.department_id || null,
      };

      if (pos?.id) {
        // UPDATE
        const { error } = await supabase
          .from("positions")
          .update(payload)
          .eq("id", pos.id);
        if (error) throw error;
      } else {
        // CREATE
        const { error } = await supabase.from("positions").insert([payload]);
        if (error) throw error;
      }
      onSaved();
    } catch (error) {
      console.error("Error saving position:", error.message);
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
            {pos ? "Edit Position" : "Add Position"}
          </h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-600">
              Position Title *
            </label>
            <Input
              className="mt-1"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">
              Salary Grade
            </label>
            <Input
              className="mt-1"
              value={form.salary_grade || ""}
              onChange={(e) => set("salary_grade", e.target.value)}
              placeholder="e.g. SG-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600">
                Min Salary (₱)
              </label>
              <Input
                className="mt-1"
                type="number"
                value={form.base_salary_min || ""}
                onChange={(e) => set("base_salary_min", e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">
                Max Salary (₱)
              </label>
              <Input
                className="mt-1"
                type="number"
                value={form.base_salary_max || ""}
                onChange={(e) => set("base_salary_max", e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">
              Department ID (UUID)
            </label>
            <Input
              className="mt-1"
              value={form.department_id || ""}
              onChange={(e) => set("department_id", e.target.value)}
              placeholder="Enter Dept UUID"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving || !form.title}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- THE MAIN PAGE (READ & DELETE) ---
export default function Positions() {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editPos, setEditPos] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      // Supabase Read with Join to get Department Name
      const { data, error } = await supabase
        .from("positions")
        .select("*, departments(name)")
        .order("title", { ascending: true });

      if (error) throw error;
      setPositions(data || []);
    } catch (error) {
      console.error("Failed to load positions:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this position?")) return;
    try {
      const { error } = await supabase.from("positions").delete().eq("id", id);
      if (error) throw error;
      load();
    } catch (error) {
      console.error("Delete failed:", error.message);
      alert("Failed to delete position. It might be assigned to employees.");
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Positions</h1>
        <Button
          onClick={() => {
            setEditPos(null);
            setShowModal(true);
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" /> Add Position
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  {[
                    "Title",
                    "Grade",
                    "Salary Range",
                    "Department",
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
                {positions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center py-12 text-slate-400"
                    >
                      No positions found.
                    </td>
                  </tr>
                ) : (
                  positions.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-slate-900 text-sm">
                        {p.title}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {p.salary_grade || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {p.base_salary_min
                          ? `₱${Number(p.base_salary_min).toLocaleString()}`
                          : "—"}
                        {p.base_salary_max
                          ? ` – ₱${Number(p.base_salary_max).toLocaleString()}`
                          : ""}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {p.departments?.name || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditPos(p);
                              setShowModal(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
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
        )}
      </div>
      {showModal && (
        <PosModal
          pos={editPos}
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
