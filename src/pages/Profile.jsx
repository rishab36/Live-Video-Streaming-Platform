import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuthErrorMessage, getCurrentUser, logoutUser } from '../services/auth';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadUser() {
      try {
        const currentUser = await getCurrentUser();
        if (active) {
          setUser(currentUser);
        }
      } catch (err) {
        if (active) {
          setError(getAuthErrorMessage(err));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      active = false;
    };
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    setError('');

    try {
      await logoutUser();
      navigate('/login');
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoggingOut(false);
    }
  }

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Not signed in</h1>
          {error && <p className="auth-error">{error}</p>}
          <p className="auth-footer">
            <Link to="/login">Log in</Link> or <Link to="/register">register</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Welcome, {user.name || 'User'}</h1>
        <p className="auth-subtitle">You are logged in with Appwrite.</p>

        <div className="profile-details">
          <p><strong>Name:</strong> {user.name || 'Not set'}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>User ID:</strong> {user.$id}</p>
        </div>

        {error && <p className="auth-error">{error}</p>}

        <button type="button" onClick={handleLogout} disabled={loggingOut}>
          {loggingOut ? 'Logging out...' : 'Log out'}
        </button>
      </div>
    </div>
  );
}
