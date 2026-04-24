import { useState, useEffect } from "react";
import { supabase } from "@/api/base44Client";
import { Plus, X, TrendingUp, Edit, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- CUSTOM MODALS ---
function CustomAlert({ isOpen, title, message, onClose }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
          <AlertCircle className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 mb-6">{message}</p>
        <Button
          onClick={onClose}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white"
        >
          Acknowledge
        </Button>
      </div>
    </div>
  );
}

function CustomConfirm({ isOpen, title, message, onCancel, onConfirm }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
          <AlertCircle className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 mb-6">{message}</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} className="w-full">
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            Confirm Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- THE MODAL (CREATE & UPDATE) ---
function PromotionModal({
  promotion,
  employeesList,
  positionsList,
  empPosMap,
  onClose,
  onSaved,
}) {
  const [form, setForm] = useState({
    employee_id: "",
    previous_position_id: "",
    new_position_id: "",
    effective_date: "",
    remarks: "",
    ...promotion,
  });

  const [saving, setSaving] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // THE MAGIC AUTO-FETCH ENGINE
  const handleEmployeeChange = (e) => {
    const empId = e.target.value;
    const emp = employeesList.find((x) => x.id === empId);

    // Tier 1: Check direct employee table
    let prevPosId = emp?.position_id;

    // Tier 2: Fallback to link table
    if (!prevPosId && empPosMap[empId]) {
      prevPosId = empPosMap[empId];
    }

    setForm((f) => ({
      ...f,
      employee_id: empId,
      previous_position_id: prevPosId || "",
    }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        employee_id: form.employee_id || null,
        previous_position_id: form.previous_position_id || null,
        new_position_id: form.new_position_id || null,
        effective_date: form.effective_date,
        remarks: form.remarks,
      };

      if (promotion?.id) {
        const { error } = await supabase
          .from("promotion_history")
          .update(payload)
          .eq("id", promotion.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("promotion_history")
          .insert([payload]);
        if (error) throw error;
      }
      onSaved();
    } catch (error) {
      setAlertConfig({
        isOpen: true,
        title: "Save Failed",
        message: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
          <div className="flex items-center justify-between p-5 border-b">
            <h2 className="text-lg font-semibold">
              {promotion ? "Edit Record" : "New Promotion"}
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-600">
                Employee *
              </label>
              <select
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus-visible:ring-[#2E6F40]"
                value={form.employee_id || ""}
                onChange={handleEmployeeChange}
              >
                <option value="">-- Select Employee --</option>
                {employeesList.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 flex items-center gap-2">
                  Previous Position
                  {form.employee_id && form.previous_position_id && (
                    <span className="text-[9px] bg-[#2E6F40]/10 text-[#2E6F40] px-2 py-0.5 rounded-full">
                      Auto-Detected
                    </span>
                  )}
                </label>
                <select
                  className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus-visible:ring-[#2E6F40]"
                  value={form.previous_position_id || ""}
                  onChange={(e) => set("previous_position_id", e.target.value)}
                >
                  <option value="">-- None / Select Position --</option>
                  {positionsList.map((pos) => (
                    <option key={pos.id} value={pos.id}>
                      {pos.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-[#2E6F40] uppercase tracking-wider">
                  New Promoted Position *
                </label>
                <select
                  className="mt-1 w-full border border-[#2E6F40]/30 shadow-sm rounded-lg px-3 py-2 text-sm bg-white focus-visible:ring-[#2E6F40]"
                  value={form.new_position_id || ""}
                  onChange={(e) => set("new_position_id", e.target.value)}
                >
                  <option value="">-- Assign New Position --</option>
                  {positionsList.map((pos) => (
                    <option key={pos.id} value={pos.id}>
                      {pos.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600">
                Effective Date *
              </label>
              <Input
                className="mt-1 focus-visible:ring-[#2E6F40]"
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
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus-visible:ring-[#2E6F40]"
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
              className="bg-[#2E6F40] hover:bg-[#235330] text-white"
              onClick={save}
              disabled={
                saving ||
                !form.employee_id ||
                !form.effective_date ||
                !form.new_position_id
              }
            >
              {saving ? "Saving..." : "Save Record"}
            </Button>
          </div>
        </div>
      </div>
      <CustomAlert
        isOpen={alertConfig.isOpen}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() =>
          setAlertConfig({ isOpen: false, title: "", message: "" })
        }
      />
    </>
  );
}

// --- THE MAIN PAGE ---
export default function Promotions() {
  const [promotions, setPromotions] = useState([]);
  const [employeesList, setEmployeesList] = useState([]);
  const [positionsList, setPositionsList] = useState([]);
  const [positionsById, setPositionsById] = useState({});
  const [empPosMap, setEmpPosMap] = useState({});

  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editPromotion, setEditPromotion] = useState(null);

  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
  });
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    idToDelete: null,
  });

  const load = async () => {
    try {
      setLoading(true);

      // 1. Fetch Promotions
      const { data: promData, error: promErr } = await supabase
        .from("promotion_history")
        .select("*, employees(first_name, last_name)")
        .order("effective_date", { ascending: false })
        .limit(200);
      if (promErr) throw promErr;
      setPromotions(promData || []);

      // 2. Fetch Employees
      const { data: empData, error: empErr } = await supabase
        .from("employees")
        .select("id, first_name, last_name, position_id")
        .order("first_name", { ascending: true });
      if (empErr) throw empErr;
      setEmployeesList(empData || []);

      // 3. Fetch Positions for the Dropdowns & Mapping
      const { data: posData, error: posErr } = await supabase
        .from("positions")
        .select("id, title")
        .order("title", { ascending: true });
      if (posErr) throw posErr;

      setPositionsList(posData || []);
      const pMap = {};
      (posData || []).forEach((p) => (pMap[p.id] = p.title));
      setPositionsById(pMap);

      // 4. Fetch Link Table for Fallback Detection
      const { data: linkData } = await supabase
        .from("employee_positions")
        .select("employee_id, position_id");
      const linkMap = {};
      if (linkData) {
        linkData.forEach((row) => {
          if (!linkMap[row.employee_id])
            linkMap[row.employee_id] = row.position_id;
        });
      }
      setEmpPosMap(linkMap);
    } catch (error) {
      setAlertConfig({
        isOpen: true,
        title: "Load Failed",
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const triggerDelete = (id) =>
    setConfirmConfig({ isOpen: true, idToDelete: id });

  const executeDelete = async () => {
    const id = confirmConfig.idToDelete;
    setConfirmConfig({ isOpen: false, idToDelete: null });
    try {
      const { error } = await supabase
        .from("promotion_history")
        .delete()
        .eq("id", id);
      if (error) throw error;
      load();
    } catch (error) {
      setAlertConfig({
        isOpen: true,
        title: "Delete Failed",
        message: "Failed to delete promotion record.",
      });
    }
  };

  return (
    <>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">
            Promotion History
          </h1>
          <Button
            onClick={() => {
              setEditPromotion(null);
              setShowModal(true);
            }}
            className="bg-[#2E6F40] hover:bg-[#235330] text-white gap-2"
          >
            <Plus className="w-4 h-4" /> Add Promotion
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#2E6F40]/30 border-t-[#2E6F40] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {promotions.length === 0 ? (
              <div className="text-center py-16 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-white">
                No promotions on record.
              </div>
            ) : (
              promotions.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 bg-[#2E6F40]/10 rounded-full flex items-center justify-center shrink-0 border border-[#2E6F40]/20">
                    <TrendingUp className="w-6 h-6 text-[#2E6F40]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900 text-lg">
                      {p.employees
                        ? `${p.employees.first_name} ${p.employees.last_name}`
                        : "Unknown Employee"}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-sm font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                        {positionsById[p.previous_position_id] || "—"}
                      </span>
                      <span className="text-sm text-slate-400">→</span>
                      <span className="text-sm font-bold text-[#2E6F40] bg-[#2E6F40]/10 px-2 py-0.5 rounded-md border border-[#2E6F40]/20">
                        {positionsById[p.new_position_id] || "—"}
                      </span>
                    </div>
                    {p.remarks && (
                      <p className="text-xs text-slate-500 mt-2 italic">
                        "{p.remarks}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-6 shrink-0 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="text-center px-2 border-r border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Effective
                      </p>
                      <p className="font-semibold text-slate-800">
                        {new Date(p.effective_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditPromotion(p);
                          setShowModal(true);
                        }}
                        className="p-2 text-slate-400 hover:text-[#2E6F40] hover:bg-[#2E6F40]/10 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => triggerDelete(p.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
          <PromotionModal
            promotion={editPromotion}
            employeesList={employeesList}
            positionsList={positionsList}
            empPosMap={empPosMap}
            onClose={() => setShowModal(false)}
            onSaved={() => {
              setShowModal(false);
              load();
            }}
          />
        )}
      </div>
      <CustomAlert
        isOpen={alertConfig.isOpen}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() =>
          setAlertConfig({ isOpen: false, title: "", message: "" })
        }
      />
      <CustomConfirm
        isOpen={confirmConfig.isOpen}
        title="Delete Promotion Record"
        message="Are you sure you want to permanently delete this promotion history record?"
        onCancel={() => setConfirmConfig({ isOpen: false, idToDelete: null })}
        onConfirm={executeDelete}
      />
    </>
  );
}
