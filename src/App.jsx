import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import PageNotFound from "./lib/PageNotFound";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import UserNotRegisteredError from "@/components/UserNotRegisteredError";
import PageAccessRoute from "@/components/PageAccessRoute";
import Login from "./pages/Login";
import HRISLayout from "./components/HRISLayout";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Departments from "./pages/Departments";
import Positions from "./pages/Positions";
import ProjectSites from "./pages/ProjectSites";
import Announcements from "./pages/Announcements";
import Tasks from "./pages/Tasks";
import Documents from "./pages/Documents";
import OrgChart from "./pages/OrgChart";
import JobPostings from "./pages/JobPostings";
import Applicants from "./pages/Applicants";
import Interviews from "./pages/Interviews";
import JobOffers from "./pages/JobOffers";
import Attendance from "./pages/Attendance";
import Leaves from "./pages/Leaves";
import Overtime from "./pages/Overtime";
import Holidays from "./pages/Holidays";
import Schedules from "./pages/Schedules";
import Payroll from "./pages/Payroll";
import Payslips from "./pages/Payslips";
import SalaryProfiles from "./pages/SalaryProfiles";
import Allowances from "./pages/Allowances";
import Loans from "./pages/Loans";
import Evaluations from "./pages/Evaluations";
import KPI from "./pages/KPI";
import Disciplinary from "./pages/Disciplinary";
import Promotions from "./pages/Promotions";
import Reports from "./pages/Reports";
import SupplierManagement from "./features/procurement/pages/SupplierManagement";
import MaterialRequests from "./features/procurement/pages/MaterialRequests";
import RFQCanvassing from "./features/procurement/pages/RFQCanvassing";
import PurchaseOrders from "./features/procurement/pages/PurchaseOrders";
import ReceivingReports from "./features/procurement/pages/ReceivingReports";
import ItemMasterlist from "./features/inventory/pages/ItemMasterlist";
import StockLevels from "./features/inventory/pages/StockLevels";
import StockMovements from "./features/inventory/pages/StockMovements";
import WarehouseMapping from "./features/inventory/pages/WarehouseMapping";
import InventoryReports from "./features/inventory/pages/InventoryReports";
import DeliveryTracking from "./features/logistics/pages/DeliveryTracking";
import VehicleManagement from "./features/logistics/pages/VehicleManagement";
import LogisticsReports from "./features/logistics/pages/LogisticsReports";
import ClientManagement from "./features/sales/pages/ClientManagement";
import SalesOrders from "./features/sales/pages/SalesOrders";
import SalesReports from "./features/sales/pages/SalesReports";
import ProjectList from "./features/projects/pages/ProjectList";
import ProjectTimesheets from "./features/projects/pages/ProjectTimesheets";
import ProjectBudget from "./features/projects/pages/ProjectBudget";
import ProjectReports from "./features/projects/pages/ProjectReports";
import ChartOfAccounts from "./features/accounting/pages/ChartOfAccounts";
import JournalEntries from "./features/accounting/pages/JournalEntries";
import FinancialStatements from "./features/accounting/pages/FinancialStatements";
import AccountsPayable from "./features/accounting/pages/AccountsPayable";
import PublicJobView from "./pages/PublicJobView";

