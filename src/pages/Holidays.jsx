import { useState, useEffect } from "react";
import { supabase } from "@/api/base44Client"; // <-- Clean Supabase import
import { Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const typeColors = {
  regular: "bg-red-100 text-red-700",
  special_non_working: "bg-orange-100 text-orange-700",
  special_working: "bg-yellow-100 text-yellow-700",
};

// --- THE MODAL (CREATE & UPDATE) ---
function HolidayModal({ holiday, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: "",
    date: "",
    type: "regular",
    pay_rate_multiplier: 1,
    ...holiday,
  });

  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      // Build payload matching SQL schema
      const payload = {
        name: form.name,
        date: form.date,
        type: form.type,
        pay_rate_multiplier: Number(form.pay_rate_multiplier),
      };

      if (holiday?.id) {
        // UPDATE
        const { error } = await supabase
          .from("holidays")
          .update(payload)
          .eq("id", holiday.id);
        if (error) throw error;
      } else {
        // CREATE
        const { error } = await supabase.from("holidays").insert([payload]);
        if (error) throw error;
      }
      onSaved();
    } catch (error) {
      console.error("Error saving holiday:", error.message);
      alert("Failed to save: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold">
            {holiday ? "Edit Holiday" : "Add Holiday"}
          </h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-600">
              Holiday Name *
            </label>
            <Input
              className="mt-1"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Independence Day"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Date *</label>
            <Input
              className="mt-1"
              type="date"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Type</label>
            <select
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={form.type}
              onChange={(e) => set("type", e.target.value)}
            >
              <option value="regular">Regular Holiday</option>
              <option value="special_non_working">Special Non-Working</option>
              <option value="special_working">Special Working</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">
              Pay Rate Multiplier *
            </label>
            <Input
              className="mt-1"
              type="number"
              min="0"
              step="0.01"
              value={form.pay_rate_multiplier ?? ""}
              onChange={(e) => set("pay_rate_multiplier", e.target.value)}
              placeholder="e.g. 2.0"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={save}
            disabled={
              saving ||
              !form.name ||
              !form.date ||
              form.pay_rate_multiplier === "" ||
              Number(form.pay_rate_multiplier) <= 0
            }
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- THE MAIN PAGE (READ & DELETE) ---
export default function Holidays() {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editHoliday, setEditHoliday] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      // Supabase Read - Ordered chronologically by date
      const { data, error } = await supabase
        .from("holidays")
        .select("*")
        .order("date", { ascending: true })
        .limit(200);

      if (error) throw error;
      setHolidays(data || []);
    } catch (error) {
      console.error("Failed to load holidays:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this holiday?")) return;
    try {
      // Supabase Delete
      const { error } = await supabase.from("holidays").delete().eq("id", id);
      if (error) throw error;
      load();
    } catch (error) {
      console.error("Delete failed:", error.message);
      alert("Failed to delete holiday.");
    }
  };

  const filteredHolidays = holidays.filter((holiday) => {
    if (!search) return true;
    const haystack = [
      holiday.name,
      holiday.date,
      holiday.type,
      holiday.pay_rate_multiplier,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Holiday Setup</h1>
        <Button
          onClick={() => {
            setEditHoliday(null);
            setShowModal(true);
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" /> Add Holiday
        </Button>
      </div>

      <div className="w-full max-w-sm">
        <Input
          placeholder="Search holidays..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
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
                {["Date", "Holiday", "Type", "Pay Multiplier", "Actions"].map((h) => (
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
              {filteredHolidays.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">
                    No holidays configured.
                  </td>
                </tr>
              ) : (
                filteredHolidays.map((h) => (
                  <tr
                    key={h.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                      {/* Format the date to look nicer (e.g., "Jan 1, 2026") */}
                      {new Date(h.date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-800">
                      {h.name}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize border ${typeColors[h.type] || "bg-slate-100 text-slate-600 border-slate-200"} ${h.type === "regular" ? "border-red-200" : ""}`}
                      >
                        {(h.type || "").replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-800">
                      {Number(h.pay_rate_multiplier || 0).toFixed(2)}x
                    </td>
                    <td className="px-4 py-3 flex gap-2">
                      <button
                        onClick={() => {
                          setEditHoliday(h);
                          setShowModal(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded text-xs font-medium transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(h.id)}
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
        <HolidayModal
          holiday={editHoliday}
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
