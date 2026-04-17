import { useEffect, useMemo, useSgite } from "react";
import { supabase } from "@/api/base44Client";

const ACTIVE_STATUSES = ["regular", "probationary", "contractual"];
const POSITION_LINK_TABLE_CANDIDATES = [
  "employee_positions",
  "employee_position_assignments",
];

const statusColors = {
  regular: "bg-green-50 text-green-700 border-green-200",
  probationary: "bg-yellow-50 text-yellow-700 border-yellow-200",
  contractual: "bg-blue-50 text-blue-700 border-blue-200",
};

function EmployeeNode({ employee, positionLabel }) {
  const initials = `${employee.first_name?.[0] || ""}${employee.last_name?.[0] || ""}`;

  return (
    <div className="text-center flex flex-col items-center">
      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm mb-2 border border-blue-200">
        {employee.profile_photo_url ? (
          <img
            src={employee.profile_photo_url}
            alt=""
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          initials
        )}
      </div>
      <p className="text-xs font-medium text-slate-900 w-full truncate px-1">
        {employee.first_name} {employee.last_name}
      </p>
      <p className="text-xs text-slate-500 w-full truncate px-1 mb-1">
        {positionLabel || "No Position"}
      </p>
      <span
        className={`text-[10px] px-2 py-0.5 rounded-full capitalize border ${statusColors[employee.status] || "bg-slate-50 text-slate-600 border-slate-200"}`}
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

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Organizational Chart</h1>
        <p className="text-sm text-slate-500 mt-1">
          {employees.length} active employees across {departments.length} departments
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : loadError ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          Failed to load org chart: {loadError}
        </div>
      ) : (
        <div className="space-y-6">
          {groupedByDepartment
            .filter((dept) => dept.members.length > 0)
            .map((dept) => {
              const head = dept.head_employee_id
                ? employeesById[dept.head_employee_id]
                : null;
              const membersExcludingHead = dept.members.filter(
                (emp) => emp.id !== dept.head_employee_id,
              );

              return (
                <div
                  key={dept.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
                >
                  <div className="bg-slate-800 px-5 py-3 flex items-center justify-between">
                    <h2 className="text-white font-semibold">{dept.name}</h2>
                    {head ? (
                      <p className="text-slate-300 text-xs">
                        Head: {head.first_name} {head.last_name}
                      </p>
                    ) : dept.head_employee_id ? (
                      <p className="text-slate-400 text-xs">
                        Head ID: {String(dept.head_employee_id).substring(0, 8)}
                      </p>
                    ) : (
                      <p className="text-slate-400 text-xs">No Department Head Assigned</p>
                    )}
                  </div>

                  <div className="p-5 space-y-4">
                    {head && (
                      <div className="max-w-[180px] mx-auto">
                        <EmployeeNode
                          employee={head}
                          positionLabel={getPositionLabel(head.id)}
                        />
                      </div>
                    )}

                    {membersExcludingHead.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {membersExcludingHead.map((emp) => (
                          <EmployeeNode
                            key={emp.id}
                            employee={emp}
                            positionLabel={getPositionLabel(emp.id)}
                          />
                        ))}
                      </div>
                    )}

                    {!head && membersExcludingHead.length === 0 && (
                      <p className="text-sm text-slate-400 italic text-center py-4">
                        No active members in this department.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

          {unassigned.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-500 px-5 py-3">
                <h2 className="text-white font-semibold flex items-center gap-2">
                  Unassigned Team Members
                  <span className="text-xs bg-slate-600 px-2 py-0.5 rounded-full">
                    {unassigned.length}
                  </span>
                </h2>
              </div>
              <div className="p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {unassigned.map((emp) => (
                  <EmployeeNode
                    key={emp.id}
                    employee={emp}
                    positionLabel={getPositionLabel(emp.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {groupedByDepartment.every((dept) => dept.members.length === 0) &&
            unassigned.length === 0 && (
              <div className="text-center py-16 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                <p className="font-medium text-slate-500">No active employees to display.</p>
                <p className="text-xs mt-1">
                  Add employees and assign them to departments to see the org chart.
                </p>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
