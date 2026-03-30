import api from '../../api/axiosConfig.js';

const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const streamChatMessage = async ({ message, conversation, signal, onEvent }) => {
  const response = await fetch('/api/chat/stream', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ message, conversation }),
    signal,
  });

  if (!response.ok) {
    let errorMessage = 'Failed to reach the AI assistant.';

    try {
      const payload = await response.json();
      errorMessage = payload.message || payload.error || errorMessage;
    } catch {
      // Keep default error message when the response is not JSON.
    }

    throw new Error(errorMessage);
  }

  if (!response.body) {
    throw new Error('Streaming is not available in this browser.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop() || '';

    for (const rawEvent of events) {
      const lines = rawEvent.split('\n').filter(Boolean);
      const eventName = lines.find((line) => line.startsWith('event:'))?.replace('event:', '').trim();
      const dataLine = lines.find((line) => line.startsWith('data:'))?.replace('data:', '').trim();

      if (!eventName || !dataLine) {
        continue;
      }

      try {
        onEvent?.(eventName, JSON.parse(dataLine));
      } catch {
        // Ignore malformed payloads and continue the stream.
      }
    }
  }
};

export const getChatSamples = () => api.get('/chat/samples');

export const healthcheckChatbot = () => api.get('/health');
