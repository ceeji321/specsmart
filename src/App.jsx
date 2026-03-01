// src/App.jsx
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

function PrivateRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return <div style={{ background: '#0a0a0f', height: '100vh' }} />;
  if (!isAuthenticated) return <Navigate to="/" />;
  if (isAdmin) return <Navigate to="/admin" />;
  return children;
}

function AdminRoute({ children }) {
  const { isAuthenticated, isManager, loading } = useAuth();
  if (loading) return <div style={{ background: '#0a0a0f', height: '100vh' }} />;
  if (!isAuthenticated) return <Navigate to="/" />;
  if (!isManager) return <Navigate to="/dashboard" />;
  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return <div style={{ background: '#0a0a0f', height: '100vh' }} />;
  if (!isAuthenticated) return children;
  return isAdmin ? <Navigate to="/admin" /> : <Navigate to="/dashboard" />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <PublicRoute><LandingPage /></PublicRoute>
        } />
        {/* ── Public reset password route (no auth required) ── */}
        <Route path="/reset-password" element={<ResetPasswordPage />} />

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
        <Route path="/admin" element={
          <AdminRoute><AdminPanel /></AdminRoute>
        } />
        <Route path="/admin/archived" element={
          <AdminRoute><ArchiveHistory /></AdminRoute>
        } />
        <Route path="/admin/deleted" element={
          <AdminRoute><DeletedHistory /></AdminRoute>
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;