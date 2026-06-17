import { useEffect, useRef, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Room, RoomEvent, Track } from 'livekit-client';

export default function Watch() {
  const location = useLocation();
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const attachedTrackIds = useRef(new Set());
  const [status, setStatus] = useState('Connecting to LiveKit...');
  const [error, setError] = useState('');
  const [hasVideo, setHasVideo] = useState(false);
  const [isLive, setIsLive] = useState(true);
  const { creatorName, roomName, livekitUrl, token } = location.state || {};

  useEffect(() => {
    if (!roomName || !livekitUrl || !token) {
      return undefined;
    }

    let active = true;
    const room = new Room();
    const attachedIds = attachedTrackIds.current;
    const videoContainer = videoRef.current;
    const audioContainer = audioRef.current;

    function attachTrack(track) {
      const trackId = track.sid || track.mediaStreamTrack.id;
      if (attachedIds.has(trackId)) {
        return;
      }

      const element = track.attach();
      element.autoplay = true;
      element.playsInline = true;

      if (track.kind === Track.Kind.Video) {
        element.className = 'stream-video';
        videoContainer?.appendChild(element);
        setHasVideo(true);
      } else if (track.kind === Track.Kind.Audio) {
        audioContainer?.appendChild(element);
      }

      attachedIds.add(trackId);
    }

    function detachTrack(track) {
      const trackId = track.sid || track.mediaStreamTrack.id;
      track.detach().forEach((element) => element.remove());
      attachedIds.delete(trackId);
      const stillHasVideo = videoContainer?.querySelector('video') !== null;
      setHasVideo(stillHasVideo);

      if (!stillHasVideo) {
        setIsLive(false);
        setStatus('Stream ended.');
      }
    }

    function attachExistingTracks() {
      room.remoteParticipants.forEach((participant) => {
        participant.trackPublications.forEach((publication) => {
          if (publication.track) {
            attachTrack(publication.track);
          }
        });
      });
    }

    async function connectToRoom() {
      try {
        room.on(RoomEvent.TrackSubscribed, attachTrack);
        room.on(RoomEvent.TrackUnsubscribed, detachTrack);
        room.on(RoomEvent.ParticipantDisconnected, () => {
          setIsLive(false);
          setHasVideo(false);
          setStatus('Stream ended.');
        });
        room.on(RoomEvent.Disconnected, () => {
          if (active) {
            setStatus('Disconnected from stream.');
          }
        });

        await room.connect(livekitUrl, token);
        if (!active) {
          return;
        }

        attachExistingTracks();
        setIsLive(true);
        setStatus(`Connected to ${roomName}`);
      } catch (err) {
        if (active) {
          setError(err.message || 'Could not connect to this stream.');
          setStatus('Unable to connect.');
        }
      }
    }

    connectToRoom();

    return () => {
      active = false;
      room.removeAllListeners();
      room.disconnect();
      attachedIds.clear();
      videoContainer?.replaceChildren();
      audioContainer?.replaceChildren();
    };
  }, [livekitUrl, roomName, token]);

  if (!roomName || !livekitUrl || !token) {
    return (
      <div className="auth-page">
        <div className="auth-card dashboard-card">
          <h1>Watch</h1>
          <p className="dashboard-empty">No stream selected.</p>
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
            <h1>Watching {creatorName || 'stream'}</h1>
            <p className="auth-subtitle">{status}</p>
          </div>
          {isLive && <span className="live-pill">Live</span>}
        </div>

        {error && <p className="auth-error">{error}</p>}

        <div className="stream-stage">
          <div ref={videoRef} className="stream-media-layer" />
          {!hasVideo && (
            <p className="stream-placeholder">Waiting for video...</p>
          )}
        </div>
        <div ref={audioRef} className="stream-audio" />

        <p className="auth-footer">
          <Link to="/dashboard">Back to Dashboard</Link>
        </p>
      </div>
    </div>
  );
}
