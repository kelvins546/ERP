import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import HRISLayout from './components/HRISLayout';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Departments from './pages/Departments';
import Positions from './pages/Positions';
import Announcements from './pages/Announcements';
import Tasks from './pages/Tasks';
import OrgChart from './pages/OrgChart';
import Documents from './pages/Documents';
import JobPostings from './pages/JobPostings';
import Applicants from './pages/Applicants';
import Attendance from './pages/Attendance';
import Leaves from './pages/Leaves';
import Overtime from './pages/Overtime';
import Holidays from './pages/Holidays';
import Schedules from './pages/Schedules';
import Payroll from './pages/Payroll';
import Payslips from './pages/Payslips';
import SalaryProfiles from './pages/SalaryProfiles';
import Allowances from './pages/Allowances';
import Loans from './pages/Loans';
import Evaluations from './pages/Evaluations';
import KPI from './pages/KPI';
import Disciplinary from './pages/Disciplinary';
import Promotions from './pages/Promotions';
import Reports from './pages/Reports';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route element={<HRISLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/employees" element={<Employees />} />
        <Route path="/departments" element={<Departments />} />
        <Route path="/positions" element={<Positions />} />
        <Route path="/announcements" element={<Announcements />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/org-chart" element={<OrgChart />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/job-postings" element={<JobPostings />} />
        <Route path="/applicants" element={<Applicants />} />
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
        <Route path="/reports/:type" element={<Reports />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App