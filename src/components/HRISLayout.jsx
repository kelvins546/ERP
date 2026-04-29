import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";
import { hasPageAccess } from "@/lib/pageAccess";
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
  Users,
  Building2,
  Briefcase,
  Clock,
  DollarSign,
  BarChart3,
  Star,
  ChevronDown,
  ChevronRight,
  Bell,
  Menu,
  X,
  Home,
  FileText,
  Calendar,
  Award,
  ClipboardList,
  ShoppingCart,
  Package,
  Truck,
  TrendingUp,
  FolderOpen,
  BookOpen,
  LogOut,
} from "lucide-react";
import { Outlet } from "react-router-dom";
import arkLogo from "@/assets/imgs/ark-logo.png";

const navItems = [
  {
    label: "Dashboard",
    icon: Home,
    path: "/",
  },
  {
    label: "Manage",
    icon: Users,
    children: [
      { label: "Employee Masterlist", path: "/employees" },
      { label: "Project Sites", path: "/project-sites" },
      { label: "Departments", path: "/departments" },
      { label: "Positions", path: "/positions" },
      { label: "Employee Tasks", path: "/tasks" },
      { label: "Org Chart", path: "/org-chart" },
      { label: "201 File Management", path: "/documents" },
      { label: "Announcements", path: "/announcements" },
    ],
  },
  {
    label: "Recruitment",
    icon: Briefcase,
    children: [
      { label: "Job Postings", path: "/job-postings" },
      { label: "Applicant Tracking", path: "/applicants" },
      { label: "Interviews", path: "/interviews" },
      { label: "Job Offers", path: "/job-offers" },
    ],
  },
  {
    label: "Time & Attendance",
    icon: Clock,
    children: [
      { label: "Time Logs", path: "/attendance" },
      { label: "Leave Requests", path: "/leaves" },
      { label: "Overtime Requests", path: "/overtime" },
      { label: "Holiday Setup", path: "/holidays" },
      { label: "Schedules", path: "/schedules" },
    ],
  },
  {
    label: "Payroll",
    icon: DollarSign,
    children: [
      { label: "Salary Profiles", path: "/salary-profiles" },
      { label: "Pay Period Attendance", path: "/pay-period-attendance" },
      { label: "Payroll Distribution", path: "/payroll" },

      { label: "Benefits & Deductions", path: "/allowances" },
      { label: "13th Month Pay", path: "/payslips" },
      { label: "Loans", path: "/loans" },
    ],
  },
  {
    label: "Performance",
    icon: Star,
    children: [
      { label: "Evaluations", path: "/evaluations" },
      { label: "KPI Setup", path: "/kpi" },
      { label: "Disciplinary Records", path: "/disciplinary" },
      { label: "Promotion History", path: "/promotions" },
    ],
  },
  {
    label: "HR Reports",
    icon: BarChart3,
    children: [
      { label: "Headcount Report", path: "/reports/headcount" },
      { label: "Leave Balance Report", path: "/reports/leaves" },
      { label: "Payroll Summary", path: "/reports/payroll" },
      { label: "Attrition Report", path: "/reports/attrition" },
    ],
  },
  /* --- COMMENTED OUT MODULES ---
  {
    label: "Procurement",
    icon: ShoppingCart,
    children: [
      { label: "Supplier Management", path: "/procurement/suppliers" },
      { label: "Material Requests", path: "/procurement/material-requests" },
      { label: "RFQ & Canvassing", path: "/procurement/rfq" },
      { label: "Purchase Orders", path: "/procurement/purchase-orders" },
      { label: "Receiving Reports", path: "/procurement/receiving-reports" },
    ],
  },
  {
    label: "Inventory",
    icon: Package,
    children: [
      { label: "Item Masterlist", path: "/inventory/items" },
      { label: "Stock Levels", path: "/inventory/stock-levels" },
      { label: "Stock Movements", path: "/inventory/movements" },
      { label: "Warehouse Mapping", path: "/inventory/warehouses" },
      { label: "Inventory Reports", path: "/inventory/reports" },
    ],
  },
  {
    label: "Logistics",
    icon: Truck,
    children: [
      { label: "Delivery Tracking", path: "/logistics/deliveries" },
      { label: "Vehicle Management", path: "/logistics/vehicles" },
      { label: "Logistics Reports", path: "/logistics/reports" },
    ],
  },
  {
    label: "Sales",
    icon: TrendingUp,
    children: [
      { label: "Client Management", path: "/sales/clients" },
      { label: "Sales Orders", path: "/sales/orders" },
      { label: "Sales Reports", path: "/sales/reports" },
    ],
  },
  {
    label: "Projects",
    icon: FolderOpen,
    children: [
      { label: "Project List", path: "/projects" },
      { label: "Timesheets", path: "/projects/timesheets" },
      { label: "Budget Tracking", path: "/projects/budget" },
      { label: "Project Reports", path: "/projects/reports" },
    ],
  },
  {
    label: "Accounting",
    icon: BookOpen,
    children: [
      { label: "Chart of Accounts", path: "/accounting/chart-of-accounts" },
      { label: "Journal Entries", path: "/accounting/journal-entries" },
      {
        label: "Financial Statements",
        path: "/accounting/financial-statements",
      },
      { label: "Accounts Payable", path: "/accounting/accounts-payable" },
    ],
  },
  -------------------------------- */
];

function NavItem({ item, collapsed, userRole, pageAccess }) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const Icon = item.icon;

  // Check if user is superadmin (has full access)
  const isSuperAdmin = userRole === "superadmin";

  // For single-level items (no children)
  if (!item.children) {
    // Check if user has access to this page
    if (!isSuperAdmin && !hasPageAccess(pageAccess, item.path)) {
      return null; // Don't render if no access
    }

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

  // Filter children based on access
  const accessibleChildren = item.children.filter((child) => {
    return isSuperAdmin || hasPageAccess(pageAccess, child.path);
  });

  // Don't render the section if no children are accessible
  if (accessibleChildren.length === 0) {
    return null;
  }

  const isActive = accessibleChildren.some((c) => location.pathname === c.path);

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
          {accessibleChildren.map((child) => {
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

export default function HRISLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isSuperAdmin = user?.role === "superadmin";
  const rawDisplayName = String(
    user?.account_name ||
      [user?.first_name, user?.last_name].filter(Boolean).join(" "),
  ).trim();
  const looksLikeEmail = String(rawDisplayName || "").includes("@");
  const displayName =
    isSuperAdmin && (!rawDisplayName || looksLikeEmail)
      ? "Superadmin"
      : rawDisplayName || user?.email || "User";
  const displayRole = user?.role || "Employee";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
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

      {/* Sidebar */}
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
                <p className="text-white/70 text-xs mt-0.5"> </p>
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
          {navItems.map((item) => (
            <NavItem
              key={item.label}
              item={item}
              collapsed={collapsed}
              userRole={user?.role}
              pageAccess={user?.page_access}
            />
          ))}
        </nav>

        <div className="p-3 border-t border-white/10">
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
        {/* Top bar */}
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

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>

      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to log out of the ERP system?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>Logout</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
