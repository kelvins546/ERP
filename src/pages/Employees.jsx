import { useState, useEffect } from "react";
import { supabase } from "@/api/base44Client"; // <-- Clean Supabase import
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Building2,
  MapPin,
  Briefcase,
  UserCog,
} from "lucide-react";
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
import EmployeeModal from "@/components/EmployeeModal";
import EmployeeAssignmentModal from "@/components/EmployeeAssignmentModal";
const statusColors = {
  regular: "bg-green-100 text-green-700",
  probationary: "bg-yellow-100 text-yellow-700",
  contractual: "bg-blue-100 text-blue-700",
  resigned: "bg-gray-100 text-gray-700",
  terminated: "bg-red-100 text-red-700",
};

const POSITION_LINK_TABLE_CANDIDATES = [
  "employee_positions",
  "employee_position_assignments",
];

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [departmentsById, setDepartmentsById] = useState({});
  const [projectSitesById, setProjectSitesById] = useState({});
  const [positionsById, setPositionsById] = useState({});
  const [employeePositionMap, setEmployeePositionMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editEmployee, setEditEmployee] = useState(null);
  const [assignmentAction, setAssignmentAction] = useState(null);
  const [assignmentEmployee, setAssignmentEmployee] = useState(null);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setLoadError("");

      const [employeesResult, departmentsResult, projectSitesResult, positionsResult] =
        await Promise.all([
          supabase
            .from("employees")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(200),
          supabase.from("departments").select("id, name"),
          supabase.from("project_sites").select("id, name, location"),
          supabase.from("positions").select("id, title"),
        ]);

      if (employeesResult.error) throw employeesResult.error;
      if (departmentsResult.error) throw departmentsResult.error;
      if (projectSitesResult.error) throw projectSitesResult.error;
      if (positionsResult.error) throw positionsResult.error;

      const deptMap = (departmentsResult.data || []).reduce((acc, dept) => {
        acc[dept.id] = dept;
        return acc;
      }, {});
      const posMap = (positionsResult.data || []).reduce((acc, pos) => {
        acc[pos.id] = pos;
        return acc;
      }, {});
      const siteMap = (projectSitesResult.data || []).reduce((acc, site) => {
        acc[site.id] = site;
        return acc;
      }, {});

      setEmployees(employeesResult.data || []);
      setDepartmentsById(deptMap);
      setProjectSitesById(siteMap);
      setPositionsById(posMap);

      let positionLinkTable = null;
      for (const tableName of POSITION_LINK_TABLE_CANDIDATES) {
        const probe = await supabase
          .from(tableName)
          .select("employee_id, position_id")
          .limit(1);
        if (!probe.error) {
          positionLinkTable = tableName;
          break;
        }
      }

      if (positionLinkTable && (employeesResult.data || []).length > 0) {
        const employeeIds = (employeesResult.data || []).map((row) => row.id);
        const assignmentsResult = await supabase
          .from(positionLinkTable)
          .select("employee_id, position_id")
          .in("employee_id", employeeIds);

        if (!assignmentsResult.error) {
          const grouped = (assignmentsResult.data || []).reduce((acc, row) => {
            const employeeId = String(row.employee_id);
            const title = posMap[row.position_id]?.title;
            if (!title) return acc;
            if (!acc[employeeId]) acc[employeeId] = [];
            if (!acc[employeeId].includes(title)) acc[employeeId].push(title);
            return acc;
          }, {});
          setEmployeePositionMap(grouped);
        } else {
          setEmployeePositionMap({});
        }
      } else {
        setEmployeePositionMap({});
      }
    } catch (error) {
      console.error("Error loading employees:", error.message);
      setLoadError(error.message || "Failed to load employees.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = employees.filter((e) => {
    const name = `${e.first_name} ${e.last_name}`.toLowerCase();
    const matchSearch =
      !search ||
      name.includes(search.toLowerCase()) ||
      (e.employee_code || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleDelete = async () => {
    if (!deleteCandidate?.id) return;

    try {
      setDeleting(true);
      const { error } = await supabase
        .from("employees")
        .delete()
        .eq("id", deleteCandidate.id);
      if (error) throw error;
      setDeleteCandidate(null);
      load();
    } catch (error) {
      console.error("Delete failed:", error.message);

      if (error.code === "23503") {
        alert(
          "Cannot delete this employee because they are referenced in other records (e.g., Attendance, Payroll, or as a Department Head).",
        );
      } else {
        alert("Failed to delete employee.");
      }
    } finally {
      setDeleting(false);
    }
  };

  const openAssignment = (action, employee) => {
    setAssignmentAction(action);
    setAssignmentEmployee(employee);
  };

  const getPositionTitles = (emp) => {
    const multiple = employeePositionMap[String(emp.id)] || [];
    if (multiple.length > 0) return multiple;

    const singleTitle =
      positionsById[emp.position_id]?.title || emp.position_name || null;
    return singleTitle ? [singleTitle] : [];
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Employee Masterlist
          </h1>
          <p className="text-slate-500 text-sm">
            {employees.length} total employees
          </p>
        </div>
        <Button
          onClick={() => {
            setEditEmployee(null);
            setShowModal(true);
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" /> Add Employee
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by name or code..."
            className="pl-9 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 bg-white"
        >
          <option value="">All Statuses</option>
          <option value="regular">Regular</option>
          <option value="probationary">Probationary</option>
          <option value="contractual">Contractual</option>
          <option value="resigned">Resigned</option>
          <option value="terminated">Terminated</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loadError && (
          <div className="mx-4 mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            Error loading employees: {loadError}
          </div>
        )}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p>No employees found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {[
                    "Code",
                    "Name",
                    "Department",
                    "Project Site",
                    "Position",
                    "Status",
                    "Hire Date",
                    "Actions",
                  ].map((h) => (
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
                {filtered.map((emp) => (
                  <tr
                    key={emp.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-mono text-slate-600 font-medium">
                      {emp.employee_code}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-xs shrink-0">
                          {emp.first_name?.[0]}
                          {emp.last_name?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {emp.first_name} {emp.last_name}
                          </p>
                          {/* Note: SQL schema didn't have email in the employee table initially, but we map it if it exists */}
                          {emp.email && (
                            <p className="text-xs text-slate-400">
                              {emp.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {departmentsById[emp.department_id]?.name ||
                        emp.department_name ||
                        "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {projectSitesById[emp.project_site_id]?.name ||
                        emp.project_site_name ||
                        "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {getPositionTitles(emp).length > 0 ? (
                        <span className="text-sm text-slate-700">
                          {getPositionTitles(emp).join(", ")}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full capitalize border ${statusColors[emp.status] || "bg-gray-100 text-gray-700 border-gray-200"} ${emp.status === "regular" ? "border-green-200" : ""} ${emp.status === "probationary" ? "border-yellow-200" : ""}`}
                      >
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {emp.hire_date
                        ? new Date(emp.hire_date).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => openAssignment("position", emp)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Assign Position"
                        >
                          <Briefcase className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openAssignment("department", emp)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Assign Department"
                        >
                          <Building2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openAssignment("projectSite", emp)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Assign Project Site"
                        >
                          <MapPin className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => openAssignment("status", emp)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Assign Employment Status"
                        >
                          <UserCog className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditEmployee(emp);
                            setShowModal(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit Employee"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteCandidate(emp)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete Employee"
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

      {showModal && (
        <EmployeeModal
          employee={editEmployee}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            load();
          }}
        />
      )}

      {assignmentAction && assignmentEmployee && (
        <EmployeeAssignmentModal
          employee={assignmentEmployee}
          action={assignmentAction}
          onClose={() => {
            setAssignmentAction(null);
            setAssignmentEmployee(null);
          }}
          onSaved={() => {
            setAssignmentAction(null);
            setAssignmentEmployee(null);
            load();
          }}
        />
      )}

      <AlertDialog
        open={Boolean(deleteCandidate)}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteCandidate(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Employee Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteCandidate
                ? `Delete ${deleteCandidate.first_name || ""} ${deleteCandidate.last_name || ""}? This action cannot be undone.`
                : "Delete this employee? This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Deleting..." : "Confirm Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
