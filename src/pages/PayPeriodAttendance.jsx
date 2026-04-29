import { useState, useEffect } from "react";
import { supabase } from "@/api/base44Client";
import {
  Search,
  Calendar,
  Calculator,
  FileSpreadsheet,
  Download,
  AlertCircle,
  Home,
  Star,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- CUSTOM ALERT MODAL ---
function CustomAlert({ isOpen, title, message, onClose }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center border border-slate-100">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
          <AlertCircle className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 mb-6">{message}</p>
        <Button
          onClick={onClose}
          className="w-full bg-[#2E6F40] hover:bg-[#235330] text-white rounded-xl"
        >
          Acknowledge
        </Button>
      </div>
    </div>
  );
}

// --- HELPER: Parse Time String to Minutes ---
const parseTime = (timeString) => {
  if (!timeString) return 0;
  const [h, m] = timeString.split(":").map(Number);
  return h * 60 + m;
};

export default function PayPeriodAttendance() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");
  const [employees, setEmployees] = useState([]);
  const [results, setResults] = useState([]);
  const [calculating, setCalculating] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
  });

  // Initial Load: Fetch Employees and their Schedules
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const { data } = await supabase
          .from("employees")
          .select(
            "id, first_name, last_name, employee_code, schedule_id, positions(title)",
          )
          .order("first_name", { ascending: true });

        if (data) setEmployees(data);
      } catch (err) {
        console.error("Error loading employees", err);
      }
    };
    fetchEmployees();
  }, []);

  // --- THE ATTENDANCE TALLY ENGINE ---
  const handleCalculate = async () => {
    if (!startDate || !endDate) {
      return setAlertConfig({
        isOpen: true,
        title: "Missing Dates",
        message: "Please select both a Start Date and an End Date.",
      });
    }

    setCalculating(true);
    try {
      const startIso = `${startDate}T00:00:00Z`;
      const endIso = `${endDate}T23:59:59Z`;

      // 1. Fetch Global Data for the Date Range
      const { data: allLogs } = await supabase
        .from("attendance_logs")
        .select("employee_id, type, calculated_server_time")
        .gte("calculated_server_time", startIso)
        .lte("calculated_server_time", endIso);

      const { data: allLeaves } = await supabase
        .from("leave_requests")
        .select("employee_id, start_date, end_date, status, leave_type")
        .eq("status", "approved")
        .lte("start_date", endDate)
        .gte("end_date", startDate);

      const { data: allOT } = await supabase
        .from("overtime_requests")
        .select("employee_id, date, hours, status")
        .eq("status", "approved")
        .gte("date", startDate)
        .lte("date", endDate);

      const { data: holidays } = await supabase
        .from("holidays")
        .select("date, type, pay_rate_multiplier")
        .gte("date", startDate)
        .lte("date", endDate);

      const { data: schedules } = await supabase.from("schedules").select("*");

      // 2. Process Data Per Employee
      const computedData = employees.map((emp) => {
        let schedule = {
          expected_time_in: "08:00:00",
          expected_time_out: "17:00:00",
          grace_period_mins: 15,
          work_days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
        };
        if (emp.schedule_id) {
          const s = schedules?.find((sc) => sc.id === emp.schedule_id);
          if (s) schedule = s;
        }

        const empLogs = allLogs?.filter((l) => l.employee_id === emp.id) || [];
        const empLeaves =
          allLeaves?.filter((l) => l.employee_id === emp.id) || [];
        const empOT = allOT?.filter((o) => o.employee_id === emp.id) || [];

        const logsByDate = {};
        empLogs.forEach((l) => {
          const d = new Date(l.calculated_server_time);
          const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          if (!logsByDate[dateStr])
            logsByDate[dateStr] = { in: null, out: null };
          const mins = d.getHours() * 60 + d.getMinutes();
          if (
            l.type === "time_in" &&
            (logsByDate[dateStr].in === null || mins < logsByDate[dateStr].in)
          )
            logsByDate[dateStr].in = mins;
          if (
            l.type === "time_out" &&
            (logsByDate[dateStr].out === null || mins > logsByDate[dateStr].out)
          )
            logsByDate[dateStr].out = mins;
        });

        const expectedIn = parseTime(schedule.expected_time_in);
        const expectedOut = parseTime(schedule.expected_time_out);
        const grace = schedule.grace_period_mins || 0;

        let totalPaidLeaves = 0;
        let totalUnpaidLeaves = 0;
        let totalLatesMins = 0;
        let totalUndertimeMins = 0;
        let regularOTHours = 0;
        let specialOTHours = 0;

        let curr = new Date(startDate);
        const end = new Date(endDate);

        while (curr <= end) {
          const y = curr.getFullYear();
          const m = String(curr.getMonth() + 1).padStart(2, "0");
          const day = String(curr.getDate()).padStart(2, "0");
          const dateStr = `${y}-${m}-${day}`;
          const dayName = curr
            .toLocaleDateString("en-US", { weekday: "long" })
            .toLowerCase();

          let isWorkDay = false;
          if (Array.isArray(schedule.work_days))
            isWorkDay = schedule.work_days
              .map((d) => String(d).toLowerCase())
              .includes(dayName);
          else if (typeof schedule.work_days === "string")
            isWorkDay = schedule.work_days.toLowerCase().includes(dayName);

          const isHoliday = holidays?.find((h) => h.date === dateStr);
          const isOnLeave = empLeaves.some(
            (l) => dateStr >= l.start_date && dateStr <= l.end_date,
          );
          const otLog = empOT.find((o) => o.date === dateStr);
          const dailyLog = logsByDate[dateStr];

          // Check Leaves
          if (isOnLeave && isWorkDay) {
            totalPaidLeaves += 1;
          }
          // Check Lates & Undertime on Normal Work Days
          else if (isWorkDay && !isHoliday) {
            if (dailyLog?.in !== null && dailyLog?.out !== null) {
              if (dailyLog.in > expectedIn + grace)
                totalLatesMins += dailyLog.in - expectedIn;
              if (dailyLog.out < expectedOut)
                totalUndertimeMins += expectedOut - dailyLog.out;
            } else if (!dailyLog || dailyLog.in === null) {
              totalUnpaidLeaves += 1;
            }
          }

          // Check Overtime
          if (otLog) {
            if (isHoliday || !isWorkDay) {
              specialOTHours += Number(otLog.hours);
            } else {
              regularOTHours += Number(otLog.hours);
            }
          }

          curr.setDate(curr.getDate() + 1);
        }

        return {
          ...emp,
          paidLeaves: totalPaidLeaves,
          unpaidLeaves: totalUnpaidLeaves,
          latesHours: (totalLatesMins / 60).toFixed(1),
          undertimeHours: (totalUndertimeMins / 60).toFixed(1),
          regularOT: regularOTHours.toFixed(1),
          specialOT: specialOTHours.toFixed(1),
        };
      });

      setResults(computedData);
    } catch (err) {
      setAlertConfig({
        isOpen: true,
        title: "Calculation Failed",
        message: err.message,
      });
    } finally {
      setCalculating(false);
    }
  };

  const handleExportCSV = () => {
    if (results.length === 0) return;

    let csv =
      "Employee Name,Employee No.,Type,Leaves W/ Pay,Leaves W/O Pay,Lates (Hrs),Undertime (Hrs),Regular OT,Special OT\n";

    results.forEach((emp) => {
      csv += `"${emp.last_name}, ${emp.first_name}","${emp.employee_code || ""}","FTE",${emp.paidLeaves},${emp.unpaidLeaves},${emp.latesHours},${emp.undertimeHours},${emp.regularOT},${emp.specialOT}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Pay_Period_Attendance_${startDate}_to_${endDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const filteredResults = results.filter((e) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      e.first_name.toLowerCase().includes(term) ||
      e.last_name.toLowerCase().includes(term) ||
      (e.employee_code || "").toLowerCase().includes(term)
    );
  });

  return (
    <div className="p-6 max-w-[1400px] mx-auto pb-10 space-y-6 bg-white min-h-screen">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <h1 className="text-[22px] font-bold text-[#8b6b4a] flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6" />
            Pay Period Attendance
          </h1>
          <div className="flex items-center gap-2 text-[#2E6F40] ml-2">
            <Home className="w-4 h-4 cursor-pointer hover:text-[#235330] transition-colors" />
            <Star className="w-4 h-4 cursor-pointer hover:text-[#235330] transition-colors" />
          </div>
        </div>

        <div className="flex gap-2">
          {/* THE EXPORT AS CSV BUTTON */}
          <Button
            onClick={handleExportCSV}
            disabled={results.length === 0}
            variant="outline"
            className="border-[#2E6F40] text-[#2E6F40] hover:bg-[#2E6F40]/10 bg-white rounded-xl px-5 gap-2 shadow-sm transition-colors font-bold"
          >
            <Download className="w-4 h-4" /> Export as CSV
          </Button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex flex-wrap gap-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100 items-end shadow-sm">
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
            Start Date
          </label>
          <div className="flex items-center bg-white border border-slate-200 rounded-lg px-3 shadow-sm h-10">
            <Calendar className="w-4 h-4 text-slate-400 mr-2" />
            <input
              type="date"
              className="bg-transparent text-sm font-medium text-slate-700 outline-none w-full"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
            End Date
          </label>
          <input
            type="date"
            className="bg-white border border-slate-200 text-sm font-medium text-slate-700 outline-none rounded-lg px-3 h-10 shadow-sm"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <Button
          onClick={handleCalculate}
          disabled={calculating}
          className="bg-[#2E6F40] hover:bg-[#235330] text-white rounded-lg h-10 px-6 font-bold shadow-md gap-2"
        >
          {calculating ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <Filter className="w-4 h-4" />
          )}
          {calculating ? "Filtering..." : "Filter & Compute"}
        </Button>

        <div className="ml-auto w-full sm:w-auto mt-4 sm:mt-0">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
            Search Employee
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search..."
              className="pl-9 bg-white border-slate-200 rounded-lg h-10 shadow-sm focus-visible:ring-[#2E6F40]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* MAIN TABLE */}
      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b text-slate-600">
              <tr>
                <th className="px-6 py-4 font-bold text-[11px] uppercase tracking-wider w-16">
                  #
                </th>
                <th className="px-6 py-4 font-bold text-[11px] uppercase tracking-wider">
                  Employee Name
                </th>
                <th className="px-6 py-4 font-bold text-[11px] uppercase tracking-wider">
                  Employee No.
                </th>
                <th className="px-6 py-4 font-bold text-[11px] uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 font-bold text-[11px] uppercase tracking-wider text-center">
                  Leaves W/ Pay
                </th>
                <th className="px-6 py-4 font-bold text-[11px] uppercase tracking-wider text-center">
                  Leaves W/O Pay
                </th>
                <th className="px-6 py-4 font-bold text-[11px] uppercase tracking-wider text-center">
                  Lates (Hrs)
                </th>
                <th className="px-6 py-4 font-bold text-[11px] uppercase tracking-wider text-center">
                  Undertime (Hrs)
                </th>
                <th className="px-6 py-4 font-bold text-[11px] uppercase tracking-wider text-center">
                  Regular OT
                </th>
                <th className="px-6 py-4 font-bold text-[11px] uppercase tracking-wider text-center">
                  Special OT
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {calculating ? (
                <tr>
                  <td colSpan={10} className="text-center py-24">
                    <div className="w-10 h-10 border-4 border-[#2E6F40]/30 border-t-[#2E6F40] rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-sm font-bold text-slate-600">
                      Cross-referencing DTR, Leaves, and Overtime...
                    </p>
                  </td>
                </tr>
              ) : results.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-24">
                    <Calculator className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-base font-bold text-slate-700">
                      No Data Calculated
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      Select a date range and click "Filter & Compute" to
                      generate the attendance tally.
                    </p>
                  </td>
                </tr>
              ) : filteredResults.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="text-center py-16 text-slate-400 font-medium"
                  >
                    No employees match your search.
                  </td>
                </tr>
              ) : (
                filteredResults.map((emp, idx) => (
                  <tr
                    key={emp.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-slate-400 font-medium">
                      {idx + 1}
                    </td>

                    <td className="px-6 py-4 font-bold text-slate-800 uppercase text-xs tracking-wide">
                      {emp.last_name}, {emp.first_name}
                    </td>

                    <td className="px-6 py-4 text-slate-600 font-mono text-xs">
                      {emp.employee_code || "—"}
                    </td>

                    <td className="px-6 py-4 text-slate-600 font-semibold text-xs">
                      FTE
                    </td>

                    <td className="px-6 py-4 text-center font-semibold text-slate-700">
                      {emp.paidLeaves}
                    </td>

                    <td className="px-6 py-4 text-center font-semibold text-slate-700">
                      {emp.unpaidLeaves}
                    </td>

                    <td
                      className={`px-6 py-4 text-center font-mono font-bold ${emp.latesHours > 0 ? "text-red-600 bg-red-50/50" : "text-slate-500"}`}
                    >
                      {emp.latesHours}
                    </td>

                    <td
                      className={`px-6 py-4 text-center font-mono font-bold ${emp.undertimeHours > 0 ? "text-orange-600 bg-orange-50/50" : "text-slate-500"}`}
                    >
                      {emp.undertimeHours}
                    </td>

                    <td
                      className={`px-6 py-4 text-center font-mono font-bold ${emp.regularOT > 0 ? "text-[#2E6F40] bg-[#2E6F40]/10" : "text-slate-500"}`}
                    >
                      {emp.regularOT}
                    </td>

                    <td
                      className={`px-6 py-4 text-center font-mono font-bold ${emp.specialOT > 0 ? "text-blue-700 bg-blue-50" : "text-slate-500"}`}
                    >
                      {emp.specialOT}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CustomAlert
        isOpen={alertConfig.isOpen}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() =>
          setAlertConfig({ isOpen: false, title: "", message: "" })
        }
      />
    </div>
  );
}
