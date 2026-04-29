import { useState, useEffect, useRef } from "react";
import { supabase } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Download,
  Edit,
  Trash2,
  Eye,
  FileText,
  X,
  AlertCircle,
  Calendar,
  Layers,
  Users,
  Calculator,
  CheckCircle2,
  XCircle,
  UserPlus,
  Printer,
  Banknote,
  Upload,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- CUSTOM MODALS ---
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
          className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl"
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center border border-slate-100">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-[#2E6F40]/10 mb-4">
          <CheckCircle2 className="h-6 w-6 text-[#2E6F40]" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 mb-6">{message}</p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            className="w-full rounded-xl"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="w-full bg-[#2E6F40] hover:bg-[#235330] text-white rounded-xl"
          >
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- IMPORT EXCEL MODAL ---
function ImportExcelModal({ batch, onClose, onImported }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleImport = async () => {
    if (!file || !batch) return alert("Please select a CSV file.");
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        const rows = text.split("\n").slice(1);
        const payloads = [];
        const { data: allEmps } = await supabase
          .from("employees")
          .select("id, employee_code");

        for (const row of rows) {
          if (!row.trim()) continue;
          const cols = row.split(",");
          const code = cols[0]?.replace(/"/g, "").trim();
          const emp = allEmps.find((e) => e.employee_code === code);

          if (emp) {
            const gross = Number(cols[1] || 0);
            const ot = Number(cols[2] || 0);
            const allow = Number(cols[3] || 0);
            const abs = Number(cols[4] || 0);
            const sss = Number(cols[5] || 0);
            const ph = Number(cols[6] || 0);
            const pag = Number(cols[7] || 0);
            const tax = Number(cols[8] || 0);
            const loans = Number(cols[9] || 0);
            const other = Number(cols[10] || 0);

            const totalDed = abs + sss + ph + pag + tax + loans + other;
            const net = Math.max(0, gross + ot + allow - totalDed);

            payloads.push({
              period_id: batch.id,
              employee_id: emp.id,
              gross_pay: gross,
              overtime_pay: ot,
              allowances: allow,
              absences_lates: abs,
              sss_deduction: sss,
              philhealth_deduction: ph,
              pagibig_deduction: pag,
              tax_deduction: tax,
              loan_deductions: loans,
              other_deductions: other,
              total_deductions: totalDed,
              net_pay: net,
            });
          }
        }
        if (payloads.length > 0) {
          const { error } = await supabase.from("payslips").insert(payloads);
          if (error) throw error;
        }
        onImported();
      } catch (err) {
        alert(err.message);
      } finally {
        setUploading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">
            Import to: {batch?.name}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50 mb-6">
          <FileSpreadsheet className="w-10 h-10 mx-auto text-blue-500 mb-2" />
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files[0])}
            className="text-xs"
          />
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 rounded-xl"
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={uploading || !file}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md font-bold"
          >
            {uploading ? "Importing..." : "Upload & Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- PAYROLL ENGINE HELPERS ---
const computeGovtDeductionsSplit = (monthlySalary) => {
  let sssMonth = 0;
  if (monthlySalary > 0) {
    const cappedSalary = Math.min(monthlySalary, 30000);
    sssMonth = cappedSalary * 0.045;
  }
  let philhealthMonth = 0;
  if (monthlySalary > 0) {
    if (monthlySalary <= 10000) philhealthMonth = 250;
    else {
      const cappedSalary = Math.min(monthlySalary, 100000);
      philhealthMonth = cappedSalary * 0.025;
    }
  }
  return {
    sss: Math.round((sssMonth / 2) * 100) / 100,
    philhealth: Math.round((philhealthMonth / 2) * 100) / 100,
    pagibig: 100,
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
  return Math.max(0, Math.round(tax * 100) / 100);
};

const parseTime = (timeString) => {
  if (!timeString) return 0;
  const [h, m] = timeString.split(":").map(Number);
  return h * 60 + m;
};

// --- AUTOMATED DTR ENGINE ---
const generateAutomatedDTR = async (employeeId, startDate, endDate) => {
  try {
    const [sy, sm, sd] = startDate.split("-").map(Number);
    let start = new Date(sy, sm - 1, sd, 0, 0, 0);
    const [ey, em, ed] = endDate.split("-").map(Number);
    let end = new Date(ey, em - 1, ed, 23, 59, 59);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return { daysAbsent: 0, minutesLate: 0, holidayLogs: [] };
    }

    if (start > end) {
      const temp = start;
      start = end;
      end = temp;
    }

    let schedule = {
      expected_time_in: "08:00:00",
      expected_time_out: "17:00:00",
      grace_period_mins: 15,
      work_days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    };

    try {
      const { data: emp } = await supabase
        .from("employees")
        .select("schedule_id")
        .eq("id", employeeId)
        .single();
      if (emp?.schedule_id) {
        const { data: sched } = await supabase
          .from("schedules")
          .select("*")
          .eq("id", emp.schedule_id)
          .single();
        if (sched && sched.work_days && sched.work_days.length > 0)
          schedule = { ...schedule, ...sched };
      }
    } catch (e) {}

    let logs = [];
    try {
      const { data: fetchedLogs } = await supabase
        .from("attendance_logs")
        .select("type, calculated_server_time")
        .eq("employee_id", employeeId)
        .gte("calculated_server_time", start.toISOString())
        .lte("calculated_server_time", end.toISOString());
      if (fetchedLogs) logs = fetchedLogs;
    } catch (e) {}

    let leaves = [];
    try {
      const { data: fetchedLeaves } = await supabase
        .from("leave_requests")
        .select("start_date, end_date")
        .eq("employee_id", employeeId)
        .eq("status", "approved")
        .lte("start_date", endDate)
        .gte("end_date", startDate);
      if (fetchedLeaves) leaves = fetchedLeaves;
    } catch (e) {}

    let holidays = [];
    try {
      const { data: fetchedHolidays } = await supabase
        .from("holidays")
        .select("date, type, pay_rate_multiplier")
        .gte("date", startDate)
        .lte("date", endDate);
      if (fetchedHolidays) holidays = fetchedHolidays;
    } catch (e) {}

    const logsByDate = {};
    logs.forEach((l) => {
      try {
        const d = new Date(l.calculated_server_time);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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
      } catch (e) {}
    });

    const expectedInMins = parseTime(schedule.expected_time_in);
    let expectedDays = 0,
      workedDays = 0,
      daysAbsent = 0,
      minutesLate = 0;
    let holidayLogs = [];

    let curr = new Date(start);

    while (curr <= end) {
      const dateStr = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, "0")}-${String(curr.getDate()).padStart(2, "0")}`;
      const dayName = curr
        .toLocaleDateString("en-US", { weekday: "long" })
        .toLowerCase();

      let isWorkDay = false;
      if (Array.isArray(schedule.work_days) && schedule.work_days.length > 0) {
        isWorkDay = schedule.work_days
          .map((d) => String(d).toLowerCase())
          .includes(dayName);
      } else if (
        typeof schedule.work_days === "string" &&
        schedule.work_days.length > 0
      ) {
        isWorkDay = schedule.work_days.toLowerCase().includes(dayName);
      } else {
        isWorkDay = [
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
        ].includes(dayName);
      }

      if (isWorkDay) {
        expectedDays++;
        const dailyLog = logsByDate[dateStr];
        const isHoliday = holidays.find((h) => h.date === dateStr);
        const isOnLeave = leaves.some(
          (l) => dateStr >= l.start_date && dateStr <= l.end_date,
        );

        if (isOnLeave) {
          workedDays++;
        } else if (isHoliday) {
          if (dailyLog?.in && dailyLog?.out) {
            const hrs = (dailyLog.out - dailyLog.in) / 60;
            holidayLogs.push({
              hours: Math.max(0, hrs),
              multiplier: Number(isHoliday.pay_rate_multiplier) || 1,
            });
            workedDays++;
          } else {
            daysAbsent++;
          }
        } else {
          if (!dailyLog || dailyLog.in === null) {
            daysAbsent++;
          } else {
            workedDays++;
            if (
              dailyLog.in >
              expectedInMins + (schedule.grace_period_mins || 0)
            ) {
              minutesLate += dailyLog.in - expectedInMins;
            }
          }
        }
      }
      curr.setDate(curr.getDate() + 1);
    }

    return { daysAbsent, minutesLate, holidayLogs };
  } catch (error) {
    return { daysAbsent: 0, minutesLate: 0, holidayLogs: [] };
  }
};

const generatePayslipsForEmployees = async (
  empIds,
  batchId,
  startDate,
  endDate,
) => {
  let profiles = [];
  try {
    const { data } = await supabase
      .from("salary_profiles")
      .select("*")
      .in("employee_id", empIds);
    if (data) profiles = data;
  } catch (e) {}

  let globalItems = [];
  try {
    const { data } = await supabase
      .from("payroll_items")
      .select("*")
      .eq("is_active", true);
    if (data) globalItems = data;
  } catch (e) {}

  let empAllowances = [];
  try {
    const { data } = await supabase
      .from("employee_allowances")
      .select("*")
      .in("employee_id", empIds);
    if (data) empAllowances = data;
  } catch (e) {}

  const payslipPayloads = [];
  for (const empId of empIds) {
    const profile = profiles.find((p) => p.employee_id === empId);
    const monthlyBasic = profile ? Number(profile.basic_salary) : 0;

    const dailyRate = monthlyBasic / 22;
    const hourlyRate = dailyRate / 8;
    const minuteRate = hourlyRate / 60;
    const semiMonthlyPay = monthlyBasic / 2;

    let dtr = { daysAbsent: 0, minutesLate: 0, holidayLogs: [] };
    if (startDate && endDate) {
      dtr = await generateAutomatedDTR(empId, startDate, endDate);
    }

    let absencesLatesTotal =
      dtr.daysAbsent * dailyRate + dtr.minutesLate * minuteRate;
    absencesLatesTotal = Math.min(absencesLatesTotal, semiMonthlyPay); // Cap penalty

    let calculatedHolidayPay = 0;
    dtr.holidayLogs.forEach((log) => {
      calculatedHolidayPay +=
        log.hours * hourlyRate * Math.max(0, log.multiplier - 1);
    });

    let dynamicAllowances = 0;
    let dynamicOtherDeductions = 0;

    globalItems.forEach((item) => {
      const targetType = item.target_type || "all";
      if (targetType === "specific") {
        const assignedIds = item.assigned_employee_ids || [];
        if (!assignedIds.includes(empId)) return;
      }

      let val = 0;
      try {
        let formulaStr = String(item.amount_or_formula || "0").toLowerCase();
        formulaStr = formulaStr.replace(/basic_salary/g, monthlyBasic);
        val = Number(
          Function('"use strict";return (' + formulaStr + ")")() || 0,
        );
      } catch (e) {
        val = 0;
      }

      if (item.type === "Allowance" || item.type === "Benefit") {
        dynamicAllowances += val;
      } else if (item.type === "Deduction") {
        const nameLower = item.name.toLowerCase();
        if (
          !nameLower.includes("sss") &&
          !nameLower.includes("philhealth") &&
          !nameLower.includes("pag-ibig") &&
          !nameLower.includes("tax")
        ) {
          dynamicOtherDeductions += val;
        }
      }
    });

    empAllowances
      .filter((ea) => ea.employee_id === empId)
      .forEach((ea) => {
        dynamicAllowances += Number(ea.amount || 0);
      });

    const earnedThisCutoff =
      semiMonthlyPay - absencesLatesTotal + calculatedHolidayPay;

    let finalSSS = 0;
    let finalPhilhealth = 0;
    let finalPagibig = 0;
    let finalTax = 0;

    if (earnedThisCutoff > 0) {
      const autoGovt = computeGovtDeductionsSplit(monthlyBasic);
      finalSSS =
        profile?.sss_contribution > 0 ? profile.sss_contribution : autoGovt.sss;
      finalPhilhealth =
        profile?.philhealth_contribution > 0
          ? profile.philhealth_contribution
          : autoGovt.philhealth;
      finalPagibig =
        profile?.pagibig_contribution > 0
          ? profile.pagibig_contribution
          : autoGovt.pagibig;

      if (finalSSS + finalPhilhealth + finalPagibig > earnedThisCutoff) {
        finalSSS = 0;
        finalPhilhealth = 0;
        finalPagibig = 0;
      } else {
        const taxableIncome =
          earnedThisCutoff - (finalSSS + finalPhilhealth + finalPagibig);
        finalTax = computeTax(taxableIncome);
      }
    }

    const totalDed =
      finalSSS +
      finalPhilhealth +
      finalPagibig +
      finalTax +
      absencesLatesTotal +
      dynamicOtherDeductions;
    const netPay = Math.max(0, earnedThisCutoff + dynamicAllowances - totalDed);

    payslipPayloads.push({
      period_id: batchId,
      employee_id: empId,
      gross_pay: Math.round(semiMonthlyPay * 100) / 100,
      days_absent: dtr.daysAbsent,
      minutes_late: dtr.minutesLate,
      absences_lates: Math.round(absencesLatesTotal * 100) / 100,
      overtime_pay: 0,
      holiday_pay: Math.round(calculatedHolidayPay * 100) / 100,
      allowances: Math.round(dynamicAllowances * 100) / 100,
      other_deductions: Math.round(dynamicOtherDeductions * 100) / 100,
      sss_deduction: finalSSS,
      philhealth_deduction: finalPhilhealth,
      pagibig_deduction: finalPagibig,
      tax_deduction: finalTax,
      loan_deductions: 0,
      total_deductions: Math.round(totalDed * 100) / 100,
      net_pay: Math.round(netPay * 100) / 100,
    });
  }

  const { error } = await supabase.from("payslips").insert(payslipPayloads);
  if (error) throw error;
};

// --- SUB-MODAL: SELECT EMPLOYEES CHECKLIST ---
function EmployeeSelectorModal({ onClose, onAddSelected, alreadySelectedIds }) {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        // Fetch employees
        const { data: emps, error: empErr } = await supabase
          .from("employees")
          .select(
            `id, first_name, last_name, employee_code, positions ( title )`,
          )
          .order("first_name", { ascending: true });

        if (empErr) throw empErr;

        // Fetch profiles to check who actually has a salary setup
        const { data: profiles } = await supabase
          .from("salary_profiles")
          .select("employee_id");

        const profileEmpIds = (profiles || []).map((p) => p.employee_id);

        const available = (emps || [])
          .filter((e) => !alreadySelectedIds.includes(e.id))
          .map((e) => ({
            ...e,
            hasProfile: profileEmpIds.includes(e.id),
          }));

        setEmployees(available);
      } catch (err) {
        console.error("Error fetching employees:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, [alreadySelectedIds]);

  const filtered = employees.filter((e) => {
    if (!search) return true;
    const term = search.toLowerCase();
    const name = `${e.first_name} ${e.last_name}`.toLowerCase();
    const code = (e.employee_code || "").toLowerCase();
    return name.includes(term) || code.includes(term);
  });

  const selectableEmployees = filtered.filter((e) => e.hasProfile);
  const missingProfilesCount = employees.filter((e) => !e.hasProfile).length;

  const toggleSelectAll = () => {
    if (
      selected.length === selectableEmployees.length &&
      selectableEmployees.length > 0
    ) {
      setSelected([]);
    } else {
      setSelected(selectableEmployees.map((e) => e.id));
    }
  };

  const toggleSelect = (id) => {
    if (selected.includes(id)) setSelected(selected.filter((s) => s !== id));
    else setSelected([...selected, id]);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-100 flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50 shrink-0">
          <h2 className="text-xl font-bold text-slate-900">Select Employees</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {missingProfilesCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 p-4 m-4 rounded-xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2 text-amber-800 text-sm">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <span>
                <b>{missingProfilesCount} employee(s)</b> cannot be selected
                because they don't have a Salary Profile configured.
              </span>
            </div>
            <Button
              onClick={() => navigate("/salary-profiles")}
              variant="outline"
              className="bg-white border-amber-300 text-amber-700 hover:bg-amber-100 h-9 text-xs font-bold"
            >
              Setup Profiles
            </Button>
          </div>
        )}

        <div className="px-4 py-3 bg-white border-b shrink-0 flex items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search employee or ID..."
              className="pl-9 bg-slate-50 focus-visible:ring-[#2E6F40] rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <p className="text-sm font-bold text-slate-500">
            {selected.length} Selected
          </p>
        </div>

        <div className="flex-1 overflow-auto bg-slate-50 p-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-[#2E6F40]/30 border-t-[#2E6F40] rounded-full animate-spin mx-auto"></div>
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-100 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-[#2E6F40] border-slate-300 rounded focus:ring-[#2E6F40] disabled:opacity-50"
                      checked={
                        selected.length > 0 &&
                        selected.length === selectableEmployees.length
                      }
                      disabled={selectableEmployees.length === 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider text-[11px] text-slate-500">
                    Employee Name
                  </th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider text-[11px] text-slate-500">
                    ID No.
                  </th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider text-[11px] text-slate-500">
                    Position
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filtered.map((emp) => (
                  <tr
                    key={emp.id}
                    className={`transition-colors ${emp.hasProfile ? "hover:bg-slate-50 cursor-pointer" : "bg-slate-50 opacity-60"}`}
                    onClick={() => emp.hasProfile && toggleSelect(emp.id)}
                  >
                    <td
                      className="px-4 py-3 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-[#2E6F40] border-slate-300 rounded focus:ring-[#2E6F40] disabled:opacity-50"
                        checked={selected.includes(emp.id)}
                        disabled={!emp.hasProfile}
                        onChange={() => toggleSelect(emp.id)}
                      />
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-800">
                      {emp.first_name} {emp.last_name}
                      {!emp.hasProfile && (
                        <span className="ml-2 text-[9px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full uppercase">
                          No Salary Profile
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      {emp.employee_code || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {emp.positions?.title || "—"}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-center py-10 text-slate-400"
                    >
                      No employees found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-xl px-6"
          >
            Cancel
          </Button>
          <Button
            onClick={() =>
              onAddSelected(employees.filter((e) => selected.includes(e.id)))
            }
            disabled={selected.length === 0}
            className="bg-[#2E6F40] hover:bg-[#235330] text-white rounded-xl px-6 shadow-md"
          >
            Add Selected
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- VOYADORES PAYSLIP PREVIEW ---
function PayslipPreviewModal({ payslipsToPrint, batchDetails, onClose }) {
  const iframeRef = useRef(null);
  if (!payslipsToPrint || payslipsToPrint.length === 0) return null;

  const formatPeriod = (start, end) => {
    if (!start || !end) return "—";
    const s = new Date(start).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    const e = new Date(end).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    return `${s} - ${e}`;
  };

  const payPeriodString = formatPeriod(
    batchDetails?.start_date,
    batchDetails?.end_date,
  );

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Payslips - ${batchDetails?.name || "Batch"}</title>
      <style>
        @page { margin: 20mm; size: letter; }
        body { font-family: 'Arial', sans-serif; color: #000; margin: 0; padding: 20px 0; font-size: 12px; }
        .container { max-width: 800px; margin: 0 auto 40px auto; border: 1px solid #000; padding: 40px; box-sizing: border-box; page-break-inside: avoid; }
        .header { display: flex; gap: 20px; align-items: flex-start; margin-bottom: 40px; border-bottom: 2px solid #000; padding-bottom: 20px; }
        .logo { max-height: 70px; object-fit: contain; }
        .emp-details { display: flex; flex-direction: column; gap: 4px; }
        .content { display: flex; gap: 40px; }
        .col { flex: 1; }
        .section-title { font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #000; padding-bottom: 4px; text-transform: uppercase; }
        .row { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .val { text-align: right; font-family: monospace; }
        .summary-box { margin-top: 20px; border-top: 1px solid #000; padding-top: 15px; }
        .net-pay { font-weight: bold; font-size: 15px; border-top: 2px solid #000; padding-top: 10px; margin-top: 10px; }
        .page-break { page-break-after: always; }
      </style>
    </head>
    <body>
      ${payslipsToPrint
        .map(
          (p) => `
        <div class="container">
          <div class="header">
            <img src="/folder/logo.png" class="logo" alt="Company Logo" onerror="this.src='/folder/logo.jpg'" />
            <div class="emp-details">
              <span style="font-size: 18px; font-weight: bold;">OFFICIAL PAYSLIP</span>
              <span><strong>Name:</strong> ${p.employees?.last_name || ""}, ${p.employees?.first_name || ""}</span>
              <span><strong>ID:</strong> ${p.employees?.employee_code || "—"}</span>
              <span><strong>Pay Period:</strong> ${payPeriodString}</span>
            </div>
          </div>
          <div class="content">
            <div class="col">
              <div class="section-title">Earnings</div>
              <div class="row"><span>Basic Pay</span><span class="val">${Number(p.gross_pay || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></div>
              <div class="row"><span>Overtime</span><span class="val">${Number(p.overtime_pay || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></div>
              <div class="row"><span>Holiday</span><span class="val">${Number(p.holiday_pay || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></div>
              <div class="row"><span>Allowances & Benefits</span><span class="val">${Number(p.allowances || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></div>
            </div>
            <div class="col">
              <div class="section-title">Deductions</div>
              <div class="row"><span>Absences/Lates</span><span class="val">${Number(p.absences_lates || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></div>
              <div class="row"><span>SSS</span><span class="val">${Number(p.sss_deduction || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></div>
              <div class="row"><span>PhilHealth</span><span class="val">${Number(p.philhealth_deduction || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></div>
              <div class="row"><span>Pag-IBIG</span><span class="val">${Number(p.pagibig_deduction || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></div>
              <div class="row"><span>Withholding Tax</span><span class="val">${Number(p.tax_deduction || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></div>
              <div class="row"><span>Loans</span><span class="val">${Number(p.loan_deductions || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></div>
              <div class="row"><span>Other Deductions</span><span class="val">${Number(p.other_deductions || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></div>
              <div class="summary-box">
                <div class="row net-pay"><span>NET PAY</span><span class="val">₱${Number(p.net_pay || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></div>
              </div>
            </div>
          </div>
        </div>
        <div class="page-break"></div>
      `,
        )
        .join("")}
    </body>
    </html>
  `;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden border border-slate-100">
        <div className="flex items-center justify-between p-6 border-b shrink-0 bg-white">
          <h2 className="text-xl font-bold">Payslip Preview</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="flex-1 bg-slate-100 p-6 flex justify-center">
          <iframe
            ref={iframeRef}
            srcDoc={html}
            title="Payslip"
            className="w-full max-w-[850px] h-full bg-white shadow-md border rounded"
          />
        </div>
        <div className="p-6 border-t shrink-0 flex justify-end gap-3 bg-white">
          <Button
            variant="outline"
            className="rounded-xl px-6"
            onClick={onClose}
          >
            Close
          </Button>
          <Button
            className="bg-[#2E6F40] hover:bg-[#235330] text-white gap-2 rounded-xl px-6 shadow-md"
            onClick={() => iframeRef.current?.contentWindow.print()}
          >
            <Printer className="w-4 h-4" /> Print PDF
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- EDIT PAYSLIP MODAL ---
function EditPayslipModal({ payslip, onClose, onSaved }) {
  const [form, setForm] = useState({ ...payslip });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const gross =
      Number(form.gross_pay || 0) +
      Number(form.overtime_pay || 0) +
      Number(form.holiday_pay || 0) +
      Number(form.allowances || 0);
    const deductions =
      Number(form.sss_deduction || 0) +
      Number(form.philhealth_deduction || 0) +
      Number(form.pagibig_deduction || 0) +
      Number(form.tax_deduction || 0) +
      Number(form.loan_deductions || 0) +
      Number(form.absences_lates || 0) +
      Number(form.other_deductions || 0);
    setForm((prev) => ({
      ...prev,
      total_deductions: deductions,
      net_pay: Math.max(0, gross - deductions),
    }));
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
    form.other_deductions,
  ]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        gross_pay: form.gross_pay,
        overtime_pay: form.overtime_pay,
        holiday_pay: form.holiday_pay,
        allowances: form.allowances,
        absences_lates: form.absences_lates,
        days_absent: form.days_absent,
        minutes_late: form.minutes_late,
        sss_deduction: form.sss_deduction,
        philhealth_deduction: form.philhealth_deduction,
        pagibig_deduction: form.pagibig_deduction,
        tax_deduction: form.tax_deduction,
        loan_deductions: form.loan_deductions,
        other_deductions: form.other_deductions,
        total_deductions: form.total_deductions,
        net_pay: form.net_pay,
      };
      await supabase.from("payslips").update(payload).eq("id", payslip.id);
      onSaved();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden border flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b bg-white shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Edit Details</h2>
            <p className="text-xs text-slate-500">
              {payslip.employees?.first_name} {payslip.employees?.last_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-6 bg-slate-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-green-700 uppercase tracking-widest border-b pb-2">
                Earnings
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-600">
                    Basic Pay
                  </label>
                  <Input
                    type="number"
                    value={form.gross_pay || ""}
                    onChange={(e) =>
                      setForm({ ...form, gross_pay: Number(e.target.value) })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">
                    Overtime
                  </label>
                  <Input
                    type="number"
                    value={form.overtime_pay || ""}
                    onChange={(e) =>
                      setForm({ ...form, overtime_pay: Number(e.target.value) })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">
                    Holiday
                  </label>
                  <Input
                    type="number"
                    value={form.holiday_pay || ""}
                    onChange={(e) =>
                      setForm({ ...form, holiday_pay: Number(e.target.value) })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">
                    Allowances & Benefits
                  </label>
                  <Input
                    type="number"
                    value={form.allowances || ""}
                    onChange={(e) =>
                      setForm({ ...form, allowances: Number(e.target.value) })
                    }
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-red-700 uppercase tracking-widest border-b pb-2">
                Deductions
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-600">
                    Abs/Lates Amount Penalty
                  </label>
                  <Input
                    type="number"
                    value={form.absences_lates || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        absences_lates: Number(e.target.value),
                      })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">
                    Days Absent
                  </label>
                  <Input
                    type="number"
                    value={form.days_absent || ""}
                    onChange={(e) =>
                      setForm({ ...form, days_absent: Number(e.target.value) })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">
                    Minutes Late
                  </label>
                  <Input
                    type="number"
                    value={form.minutes_late || ""}
                    onChange={(e) =>
                      setForm({ ...form, minutes_late: Number(e.target.value) })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">
                    SSS
                  </label>
                  <Input
                    type="number"
                    value={form.sss_deduction || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        sss_deduction: Number(e.target.value),
                      })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">
                    PhilHealth
                  </label>
                  <Input
                    type="number"
                    value={form.philhealth_deduction || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        philhealth_deduction: Number(e.target.value),
                      })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">
                    Pag-IBIG
                  </label>
                  <Input
                    type="number"
                    value={form.pagibig_deduction || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        pagibig_deduction: Number(e.target.value),
                      })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">
                    Withholding Tax
                  </label>
                  <Input
                    type="number"
                    value={form.tax_deduction || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        tax_deduction: Number(e.target.value),
                      })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">
                    Loans
                  </label>
                  <Input
                    type="number"
                    value={form.loan_deductions || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        loan_deductions: Number(e.target.value),
                      })
                    }
                    className="mt-1"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-600">
                    Other Deductions
                  </label>
                  <Input
                    type="number"
                    value={form.other_deductions || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        other_deductions: Number(e.target.value),
                      })
                    }
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t bg-white shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-xl px-6"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#2E6F40] hover:bg-[#235330] text-white rounded-xl px-6 shadow-md"
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- MAIN CREATE/EDIT BATCH MODAL ---
function PayrollBatchModal({ batch, onClose, onSaved }) {
  const isEdit = !!batch?.id;
  const [form, setForm] = useState({
    title:
      batch?.name ||
      `PAY-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
    start_date: batch?.start_date || "",
    end_date: batch?.end_date || "",
    pay_date: batch?.pay_date || "",
  });
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [showSelector, setShowSelector] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("employees");
  const [coveredHolidays, setCoveredHolidays] = useState([]);

  useEffect(() => {
    if (form.start_date && form.end_date) {
      supabase
        .from("holidays")
        .select("*")
        .gte("date", form.start_date)
        .lte("date", form.end_date)
        .then(({ data }) => setCoveredHolidays(data || []));
    }
  }, [form.start_date, form.end_date]);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const payload = {
        name: form.title,
        start_date: form.start_date,
        end_date: form.end_date,
        pay_date: form.pay_date || null,
      };
      if (isEdit) {
        await supabase
          .from("payroll_periods")
          .update(payload)
          .eq("id", batch.id);
      } else {
        payload.status = "draft";
        const { data } = await supabase
          .from("payroll_periods")
          .insert([payload])
          .select("id")
          .single();
        if (selectedEmployees.length > 0) {
          await generatePayslipsForEmployees(
            selectedEmployees.map((e) => e.id),
            data.id,
            form.start_date,
            form.end_date,
          );
        }
      }
      onSaved();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border">
        <div className="flex items-center justify-between p-6 border-b shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#2E6F40]/10 text-[#2E6F40] rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {isEdit ? "Edit Batch Details" : "Generate Payroll"}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-6 space-y-8 bg-slate-50/30">
          <div className="bg-white border rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              Payroll Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-600">
                  Payroll Title *
                </label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="mt-1.5 rounded-xl font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600">
                  Payout Date
                </label>
                <Input
                  type="date"
                  value={form.pay_date}
                  onChange={(e) =>
                    setForm({ ...form, pay_date: e.target.value })
                  }
                  className="mt-1.5 rounded-xl"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600">
                  Start Date *
                </label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(e) =>
                    setForm({ ...form, start_date: e.target.value })
                  }
                  className="mt-1.5 rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600">
                  End Date *
                </label>
                <Input
                  type="date"
                  value={form.end_date}
                  onChange={(e) =>
                    setForm({ ...form, end_date: e.target.value })
                  }
                  className="mt-1.5 rounded-xl"
                  required
                />
              </div>
            </div>
          </div>
          {!isEdit && (
            <div className="bg-white border rounded-2xl p-5 shadow-sm">
              <div className="flex border-b border-slate-100 mb-4 gap-6">
                <button
                  className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === "employees" ? "border-[#2E6F40] text-[#2E6F40]" : "border-transparent text-slate-500 hover:text-slate-700"}`}
                  onClick={() => setActiveTab("employees")}
                >
                  Payroll Employees ({selectedEmployees.length})
                </button>
                <button
                  className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === "holidays" ? "border-[#2E6F40] text-[#2E6F40]" : "border-transparent text-slate-500 hover:text-slate-700"}`}
                  onClick={() => setActiveTab("holidays")}
                >
                  Covered Holidays
                  {coveredHolidays.length > 0 && (
                    <span className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.5 rounded-full">
                      {coveredHolidays.length}
                    </span>
                  )}
                </button>
              </div>

              {activeTab === "employees" && (
                <>
                  <div className="flex justify-end mb-3">
                    <Button
                      onClick={() => setShowSelector(true)}
                      variant="outline"
                      className="border-[#2E6F40] text-[#2E6F40] rounded-xl h-9 text-xs"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Select Employee
                    </Button>
                  </div>
                  {selectedEmployees.length === 0 ? (
                    <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                      <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="text-sm font-medium text-slate-500">
                        No employees selected.
                      </p>
                    </div>
                  ) : (
                    <div className="border rounded-xl overflow-hidden">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 border-b">
                          <tr>
                            <th className="px-4 py-3 text-slate-500">
                              Employee
                            </th>
                            <th className="px-4 py-3 text-center text-slate-500">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {selectedEmployees.map((emp) => (
                            <tr key={emp.id} className="hover:bg-slate-50">
                              <td className="px-4 py-3 font-bold">
                                {emp.first_name} {emp.last_name}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  onClick={() =>
                                    setSelectedEmployees(
                                      selectedEmployees.filter(
                                        (e) => e.id !== emp.id,
                                      ),
                                    )
                                  }
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {activeTab === "holidays" && (
                <>
                  {coveredHolidays.length === 0 ? (
                    <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                      <Calendar className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="text-sm font-medium text-slate-500">
                        No holidays found in this period.
                      </p>
                    </div>
                  ) : (
                    <div className="border rounded-xl overflow-hidden">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 border-b">
                          <tr>
                            <th className="px-4 py-3 font-bold text-slate-500 text-[11px] uppercase">
                              Date
                            </th>
                            <th className="px-4 py-3 font-bold text-slate-500 text-[11px] uppercase">
                              Holiday Name
                            </th>
                            <th className="px-4 py-3 font-bold text-slate-500 text-[11px] uppercase text-right">
                              Multiplier
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {coveredHolidays.map((h) => (
                            <tr key={h.id} className="hover:bg-slate-50">
                              <td className="px-4 py-3 font-medium text-slate-700">
                                {new Date(h.date).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3 font-bold text-slate-900">
                                {h.name}{" "}
                                <span className="ml-2 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                                  {(h.type || "").replace(/_/g, " ")}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">
                                {Number(h.pay_rate_multiplier).toFixed(2)}x
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 p-6 border-t bg-white shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-xl px-6"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              saving ||
              !form.start_date ||
              !form.end_date ||
              (!isEdit && selectedEmployees.length === 0)
            }
            className="bg-[#2E6F40] hover:bg-[#235330] text-white rounded-xl px-8 shadow-md font-bold"
          >
            {saving
              ? "Generating..."
              : isEdit
                ? "Save Changes"
                : "Generate Payroll"}
          </Button>
        </div>
      </div>
      {showSelector && (
        <EmployeeSelectorModal
          alreadySelectedIds={selectedEmployees.map((e) => e.id)}
          onClose={() => setShowSelector(false)}
          onAddSelected={(newEmps) => {
            setSelectedEmployees([...selectedEmployees, ...newEmps]);
            setShowSelector(false);
          }}
        />
      )}
    </div>
  );
}

// --- DETAILED REGISTER MODAL ---
function ViewBatchModal({ batch, onClose }) {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [previewPayslips, setPreviewPayslips] = useState(null);
  const [editingPayslip, setEditingPayslip] = useState(null);
  const [showAddSelector, setShowAddSelector] = useState(false);

  const fetchBatchDetails = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("payslips")
        .select(
          `*, employees ( first_name, last_name, employee_code, positions ( title ) )`,
        )
        .eq("period_id", batch.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setPayslips(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (batch?.id) fetchBatchDetails();
  }, [batch]);

  const handleAddEmployees = async (newEmps) => {
    try {
      await generatePayslipsForEmployees(
        newEmps.map((e) => e.id),
        batch.id,
        batch.start_date,
        batch.end_date,
      );
      await fetchBatchDetails();
      setShowAddSelector(false);
    } catch (err) {
      alert(err.message);
    }
  };

  const filtered = payslips.filter((p) => {
    const term = search.toLowerCase();
    return (
      `${p.employees?.first_name} ${p.employees?.last_name}`
        .toLowerCase()
        .includes(term) ||
      (p.employees?.employee_code || "").toLowerCase().includes(term)
    );
  });

  const totalNet = payslips.reduce((sum, p) => sum + Number(p.net_pay || 0), 0);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[95vw] h-[90vh] flex flex-col overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 border-b shrink-0 bg-white gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-6 h-6 text-[#2E6F40]" /> Master Payroll
                Register
              </h2>
              <p className="text-sm font-medium text-slate-500 mt-1">
                {batch.name}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right mr-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Total Net
                </p>
                <p className="text-2xl font-black text-[#2E6F40]">
                  ₱
                  {totalNet.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-slate-600" />
              </button>
            </div>
          </div>
          <div className="p-4 bg-slate-50 border-b flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setPreviewPayslips(filtered)}
                className="bg-[#2E6F40] hover:bg-[#235330] text-white gap-2 shadow-sm rounded-xl px-5"
              >
                <Printer className="w-4 h-4" /> Print All
              </Button>
              {batch.status !== "paid" && (
                <Button
                  onClick={() => setShowAddSelector(true)}
                  variant="outline"
                  className="gap-2 rounded-xl border-[#2E6F40] text-[#2E6F40]"
                >
                  <UserPlus className="w-4 h-4" /> Add Payees
                </Button>
              )}
              <div className="flex items-center gap-2 text-sm font-bold text-slate-600 bg-white px-4 py-2 rounded-xl border">
                Payee Count: {payslips.length}
              </div>
            </div>
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search employee..."
                className="pl-9 bg-white border-slate-300 focus-visible:ring-[#2E6F40] rounded-xl"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-auto bg-slate-50/50 p-0">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="w-10 h-10 border-4 border-[#2E6F40]/30 border-t-[#2E6F40] rounded-full animate-spin"></div>
              </div>
            ) : (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-white sticky top-0 z-10 shadow-sm border-b">
                  <tr>
                    <th className="px-4 py-3 text-slate-500" colSpan={3}>
                      Employee Info
                    </th>
                    <th className="px-4 py-3 text-green-700" colSpan={4}>
                      Earnings
                    </th>
                    <th className="px-4 py-3 text-red-700" colSpan={7}>
                      Deductions
                    </th>
                    <th className="px-4 py-3 text-blue-700" colSpan={2}>
                      Summary
                    </th>
                  </tr>
                  <tr className="border-t bg-white">
                    <th className="px-4 py-2 text-xs">Name</th>
                    <th className="px-4 py-2 text-xs">ID</th>
                    <th className="px-4 py-2 text-xs border-r">Position</th>
                    <th className="px-4 py-2 text-xs text-right">Basic Pay</th>
                    <th className="px-4 py-2 text-xs text-right">Overtime</th>
                    <th className="px-4 py-2 text-xs text-right">
                      Holiday Pay
                    </th>
                    <th className="px-4 py-2 text-xs text-right border-r">
                      Allowances
                    </th>
                    <th className="px-4 py-2 text-xs text-right">
                      Absences / Lates
                    </th>
                    <th className="px-4 py-2 text-xs text-right">SSS</th>
                    <th className="px-4 py-2 text-xs text-right">PhilHealth</th>
                    <th className="px-4 py-2 text-xs text-right">Pag-IBIG</th>
                    <th className="px-4 py-2 text-xs text-right">
                      Withholding Tax
                    </th>
                    <th className="px-4 py-2 text-xs text-right">Loans</th>
                    <th className="px-4 py-2 text-xs text-right border-r">
                      Other Deductions
                    </th>
                    <th className="px-4 py-2 text-xs text-right bg-slate-100">
                      NET PAY
                    </th>
                    <th className="px-4 py-2 text-xs text-center bg-slate-100">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filtered.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3 font-bold text-slate-900">
                        {p.employees?.first_name} {p.employees?.last_name}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {p.employees?.employee_code || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs border-r">
                        {p.employees?.positions?.title || "—"}
                      </td>
                      <td className="px-4 py-3 text-right">{p.gross_pay}</td>
                      <td className="px-4 py-3 text-right">{p.overtime_pay}</td>
                      <td className="px-4 py-3 text-right">{p.holiday_pay}</td>
                      <td className="px-4 py-3 text-right border-r">
                        {p.allowances}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-500">
                        {p.days_absent || 0}d / {p.minutes_late || 0}m <br />{" "}
                        <span className="font-bold text-slate-800">
                          ₱{p.absences_lates}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {p.sss_deduction}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {p.philhealth_deduction}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {p.pagibig_deduction}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {p.tax_deduction}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {p.loan_deductions}
                      </td>
                      <td className="px-4 py-3 text-right border-r">
                        {p.other_deductions || 0}
                      </td>
                      <td className="px-4 py-3 text-right font-black text-[#2E6F40] bg-slate-50">
                        ₱
                        {p.net_pay.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-4 py-3 text-center bg-slate-50 border-l">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setPreviewPayslips([p])}
                            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                            title="Download"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          {batch.status !== "paid" && (
                            <button
                              onClick={() => setEditingPayslip(p)}
                              className="p-1.5 text-amber-600 hover:bg-amber-100 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
      {showAddSelector && (
        <EmployeeSelectorModal
          alreadySelectedIds={payslips.map((p) => p.employee_id)}
          onClose={() => setShowAddSelector(false)}
          onAddSelected={handleAddEmployees}
        />
      )}
      {previewPayslips && (
        <PayslipPreviewModal
          payslipsToPrint={previewPayslips}
          batchDetails={batch}
          onClose={() => setPreviewPayslips(null)}
        />
      )}
      {editingPayslip && (
        <EditPayslipModal
          payslip={editingPayslip}
          onClose={() => setEditingPayslip(null)}
          onSaved={() => {
            setEditingPayslip(null);
            fetchBatchDetails();
          }}
        />
      )}
    </>
  );
}

// --- MAIN PAGE ---
export default function PayrollDistribution() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [importTargetBatch, setImportTargetBatch] = useState(null);
  const [editBatch, setEditBatch] = useState(null);
  const [viewBatch, setViewBatch] = useState(null);
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
  });
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    idToDelete: null,
    actionType: null,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("payroll_periods")
        .select("*, payslips(net_pay)")
        .order("start_date", { ascending: false });
      const formatted = (data || []).map((batch) => {
        const totalAmount =
          batch.payslips?.reduce((sum, p) => sum + Number(p.net_pay || 0), 0) ||
          0;
        return {
          ...batch,
          totalAmount,
          payeeCount: batch.payslips?.length || 0,
          disbursedAmount: batch.status === "paid" ? totalAmount : 0,
        };
      });
      setBatches(formatted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusStyle = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "paid") return "bg-green-100 text-green-700 border-green-200";
    if (s === "approved") return "bg-blue-100 text-blue-700 border-blue-200";
    if (s === "rejected") return "bg-red-100 text-red-700 border-red-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  const handleExportExcel = async (batch) => {
    try {
      const { data: slips } = await supabase
        .from("payslips")
        .select("*, employees(first_name, last_name, employee_code)")
        .eq("period_id", batch.id);
      if (!slips || slips.length === 0) return alert("Batch is empty!");
      let csv =
        "employee_code,basic_pay,overtime,allowances,absences_lates,sss,philhealth,pagibig,tax,loans,other\n";
      slips.forEach(
        (p) =>
          (csv += `"${p.employees?.employee_code || ""}",${p.gross_pay || 0},${p.overtime_pay || 0},${p.allowances || 0},${p.absences_lates || 0},${p.sss_deduction || 0},${p.philhealth_deduction || 0},${p.pagibig_deduction || 0},${p.tax_deduction || 0},${p.loan_deductions || 0},${p.other_deductions || 0}\n`),
      );
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Payroll_${batch.name}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message);
    }
  };

  const executeConfirmAction = async () => {
    const { idToDelete, actionType } = confirmConfig;
    setConfirmConfig({ isOpen: false, idToDelete: null, actionType: null });
    if (actionType === "delete") {
      await supabase.from("payroll_periods").delete().eq("id", idToDelete);
      loadData();
    } else if (actionType === "mark_paid") {
      await supabase
        .from("payroll_periods")
        .update({ status: "paid", date_disbursed: new Date().toISOString() })
        .eq("id", idToDelete);
      loadData();
    }
  };

  const filteredBatches = batches.filter((b) =>
    (b.name || "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Payroll Distribution
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review and disburse employee payments.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowImportModal(true)}
            variant="outline"
            className="border-blue-200 text-blue-600 hover:bg-blue-50 gap-2 rounded-xl px-5"
          >
            <Upload className="w-4 h-4" /> Import Excel
          </Button>
          <Button
            onClick={() => {
              setEditBatch(null);
              setShowCreateModal(true);
            }}
            className="bg-[#2E6F40] hover:bg-[#235330] text-white gap-2 shadow-sm rounded-xl px-5"
          >
            <Plus className="w-4 h-4" /> New Payroll
          </Button>
        </div>
      </div>
      <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b bg-slate-50">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search batch title..."
              className="pl-9 bg-white border-slate-200 rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white border-b text-slate-600">
              <tr>
                <th className="px-4 py-4 font-bold text-[11px] uppercase">
                  Title
                </th>
                <th className="px-4 py-4 font-bold text-[11px] uppercase">
                  Payout Date
                </th>
                <th className="px-4 py-4 font-bold text-[11px] uppercase">
                  Pay Period
                </th>
                <th className="px-4 py-4 font-bold text-[11px] uppercase text-right">
                  Amount
                </th>
                <th className="px-4 py-4 font-bold text-[11px] uppercase text-center">
                  Payees
                </th>
                <th className="px-4 py-4 font-bold text-[11px] uppercase">
                  Approved
                </th>
                <th className="px-4 py-4 font-bold text-[11px] uppercase">
                  Disbursed
                </th>
                <th className="px-4 py-4 font-bold text-[11px] uppercase text-right">
                  Disbursed Amt
                </th>
                <th className="px-4 py-4 font-bold text-[11px] uppercase text-center">
                  Status
                </th>
                <th className="px-4 py-4 font-bold text-[11px] uppercase text-center">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="text-center py-16">
                    <div className="w-8 h-8 border-4 border-[#2E6F40]/30 border-t-[#2E6F40] rounded-full animate-spin mx-auto"></div>
                  </td>
                </tr>
              ) : filteredBatches.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="text-center py-16 text-slate-400 font-medium"
                  >
                    <FileText className="w-8 h-8 mx-auto mb-3 opacity-30" />
                    No batches found.
                  </td>
                </tr>
              ) : (
                filteredBatches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-4 font-bold text-slate-900 text-xs">
                      {batch.name}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {formatDate(batch.pay_date)}
                    </td>
                    <td className="px-4 py-4 text-slate-500 text-xs">
                      {formatDate(batch.start_date)} -{" "}
                      {formatDate(batch.end_date)}
                    </td>
                    <td className="px-4 py-4 text-right font-semibold">
                      ₱
                      {Number(batch.totalAmount || 0).toLocaleString(
                        undefined,
                        { minimumFractionDigits: 2 },
                      )}
                    </td>
                    <td className="px-4 py-4 text-center font-semibold">
                      {batch.payeeCount}
                    </td>
                    <td className="px-4 py-4 text-slate-500 text-xs">
                      {batch.date_approved
                        ? formatDate(batch.date_approved)
                        : "—"}
                    </td>
                    <td className="px-4 py-4 text-slate-500 text-xs">
                      {batch.date_disbursed
                        ? formatDate(batch.date_disbursed)
                        : "—"}
                    </td>
                    <td className="px-4 py-4 text-right font-black text-[#2E6F40]">
                      ₱
                      {Number(batch.disbursedAmount || 0).toLocaleString(
                        undefined,
                        { minimumFractionDigits: 2 },
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase border ${getStatusStyle(batch.status)}`}
                      >
                        {batch.status || "draft"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setViewBatch(batch)}
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {batch.status === "draft" && (
                          <>
                            <button
                              onClick={() =>
                                supabase
                                  .from("payroll_periods")
                                  .update({
                                    status: "approved",
                                    date_approved: new Date().toISOString(),
                                  })
                                  .eq("id", batch.id)
                                  .then(loadData)
                              }
                              className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded"
                              title="Approve"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                supabase
                                  .from("payroll_periods")
                                  .update({ status: "rejected" })
                                  .eq("id", batch.id)
                                  .then(loadData)
                              }
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {batch.status === "approved" && (
                          <button
                            onClick={() =>
                              setConfirmConfig({
                                isOpen: true,
                                idToDelete: batch.id,
                                actionType: "mark_paid",
                              })
                            }
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                            title="Mark Paid"
                          >
                            <Banknote className="w-4 h-4" />
                          </button>
                        )}
                        {(batch.status === "approved" ||
                          batch.status === "paid") && (
                          <button
                            onClick={() => handleExportExcel(batch)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="Excel"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                        {batch.status !== "paid" && (
                          <>
                            <button
                              onClick={() => setImportTargetBatch(batch)}
                              className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded"
                              title="Import CSV"
                            >
                              <Upload className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditBatch(batch);
                                setShowCreateModal(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                setConfirmConfig({
                                  isOpen: true,
                                  idToDelete: batch.id,
                                  actionType: "delete",
                                })
                              }
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {showCreateModal && (
        <PayrollBatchModal
          batch={editBatch}
          onClose={() => setShowCreateModal(false)}
          onSaved={() => {
            setShowCreateModal(false);
            loadData();
          }}
        />
      )}
      {importTargetBatch && (
        <ImportExcelModal
          batch={importTargetBatch}
          onClose={() => setImportTargetBatch(null)}
          onImported={() => {
            setImportTargetBatch(null);
            loadData();
          }}
        />
      )}
      {viewBatch && (
        <ViewBatchModal
          batch={viewBatch}
          onClose={() => {
            setViewBatch(null);
            loadData();
          }}
        />
      )}
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
        title={
          confirmConfig.actionType === "delete"
            ? "Delete Batch"
            : "Mark as Paid"
        }
        message={
          confirmConfig.actionType === "delete"
            ? "Delete this batch permanently?"
            : "Mark this batch as Paid?"
        }
        onCancel={() =>
          setConfirmConfig({
            isOpen: false,
            idToDelete: null,
            actionType: null,
          })
        }
        onConfirm={executeConfirmAction}
      />
    </div>
  );
}
