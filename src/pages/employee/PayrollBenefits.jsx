import { useEffect, useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ESSPayrollBenefits() {
  const { user } = useAuth();

  const [payslips, setPayslips] = useState([]);
  const [benefits, setBenefits] = useState([]);
  const [holidays, setHolidays] = useState([]);

  const [loadingPayslips, setLoadingPayslips] = useState(true);
  const [loadingBenefits, setLoadingBenefits] = useState(true);
  const [loadingHolidays, setLoadingHolidays] = useState(true);

  // Get today's date at midnight for accurate past/future comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  useEffect(() => {
    if (!user?.id) return;

    // 1. Fetch Payslips
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
            )
          `,
          )
          .eq("employee_id", user.id)
          .order("created_at", { ascending: false })
          .limit(12);

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

  const handleDownloadPayslip = (payslipId) => {
    alert(
      `Downloading payslip document (ID: ${payslipId}).\n\nDeveloper Note: Connect your PDF generator function here!`,
    );
  };

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
                      onClick={() => handleDownloadPayslip(slip.id)}
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
    </div>
  );
}
