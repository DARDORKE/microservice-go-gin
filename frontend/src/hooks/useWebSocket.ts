import { useState, useEffect, useRef, useCallback } from 'react';
import { WebSocketMessage } from '../types/poll';
import config from '../config/environment';

export const useWebSocket = (pollId: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connectWebSocket = useCallback(() => {
    if (!pollId) return;

    const wsUrl = `${config.wsBaseUrl}/ws/polls/${pollId}`;
    
    setIsConnecting(true);
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      setIsConnected(true);
      setIsConnecting(false);
      reconnectAttemptsRef.current = 0; // Reset reconnect attempts on successful connection
    };

    ws.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        setLastMessage(message);
      } catch (error) {
        // Error parsing WebSocket message - silently ignore
      }
    };

    ws.current.onclose = (event) => {
      setIsConnected(false);
      setIsConnecting(false);
      
      // Attempt to reconnect if not manually closed and under max attempts
      if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000); // Exponential backoff, max 30s
        
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current++;
          connectWebSocket();
        }, delay);
      }
    };

    ws.current.onerror = () => {
      setIsConnected(false);
      setIsConnecting(false);
    };
  }, [pollId]);

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (ws.current) {
        ws.current.close(1000); // Normal closure
      }
    };
  }, [connectWebSocket]);

  return { isConnected, lastMessage, isConnecting };
};