const AppContent = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated } =
    useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Detect if the user is on a public page (like a job posting) so we don't block them
  const isPublicRoute = location.pathname.startsWith("/jobs/") || location.pathname === "/login";

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#2E6F40] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If not authenticated and not on a public route, redirect to login
  if (!isAuthenticated && !isPublicRoute) {
    navigate("/login", { replace: true });
    return null;
  }

  // Only show auth errors if they are NOT on a public route
  if (authError && !isPublicRoute) {
    if (authError.type === "user_not_registered") {
      return <UserNotRegisteredError />;
    } else if (authError.type === "account_deactivated") {
      return <UserNotRegisteredError />;
    }
  }

  return (
    <Routes>
      {/* ========================================== */}
      {/* PUBLIC ROUTES (No Sidebar, No Login Needed) */}
      {/* ========================================== */}
      <Route path="/login" element={<Login />} />
      <Route path="/jobs/:id" element={<PublicJobView />} />

      {/* ========================================== */}
      {/* PRIVATE ROUTES (Has Sidebar, Needs Login)    */}
      {/* ========================================== */}
      <Route element={<PageAccessRoute />}>
        <Route element={<HRISLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/departments" element={<Departments />} />
          <Route path="/positions" element={<Positions />} />
          <Route path="/project-sites" element={<ProjectSites />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/org-chart" element={<OrgChart />} />
          <Route path="/job-postings" element={<JobPostings />} />
          <Route path="/applicants" element={<Applicants />} />
          <Route path="/interviews" element={<Interviews />} />
          <Route path="/job-offers" element={<JobOffers />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/leaves" element={<Leaves />} />
          <Route path="/overtime" element={<Overtime />} />
          <Route path="/holidays" element={<Holidays />} />
          <Route path="/schedules" element={<Schedules />} />
          <Route path="/payroll" element={<Payroll />} />
          <Route path="/payslips" element={<Payslips />} />
          <Route path="/salary-profiles" element={<SalaryProfiles />} />
          <Route path="/allowances" element={<Allowances />} />
          <Route path="/loans" element={<Loans />} />
          <Route path="/evaluations" element={<Evaluations />} />
          <Route path="/kpi" element={<KPI />} />
          <Route path="/disciplinary" element={<Disciplinary />} />
          <Route path="/promotions" element={<Promotions />} />

          {/* Support for both the old nested paths and the new query param paths for Reports */}
          <Route path="/reports" element={<Reports />} />
          <Route path="/reports/headcount" element={<Reports />} />
          <Route path="/reports/leaves" element={<Reports />} />
          <Route path="/reports/payroll" element={<Reports />} />
          <Route path="/reports/attrition" element={<Reports />} />

          <Route path="/procurement/suppliers" element={<SupplierManagement />} />
          <Route
            path="/procurement/material-requests"
            element={<MaterialRequests />}
          />
          <Route path="/procurement/rfq" element={<RFQCanvassing />} />
          <Route
            path="/procurement/purchase-orders"
            element={<PurchaseOrders />}
          />
          <Route
            path="/procurement/receiving-reports"
            element={<ReceivingReports />}
          />
          <Route path="/inventory/items" element={<ItemMasterlist />} />
          <Route path="/inventory/stock-levels" element={<StockLevels />} />
          <Route path="/inventory/movements" element={<StockMovements />} />
          <Route path="/inventory/warehouses" element={<WarehouseMapping />} />
          <Route path="/inventory/reports" element={<InventoryReports />} />
          <Route path="/logistics/deliveries" element={<DeliveryTracking />} />
          <Route path="/logistics/vehicles" element={<VehicleManagement />} />
          <Route path="/logistics/reports" element={<LogisticsReports />} />
          <Route path="/sales/clients" element={<ClientManagement />} />
          <Route path="/sales/orders" element={<SalesOrders />} />
          <Route path="/sales/reports" element={<SalesReports />} />
          <Route path="/projects" element={<ProjectList />} />
          <Route path="/projects/timesheets" element={<ProjectTimesheets />} />
          <Route path="/projects/budget" element={<ProjectBudget />} />
          <Route path="/projects/reports" element={<ProjectReports />} />
          <Route
            path="/accounting/chart-of-accounts"
            element={<ChartOfAccounts />}
          />
          <Route
            path="/accounting/journal-entries"
            element={<JournalEntries />}
          />
          <Route
            path="/accounting/financial-statements"
            element={<FinancialStatements />}
          />
          <Route
            path="/accounting/accounts-payable"
            element={<AccountsPayable />}
          />

          <Route path="*" element={<PageNotFound />} />
        </Route>
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AppContent />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
