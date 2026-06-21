import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuthErrorMessage, loginUser, getCurrentUser } from '../services/auth';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await loginUser({ email, password });
      // Get the current user and update auth context
      const user = await getCurrentUser();
      login(user);
      navigate('/dashboard');
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Log in</h1>
        <p className="auth-subtitle">Sign in with your Appwrite account.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="alice@example.com"
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Your password"
            required
          />

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Log in'}
          </button>
        </form>

        <p className="auth-footer">
          Need an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}
