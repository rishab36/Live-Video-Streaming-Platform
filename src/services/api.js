const API_URL = import.meta.env.VITE_API_URL;

async function parseResponse(response) {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export async function fetchHealth() {
  const response = await fetch(`${API_URL}/health`);
  return parseResponse(response);
}

export async function fetchUsers() {
  const response = await fetch(`${API_URL}/users`);
  return parseResponse(response);
}

export async function fetchMySubscriptions(subscriberId) {
  const params = new URLSearchParams({ subscriberId });
  const response = await fetch(`${API_URL}/subscriptions/me?${params}`);
  return parseResponse(response);
}

export async function subscribeToCreator(subscriberId, creatorId) {
  const response = await fetch(`${API_URL}/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ subscriberId, creatorId }),
  });

  return parseResponse(response);
}

export async function unsubscribeFromCreator(subscriberId, creatorId, subscriptionId) {
  const response = await fetch(`${API_URL}/unsubscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ subscriberId, creatorId, subscriptionId }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }
}

export async function fetchLiveStreams() {
  const response = await fetch(`${API_URL}/live`);
  return parseResponse(response);
}

export async function startStream(creatorId) {
  const response = await fetch(`${API_URL}/stream/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ creatorId }),
  });

  return parseResponse(response);
}

export async function endStream(creatorId) {
  const response = await fetch(`${API_URL}/stream/end`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ creatorId }),
  });

  return parseResponse(response);
}

export async function joinStream(viewerId, creatorId) {
  const response = await fetch(`${API_URL}/stream/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ viewerId, creatorId }),
  });

  return parseResponse(response);
}
