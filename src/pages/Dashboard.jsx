import { useState, useEffect } from "react";
import { supabase } from "@/api/base44Client"; // <-- Using the clean Supabase client
import {
  Users,
  Clock,
  Briefcase,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Calendar,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const [stats, setStats] = useState({
    employees: 0,
    leaves: 0,
    openJobs: 0,
    pendingOT: 0,
  });
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        // Fetch counts securely and efficiently using Supabase
        const [
          { count: empCount },
          { count: leavesCount },
          { count: jobsCount },
          { count: otCount },
          { data: annData },
        ] = await Promise.all([
          supabase
            .from("employees")
            .select("*", { count: "exact", head: true }),
          supabase
            .from("leave_requests")
            .select("*", { count: "exact", head: true })
            .eq("status", "pending"),
          supabase
            .from("job_postings")
            .select("*", { count: "exact", head: true })
            .eq("status", "open"),
          supabase
            .from("overtime_requests")
            .select("*", { count: "exact", head: true })
            .eq("status", "pending"),
          supabase
            .from("announcements")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(5),
        ]);

        setStats({
          employees: empCount || 0,
          leaves: leavesCount || 0,
          openJobs: jobsCount || 0,
          pendingOT: otCount || 0,
        });
        setAnnouncements(annData || []);
      } catch (error) {
        console.error("Dashboard Error:", error.message);
      } finally {
        setLoading(false); // <-- The guaranteed Spinner Killer
      }
    };

    load();
  }, []);

  const cards = [
    {
      label: "Total Employees",
      value: stats.employees,
      icon: Users,
      color: "bg-blue-500",
      link: "/employees",
    },
    {
      label: "Pending Leaves",
      value: stats.leaves,
      icon: Calendar,
      color: "bg-yellow-500",
      link: "/leaves",
    },
    {
      label: "Open Job Postings",
      value: stats.openJobs,
      icon: Briefcase,
      color: "bg-green-500",
      link: "/job-postings",
    },
    {
      label: "Pending Overtime",
      value: stats.pendingOT,
      icon: Clock,
      color: "bg-purple-500",
      link: "/overtime",
    },
  ];

  if (loading)
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">HR Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">
          Welcome back! Here's an overview of your workforce.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              to={card.link}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{card.label}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">
                    {card.value}
                  </p>
                </div>
                <div className={`${card.color} p-3 rounded-xl`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Announcements */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Latest Announcements
          </h2>
          <Link
            to="/announcements"
            className="text-blue-600 text-sm hover:underline"
          >
            View all
          </Link>
        </div>
        {announcements.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">
            No announcements yet.
          </p>
        ) : (
          <div className="space-y-3">
            {announcements.map((a) => (
              <div
                key={a.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-slate-50"
              >
                <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-slate-800 text-sm">
                    {a.title}
                  </p>
                  <p className="text-slate-500 text-xs mt-0.5 line-clamp-2">
                    {a.content}
                  </p>
                  {/* Changed from created_date to created_at to match our SQL schema */}
                  <p className="text-slate-400 text-xs mt-1">
                    {new Date(a.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Add Employee",
            link: "/employees",
            color: "text-blue-600 bg-blue-50 border-blue-200",
          },
          {
            label: "Process Payroll",
            link: "/payroll",
            color: "text-green-600 bg-green-50 border-green-200",
          },
          {
            label: "Approve Leaves",
            link: "/leaves",
            color: "text-yellow-600 bg-yellow-50 border-yellow-200",
          },
          {
            label: "View Reports",
            link: "/reports/headcount",
            color: "text-purple-600 bg-purple-50 border-purple-200",
          },
        ].map((q) => (
          <Link
            key={q.label}
            to={q.link}
            className={`border rounded-xl p-4 text-sm font-medium text-center hover:shadow-sm transition-shadow ${q.color}`}
          >
            {q.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
