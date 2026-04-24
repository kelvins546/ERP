  import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/api/base44Client";
import { Search, Users, ChevronDown } from "lucide-react";
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select";

const ACTIVE_STATUSES = ["regular", "probationary", "contractual"];
const POSITION_LINK_TABLE_CANDIDATES = [
  "employee_positions",
  "employee_position_assignments",
];

const statusColors = {
  regular: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100",
  probationary: "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100",
  contractual: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
};

const statusBadgeColors = {
  regular: "bg-green-100 text-green-700 border border-green-300",
  probationary: "bg-yellow-100 text-yellow-700 border border-yellow-300",
  contractual: "bg-blue-100 text-blue-700 border border-blue-300",
};

function EmployeeNode({ employee, positionLabel, onClick }) {
  const initials = `${employee.first_name?.[0] || ""}${employee.last_name?.[0] || ""}`;
  const fullName = `${employee.first_name || ""} ${employee.last_name || ""}`.trim();

  return (
    <div
      onClick={onClick}
      className="text-center flex flex-col items-center cursor-pointer group transition-all duration-200"
    >
      <div className="relative mb-2">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center text-blue-700 font-bold text-sm border-2 border-blue-200 group-hover:border-blue-400 group-hover:shadow-lg transition-all duration-200 overflow-hidden flex-shrink-0">
          {employee.profile_photo_url ? (
            <img
              src={employee.profile_photo_url}
              alt={fullName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-sm font-semibold">{initials}</span>
          )}
        </div>
        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold ${statusColors[employee.status] || "bg-slate-100 text-slate-600"}`}>
          {employee.status === "regular" ? "✓" : "○"}
        </div>
      </div>
      <p className="text-xs font-semibold text-slate-900 w-full truncate px-1 group-hover:text-blue-600 transition-colors">
        {fullName}
      </p>
      <p className="text-[11px] text-slate-600 w-full truncate px-1 mb-2 font-medium">
        {positionLabel || "No Position"}
      </p>
      <span
        className={`text-[10px] px-2 py-1 rounded-full capitalize border font-medium ${statusBadgeColors[employee.status] || "bg-slate-50 text-slate-600 border-slate-200"}`}
      >
        {employee.status}
      </span>
    </div>
  );
}

export default function OrgChart() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positionsByEmployee, setPositionsByEmployee] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState("");
  const [expandedDepartments, setExpandedDepartments] = useState({});
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setLoadError("");

        const [empResult, deptResult, posResult] = await Promise.all([
          supabase
            .from("employees")
            .select("*")
            .in("status", ACTIVE_STATUSES)
            .order("first_name", { ascending: true }),
          supabase
            .from("departments")
            .select("*")
            .order("name", { ascending: true }),
          supabase.from("positions").select("id, title"),
        ]);

        if (empResult.error) throw empResult.error;
        if (deptResult.error) throw deptResult.error;
        if (posResult.error) throw posResult.error;

        const employeeRows = empResult.data || [];
        const departmentRows = deptResult.data || [];
        const positionRows = posResult.data || [];

        const positionById = positionRows.reduce((acc, pos) => {
          acc[pos.id] = pos.title;
          return acc;
        }, {});

        const fallbackMap = employeeRows.reduce((acc, emp) => {
          const title = positionById[emp.position_id] || emp.position_name || "";
          acc[String(emp.id)] = title ? [title] : [];
          return acc;
        }, {});

        let linkTable = null;
        for (const tableName of POSITION_LINK_TABLE_CANDIDATES) {
          const probe = await supabase
            .from(tableName)
            .select("employee_id, position_id")
            .limit(1);
          if (!probe.error) {
            linkTable = tableName;
            break;
          }
        }

        if (linkTable && employeeRows.length > 0) {
          const ids = employeeRows.map((emp) => emp.id);
          const linksResult = await supabase
            .from(linkTable)
            .select("employee_id, position_id")
            .in("employee_id", ids);

          if (!linksResult.error) {
            const linkedMap = { ...fallbackMap };
            (linksResult.data || []).forEach((row) => {
              const employeeId = String(row.employee_id);
              const title = positionById[row.position_id];
              if (!title) return;
              if (!linkedMap[employeeId]) linkedMap[employeeId] = [];
              if (!linkedMap[employeeId].includes(title)) linkedMap[employeeId].push(title);
            });
            setPositionsByEmployee(linkedMap);
          } else {
            setPositionsByEmployee(fallbackMap);
          }
        } else {
          setPositionsByEmployee(fallbackMap);
        }

        setEmployees(employeeRows);
        setDepartments(departmentRows);

        // Initialize all departments as expanded
        const initialExpanded = {};
        departmentRows.forEach((dept) => {
          initialExpanded[dept.id] = true;
        });
        setExpandedDepartments(initialExpanded);
      } catch (error) {
        console.error("Failed to load Org Chart data:", error.message);
        setLoadError(error.message || "Failed to load organizational chart.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const employeesById = useMemo(() => {
    return employees.reduce((acc, emp) => {
      acc[emp.id] = emp;
      return acc;
    }, {});
  }, [employees]);

  const groupedByDepartment = useMemo(() => {
    return departments.map((dept) => ({
      ...dept,
      members: employees.filter((emp) => emp.department_id === dept.id),
    }));
  }, [departments, employees]);

  const unassigned = useMemo(
    () => employees.filter((emp) => !emp.department_id),
    [employees],
  );

  const getPositionLabel = (employeeId) => {
    const items = positionsByEmployee[String(employeeId)] || [];
    return items.length ? items.join(", ") : "No Position";
  };

  // Search and filter logic
  const searchLower = searchQuery.toLowerCase();
  const filteredDepartments = useMemo(() => {
    return groupedByDepartment
      .map((dept) => {
        if (selectedDepartmentFilter && dept.id !== selectedDepartmentFilter) {
          return null;
        }

        let filteredMembers = dept.members;

        if (searchQuery) {
          filteredMembers = dept.members.filter((emp) => {
            const fullName = `${emp.first_name || ""} ${emp.last_name || ""}`.toLowerCase();
            const code = emp.employee_code?.toLowerCase() || "";
            return fullName.includes(searchLower) || code.includes(searchLower);
          });
        }

        return filteredMembers.length > 0 ? { ...dept, members: filteredMembers } : null;
      })
      .filter(Boolean);
  }, [groupedByDepartment, searchQuery, selectedDepartmentFilter]);

  const filteredUnassigned = useMemo(() => {
    if (searchQuery) {
      return unassigned.filter((emp) => {
        const fullName = `${emp.first_name || ""} ${emp.last_name || ""}`.toLowerCase();
        const code = emp.employee_code?.toLowerCase() || "";
        return fullName.includes(searchLower) || code.includes(searchLower);
      });
    }
    return unassigned;
  }, [unassigned, searchQuery]);

  // Statistics
  const stats = {
    total: employees.length,
    regular: employees.filter((e) => e.status === "regular").length,
    probationary: employees.filter((e) => e.status === "probationary").length,
    contractual: employees.filter((e) => e.status === "contractual").length,
  };

  const toggleDepartment = (deptId) => {
    setExpandedDepartments((prev) => ({
      ...prev,
      [deptId]: !prev[deptId],
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-900">Organizational Chart</h1>
          </div>
          <p className="text-slate-600 ml-11 mb-6">
            Manage and visualize your organization's structure and reporting hierarchy
          </p>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
              <p className="text-xs text-slate-600 font-medium">Total Employees</p>
              <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 border border-green-200">
              <p className="text-xs text-slate-600 font-medium">Regular</p>
              <p className="text-2xl font-bold text-green-700">{stats.regular}</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-3 border border-yellow-200">
              <p className="text-xs text-slate-600 font-medium">Probationary</p>
              <p className="text-2xl font-bold text-yellow-700">{stats.probationary}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-cyan-100 rounded-lg p-3 border border-blue-200">
              <p className="text-xs text-slate-600 font-medium">Contractual</p>
              <p className="text-2xl font-bold text-blue-700">{stats.contractual}</p>
            </div>
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-3 border border-slate-200">
              <p className="text-xs text-slate-600 font-medium">Departments</p>
              <p className="text-2xl font-bold text-slate-700">{departments.length}</p>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or employee code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <Select
              value={selectedDepartmentFilter || "all"}
              onValueChange={(value) => setSelectedDepartmentFilter(value === "all" ? "" : value)}
            >
              <SelectTrigger className="w-full sm:w-[240px] bg-white border-slate-300 text-sm focus:ring-2 focus:ring-blue-500">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={String(dept.id)}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Main Content */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-600 font-medium">Loading organizational chart...</p>
            </div>
          </div>
        ) : loadError ? (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-red-700">
            <p className="font-semibold mb-1">Failed to load organizational chart</p>
            <p className="text-sm">{loadError}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Departments */}
            {filteredDepartments.length > 0 ? (
              filteredDepartments.map((dept) => {
                const head = dept.head_employee_id
                  ? employeesById[dept.head_employee_id]
                  : null;
                const membersExcludingHead = dept.members.filter(
                  (emp) => emp.id !== dept.head_employee_id,
                );
                const isExpanded = expandedDepartments[dept.id];

                return (
                  <div
                    key={dept.id}
                    className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                  >
                    {/* Department Header */}
                    <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 flex items-center justify-between cursor-pointer hover:from-slate-700 hover:to-slate-600 transition-all"
                      onClick={() => toggleDepartment(dept.id)}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <ChevronDown
                          className={`w-5 h-5 text-white flex-shrink-0 transition-transform ${isExpanded ? "" : "-rotate-90"}`}
                        />
                        <div className="min-w-0">
                          <h2 className="text-white font-semibold text-lg">{dept.name}</h2>
                          <p className="text-slate-300 text-xs mt-1">
                            {dept.members.length} member{dept.members.length !== 1 ? "s" : ""}
                            {head && ` • Head: ${head.first_name} ${head.last_name}`}
                          </p>
                        </div>
                      </div>
                      <div className="bg-slate-700 px-3 py-1 rounded-full text-white text-sm font-semibold flex-shrink-0">
                        {dept.members.length}
                      </div>
                    </div>

                    {/* Department Content */}
                    {isExpanded && (
                      <div className="p-6 space-y-6 animate-in fade-in duration-200">
                        {/* Department Head */}
                        {head && (
                          <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Department Head</p>
                            <div className="w-fit">
                              <EmployeeNode
                                employee={head}
                                positionLabel={getPositionLabel(head.id)}
                                onClick={() => setSelectedEmployee(head)}
                              />
                            </div>
                          </div>
                        )}

                        {/* Team Members */}
                        {membersExcludingHead.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Team Members</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                              {membersExcludingHead.map((emp) => (
                                <EmployeeNode
                                  key={emp.id}
                                  employee={emp}
                                  positionLabel={getPositionLabel(emp.id)}
                                  onClick={() => setSelectedEmployee(emp)}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {!head && membersExcludingHead.length === 0 && (
                          <p className="text-sm text-slate-400 italic text-center py-8">
                            No active members in this department.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                <p className="text-slate-600 font-medium">No departments found matching your search.</p>
              </div>
            )}

            {/* Unassigned Employees */}
            {filteredUnassigned.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-slate-600 to-slate-500 px-6 py-4 flex items-center gap-3">
                  <h2 className="text-white font-semibold text-lg">Unassigned Team Members</h2>
                  <span className="bg-slate-700 px-3 py-1 rounded-full text-white text-sm font-semibold">
                    {filteredUnassigned.length}
                  </span>
                </div>
                <div className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                  {filteredUnassigned.map((emp) => (
                    <EmployeeNode
                      key={emp.id}
                      employee={emp}
                      positionLabel={getPositionLabel(emp.id)}
                      onClick={() => setSelectedEmployee(emp)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {filteredDepartments.length === 0 && filteredUnassigned.length === 0 && (
              <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-slate-200">
                <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="font-medium text-slate-600 mb-1">No employees found</p>
                <p className="text-sm text-slate-500">
                  {searchQuery || selectedDepartmentFilter
                    ? "Try adjusting your search or filter criteria"
                    : "No active employees to display"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Employee Details Modal - Placeholder for future enhancement */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedEmployee(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-4">
              {selectedEmployee.profile_photo_url ? (
                <img
                  src={selectedEmployee.profile_photo_url}
                  alt={selectedEmployee.first_name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
                  {`${selectedEmployee.first_name?.[0] || ""}${selectedEmployee.last_name?.[0] || ""}`}
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900">
                  {selectedEmployee.first_name} {selectedEmployee.last_name}
                </h3>
                <p className="text-sm text-slate-600">{getPositionLabel(selectedEmployee.id)}</p>
                <span className={`inline-block text-xs px-2 py-1 rounded-full mt-1 font-medium ${statusBadgeColors[selectedEmployee.status] || "bg-slate-100 text-slate-600"}`}>
                  {selectedEmployee.status}
                </span>
              </div>
              <button
                onClick={() => setSelectedEmployee(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xl"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 text-sm border-t pt-4">
              {selectedEmployee.employee_code && (
                <div>
                  <p className="text-xs text-slate-500 font-medium">Employee Code</p>
                  <p className="text-slate-900">{selectedEmployee.employee_code}</p>
                </div>
              )}
              {selectedEmployee.email && (
                <div>
                  <p className="text-xs text-slate-500 font-medium">Email</p>
                  <p className="text-slate-900">{selectedEmployee.email}</p>
                </div>
              )}
              {selectedEmployee.phone && (
                <div>
                  <p className="text-xs text-slate-500 font-medium">Phone</p>
                  <p className="text-slate-900">{selectedEmployee.phone}</p>
                </div>
              )}
              {selectedEmployee.hire_date && (
                <div>
                  <p className="text-xs text-slate-500 font-medium">Hire Date</p>
                  <p className="text-slate-900">{new Date(selectedEmployee.hire_date).toLocaleDateString()}</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setSelectedEmployee(null)}
              className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}