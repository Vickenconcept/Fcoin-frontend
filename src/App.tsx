import { Navigate, Route, Routes } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import AuthFlow from './components/AuthFlow';
import AdminCoinValuesPage from './components/admin/AdminCoinValuesPage';
import UserProfilePage from './components/profile/UserProfilePage';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsAndConditions from './components/TermsAndConditions';
import DataDeletionInstructions from './components/DataDeletionInstructions';
import { useAuth } from '@/context/AuthContext';

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
      <div className="text-center space-y-2 text-slate-600">
        <span className="block text-sm uppercase tracking-wide text-purple-500">Phanrise</span>
        <p className="text-lg font-medium">Preparing your experience…</p>
      </div>
    </div>
  );
}

function RequireAuth({ children }: { children: any }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}

function RedirectIfAuthenticated({ children }: { children: any }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard/home" replace />;
  }

  return children;
}

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/auth"
          element={
            <RedirectIfAuthenticated>
              <AuthFlow />
            </RedirectIfAuthenticated>
          }
        />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <Navigate to="/dashboard/home" replace />
            </RequireAuth>
          }
        />
        <Route
          path="/dashboard/:section"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/coin-values"
          element={
            <RequireAuth>
              <AdminCoinValuesPage />
            </RequireAuth>
          }
        />
        <Route
          path="/:username"
          element={
            <RequireAuth>
              <UserProfilePage />
            </RequireAuth>
          }
        />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
        <Route path="/data-deletion" element={<DataDeletionInstructions />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
