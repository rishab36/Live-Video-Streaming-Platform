import { Link, Navigate, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import GoLive from './pages/GoLive';
import Login from './pages/Login';
import Register from './pages/Register';
import Watch from './pages/Watch';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import './App.css';

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h2>Stream</h2>
        <nav>
          {!isAuthenticated && (
            <>
              <Link to="/register">Register</Link>
              <Link to="/login">Login</Link>
            </>
          )}
          {isAuthenticated && <Link to="/dashboard">Dashboard</Link>}
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
          
          {!isAuthenticated && (
            <>
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
            </>
          )}
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/go-live"
            element={
              <ProtectedRoute>
                <GoLive />
              </ProtectedRoute>
            }
          />
          <Route
            path="/watch"
            element={
              <ProtectedRoute>
                <Watch />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
