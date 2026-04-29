import { useState, useRef } from "react";
import { supabase } from "@/api/base44Client";
import {
  Search,
  Download,
  Printer,
  Calendar,
  AlertCircle,
  X,
  Calculator,
  Gift,
  CheckCircle2,
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

// --- 13TH MONTH PAYSLIP PDF PREVIEW ---
function ThirteenthMonthPreviewModal({ dataToPrint, year, onClose }) {
  const iframeRef = useRef(null);
  if (!dataToPrint || dataToPrint.length === 0) return null;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>13th Month Pay - ${year}</title>
      <style>
        @page { margin: 20mm; size: letter; }
        body { font-family: 'Arial', sans-serif; color: #000; margin: 0; padding: 20px 0; font-size: 12px; }
        .container { max-width: 800px; margin: 0 auto 40px auto; border: 1px solid #000; padding: 40px; box-sizing: border-box; page-break-inside: avoid; }
        .header { display: flex; gap: 20px; align-items: flex-start; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px; }
        .logo { max-height: 70px; object-fit: contain; }
        .emp-details { display: flex; flex-direction: column; gap: 4px; }
        .section-title { font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #000; padding-bottom: 4px; text-transform: uppercase; color: #2E6F40; }
        .row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px; }
        .val { text-align: right; font-family: monospace; font-size: 14px; }
        .net-pay { font-weight: bold; font-size: 18px; border-top: 2px solid #000; padding-top: 15px; margin-top: 15px; color: #2E6F40; }
        .page-break { page-break-after: always; }
        .note { font-size: 10px; color: #666; margin-top: 20px; font-style: italic; }
      </style>
    </head>
    <body>
      ${dataToPrint
        .map(
          (p) => `
        <div class="container">
          <div class="header">
            <img src="/folder/logo.png" class="logo" alt="Company Logo" onerror="this.src='/folder/logo.jpg'" />
            <div class="emp-details">
              <span style="font-size: 18px; font-weight: bold; color: #2E6F40;">OFFICIAL 13TH MONTH PAY</span>
              <span><strong>Name:</strong> ${p.last_name}, ${p.first_name}</span>
              <span><strong>ID:</strong> ${p.employee_code || "—"}</span>
              <span><strong>Disbursement Year:</strong> ${year}</span>
            </div>
          </div>
          
          <div class="section-title">Computation Breakdown</div>
          
          <div class="row">
            <span>Calculated Daily Rate</span>
            <span class="val">₱${Number(p.dailyRate || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
          </div>
          
          <div class="row">
            <span>Actual Days Worked in ${year} <br><span style="font-size:10px; color:#666;">(Based on scanned DTR logs)</span></span>
            <span class="val">${p.daysWorked} Days</span>
          </div>

          <div class="row">
            <span>Total Basic Salary Earned</span>
            <span class="val">₱${Number(p.totalEarned || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
          </div>
          
          <div class="row net-pay">
            <span>FINAL 13TH MONTH PAY<br><span style="font-size:10px; color:#666; font-weight:normal;">(Total Earned / 12)</span></span>
            <span class="val">₱${Number(p.thirteenthMonth || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
          </div>

          <div class="note">
            * 13th Month Pay is computed strictly based on the total basic salary earned during the calendar year, divided by 12, in compliance with DOLE regulations.
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
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden border border-slate-100">
        <div className="flex items-center justify-between p-6 border-b shrink-0 bg-white">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Gift className="w-5 h-5 text-[#2E6F40]" /> 13th Month Pay Previews
          </h2>
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
            title="Payslips"
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
            <Printer className="w-4 h-4" /> Print Documents
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ThirteenthMonthPay() {
  const [results, setResults] = useState([]);
  const [calculating, setCalculating] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [previewData, setPreviewData] = useState(null);
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
  });

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  // --- THE CORE CALCULATION ENGINE ---
  const handleCalculate = async () => {
    setCalculating(true);
    try {
      // 1. Fetch Employees & Profiles
      const { data: emps, error: empErr } = await supabase
        .from("employees")
        .select(
          "id, first_name, last_name, employee_code, hire_date, positions(title)",
        )
        .order("first_name", { ascending: true });
      if (empErr) throw empErr;

      const { data: profiles, error: profErr } = await supabase
        .from("salary_profiles")
        .select("employee_id, basic_salary, pay_frequency");
      if (profErr) throw profErr;

      const yearStart = `${selectedYear}-01-01T00:00:00Z`;
      const yearEnd = `${selectedYear}-12-31T23:59:59Z`;

      // 2. Loop through each employee to fetch actual days worked
      const calculatedData = await Promise.all(
        emps.map(async (emp) => {
          const profile = profiles.find((p) => p.employee_id === emp.id);
          const hasProfile = !!profile;

          let monthlyBasic = 0;
          let dailyRate = 0;
          let daysWorked = 0;
          let totalEarned = 0;
          let thirteenthMonth = 0;

          if (hasProfile) {
            const basic = Number(profile.basic_salary || 0);
            monthlyBasic =
              profile.pay_frequency === "monthly" ? basic : basic * 2;
            dailyRate = monthlyBasic / 22;

            // Fetch DTR Logs for the entire year
            const { data: logs } = await supabase
              .from("attendance_logs")
              .select("calculated_server_time")
              .eq("employee_id", emp.id)
              .eq("type", "time_in")
              .gte("calculated_server_time", yearStart)
              .lte("calculated_server_time", yearEnd);

            // Count unique days worked
            if (logs && logs.length > 0) {
              const uniqueDates = new Set();
              logs.forEach((log) => {
                const dateStr = log.calculated_server_time.split("T")[0];
                uniqueDates.add(dateStr);
              });
              daysWorked = uniqueDates.size;
            }

            totalEarned = daysWorked * dailyRate;
            thirteenthMonth = totalEarned / 12;
          }

          return {
            ...emp,
            monthlyBasic,
            dailyRate,
            daysWorked,
            totalEarned,
            thirteenthMonth,
            hasProfile,
          };
        }),
      );

      setResults(calculatedData);
    } catch (err) {
      setAlertConfig({
        isOpen: true,
        title: "Calculation Error",
        message: err.message,
      });
    } finally {
      setCalculating(false);
    }
  };

  const handleExportCSV = () => {
    if (results.length === 0) {
      return setAlertConfig({
        isOpen: true,
        title: "No Data",
        message: "Please run the calculation engine first.",
      });
    }

    let csv =
      "Employee Code,Last Name,First Name,Hire Date,Daily Rate,Days Worked,Total Earned Basic,13TH MONTH PAY\n";

    results
      .filter((e) => e.hasProfile)
      .forEach((emp) => {
        csv += `"${emp.employee_code || ""}","${emp.last_name}","${emp.first_name}","${emp.hire_date || ""}",${emp.dailyRate},${emp.daysWorked},${emp.totalEarned},${emp.thirteenthMonth}\n`;
      });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `13th_Month_Pay_${selectedYear}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const filteredResults = results.filter((e) => {
    const term = search.toLowerCase();
    return (
      e.first_name.toLowerCase().includes(term) ||
      e.last_name.toLowerCase().includes(term) ||
      (e.employee_code || "").toLowerCase().includes(term)
    );
  });

  return (
    <div className="p-6 max-w-[1400px] mx-auto pb-10 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 bg-[#2E6F40]/10 text-[#2E6F40] rounded-xl flex items-center justify-center">
              <Gift className="w-5 h-5" />
            </div>
            13th Month Pay Generator
          </h1>
          <p className="text-sm text-slate-500 mt-1 ml-14">
            Scans actual DTR attendance logs to compute legally accurate
            13th-month bonuses.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
            <Calendar className="w-4 h-4 text-slate-400 mr-2" />
            <select
              className="bg-transparent text-sm font-bold text-slate-700 outline-none focus:ring-0 cursor-pointer"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y} Target Year
                </option>
              ))}
            </select>
          </div>

          <Button
            onClick={handleCalculate}
            disabled={calculating}
            className="bg-[#2E6F40] hover:bg-[#235330] text-white gap-2 shadow-sm rounded-xl px-6 font-bold"
          >
            {calculating ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <Calculator className="w-4 h-4" />
            )}
            {calculating ? "Scanning Logs..." : "Run Engine"}
          </Button>
        </div>
      </div>

      {/* MAIN TABLE */}
      <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search computed results..."
              className="pl-9 bg-white border-slate-200 rounded-xl focus-visible:ring-[#2E6F40]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={results.length === 0}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleExportCSV}
              variant="outline"
              className="border-slate-200 text-slate-600 hover:bg-slate-50 gap-2 rounded-xl px-4"
              disabled={results.length === 0}
            >
              <Download className="w-4 h-4" /> Export CSV
            </Button>
            <Button
              onClick={() =>
                setPreviewData(filteredResults.filter((e) => e.hasProfile))
              }
              variant="outline"
              className="border-[#2E6F40] text-[#2E6F40] hover:bg-[#2E6F40]/5 gap-2 rounded-xl px-4"
              disabled={results.length === 0}
            >
              <Printer className="w-4 h-4" /> Print Slips
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white border-b text-slate-600">
              <tr>
                <th className="px-6 py-4 font-bold text-[11px] uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-4 font-bold text-[11px] uppercase tracking-wider">
                  Hire Date
                </th>
                <th className="px-6 py-4 font-bold text-[11px] uppercase tracking-wider text-right">
                  Daily Rate
                </th>
                <th className="px-6 py-4 font-bold text-[11px] uppercase tracking-wider text-center">
                  Days Worked
                </th>
                <th className="px-6 py-4 font-bold text-[11px] uppercase tracking-wider text-right text-slate-500">
                  Total Earned Basic
                </th>
                <th className="px-6 py-4 font-bold text-[11px] uppercase tracking-wider text-right bg-emerald-50 text-[#2E6F40]">
                  13TH MONTH PAY
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {calculating ? (
                <tr>
                  <td colSpan={6} className="text-center py-24">
                    <div className="w-10 h-10 border-4 border-[#2E6F40]/30 border-t-[#2E6F40] rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-sm font-bold text-slate-600">
                      Scanning thousands of attendance logs...
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      This may take a moment.
                    </p>
                  </td>
                </tr>
              ) : results.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-24">
                    <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-base font-bold text-slate-700">
                      Ready to Generate
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      Select a Target Year and click "Run Engine" to begin.
                    </p>
                  </td>
                </tr>
              ) : filteredResults.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-16 text-slate-400 font-medium"
                  >
                    No employees match your search.
                  </td>
                </tr>
              ) : (
                filteredResults.map((emp) => (
                  <tr
                    key={emp.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">
                        {emp.first_name} {emp.last_name}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                        {emp.employee_code || "No ID"} |{" "}
                        {emp.positions?.title || "Staff"}
                      </div>
                      {!emp.hasProfile && (
                        <span className="inline-block mt-1 text-[9px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full uppercase">
                          No Salary Profile
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {emp.hire_date
                        ? new Date(emp.hire_date).toLocaleDateString()
                        : "—"}
                    </td>

                    <td className="px-6 py-4 text-right font-medium text-slate-600">
                      ₱
                      {emp.dailyRate.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className="px-3 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {emp.daysWorked} Days
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right font-bold text-slate-700">
                      ₱
                      {emp.totalEarned.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </td>

                    <td className="px-6 py-4 text-right font-black text-[#2E6F40] bg-emerald-50/30 text-base">
                      ₱
                      {emp.thirteenthMonth.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
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
      {previewData && (
        <ThirteenthMonthPreviewModal
          dataToPrint={previewData}
          year={selectedYear}
          onClose={() => setPreviewData(null)}
        />
      )}
    </div>
  );
}
