import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/api/base44Client";
import { Search, Building2, User, Mail, Phone, Hash } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function ESSDirectory() {
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchDirectory = async () => {
      setLoading(true);
      try {
        // Fetch departments
        const { data: depts, error: deptError } = await supabase
          .from("departments")
          .select("id, name, head_employee_id")
          .order("name", { ascending: true });

        if (deptError) throw deptError;

        // Fetch active employees
        const { data: emps, error: empError } = await supabase
          .from("employees")
          .select(
            "id, first_name, last_name, email, phone, department_id, position_names, employee_code",
          )
          .eq("is_account_active", true)
          .order("first_name", { ascending: true });

        if (empError) throw empError;

        setDepartments(depts || []);
        setEmployees(emps || []);
      } catch (error) {
        console.error("Error fetching directory:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDirectory();
  }, []);

  // Group employees by department and filter by search
  const directoryData = useMemo(() => {
    const term = search.toLowerCase().trim();

    const filteredEmps = employees.filter((emp) => {
      const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
      const pos = (emp.position_names?.[0] || "").toLowerCase();
      return fullName.includes(term) || pos.includes(term);
    });

    const grouped = departments.map((dept) => {
      return {
        ...dept,
        members: filteredEmps.filter((emp) => emp.department_id === dept.id),
      };
    });

    // Handle employees without a department
    const unassigned = filteredEmps.filter((emp) => !emp.department_id);
    if (unassigned.length > 0) {
      grouped.push({
        id: "unassigned",
        name: "Unassigned / General",
        members: unassigned,
      });
    }

    // Only return departments that actually have members matching the search
    return grouped.filter((dept) => dept.members.length > 0);
  }, [employees, departments, search]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      {/* Header & Search */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Company Directory
        </h1>
        <p className="text-slate-500 mt-1 text-sm mb-6">
          Find your colleagues and view department hierarchies.
        </p>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Search by name or position..."
            className="pl-10 focus-visible:ring-[#2E6F40]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Directory Listings */}
      <div className="space-y-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#2E6F40]/30 border-t-[#2E6F40] rounded-full animate-spin"></div>
          </div>
        ) : directoryData.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <User className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">
              No employees found matching your search.
            </p>
          </div>
        ) : (
          directoryData.map((dept) => (
            <div key={dept.id} className="space-y-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-2">
                <Building2 className="w-5 h-5 text-[#2E6F40]" />
                {dept.name}
                <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full ml-2">
                  {dept.members.length}
                </span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dept.members.map((emp) => {
                  const isHead = dept.head_employee_id === emp.id;
                  const initials = [emp.first_name?.[0], emp.last_name?.[0]]
                    .filter(Boolean)
                    .join("")
                    .toUpperCase();

                  return (
                    <div
                      key={emp.id}
                      className={`p-4 bg-white rounded-xl border shadow-sm flex items-start gap-4 transition-all hover:shadow-md ${isHead ? "border-[#2E6F40]/40 bg-[#2E6F40]/5" : "border-slate-200"}`}
                    >
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center font-bold shrink-0 ${isHead ? "bg-[#2E6F40] text-white" : "bg-slate-100 text-slate-600"}`}
                      >
                        {initials || "U"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-bold text-slate-900 truncate">
                            {emp.first_name} {emp.last_name}
                          </p>
                          {isHead && (
                            <span className="text-[10px] font-black uppercase tracking-wider text-[#2E6F40] bg-white border border-[#2E6F40]/20 px-1.5 py-0.5 rounded">
                              Head
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 font-medium truncate mb-2">
                          {emp.position_names?.[0] || "Staff"}
                        </p>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">
                              {emp.email || "No email"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{emp.phone || "No phone"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
