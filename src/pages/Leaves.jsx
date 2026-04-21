import { useMemo, useState, useEffect } from "react";
import { supabase } from "@/api/base44Client"; // <-- Clean Supabase import
import { Plus, X, CheckCircle, XCircle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-600",
};

const leaveTypes = [
  "vacation",
  "sick",
  "emergency",
  "maternity",
  "paternity",
  "bereavement",
  "other",
];

const statusLabels = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
};

const getTodayYMD = () => new Date().toISOString().split("T")[0];

const formatEmployeeLabel = (employee) => {
  if (!employee) return "Select employee";
  const name = [employee.first_name, employee.last_name]
    .filter(Boolean)
    .join(" ");
  const code = employee.employee_code ? ` (${employee.employee_code})` : "";
  return `${name || "Unnamed employee"}${code}`;
};

const makeEmployeeKey = (employee) => employee?.id || employee?.employee_id || "";

// --- THE MODAL (CREATE & UPDATE) ---
function LeaveModal({ leave, employees, onClose, onSaved }) {
  const employeeOptions = employees || [];
  const [form, setForm] = useState({
    employee_id: "",
    employee_name: "",
    leave_type: "vacation",
    start_date: "",
    end_date: "",
    total_days: 1,
    reason: "",
    status: "pending",
    ...leave,
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
    const today = getTodayYMD();
    const effectiveStartDate = form.start_date || "";
    const effectiveEndDate = form.end_date || "";

    if (effectiveStartDate < today || effectiveEndDate < today) {
      alert("Past dates are not allowed. Please select today or a future date.");
      return;
    }

    if (effectiveEndDate < effectiveStartDate) {
      alert("End date cannot be earlier than start date.");
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
        leave_type: form.leave_type,
        start_date: form.start_date,
        end_date: form.end_date,
        total_days: form.total_days ? Number(form.total_days) : null,
        reason: form.reason,
        status: form.status,
      };

      if (leave?.id) {
        const { error } = await supabase
          .from("leave_requests")
          .update(payload)
          .eq("id", leave.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("leave_requests")
          .insert([payload]);
        if (error) throw error;
      }
      onSaved();
    } catch (error) {
      console.error("Error saving leave request:", error.message);
      alert("Failed to save: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold">
            {leave ? "Edit Leave Request" : "New Leave Request"}
          </h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="p-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  set(
                    "employee_name",
                    employee ? formatEmployeeLabel(employee) : ""
                  );
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
            <div>
              <label className="text-xs font-medium text-slate-600">
                Leave Type
              </label>
              <select
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
                value={form.leave_type}
                onChange={(e) => set("leave_type", e.target.value)}
              >
                {leaveTypes.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-600">
                Start Date *
              </label>
              <Input
                className="mt-1"
                type="date"
                min={getTodayYMD()}
                value={form.start_date || ""}
                onChange={(e) => set("start_date", e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">
                End Date *
              </label>
              <Input
                className="mt-1"
                type="date"
                min={form.start_date || getTodayYMD()}
                value={form.end_date || ""}
                onChange={(e) => set("end_date", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-600">
                Total Days
              </label>
              <Input
                className="mt-1"
                type="number"
                min="1"
                step="0.5"
                value={form.total_days || ""}
                onChange={(e) => set("total_days", e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">
                Status
              </label>
              <select
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
              >
                {["pending", "approved", "rejected", "cancelled"].map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Reason</label>
            <textarea
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              rows={4}
              value={form.reason || ""}
              onChange={(e) => set("reason", e.target.value)}
              placeholder="Add leave remarks or context"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={save}
            disabled={saving || !form.employee_id || !form.start_date || !form.end_date}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function LeaveDetailsModal({ leave, onClose, onEdit }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold">
            Leave {leave?.employee_name || leave?.employee_id || "Request"}
          </h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Requested By</p>
            <p className="mt-1 font-medium text-slate-900">{leave?.employee_name || leave?.employee_id || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Leave Type</p>
            <p className="mt-1 font-medium text-slate-900 capitalize">{leave?.leave_type || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Start Date</p>
            <p className="mt-1 font-medium text-slate-900">{formatDate(leave?.start_date)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">End Date</p>
            <p className="mt-1 font-medium text-slate-900">{formatDate(leave?.end_date)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Days</p>
            <p className="mt-1 font-medium text-slate-900">{leave?.total_days ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Status</p>
            <p className="mt-1 font-medium text-slate-900 capitalize">{leave?.status || "—"}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Reason</p>
            <p className="mt-1 text-slate-700 whitespace-pre-wrap">
              {leave?.reason || "No remarks provided."}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Submitted</p>
            <p className="mt-1 font-medium text-slate-900">{formatDate(leave?.created_at)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Approved By</p>
            <p className="mt-1 font-medium text-slate-900">{leave?.approved_by_name || leave?.approved_by_id || "—"}</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={onEdit}>Edit</Button>
        </div>
      </div>
    </div>
  );
}

// --- THE MAIN PAGE (READ & QUICK APPROVE) ---
export default function Leaves() {
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editLeave, setEditLeave] = useState(null);
  const [viewLeave, setViewLeave] = useState(null);
  const [statusFilter, setStatusFilter] = useState("pending");

  const load = async () => {
    try {
      setLoading(true);
      const [leaveResult, employeeResult] = await Promise.all([
        supabase
          .from("leave_requests")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("employees")
          .select("id, employee_code, first_name, last_name")
          .order("first_name", { ascending: true }),
      ]);

      if (leaveResult.error) throw leaveResult.error;
      if (employeeResult.error) throw employeeResult.error;

      setLeaves(leaveResult.data || []);
      setEmployees(employeeResult.data || []);
    } catch (error) {
      console.error("Failed to load leave requests:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // One-click approve/reject function
  const quickApprove = async (l, status) => {
    try {
      const { error } = await supabase
        .from("leave_requests")
        .update({ status })
        .eq("id", l.id);
      if (error) throw error;
      load(); // Refresh the board
    } catch (error) {
      console.error(`Failed to mark as ${status}:`, error.message);
      alert("Action failed.");
    }
  };

  const filtered = statusFilter
    ? leaves.filter((l) => l.status === statusFilter)
    : leaves;

  const searched = filtered.filter((leave) => {
    if (!search) return true;
    const haystack = [
      leave.employee_name,
      leave.employee_id,
      leave.leave_type,
      leave.status,
      leave.reason,
      leave.start_date,
      leave.end_date,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  const summary = useMemo(
    () => ({
      total: leaves.length,
      pending: leaves.filter((leave) => leave.status === "pending").length,
      approved: leaves.filter((leave) => leave.status === "approved").length,
      rejected: leaves.filter((leave) => leave.status === "rejected").length,
    }),
    [leaves]
  );

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leave Requests</h1>
          <p className="text-sm text-slate-500 mt-1">
            Submit, review, and approve leave applications.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditLeave(null);
            setShowModal(true);
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" /> New Request
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          ["Total", summary.total],
          ["Pending", summary.pending],
          ["Approved", summary.approved],
        ].map(([label, value]) => (
          <div
            key={label}
            className="bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm"
          >
            <p className="text-xs uppercase tracking-wide text-slate-500">
              {label}
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative w-full max-w-sm">
          <Input
            className="pl-3"
            placeholder="Search leave requests..."
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
            ["cancelled", "Cancelled"],
          ].map(([value, label]) => (
            <option key={value || "all"} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* List */}
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
                  "Leave Type",
                  "Dates",
                  "Days",
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
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    No leave requests found for this filter.
                  </td>
                </tr>
              ) : (
                searched.map((leave) => (
                  <tr key={leave.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">
                        {leave.employee_name || leave.employee_id || "—"}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        {leave.employee_id ? leave.employee_id.slice(0, 8) : ""}
                      </div>
                    </td>
                    <td className="px-4 py-3 capitalize text-slate-600">
                      {leave.leave_type}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div>{formatDate(leave.start_date)}</div>
                      <div className="text-xs text-slate-400">
                        to {formatDate(leave.end_date)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {leave.total_days ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize border ${statusColors[leave.status] || "bg-slate-100 text-slate-600 border-slate-200"}`}
                      >
                        {statusLabels[leave.status] || leave.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 flex-wrap">
                        <button
                          onClick={() => {
                            setViewLeave(leave);
                            setShowDetailsModal(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {leave.status === "pending" && (
                          <>
                            <button
                              onClick={() => quickApprove(leave, "approved")}
                              className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded"
                              title="Approve"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => quickApprove(leave, "rejected")}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => {
                            setEditLeave(leave);
                            setShowModal(true);
                          }}
                          className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline px-2 py-1"
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
        <LeaveModal
          leave={editLeave}
          employees={employees}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            load();
          }}
        />
      )}

      {showDetailsModal && viewLeave && (
        <LeaveDetailsModal
          leave={viewLeave}
          onClose={() => setShowDetailsModal(false)}
          onEdit={() => {
            setShowDetailsModal(false);
            setEditLeave(viewLeave);
            setShowModal(true);
          }}
        />
      )}
    </div>
  );
}
