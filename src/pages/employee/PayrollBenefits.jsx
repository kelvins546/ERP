import { useEffect, useState, useRef } from "react";
import { supabase } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import {
  Banknote,
  CalendarDays,
  ShieldPlus,
  Download,
  FileText,
  Umbrella,
  Calendar as CalendarIcon,
  HeartPulse,
  CheckCircle2,
  X,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// --- PAYSLIP HISTORY PREVIEW MODAL ---
function PayslipHistoryPreviewModal({ payslips, onClose }) {
  const iframeRef = useRef(null);

  if (!payslips || payslips.length === 0) return null;

  const employee = payslips[0]?.employees || {};

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Payslip History - ${employee.first_name || ""} ${employee.last_name || ""}</title>
      <style>
        @page { margin: 20mm; size: letter; }
        body { font-family: 'Arial', sans-serif; color: #000; margin: 0; padding: 20px 0; font-size: 12px; }
        .container { max-width: 800px; margin: 0 auto; }
        .header { display: flex; gap: 20px; align-items: flex-start; margin-bottom: 30px; border-bottom: 2px solid #2E6F40; padding-bottom: 20px; }
        .title { font-size: 24px; font-weight: bold; color: #2E6F40; margin: 0; text-transform: uppercase; }
        .subtitle { font-size: 13px; color: #475569; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background-color: #f1f5f9; color: #334155; font-size: 11px; text-transform: uppercase; padding: 12px 10px; text-align: left; border-bottom: 2px solid #cbd5e1; }
        td { padding: 12px 10px; border-bottom: 1px solid #e2e8f0; color: #0f172a; }
        .val-right { text-align: right; font-family: monospace; font-weight: bold; font-size: 13px; }
        .text-green { color: #2E6F40; font-weight: 900; }
        .text-red { color: #dc2626; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div>
            <h1 class="title">Payslip History Report</h1>
            <p class="subtitle"><strong>Employee:</strong> ${employee.first_name || ""} ${employee.last_name || ""} (${employee.employee_code || "—"})</p>
            <p class="subtitle"><strong>Generated on:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Payroll Period</th>
              <th>Pay Date</th>
              <th class="val-right">Gross Pay</th>
              <th class="val-right">Deductions</th>
              <th class="val-right">Net Pay</th>
            </tr>
          </thead>
          <tbody>
            ${payslips
              .map(
                (p) => `
              <tr>
                <td><strong>${p.period?.name || "—"}</strong></td>
                <td>${p.period?.pay_date ? new Date(p.period.pay_date).toLocaleDateString() : "—"}</td>
                <td class="val-right">₱${Number(p.gross_pay || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td class="val-right text-red">- ₱${Number(p.total_deductions || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td class="val-right text-green">₱${Number(p.net_pay || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </body>
    </html>
  `;

  const handlePrint = () => {
    if (iframeRef.current) iframeRef.current.contentWindow.print();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden border border-slate-100">
        <div className="flex items-center justify-between p-6 border-b shrink-0 bg-white">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Printer className="w-5 h-5 text-[#2E6F40]" /> Payslip History
            Report
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
            title="Payslip History PDF Preview"
            className="w-full max-w-[850px] h-full bg-white shadow-md border border-slate-200 rounded"
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
            onClick={handlePrint}
          >
            <Printer className="w-4 h-4" /> Print / Save as PDF
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- PAYSLIP PDF PREVIEW MODAL (INDIVIDUAL) ---
function PayslipPreviewModal({ payslip, onClose }) {
  const iframeRef = useRef(null);

  if (!payslip) return null;

  const logoUrl = `${window.location.origin}/folder/logo.png`;
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
          <img src="${logoUrl}" class="logo" alt="Company Logo" onerror="this.src='/folder/logo.jpg'" />
          <div class="emp-details">
            <span style="font-size: 18px; font-weight: bold;">OFFICIAL PAYSLIP</span>
            <span><strong>Name:</strong> ${p.employees?.last_name || ""}, ${p.employees?.first_name || ""}</span>
            <span><strong>Employee ID:</strong> ${p.employees?.employee_code || "—"}</span>
            <span><strong>Position:</strong> ${p.employees?.positions?.title || p.employees?.departments?.name || "Staff"}</span>
            <span><strong>Pay Period:</strong> ${p.period?.name || ""}</span>
          </div>
        </div>
        <div class="content">
          <div class="col">
            <div class="section-title">Earnings & Adjustments</div>
            <div class="row"><span>Basic Salary</span><span class="val">${Number(p.gross_pay || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
            ${p.holiday_pay > 0 ? `<div class="row"><span>Holiday Premium Pay</span><span class="val">${Number(p.holiday_pay).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>` : ""}
            ${p.overtime_pay > 0 ? `<div class="row"><span>Overtime Pay</span><span class="val">${Number(p.overtime_pay).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>` : ""}
            ${p.allowances > 0 ? `<div class="row"><span>Allowances & Benefits</span><span class="val">${Number(p.allowances).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>` : ""}
            ${p.absences_lates > 0 ? `<div style="margin-top: 20px;" class="row"><strong>Less: Tardiness / Absences</strong></div><div class="row indent"><span class="text-red">Absences & Lates Penalty</span><span class="val text-red">- ${Number(p.absences_lates).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>` : ""}
          </div>
          <div class="col">
            <div class="section-title">Government & Company Deductions</div>
            <div class="row indent"><span>SSS Contribution</span><span class="val">${Number(p.sss_deduction || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
            <div class="row indent"><span>PhilHealth</span><span class="val">${Number(p.philhealth_deduction || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
            <div class="row indent"><span>Pag-IBIG</span><span class="val">${Number(p.pagibig_deduction || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
            <div class="row indent"><span>Withholding Tax</span><span class="val">${Number(p.tax_deduction || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
            ${p.loan_deductions > 0 ? `<div class="row indent"><span>Loan Deductions</span><span class="val">${Number(p.loan_deductions).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>` : ""}
            ${p.other_deductions > 0 ? `<div class="row indent"><span>Other Deductions</span><span class="val">${Number(p.other_deductions).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>` : ""}
            <div class="summary-box">
              <div class="row"><strong>Summary</strong></div>
              <div class="row indent"><span>Total Gross Earnings</span><span class="val">${(Number(p.gross_pay || 0) + Number(p.overtime_pay || 0) + Number(p.holiday_pay || 0) + Number(p.allowances || 0) - Number(p.absences_lates || 0)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
              <div class="row indent"><span>Total Deductions</span><span class="val">${Number(p.total_deductions || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
              <div class="row net-pay"><span>NET PAY</span><span class="val">₱${Number(p.net_pay || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden border border-slate-100">
        <div className="flex items-center justify-between p-6 border-b shrink-0 bg-white">
          <h2 className="text-xl font-bold text-slate-900">
            Official Payslip Document
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
            Close
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

export default function ESSPayrollBenefits() {
  const { user } = useAuth();

  const [payslips, setPayslips] = useState([]);
  const [benefits, setBenefits] = useState([]);
  const [holidays, setHolidays] = useState([]);

  const [previewPayslip, setPreviewPayslip] = useState(null);
  const [previewHistory, setPreviewHistory] = useState(false);

  const [loadingPayslips, setLoadingPayslips] = useState(true);
  const [loadingBenefits, setLoadingBenefits] = useState(true);
  const [loadingHolidays, setLoadingHolidays] = useState(true);

  // Get today's date at midnight for accurate past/future comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  useEffect(() => {
    if (!user?.id) return;

    // 1. Fetch Payslips (Including Employee Join for the PDF template!)
    const fetchPayslips = async () => {
      setLoadingPayslips(true);
      try {
        const { data, error } = await supabase
          .from("payslips")
          .select(
            `
            *,
            period:period_id (
              name,
              pay_date,
              start_date,
              end_date
            ),
            employees (
              first_name,
              last_name,
              employee_code,
              positions ( title ),
              departments!employees_department_id_fkey ( name )
            )
          `,
          )
          .eq("employee_id", user.id)
          .order("created_at", { ascending: false })
          .limit(24);

        if (error) throw error;
        setPayslips(data || []);
      } catch (error) {
        console.error("Error fetching payslips:", error.message);
      } finally {
        setLoadingPayslips(false);
      }
    };

    // 2. Fetch Active Benefits
    const fetchBenefits = async () => {
      setLoadingBenefits(true);
      try {
        const { data, error } = await supabase
          .from("employee_benefits")
          .select("*")
          .eq("employee_id", user.id)
          .eq("status", "active");

        if (error) throw error;
        setBenefits(data || []);
      } catch (error) {
        console.error("Error fetching benefits:", error.message);
      } finally {
        setLoadingBenefits(false);
      }
    };

    // 3. Fetch ALL Holidays for the Current Year
    const fetchHolidays = async () => {
      setLoadingHolidays(true);
      try {
        const currentYear = new Date().getFullYear();

        const { data, error } = await supabase
          .from("holidays")
          .select("*")
          .gte("date", `${currentYear}-01-01`)
          .lte("date", `${currentYear}-12-31`)
          .order("date", { ascending: true });

        if (error) throw error;
        setHolidays(data || []);
      } catch (error) {
        console.error("Error fetching holidays:", error.message);
      } finally {
        setLoadingHolidays(false);
      }
    };

    fetchPayslips();
    fetchBenefits();
    fetchHolidays();
  }, [user]);

  const getBenefitIcon = (type) => {
    const t = type.toLowerCase();
    if (t.includes("hmo") || t.includes("health")) return HeartPulse;
    if (t.includes("life") || t.includes("insurance")) return Umbrella;
    return ShieldPlus;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Payroll & Benefits
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          Access your payslips, view your company benefits, and check the
          holidays for {new Date().getFullYear()}.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Takes up 2/3 space) */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Payslips Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Banknote className="w-5 h-5 text-[#2E6F40]" /> My Payslips
              </h3>
              <Button
                onClick={() => setPreviewHistory(true)}
                disabled={payslips.length === 0}
                variant="outline"
                className="text-[#2E6F40] border-[#2E6F40]/30 hover:bg-[#2E6F40]/10 flex items-center gap-2 h-8 px-3 text-xs"
              >
                <Printer className="w-3.5 h-3.5" /> Print History
              </Button>
            </div>

            <div className="space-y-3">
              {loadingPayslips ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-[#2E6F40]/30 border-t-[#2E6F40] rounded-full animate-spin"></div>
                </div>
              ) : payslips.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-500">
                    No payslips available yet.
                  </p>
                </div>
              ) : (
                payslips.map((slip) => (
                  <div
                    key={slip.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:border-[#2E6F40]/30 transition-colors"
                  >
                    <div className="mb-3 sm:mb-0">
                      <p className="font-bold text-slate-900">
                        {slip.period?.name || "Payroll Period"}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Pay Date:{" "}
                        <span className="font-medium text-slate-700">
                          {slip.period?.pay_date
                            ? new Date(
                                slip.period.pay_date,
                              ).toLocaleDateString()
                            : "TBD"}
                        </span>
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Net Pay:{" "}
                        <span className="font-bold text-[#2E6F40]">
                          ₱
                          {Number(slip.net_pay).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </p>
                    </div>
                    <Button
                      onClick={() => setPreviewPayslip(slip)}
                      variant="outline"
                      className="text-[#2E6F40] border-[#2E6F40]/30 hover:bg-[#2E6F40]/10 flex items-center gap-2 w-full sm:w-auto"
                    >
                      <Download className="w-4 h-4" /> Download PDF
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 2. Benefits Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <ShieldPlus className="w-5 h-5 text-[#2E6F40]" /> Active Benefits
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loadingBenefits ? (
                <div className="col-span-full flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-[#2E6F40]/30 border-t-[#2E6F40] rounded-full animate-spin"></div>
                </div>
              ) : benefits.length === 0 ? (
                <div className="col-span-full text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <ShieldPlus className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-500">
                    No active benefits recorded yet.
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Please contact HR if you believe this is an error.
                  </p>
                </div>
              ) : (
                benefits.map((benefit) => {
                  const BIcon = getBenefitIcon(benefit.benefit_type);
                  return (
                    <div
                      key={benefit.id}
                      className="p-5 bg-white border border-slate-200 shadow-sm rounded-xl relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-16 h-16 bg-[#2E6F40]/5 rounded-bl-full -z-10"></div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-[#2E6F40]/10 text-[#2E6F40] rounded-lg">
                          <BIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">
                            {benefit.benefit_type}
                          </p>
                          <p className="text-xs font-semibold text-slate-500 uppercase">
                            {benefit.provider_company}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                          <span className="text-slate-500">
                            Policy / Serial No.
                          </span>
                          <span className="font-medium text-slate-900">
                            {benefit.serial_number || "N/A"}
                          </span>
                        </div>
                        <div className="flex flex-col pt-1">
                          <span className="text-slate-500 text-xs mb-1">
                            Registered Beneficiaries
                          </span>
                          <span className="font-medium text-slate-900">
                            {benefit.beneficiaries || "None listed"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column (Takes up 1/3 space) */}
        <div className="space-y-6">
          {/* 3. Holidays Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-[#2E6F40]" /> Holidays (
                {new Date().getFullYear()})
              </h3>
            </div>

            <div className="space-y-3">
              {loadingHolidays ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-[#2E6F40]/30 border-t-[#2E6F40] rounded-full animate-spin"></div>
                </div>
              ) : holidays.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <CalendarIcon className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-500">
                    No holidays scheduled for this year.
                  </p>
                </div>
              ) : (
                holidays.map((holiday) => {
                  const dateObj = new Date(holiday.date);
                  // Check if the holiday is in the past
                  const isPast = dateObj < today;

                  return (
                    <div
                      key={holiday.id}
                      className={`flex items-start gap-4 p-3 rounded-lg border transition-colors ${
                        isPast
                          ? "bg-slate-50 border-transparent opacity-60"
                          : "bg-white border-slate-200 shadow-sm hover:border-[#2E6F40]/50"
                      }`}
                    >
                      <div
                        className={`flex flex-col items-center justify-center rounded-lg w-12 h-12 shrink-0 border ${
                          isPast
                            ? "bg-slate-200 text-slate-500 border-slate-300"
                            : "bg-[#2E6F40]/10 text-[#2E6F40] border-[#2E6F40]/20"
                        }`}
                      >
                        <span className="text-xs font-bold uppercase leading-none mb-0.5">
                          {dateObj.toLocaleString("default", {
                            month: "short",
                          })}
                        </span>
                        <span className="text-lg font-black leading-none">
                          {dateObj.getDate()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p
                            className={`font-bold ${isPast ? "text-slate-600 line-through decoration-slate-300" : "text-slate-900"}`}
                          >
                            {holiday.name}
                          </p>
                          {isPast && (
                            <CheckCircle2 className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {holiday.type}
                        </p>

                        {!isPast && holiday.pay_rate_multiplier > 1 && (
                          <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 px-2 py-0.5 rounded border border-amber-200">
                            {holiday.pay_rate_multiplier}x Premium Pay
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <PayslipPreviewModal
        payslip={previewPayslip}
        onClose={() => setPreviewPayslip(null)}
      />
      {previewHistory && (
        <PayslipHistoryPreviewModal
          payslips={payslips}
          onClose={() => setPreviewHistory(false)}
        />
      )}
    </div>
  );
}
