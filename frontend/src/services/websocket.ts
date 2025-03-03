import { WebSocketMessage } from '../types';

class WebSocketService {
  private socket: WebSocket | null = null;
  private listeners: Map<string, Function[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private pongTimeout: NodeJS.Timeout | null = null;

  connect(): WebSocket | null {
    if (this.socket?.readyState === WebSocket.OPEN) {
      console.log('[WebSocket] Already connected');
      return this.socket;
    }

    // Clear any existing socket and intervals
    this.cleanup();

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('[WebSocket] No authentication token found');
        return null;
      }

      // Validate token format
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
          console.error('[WebSocket] Invalid token format');
          return null;
        }
        const payload = JSON.parse(atob(tokenParts[1]));
        console.log('[WebSocket] Token validation:', {
          exp: new Date(payload.exp * 1000),
          isExpired: payload.exp * 1000 < Date.now(),
          userId: payload.user_id
        });
      } catch (e) {
        console.error('[WebSocket] Token parse error:', e);
        return null;
      }

      const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8085/api/ws';
      console.log('[WebSocket] Connecting with auth:', {
        url: wsUrl,
        tokenPrefix: token.substring(0, 20) + '...'
      });
      
      this.socket = new WebSocket(`${wsUrl}?token=${token}`);

      this.socket.onopen = () => {
        console.log('[WebSocket] Connection established');
        this.reconnectAttempts = 0;
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = null;
        }
        this.setupHeartbeat();
      };

      this.socket.onmessage = (event) => {
        try {
          if (event.data === 'pong') {
            console.log('[WebSocket] Received pong');
            this.handlePong();
            return;
          }

          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('[WebSocket] Received message:', {
            type: message.type,
            dataPreview: JSON.stringify(message.data).substring(0, 100)
          });
          this.notifyListeners(message.type, message.data);
        } catch (error) {
          console.error('[WebSocket] Message parse error:', error);
        }
      };

      this.socket.onerror = (error) => {
        console.error('[WebSocket] Connection error:', {
          readyState: this.socket?.readyState,
          url: this.socket?.url,
          error
        });
      };

      this.socket.onclose = (event) => {
        console.log('[WebSocket] Connection closed:', {
          code: event.code,
          reason: event.reason || 'No reason provided',
          wasClean: event.wasClean,
          readyState: this.socket?.readyState
        });
        this.clearHeartbeat();
        
        if (event.code !== 1000 && event.code !== 1001) {
          this.handleReconnect();
        }
      };

      return this.socket;
    } catch (error) {
      console.error('[WebSocket] Setup error:', error);
      this.handleReconnect();
      return null;
    }
  }

  private setupHeartbeat() {
    this.clearHeartbeat();

    // Send ping every 30 seconds
    this.pingInterval = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.socket.send('ping');
        
        // Set pong timeout
        this.pongTimeout = setTimeout(() => {
          console.log('Pong timeout - closing connection');
          if (this.socket) {
            this.socket.close();
          }
        }, 5000); // Wait 5 seconds for pong
      }
    }, 30000);
  }

  private handlePong() {
    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
      this.pongTimeout = null;
    }
  }

  private clearHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
      this.pongTimeout = null;
    }
  }

  private handleReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      this.reconnectTimeout = setTimeout(() => {
        this.cleanup();
        this.connect();
      }, 2000 * this.reconnectAttempts); // Exponential backoff
    } else {
      console.error('Max reconnection attempts reached');
      this.cleanup();
    }
  }

  private cleanup() {
    this.clearHeartbeat();
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    this.listeners.clear();
    this.reconnectAttempts = 0;
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  off(event: string, callback: Function) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index !== -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  send(message: WebSocketMessage) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  disconnect() {
    this.cleanup();
  }

  private notifyListeners(event: string, data: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }
}

export default new WebSocketService(); 