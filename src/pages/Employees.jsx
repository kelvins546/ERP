import { useState, useEffect } from "react";
import { supabase } from "@/api/base44Client"; // <-- Clean Supabase import
import {
  Plus,
  Search,
  Filter,
  Edit,
  Eye,
  Trash2,
  UserCheck,
  UserX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import EmployeeModal from "@/components/EmployeeModal";
const statusColors = {
  regular: "bg-green-100 text-green-700",
  probationary: "bg-yellow-100 text-yellow-700",
  contractual: "bg-blue-100 text-blue-700",
  resigned: "bg-gray-100 text-gray-700",
  terminated: "bg-red-100 text-red-700",
};

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editEmployee, setEditEmployee] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      // Supabase Read: We use a "join" to fetch the actual names of the department and position instead of just their UUIDs
      const { data, error } = await supabase
        .from("employees")
        .select(
          `
          *,
          departments ( name ),
          positions ( title )
        `,
        )
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error("Error loading employees:", error.message);
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

  const handleDelete = async (id) => {
    if (
      !confirm(
        "Are you sure you want to delete this employee? This cannot be undone.",
      )
    )
      return;
    try {
      // Supabase Delete
      const { error } = await supabase.from("employees").delete().eq("id", id);
      if (error) throw error;
      load(); // Refresh list
    } catch (error) {
      console.error("Delete failed:", error.message);

      // Foreign key constraint warning
      if (error.code === "23503") {
        alert(
          "Cannot delete this employee because they are referenced in other records (e.g., Attendance, Payroll, or as a Department Head).",
        );
      } else {
        alert("Failed to delete employee.");
      }
    }
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
                      {/* Using the joined data from Supabase */}
                      {emp.departments?.name || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {/* Using the joined data from Supabase */}
                      {emp.positions?.title || "—"}
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
                      <div className="flex items-center gap-2">
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
                          onClick={() => handleDelete(emp.id)}
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
    </div>
  );
}
