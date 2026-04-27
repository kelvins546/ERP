import { useAuth } from "@/lib/AuthContext";
import {
  User,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
  Hash,
  Briefcase,
  Calendar,
  Building2,
  IdCard,
  FileText,
} from "lucide-react";

export default function ESSProfile() {
  const { user } = useAuth();

  // --- PERSONAL INFO ---
  const fullName =
    [user?.first_name, user?.middle_name, user?.last_name]
      .filter(Boolean)
      .join(" ") || "Employee Name";
  const employeeId = user?.employee_code || "N/A";
  const email = user?.email || "Not registered";
  const phone = user?.phone || "Not registered";
  const address = user?.address || "No address provided";

  // --- EMERGENCY CONTACT ---
  const emergencyName = user?.emergency_contact_name || "Not specified";
  const emergencyPhone = user?.emergency_contact_phone || "Not specified";

  // --- EMPLOYMENT DETAILS ---
  const position = user?.position_names?.[0] || user?.role || "Employee";
  const department = user?.department_name || "General Department";
  const hireDate = user?.hire_date
    ? new Date(user.hire_date).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Not specified";
  const workLocation = user?.project_site_name || "Main Office / HQ";

  // --- GOVERNMENT IDs ---
  const sss = user?.sss_number || "Not registered";
  const tin = user?.tin_number || "Not registered";
  const philhealth = user?.philhealth_number || "Not registered";
  const pagibig = user?.pagibig_number || "Not registered";

  const initials =
    [user?.first_name?.[0], user?.last_name?.[0]]
      .filter(Boolean)
      .join("")
      .toUpperCase() || "U";

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          My Profile
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          View your personal information, employment details, and government
          IDs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: ID Card Visual & Gov IDs */}
        <div className="lg:col-span-1 space-y-6">
          {/* Virtual ID Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
            <div className="bg-[#2E6F40] h-24 w-full absolute top-0 left-0"></div>
            <div className="px-6 pb-6 pt-12 relative z-10 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-4xl font-bold text-[#2E6F40] border-4 border-white shadow-md mb-4">
                {initials}
              </div>
              <h2 className="text-xl font-bold text-slate-900">{fullName}</h2>
              <p className="text-sm font-bold text-[#2E6F40] mt-1">
                {position}
              </p>
              <p className="text-xs text-slate-500 mt-2 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                {department}
              </p>
            </div>
          </div>

          {/* Government IDs */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2 pb-3 border-b border-slate-100">
              <IdCard className="w-5 h-5 text-[#2E6F40]" /> Government IDs
            </h3>
            <div className="space-y-3">
              <GovIdRow label="SSS Number" value={sss} />
              <GovIdRow label="TIN" value={tin} />
              <GovIdRow label="PhilHealth" value={philhealth} />
              <GovIdRow label="Pag-IBIG" value={pagibig} />
            </div>
          </div>
        </div>

        {/* Right Column: Required Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Personal & Contact Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-[#2E6F40]" /> Personal Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Full Name
                </p>
                <p className="font-semibold text-slate-900">{fullName}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Employee ID
                </p>
                <div className="flex items-center gap-1.5">
                  <Hash className="w-4 h-4 text-slate-400" />
                  <p className="font-semibold text-slate-900">{employeeId}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                  <Mail className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                      Email Address
                    </p>
                    <p
                      className={`font-semibold truncate ${email === "Not registered" ? "text-slate-400 italic" : "text-slate-900"}`}
                      title={email}
                    >
                      {email}
                    </p>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                  <Phone className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                      Phone Number
                    </p>
                    <p
                      className={`font-semibold ${phone === "Not registered" ? "text-slate-400 italic" : "text-slate-900"}`}
                    >
                      {phone}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                <MapPin className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                    Home Address
                  </p>
                  <p
                    className={`font-semibold leading-relaxed ${address === "No address provided" ? "text-slate-400 italic" : "text-slate-900"}`}
                  >
                    {address}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Employment Details */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-[#2E6F40]" /> Employment
              Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 border border-slate-100 rounded-xl flex items-start gap-3">
                <FileText className="w-5 h-5 text-slate-400 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Job Title
                  </p>
                  <p className="font-semibold text-slate-900 mt-0.5">
                    {position}
                  </p>
                </div>
              </div>
              <div className="p-4 border border-slate-100 rounded-xl flex items-start gap-3">
                <Building2 className="w-5 h-5 text-slate-400 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Department
                  </p>
                  <p className="font-semibold text-slate-900 mt-0.5">
                    {department}
                  </p>
                </div>
              </div>
              <div className="p-4 border border-slate-100 rounded-xl flex items-start gap-3">
                <Calendar className="w-5 h-5 text-slate-400 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Date of Hire
                  </p>
                  <p className="font-semibold text-slate-900 mt-0.5">
                    {hireDate}
                  </p>
                </div>
              </div>
              <div className="p-4 border border-slate-100 rounded-xl flex items-start gap-3">
                <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Work Location
                  </p>
                  <p className="font-semibold text-slate-900 mt-0.5">
                    {workLocation}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Emergency Contact */}
          <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-bl-full -z-10"></div>

            <h3 className="text-lg font-bold text-red-700 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> Emergency Contact
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded-xl border border-red-100 shadow-sm">
                <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">
                  Contact Name
                </p>
                <p
                  className={`font-bold text-lg ${emergencyName === "Not specified" ? "text-slate-400 italic" : "text-slate-900"}`}
                >
                  {emergencyName}
                </p>
              </div>
              <div className="p-4 bg-white rounded-xl border border-red-100 shadow-sm flex items-center gap-3">
                <div className="p-2.5 bg-red-50 rounded-lg">
                  <Phone className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-0.5">
                    Contact Number
                  </p>
                  <p
                    className={`font-bold text-lg ${emergencyPhone === "Not specified" ? "text-slate-400 italic" : "text-slate-900"}`}
                  >
                    {emergencyPhone}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 p-3 bg-red-50/50 rounded-lg border border-red-100 flex items-start gap-2 text-sm text-slate-600">
              <InfoIcon />
              <p>
                To update your personal details, government IDs, or emergency
                contact information, please submit a formal request to Human
                Resources via the <strong>Help & Support</strong> tab.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Small UI Helper for Government IDs
function GovIdRow({ label, value }) {
  const isMissing = value === "Not registered";
  return (
    <div className="flex flex-col py-2 border-b border-slate-50 last:border-0">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
        {label}
      </span>
      <span
        className={`font-mono text-sm font-semibold tracking-wider ${isMissing ? "text-slate-300 italic" : "text-slate-700"}`}
      >
        {value}
      </span>
    </div>
  );
}

function InfoIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-slate-400 shrink-0 mt-0.5"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}
