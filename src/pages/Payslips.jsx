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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- CUSTOM MODALS FOR ALERTS & CONFIRMATIONS ---
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

  useEffect(() => {
    const fetchPayrollDetails = async () => {
      setLoading(true);
      try {
        const { data: payslipsData, error } = await supabase
          .from("payslips")
          .select(
            `
            id,
            net_pay,
            employees (
              first_name,
              last_name,
              employee_code,
              positions ( title ),
              project_sites ( name )
            )
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900">View Payroll</h2>
            <p className="text-sm text-slate-500 mt-1">{periodName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-5 border-b shrink-0 bg-slate-50/50">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              className="pl-9 bg-white focus-visible:ring-[#2E6F40]"
              placeholder="Search by name or employee no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-[#2E6F40]/30 border-t-[#2E6F40] rounded-full animate-spin" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Employee No.
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Net Pay
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
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
                      <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-3">
                        <Eye className="w-4 h-4 text-slate-300" />
                        {p.employees
                          ? `${p.employees.first_name} ${p.employees.last_name}`
                          : "Unknown Employee"}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {p.employees?.employee_code || "—"}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {p.employees?.positions?.title || "—"}
                      </td>
                      <td className="px-6 py-4 text-slate-600 uppercase text-xs">
                        {p.employees?.project_sites?.name || "—"}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800 text-right">
                        ₱
                        {Number(p.net_pay || 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
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
          <Button variant="outline" onClick={onClose}>
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
        /* Margins for the print output */
        @page { margin: 20mm; size: letter; }
        
        /* Basic body styling */
        body { font-family: 'Arial', sans-serif; color: #000; margin: 0; padding: 20px 0; font-size: 12px; }
        
        /* Container styling matching the exact required format */
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
            <div class="section-title">Basic Pertinent Information</div>
            <div class="row"><span>Basic Salary</span><span class="val">${Number(p.gross_pay || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
            <div class="row"><span>Overtime Pay</span><span class="val">${Number(p.overtime_pay || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
          </div>
          
          <div class="col">
            <div class="section-title">Salary Breakdown</div>
            
            <div class="row"><strong>Benefits</strong></div>
            <div class="row indent"><span>Allowances</span><span class="val">${Number(p.allowances || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
            
            <div style="margin-top: 20px;" class="row"><strong>Deductions</strong></div>
            <div class="row indent"><span>SSS Contribution</span><span class="val">${Number(p.sss_deduction || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
            <div class="row indent"><span>PhilHealth</span><span class="val">${Number(p.philhealth_deduction || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
            <div class="row indent"><span>Pag-IBIG</span><span class="val">${Number(p.pagibig_deduction || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
            <div class="row indent"><span>Withholding Tax</span><span class="val">${Number(p.tax_deduction || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
            <div class="row indent"><span>Loan Deductions</span><span class="val">${Number(p.loan_deductions || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
            
            <div class="summary-box">
              <div class="row"><strong>Summary</strong></div>
              <div class="row indent"><span>Total Gross Pay</span><span class="val">${(Number(p.gross_pay || 0) + Number(p.overtime_pay || 0) + Number(p.allowances || 0)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
              <div class="row indent"><span>Total Deductions</span><span class="val">${Number(p.total_deductions || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
              <div class="row net-pay"><span>NET PAY</span><span class="val">${Number(p.net_pay || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  // Function to grab the iframe window and trigger the print prompt
  const handlePrint = () => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow.print();
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b shrink-0 bg-white">
          <h2 className="text-lg font-semibold text-slate-900">
            Payslip Document Preview
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* IFRAME CONTAINER */}
        <div className="flex-1 bg-slate-100 overflow-hidden p-6 flex justify-center">
          <iframe
            ref={iframeRef}
            srcDoc={html}
            title="Payslip PDF Preview"
            className="w-full max-w-[850px] h-full bg-white shadow-md border border-slate-200 rounded"
          />
        </div>

        <div className="p-5 border-t shrink-0 flex justify-end gap-3 bg-white">
          <Button variant="outline" onClick={onClose}>
            Back
          </Button>
          <Button
            className="bg-[#2E6F40] hover:bg-[#235330] text-white gap-2"
            onClick={handlePrint}
          >
            <Printer className="w-4 h-4" /> Print / Save as PDF
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- PAYROLL COMPUTATION ENGINE ---
const computeDeductions = (basicSalary) => {
  let sss = 0;
  if (basicSalary > 0) {
    const cappedSalary = Math.min(basicSalary, 30000);
    sss = cappedSalary * 0.045;
  }
  let philhealth = 0;
  if (basicSalary > 10000) {
    const cappedSalary = Math.min(basicSalary, 100000);
    philhealth = cappedSalary * 0.025;
  }
  let pagibig = 0;
  if (basicSalary > 1500) {
    pagibig = 200;
  }
  let tax = 0;
  const taxableIncome = basicSalary - (sss + philhealth + pagibig);
  if (taxableIncome > 10417) {
    tax = (taxableIncome - 10417) * 0.2;
  }
  return {
    sss: Math.round(sss * 100) / 100,
    philhealth: Math.round(philhealth * 100) / 100,
    pagibig: pagibig,
    tax: Math.round(tax * 100) / 100,
  };
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
    gross_pay: 0,
    overtime_pay: 0,
    allowances: 0,
    sss_deduction: 0,
    philhealth_deduction: 0,
    pagibig_deduction: 0,
    tax_deduction: 0,
    loan_deductions: 0,
    total_deductions: 0,
    net_pay: 0,
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
      Number(form.loan_deductions || 0);

    const net =
      Number(form.gross_pay || 0) +
      Number(form.overtime_pay || 0) +
      Number(form.allowances || 0) -
      totalDeductions;

    setForm((f) => ({ ...f, total_deductions: totalDeductions, net_pay: net }));
  }, [
    form.gross_pay,
    form.overtime_pay,
    form.allowances,
    form.sss_deduction,
    form.philhealth_deduction,
    form.pagibig_deduction,
    form.tax_deduction,
    form.loan_deductions,
  ]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleAutoCompute = async () => {
    if (!form.employee_id) {
      setAlertConfig({
        isOpen: true,
        title: "Action Required",
        message: "Please select an Employee first before auto-computing.",
      });
      return;
    }
    setComputing(true);
    try {
      const { data: profile, error: profileErr } = await supabase
        .from("salary_profiles")
        .select("*")
        .eq("employee_id", form.employee_id)
        .single();

      if (profileErr || !profile) {
        throw new Error(
          "Could not find a Salary Profile for this employee. Ensure it is set up in the Salary Profiles module.",
        );
      }

      const { data: loans, error: loansErr } = await supabase
        .from("company_loans")
        .select("deduction_per_period")
        .eq("employee_id", form.employee_id)
        .eq("status", "active");

      let totalLoanDeduction = 0;
      if (loans && !loansErr) {
        totalLoanDeduction = loans.reduce(
          (sum, loan) => sum + Number(loan.deduction_per_period),
          0,
        );
      }

      const semiMonthlyPay =
        Number(profile.basic_salary) /
        (profile.pay_frequency === "monthly" ? 2 : 1);

      const autoDeductions = computeDeductions(semiMonthlyPay);
      const finalSSS =
        profile.sss_contribution > 0
          ? profile.sss_contribution
          : autoDeductions.sss;
      const finalPhilhealth =
        profile.philhealth_contribution > 0
          ? profile.philhealth_contribution
          : autoDeductions.philhealth;
      const finalPagibig =
        profile.pagibig_contribution > 0
          ? profile.pagibig_contribution
          : autoDeductions.pagibig;

      setForm((f) => ({
        ...f,
        gross_pay: semiMonthlyPay,
        allowances: Number(profile.de_minimis_allowance || 0),
        sss_deduction: finalSSS,
        philhealth_deduction: finalPhilhealth,
        pagibig_deduction: finalPagibig,
        tax_deduction: autoDeductions.tax,
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
            <h2 className="text-lg font-semibold">
              {payslip ? "Edit Payslip" : "Issue Payslip"}
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5" /> 1. Identification
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-600">
                    Employee *
                  </label>
                  <select
                    className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus-visible:ring-[#2E6F40] focus-visible:border-[#2E6F40]"
                    value={form.employee_id || ""}
                    onChange={(e) => set("employee_id", e.target.value)}
                  >
                    <option value="">-- Select Employee --</option>
                    {employeesList.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name} ({emp.employee_code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">
                    Payroll Period *
                  </label>
                  <select
                    className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus-visible:ring-[#2E6F40] focus-visible:border-[#2E6F40]"
                    value={form.period_id || ""}
                    onChange={(e) => set("period_id", e.target.value)}
                  >
                    <option value="">-- Select Period --</option>
                    {periodsList.map((period) => (
                      <option key={period.id} value={period.id}>
                        {period.name ||
                          `${period.start_date} to ${period.end_date}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Button
                onClick={handleAutoCompute}
                disabled={computing || !form.employee_id}
                className="w-full bg-[#2E6F40] hover:bg-[#235330] text-white gap-2 mt-2"
              >
                <Calculator className="w-4 h-4" />{" "}
                {computing
                  ? "Calculating Data..."
                  : "Auto-Compute Financials from Profile"}
              </Button>
            </div>

            <hr className="border-slate-100" />

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-[#2E6F40] uppercase tracking-wider flex items-center gap-1">
                <TrendingUp className="w-4 h-4" /> 2. Earnings
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-600">
                    Basic/Gross Pay
                  </label>
                  <Input
                    className="mt-1 border-green-100 focus-visible:ring-[#2E6F40]"
                    type="number"
                    step="0.01"
                    value={form.gross_pay === 0 ? "" : form.gross_pay}
                    onChange={(e) => set("gross_pay", Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">
                    Overtime Pay
                  </label>
                  <Input
                    className="mt-1 border-green-100 focus-visible:ring-[#2E6F40]"
                    type="number"
                    step="0.01"
                    value={form.overtime_pay === 0 ? "" : form.overtime_pay}
                    onChange={(e) =>
                      set("overtime_pay", Number(e.target.value))
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">
                    Allowances
                  </label>
                  <Input
                    className="mt-1 border-green-100 focus-visible:ring-[#2E6F40]"
                    type="number"
                    step="0.01"
                    value={form.allowances === 0 ? "" : form.allowances}
                    onChange={(e) => set("allowances", Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-red-600 uppercase tracking-wider flex items-center gap-1">
                <TrendingDown className="w-4 h-4" /> 3. Deductions
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-600">
                    SSS
                  </label>
                  <Input
                    className="mt-1 border-red-100 focus-visible:ring-red-500"
                    type="number"
                    step="0.01"
                    value={form.sss_deduction === 0 ? "" : form.sss_deduction}
                    onChange={(e) =>
                      set("sss_deduction", Number(e.target.value))
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">
                    PhilHealth
                  </label>
                  <Input
                    className="mt-1 border-red-100 focus-visible:ring-red-500"
                    type="number"
                    step="0.01"
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
                    Pag-IBIG
                  </label>
                  <Input
                    className="mt-1 border-red-100 focus-visible:ring-red-500"
                    type="number"
                    step="0.01"
                    value={
                      form.pagibig_deduction === 0 ? "" : form.pagibig_deduction
                    }
                    onChange={(e) =>
                      set("pagibig_deduction", Number(e.target.value))
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-600">
                    Withholding Tax
                  </label>
                  <Input
                    className="mt-1 border-red-100 focus-visible:ring-red-500"
                    type="number"
                    step="0.01"
                    value={form.tax_deduction === 0 ? "" : form.tax_deduction}
                    onChange={(e) =>
                      set("tax_deduction", Number(e.target.value))
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">
                    Loan Deductions
                  </label>
                  <Input
                    className="mt-1 border-red-100 focus-visible:ring-red-500"
                    type="number"
                    step="0.01"
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

            <div className="bg-slate-50 p-5 rounded-xl flex justify-between items-center border border-slate-200 mt-4">
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                  Total Deductions
                </p>
                <p className="text-lg font-bold text-red-600 mt-1">
                  ₱{Number(form.total_deductions || 0).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                  Final Net Pay
                </p>
                <p className="text-3xl font-black text-[#2E6F40] mt-1">
                  ₱{Number(form.net_pay || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 p-5 border-t sticky bottom-0 bg-white z-10">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className="bg-[#2E6F40] hover:bg-[#235330] text-white"
              onClick={save}
              disabled={saving || !form.employee_id || !form.period_id}
            >
              {saving ? "Saving..." : "Save Payslip Record"}
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

  // New State for handling the Preview Modal
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
          `*, employees ( first_name, last_name, departments!employees_department_id_fkey ( name ), positions ( title ) ), payroll_periods ( name )`,
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

  const triggerDelete = (id) => {
    setConfirmConfig({ isOpen: true, idToDelete: id });
  };

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
        message: "Failed to delete the payslip record.",
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
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Payslips</h1>
          <Button
            onClick={() => {
              setEditPayslip(null);
              setShowModal(true);
            }}
            className="bg-[#2E6F40] hover:bg-[#235330] text-white gap-2"
          >
            <Plus className="w-4 h-4" /> New Payslip
          </Button>
        </div>

        <Input
          placeholder="Search by employee name or period..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs bg-white focus-visible:ring-[#2E6F40]"
        />

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#2E6F40]/30 border-t-[#2E6F40] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b">
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
                        className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-center py-12 text-slate-400"
                      >
                        No payslips found.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((p) => (
                      <tr
                        key={p.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm font-medium text-slate-900 whitespace-nowrap">
                          {p.employees
                            ? `${p.employees.first_name} ${p.employees.last_name}`
                            : "Unknown"}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">
                          {p.employees?.departments?.name || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">
                          {p.payroll_periods?.name ||
                            p.period_id?.substring(0, 8)}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-800">
                          ₱{(p.gross_pay || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-red-600">
                          ₱{(p.total_deductions || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-[#2E6F40]">
                          ₱{(p.net_pay || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 flex gap-1">
                          <button
                            onClick={() =>
                              setViewPayrollConfig({
                                isOpen: true,
                                periodId: p.period_id,
                                periodName: p.payroll_periods?.name,
                              })
                            }
                            className="p-1.5 text-slate-400 hover:text-[#2E6F40] hover:bg-[#2E6F40]/10 rounded transition-colors"
                            title="View Master Payroll for this Period"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Open the Preview Modal instead of printing directly */}
                          <button
                            onClick={() => setPreviewPayslip(p)}
                            className="p-1.5 text-slate-400 hover:text-[#2E6F40] hover:bg-[#2E6F40]/10 rounded transition-colors"
                            title="Preview Payslip PDF"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              setEditPayslip(p);
                              setShowModal(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-[#2E6F40] hover:bg-[#2E6F40]/10 rounded transition-colors"
                            title="Edit Individual Payslip"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => triggerDelete(p.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
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

        {/* Modals */}
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
