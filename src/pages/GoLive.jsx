import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Room, RoomEvent, Track } from 'livekit-client';
import { endStream } from '../services/api';

export default function GoLive() {
  const location = useLocation();
  const navigate = useNavigate();
  const previewRef = useRef(null);
  const roomRef = useRef(null);
  const localVideoRef = useRef(null);
  const [status, setStatus] = useState('Connecting to LiveKit...');
  const [error, setError] = useState('');
  const [ending, setEnding] = useState(false);
  const [hasPreview, setHasPreview] = useState(false);
  const { creatorId, roomName, livekitUrl, token } = location.state || {};

  useEffect(() => {
    if (!creatorId || !roomName || !livekitUrl || !token) {
      return undefined;
    }

    let active = true;
    const room = new Room();
    roomRef.current = room;

    function clearPreview() {
      if (localVideoRef.current) {
        localVideoRef.current.remove();
        localVideoRef.current = null;
      }
      setHasPreview(false);
    }

    function attachLocalCamera() {
      const cameraPublication = room.localParticipant.getTrackPublication(Track.Source.Camera);
      const cameraTrack = cameraPublication?.track;

      if (!cameraTrack || !previewRef.current || localVideoRef.current) {
        return;
      }

      const element = cameraTrack.attach();
      element.muted = true;
      element.autoplay = true;
      element.playsInline = true;
      element.className = 'stream-video';
      previewRef.current.appendChild(element);
      localVideoRef.current = element;
      setHasPreview(true);
    }

    async function connectAndPublish() {
      try {
        room.on(RoomEvent.LocalTrackPublished, attachLocalCamera);
        room.on(RoomEvent.Disconnected, () => {
          if (active) {
            setStatus('Stream ended.');
          }
        });

        await room.connect(livekitUrl, token);
        if (!active) {
          return;
        }

        setStatus('Requesting camera and microphone...');
        await room.localParticipant.enableCameraAndMicrophone();
        if (!active) {
          return;
        }

        attachLocalCamera();
        setStatus(`You are live in ${roomName}`);
      } catch (err) {
        if (active) {
          setError(err.message || 'Could not start the LiveKit stream.');
          setStatus('Unable to go live.');
        }
      }
    }

    connectAndPublish();

    return () => {
      active = false;
      clearPreview();
      room.removeAllListeners();
      room.disconnect(true);
      roomRef.current = null;
    };
  }, [creatorId, livekitUrl, roomName, token]);

  async function handleEndStream() {
    setEnding(true);
    setStatus('Ending stream...');
    setError('');

    try {
      await endStream(creatorId);
      await roomRef.current?.disconnect(true);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Could not end the stream.');
      setStatus('Still live.');
      setEnding(false);
    }
  }

  if (!creatorId || !roomName || !livekitUrl || !token) {
    return (
      <div className="auth-page">
        <div className="auth-card dashboard-card">
          <h1>Go Live</h1>
          <p className="dashboard-empty">No stream token found.</p>
          <p className="auth-footer">
            <Link to="/dashboard">Back to Dashboard</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card stream-card">
        <div className="stream-heading">
          <div>
            <h1>Go Live</h1>
            <p className="auth-subtitle">{status}</p>
          </div>
          <span className="live-pill">Live</span>
        </div>

        {error && <p className="auth-error">{error}</p>}

        <div className="stream-stage">
          <div ref={previewRef} className="stream-media-layer" />
          {!hasPreview && (
            <p className="stream-placeholder">Waiting for camera preview...</p>
          )}
        </div>

        <div className="profile-details">
          <p><strong>Room:</strong> {roomName}</p>
        </div>

        <button
          type="button"
          className="btn-go-live"
          onClick={handleEndStream}
          disabled={ending}
        >
          {ending ? 'Ending stream...' : 'End Stream'}
        </button>
      </div>
    </div>
  );
}
