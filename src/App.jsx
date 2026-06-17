import { Link, Navigate, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import GoLive from './pages/GoLive';
import Login from './pages/Login';
import Register from './pages/Register';
import Watch from './pages/Watch';
import './App.css';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h2>Stream</h2>
        <nav>
          <Link to="/register">Register</Link>
          <Link to="/login">Login</Link>
          <Link to="/dashboard">Dashboard</Link>
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/register" replace />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/go-live" element={<GoLive />} />
          <Route path="/watch" element={<Watch />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
