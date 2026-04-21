import { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { hasPageAccess } from '@/lib/pageAccess';

const AccessDenied = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-slate-50">
    <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
      <div className="text-5xl mb-4">🚫</div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
      <p className="text-slate-600 mb-6">
        You don't have permission to access this page. Your position may not have access to this section.
      </p>
      <a
        href="/"
        className="inline-block px-6 py-2 bg-[#2E6F40] text-white rounded-lg font-medium hover:bg-[#1f4a2a] transition-colors"
      >
        Back to Dashboard
      </a>
    </div>
  </div>
);

const DefaultFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

export default function PageAccessRoute({ fallback = <DefaultFallback /> }) {
  const { isAuthenticated, isLoadingAuth, user, authError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user has access to the current page
  useEffect(() => {
    if (isLoadingAuth) return;

    // Not authenticated - will be handled by App.jsx
    if (!isAuthenticated) return;

    // Superadmin has full access
    if (user?.role === 'super admin') return;

    // Dashboard is always accessible
    if (location.pathname === '/') return;

    // Check if user has page access for other pages
    const hasAccess = hasPageAccess(user?.page_access, location.pathname);

    if (!hasAccess) {
      // Redirect to dashboard after a short delay to show the page briefly
      const timeout = setTimeout(() => {
        navigate('/', { replace: true });
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [isLoadingAuth, isAuthenticated, user, location.pathname, navigate]);

  if (isLoadingAuth) {
    return fallback;
  }

  if (authError) {
    return fallback;
  }

  if (!isAuthenticated) {
    return fallback;
  }

  // Superadmin, dashboard, or user with page access
  if (user?.role === 'super admin' || location.pathname === '/' || hasPageAccess(user?.page_access, location.pathname)) {
    return <Outlet />;
  }

  // No access
  return <AccessDenied />;
}
