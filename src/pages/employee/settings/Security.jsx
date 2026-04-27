import { useEffect, useState } from "react";
import { supabase } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import {
  Key,
  ShieldCheck,
  Clock,
  Bell,
  Smartphone,
  Monitor,
  CheckCircle2,
  Eye,
  EyeOff,
  AlertTriangle,
  X,
  ShieldAlert,
  MapPin,
  Lock,
  Shield,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ESSSecurity() {
  const { user } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({
    type: "",
    text: "",
  });

  const [loginHistory, setLoginHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [notifications, setNotifications] = useState({
    payslip_alerts: true,
    announcement_alerts: true,
    security_alerts: true,
  });

  const [has2FA, setHas2FA] = useState(false);
  const [mfaSetupStep, setMfaSetupStep] = useState("idle");
  const [factorId, setFactorId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [secretCode, setSecretCode] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [mfaError, setMfaError] = useState("");
  const [copied, setCopied] = useState(false);

  const rules = {
    length: newPassword.length >= 8,
    upper: /[A-Z]/.test(newPassword),
    lower: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[^A-Za-z0-9]/.test(newPassword),
  };
  const strengthScore = Object.values(rules).filter(Boolean).length;
  const isPasswordStrong = strengthScore === 5;
  const passwordsMatch = newPassword === confirmPassword && newPassword !== "";

  useEffect(() => {
    if (!user?.id) return;
    const fetchSecurityData = async () => {
      const { data: prefs } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("employee_id", user.id)
        .single();
      if (prefs) setNotifications(prefs);

      setLoadingHistory(true);
      const { data: history } = await supabase
        .from("employee_login_history")
        .select("*")
        .eq("employee_id", user.id)
        .order("login_timestamp", { ascending: false })
        .limit(5);
      if (history) setLoginHistory(history);
      setLoadingHistory(false);

      const { data: factors } = await supabase.auth.mfa.listFactors();
      const verifiedFactor = factors?.totp?.find(
        (f) => f.status === "verified",
      );
      if (verifiedFactor) {
        setHas2FA(true);
        setFactorId(verifiedFactor.id);
      }
    };
    fetchSecurityData();
  }, [user]);

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      setPasswordMessage({
        type: "success",
        text: "Your password has been changed successfully.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setPasswordMessage({ type: "error", text: error.message });
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleNotif = async (key) => {
    const newValue = !notifications[key];
    setNotifications((prev) => ({ ...prev, [key]: newValue }));
    await supabase
      .from("notification_preferences")
      .upsert(
        { employee_id: user.id, [key]: newValue },
        { onConflict: "employee_id" },
      );
  };

  const start2FASetup = async () => {
    setMfaError("");
    setMfaSetupStep("enrolling");

    try {
      // 1. THE FIX: Dig into the '.all' array to find the hidden ghost attempts!
      const { data: existingFactors } = await supabase.auth.mfa.listFactors();
      const unverifiedFactors =
        existingFactors?.all?.filter((f) => f.status === "unverified") || [];

      // Wipe the ghosts from the database
      for (const factor of unverifiedFactors) {
        await supabase.auth.mfa.unenroll({ factorId: factor.id });
      }

      // 2. Create the fresh, new factor safely
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        issuer: "Ark Industries",
        friendlyName: `Authenticator-${Date.now()}`,
      });

      if (error) throw error;

      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecretCode(data.totp.secret);
      setMfaSetupStep("verifying");
    } catch (error) {
      console.error("MFA Error:", error);
      setMfaError(error.message);
      setMfaSetupStep("idle");
    }
  };

  const verifyAndEnable = async () => {
    setMfaError("");
    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code: verifyCode,
      });
      if (verify.error) throw verify.error;
      setHas2FA(true);
      setMfaSetupStep("success_enable");
      setVerifyCode("");
    } catch (error) {
      setMfaError("Invalid code. Please check your app.");
    }
  };

  const verifyAndDisable = async () => {
    setMfaError("");
    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code: verifyCode,
      });
      if (verify.error) throw verify.error;
      const { error: unenrollError } = await supabase.auth.mfa.unenroll({
        factorId,
      });
      if (unenrollError) throw unenrollError;
      setHas2FA(false);
      setFactorId("");
      setMfaSetupStep("success_disable");
      setVerifyCode("");
    } catch (error) {
      setMfaError("Verification failed. 2FA remains active.");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(secretCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Shield className="w-6 h-6 text-[#2E6F40]" /> Account Security
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          Protect your account with a strong password and multi-factor
          authentication.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Password (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Lock className="w-5 h-5 text-[#2E6F40]" /> Update Password
              </h3>
            </div>

            <div className="p-6">
              {passwordMessage.text && (
                <div
                  className={`mb-6 p-4 rounded-xl text-sm flex items-start gap-3 border ${passwordMessage.type === "error" ? "bg-red-50 text-red-700 border-red-200" : "bg-green-50 text-green-700 border-green-200"}`}
                >
                  {passwordMessage.type === "error" ? (
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                  )}
                  <p className="font-medium">{passwordMessage.text}</p>
                </div>
              )}

              <form onSubmit={handlePasswordUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        Current Password
                      </label>
                      <div className="relative">
                        <Input
                          type={showCurrent ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          required
                          className="pr-10 h-11 focus-visible:ring-[#2E6F40]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrent(!showCurrent)}
                          className="absolute right-3 top-3 text-slate-400"
                        >
                          {showCurrent ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        New Password
                      </label>
                      <div className="relative">
                        <Input
                          type={showNew ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          className="pr-10 h-11 focus-visible:ring-[#2E6F40]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNew(!showNew)}
                          className="absolute right-3 top-3 text-slate-400"
                        >
                          {showNew ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Input
                          type={showConfirm ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          className={`pr-10 h-11 focus-visible:ring-[#2E6F40] ${confirmPassword && !passwordsMatch ? "border-red-400" : ""}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute right-3 top-3 text-slate-400"
                        >
                          {showConfirm ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      {confirmPassword && !passwordsMatch && (
                        <p className="text-[10px] text-red-500 font-bold uppercase mt-1">
                          Passwords do not match
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                    <p className="text-xs font-bold text-slate-600 uppercase">
                      Password Requirements
                    </p>
                    <div className="space-y-2">
                      <Requirement
                        met={rules.length}
                        text="8+ Characters Minimum"
                      />
                      <Requirement
                        met={rules.upper}
                        text="At least one Uppercase"
                      />
                      <Requirement
                        met={rules.lower}
                        text="At least one Lowercase"
                      />
                      <Requirement
                        met={rules.number}
                        text="Contains a Number"
                      />
                      <Requirement
                        met={rules.special}
                        text="Contains a Symbol (@#$%^&)"
                      />
                    </div>

                    <div className="pt-2">
                      <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${strengthScore < 3 ? "bg-red-500" : strengthScore < 5 ? "bg-amber-500" : "bg-[#2E6F40]"}`}
                          style={{ width: `${(strengthScore / 5) * 100}%` }}
                        />
                      </div>
                      <p className="text-[10px] mt-2 font-bold text-slate-400 uppercase tracking-wider">
                        Strength:{" "}
                        {strengthScore < 3
                          ? "Weak"
                          : strengthScore < 5
                            ? "Fair"
                            : "Secure"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <Button
                    type="submit"
                    disabled={
                      isUpdating || !isPasswordStrong || !passwordsMatch
                    }
                    className="bg-[#2E6F40] hover:bg-[#235330] px-8 h-11 font-bold"
                  >
                    {isUpdating ? "Saving Changes..." : "Update Password"}
                  </Button>
                </div>
              </form>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-4">
              <ShieldCheck className="w-5 h-5 text-[#2E6F40]" /> Multi-Factor
              Auth
            </h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">Authenticator App</p>
                <p className="text-sm text-slate-500">
                  Add an extra layer of security
                </p>
              </div>
              {has2FA ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setMfaError("");
                    setMfaSetupStep("disabling");
                  }}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  Disable 2FA
                </Button>
              ) : (
                <Button
                  onClick={start2FASetup}
                  disabled={mfaSetupStep === "enrolling"}
                  className="bg-[#2E6F40] text-white"
                >
                  {mfaSetupStep === "enrolling" ? "Loading..." : "Enable 2FA"}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-4">
              <Bell className="w-5 h-5 text-[#2E6F40]" /> Alerts
            </h3>
            <div className="space-y-1">
              <NotifRow
                label="Payslip Availability"
                desc="When payroll is ready"
                active={notifications.payslip_alerts}
                onToggle={() => toggleNotif("payslip_alerts")}
              />
              <NotifRow
                label="Company News"
                desc="Important announcements"
                active={notifications.announcement_alerts}
                onToggle={() => toggleNotif("announcement_alerts")}
              />
              <NotifRow
                label="Security Warnings"
                desc="New logins or changes"
                active={notifications.security_alerts}
                onToggle={() => toggleNotif("security_alerts")}
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-4">
              <Clock className="w-5 h-5 text-[#2E6F40]" /> Login History
            </h3>
            <div className="space-y-4">
              {loadingHistory ? (
                <div className="flex justify-center py-6">
                  <div className="w-6 h-6 border-2 border-[#2E6F40] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : loginHistory.length === 0 ? (
                <p className="text-center text-slate-400 text-sm py-4">
                  No recent logs.
                </p>
              ) : (
                loginHistory.map((log, idx) => (
                  <div
                    key={log.id}
                    className={`flex items-start gap-3 pb-3 ${idx !== loginHistory.length - 1 ? "border-b border-slate-100" : ""}`}
                  >
                    <div className="p-2 bg-slate-50 rounded-lg shrink-0 mt-1">
                      {log.device_info?.toLowerCase().includes("mobile") ||
                      log.device_info?.toLowerCase().includes("ios") ||
                      log.device_info?.toLowerCase().includes("android") ? (
                        <Smartphone className="w-4 h-4 text-slate-500" />
                      ) : (
                        <Monitor className="w-4 h-4 text-slate-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-slate-900 truncate">
                          {log.device_info || "Web Browser"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{log.ip_address}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 uppercase font-medium">
                        {new Date(log.login_timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- MFA MODALS --- */}
      {mfaSetupStep !== "idle" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Headers for Setup and Disabling (Hidden during Success screens) */}
            {mfaSetupStep !== "success_enable" &&
              mfaSetupStep !== "success_disable" && (
                <div className="flex items-center justify-between p-5 border-b bg-slate-50">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#2E6F40]" />
                    {mfaSetupStep === "enrolling"
                      ? "Generating Security Key"
                      : mfaSetupStep === "verifying"
                        ? "Set Up Authenticator"
                        : "Authorize Removal"}
                  </h2>
                  <button
                    onClick={() => setMfaSetupStep("idle")}
                    className="p-1 rounded-md text-slate-400 hover:bg-slate-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}

            <div className="p-6">
              {mfaError && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {mfaError}
                </div>
              )}

              {/* Loading State for Enrollment */}
              {mfaSetupStep === "enrolling" && (
                <div className="flex flex-col items-center justify-center py-10 space-y-4 text-center">
                  <div className="w-10 h-10 border-4 border-[#2E6F40]/30 border-t-[#2E6F40] rounded-full animate-spin"></div>
                  <p className="text-sm font-medium text-slate-600">
                    Generating your secure QR code...
                  </p>
                  <p className="text-xs text-slate-400">
                    Please do not close this window.
                  </p>
                </div>
              )}

              {mfaSetupStep === "verifying" && (
                <div className="space-y-5 text-center">
                  <p className="text-sm text-slate-600">
                    Scan this QR code with Google Authenticator or Authy:
                  </p>
                  <div className="bg-white p-3 rounded-xl border-2 border-dashed border-slate-200 inline-block mx-auto">
                    <img
                      src={qrCode}
                      alt="2FA QR Code"
                      className="w-40 h-40 mx-auto"
                    />
                  </div>
                  <div className="text-left mt-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Can't scan? Use this setup key:
                    </label>
                    <div className="flex items-center justify-between mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                      <code className="text-sm font-mono font-bold text-slate-800 tracking-widest pl-2">
                        {secretCode}
                      </code>
                      <button
                        onClick={copyToClipboard}
                        className="p-1.5 bg-white border border-slate-200 rounded-md text-slate-500 hover:text-[#2E6F40] hover:border-[#2E6F40] transition-colors shadow-sm"
                        title="Copy Code"
                      >
                        {copied ? (
                          <CheckCircle2 className="w-4 h-4 text-[#2E6F40]" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="pt-5 border-t border-slate-100 text-left">
                    <label className="text-xs font-bold text-slate-700 uppercase">
                      Enter 6-digit Code
                    </label>
                    <Input
                      type="text"
                      maxLength={6}
                      placeholder="000000"
                      value={verifyCode}
                      onChange={(e) =>
                        setVerifyCode(e.target.value.replace(/\D/g, ""))
                      }
                      className="mt-2 text-center text-2xl tracking-[0.5em] font-mono h-12 focus-visible:ring-[#2E6F40]"
                    />
                    <Button
                      onClick={verifyAndEnable}
                      disabled={verifyCode.length !== 6}
                      className="w-full mt-4 bg-[#2E6F40] text-white hover:bg-[#235330]"
                    >
                      Verify & Enable 2FA
                    </Button>
                  </div>
                </div>
              )}

              {mfaSetupStep === "disabling" && (
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 rounded-xl flex gap-3 text-amber-800 border border-amber-200">
                    <ShieldAlert className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-medium">
                      To disable Two-Factor Authentication, you must enter a
                      valid code from your app first.
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase">
                      Security Code
                    </label>
                    <Input
                      type="text"
                      maxLength={6}
                      placeholder="000000"
                      value={verifyCode}
                      onChange={(e) =>
                        setVerifyCode(e.target.value.replace(/\D/g, ""))
                      }
                      className="mt-2 text-center text-2xl tracking-[0.5em] font-mono h-12 focus-visible:ring-red-600"
                    />
                    <Button
                      onClick={verifyAndDisable}
                      disabled={verifyCode.length !== 6}
                      className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white"
                    >
                      Verify and Remove 2FA
                    </Button>
                  </div>
                </div>
              )}

              {/* SUCCESS MODAL: ENABLING */}
              {mfaSetupStep === "success_enable" && (
                <div className="text-center py-6">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">
                    2FA Enabled!
                  </h3>
                  <p className="text-sm text-slate-500 mb-8">
                    Your account is now secured with a second layer of
                    protection.
                  </p>
                  <Button
                    onClick={() => setMfaSetupStep("idle")}
                    className="w-full bg-[#2E6F40] hover:bg-[#235330] h-12 text-lg"
                  >
                    Awesome
                  </Button>
                </div>
              )}

              {/* SUCCESS MODAL: DISABLING */}
              {mfaSetupStep === "success_disable" && (
                <div className="text-center py-6">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Shield className="w-10 h-10 text-slate-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">
                    2FA Removed
                  </h3>
                  <p className="text-sm text-slate-500 mb-8">
                    Multi-Factor Authentication has been successfully disabled
                    for your account.
                  </p>
                  <Button
                    onClick={() => setMfaSetupStep("idle")}
                    className="w-full bg-slate-800 hover:bg-slate-900 h-12 text-lg"
                  >
                    Close
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NotifRow({ label, desc, active, onToggle }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <div className="pr-4">
        <p className="text-sm font-bold text-slate-900">{label}</p>
        <p className="text-[10px] text-slate-500">{desc}</p>
      </div>
      <button
        onClick={onToggle}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors ${active ? "bg-[#2E6F40]" : "bg-slate-300"}`}
      >
        <span
          className={`h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ${active ? "translate-x-4" : "translate-x-1"}`}
        />
      </button>
    </div>
  );
}

function Requirement({ met, text }) {
  return (
    <div
      className={`flex items-center gap-2 text-xs font-semibold ${met ? "text-[#2E6F40]" : "text-slate-400"}`}
    >
      {met ? (
        <CheckCircle2 className="w-4 h-4 shrink-0" />
      ) : (
        <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />
      )}
      <span>{text}</span>
    </div>
  );
}
