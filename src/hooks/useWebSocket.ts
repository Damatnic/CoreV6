import { useEffect, useRef, useState, useCallback } from 'react';

interface UseWebSocketOptions {
  reconnectAttempts?: number;
  reconnectInterval?: number;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
}

interface UseWebSocketReturn {
  socket: WebSocket | null;
  send: (data: string | ArrayBuffer | Blob) => void;
  isConnected: boolean;
  lastMessage: string | null;
}

export function useWebSocket(
  url: string,
  options: UseWebSocketOptions = {}
): UseWebSocketReturn {
  const {
    reconnectAttempts = 3,
    reconnectInterval = 3000,
    onOpen,
    onClose,
    onError
  } = options;

  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const reconnectCount = useRef(0);
  const reconnectTimeoutId = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        setIsConnected(true);
        setSocket(ws);
        reconnectCount.current = 0;
        onOpen?.();
      };

      ws.onclose = () => {
        setIsConnected(false);
        setSocket(null);
        onClose?.();
        
        // Attempt to reconnect
        if (reconnectCount.current < reconnectAttempts) {
          reconnectCount.current++;
          reconnectTimeoutId.current = setTimeout(connect, reconnectInterval);
        }
      };

      ws.onerror = (error) => {
        onError?.(error);
      };

      ws.onmessage = (event) => {
        setLastMessage(event.data);
      };

    } catch (error) {
      console.error('WebSocket connection error:', error);
    }
  }, [url, reconnectAttempts, reconnectInterval, onOpen, onClose, onError]);

  const send = useCallback((data: string | ArrayBuffer | Blob) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(data);
    }
  }, [socket]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutId.current) {
        clearTimeout(reconnectTimeoutId.current);
      }
      if (socket) {
        socket.close();
      }
    };
  }, [connect]);

  return { socket, send, isConnected, lastMessage };
}