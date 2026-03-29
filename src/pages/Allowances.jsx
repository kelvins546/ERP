import { useState, useEffect } from "react";
import { supabase } from "@/api/base44Client"; // <-- Clean Supabase import
import { Plus, Edit, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- THE MODAL (CREATE & UPDATE) ---
function AllowanceModal({ allowance, onClose, onSaved }) {
  const [form, setForm] = useState({
    employee_id: "", // Changed from employee_name to ID for relational mapping
    allowance_name: "",
    amount: "",
    frequency: "monthly",
    is_taxable: false,
    ...allowance,
  });

  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      if (allowance?.id) {
        // UPDATE Existing
        const { error } = await supabase
          .from("employee_allowances")
          .update(form)
          .eq("id", allowance.id);
        if (error) throw error;
      } else {
        // CREATE New
        const { error } = await supabase
          .from("employee_allowances")
          .insert([form]); // Supabase expects an array for inserts
        if (error) throw error;
      }
      onSaved();
    } catch (error) {
      console.error("Error saving allowance:", error.message);
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
            {allowance ? "Edit Allowance" : "New Allowance"}
          </h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Note: In a real app, Employee would be a dropdown menu fetching from the 'employees' table. 
            For now, we are keeping it as a text input as a placeholder. */}
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-600">
              Employee ID (UUID Placeholder)
            </label>
            <Input
              className="mt-1"
              value={form.employee_id || ""}
              onChange={(e) => set("employee_id", e.target.value)}
              placeholder="Enter Employee UUID..."
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">
              Allowance Name
            </label>
            <Input
              className="mt-1"
              value={form.allowance_name || ""}
              onChange={(e) => set("allowance_name", e.target.value)}
              placeholder="Transportation, Meal, Rice..."
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">
              Amount (₱)
            </label>
            <Input
              className="mt-1"
              type="number"
              value={form.amount || ""}
              onChange={(e) => set("amount", Number(e.target.value))}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">
              Frequency
            </label>
            <select
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={form.frequency}
              onChange={(e) => set("frequency", e.target.value)}
            >
              {["daily", "weekly", "semi_monthly", "monthly"].map((f) => (
                <option key={f} value={f}>
                  {f.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_taxable || false}
              onChange={(e) => set("is_taxable", e.target.checked)}
            />
            <span className="text-sm text-slate-600">Taxable Allowance</span>
          </label>
        </div>

        <div className="flex justify-end gap-3 p-5 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save Allowance"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- THE MAIN PAGE (READ & DELETE) ---
export default function Allowances() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      // Supabase Read
      const { data, error } = await supabase
        .from("employee_allowances")
        .select("*")
        .order("id", { ascending: true }); // Adding a default sort so the list doesn't jump around

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Failed to load allowances:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this allowance?")) return;
    try {
      // Supabase Delete
      const { error } = await supabase
        .from("employee_allowances")
        .delete()
        .eq("id", id);
      if (error) throw error;
      load(); // Refresh the list
    } catch (error) {
      console.error("Delete failed:", error.message);
      alert("Failed to delete.");
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Allowances</h1>
        <Button
          onClick={() => {
            setEditItem(null);
            setShowModal(true);
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" /> Add Allowance
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                {[
                  "Employee ID",
                  "Allowance",
                  "Amount",
                  "Frequency",
                  "Taxable",
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
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    No allowances have been added yet.
                  </td>
                </tr>
              ) : (
                items.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td
                      className="px-4 py-3 text-sm font-medium text-slate-900"
                      title={a.employee_id}
                    >
                      {/* Just showing the first 8 characters of the UUID to keep the table clean */}
                      {a.employee_id
                        ? a.employee_id.substring(0, 8) + "..."
                        : "N/A"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {a.allowance_name}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-green-600">
                      ₱{Number(a.amount || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 capitalize">
                      {(a.frequency || "").replace("_", " ")}
                    </td>
                    <td className="px-4 py-3">
                      {a.is_taxable ? (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full border border-red-200">
                          Taxable
                        </span>
                      ) : (
                        <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full border border-green-200">
                          Non-taxable
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 flex gap-2">
                      <button
                        onClick={() => {
                          setEditItem(a);
                          setShowModal(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(a.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <AllowanceModal
          allowance={editItem}
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
