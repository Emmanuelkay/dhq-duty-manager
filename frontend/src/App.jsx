import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import Navbar from './components/Navbar';
import Passes from './pages/Passes';
import Leaves from './pages/Leaves';

import ChangePassword from './pages/ChangePassword';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="container">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.requires_password_change) return <ChangePassword />;
  if (adminOnly && user.role !== 'Admin') return <Navigate to="/" replace />;

  return (
    <>
      <Navbar />
      {children}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{
        style: {
          background: 'var(--color-bg-surface)',
          color: 'var(--color-text-main)',
          border: '1px solid var(--color-border-glass)',
          borderRadius: 'var(--radius-sharp)',
          fontSize: '0.85rem'
        }
      }} />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly={true}>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/passes"
            element={
              <ProtectedRoute>
                <Passes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leaves"
            element={
              <ProtectedRoute>
                <Leaves />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
