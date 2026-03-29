import { useState, useEffect } from "react";
import { supabase } from "@/api/base44Client"; // <-- Clean Supabase import
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
];

// --- HEADCOUNT REPORT ---
function HeadcountReport() {
  const [data, setData] = useState([]);
  const [empList, setEmpList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHeadcount = async () => {
      try {
        const { data: emps, error } = await supabase
          .from("employees")
          .select("*, departments(name)");

        if (error) throw error;
        setEmpList(emps || []);

        const byDept = {};
        emps.forEach((e) => {
          const k = e.departments?.name || "Unassigned";
          byDept[k] = (byDept[k] || 0) + 1;
        });
        setData(
          Object.entries(byDept).map(([name, value]) => ({ name, value })),
        );
      } catch (err) {
        console.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchHeadcount();
  }, []);

  const active = empList.filter((e) =>
    ["regular", "probationary", "contractual"].includes(e.status),
  ).length;
  const separated = empList.filter((e) =>
    ["resigned", "terminated"].includes(e.status),
  ).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          ["Total", empList.length, "text-slate-900"],
          ["Active", active, "text-green-600"],
          ["Separated", separated, "text-red-500"],
          ["Departments", data.length, "text-blue-600"],
        ].map(([l, v, c]) => (
          <div
            key={l}
            className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"
          >
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              {l}
            </p>
            <p className={`text-2xl font-bold mt-1 ${c}`}>{v}</p>
          </div>
        ))}
      </div>
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-6">
            Employees by Department
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f1f5f9"
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#64748b" }}
              />
              <Tooltip
                cursor={{ fill: "#f8fafc" }}
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
              />
              <Bar
                dataKey="value"
                name="Employees"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                barSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// --- LEAVE REPORT ---
function LeaveReport() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        const { data: leaves, error } = await supabase
          .from("leave_requests")
          .select("*");
        if (error) throw error;

        const byType = {};
        leaves.forEach((l) => {
          const k = l.leave_type || "other";
          // Note: total_days might be null in DB, fallback to 1
          byType[k] = (byType[k] || 0) + (Number(l.total_days) || 1);
        });
        setData(
          Object.entries(byType).map(([name, value]) => ({ name, value })),
        );
      } catch (err) {
        console.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaves();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">
            Leave Days Utilization by Type
          </h3>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                nameKey="name"
                label={({ name, value }) => `${name}: ${value}d`}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Legend verticalAlign="bottom" height={36} />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// --- PAYROLL REPORT ---
function PayrollReport() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayroll = async () => {
      try {
        const { data: periods, error } = await supabase
          .from("payroll_periods")
          .select("*")
          .order("start_date", { ascending: false })
          .limit(10);

        if (error) throw error;
        setData(
          periods.reverse().map((p) => ({
            name: p.name || p.start_date,
            gross: Number(p.total_gross) || 0,
            net: Number(p.total_net) || 0,
          })),
        );
      } catch (err) {
        console.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPayroll();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">
            Payroll Trend (Last 10 Periods)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f1f5f9"
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "#64748b" }}
                axisLine={false}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 12, fill: "#64748b" }}
              />
              <Tooltip formatter={(v) => `₱${Number(v).toLocaleString()}`} />
              <Bar
                dataKey="gross"
                name="Gross Pay"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="net"
                name="Net Pay"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// --- ATTRITION REPORT ---
function AttritionReport() {
  const [emps, setEmps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttrition = async () => {
      try {
        const { data, error } = await supabase
          .from("employees")
          .select("*, departments(name), positions(title)");
        if (error) throw error;
        setEmps(data || []);
      } catch (err) {
        console.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAttrition();
  }, []);

  const separated = emps.filter((e) =>
    ["resigned", "terminated"].includes(e.status),
  );
  const total = emps.length;
  const rate = total ? ((separated.length / total) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          ["Total Staff", total, "text-slate-900"],
          ["Separated", separated.length, "text-red-500"],
          ["Attrition Rate", `${rate}%`, "text-orange-500"],
        ].map(([l, v, c]) => (
          <div
            key={l}
            className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"
          >
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              {l}
            </p>
            <p className={`text-2xl font-bold mt-1 ${c}`}>{v}</p>
          </div>
        ))}
      </div>
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-slate-50">
            <h3 className="font-semibold text-slate-800">
              Separated Employees Registry
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white border-b">
                <tr>
                  {["Name", "Department", "Position", "Status"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {separated.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-center py-12 text-slate-400"
                    >
                      No separation records found.
                    </td>
                  </tr>
                ) : (
                  separated.map((e) => (
                    <tr
                      key={e.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">
                        {e.first_name} {e.last_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {e.departments?.name || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {e.positions?.title || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${e.status === "resigned" ? "bg-gray-100 text-gray-600" : "bg-red-50 text-red-600 border border-red-100"}`}
                        >
                          {e.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// --- MAIN WRAPPER ---
const reportTypes = [
  { key: "headcount", label: "Headcount", component: HeadcountReport },
  { key: "leaves", label: "Leave Analytics", component: LeaveReport },
  { key: "payroll", label: "Payroll History", component: PayrollReport },
  { key: "attrition", label: "Attrition Log", component: AttritionReport },
];

export default function Reports() {
  const [activeKey, setActiveKey] = useState("headcount");
  const active = reportTypes.find((r) => r.key === activeKey) || reportTypes[0];
  const Component = active.component;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            HR Analytics & Reports
          </h1>
          <p className="text-sm text-slate-500">
            Visualize organizational data and performance trends.
          </p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap border-b border-slate-200 pb-1">
        {reportTypes.map((r) => (
          <button
            key={r.key}
            onClick={() => setActiveKey(r.key)}
            className={`px-4 py-2 text-sm font-medium transition-all relative ${
              activeKey === r.key
                ? "text-blue-600"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {r.label}
            {activeKey === r.key && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <Component />
      </div>
    </div>
  );
}
