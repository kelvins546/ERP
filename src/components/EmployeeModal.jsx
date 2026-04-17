import { useEffect, useState } from "react";
import { supabase } from "@/api/base44Client";
import { X } from "lucide-react";
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

const GOVERNMENT_ID_RULES = {
  sss_number: { label: "SSS", lengths: [10] },
  philhealth_number: { label: "PhilHealth", lengths: [12] },
  pagibig_number: { label: "Pag-IBIG", lengths: [12] },
  tin_number: { label: "TIN", lengths: [9, 12] },
};

const initialForm = {
  employee_code: "",
  first_name: "",
  last_name: "",
  middle_name: "",
  email: "",
  phone: "+63",
  department_id: "",
  project_site_id: "",
  project_site_name: "",
  position_id: "",
  status: "probationary",
  hire_date: "",
  address: "",
  sss_number: "",
  philhealth_number: "",
  pagibig_number: "",
  tin_number: "",
  emergency_contact_name: "",
  emergency_contact_phone: "+63",
};

const POSITION_LINK_TABLE_CANDIDATES = [
  "employee_positions",
  "employee_position_assignments",
];

export default function EmployeeModal({ employee, onClose, onSaved }) {
  const isEditing = Boolean(employee?.id);
  const [form, setForm] = useState({ ...initialForm, ...employee });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [projectSites, setProjectSites] = useState([]);
  const [projectSiteLinkMode, setProjectSiteLinkMode] = useState("id");
  const [positions, setPositions] = useState([]);
  const [multiPositionMode, setMultiPositionMode] = useState(false);
  const [positionLinkTable, setPositionLinkTable] = useState(null);
  const [selectedPositionIds, setSelectedPositionIds] = useState([]);
  const [cleanForm, setCleanForm] = useState({ ...initialForm, ...employee });

  const normalizePhoneInput = (value) => {
    let digits = String(value || "").replace(/\D/g, "");

    if (digits.startsWith("63")) digits = digits.slice(2);
    if (digits.startsWith("0")) digits = digits.slice(1);

    digits = digits.slice(0, 10);
    return digits ? `+63${digits}` : "+63";
  };

  const isValidEmail = (value) => {
    const email = String(value || "").trim();
    if (!email) return true;

    const basicEmailRegex = /^[A-Za-z0-9._%+-]+@([A-Za-z0-9-]+\.)+[A-Za-z]{2,}$/;
    if (!basicEmailRegex.test(email)) return false;

    const domain = email.split("@")[1]?.toLowerCase() || "";
    if (!domain || domain.includes("..") || domain.startsWith("-") || domain.endsWith("-")) {
      return false;
    }

    return true;
  };

  const validatePhone = (value, isRequired = false) => {
    if (!value || value === "+63") return isRequired ? "Phone number is required." : null;

    if (!value.startsWith("+63")) {
      return "Phone number must start with +63.";
    }

    const digits = value.slice(3);
    if (!/^\d+$/.test(digits)) {
      return "Phone number accepts numbers only.";
    }

    if (digits.length !== 10) {
      return "Phone number must be +63 followed by 10 digits.";
    }

    return null;
  };

  const validateGovernmentId = (key, value) => {
    if (!value) return null;

    const cleaned = String(value).replace(/\D/g, "");
    const rule = GOVERNMENT_ID_RULES[key];

    if (!rule) return null;
    if (!rule.lengths.includes(cleaned.length)) {
      return `${rule.label} must be ${rule.lengths.join(" or ")} digits.`;
    }

    return null;
  };

  const validateForm = (currentForm) => {
    const nextErrors = {};

    if (!currentForm.employee_code?.trim()) nextErrors.employee_code = "Employee code is required.";
    if (!currentForm.first_name?.trim()) nextErrors.first_name = "First name is required.";
    if (!currentForm.last_name?.trim()) nextErrors.last_name = "Last name is required.";
    if (!currentForm.status?.trim()) nextErrors.status = "Employment status is required.";

    if (currentForm.email && !isValidEmail(currentForm.email)) {
      nextErrors.email = "Enter a valid email with a valid domain (e.g. name@company.com).";
    }

    if (currentForm.hire_date) {
      const selectedDate = new Date(currentForm.hire_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate > today) {
        nextErrors.hire_date = "Hire date cannot be in the future.";
      }
    }

    const phoneError = validatePhone(currentForm.phone, false);
    if (phoneError) nextErrors.phone = phoneError;

    if (currentForm.emergency_contact_name && !currentForm.emergency_contact_phone) {
      nextErrors.emergency_contact_phone = "Emergency contact phone is required when contact name is provided.";
    } else {
      const emergencyPhoneError = validatePhone(currentForm.emergency_contact_phone, false);
      if (emergencyPhoneError) nextErrors.emergency_contact_phone = emergencyPhoneError;
    }

    Object.keys(GOVERNMENT_ID_RULES).forEach((key) => {
      const idError = validateGovernmentId(key, currentForm[key]);
      if (idError) nextErrors[key] = idError;
    });

    return nextErrors;
  };

  const set = (key, rawValue) => {
    let value = rawValue;

    if (key === "phone" || key === "emergency_contact_phone") {
      value = normalizePhoneInput(rawValue);
    }

    if (GOVERNMENT_ID_RULES[key]) {
      value = String(rawValue || "").replace(/\D/g, "").slice(0, 12);
    }

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
    setForm({ ...initialForm, ...employee });
    setCleanForm({ ...initialForm, ...employee });
    setSelectedPositionIds([]);
    setErrors({});
    setTouched({});
    setSubmitted(false);
  }, [employee]);

  useEffect(() => {
    const loadLookups = async () => {
      const [deptResult, posResult, siteResult, projectSiteIdProbe, projectSiteNameProbe] = await Promise.all([
        supabase.from("departments").select("id, name").order("name"),
        supabase.from("positions").select("id, title").order("title"),
        supabase.from("project_sites").select("id, name, location").order("name"),
        supabase.from("employees").select("project_site_id").limit(1),
        supabase.from("employees").select("project_site_name").limit(1),
      ]);

      if (!deptResult.error) setDepartments(deptResult.data || []);
      if (!posResult.error) setPositions(posResult.data || []);
      if (!siteResult.error) setProjectSites(siteResult.data || []);
      if (!projectSiteIdProbe.error) setProjectSiteLinkMode("id");
      else if (!projectSiteNameProbe.error) setProjectSiteLinkMode("name");
      else setProjectSiteLinkMode("none");

      for (const tableName of POSITION_LINK_TABLE_CANDIDATES) {
        const probe = await supabase
          .from(tableName)
          .select("employee_id, position_id")
          .limit(1);
        if (!probe.error) {
          setMultiPositionMode(true);
          setPositionLinkTable(tableName);
          break;
        }
      }
    };

    loadLookups();
  }, []);

  const normalize = (v) => {
    if (typeof v !== "string") return v;
    const trimmed = v.trim();
    return trimmed === "" || trimmed === "+63" ? null : trimmed;
  };

  const persistEmployee = async () => {
    setSaving(true);
    try {
      const primaryPositionId =
        !isEditing && multiPositionMode
          ? selectedPositionIds[0] || null
          : normalize(form.position_id);

      const payload = {
        employee_code: normalize(form.employee_code),
        first_name: normalize(form.first_name),
        last_name: normalize(form.last_name),
        middle_name: normalize(form.middle_name),
        email: normalize(form.email),
        phone: normalize(form.phone),
        department_id: normalize(form.department_id),
        position_id: primaryPositionId,
        status: normalize(form.status),
        hire_date: normalize(form.hire_date),
        address: normalize(form.address),
        sss_number: normalize(form.sss_number),
        philhealth_number: normalize(form.philhealth_number),
        pagibig_number: normalize(form.pagibig_number),
        tin_number: normalize(form.tin_number),
        emergency_contact_name: normalize(form.emergency_contact_name),
        emergency_contact_phone: normalize(form.emergency_contact_phone),
      };

      if (projectSiteLinkMode === "id") {
        payload.project_site_id = normalize(form.project_site_id);
      } else if (projectSiteLinkMode === "name") {
        payload.project_site_name = normalize(form.project_site_name);
      }

      if (employee?.id) {
        const { error } = await supabase
          .from("employees")
          .update(payload)
          .eq("id", employee.id);
        if (error) throw error;
      } else {
        const { data: insertedEmployee, error } = await supabase
          .from("employees")
          .insert([payload])
          .select("id")
          .single();
        if (error) throw error;

        if (
          multiPositionMode &&
          positionLinkTable &&
          insertedEmployee?.id &&
          selectedPositionIds.length > 0
        ) {
          const rows = selectedPositionIds.map((positionId) => ({
            employee_id: insertedEmployee.id,
            position_id: positionId,
          }));

          const { error: positionsError } = await supabase
            .from(positionLinkTable)
            .insert(rows);
          if (positionsError) throw positionsError;
        }
      }

      onSaved();
    } catch (error) {
      console.error("Failed to save employee:", error.message);
      if (error.code === "23505") {
        setErrors((prev) => ({
          ...prev,
          employee_code: "Employee code already exists.",
        }));
      } else {
        alert(`Failed to save employee: ${error.message}`);
      }
    } finally {
      setSaving(false);
      setShowSaveConfirm(false);
    }
  };

  const requestSaveConfirmation = () => {
    const nextErrors = validateForm(form);
    setErrors(nextErrors);
    setSubmitted(true);
    if (Object.keys(nextErrors).length > 0) return;
    setShowSaveConfirm(true);
  };

  const fields = [
    { key: "employee_code", label: "Employee Code", required: true },
    { key: "first_name", label: "First Name", required: true },
    { key: "last_name", label: "Last Name", required: true },
    { key: "middle_name", label: "Middle Name" },
    { key: "email", label: "Email", type: "email" },
    { key: "phone", label: "Phone" },
    { key: "hire_date", label: "Hire Date", type: "date" },
    { key: "address", label: "Address" },
    { key: "sss_number", label: "SSS Number" },
    { key: "philhealth_number", label: "PhilHealth Number" },
    { key: "pagibig_number", label: "Pag-IBIG Number" },
    { key: "tin_number", label: "TIN Number" },
    { key: "emergency_contact_name", label: "Emergency Contact" },
    { key: "emergency_contact_phone", label: "Emergency Contact Phone" },
  ];

  const selectedProjectSiteValue =
    projectSiteLinkMode === "id"
      ? form.project_site_id || ""
      : form.project_site_name || "";
  const hasProjectSiteSelection = Boolean(selectedProjectSiteValue);
  const hasDepartmentSelection = Boolean(form.department_id || form.department_name);

  const selectedDepartmentName =
    departments.find((dept) => String(dept.id) === String(form.department_id))?.name ||
    form.department_name ||
    "";

  const departmentFilteredPositions = positions.filter((position) => {
    if (!hasDepartmentSelection) return false;

    const positionDepartmentId = position.department_id
      ? String(position.department_id)
      : "";
    const positionDepartmentName = position.department_name
      ? String(position.department_name).trim().toLowerCase()
      : "";

    if (form.department_id && positionDepartmentId) {
      return String(form.department_id) === positionDepartmentId;
    }

    if (selectedDepartmentName && positionDepartmentName) {
      return selectedDepartmentName.trim().toLowerCase() === positionDepartmentName;
    }

    return false;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold">{employee ? "Edit Employee" : "Add Employee"}</h2>
          <button onClick={handleCloseClick}><X className="w-5 h-5 text-slate-400 hover:text-slate-700" /></button>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map((f) => (
              <div key={f.key}>
                <label className="block text-xs font-medium text-slate-600 mb-1">{f.label}{f.required && " *"}</label>
                {f.key === "project_site_id" ? (
                  <select
                    value={form.project_site_id || ""}
                    onChange={(e) => set("project_site_id", e.target.value)}
                    onBlur={() => setTouched((prev) => ({ ...prev, project_site_id: true }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Select project site</option>
                    {projectSites.map((site) => (
                      <option key={site.id} value={site.id}>
                        {site.name}{site.location ? ` - ${site.location}` : ""}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    type={f.type || "text"}
                    value={form[f.key] || ""}
                    onChange={(e) => set(f.key, e.target.value)}
                    onBlur={() => setTouched((prev) => ({ ...prev, [f.key]: true }))}
                    placeholder={f.label}
                    inputMode={
                      f.key === "phone" || f.key === "emergency_contact_phone"
                        ? "numeric"
                        : GOVERNMENT_ID_RULES[f.key]
                          ? "numeric"
                          : undefined
                    }
                    className={showError(f.key) ? "border-red-400 focus-visible:ring-red-400" : ""}
                  />
                )}
                {showError(f.key) && (
                  <p className="mt-1 text-xs text-red-600">{errors[f.key]}</p>
                )}
              </div>
            ))}
            {!isEditing && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Project Site  (Optional)</label>
                  {projectSiteLinkMode === "none" ? (
                    <div className="w-full border border-dashed border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-500">
                      Project site column is not available in the employees table.
                    </div>
                  ) : (
                    <select
                      value={
                        projectSiteLinkMode === "id"
                          ? form.project_site_id || ""
                          : form.project_site_name || ""
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        setForm((prev) => ({
                          ...prev,
                          project_site_id: projectSiteLinkMode === "id" ? value : prev.project_site_id,
                          project_site_name: projectSiteLinkMode === "name" ? value : prev.project_site_name,
                          department_id: "",
                          position_id: "",
                        }));
                        setSelectedPositionIds([]);
                        setTouched((prev) => ({ ...prev, project_site_id: true }));
                      }}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="">Select project site</option>
                      {projectSites.map((site) => (
                        <option
                          key={site.id}
                          value={projectSiteLinkMode === "id" ? site.id : site.name}
                        >
                          {site.name}{site.location ? ` - ${site.location}` : ""}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Department (Optional)</label>
                  <select
                    value={form.department_id || ""}
                    disabled={!hasProjectSiteSelection}
                    onChange={(e) => {
                      const id = e.target.value;
                      setForm((prev) => ({
                        ...prev,
                        department_id: id,
                        position_id: "",
                      }));
                      setSelectedPositionIds([]);
                      setTouched((prev) => ({ ...prev, department_id: true }));
                    }}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <option value="">
                      {hasProjectSiteSelection ? "Select department" : "Select project site first"}
                    </option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Position (Optional)</label>
                  {multiPositionMode ? (
                    <div className="border border-slate-200 rounded-lg p-2">
                      <select
                        multiple
                        disabled={!hasDepartmentSelection}
                        value={selectedPositionIds}
                        onChange={(e) => {
                          const values = Array.from(e.target.selectedOptions).map((opt) => opt.value);
                          setSelectedPositionIds(values);
                          setTouched((prev) => ({ ...prev, position_id: true }));
                        }}
                        className="w-full min-h-[120px] border border-slate-200 rounded-lg px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        {departmentFilteredPositions.map((position) => (
                          <option key={position.id} value={String(position.id)}>
                            {position.title}
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {hasDepartmentSelection
                          ? "Hold Ctrl (Windows) or Cmd (Mac) to select multiple roles."
                          : "Select a department first before assigning position."}
                      </p>
                    </div>
                  ) : (
                    <select
                      disabled={!hasDepartmentSelection}
                      value={form.position_id || ""}
                      onChange={(e) => {
                        const id = e.target.value;
                        setForm((prev) => ({
                          ...prev,
                          position_id: id,
                        }));
                        setTouched((prev) => ({ ...prev, position_id: true }));
                      }}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <option value="">
                        {hasDepartmentSelection ? "Select position" : "Select department first"}
                      </option>
                      {departmentFilteredPositions.map((position) => (
                        <option key={position.id} value={position.id}>{position.title}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Employment Status *</label>
                  <select
                    value={form.status}
                    onChange={(e) => set("status", e.target.value)}
                    onBlur={() => setTouched((prev) => ({ ...prev, status: true }))}
                    className={`w-full border rounded-lg px-3 py-2 text-sm ${showError("status") ? "border-red-400" : "border-slate-200"}`}
                  >
                    {["probationary", "regular", "contractual", "resigned", "terminated"].map((s) => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                  {showError("status") && (
                    <p className="mt-1 text-xs text-red-600">{errors.status}</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t">
          <Button variant="outline" onClick={handleCloseClick}>Cancel</Button>
          <Button onClick={requestSaveConfirmation} disabled={saving}>{saving ? "Saving..." : "Save Employee"}</Button>
        </div>
      </div>

      <AlertDialog open={showSaveConfirm} onOpenChange={setShowSaveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {employee ? "Confirm Employee Update" : "Confirm New Employee"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {employee
                ? "Are you sure the edited employee information is correct?"
                : "Are you sure the employee information is correct before adding this record?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Review Details</AlertDialogCancel>
            <AlertDialogAction onClick={persistEmployee} disabled={saving}>
              {saving ? "Saving..." : employee ? "Confirm Update" : "Confirm Add"}
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
            <AlertDialogAction onClick={onClose} className="bg-red-600 hover:bg-red-700">
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}