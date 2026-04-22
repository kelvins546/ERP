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

function ProjectSiteModal({ site, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: "",
    location: "",
    address: "",
    description: "",
    ...site,
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [cleanForm, setCleanForm] = useState({
    name: "",
    location: "",
    address: "",
    description: "",
    ...site,
  });

  const validateForm = (currentForm) => {
    const nextErrors = {};

    if (!currentForm.name?.trim()) {
      nextErrors.name = "Project site name is required.";
    }

    if (!currentForm.location?.trim()) {
      nextErrors.location = "Location is required.";
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
    setForm({ name: "", location: "", address: "", description: "", ...site });
    setCleanForm({ name: "", location: "", address: "", description: "", ...site });
    setErrors({});
    setTouched({});
    setSubmitted(false);
  }, [site]);

  const requestSaveConfirmation = () => {
    setSubmitted(true);
    const formErrors = validateForm(form);
    setErrors(formErrors);

    if (Object.keys(formErrors).length === 0) {
      setShowSaveConfirm(true);
    }
  };

  const persistProjectSite = async () => {
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        location: form.location.trim(),
        address: form.address?.trim() || null,
        description: form.description?.trim() || null,
      };

      if (site?.id) {
        const { error } = await supabase
          .from("project_sites")
          .update(payload)
          .eq("id", site.id);

        if (error) {
          if (error.code === "23505") {
            setErrors({ name: "A project site with this name already exists." });
          } else {
            throw error;
          }
        } else {
          setShowSaveConfirm(false);
          onSaved();
        }
      } else {
        const { error } = await supabase.from("project_sites").insert([payload]);

        if (error) {
          if (error.code === "23505") {
            setErrors({ name: "A project site with this name already exists." });
          } else {
            throw error;
          }
        } else {
          setShowSaveConfirm(false);
          onSaved();
        }
      }
    } catch (error) {
      console.error("Error saving project site:", error.message);
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
            {site ? "Edit Project Site" : "Add Project Site"}
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
              Project Site Name *
            </label>
            <Input
              className={`mt-1 ${showError("name") ? "border-red-500" : ""}`}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Site A - Quezon City"
            />
            {showError("name") && (
              <p className="text-xs text-red-600 mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">
              Location *
            </label>
            <Input
              className={`mt-1 ${showError("location") ? "border-red-500" : ""}`}
              value={form.location || ""}
              onChange={(e) => set("location", e.target.value)}
              placeholder="e.g. Quezon City"
            />
            {showError("location") && (
              <p className="text-xs text-red-600 mt-1">{errors.location}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">Address</label>
            <Input
              className="mt-1"
              value={form.address || ""}
              onChange={(e) => set("address", e.target.value)}
              placeholder="e.g. 123 Main St, Barangay, City"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">Description</label>
            <textarea
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              rows={3}
              value={form.description || ""}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Optional notes about this site"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 p-5 border-t">
          <Button variant="outline" onClick={handleCloseClick}>
            Cancel
          </Button>
          <Button onClick={requestSaveConfirmation} disabled={saving}>
            {saving ? "Saving..." : "Save Project Site"}
          </Button>
        </div>
      </div>

      <AlertDialog open={showSaveConfirm} onOpenChange={setShowSaveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {site ? "Confirm Project Site Update" : "Confirm New Project Site"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {site
                ? "Are you sure the edited project site information is correct?"
                : "Are you sure the project site information is correct before adding this record?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Review Details</AlertDialogCancel>
            <AlertDialogAction onClick={persistProjectSite} disabled={saving}>
              {saving ? "Saving..." : site ? "Confirm Update" : "Confirm Add"}
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

export default function ProjectSites() {
  const [sites, setSites] = useState([]);
  const [locationOptions, setLocationOptions] = useState([]);
  const [locationFilter, setLocationFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editSite, setEditSite] = useState(null);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setLoadError("");

      const { data, error } = await supabase
        .from("project_sites")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      const rows = data || [];
      setSites(rows);

      const uniqueLocations = [
        ...new Set(
          rows
            .map((row) => String(row.location || "").trim())
            .filter(Boolean)
        ),
      ].sort((a, b) => a.localeCompare(b));
      setLocationOptions(uniqueLocations);
    } catch (error) {
      console.error("Failed to load project sites:", error.message);
      setLoadError(error.message || "Failed to load project sites.");
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
        .from("project_sites")
        .delete()
        .eq("id", deleteCandidate.id);

      if (error) throw error;
      setDeleteCandidate(null);
      load();
    } catch (error) {
      console.error("Delete failed:", error.message);
      if (error.code === "23503") {
        alert(
          "Cannot delete this project site because it is being used by related records."
        );
      } else {
        alert("Failed to delete project site.");
      }
    } finally {
      setDeleting(false);
    }
  };

  const filteredSites = sites.filter((site) => {
    const matchLocation =
      locationFilter === "all" ? true : site.location === locationFilter;
    const term = search.trim().toLowerCase();
    const matchSearch =
      !term ||
      (site.name || "").toLowerCase().includes(term) ||
      (site.location || "").toLowerCase().includes(term) ||
      (site.address || "").toLowerCase().includes(term) ||
      (site.description || "").toLowerCase().includes(term);

    return matchLocation && matchSearch;
  });

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Project Sites</h1>
          <p className="text-slate-500 text-sm">{sites.length} total project sites</p>
        </div>
        <Button
          onClick={() => {
            setEditSite(null);
            setShowModal(true);
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" /> Add Project Site
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by name, location, address, or description..."
            className="pl-9 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={locationFilter} onValueChange={setLocationFilter}>
          <SelectTrigger className="w-full sm:w-[220px] border-slate-200 bg-white text-sm">
            <SelectValue placeholder="All Locations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {locationOptions.map((location) => (
              <SelectItem key={location} value={location}>
                {location}
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
              Error loading project sites: {loadError}
            </div>
          )}

          {filteredSites.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <p>No project sites found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {["Project Site", "Location", "Address", "Description", "Actions"].map((h) => (
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
                  {filteredSites.map((site) => (
                    <tr key={site.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{site.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{site.location || "—"}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{site.address || "—"}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 max-w-xs">
                        <p className="truncate" title={site.description || "—"}>
                          {site.description || "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditSite(site);
                              setShowModal(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit Project Site"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteCandidate(site)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete Project Site"
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
        <ProjectSiteModal
          site={editSite}
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
            <AlertDialogTitle>Delete Project Site</AlertDialogTitle>
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
