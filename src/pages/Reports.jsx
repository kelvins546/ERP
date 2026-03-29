import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#06b6d4"];

const urlParams = new URLSearchParams(window.location.search);

function HeadcountReport() {
  const [data, setData] = useState([]);
  const [empList, setEmpList] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    base44.entities.Employee.list().then(emps => {
      setEmpList(emps);
      const byDept = {};
      emps.forEach(e => { const k = e.department_name || "Unassigned"; byDept[k] = (byDept[k] || 0) + 1; });
      setData(Object.entries(byDept).map(([name, value]) => ({ name, value })));
      setLoading(false);
    });
  }, []);
  const active = empList.filter(e => ["regular","probationary","contractual"].includes(e.status)).length;
  const separated = empList.filter(e => ["resigned","terminated"].includes(e.status)).length;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[["Total", empList.length, "text-slate-900"], ["Active", active, "text-green-600"], ["Separated", separated, "text-red-500"], ["Departments", data.length, "text-blue-600"]].map(([l, v, c]) => (
          <div key={l} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"><p className="text-xs text-slate-400">{l}</p><p className={`text-2xl font-bold mt-1 ${c}`}>{v}</p></div>
        ))}
      </div>
      {loading ? <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div> : (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">Employees by Department</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fontSize: 12 }} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" name="Employees" fill="#3b82f6" radius={[4,4,0,0]} /></BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function LeaveReport() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    base44.entities.LeaveRequest.list().then(leaves => {
      const byType = {};
      leaves.forEach(l => { const k = l.leave_type || "other"; byType[k] = (byType[k] || 0) + (l.total_days || 1); });
      setData(Object.entries(byType).map(([name, value]) => ({ name, value })));
      setLoading(false);
    });
  }, []);
  return (
    <div className="space-y-6">
      {loading ? <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div> : (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">Leave Days by Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart><Pie data={data} cx="50%" cy="50%" outerRadius={100} dataKey="value" nameKey="name" label={({ name, value }) => `${name}: ${value}`}>{data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Legend /><Tooltip /></PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function PayrollReport() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    base44.entities.PayrollPeriod.list("-start_date", 10).then(periods => {
      setData(periods.map(p => ({ name: p.name || p.start_date, gross: p.total_gross || 0, net: p.total_net || 0 })));
      setLoading(false);
    });
  }, []);
  return (
    <div className="space-y-6">
      {loading ? <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div> : (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">Payroll Summary (Last 10 Periods)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tickFormatter={v => `₱${(v/1000).toFixed(0)}k`} /><Tooltip formatter={v => `₱${Number(v).toLocaleString()}`} /><Bar dataKey="gross" name="Gross" fill="#3b82f6" radius={[4,4,0,0]} /><Bar dataKey="net" name="Net" fill="#10b981" radius={[4,4,0,0]} /></BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function AttritionReport() {
  const [emps, setEmps] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { base44.entities.Employee.list().then(d => { setEmps(d); setLoading(false); }); }, []);
  const separated = emps.filter(e => ["resigned","terminated"].includes(e.status));
  const total = emps.length;
  const rate = total ? ((separated.length / total) * 100).toFixed(1) : 0;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[["Total Employees", total, "text-slate-900"], ["Separated", separated.length, "text-red-500"], ["Attrition Rate", `${rate}%`, "text-orange-500"]].map(([l,v,c]) => (
          <div key={l} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"><p className="text-xs text-slate-400">{l}</p><p className={`text-2xl font-bold mt-1 ${c}`}>{v}</p></div>
        ))}
      </div>
      {loading ? <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div> : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b"><h3 className="font-semibold text-slate-800">Separated Employees</h3></div>
          <table className="w-full"><thead className="bg-slate-50 border-b"><tr>{["Name","Department","Position","Status"].map(h => <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {separated.length === 0 ? <tr><td colSpan={4} className="text-center py-8 text-slate-400">No separated employees.</td></tr> : separated.map(e => (
                <tr key={e.id} className="hover:bg-slate-50"><td className="px-4 py-3 text-sm font-medium text-slate-900">{e.first_name} {e.last_name}</td><td className="px-4 py-3 text-sm text-slate-600">{e.department_name||"—"}</td><td className="px-4 py-3 text-sm text-slate-600">{e.position_name||"—"}</td><td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full capitalize ${e.status === "resigned" ? "bg-gray-100 text-gray-600" : "bg-red-100 text-red-700"}`}>{e.status}</span></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const reportTypes = [
  { key: "headcount", label: "Headcount", component: HeadcountReport },
  { key: "leaves", label: "Leave Balance", component: LeaveReport },
  { key: "payroll", label: "Payroll Summary", component: PayrollReport },
  { key: "attrition", label: "Attrition", component: AttritionReport },
];

export default function Reports() {
  const path = window.location.pathname;
  const activeKey = path.split("/reports/")[1] || "headcount";
  const active = reportTypes.find(r => r.key === activeKey) || reportTypes[0];
  const Component = active.component;

  return (
    <div className="p-6 space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">HR Reports</h1>
      <div className="flex gap-2 flex-wrap">
        {reportTypes.map(r => (
          <a key={r.key} href={`/reports/${r.key}`} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${active.key === r.key ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{r.label}</a>
        ))}
      </div>
      <Component />
    </div>
  );
}