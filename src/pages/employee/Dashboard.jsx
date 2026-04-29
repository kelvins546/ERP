import { useEffect, useState } from "react";
import { supabase } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import {
  Megaphone,
  Pin,
  AlertCircle,
  Info,
  AlertTriangle,
  Calendar,
  Clock,
  ClipboardList,
  CheckCircle2,
} from "lucide-react";

export default function ESSDashboard() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  // New States for Tasks and NTEs
  const [myTasks, setMyTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [ntes, setNtes] = useState([]);

  useEffect(() => {
    if (!user) return;

    // 1. Fetch Announcements
    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("announcements")
          .select("*")
          .order("is_pinned", { ascending: false })
          .order("created_at", { ascending: false });

        if (error) {
          console.warn("Announcements table missing or error:", error.message);
          return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const activeAnnouncements = (data || []).filter((ann) => {
          if (ann.close_date) {
            const closeDate = new Date(ann.close_date);
            closeDate.setHours(23, 59, 59, 999);
            if (closeDate < today) return false;
          }
          if (!ann.target_department_id) return true;
          const targetDeptIds = ann.target_department_id.split(",");
          if (
            user.department_id &&
            targetDeptIds.includes(user.department_id)
          ) {
            return true;
          }
          return false;
        });

        setAnnouncements(activeAnnouncements);
      } catch (error) {
        console.error("Error fetching announcements:", error.message);
      } finally {
        setLoading(false);
      }
    };

    // 2. Fetch Pending Tasks (Updated to use 'employee_id' instead of 'assigned_to')
    const fetchTasks = async () => {
      try {
        setTasksLoading(true);
        const { data, error } = await supabase
          .from("employee_tasks")
          .select("*")
          .eq("employee_id", user.id) // FIXED: Standardized column name
          .neq("status", "Completed")
          .order("due_date", { ascending: true })
          .limit(5);

        if (error) {
          console.warn("Tasks table error (400/404) - Skipping gracefully.");
          setMyTasks([]);
        } else if (data) {
          setMyTasks(data);
        }
      } catch (error) {
        console.error("Error fetching tasks:", error.message);
        setMyTasks([]);
      } finally {
        setTasksLoading(false);
      }
    };

    // 3. Fetch Pending Notice to Explain (NTE)
    const fetchNTEs = async () => {
      try {
        const { data, error } = await supabase
          .from("disciplinary_records")
          .select("*")
          .eq("employee_id", user.id)
          .in("status", ["Pending", "Issued", "Pending Explanation"]);

        if (error) {
          console.warn(
            "Disciplinary table not found (404) - Skipping gracefully.",
          );
          return;
        }

        if (data) {
          const nteRecords = data.filter(
            (d) =>
              (d.action_taken || d.incident_type || d.status || "")
                .toLowerCase()
                .includes("nte") ||
              (d.action_taken || d.incident_type || d.status || "")
                .toLowerCase()
                .includes("explain") ||
              d.status === "Pending",
          );
          setNtes(nteRecords);
        }
      } catch (error) {
        console.error("Error fetching NTEs:", error.message);
      }
    };

    fetchAnnouncements();
    fetchTasks();
    fetchNTEs();
  }, [user]);

  // UI Helper for different announcement priorities/types
  const getTypeConfig = (type) => {
    switch (type?.toLowerCase()) {
      case "criticals":
      case "critical":
        return {
          icon: AlertTriangle,
          color: "text-red-700",
          bg: "bg-red-50",
          border: "border-red-200",
        };
      case "urgents":
      case "urgent":
        return {
          icon: AlertCircle,
          color: "text-orange-700",
          bg: "bg-orange-50",
          border: "border-orange-200",
        };
      default:
        return {
          icon: Info,
          color: "text-blue-700",
          bg: "bg-blue-50",
          border: "border-blue-200",
        };
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Welcome Banner */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 bg-gradient-to-br from-white to-slate-50 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#2E6F40]/5 rounded-full blur-2xl"></div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Welcome back, {user?.first_name || "Team Member"}
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          Here is what is happening at Ark Industries today.
        </p>
      </div>

      {/* DYNAMIC NTE BANNER (Notice to Explain) */}
      {ntes.length > 0 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
          {ntes.map((nte) => (
            <div
              key={nte.id}
              className="bg-red-50 border-l-4 border-red-600 p-5 rounded-r-2xl shadow-sm flex items-start gap-4"
            >
              <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-1 animate-pulse" />
              <div className="flex-1">
                <h3 className="text-red-800 font-bold text-lg mb-1">
                  Notice to Explain (NTE) Required
                </h3>
                <p className="text-red-700 text-sm mb-3">
                  You have been issued an official Notice to Explain regarding a
                  recent incident. Please submit your written explanation to HR
                  before the deadline.
                </p>
                <div className="bg-white/80 p-4 rounded-xl border border-red-100 text-sm text-red-900 mb-3 shadow-inner">
                  <strong className="block text-xs uppercase tracking-widest text-red-500 mb-1">
                    Incident Description:
                  </strong>
                  {nte.description ||
                    nte.incident_type ||
                    "Please check with HR for detailed information regarding this incident."}
                </div>
                <div className="inline-flex items-center gap-2 text-sm font-black text-red-800 bg-red-100/50 px-3 py-1.5 rounded-lg border border-red-200">
                  <Clock className="w-4 h-4" />
                  DEADLINE:{" "}
                  {nte.deadline
                    ? new Date(nte.deadline).toLocaleDateString(undefined, {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "Immediate Action Required"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Feed: Announcements */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-[#2E6F40]" />
                <h2 className="text-lg font-bold text-slate-800">
                  Company Announcements
                </h2>
              </div>
              <span className="text-xs font-bold bg-[#2E6F40]/10 text-[#2E6F40] px-2.5 py-1 rounded-full border border-[#2E6F40]/20">
                {announcements.length} New
              </span>
            </div>

            <div className="p-5">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-4 border-[#2E6F40]/30 border-t-[#2E6F40] rounded-full animate-spin"></div>
                </div>
              ) : announcements.length === 0 ? (
                <div className="text-center py-12 text-slate-400 bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200">
                  <Megaphone className="w-8 h-8 mx-auto text-slate-300 mb-3" />
                  <p className="font-medium text-slate-500">
                    You are all caught up!
                  </p>
                  <p className="text-xs mt-1">
                    No active announcements for your department.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {announcements.map((ann) => {
                    const TypeConfig = getTypeConfig(ann.type || ann.priority);
                    const Icon = TypeConfig.icon;

                    return (
                      <div
                        key={ann.id}
                        className={`p-5 rounded-xl border transition-all hover:shadow-md ${TypeConfig.border} ${TypeConfig.bg} relative`}
                      >
                        {ann.is_pinned && (
                          <div
                            className="absolute top-5 right-5"
                            title="Pinned Announcement"
                          >
                            <Pin
                              className={`w-4 h-4 ${TypeConfig.color} fill-current opacity-60`}
                            />
                          </div>
                        )}
                        <div className="flex items-start gap-3.5">
                          <div
                            className={`mt-0.5 p-2 bg-white/60 rounded-lg shadow-sm ${TypeConfig.color}`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="pr-6 flex-1">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span
                                className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border border-white/50 bg-white/50 ${TypeConfig.color}`}
                              >
                                {ann.type?.replace("s", "") || "Notice"}
                              </span>
                              <span className="text-xs font-semibold text-slate-500">
                                {new Date(ann.created_at).toLocaleDateString(
                                  undefined,
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  },
                                )}
                              </span>
                            </div>
                            <h3 className="text-base font-bold text-slate-900 mb-2 leading-tight">
                              {ann.title}
                            </h3>
                            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-white/40 p-3 rounded-lg border border-white/40">
                              {ann.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Widget: My Tasks */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col min-h-[350px]">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 pb-3 border-b border-slate-100">
              <ClipboardList className="w-5 h-5 text-[#2E6F40]" /> My Tasks
            </h3>

            <div className="flex-1">
              {tasksLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-6 h-6 border-2 border-[#2E6F40]/30 border-t-[#2E6F40] rounded-full animate-spin"></div>
                </div>
              ) : myTasks.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200 h-full flex flex-col items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-500">
                    All caught up!
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    No pending tasks assigned to you.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myTasks.map((task) => {
                    // Check if task is overdue
                    const isOverdue =
                      task.due_date &&
                      new Date(task.due_date) <
                        new Date(new Date().setHours(0, 0, 0, 0));

                    return (
                      <div
                        key={task.id}
                        className={`p-3 border rounded-xl transition-all hover:shadow-sm ${isOverdue ? "bg-red-50/50 border-red-100" : "bg-slate-50 border-slate-100 hover:border-[#2E6F40]/30"}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 shrink-0">
                            <div className="w-4 h-4 rounded border-2 border-slate-300 bg-white cursor-pointer hover:border-[#2E6F40] transition-colors"></div>
                          </div>
                          <div>
                            <p
                              className={`text-sm font-bold leading-tight ${isOverdue ? "text-red-900" : "text-slate-800"}`}
                            >
                              {task.title || task.task_name}
                            </p>
                            <div
                              className={`flex items-center gap-1.5 mt-1.5 text-[11px] font-bold ${isOverdue ? "text-red-600" : "text-slate-500"}`}
                            >
                              <Calendar className="w-3.5 h-3.5" />
                              {task.due_date
                                ? new Date(task.due_date).toLocaleDateString(
                                    undefined,
                                    {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    },
                                  )
                                : "No Deadline"}
                              {isOverdue && (
                                <span className="ml-1 uppercase bg-red-100 px-1.5 py-0.5 rounded text-[9px]">
                                  Overdue
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
