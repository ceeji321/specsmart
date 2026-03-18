import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import ComparePage from './pages/ComparePage';
import HistoryPage from './pages/HistoryPage';
import ChatPage from './pages/ChatPage';
import AdminPanel from './pages/AdminPanel';
import ArchiveHistory from './pages/ArchiveHistory';
import DeletedHistory from './pages/DeletedHistory';
import ResetPasswordPage from './pages/ResetPasswordPage';

const LoadingScreen = () => (
  <div style={{ background: '#0a0a0f', height: '100vh' }} />
);

// Regular users only — admins get redirected to /admin
function PrivateRoute({ children }) {
  const { isAuthenticated, isManager, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (isManager) return <Navigate to="/admin" replace />;
  return children;
}

// Admin/manager only — regular users get redirected to /dashboard
function AdminRoute({ children }) {
  const { isAuthenticated, isManager, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (!isManager) return <Navigate to="/dashboard" replace />;
  return children;
}

// Public pages — logged-in users get redirected based on role
function PublicRoute({ children }) {
  const { isAuthenticated, isManager, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return children;
  return isManager ? <Navigate to="/admin" replace /> : <Navigate to="/dashboard" replace />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <PublicRoute><LandingPage /></PublicRoute>
        } />

        {/* Public — no auth required */}
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Regular user routes */}
        <Route path="/dashboard" element={
          <PrivateRoute><Dashboard /></PrivateRoute>
        } />
        <Route path="/compare" element={
          <PrivateRoute><ComparePage /></PrivateRoute>
        } />
        <Route path="/history" element={
          <PrivateRoute><HistoryPage /></PrivateRoute>
        } />
        <Route path="/chat/:id?" element={
          <PrivateRoute><ChatPage /></PrivateRoute>
        } />

        {/* Admin/manager routes */}
        <Route path="/admin" element={
          <AdminRoute><AdminPanel /></AdminRoute>
        } />
        <Route path="/admin/archived" element={
          <AdminRoute><ArchiveHistory /></AdminRoute>
        } />
        <Route path="/admin/deleted" element={
          <AdminRoute><DeletedHistory /></AdminRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
