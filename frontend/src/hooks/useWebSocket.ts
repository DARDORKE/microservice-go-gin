import { useState, useEffect, useRef } from 'react';
import { WebSocketMessage } from '../types/poll';
import config from '../config/environment';

export const useWebSocket = (pollId: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!pollId) return;

    const wsUrl = `${config.wsBaseUrl}/ws/polls/${pollId}`;
    console.log('Attempting WebSocket connection to:', wsUrl);
    console.log('Current window.location.host:', window.location.host);
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket connected successfully');
      setIsConnected(true);
    };

    ws.current.onmessage = (event) => {
      console.log('WebSocket message received:', event.data);
      try {
        const message = JSON.parse(event.data);
        setLastMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.current.onclose = (event) => {
      console.log('WebSocket connection closed:', event.code, event.reason);
      setIsConnected(false);
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [pollId]);

  return { isConnected, lastMessage };
};