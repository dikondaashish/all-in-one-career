import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from './useNotifications';
import { auth } from '@/lib/firebase';

export function useRealtimeNotifications() {
  const { isGuest } = useAuth();
  const { refresh } = useNotifications();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 3;
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'polling'>('polling');
  const API_URL = process.env.NODE_ENV === 'production' 
    ? 'https://all-in-one-career-api.onrender.com' 
    : 'http://localhost:4000';

  // Connect to WebSocket
  const connectWebSocket = useCallback(async () => {
    if (isGuest) return;

    // Get current Firebase user and ID token
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log('No Firebase user, skipping WebSocket connection');
      return;
    }

    try {
      const firebaseToken = await currentUser.getIdToken();
      // Convert HTTP/HTTPS to WS/WSS for WebSocket connections
      const wsUrl = API_URL.replace(/^https?:\/\//, (match) => 
        match === 'https://' ? 'wss://' : 'ws://'
      );
      const ws = new WebSocket(`${wsUrl}?token=${firebaseToken}`);
    
      // Add connection timeout
      const connectionTimeout = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          console.log('WebSocket connection timeout, closing connection');
          ws.close();
        }
      }, 10000); // 10 second timeout

    ws.onopen = () => {
      console.log('🔌 WebSocket connected');
      clearTimeout(connectionTimeout); // Clear connection timeout
      setConnectionStatus('connected');
      reconnectAttemptsRef.current = 0;
      
      // Clear any polling intervals
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'connection') {
          console.log('WebSocket connection confirmed:', message.status);
        } else if (message.type === 'notification') {
          console.log('📨 Real-time notification received:', message.data);
          
          // Refresh notifications list to show new notification in UI
          refresh();
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onclose = (event) => {
      console.log('🔌 WebSocket disconnected:', event.code, event.reason);
      clearTimeout(connectionTimeout); // Clear connection timeout
      setConnectionStatus('disconnected');
      
      // Attempt to reconnect if not a clean close
      if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
        setConnectionStatus('reconnecting');
        reconnectAttemptsRef.current++;
        
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log(`🔌 Attempting WebSocket reconnect ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`);
          connectWebSocket();
        }, 2000 * reconnectAttemptsRef.current); // Exponential backoff
      } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
        console.log('🔌 Max reconnection attempts reached, falling back to polling');
        setConnectionStatus('polling');
        startPolling();
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      console.log('WebSocket connection details:', {
        url: wsUrl,
        readyState: ws.readyState,
        firebaseUser: currentUser?.uid ? 'present' : 'missing'
      });
      setConnectionStatus('disconnected');
    };

    wsRef.current = ws;
    
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionStatus('disconnected');
    }
  }, [isGuest, API_URL, refresh]);

  // Start polling fallback
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) return;
    
    console.log('🔄 Starting notification polling (15s interval)');
    pollingIntervalRef.current = setInterval(() => {
      refresh();
    }, 15000);
  }, [refresh]);

  // Disconnect WebSocket
  const disconnectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'User logout');
      wsRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    setConnectionStatus('disconnected');
  }, []);

  // Initialize connection
  useEffect(() => {
    if (isGuest) return;

    // Connect to WebSocket (handle async)
    const initConnection = async () => {
      await connectWebSocket();
    };
    initConnection();

    return () => {
      disconnectWebSocket();
    };
  }, [isGuest, connectWebSocket, disconnectWebSocket]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectWebSocket();
    };
  }, [disconnectWebSocket]);

  return {
    connectionStatus,
    connectWebSocket,
    disconnectWebSocket
  };
}
