import { useEffect, useState } from "react";
import { supabase } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import {
  CalendarDays,
  Clock,
  Plus,
  FileText,
  CheckCircle2,
  XCircle,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ESSRequests() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("leave"); // 'leave' or 'overtime'

  // Data State
  const [leaves, setLeaves] = useState([]);
  const [overtimes, setOvertimes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    type: "",
    start: "",
    end: "",
    reason: "",
  });
  const [otForm, setOtForm] = useState({ date: "", hours: "", reason: "" });

  const fetchData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [leavesRes, otRes] = await Promise.all([
        supabase
          .from("leave_requests")
          .select("*")
          .eq("employee_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("overtime_requests")
          .select("*")
          .eq("employee_id", user.id)
          .order("created_at", { ascending: false }),
      ]);
      if (leavesRes.data) setLeaves(leavesRes.data);
      if (otRes.data) setOvertimes(otRes.data);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const submitLeave = async (e) => {
    e.preventDefault();
    if (!leaveForm.type || !leaveForm.start || !leaveForm.end)
      return alert("Please fill all required fields.");

    setIsSubmitting(true);
    try {
      // Calculate simple total days (excludes weekends logic for simplicity here)
      const start = new Date(leaveForm.start);
      const end = new Date(leaveForm.end);
      const totalDays = Math.max(
        1,
        Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1,
      );

      const fullName = [user.first_name, user.last_name]
        .filter(Boolean)
        .join(" ");

      const { error } = await supabase.from("leave_requests").insert([
        {
          employee_id: user.id,
          employee_name: fullName,
          leave_type: leaveForm.type,
          start_date: leaveForm.start,
          end_date: leaveForm.end,
          total_days: totalDays,
          reason: leaveForm.reason,
          status: "pending",
        },
      ]);

      if (error) throw error;
      alert("Leave request submitted successfully!");
      setLeaveForm({ type: "", start: "", end: "", reason: "" });
      fetchData();
    } catch (error) {
      alert("Failed to submit leave: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitOvertime = async (e) => {
    e.preventDefault();
    if (!otForm.date || !otForm.hours)
      return alert("Please fill all required fields.");

    setIsSubmitting(true);
    try {
      const fullName = [user.first_name, user.last_name]
        .filter(Boolean)
        .join(" ");
      const { error } = await supabase.from("overtime_requests").insert([
        {
          employee_id: user.id,
          employee_name: fullName,
          date: otForm.date,
          requested_hours: parseFloat(otForm.hours),
          reason: otForm.reason,
          status: "pending",
        },
      ]);

      if (error) throw error;
      alert("Overtime request submitted successfully!");
      setOtForm({ date: "", hours: "", reason: "" });
      fetchData();
    } catch (error) {
      alert("Failed to submit overtime: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const StatusBadge = ({ status }) => {
    if (status === "approved")
      return (
        <span className="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full uppercase">
          <CheckCircle2 className="w-3 h-3" /> Approved
        </span>
      );
    if (status === "rejected")
      return (
        <span className="flex items-center gap-1 text-xs font-bold text-red-700 bg-red-100 px-2 py-1 rounded-full uppercase">
          <XCircle className="w-3 h-3" /> Rejected
        </span>
      );
    return (
      <span className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-full uppercase">
        <Timer className="w-3 h-3" /> Pending
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          File Requests
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          Submit and track your leave and overtime applications.
        </p>
      </div>

      <div className="flex gap-2 p-1 bg-slate-200/50 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("leave")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === "leave" ? "bg-white text-[#2E6F40] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          <CalendarDays className="w-4 h-4" /> Leave Requests
        </button>
        <button
          onClick={() => setActiveTab("overtime")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === "overtime" ? "bg-white text-[#2E6F40] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          <Clock className="w-4 h-4" /> Overtime
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FORM SECTION */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#2E6F40]" />{" "}
              {activeTab === "leave" ? "New Leave" : "New Overtime"}
            </h3>

            {activeTab === "leave" ? (
              <form onSubmit={submitLeave} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">
                    Leave Type
                  </label>
                  <Select
                    value={leaveForm.type}
                    onValueChange={(val) =>
                      setLeaveForm({ ...leaveForm, type: val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Vacation Leave">
                        Vacation Leave
                      </SelectItem>
                      <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                      <SelectItem value="Emergency Leave">
                        Emergency Leave
                      </SelectItem>
                      <SelectItem value="Maternity/Paternity">
                        Maternity/Paternity Leave
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase">
                      Start Date
                    </label>
                    <Input
                      type="date"
                      value={leaveForm.start}
                      onChange={(e) =>
                        setLeaveForm({ ...leaveForm, start: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase">
                      End Date
                    </label>
                    <Input
                      type="date"
                      value={leaveForm.end}
                      onChange={(e) =>
                        setLeaveForm({ ...leaveForm, end: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">
                    Reason
                  </label>
                  <textarea
                    className="w-full border border-slate-200 rounded-lg p-3 text-sm focus-visible:outline-[#2E6F40]"
                    rows="3"
                    placeholder="Brief explanation..."
                    value={leaveForm.reason}
                    onChange={(e) =>
                      setLeaveForm({ ...leaveForm, reason: e.target.value })
                    }
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#2E6F40] hover:bg-[#235330]"
                >
                  {isSubmitting ? "Submitting..." : "Submit Leave"}
                </Button>
              </form>
            ) : (
              <form onSubmit={submitOvertime} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">
                    Target Date
                  </label>
                  <Input
                    type="date"
                    value={otForm.date}
                    onChange={(e) =>
                      setOtForm({ ...otForm, date: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">
                    Requested Hours
                  </label>
                  <Input
                    type="number"
                    step="0.5"
                    placeholder="e.g. 2.5"
                    value={otForm.hours}
                    onChange={(e) =>
                      setOtForm({ ...otForm, hours: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">
                    Reason / Task
                  </label>
                  <textarea
                    className="w-full border border-slate-200 rounded-lg p-3 text-sm focus-visible:outline-[#2E6F40]"
                    rows="3"
                    placeholder="What task requires overtime?"
                    value={otForm.reason}
                    onChange={(e) =>
                      setOtForm({ ...otForm, reason: e.target.value })
                    }
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#2E6F40] hover:bg-[#235330]"
                >
                  {isSubmitting ? "Submitting..." : "Submit Overtime"}
                </Button>
              </form>
            )}
          </div>
        </div>

        {/* HISTORY SECTION */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#2E6F40]" /> Request History
            </h3>

            <div className="space-y-3">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-[#2E6F40]/30 border-t-[#2E6F40] rounded-full animate-spin"></div>
                </div>
              ) : activeTab === "leave" ? (
                leaves.length === 0 ? (
                  <p className="text-center text-slate-500 py-10 bg-slate-50 rounded-xl">
                    No leave requests found.
                  </p>
                ) : (
                  leaves.map((req) => (
                    <div
                      key={req.id}
                      className="p-4 bg-white border border-slate-200 rounded-xl flex items-start justify-between hover:border-[#2E6F40]/30 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <p className="font-bold text-slate-900">
                            {req.leave_type}
                          </p>
                          <StatusBadge status={req.status} />
                        </div>
                        <p className="text-sm text-slate-600 mb-2">
                          {new Date(req.start_date).toLocaleDateString()} —{" "}
                          {new Date(req.end_date).toLocaleDateString()} (
                          {req.total_days} days)
                        </p>
                        <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                          "{req.reason || "No reason provided"}"
                        </p>
                      </div>
                    </div>
                  ))
                )
              ) : overtimes.length === 0 ? (
                <p className="text-center text-slate-500 py-10 bg-slate-50 rounded-xl">
                  No overtime requests found.
                </p>
              ) : (
                overtimes.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 bg-white border border-slate-200 rounded-xl flex items-start justify-between hover:border-[#2E6F40]/30 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-bold text-slate-900">
                          {new Date(req.date).toLocaleDateString()}
                        </p>
                        <StatusBadge status={req.status} />
                      </div>
                      <p className="text-sm text-slate-600 mb-2">
                        Requested:{" "}
                        <span className="font-bold">
                          {req.requested_hours} hours
                        </span>
                      </p>
                      <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        "{req.reason || "No reason provided"}"
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
