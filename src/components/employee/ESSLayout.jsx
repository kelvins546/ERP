import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  LayoutDashboard,
  Clock,
  CalendarDays,
  Banknote,
  Users,
  LifeBuoy,
  Settings,
  ShieldCheck,
  UserCircle,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Bell,
  ArrowLeftRight,
} from "lucide-react";
import arkLogo from "@/assets/imgs/ark-logo.png";

// --- EMPLOYEE ROADMAP NAV ITEMS ---
const essNavItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/portal" },
  { label: "My Attendance", icon: Clock, path: "/portal/attendance" },
  { label: "File Requests", icon: CalendarDays, path: "/portal/requests" },
  {
    label: "Payroll & Benefits",
    icon: Banknote,
    path: "/portal/payroll-benefits",
  },
  { label: "Company Directory", icon: Users, path: "/portal/directory" },
  { label: "Help & Support", icon: LifeBuoy, path: "/portal/support" },
  {
    label: "Settings",
    icon: Settings,
    children: [
      {
        label: "My Profile",
        icon: UserCircle,
        path: "/portal/settings/profile",
      },
      {
        label: "Security & Login",
        icon: ShieldCheck,
        path: "/portal/settings/security",
      },
    ],
  },
];

function ESSNavItem({ item, collapsed }) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const Icon = item.icon;

  if (!item.children) {
    const active = location.pathname === item.path;
    return (
      <Link
        to={item.path}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
          active
            ? "bg-white/20 text-white shadow-sm"
            : "text-white/80 hover:bg-white/10 hover:text-white",
        )}
      >
        <Icon className="w-5 h-5 shrink-0" />
        {!collapsed && <span>{item.label}</span>}
      </Link>
    );
  }

  const isActive = item.children.some((c) => location.pathname === c.path);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
          isActive
            ? "bg-white/15 text-white"
            : "text-white/80 hover:bg-white/10 hover:text-white",
        )}
      >
        <Icon className="w-5 h-5 shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1 text-left">{item.label}</span>
            {open ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </>
        )}
      </button>
      {open && !collapsed && (
        <div className="ml-8 mt-1 space-y-1">
          {item.children.map((child) => {
            const active = location.pathname === child.path;
            return (
              <Link
                key={child.path}
                to={child.path}
                className={cn(
                  "block px-3 py-2 rounded-lg text-sm transition-colors",
                  active
                    ? "bg-white/20 text-white font-medium shadow-sm"
                    : "text-white/70 hover:bg-white/10 hover:text-white",
                )}
              >
                {child.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ESSLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [now, setNow] = useState(() => new Date());

  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Determine if this user is ALSO an Admin (so we can show a switch button)
  const isAlsoAdmin =
    user?.role === "superadmin" ||
    (Array.isArray(user?.page_access) && user?.page_access.length > 0);

  const rawDisplayName = String(
    user?.account_name ||
      [user?.first_name, user?.last_name].filter(Boolean).join(" "),
  ).trim();
  const displayName = rawDisplayName || user?.email || "Employee";
  const displayRole = user?.position_names?.[0] || user?.role || "Employee";

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex h-screen bg-slate-100">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - Matching HRIS Palette */}
      <aside
        className={cn(
          "fixed lg:static z-50 h-full bg-[#2E6F40] transition-all duration-300 flex flex-col shadow-xl",
          collapsed ? "w-16" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <img
                src={arkLogo}
                alt="Ark Logo"
                className="w-9 h-9 bg-white rounded p-1 object-contain shrink-0"
              />
              <div>
                <p className="text-white font-bold text-lg leading-tight">
                  Ark Industries
                </p>
                <p className="text-[#a5d6b4] text-[10px] font-bold uppercase tracking-widest mt-0.5">
                  Employee Portal
                </p>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex text-white/70 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-white/70 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {essNavItems.map((item) => (
            <ESSNavItem key={item.label} item={item} collapsed={collapsed} />
          ))}
        </nav>

        <div className="p-3 border-t border-white/10 space-y-1">
          {/* Switch to Admin Button (Only visible if they have permissions) */}

          <button
            onClick={() => setShowLogoutConfirm(true)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              "text-white/80 hover:bg-white/10 hover:text-white",
            )}
            title="Logout"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar - Profile moved here */}
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden text-slate-600"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-3 ml-auto">
            <div className="hidden sm:flex flex-col items-end leading-tight mr-1">
              <p className="text-sm font-semibold text-slate-900">
                {new Intl.DateTimeFormat(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }).format(now)}
              </p>
              <p className="text-xs text-slate-500">
                {new Intl.DateTimeFormat(undefined, {
                  hour: "numeric",
                  minute: "2-digit",
                  second: "2-digit",
                }).format(now)}
              </p>
            </div>
            <button className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#2E6F40] rounded-full"></span>
            </button>

            {/* Profile Block Matching Admin Format */}
            <div className="hidden sm:flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2E6F40] text-sm font-bold text-white">
                {initials || "U"}
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-slate-900">
                  {displayName}
                </p>
                <p className="text-xs text-slate-500 capitalize">
                  {displayRole}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to end your session?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700"
            >
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
