import { useState, useEffect, useRef } from "react";
import { supabase } from "@/api/base44Client";
import {
  Plus,
  X,
  Trash2,
  Calculator,
  TrendingUp,
  TrendingDown,
  UserCheck,
  AlertCircle,
  Eye,
  Edit,
  Search,
  Printer,
  Layers,
  Clock,
  CalendarX,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function CustomAlert({ isOpen, title, message, onClose }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
          <AlertCircle className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 mb-6">{message}</p>
        <Button
          onClick={onClose}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white"
        >
          Acknowledge
        </Button>
      </div>
    </div>
  );
}

function CustomConfirm({ isOpen, title, message, onCancel, onConfirm }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
          <AlertCircle className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 mb-6">{message}</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} className="w-full">
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            Confirm Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- PAYROLL PERIOD MASTER LIST MODAL ---
function ViewPayrollModal({ isOpen, periodId, periodName, onClose }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [groupByCostCenter, setGroupByCostCenter] = useState(false);

  useEffect(() => {
    const fetchPayrollDetails = async () => {
      setLoading(true);
      try {
        const { data: payslipsData, error } = await supabase
          .from("payslips")
          .select(
            `
            id, gross_pay, net_pay, total_deductions,
            employees ( first_name, last_name, employee_code, positions ( title ), project_sites ( name ) )
          `,
          )
          .eq("period_id", periodId);

        if (error) throw error;
        setData(payslipsData || []);
      } catch (err) {
        console.error("Error fetching payroll details:", err.message);
      } finally {
        setLoading(false);
      }
    };
    if (isOpen && periodId) fetchPayrollDetails();
  }, [isOpen, periodId]);

  if (!isOpen) return null;

  const filtered = data.filter((p) => {
    if (!search) return true;
    const name =
      `${p.employees?.first_name || ""} ${p.employees?.last_name || ""}`.toLowerCase();
    const code = (p.employees?.employee_code || "").toLowerCase();
    return (
      name.includes(search.toLowerCase()) || code.includes(search.toLowerCase())
    );
  });

  const costCenters = filtered.reduce((acc, curr) => {
    const site =
      curr.employees?.project_sites?.name || "Headquarters / Internal";
    if (!acc[site]) acc[site] = { count: 0, gross: 0, net: 0, deductions: 0 };
    acc[site].count += 1;
    acc[site].gross += Number(curr.gross_pay || 0);
    acc[site].net += Number(curr.net_pay || 0);
    acc[site].deductions += Number(curr.total_deductions || 0);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b shrink-0 bg-white">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Master Payroll Report
            </h2>
            <p className="text-sm font-medium text-[#2E6F40] mt-1">
              {periodName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-5 border-b shrink-0 bg-slate-50 flex justify-between items-center">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              className="pl-9 bg-white focus-visible:ring-[#2E6F40] rounded-xl"
              placeholder="Search by name or employee no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={groupByCostCenter}
            />
          </div>
          <Button
            variant={groupByCostCenter ? "default" : "outline"}
            className={`rounded-xl gap-2 ${groupByCostCenter ? "bg-[#2E6F40] hover:bg-[#235330] text-white shadow-md" : ""}`}
            onClick={() => setGroupByCostCenter(!groupByCostCenter)}
          >
            <Layers className="w-4 h-4" />{" "}
            {groupByCostCenter
              ? "Viewing Cost Centers"
              : "Group by Cost Center"}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-[#2E6F40]/30 border-t-[#2E6F40] rounded-full animate-spin" />
            </div>
          ) : groupByCostCenter ? (
            <table className="w-full text-sm">
              <thead className="bg-slate-100 border-b sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Project / Cost Center
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Headcount
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Gross Payroll
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Total Deductions
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Net Cash Released
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(costCenters).map(([site, totals]) => (
                  <tr
                    key={site}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-5 font-bold text-slate-800">
                      {site}
                    </td>
                    <td className="px-6 py-5 text-center font-medium text-slate-600">
                      {totals.count} Emp(s)
                    </td>
                    <td className="px-6 py-5 text-right font-semibold text-slate-700">
                      ₱
                      {totals.gross.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-6 py-5 text-right font-semibold text-red-600">
                      ₱
                      {totals.deductions.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-6 py-5 text-right font-black text-[#2E6F40] text-lg">
                      ₱
                      {totals.net.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-white border-b sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Employee No.
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Project Site
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Net Pay
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center py-12 text-slate-400"
                    >
                      No matching employees found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-3">
                        <Eye className="w-4 h-4 text-slate-300" />
                        {p.employees
                          ? `${p.employees.first_name} ${p.employees.last_name}`
                          : "Unknown Employee"}
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                        {p.employees?.employee_code || "—"}
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {p.employees?.positions?.title || "—"}
                      </td>
                      <td className="px-6 py-4 text-slate-600 uppercase text-xs font-bold bg-slate-50/50">
                        {p.employees?.project_sites?.name || "Internal"}
                      </td>
                      <td className="px-6 py-4 font-black text-[#2E6F40] text-right text-base">
                        ₱
                        {Number(p.net_pay || 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
        <div className="p-5 border-t shrink-0 flex justify-end bg-white">
          <Button variant="outline" className="rounded-xl" onClick={onClose}>
            Close Window
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- PAYSLIP PDF PREVIEW MODAL ---
function PayslipPreviewModal({ payslip, onClose }) {
  const iframeRef = useRef(null);

  if (!payslip) return null;

  const logoUrl = `${window.location.origin}/folder/logo.jpg`;
  const p = payslip;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Payslip - ${p.employees?.first_name || ""} ${p.employees?.last_name || ""}</title>
      <style>
        @page { margin: 20mm; size: letter; }
        body { font-family: 'Arial', sans-serif; color: #000; margin: 0; padding: 20px 0; font-size: 12px; }
        .container { max-width: 800px; margin: 40px auto; border: 1px solid #000; padding: 40px; box-sizing: border-box; }
        .header { display: flex; gap: 20px; align-items: flex-start; margin-bottom: 40px; }
        .logo { width: 80px; height: 80px; object-fit: contain; }
        .emp-details { display: flex; flex-direction: column; gap: 4px; }
        .emp-details span { font-size: 12px; }
        .content { display: flex; gap: 40px; }
        .col { flex: 1; }
        .section-title { font-weight: bold; font-size: 13px; margin-bottom: 15px; border-bottom: 1px solid #000; padding-bottom: 4px; }
        .row { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .row.indent { padding-left: 10px; }
        .val { text-align: right; }
        .summary-box { margin-top: 20px; border-top: 1px solid #000; padding-top: 15px; }
        .net-pay { font-weight: bold; font-size: 14px; margin-top: 10px; padding-top: 10px; border-top: 1px solid #000; text-transform: uppercase; }
        .text-red { color: #dc2626; }
        .text-slate { color: #64748b; font-size: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${logoUrl}" class="logo" alt="Company Logo" />
          <div class="emp-details">
            <span><strong>Name:</strong> ${p.employees?.last_name || ""}, ${p.employees?.first_name || ""}</span>
            <span><strong>Position:</strong> ${p.employees?.positions?.title || p.employees?.departments?.name || "Staff"}</span>
            <span><strong>Pay Period:</strong> ${p.payroll_periods?.name || ""}</span>
          </div>
        </div>
        <div class="content">
          <div class="col">
            <div class="section-title">Earnings & Adjustments</div>
            <div class="row"><span>Basic Salary</span><span class="val">${Number(p.gross_pay || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
            ${p.holiday_pay > 0 ? `<div class="row"><span>Regular Holiday Premium <br><span class="text-slate">(${p.reg_holiday_hours || 0} hrs)</span></span><span class="val">${Number(p.holiday_pay).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>` : ""}
            ${p.overtime_pay > 0 ? `<div class="row"><span>Overtime Pay <br><span class="text-slate">(1.0x Rate)</span></span><span class="val">${Number(p.overtime_pay).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>` : ""}
            ${p.allowances > 0 ? `<div class="row"><span>Allowances & Subsidies</span><span class="val">${Number(p.allowances).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>` : ""}
            ${p.absences_lates > 0 ? `<div style="margin-top: 20px;" class="row"><strong>Less: Tardiness / Absences</strong></div><div class="row indent"><span class="text-red">Absences <span class="text-slate">(${p.days_absent || 0} days)</span> & Lates <span class="text-slate">(${p.minutes_late || 0} mins)</span></span><span class="val text-red">- ${Number(p.absences_lates).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>` : ""}
          </div>
          <div class="col">
            <div class="section-title">Government & Company Deductions</div>
            <div class="row indent"><span>SSS Contribution (50%)</span><span class="val">${Number(p.sss_deduction || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
            <div class="row indent"><span>PhilHealth (50%)</span><span class="val">${Number(p.philhealth_deduction || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
            <div class="row indent"><span>Pag-IBIG (50%)</span><span class="val">${Number(p.pagibig_deduction || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
            <div class="row indent"><span>Withholding Tax</span><span class="val">${Number(p.tax_deduction || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
            ${p.loan_deductions > 0 ? `<div class="row indent"><span>Loan Deductions</span><span class="val">${Number(p.loan_deductions).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>` : ""}
            <div class="summary-box">
              <div class="row"><strong>Summary</strong></div>
              <div class="row indent"><span>Total Gross Earnings</span><span class="val">${(Number(p.gross_pay || 0) + Number(p.overtime_pay || 0) + Number(p.holiday_pay || 0) + Number(p.allowances || 0) - Number(p.absences_lates || 0)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
              <div class="row indent"><span>Total Deductions</span><span class="val">${Number(p.total_deductions || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
              <div class="row net-pay"><span>NET PAY</span><span class="val">${Number(p.net_pay || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const handlePrint = () => {
    if (iframeRef.current) iframeRef.current.contentWindow.print();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden border border-slate-100">
        <div className="flex items-center justify-between p-6 border-b shrink-0 bg-white">
          <h2 className="text-xl font-bold text-slate-900">
            Payslip Document Preview
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="flex-1 bg-slate-100 overflow-hidden p-6 flex justify-center">
          <iframe
            ref={iframeRef}
            srcDoc={html}
            title="Payslip PDF Preview"
            className="w-full max-w-[850px] h-full bg-white shadow-md border border-slate-200 rounded"
          />
        </div>
        <div className="p-6 border-t shrink-0 flex justify-end gap-3 bg-white">
          <Button
            variant="outline"
            className="rounded-xl px-6"
            onClick={onClose}
          >
            Back
          </Button>
          <Button
            className="bg-[#2E6F40] hover:bg-[#235330] text-white gap-2 rounded-xl px-6 shadow-md"
            onClick={handlePrint}
          >
            <Printer className="w-4 h-4" /> Print / Save as PDF
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- DTR ENGINE HELPER FUNCTIONS ---
const parseTime = (timeString) => {
  if (!timeString) return 0;
  const [h, m] = timeString.split(":").map(Number);
  return h * 60 + m;
};

// --- THE AUTOMATED DTR ENGINE ---
const generateAutomatedDTR = async (employeeId, startDate, endDate) => {
  let daysAbsent = 0;
  let minutesLate = 0;
  let regHolidayHours = 0;

  try {
    // 1. Fetch Schedule
    const { data: emp } = await supabase
      .from("employees")
      .select("schedule_id")
      .eq("id", employeeId)
      .single();
    let schedule = {
      expected_time_in: "08:00:00",
      expected_time_out: "17:00:00",
      grace_period_mins: 15,
      work_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    };
    if (emp?.schedule_id) {
      const { data: sched } = await supabase
        .from("schedules")
        .select("*")
        .eq("id", emp.schedule_id)
        .single();
      if (sched) schedule = sched;
    }

    // 2. Fetch Logs
    const { data: logs } = await supabase
      .from("attendance_logs")
      .select("type, calculated_server_time")
      .eq("employee_id", employeeId)
      .gte("calculated_server_time", `${startDate}T00:00:00Z`)
      .lte("calculated_server_time", `${endDate}T23:59:59Z`);

    // 3. Fetch Leaves
    const { data: leaves } = await supabase
      .from("leave_requests")
      .select("start_date, end_date")
      .eq("employee_id", employeeId)
      .eq("status", "approved")
      .lte("start_date", endDate)
      .gte("end_date", startDate);

    // 4. Fetch Holidays
    const { data: holidays } = await supabase
      .from("holidays")
      .select("date, type")
      .gte("date", startDate)
      .lte("date", endDate);

    // Group logs by Date
    const logsByDate = {};
    if (logs) {
      logs.forEach((l) => {
        const d = new Date(l.calculated_server_time);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const dateStr = `${y}-${m}-${day}`;

        if (!logsByDate[dateStr]) logsByDate[dateStr] = { in: null, out: null };
        const mins = d.getHours() * 60 + d.getMinutes();
        if (l.type === "time_in") {
          if (logsByDate[dateStr].in === null || mins < logsByDate[dateStr].in)
            logsByDate[dateStr].in = mins;
        } else if (l.type === "time_out") {
          if (
            logsByDate[dateStr].out === null ||
            mins > logsByDate[dateStr].out
          )
            logsByDate[dateStr].out = mins;
        }
      });
    }

    const expectedInMins = parseTime(schedule.expected_time_in);

    // Loop through every day in the cutoff
    const start = new Date(startDate);
    const end = new Date(endDate);
    let curr = new Date(start);

    while (curr <= end) {
      const y = curr.getFullYear();
      const m = String(curr.getMonth() + 1).padStart(2, "0");
      const day = String(curr.getDate()).padStart(2, "0");
      const dateStr = `${y}-${m}-${day}`;
      const dayName = curr.toLocaleDateString("en-US", { weekday: "long" });

      const isWorkDay = schedule.work_days.includes(dayName);
      const dailyLog = logsByDate[dateStr];
      const isHoliday = holidays?.find((h) => h.date === dateStr);
      const isOnLeave = leaves?.some(
        (l) => dateStr >= l.start_date && dateStr <= l.end_date,
      );

      if (isWorkDay) {
        if (isOnLeave) {
          // Paid leave, ignore absences/lates
        } else if (isHoliday) {
          if (isHoliday.type === "regular" && dailyLog?.in && dailyLog?.out) {
            // Client Rule: Double pay for regular holiday if worked
            const hrs = (dailyLog.out - dailyLog.in) / 60;
            regHolidayHours += Math.max(0, hrs);
          }
        } else {
          // Normal working day
          if (!dailyLog || dailyLog.in === null) {
            daysAbsent++; // No logs found
          } else {
            if (dailyLog.in > expectedInMins + schedule.grace_period_mins) {
              minutesLate += dailyLog.in - expectedInMins; // Late detected
            }
          }
        }
      }
      curr.setDate(curr.getDate() + 1);
    }
    return { daysAbsent, minutesLate, regHolidayHours };
  } catch (error) {
    console.error("DTR Engine Error:", error);
    return { daysAbsent: 0, minutesLate: 0, regHolidayHours: 0 };
  }
};

// --- STATIC PAYROLL LOGIC ---
// --- PAYROLL COMPUTATION ENGINE (CLIENT RULES APPLIED) ---
const computeGovtDeductionsSplit = (monthlySalary) => {
  let sssMonth = 0;
  if (monthlySalary > 0) {
    const cappedSalary = Math.min(monthlySalary, 30000);
    sssMonth = cappedSalary * 0.045;
  }

  // FIXED PHILHEALTH LOGIC (With Minimum Floor)
  let philhealthMonth = 0;
  if (monthlySalary > 0) {
    if (monthlySalary <= 10000) {
      philhealthMonth = 250; // Minimum fixed employee share for 10k and below
    } else {
      const cappedSalary = Math.min(monthlySalary, 100000);
      philhealthMonth = cappedSalary * 0.025;
    }
  }

  // Client Rule: "Divided into 2 yun deductions"
  return {
    sss: Math.round((sssMonth / 2) * 100) / 100,
    philhealth: Math.round((philhealthMonth / 2) * 100) / 100,
    pagibig: 100, // 100 per cutoff = 200 monthly
  };
};

const computeTax = (taxableIncome) => {
  let tax = 0;
  if (taxableIncome <= 10417) tax = 0;
  else if (taxableIncome <= 16666) tax = (taxableIncome - 10417) * 0.15;
  else if (taxableIncome <= 33332) tax = 937.5 + (taxableIncome - 16667) * 0.2;
  else if (taxableIncome <= 83332)
    tax = 4270.83 + (taxableIncome - 33333) * 0.25;
  else if (taxableIncome <= 333332)
    tax = 16770.83 + (taxableIncome - 83333) * 0.3;
  else tax = 91770.83 + (taxableIncome - 333333) * 0.35;
  return Math.round(tax * 100) / 100;
};

// --- THE MODAL (CREATE & UPDATE SINGLE PAYSLIP) ---
function PayslipModal({
  payslip,
  employeesList,
  periodsList,
  onClose,
  onSaved,
}) {
  const [form, setForm] = useState({
    employee_id: "",
    period_id: "",
    days_absent: payslip?.days_absent || 0,
    minutes_late: payslip?.minutes_late || 0,
    absences_lates: payslip?.absences_lates || 0,
    reg_holiday_hours: payslip?.reg_holiday_hours || 0,
    holiday_pay: payslip?.holiday_pay || 0,
    gross_pay: payslip?.gross_pay || 0,
    overtime_pay: payslip?.overtime_pay || 0,
    allowances: payslip?.allowances || 0,
    sss_deduction: payslip?.sss_deduction || 0,
    philhealth_deduction: payslip?.philhealth_deduction || 0,
    pagibig_deduction: payslip?.pagibig_deduction || 0,
    tax_deduction: payslip?.tax_deduction || 0,
    loan_deductions: payslip?.loan_deductions || 0,
    total_deductions: payslip?.total_deductions || 0,
    net_pay: payslip?.net_pay || 0,
    ...payslip,
  });

  const [saving, setSaving] = useState(false);
  const [computing, setComputing] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
  });

  useEffect(() => {
    const totalDeductions =
      Number(form.sss_deduction || 0) +
      Number(form.philhealth_deduction || 0) +
      Number(form.pagibig_deduction || 0) +
      Number(form.tax_deduction || 0) +
      Number(form.loan_deductions || 0) +
      Number(form.absences_lates || 0);

    const net =
      Number(form.gross_pay || 0) +
      Number(form.overtime_pay || 0) +
      Number(form.holiday_pay || 0) +
      Number(form.allowances || 0) -
      totalDeductions;

    setForm((f) => ({ ...f, total_deductions: totalDeductions, net_pay: net }));
  }, [
    form.gross_pay,
    form.overtime_pay,
    form.holiday_pay,
    form.allowances,
    form.sss_deduction,
    form.philhealth_deduction,
    form.pagibig_deduction,
    form.tax_deduction,
    form.loan_deductions,
    form.absences_lates,
  ]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // --- THE FULLY AUTOMATED ENGINE EXECUTION ---
  const handleAutoCompute = async () => {
    if (!form.employee_id || !form.period_id) {
      setAlertConfig({
        isOpen: true,
        title: "Action Required",
        message: "Please select an Employee and a Payroll Period.",
      });
      return;
    }

    setComputing(true);
    try {
      const selectedPeriod = periodsList.find((p) => p.id === form.period_id);
      if (!selectedPeriod) throw new Error("Payroll Period not found.");

      // 1. RUN DTR ENGINE
      const dtr = await generateAutomatedDTR(
        form.employee_id,
        selectedPeriod.start_date,
        selectedPeriod.end_date,
      );

      // 2. Fetch Salary Profile
      const { data: profile, error: profileErr } = await supabase
        .from("salary_profiles")
        .select("*")
        .eq("employee_id", form.employee_id)
        .single();
      if (profileErr || !profile)
        throw new Error("Could not find a Salary Profile.");

      const monthlyBasic =
        profile.pay_frequency === "monthly"
          ? Number(profile.basic_salary)
          : Number(profile.basic_salary) * 2;
      const semiMonthlyPay = monthlyBasic / 2;

      const dailyRate = monthlyBasic / 22;
      const hourlyRate = dailyRate / 8;
      const minuteRate = hourlyRate / 60;

      // 3. Compute Lates/Absences penalty (Client Rules)
      const absDays = dtr.daysAbsent;
      const mins = dtr.minutesLate;

      let lateAmount = 0;
      if (mins >= 1 && mins <= 15) lateAmount = mins * minuteRate;
      else if (mins >= 16 && mins <= 60) lateAmount = 2 * hourlyRate;
      else if (mins >= 61 && mins <= 120) lateAmount = 3 * hourlyRate;
      else if (mins >= 121 && mins <= 180) lateAmount = 4 * hourlyRate;
      else if (mins > 180) lateAmount = dailyRate;

      const absencesLatesTotal = absDays * dailyRate + lateAmount;

      // 4. Overtime Fetching
      let calculatedOTPay = 0;
      const { data: otData } = await supabase
        .from("overtime_requests")
        .select("hours")
        .eq("employee_id", form.employee_id)
        .eq("status", "approved")
        .gte("date", selectedPeriod.start_date)
        .lte("date", selectedPeriod.end_date);

      if (otData) {
        const totalOTHours = otData.reduce(
          (sum, row) => sum + Number(row.hours),
          0,
        );
        calculatedOTPay = totalOTHours * hourlyRate * 1.0;
      }

      // 5. Holiday Compute
      const calculatedHolidayPay = dtr.regHolidayHours * hourlyRate;

      // 6. Loans & Allowances
      const { data: loans } = await supabase
        .from("company_loans")
        .select("deduction_per_period")
        .eq("employee_id", form.employee_id)
        .eq("status", "active");
      const totalLoanDeduction = loans
        ? loans.reduce(
            (sum, loan) => sum + Number(loan.deduction_per_period),
            0,
          )
        : 0;

      const { data: activeAllowances } = await supabase
        .from("employee_allowances")
        .select("amount, frequency, is_taxable")
        .eq("employee_id", form.employee_id);
      let taxableAllowances = 0;
      let nonTaxableAllowances = 0;
      if (activeAllowances) {
        activeAllowances.forEach((a) => {
          let amt = Number(a.amount);
          if (
            profile.pay_frequency === "semi_monthly" &&
            a.frequency === "monthly"
          )
            amt = amt / 2;
          if (a.is_taxable) taxableAllowances += amt;
          else nonTaxableAllowances += amt;
        });
      }

      // 7. Deductions & Taxes
      const baseForGovtAndTax = semiMonthlyPay - absencesLatesTotal;
      const autoGovt = computeGovtDeductionsSplit(monthlyBasic);

      let finalSSS =
        profile.sss_contribution > 0
          ? profile.sss_contribution / 2
          : autoGovt.sss;
      let finalPagibig =
        profile.pagibig_contribution > 0
          ? profile.pagibig_contribution / 2
          : autoGovt.pagibig;
      let finalPhilhealth =
        profile.philhealth_contribution > 0
          ? profile.philhealth_contribution / 2
          : autoGovt.philhealth;

      const totalTaxableEarnings =
        baseForGovtAndTax +
        calculatedOTPay +
        calculatedHolidayPay +
        taxableAllowances;
      const taxableIncomeForTax =
        totalTaxableEarnings - (finalSSS + finalPhilhealth + finalPagibig);

      // 8. UPDATE UI
      setForm((f) => ({
        ...f,
        days_absent: dtr.daysAbsent,
        minutes_late: dtr.minutesLate,
        reg_holiday_hours: Math.round(dtr.regHolidayHours * 100) / 100,
        gross_pay: Math.round(semiMonthlyPay * 100) / 100,
        absences_lates: Math.round(absencesLatesTotal * 100) / 100,
        overtime_pay: Math.round(calculatedOTPay * 100) / 100,
        holiday_pay: Math.round(calculatedHolidayPay * 100) / 100,
        allowances: taxableAllowances + nonTaxableAllowances,
        sss_deduction: finalSSS,
        philhealth_deduction: finalPhilhealth,
        pagibig_deduction: finalPagibig,
        tax_deduction: computeTax(taxableIncomeForTax),
        loan_deductions: totalLoanDeduction,
      }));
    } catch (error) {
      setAlertConfig({
        isOpen: true,
        title: "Data Missing",
        message: error.message,
      });
    } finally {
      setComputing(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        employee_id: form.employee_id || null,
        period_id: form.period_id || null,
        days_absent: form.days_absent,
        minutes_late: form.minutes_late,
        absences_lates: form.absences_lates,
        reg_holiday_hours: form.reg_holiday_hours,
        holiday_pay: form.holiday_pay,
        gross_pay: form.gross_pay,
        overtime_pay: form.overtime_pay,
        allowances: form.allowances,
        sss_deduction: form.sss_deduction,
        philhealth_deduction: form.philhealth_deduction,
        pagibig_deduction: form.pagibig_deduction,
        tax_deduction: form.tax_deduction,
        loan_deductions: form.loan_deductions,
        total_deductions: form.total_deductions,
        net_pay: form.net_pay,
      };

      if (payslip?.id) {
        const { error } = await supabase
          .from("payslips")
          .update(payload)
          .eq("id", payslip.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("payslips").insert([payload]);
        if (error) throw error;
      }
      onSaved();
    } catch (error) {
      setAlertConfig({
        isOpen: true,
        title: "Save Failed",
        message: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-slate-100">
          <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
            <h2 className="text-xl font-bold text-slate-800">
              {payslip ? "Edit Payslip" : "Issue Payslip"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5" /> 1. Auto-Compute Settings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                    Employee *
                  </label>
                  <select
                    className="mt-1.5 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus-visible:ring-[#2E6F40] focus-visible:border-[#2E6F40]"
                    value={form.employee_id || ""}
                    onChange={(e) => set("employee_id", e.target.value)}
                  >
                    <option value="">-- Select Employee --</option>
                    {employeesList.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                    Payroll Period *
                  </label>
                  <select
                    className="mt-1.5 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus-visible:ring-[#2E6F40] focus-visible:border-[#2E6F40]"
                    value={form.period_id || ""}
                    onChange={(e) => set("period_id", e.target.value)}
                  >
                    <option value="">-- Select Period --</option>
                    {periodsList.map((period) => (
                      <option key={period.id} value={period.id}>
                        {period.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-center gap-4">
                <Wand2 className="w-8 h-8 text-blue-600 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-blue-900">
                    Fully Automated DTR Engine
                  </h4>
                  <p className="text-xs text-blue-700 mt-0.5">
                    Clicking "Run Engine" will cross-reference the employee's
                    schedule, time logs, approved leaves, and holidays to
                    automatically generate the attendance data below.
                  </p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl">
                <p className="text-xs font-bold text-amber-800 mb-3">
                  SCANNED ATTENDANCE DATA
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-medium text-amber-900 flex items-center gap-1">
                      <CalendarX className="w-3 h-3" /> Days Absent
                    </label>
                    <Input
                      className="mt-1 border-amber-200 focus-visible:ring-amber-500 rounded-xl bg-white"
                      type="number"
                      min="0"
                      value={form.days_absent === 0 ? "" : form.days_absent}
                      onChange={(e) =>
                        set("days_absent", Number(e.target.value))
                      }
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-amber-900 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Total Minutes Late
                    </label>
                    <Input
                      className="mt-1 border-amber-200 focus-visible:ring-amber-500 rounded-xl bg-white"
                      type="number"
                      min="0"
                      value={form.minutes_late === 0 ? "" : form.minutes_late}
                      onChange={(e) =>
                        set("minutes_late", Number(e.target.value))
                      }
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-amber-900 flex items-center gap-1">
                      Reg. Holiday (Worked Hrs)
                    </label>
                    <Input
                      className="mt-1 border-amber-200 focus-visible:ring-amber-500 rounded-xl bg-white"
                      type="number"
                      min="0"
                      value={
                        form.reg_holiday_hours === 0
                          ? ""
                          : form.reg_holiday_hours
                      }
                      onChange={(e) =>
                        set("reg_holiday_hours", Number(e.target.value))
                      }
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={handleAutoCompute}
                disabled={computing || !form.employee_id || !form.period_id}
                className="w-full bg-[#2E6F40] hover:bg-[#235330] text-white gap-2 rounded-xl shadow-sm py-6"
              >
                <Calculator className="w-4 h-4" />{" "}
                {computing
                  ? "Scanning Data..."
                  : "Run Engine (Calculates Tardiness, Overtime, Govt Splits & Tax)"}
              </Button>
            </div>

            <hr className="border-slate-100" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 2. EARNINGS */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-bold text-[#2E6F40] uppercase tracking-widest flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" /> 2. Earnings
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-slate-600">
                      Basic/Gross Pay
                    </label>
                    <Input
                      className="mt-1 border-green-100 focus-visible:ring-[#2E6F40] rounded-xl font-bold"
                      type="number"
                      value={form.gross_pay === 0 ? "" : form.gross_pay}
                      onChange={(e) => set("gross_pay", Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">
                      Overtime Pay (1.0x)
                    </label>
                    <Input
                      className="mt-1 border-green-100 focus-visible:ring-[#2E6F40] rounded-xl"
                      type="number"
                      value={form.overtime_pay === 0 ? "" : form.overtime_pay}
                      onChange={(e) =>
                        set("overtime_pay", Number(e.target.value))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">
                      Holiday Premium
                    </label>
                    <Input
                      className="mt-1 border-green-100 focus-visible:ring-[#2E6F40] rounded-xl"
                      type="number"
                      value={form.holiday_pay === 0 ? "" : form.holiday_pay}
                      onChange={(e) =>
                        set("holiday_pay", Number(e.target.value))
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-slate-600">
                      Allowances
                    </label>
                    <Input
                      className="mt-1 border-green-100 focus-visible:ring-[#2E6F40] rounded-xl bg-slate-50"
                      type="number"
                      readOnly
                      value={form.allowances === 0 ? "" : form.allowances}
                    />
                  </div>
                </div>
              </div>

              {/* 3. DEDUCTIONS */}
              <div className="space-y-4 border-l border-slate-100 pl-8">
                <h3 className="text-[10px] font-bold text-red-600 uppercase tracking-widest flex items-center gap-1">
                  <TrendingDown className="w-4 h-4" /> 3. Deductions & Taxes
                </h3>
                <div className="mb-3">
                  <label className="text-xs font-bold text-red-600 uppercase tracking-wide">
                    Absences & Lates (Penalty)
                  </label>
                  <Input
                    className="mt-1 border-red-200 focus-visible:ring-red-500 rounded-xl text-red-600 font-bold"
                    type="number"
                    value={form.absences_lates === 0 ? "" : form.absences_lates}
                    onChange={(e) =>
                      set("absences_lates", Number(e.target.value))
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-600">
                      SSS (50%)
                    </label>
                    <Input
                      className="mt-1 border-red-100 focus-visible:ring-red-500 rounded-xl"
                      type="number"
                      value={form.sss_deduction === 0 ? "" : form.sss_deduction}
                      onChange={(e) =>
                        set("sss_deduction", Number(e.target.value))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">
                      PhilHealth (50%)
                    </label>
                    <Input
                      className="mt-1 border-red-100 focus-visible:ring-red-500 rounded-xl"
                      type="number"
                      value={
                        form.philhealth_deduction === 0
                          ? ""
                          : form.philhealth_deduction
                      }
                      onChange={(e) =>
                        set("philhealth_deduction", Number(e.target.value))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">
                      Pag-IBIG (50%)
                    </label>
                    <Input
                      className="mt-1 border-red-100 focus-visible:ring-red-500 rounded-xl"
                      type="number"
                      value={
                        form.pagibig_deduction === 0
                          ? ""
                          : form.pagibig_deduction
                      }
                      onChange={(e) =>
                        set("pagibig_deduction", Number(e.target.value))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">
                      Withholding Tax
                    </label>
                    <Input
                      className="mt-1 border-red-100 focus-visible:ring-red-500 rounded-xl"
                      type="number"
                      value={form.tax_deduction === 0 ? "" : form.tax_deduction}
                      onChange={(e) =>
                        set("tax_deduction", Number(e.target.value))
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-slate-600">
                      Loan Deductions
                    </label>
                    <Input
                      className="mt-1 border-red-100 focus-visible:ring-red-500 rounded-xl"
                      type="number"
                      value={
                        form.loan_deductions === 0 ? "" : form.loan_deductions
                      }
                      onChange={(e) =>
                        set("loan_deductions", Number(e.target.value))
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SUMMARY BAR */}
            <div className="bg-slate-50 p-6 rounded-2xl flex justify-between items-center border border-slate-200 mt-4 shadow-inner">
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  Total Deductions
                </p>
                <p className="text-xl font-bold text-red-600 mt-1">
                  ₱
                  {Number(form.total_deductions || 0).toLocaleString(
                    undefined,
                    { minimumFractionDigits: 2 },
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  Final Net Pay
                </p>
                <p className="text-4xl font-black text-[#2E6F40] mt-1">
                  ₱
                  {Number(form.net_pay || 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 p-6 border-t border-slate-100 sticky bottom-0 bg-white z-10">
            <Button
              variant="outline"
              onClick={onClose}
              className="rounded-xl px-6"
            >
              Cancel
            </Button>
            <Button
              className="bg-[#2E6F40] hover:bg-[#235330] text-white rounded-xl px-6 shadow-md"
              onClick={save}
              disabled={saving || !form.employee_id || !form.period_id}
            >
              {saving ? "Saving..." : "Save Payslip"}
            </Button>
          </div>
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
    </>
  );
}

// --- MAIN PAGE ---
export default function Payslips() {
  const [payslips, setPayslips] = useState([]);
  const [employeesList, setEmployeesList] = useState([]);
  const [periodsList, setPeriodsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editPayslip, setEditPayslip] = useState(null);

  const [viewPayrollConfig, setViewPayrollConfig] = useState({
    isOpen: false,
    periodId: null,
    periodName: "",
  });
  const [previewPayslip, setPreviewPayslip] = useState(null);

  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
  });
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    idToDelete: null,
  });

  const load = async () => {
    try {
      setLoading(true);

      const { data: payslipData, error: payslipErr } = await supabase
        .from("payslips")
        .select(
          `*, employees ( first_name, last_name, employee_code, departments!employees_department_id_fkey ( name ), positions ( title ) ), payroll_periods ( name )`,
        )
        .order("created_at", { ascending: false })
        .limit(200);

      if (payslipErr) throw payslipErr;
      setPayslips(payslipData || []);

      const { data: empData, error: empErr } = await supabase
        .from("employees")
        .select("id, first_name, last_name, employee_code")
        .order("first_name", { ascending: true });
      if (empErr) throw empErr;
      setEmployeesList(empData || []);

      const { data: periodData, error: periodErr } = await supabase
        .from("payroll_periods")
        .select("id, name, start_date, end_date")
        .order("start_date", { ascending: false });
      if (periodErr) throw periodErr;
      setPeriodsList(periodData || []);
    } catch (error) {
      setAlertConfig({
        isOpen: true,
        title: "Load Failed",
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const triggerDelete = (id) =>
    setConfirmConfig({ isOpen: true, idToDelete: id });

  const executeDelete = async () => {
    const id = confirmConfig.idToDelete;
    setConfirmConfig({ isOpen: false, idToDelete: null });
    try {
      const { error } = await supabase.from("payslips").delete().eq("id", id);
      if (error) throw error;
      load();
    } catch (error) {
      setAlertConfig({
        isOpen: true,
        title: "Delete Failed",
        message: "Failed to delete.",
      });
    }
  };

  const filtered = payslips.filter((p) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    const empName =
      `${p.employees?.first_name || ""} ${p.employees?.last_name || ""}`.toLowerCase();
    return (
      empName.includes(searchLower) ||
      (p.payroll_periods?.name || "").toLowerCase().includes(searchLower)
    );
  });

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Payslips & Payroll Engine
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Generate payslips, compute taxes, and view cost center summaries.
            </p>
          </div>
          <Button
            onClick={() => {
              setEditPayslip(null);
              setShowModal(true);
            }}
            className="bg-[#2E6F40] hover:bg-[#235330] text-white gap-2 rounded-xl px-5 shadow-md transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" /> Issue Payslip
          </Button>
        </div>

        <Input
          placeholder="Search by employee name or period..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md bg-white focus-visible:ring-[#2E6F40] rounded-xl"
        />

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#2E6F40]/30 border-t-[#2E6F40] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {[
                      "Employee",
                      "Department",
                      "Period",
                      "Gross",
                      "Deductions",
                      "Net Pay",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-center py-12 text-slate-400 font-medium"
                      >
                        No payslips found.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((p) => (
                      <tr
                        key={p.id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm font-bold text-slate-900 whitespace-nowrap">
                          {p.employees
                            ? `${p.employees.first_name} ${p.employees.last_name}`
                            : "Unknown"}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-500 whitespace-nowrap">
                          {p.employees?.departments?.name || "—"}
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-500 bg-slate-50 whitespace-nowrap">
                          {p.payroll_periods?.name ||
                            p.period_id?.substring(0, 8)}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                          ₱
                          {(p.gross_pay || 0).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-red-500">
                          ₱
                          {(p.total_deductions || 0).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-6 py-4 text-base font-black text-[#2E6F40]">
                          ₱
                          {(p.net_pay || 0).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-6 py-4 flex gap-1.5">
                          <button
                            onClick={() =>
                              setViewPayrollConfig({
                                isOpen: true,
                                periodId: p.period_id,
                                periodName: p.payroll_periods?.name,
                              })
                            }
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                            title="View Master Payroll for this Period"
                          >
                            <Layers className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setPreviewPayslip(p)}
                            className="p-2 text-slate-400 hover:text-[#2E6F40] hover:bg-[#2E6F40]/10 rounded-lg transition-colors border border-transparent hover:border-[#2E6F40]/20"
                            title="Preview Payslip PDF"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditPayslip(p);
                              setShowModal(true);
                            }}
                            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors border border-transparent hover:border-amber-100"
                            title="Edit Individual Payslip"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => triggerDelete(p.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                            title="Delete Payslip"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {showModal && (
          <PayslipModal
            payslip={editPayslip}
            employeesList={employeesList}
            periodsList={periodsList}
            onClose={() => setShowModal(false)}
            onSaved={() => {
              setShowModal(false);
              load();
            }}
          />
        )}
        <ViewPayrollModal
          isOpen={viewPayrollConfig.isOpen}
          periodId={viewPayrollConfig.periodId}
          periodName={viewPayrollConfig.periodName}
          onClose={() =>
            setViewPayrollConfig({
              isOpen: false,
              periodId: null,
              periodName: "",
            })
          }
        />
        <PayslipPreviewModal
          payslip={previewPayslip}
          onClose={() => setPreviewPayslip(null)}
        />
      </div>

      <CustomAlert
        isOpen={alertConfig.isOpen}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() =>
          setAlertConfig({ isOpen: false, title: "", message: "" })
        }
      />
      <CustomConfirm
        isOpen={confirmConfig.isOpen}
        title="Delete Payslip"
        message="Are you sure you want to permanently delete this payslip record? This action cannot be undone."
        onCancel={() => setConfirmConfig({ isOpen: false, idToDelete: null })}
        onConfirm={executeDelete}
      />
    </>
  );
}
