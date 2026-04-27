import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { supabase } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import arkLogo from "@/assets/imgs/ark-logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Login() {
  const navigate = useNavigate();
  const { login, logout, isAuthenticated, authError, user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [projectSiteId, setProjectSiteId] = useState("");
  const [projectSites, setProjectSites] = useState([]);
  const [loadingSites, setLoadingSites] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  // --- 2FA STATE ---
  const [mfaPending, setMfaPending] = useState(false);
  const [factorId, setFactorId] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaError, setMfaError] = useState("");
  const [verifyingMfa, setVerifyingMfa] = useState(false);

  // --- TRAFFIC COP LOGIC ---
  const routeUser = (currentUser) => {
    if (currentUser?.role === "superadmin") {
      navigate("/", { replace: true });
    } else {
      navigate("/portal", { replace: true });
    }
  };

  // --- RECORD LOGIN HISTORY ---
  const recordLoginHistory = async (userId) => {
    try {
      const ua = navigator.userAgent;
      let device = "Web Browser";
      if (/android/i.test(ua)) device = "Android Device";
      else if (/iphone|ipad|ipod/i.test(ua)) device = "iOS Device";
      else if (/windows/i.test(ua)) device = "Windows PC";
      else if (/mac/i.test(ua)) device = "Mac";

      await supabase.from("employee_login_history").insert([
        {
          employee_id: userId,
          device_info: device,
          ip_address: "Logged via Portal",
          status: "success",
        },
      ]);
    } catch (err) {
      console.error("Failed to log history:", err);
    }
  };

  // --- SECURITY INTERCEPTOR ---
  useEffect(() => {
    let isMounted = true;

    const checkSessionSecurity = async () => {
      if (isAuthenticated && user) {
        try {
          const { data, error } =
            await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
          if (error) throw error;

          if (data?.nextLevel === "aal2" && data?.currentLevel === "aal1") {
            if (isMounted) {
              setMfaPending(true);
              const { data: factors } = await supabase.auth.mfa.listFactors();
              const totpFactor = factors?.totp?.find(
                (f) => f.status === "verified",
              );
              if (totpFactor) setFactorId(totpFactor.id);
            }
          } else {
            if (isMounted) {
              await recordLoginHistory(user.id);
              routeUser(user);
            }
          }
        } catch (err) {
          console.error("MFA Check Error:", err);
          if (isMounted) {
            await recordLoginHistory(user.id);
            routeUser(user);
          }
        }
      }
    };

    if (!mfaPending) {
      checkSessionSecurity();
    }

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user, mfaPending, navigate]);

  useEffect(() => {
    const loadProjectSites = async () => {
      setLoadingSites(true);
      try {
        const { data, error: fetchError } = await supabase
          .from("project_sites")
          .select("id, name, location")
          .order("name", { ascending: true });

        if (fetchError) throw fetchError;
        setProjectSites(data || []);
      } catch (e) {
        console.error("Failed to load project sites:", e.message);
        setProjectSites([]);
      } finally {
        setLoadingSites(false);
      }
    };

    loadProjectSites();
  }, []);

  const selectedProjectSite = useMemo(() => {
    return projectSites.find(
      (site) => String(site.id) === String(projectSiteId),
    );
  }, [projectSites, projectSiteId]);

  const authStateMessage = useMemo(() => {
    if (!authError?.type) return "";
    if (authError.type === "account_deactivated")
      return "Your account is terminated. Please contact HR admin.";
    if (authError.type === "user_not_registered")
      return "No employee record is linked to this account.";
    return "Authentication required. Please sign in.";
  }, [authError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) return setError("Email is required.");
    if (!password.trim()) return setError("Password is required.");
    if (!projectSiteId) return setError("Please select a project site.");

    setSubmitting(true);
    const result = await login({
      email,
      password,
      projectSite: {
        id: selectedProjectSite?.id,
        name: selectedProjectSite?.name,
      },
    });
    setSubmitting(false);

    if (!result.success) {
      setError(result.message || "Failed to log in.");
    }
  };

  const handleVerifyMFA = async (e) => {
    e.preventDefault();
    setMfaError("");
    setVerifyingMfa(true);

    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      if (challenge.error) throw challenge.error;

      const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code: mfaCode,
      });
      if (verify.error) throw verify.error;

      await recordLoginHistory(user.id);
      routeUser(user);
    } catch (err) {
      setMfaError("Invalid 6-digit code. Please try again.");
    } finally {
      setVerifyingMfa(false);
    }
  };

  const handleCancelMFA = async () => {
    if (logout) await logout();
    setMfaPending(false);
    setMfaCode("");
    setFactorId("");
    setError("Login cancelled.");
  };

  return (
    <div className="min-h-screen bg-slate-100 grid lg:grid-cols-2">
      <div className="hidden lg:flex relative overflow-hidden bg-[#2E6F40] p-10">
        <div className="absolute -top-24 -left-10 w-72 h-72 rounded-full bg-white/10" />
        <div className="absolute -bottom-16 right-10 w-64 h-64 rounded-full bg-black/10" />

        <div className="relative z-10 flex flex-col justify-between h-full text-white">
          <div className="flex items-center gap-3">
            <img
              src={arkLogo}
              alt="Ark Industries"
              className="w-12 h-12 bg-white rounded p-1 object-contain"
            />
            <div>
              <p className="text-2xl font-bold leading-tight">Ark Industries</p>
              <p className="text-white/80 text-sm">ERP Management System</p>
            </div>
          </div>

          <div className="space-y-3 max-w-md">
            <p className="text-4xl font-black leading-tight tracking-tight">
              Welcome Back,
            </p>
            <p className="text-white/85 text-base">
              Log in to continue into Ark Industries.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6 lg:hidden">
            <img
              src={arkLogo}
              alt="Ark Industries"
              className="w-10 h-10 bg-[#2E6F40] rounded p-1 object-contain"
            />
            <div>
              <p className="text-lg font-bold text-slate-900 leading-tight">
                Ark Industries
              </p>
              <p className="text-xs text-slate-500">ERP Management System</p>
            </div>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">
              {mfaPending ? "Two-Factor Authentication" : "Login"}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {mfaPending
                ? "Enter your authenticator code."
                : "Use your authorized credentials to continue."}
            </p>
          </div>

          {authStateMessage && !mfaPending && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
              {authStateMessage}
            </div>
          )}

          {error && !mfaPending && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {mfaPending ? (
            <form className="space-y-4" onSubmit={handleVerifyMFA}>
              <div className="text-center mb-6">
                <ShieldCheck className="w-12 h-12 text-[#2E6F40] mx-auto mb-3" />
                <p className="text-sm text-slate-600">
                  Open your authenticator app and enter the 6-digit code to
                  securely log in.
                </p>
              </div>

              {mfaError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 text-center">
                  {mfaError}
                </div>
              )}

              <div className="space-y-1.5">
                <Input
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  value={mfaCode}
                  onChange={(e) =>
                    setMfaCode(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  className="text-center text-3xl tracking-[0.5em] font-mono h-14 focus-visible:ring-[#2E6F40]"
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-[#2E6F40] hover:bg-[#235330] h-12 mt-2"
                disabled={verifyingMfa || mfaCode.length !== 6}
              >
                {verifyingMfa ? "Verifying Identity..." : "Verify & Sign In"}
              </Button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={handleCancelMFA}
                  className="text-sm text-slate-500 hover:text-slate-700 underline"
                >
                  Cancel and go back
                </button>
              </div>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 px-3 text-slate-500 hover:text-slate-700"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Project Site
                </label>
                <Select
                  value={projectSiteId}
                  onValueChange={setProjectSiteId}
                  disabled={loadingSites || projectSites.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        loadingSites
                          ? "Loading project sites..."
                          : projectSites.length
                            ? "Select project site"
                            : "No project sites found"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {projectSites.map((site) => (
                      <SelectItem key={site.id} value={String(site.id)}>
                        {site.name}
                        {site.location ? ` - ${site.location}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#2E6F40] hover:bg-[#265B34]"
                disabled={submitting}
              >
                {submitting ? "Authenticating..." : "Sign In"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
