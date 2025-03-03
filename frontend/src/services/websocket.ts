import { toast } from 'react-toastify';

const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8085/api/ws';

export interface WebSocketMessage {
  type: 'poll_update' | 'vote_update' | 'comment_update';
  data: {
    group_id: string;
    poll_id: string;
    type?: string;
  };
}

class WebSocketService {
  private socket: WebSocket | null = null;
  private isConnecting: boolean = false;
  private messageHandlers: Map<string, ((data: any) => void)[]> = new Map();

  async connect(): Promise<void> {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    if (this.isConnecting) {
      return Promise.reject(new Error('Connection attempt already in progress'));
    }

    const token = localStorage.getItem('token');
    if (!token) {
      return Promise.reject(new Error('No authentication token found'));
    }

    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(`${WS_URL}?token=${token}`);

        this.socket.onopen = () => {
          console.log('WebSocket connected');
          this.isConnecting = false;
          resolve();
        };

        this.socket.onclose = () => {
          console.log('WebSocket disconnected');
          this.socket = null;
          this.isConnecting = false;
        };

        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;
          reject(error);
        };

        this.socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            const handlers = this.messageHandlers.get(message.type) || [];
            handlers.forEach(handler => handler(message.data));
          } catch (error) {
            console.error('Error processing WebSocket message:', error);
          }
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  subscribe(messageType: string, handler: (data: any) => void): void {
    const handlers = this.messageHandlers.get(messageType) || [];
    handlers.push(handler);
    this.messageHandlers.set(messageType, handlers);
  }

  unsubscribe(messageType: string, handler: (data: any) => void): void {
    const handlers = this.messageHandlers.get(messageType) || [];
    const index = handlers.indexOf(handler);
    if (index !== -1) {
      handlers.splice(index, 1);
      if (handlers.length === 0) {
        this.messageHandlers.delete(messageType);
      } else {
        this.messageHandlers.set(messageType, handlers);
      }
    }
  }

  send(message: any): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

export default new WebSocketService(); 