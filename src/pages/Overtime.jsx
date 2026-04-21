import { useMemo, useState, useEffect } from "react";
import { supabase } from "@/api/base44Client"; // <-- Clean Supabase import
import { Plus, X, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  approved: "bg-green-100 text-green-700 border-green-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
};

const formatEmployeeLabel = (employee) => {
  if (!employee) return "Select employee";
  const name = [employee.first_name, employee.last_name]
    .filter(Boolean)
    .join(" ");
  const code = employee.employee_code ? ` (${employee.employee_code})` : "";
  return `${name || "Unnamed employee"}${code}`;
};

const makeEmployeeKey = (employee) => employee?.id || employee?.employee_id || "";

const getTodayYMD = () => new Date().toISOString().split("T")[0];

// --- THE MODAL (CREATE & UPDATE) ---
function OTModal({ ot, employees, onClose, onSaved }) {
  const employeeOptions = employees || [];
  const [form, setForm] = useState({
    employee_id: "",
    employee_name: "",
    ot_date: "",
    requested_hours: 1,
    reason: "",
    status: "pending",
    ...ot,
  });

  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const selectedEmployee = useMemo(
    () =>
      employeeOptions.find(
        (employee) => makeEmployeeKey(employee) === String(form.employee_id || "")
      ),
    [employeeOptions, form.employee_id]
  );

  const save = async () => {
    const effectiveDate = form.ot_date || form.date || "";
    if (effectiveDate < getTodayYMD()) {
      alert("Past dates are not allowed. Please select today or a future date.");
      return;
    }

    setSaving(true);
    try {
      const resolvedEmployee =
        selectedEmployee ||
        employeeOptions.find(
          (employee) => makeEmployeeKey(employee) === String(form.employee_id || "")
        );

      const payload = {
        employee_id: form.employee_id || null,
        employee_name:
          form.employee_name ||
          (resolvedEmployee ? formatEmployeeLabel(resolvedEmployee) : null),
        date: form.ot_date || form.date,
        requested_hours: form.requested_hours,
        reason: form.reason,
        status: form.status,
      };

      if (ot?.id) {
        const { error } = await supabase
          .from("overtime_requests")
          .update(payload)
          .eq("id", ot.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("overtime_requests")
          .insert([payload]);
        if (error) throw error;
      }
      onSaved();
    } catch (error) {
      console.error("Error saving OT request:", error.message);
      alert("Failed to save: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold">
            {ot ? "Edit OT Request" : "New OT Request"}
          </h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-600">
              Employee *
            </label>
            <select
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
              value={form.employee_id || ""}
              onChange={(e) => {
                const employeeId = e.target.value;
                const employee = employeeOptions.find(
                  (item) => makeEmployeeKey(item) === employeeId
                );
                set("employee_id", employeeId);
                set("employee_name", employee ? formatEmployeeLabel(employee) : "");
              }}
            >
              <option value="">Select employee</option>
              {employeeOptions.map((employee) => (
                <option
                  key={makeEmployeeKey(employee)}
                  value={makeEmployeeKey(employee)}
                >
                  {formatEmployeeLabel(employee)}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600">
                OT Date *
              </label>
              <Input
                className="mt-1"
                type="date"
                min={getTodayYMD()}
                value={form.ot_date || form.date || ""}
                onChange={(e) => set("ot_date", e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">
                Hours Requested *
              </label>
              <Input
                className="mt-1"
                type="number"
                step="0.5"
                value={form.requested_hours || ""}
                onChange={(e) => set("requested_hours", Number(e.target.value))}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">
              Reason / Justification
            </label>
            <textarea
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              rows={3}
              value={form.reason || ""}
              onChange={(e) => set("reason", e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Status</label>
            <select
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
            >
              {["pending", "approved", "rejected"].map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving || !form.employee_id || (!form.ot_date && !form.date)}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- THE MAIN PAGE (READ & QUICK UPDATE) ---
export default function Overtime() {
  const [items, setItems] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [statusFilter, setStatusFilter] = useState("pending");

  const load = async () => {
    try {
      setLoading(true);
      const [otResult, employeeResult] = await Promise.all([
        supabase
          .from("overtime_requests")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("employees")
          .select("id, employee_code, first_name, last_name")
          .order("first_name", { ascending: true }),
      ]);

      if (otResult.error) throw otResult.error;
      if (employeeResult.error) throw employeeResult.error;

      setItems(otResult.data || []);
      setEmployees(employeeResult.data || []);
    } catch (error) {
      console.error("Failed to load OT requests:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Quick Approval/Rejection function
  const quickUpdate = async (item, status) => {
    try {
      const { error } = await supabase
        .from("overtime_requests")
        .update({ status })
        .eq("id", item.id);
      if (error) throw error;
      load(); // Refresh the board
    } catch (error) {
      console.error(`Failed to mark as ${status}:`, error.message);
      alert("Action failed.");
    }
  };

  const filtered = statusFilter
    ? items.filter((i) => i.status === statusFilter)
    : items;

  const searched = filtered.filter((item) => {
    if (!search) return true;
    const haystack = [
      item.employee_name,
      item.employee_id,
      item.date,
      item.status,
      item.reason,
      item.requested_hours,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  const employeeNameById = useMemo(() => {
    const map = {};
    employees.forEach((employee) => {
      map[makeEmployeeKey(employee)] = formatEmployeeLabel(employee);
    });
    return map;
  }, [employees]);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Overtime Requests</h1>
          <p className="text-sm text-slate-500 mt-1">
            Submit and review overtime applications.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditItem(null);
            setShowModal(true);
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" /> New OT Request
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="w-full max-w-sm">
          <Input
            placeholder="Search overtime requests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="ml-auto w-full max-w-xs border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {[
            ["", "All"],
            ["pending", "Pending"],
            ["approved", "Approved"],
            ["rejected", "Rejected"],
          ].map(([value, label]) => (
            <option key={value || "all"} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                {[
                  "Employee",
                  "Date",
                  "Hours",
                  "Status",
                  "Actions",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {searched.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-slate-400">
                  No overtime requests found.
                </td>
              </tr>
          ) : (
            searched.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-slate-50"
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">
                    {item.employee_name || employeeNameById[item.employee_id] || "Unknown employee"}
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    {item.employee_id ? item.employee_id.slice(0, 8) : ""}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {new Date(item.date).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {item.requested_hours} hour(s)
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize border ${statusColors[item.status] || "bg-slate-100 text-slate-600 border-slate-200"}`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 shrink-0 items-center">
                    {item.status === "pending" && (
                      <>
                        <button
                          onClick={() => quickUpdate(item, "approved")}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Approve"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => quickUpdate(item, "rejected")}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Reject"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => {
                        setEditItem(item);
                        setShowModal(true);
                      }}
                      className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline px-2 transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <OTModal
          ot={editItem}
          employees={employees}
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
