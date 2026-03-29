import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

export default function OrgChart() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Employee.list(),
      base44.entities.Department.list(),
    ]).then(([emps, depts]) => {
      setEmployees(emps);
      setDepartments(depts);
      setLoading(false);
    });
  }, []);

  const byDept = departments.map(d => ({
    ...d,
    members: employees.filter(e => e.department_name === d.name && ["regular","probationary","contractual"].includes(e.status)),
  }));
  const unassigned = employees.filter(e => !e.department_name && ["regular","probationary","contractual"].includes(e.status));

  const initials = (e) => `${e.first_name?.[0] || ""}${e.last_name?.[0] || ""}`;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Organizational Chart</h1>
      {loading ? <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div> : (
        <div className="space-y-6">
          {byDept.filter(d => d.members.length > 0).map(dept => (
            <div key={dept.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-800 px-5 py-3 flex items-center justify-between">
                <h2 className="text-white font-semibold">{dept.name}</h2>
                {dept.head_employee_name && <p className="text-slate-400 text-sm">Head: {dept.head_employee_name}</p>}
              </div>
              <div className="p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {dept.members.map(e => (
                  <div key={e.id} className="text-center">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm mx-auto mb-2">
                      {e.profile_photo_url ? <img src={e.profile_photo_url} alt="" className="w-12 h-12 rounded-full object-cover" /> : initials(e)}
                    </div>
                    <p className="text-xs font-medium text-slate-900 truncate">{e.first_name} {e.last_name}</p>
                    <p className="text-xs text-slate-400 truncate">{e.position_name || "—"}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full capitalize ${e.status === "regular" ? "bg-green-100 text-green-700" : e.status === "probationary" ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"}`}>{e.status}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {unassigned.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-500 px-5 py-3"><h2 className="text-white font-semibold">Unassigned</h2></div>
              <div className="p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {unassigned.map(e => (
                  <div key={e.id} className="text-center">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm mx-auto mb-2">{initials(e)}</div>
                    <p className="text-xs font-medium text-slate-900 truncate">{e.first_name} {e.last_name}</p>
                    <p className="text-xs text-slate-400 truncate">{e.position_name || "—"}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {byDept.every(d => d.members.length === 0) && unassigned.length === 0 && (
            <div className="text-center py-16 text-slate-400">No employees to display. Add employees and assign them to departments.</div>
          )}
        </div>
      )}
    </div>
  );
}