import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
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
  const { login, isAuthenticated, authError } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [projectSiteId, setProjectSiteId] = useState("");
  const [projectSites, setProjectSites] = useState([]);
  const [loadingSites, setLoadingSites] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

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
    return projectSites.find((site) => String(site.id) === String(projectSiteId));
  }, [projectSites, projectSiteId]);

  const authStateMessage = useMemo(() => {
    if (!authError?.type) return "";
    if (authError.type === "account_deactivated") {
      return "Your account is deactivated. Please contact HR admin.";
    }
    if (authError.type === "user_not_registered") {
      return "No employee record is linked to this account.";
    }
    return "Authentication required. Please sign in.";
  }, [authError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    if (!password.trim()) {
      setError("Password is required.");
      return;
    }

    if (!projectSiteId) {
      setError("Please select a project site.");
      return;
    }

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
      return;
    }

    navigate("/", { replace: true });
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
            <h1 className="text-2xl font-bold text-slate-900">Login</h1>
            <p className="text-sm text-slate-500 mt-1">
              Use your authorized credentials to continue.
            </p>
          </div>

          {authStateMessage ? (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
              {authStateMessage}
            </div>
          ) : null}

          {error ? (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Email</label>
              <Input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Password</label>
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
                  aria-label={showPassword ? "Hide password" : "Show password"}
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
              <label className="text-sm font-medium text-slate-700">Project Site</label>
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
              {submitting ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
