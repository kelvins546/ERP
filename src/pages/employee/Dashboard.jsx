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
} from "lucide-react";

export default function ESSDashboard() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Fetch all announcements
        const { data, error } = await supabase
          .from("announcements")
          .select("*")
          .order("is_pinned", { ascending: false })
          .order("created_at", { ascending: false });

        if (error) throw error;

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of today for accurate comparison

        // Smart Filtering Logic
        const activeAnnouncements = (data || []).filter((ann) => {
          // 1. Filter out expired announcements
          if (ann.close_date) {
            const closeDate = new Date(ann.close_date);
            closeDate.setHours(23, 59, 59, 999); // Allow it to stay active until the very end of the close date
            if (closeDate < today) return false;
          }

          // 2. Filter by Department Target
          // If target_department_id is empty/null, it's a global announcement for everyone
          if (!ann.target_department_id) return true;

          // If it has specific departments, check if the logged-in user belongs to one of them
          const targetDeptIds = ann.target_department_id.split(",");
          if (
            user.department_id &&
            targetDeptIds.includes(user.department_id)
          ) {
            return true;
          }

          // Otherwise, hide it from this employee
          return false;
        });

        setAnnouncements(activeAnnouncements);
      } catch (error) {
        console.error("Error fetching announcements:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
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
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 bg-gradient-to-br from-white to-slate-50">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Welcome back, {user?.first_name || "Team Member"}
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          Here is what is happening at Ark Industries today.
        </p>
      </div>

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
              <span className="text-xs font-bold bg-slate-200 text-slate-600 px-2 py-1 rounded-full">
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

        {/* Sidebar Widgets (Placeholders for next steps) */}
        <div className="space-y-6">
          {/* Quick Actions Placeholder */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#2E6F40]" /> Today's Schedule
            </h3>
            <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-sm font-medium text-slate-500">
                Time-in component coming soon
              </p>
            </div>
          </div>

          {/* Leave Balances Placeholder */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#2E6F40]" /> Leave Balances
            </h3>
            <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-sm font-medium text-slate-500">
                Leave credits coming soon
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
