import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  fetchLiveStreams,
  fetchMySubscriptions,
  fetchUsers,
  joinStream,
  startStream,
  subscribeToCreator,
  unsubscribeFromCreator,
} from '../services/api';
import { getAuthErrorMessage } from '../services/auth';
import { useAuth } from '../contexts/AuthContext';

function UserRow({ user, actionLabel, onAction, disabled = false, loading = false, buttonClassName = 'btn-action' }) {
  return (
    <li className="dashboard-row">
      <div className="dashboard-row-info">
        <strong>{user.name}</strong>
      </div>
      <button
        type="button"
        className={buttonClassName}
        onClick={onAction}
        disabled={disabled || loading}
      >
        {loading ? 'Loading...' : actionLabel}
      </button>
    </li>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [liveStreams, setLiveStreams] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [subscribingTo, setSubscribingTo] = useState(null);
  const [unsubscribingFrom, setUnsubscribingFrom] = useState(null);
  const [watchingCreatorId, setWatchingCreatorId] = useState(null);
  const [startingStream, setStartingStream] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const [allUsers, mySubscriptions, activeStreams] = await Promise.all([
          fetchUsers(),
          fetchMySubscriptions(currentUser.$id),
          fetchLiveStreams(),
        ]);

        if (!active) {
          return;
        }

        setUsers(allUsers.filter((entry) => entry.id !== currentUser.$id));
        setSubscriptions(mySubscriptions);
        setLiveStreams(activeStreams);
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

    loadDashboard();

    return () => {
      active = false;
    };
  }, [currentUser]);

  useEffect(() => {
    const intervalId = window.setInterval(async () => {
      try {
        const activeStreams = await fetchLiveStreams();
        setLiveStreams(activeStreams);
      } catch {
        // Keep the current dashboard usable if a background refresh fails.
      }
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, []);

  const usersById = useMemo(
    () => new Map(users.map((user) => [user.id, user])),
    [users],
  );

  const subscribedCreatorIds = useMemo(
    () => new Set(subscriptions.map((subscription) => subscription.creatorId)),
    [subscriptions],
  );

  const subscriptionsByCreatorId = useMemo(
    () => new Map(subscriptions.map((subscription) => [subscription.creatorId, subscription])),
    [subscriptions],
  );

  const subscribedUsers = users.filter((user) => subscribedCreatorIds.has(user.id));
  const channelUsers = users.filter((user) => !subscribedCreatorIds.has(user.id));

  const liveNowStreams = liveStreams.filter((stream) => subscribedCreatorIds.has(stream.creatorId));

  async function handleSubscribe(creatorId) {
    setSubscribingTo(creatorId);
    setError('');
    setSuccess('');

    try {
      const subscription = await subscribeToCreator(currentUser.$id, creatorId);
      setSubscriptions((current) => {
        if (current.some((entry) => entry.creatorId === subscription.creatorId)) {
          return current;
        }
        return [...current, subscription];
      });
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSubscribingTo(null);
    }
  }

  async function handleUnsubscribe(creatorId) {
    setUnsubscribingFrom(creatorId);
    setError('');
    setSuccess('');

    try {
      const subscription = subscriptionsByCreatorId.get(creatorId);
      await unsubscribeFromCreator(currentUser.$id, creatorId, subscription?.id);
      setSubscriptions((current) => current.filter((entry) => entry.creatorId !== creatorId));
      setLiveStreams((current) => current.filter((stream) => stream.creatorId !== creatorId));
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setUnsubscribingFrom(null);
    }
  }

  async function handleGoLive() {
    setStartingStream(true);
    setError('');
    setSuccess('');

    try {
      const response = await startStream(currentUser.$id);
      navigate('/go-live', {
        state: {
          creatorId: response.creatorId,
          roomName: response.roomName,
          livekitUrl: response.livekitUrl,
          token: response.token,
        },
      });
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setStartingStream(false);
    }
  }

  async function handleWatch(creatorId) {
    setWatchingCreatorId(creatorId);
    setError('');
    setSuccess('');

    try {
      const response = await joinStream(currentUser.$id, creatorId);
      const creator = usersById.get(creatorId);

      navigate('/watch', {
        state: {
          creatorName: creator?.name || 'Creator',
          roomName: response.roomName,
          livekitUrl: response.livekitUrl,
          token: response.token,
        },
      });
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setWatchingCreatorId(null);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    setError('');

    try {
      await logout();
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
        <div className="auth-card dashboard-card">
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card dashboard-card">
        <h1>Welcome {currentUser.name || 'User'}</h1>

        {error && <p className="auth-error">{error}</p>}
        {success && <p className="dashboard-success">{success}</p>}

        <section className="dashboard-section">
          <h2>Live Now</h2>
          {liveNowStreams.length === 0 ? (
            <p className="dashboard-empty">No one is live right now.</p>
          ) : (
            <ul className="dashboard-list">
              {liveNowStreams.map((stream) => {
                const creator = usersById.get(stream.creatorId);
                return (
                  <UserRow
                    key={stream.id}
                    user={{ id: stream.creatorId, name: creator?.name || 'Creator' }}
                    actionLabel="Watch"
                    buttonClassName="btn-watch"
                    onAction={() => handleWatch(stream.creatorId)}
                    loading={watchingCreatorId === stream.creatorId}
                  />
                );
              })}
            </ul>
          )}
        </section>

        <section className="dashboard-section">
          <h2>Channels</h2>
          {channelUsers.length === 0 ? (
            <p className="dashboard-empty">No new channels to subscribe to.</p>
          ) : (
            <ul className="dashboard-list">
              {channelUsers.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  actionLabel="Subscribe"
                  onAction={() => handleSubscribe(user.id)}
                  loading={subscribingTo === user.id}
                />
              ))}
            </ul>
          )}
        </section>

        <section className="dashboard-section">
          <h2>Subscribed Channels</h2>
          {subscribedUsers.length === 0 ? (
            <p className="dashboard-empty">You have not subscribed to anyone yet.</p>
          ) : (
            <ul className="dashboard-list">
              {subscribedUsers.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  actionLabel="Unsubscribe"
                  buttonClassName="btn-subscribed"
                  onAction={() => handleUnsubscribe(user.id)}
                  loading={unsubscribingFrom === user.id}
                />
              ))}
            </ul>
          )}
        </section>

        <button
          type="button"
          className="btn-go-live"
          onClick={handleGoLive}
          disabled={startingStream}
        >
          {startingStream ? 'Starting stream...' : 'Go Live'}
        </button>

        <button type="button" onClick={handleLogout} disabled={loggingOut}>
          {loggingOut ? 'Logging out...' : 'Log out'}
        </button>
      </div>
    </div>
  );
}
