interface WebSocketMessage {
  type: 'availability_update' | 'booking_notification' | 'class_reminder' | 'attendance_update';
  data: any;
  timestamp: number;
}

interface AvailabilityUpdate {
  classId: number;
  availableSpots: number;
  totalSpots: number;
  waitlistCount?: number;
}

interface BookingNotification {
  classId: number;
  className: string;
  participantName: string;
  action: 'booked' | 'cancelled';
}

class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Set<Function>> = new Map();
  private isConnected = false;

  connect(userId?: number): void {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    try {
      this.socket = new WebSocket(wsUrl);
      
      this.socket.onopen = () => {
        console.log('WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Send authentication if user is provided
        if (userId) {
          this.send({
            type: 'authenticate',
            data: { userId },
            timestamp: Date.now()
          });
        }
        
        this.emit('connected', null);
      };

      this.socket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.socket.onclose = () => {
        console.log('WebSocket disconnected');
        this.isConnected = false;
        this.emit('disconnected', null);
        this.attemptReconnect();
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.emit('error', error);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }

  private handleMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'availability_update':
        this.emit('availability_update', message.data);
        break;
      case 'booking_notification':
        this.emit('booking_notification', message.data);
        break;
      case 'class_reminder':
        this.emit('class_reminder', message.data);
        break;
      case 'attendance_update':
        this.emit('attendance_update', message.data);
        break;
      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
      this.emit('max_reconnect_attempts', null);
    }
  }

  send(message: Partial<WebSocketMessage>): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const fullMessage: WebSocketMessage = {
        type: message.type as any,
        data: message.data,
        timestamp: message.timestamp || Date.now()
      };
      this.socket.send(JSON.stringify(fullMessage));
    } else {
      console.warn('WebSocket not connected, message not sent:', message);
    }
  }

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }

  private emit(event: string, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.listeners.clear();
    this.isConnected = false;
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // Specific methods for different notification types
  subscribeToClass(classId: number): void {
    this.send({
      type: 'subscribe_class',
      data: { classId },
      timestamp: Date.now()
    });
  }

  unsubscribeFromClass(classId: number): void {
    this.send({
      type: 'unsubscribe_class',
      data: { classId },
      timestamp: Date.now()
    });
  }

  subscribeToOrganization(organizationId: number): void {
    this.send({
      type: 'subscribe_organization',
      data: { organizationId },
      timestamp: Date.now()
    });
  }
}

export const webSocketService = new WebSocketService();
export type { WebSocketMessage, AvailabilityUpdate, BookingNotification };