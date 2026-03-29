import { useState, useEffect } from "react";
import { supabase } from "@/api/base44Client"; // <-- Clean Supabase import
import { Plus, X, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- THE MODAL (CREATE & UPDATE) ---
function PromotionModal({ promotion, onClose, onSaved }) {
  const [form, setForm] = useState({
    employee_id: "",
    previous_position_name: "",
    new_position_name: "",
    effective_date: "",
    remarks: "",
    ...promotion,
  });

  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      // Build payload matching SQL schema
      const payload = {
        employee_id: form.employee_id || null,
        previous_position_name: form.previous_position_name,
        new_position_name: form.new_position_name,
        effective_date: form.effective_date,
        remarks: form.remarks,
        // Note: If your SQL table is named 'promotion_histories', change the string below
      };

      if (promotion?.id) {
        // UPDATE
        const { error } = await supabase
          .from("promotion_history")
          .update(payload)
          .eq("id", promotion.id);
        if (error) throw error;
      } else {
        // CREATE
        const { error } = await supabase
          .from("promotion_history")
          .insert([payload]);
        if (error) throw error;
      }
      onSaved();
    } catch (error) {
      console.error("Error saving promotion:", error.message);
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
            {promotion ? "Edit Record" : "New Promotion"}
          </h2>
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
              Previous Position Name
            </label>
            <Input
              className="mt-1"
              value={form.previous_position_name || ""}
              onChange={(e) => set("previous_position_name", e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">
              New Position Name
            </label>
            <Input
              className="mt-1"
              value={form.new_position_name || ""}
              onChange={(e) => set("new_position_name", e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">
              Effective Date *
            </label>
            <Input
              className="mt-1"
              type="date"
              value={form.effective_date}
              onChange={(e) => set("effective_date", e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">
              Remarks
            </label>
            <textarea
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              rows={3}
              value={form.remarks || ""}
              onChange={(e) => set("remarks", e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={save}
            disabled={saving || !form.employee_id || !form.effective_date}
          >
            {saving ? "Saving..." : "Save Record"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- THE MAIN PAGE (READ) ---
export default function Promotions() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editPromotion, setEditPromotion] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      // Supabase Read - Join with employees to get the name for display
      const { data, error } = await supabase
        .from("promotion_history")
        .select("*, employees(first_name, last_name)")
        .order("effective_date", { ascending: false })
        .limit(200);

      if (error) throw error;
      setPromotions(data || []);
    } catch (error) {
      console.error("Failed to load promotions:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Promotion History</h1>
        <Button
          onClick={() => {
            setEditPromotion(null);
            setShowModal(true);
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" /> Add Promotion
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {promotions.length === 0 ? (
            <div className="text-center py-16 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
              No promotions on record.
            </div>
          ) : (
            promotions.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  setEditPromotion(p);
                  setShowModal(true);
                }}
              >
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">
                    {p.employees
                      ? `${p.employees.first_name} ${p.employees.last_name}`
                      : `ID: ${p.employee_id?.substring(0, 8)}...`}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500">
                      {p.previous_position_name || "—"}
                    </span>
                    <span className="text-xs text-slate-300">→</span>
                    <span className="text-xs font-medium text-blue-600">
                      {p.new_position_name || "—"}
                    </span>
                  </div>
                  {p.remarks && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1 italic">
                      "{p.remarks}"
                    </p>
                  )}
                </div>
                <p className="text-sm text-slate-500 shrink-0 font-medium">
                  {new Date(p.effective_date).toLocaleDateString()}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {showModal && (
        <PromotionModal
          promotion={editPromotion}
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
