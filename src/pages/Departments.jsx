import { useEffect, useState } from "react";
import { supabase } from "@/api/base44Client";
import { Plus, Search, Edit, Trash2, X } from "lucide-react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function DeptModal({
  dept,
  onClose,
  onSaved,
  projectSites,
  projectSiteLinkMode,
}) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    head_employee_id: "",
    project_site_id: "",
    project_site_name: "",
    ...dept,
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [cleanForm, setCleanForm] = useState({
    name: "",
    description: "",
    head_employee_id: "",
    project_site_id: "",
    project_site_name: "",
    ...dept,
  });

  const validateForm = (currentForm) => {
    const nextErrors = {};
    if (!currentForm.name?.trim()) {
      nextErrors.name = "Department name is required.";
    }

    if (projectSiteLinkMode === "id" && !currentForm.project_site_id) {
      nextErrors.project_site = "Project site is required.";
    }

    if (projectSiteLinkMode === "name" && !currentForm.project_site_name) {
      nextErrors.project_site = "Project site is required.";
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
      name: "",
      description: "",
      head_employee_id: "",
      project_site_id: "",
      project_site_name: "",
      ...dept,
    };

    setForm(nextForm);
    setCleanForm(nextForm);
    setErrors({});
    setTouched({});
    setSubmitted(false);
  }, [dept]);

  const requestSaveConfirmation = () => {
    setSubmitted(true);
    const formErrors = validateForm(form);
    setErrors(formErrors);
    if (Object.keys(formErrors).length === 0) {
      setShowSaveConfirm(true);
    }
  };

  const persistDept = async () => {
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description?.trim() || null,
        head_employee_id: form.head_employee_id?.trim() || null,
      };

      if (projectSiteLinkMode === "id") {
        payload.project_site_id = form.project_site_id || null;
      }

      if (projectSiteLinkMode === "name") {
        payload.project_site_name = form.project_site_name || null;
      }

      if (dept?.id) {
        const { error } = await supabase
          .from("departments")
          .update(payload)
          .eq("id", dept.id);
        if (error) {
          if (error.code === "23505") {
            setErrors({ name: "A department with this name already exists." });
          } else {
            throw error;
          }
        } else {
          setShowSaveConfirm(false);
          onSaved();
        }
      } else {
        const { error } = await supabase.from("departments").insert([payload]);
        if (error) {
          if (error.code === "23505") {
            setErrors({ name: "A department with this name already exists." });
          } else {
            throw error;
          }
        } else {
          setShowSaveConfirm(false);
          onSaved();
        }
      }
    } catch (error) {
      console.error("Error saving department:", error.message);
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
            {dept ? "Edit Department" : "Add Department"}
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
              Department Name *
            </label>
            <Input
              className={`mt-1 ${showError("name") ? "border-red-500" : ""}`}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Human Resources"
            />
            {showError("name") && (
              <p className="text-xs text-red-600 mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">
              Project Site{projectSiteLinkMode !== "none" ? " *" : ""}
            </label>
            <Select
              value={
                (projectSiteLinkMode === "id"
                  ? form.project_site_id
                  : form.project_site_name) || "__none__"
              }
              onValueChange={(value) => {
                if (value === "__none__") {
                  set("project_site_id", "");
                  set("project_site_name", "");
                  return;
                }

                if (projectSiteLinkMode === "id") {
                  set("project_site_id", value);
                  const selected = projectSites.find((s) => String(s.id) === String(value));
                  set("project_site_name", selected?.name || "");
                } else if (projectSiteLinkMode === "name") {
                  set("project_site_name", value);
                }
              }}
              disabled={projectSiteLinkMode === "none"}
            >
              <SelectTrigger
                className={`mt-1 w-full ${showError("project_site") ? "border-red-500" : "border-slate-200"}`}
              >
                <SelectValue
                  placeholder={
                    projectSiteLinkMode === "none"
                      ? "No project site link column found"
                      : "Select project site"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">
                  {projectSiteLinkMode === "none"
                    ? "No project site link column found"
                    : "Select project site"}
                </SelectItem>
                {projectSites.map((site) => (
                  <SelectItem
                    key={site.id}
                    value={String(projectSiteLinkMode === "id" ? site.id : site.name)}
                  >
                    {site.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {showError("project_site") && (
              <p className="text-xs text-red-600 mt-1">{errors.project_site}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">
              Department Head ID (UUID)
            </label>
            <Input
              className="mt-1"
              value={form.head_employee_id || ""}
              onChange={(e) => set("head_employee_id", e.target.value)}
              placeholder="Leave blank for now"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">Description</label>
            <textarea
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              rows={3}
              value={form.description || ""}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 p-5 border-t">
          <Button variant="outline" onClick={handleCloseClick}>
            Cancel
          </Button>
          <Button onClick={requestSaveConfirmation} disabled={saving}>
            {saving ? "Saving..." : "Save Department"}
          </Button>
        </div>
      </div>

      <AlertDialog open={showSaveConfirm} onOpenChange={setShowSaveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dept ? "Confirm Department Update" : "Confirm New Department"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dept
                ? "Are you sure the edited department information is correct?"
                : "Are you sure the department information is correct before adding this record?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Review Details</AlertDialogCancel>
            <AlertDialogAction onClick={persistDept} disabled={saving}>
              {saving ? "Saving..." : dept ? "Confirm Update" : "Confirm Add"}
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

export default function Departments() {
  const [depts, setDepts] = useState([]);
  const [projectSites, setProjectSites] = useState([]);
  const [projectSiteLinkMode, setProjectSiteLinkMode] = useState("none");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editDept, setEditDept] = useState(null);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const detectProjectSiteLinkMode = async () => {
    const idProbe = await supabase
      .from("departments")
      .select("project_site_id")
      .limit(1);
    if (!idProbe.error) return "id";

    const nameProbe = await supabase
      .from("departments")
      .select("project_site_name")
      .limit(1);
    if (!nameProbe.error) return "name";

    return "none";
  };

  const load = async () => {
    try {
      setLoading(true);
      setLoadError("");

      const [mode, deptResult, siteResult] = await Promise.all([
        detectProjectSiteLinkMode(),
        supabase.from("departments").select("*").order("name", { ascending: true }),
        supabase.from("project_sites").select("id, name, location").order("name", { ascending: true }),
      ]);

      setProjectSiteLinkMode(mode);
      if (deptResult.error) throw deptResult.error;
      if (siteResult.error) throw siteResult.error;

      setDepts(deptResult.data || []);
      setProjectSites(siteResult.data || []);
    } catch (error) {
      console.error("Failed to load departments:", error.message);
      setLoadError(error.message || "Failed to load departments.");
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
        .from("departments")
        .delete()
        .eq("id", deleteCandidate.id);
      if (error) throw error;
      setDeleteCandidate(null);
      load();
    } catch (error) {
      console.error("Delete failed:", error.message);
      if (error.code === "23503") {
        alert(
          "Cannot delete this department because there are employees assigned to it. Move the employees first."
        );
      } else {
        alert("Failed to delete department.");
      }
    } finally {
      setDeleting(false);
    }
  };

  const projectSitesById = projectSites.reduce((acc, site) => {
    acc[site.id] = site;
    return acc;
  }, {});

  const getProjectSiteLabel = (dept) => {
    if (projectSiteLinkMode === "id") {
      const site = projectSitesById[dept.project_site_id];
      return site ? `${site.name}${site.location ? ` (${site.location})` : ""}` : "—";
    }

    if (projectSiteLinkMode === "name") {
      return dept.project_site_name || "—";
    }

    return "—";
  };

  const filtered = depts.filter((dept) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;

    return (
      (dept.name || "").toLowerCase().includes(term) ||
      (dept.description || "").toLowerCase().includes(term) ||
      getProjectSiteLabel(dept).toLowerCase().includes(term)
    );
  });

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Departments</h1>
          <p className="text-slate-500 text-sm">{depts.length} total departments</p>
        </div>
        <Button
          onClick={() => {
            setEditDept(null);
            setShowModal(true);
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" /> Add Department
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by department, description, or project site..."
            className="pl-9 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {projectSiteLinkMode === "none" && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
          Could not find project site link column in departments table. Add either
          project_site_id or project_site_name in your database.
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {loadError && (
            <div className="mx-4 mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              Error loading departments: {loadError}
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <p>No departments found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {["Department", "Project Site", "Head", "Description", "Actions"].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{d.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{getProjectSiteLabel(d)}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {d.head_employee_id ? (
                          <span title={d.head_employee_id}>{d.head_employee_id.substring(0, 8)}...</span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 max-w-xs">
                        <p className="truncate" title={d.description || "—"}>
                          {d.description || "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditDept(d);
                              setShowModal(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit Department"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteCandidate(d)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete Department"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <DeptModal
          dept={editDept}
          projectSites={projectSites}
          projectSiteLinkMode={projectSiteLinkMode}
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
            <AlertDialogTitle>Delete Department</AlertDialogTitle>
            <AlertDialogDescription>
              Delete {deleteCandidate?.name}? This action cannot be undone.
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
