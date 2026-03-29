import { useState, useEffect } from "react";
import { supabase } from "@/api/base44Client"; // <-- Clean Supabase import

export default function OrgChart() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Correctly wrapping async calls inside useEffect
    const loadData = async () => {
      try {
        setLoading(true);

        // Fetch employees and join their department and position names
        const empPromise = supabase
          .from("employees")
          .select("*, departments(name), positions(title)")
          .in("status", ["regular", "probationary", "contractual"]); // Only active employees

        // Fetch departments
        const deptPromise = supabase
          .from("departments")
          .select("*")
          .order("name", { ascending: true });

        const [empResult, deptResult] = await Promise.all([
          empPromise,
          deptPromise,
        ]);

        if (empResult.error) throw empResult.error;
        if (deptResult.error) throw deptResult.error;

        setEmployees(empResult.data || []);
        setDepartments(deptResult.data || []);
      } catch (error) {
        console.error("Failed to load Org Chart data:", error.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Group employees by department ID (using SQL relationships instead of text names)
  const byDept = departments.map((d) => ({
    ...d,
    members: employees.filter((e) => e.department_id === d.id),
  }));

  // Find employees that have no department assigned
  const unassigned = employees.filter((e) => !e.department_id);

  const initials = (e) => `${e.first_name?.[0] || ""}${e.last_name?.[0] || ""}`;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">
        Organizational Chart
      </h1>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Render Departments that have members */}
          {byDept
            .filter((d) => d.members.length > 0)
            .map((dept) => (
              <div
                key={dept.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
              >
                <div className="bg-slate-800 px-5 py-3 flex items-center justify-between">
                  <h2 className="text-white font-semibold">{dept.name}</h2>
                  {/* Note: In a real app, you'd join head_employee_id to the employees table to get their actual name */}
                  {dept.head_employee_id && (
                    <p className="text-slate-400 text-xs">
                      Head ID: {dept.head_employee_id.substring(0, 8)}
                    </p>
                  )}
                </div>

                <div className="p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {dept.members.map((e) => (
                    <div
                      key={e.id}
                      className="text-center flex flex-col items-center"
                    >
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm mb-2 shadow-sm border border-blue-200">
                        {/* Note: Add profile_photo_url to your SQL table if you want images to work */}
                        {e.profile_photo_url ? (
                          <img
                            src={e.profile_photo_url}
                            alt=""
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          initials(e)
                        )}
                      </div>
                      <p className="text-xs font-medium text-slate-900 w-full truncate px-1">
                        {e.first_name} {e.last_name}
                      </p>
                      <p className="text-xs text-slate-400 w-full truncate px-1 mb-1">
                        {e.positions?.title || "No Position"}
                      </p>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full capitalize border ${
                          e.status === "regular"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : e.status === "probationary"
                              ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}
                      >
                        {e.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

          {/* Render Unassigned Employees */}
          {unassigned.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-500 px-5 py-3">
                <h2 className="text-white font-semibold flex items-center gap-2">
                  Unassigned Team Members{" "}
                  <span className="text-xs bg-slate-600 px-2 py-0.5 rounded-full">
                    {unassigned.length}
                  </span>
                </h2>
              </div>
              <div className="p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {unassigned.map((e) => (
                  <div
                    key={e.id}
                    className="text-center flex flex-col items-center"
                  >
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm mb-2 border border-slate-200">
                      {initials(e)}
                    </div>
                    <p className="text-xs font-medium text-slate-900 w-full truncate px-1">
                      {e.first_name} {e.last_name}
                    </p>
                    <p className="text-xs text-slate-400 w-full truncate px-1 mb-1">
                      {e.positions?.title || "No Position"}
                    </p>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full capitalize border ${
                        e.status === "regular"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : e.status === "probationary"
                            ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}
                    >
                      {e.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {byDept.every((d) => d.members.length === 0) &&
            unassigned.length === 0 && (
              <div className="text-center py-16 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                <p className="font-medium text-slate-500">
                  No active employees to display.
                </p>
                <p className="text-xs mt-1">
                  Add employees and assign them to departments to see the chart.
                </p>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
