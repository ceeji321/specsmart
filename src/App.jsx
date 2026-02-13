import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import ComparePage from './pages/ComparePage';
import HistoryPage from './pages/HistoryPage';
import ChatPage from './pages/ChatPage';
import AuthModal from './components/Auth/AuthModal.jsx';


// Mock auth context
export const mockUser = {
  name: 'Alex Mercer',
  username: '@merceralex',
  avatar: null,
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  const handleLogin = () => { setIsLoggedIn(true); setShowAuth(false); };
  const handleLogout = () => setIsLoggedIn(false);

  return (
    <Router>
      {showAuth && (
        <AuthModal
          mode={authMode}
          onClose={() => setShowAuth(false)}
          onLogin={handleLogin}
          onSwitchMode={() => setAuthMode(m => m === 'login' ? 'register' : 'login')}
        />
      )}
      <Routes>
        <Route path="/" element={
          <LandingPage
            isLoggedIn={isLoggedIn}
            onSignIn={() => { setAuthMode('login'); setShowAuth(true); }}
          />
        } />
        <Route path="/dashboard" element={
          isLoggedIn
            ? <Dashboard onLogout={handleLogout} />
            : <Navigate to="/" />
        } />
        <Route path="/compare" element={
          isLoggedIn
            ? <ComparePage onLogout={handleLogout} />
            : <Navigate to="/" />
        } />
        <Route path="/history" element={
          isLoggedIn
            ? <HistoryPage onLogout={handleLogout} />
            : <Navigate to="/" />
        } />
        <Route path="/chat/:id?" element={
          isLoggedIn
            ? <ChatPage onLogout={handleLogout} />
            : <Navigate to="/" />
        } />
      </Routes>
    </Router>
  );
}

export default App;