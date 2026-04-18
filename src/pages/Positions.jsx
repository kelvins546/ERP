import { useEffect, useState } from "react";
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

function PosModal({
  pos,
  onClose,
  onSaved,
  departments,
  departmentLinkMode,
}) {
  const [form, setForm] = useState({
    title: "",
    salary_grade: "",
    base_salary_min: "",
    base_salary_max: "",
    department_id: "",
    department_name: "",
    ...pos,
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [cleanForm, setCleanForm] = useState({
    title: "",
    salary_grade: "",
    base_salary_min: "",
    base_salary_max: "",
    department_id: "",
    department_name: "",
    ...pos,
  });

  const validateForm = (currentForm) => {
    const nextErrors = {};

    if (!currentForm.title?.trim()) {
      nextErrors.title = "Position title is required.";
    }

    if (departmentLinkMode === "id" && !currentForm.department_id) {
      nextErrors.department = "Department is required.";
    }

    if (departmentLinkMode === "name" && !currentForm.department_name) {
      nextErrors.department = "Department is required.";
    }

    const minSal = currentForm.base_salary_min
      ? Number(currentForm.base_salary_min)
      : null;
    const maxSal = currentForm.base_salary_max
      ? Number(currentForm.base_salary_max)
      : null;

    if (minSal !== null && maxSal !== null && minSal > maxSal) {
      nextErrors.salary_range = "Minimum salary cannot exceed maximum salary.";
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
    const nextForm = {
      title: "",
      salary_grade: "",
      base_salary_min: "",
      base_salary_max: "",
      department_id: "",
      department_name: "",
      ...pos,
    };

    setForm(nextForm);
    setCleanForm(nextForm);
    setErrors({});
    setTouched({});
    setSubmitted(false);
  }, [pos]);

  const requestSaveConfirmation = () => {
    setSubmitted(true);
    const formErrors = validateForm(form);
    setErrors(formErrors);

    if (Object.keys(formErrors).length === 0) {
      setShowSaveConfirm(true);
    }
  };

  const persistPosition = async () => {
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        salary_grade: form.salary_grade?.trim() || null,
        base_salary_min: form.base_salary_min
          ? Number(form.base_salary_min)
          : null,
        base_salary_max: form.base_salary_max
          ? Number(form.base_salary_max)
          : null,
      };

      if (departmentLinkMode === "id") {
        payload.department_id = form.department_id || null;
      }

      if (departmentLinkMode === "name") {
        payload.department_name = form.department_name || null;
      }

      if (pos?.id) {
        const { error } = await supabase
          .from("positions")
          .update(payload)
          .eq("id", pos.id);

        if (error) {
          if (error.code === "23505") {
            setErrors({ title: "A position with this title already exists." });
          } else {
            throw error;
          }
        } else {
          setShowSaveConfirm(false);
          onSaved();
        }
      } else {
        const { error } = await supabase.from("positions").insert([payload]);

        if (error) {
          if (error.code === "23505") {
            setErrors({ title: "A position with this title already exists." });
          } else {
            throw error;
          }
        } else {
          setShowSaveConfirm(false);
          onSaved();
        }
      }
    } catch (error) {
      console.error("Error saving position:", error.message);
      setErrors({ form: "Failed to save: " + error.message });
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
          <button onClick={handleCloseClick}>
            <X className="w-5 h-5 text-slate-400 hover:text-slate-700" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          {errors.form && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {errors.form}
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-slate-600">
              Position Title *
            </label>
            <Input
              className={`mt-1 ${showError("title") ? "border-red-500" : ""}`}
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
            {showError("title") && (
              <p className="text-xs text-red-600 mt-1">{errors.title}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">
              Department{departmentLinkMode !== "none" ? " *" : ""}
            </label>
            <select
              className={`mt-1 w-full border rounded-lg px-3 py-2 text-sm ${
                showError("department") ? "border-red-500" : "border-slate-200"
              }`}
              value={
                departmentLinkMode === "id"
                  ? form.department_id || ""
                  : form.department_name || ""
              }
              onChange={(e) => {
                if (departmentLinkMode === "id") {
                  set("department_id", e.target.value);
                  const selected = departments.find((d) => d.id === e.target.value);
                  set("department_name", selected?.name || "");
                } else if (departmentLinkMode === "name") {
                  set("department_name", e.target.value);
                }
              }}
              disabled={departmentLinkMode === "none"}
            >
              <option value="">
                {departmentLinkMode === "none"
                  ? "No department link column found"
                  : "Select department"}
              </option>
              {departments.map((dept) => (
                <option
                  key={dept.id}
                  value={departmentLinkMode === "id" ? dept.id : dept.name}
                >
                  {dept.name}
                </option>
              ))}
            </select>
            {showError("department") && (
              <p className="text-xs text-red-600 mt-1">{errors.department}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">Salary Grade</label>
            <Input
              className="mt-1"
              value={form.salary_grade || ""}
              onChange={(e) => set("salary_grade", e.target.value)}
              placeholder="e.g. SG-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600">Min Salary (PHP)</label>
              <Input
                className={`mt-1 ${showError("salary_range") ? "border-red-500" : ""}`}
                type="number"
                value={form.base_salary_min || ""}
                onChange={(e) => set("base_salary_min", e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Max Salary (PHP)</label>
              <Input
                className={`mt-1 ${showError("salary_range") ? "border-red-500" : ""}`}
                type="number"
                value={form.base_salary_max || ""}
                onChange={(e) => set("base_salary_max", e.target.value)}
              />
            </div>
          </div>
          {showError("salary_range") && (
            <p className="text-xs text-red-600">{errors.salary_range}</p>
          )}
        </div>

        <div className="flex justify-end gap-3 p-5 border-t">
          <Button variant="outline" onClick={handleCloseClick}>
            Cancel
          </Button>
          <Button onClick={requestSaveConfirmation} disabled={saving}>
            {saving ? "Saving..." : "Save Position"}
          </Button>
        </div>
      </div>

      <AlertDialog open={showSaveConfirm} onOpenChange={setShowSaveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pos ? "Confirm Position Update" : "Confirm New Position"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pos
                ? "Are you sure the edited position information is correct?"
                : "Are you sure the position information is correct before adding this record?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Review Details</AlertDialogCancel>
            <AlertDialogAction onClick={persistPosition} disabled={saving}>
              {saving ? "Saving..." : pos ? "Confirm Update" : "Confirm Add"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard Changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to close without saving?
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

export default function Positions() {
  const [positions, setPositions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [departmentLinkMode, setDepartmentLinkMode] = useState("none");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editPos, setEditPos] = useState(null);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const detectDepartmentLinkMode = async () => {
    const idProbe = await supabase.from("positions").select("department_id").limit(1);
    if (!idProbe.error) return "id";

    const nameProbe = await supabase
      .from("positions")
      .select("department_name")
      .limit(1);
    if (!nameProbe.error) return "name";

    return "none";
  };

  const load = async () => {
    try {
      setLoading(true);

      const [mode, posResult, deptResult] = await Promise.all([
        detectDepartmentLinkMode(),
        supabase.from("positions").select("*").order("title", { ascending: true }),
        supabase.from("departments").select("id, name").order("name", { ascending: true }),
      ]);

      setDepartmentLinkMode(mode);
      if (posResult.error) throw posResult.error;
      if (deptResult.error) throw deptResult.error;

      setPositions(posResult.data || []);
      setDepartments(deptResult.data || []);
    } catch (error) {
      console.error("Failed to load positions:", error.message);
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
        .from("positions")
        .delete()
        .eq("id", deleteCandidate.id);
      if (error) throw error;
      setDeleteCandidate(null);
      load();
    } catch (error) {
      console.error("Delete failed:", error.message);
      if (error.code === "23503") {
        alert(
          "Cannot delete this position because there are employees assigned to it. Update employee positions first."
        );
      } else {
        alert("Failed to delete position.");
      }
    } finally {
      setDeleting(false);
    }
  };

  const departmentsById = departments.reduce((acc, dept) => {
    acc[dept.id] = dept.name;
    return acc;
  }, {});

  const getDepartmentLabel = (position) => {
    if (departmentLinkMode === "id") {
      return departmentsById[position.department_id] || "—";
    }

    if (departmentLinkMode === "name") {
      return position.department_name || "—";
    }

    return "—";
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

      {departmentLinkMode === "none" && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
          Could not find department link column in positions table. Add either
          department_id or department_name in your database.
        </div>
      )}

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
                  {["Title", "Grade", "Salary Range", "Department", "Actions"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {positions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400">
                      No positions found.
                    </td>
                  </tr>
                ) : (
                  positions.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900 text-sm">
                        {p.title}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {p.salary_grade || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {p.base_salary_min
                          ? `PHP ${Number(p.base_salary_min).toLocaleString()}`
                          : "—"}
                        {p.base_salary_max
                          ? ` - PHP ${Number(p.base_salary_max).toLocaleString()}`
                          : ""}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {getDepartmentLabel(p)}
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
                            onClick={() => setDeleteCandidate(p)}
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
          departments={departments}
          departmentLinkMode={departmentLinkMode}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            load();
          }}
        />
      )}

      <AlertDialog
        open={!!deleteCandidate}
        onOpenChange={() => setDeleteCandidate(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Position</AlertDialogTitle>
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
    </div>
  );
}
