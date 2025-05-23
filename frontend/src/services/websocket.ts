import { ChatMessage, WebSocketMessage } from '@/hooks/chat';

interface WebSocketCallbacks {
  onMessage: (message: ChatMessage) => void;
  onError: (error: Error) => void;
  onConnected: () => void;
  onDisconnected: () => void;
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isConnecting = false;

  constructor(
    private callbacks: WebSocketCallbacks,
    private url: string = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'}/ws/chat`
  ) {}

  private handleMessage = (event: MessageEvent) => {
    try {
      const data: WebSocketMessage = JSON.parse(event.data);
      
      switch (data.type) {
        case 'stream':
          // Handle streaming chunks from RAG
          this.callbacks.onMessage({
            id: `msg-${Date.now()}`,
            role: 'assistant',
            sender: 'bot',
            content: data.content,
            timestamp: new Date().toISOString(),
            type: 'text',
            metadata: {
              isStreaming: true
            }
          });
          break;

        case 'complete':
          this.callbacks.onMessage({
            id: `msg-${Date.now()}`,
            role: 'assistant',
            sender: 'bot',
            content: data.content,
            timestamp: new Date().toISOString(),
            type: 'text',
            metadata: {
              sources: data.sources,
              isComplete: true
            }
          });
          break;

        case 'error':
          this.callbacks.onError(new Error(data.content));
          break;

        default:
          console.warn('Unknown message type:', data.type);
      }
    } catch (error) {
      this.callbacks.onError(new Error('Failed to parse WebSocket message'));
    }
  };

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) return;

    try {
      this.isConnecting = true;
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.isConnecting = false;
        this.callbacks.onConnected();
      };

      this.ws.onmessage = this.handleMessage;

      this.ws.onerror = () => {
        this.callbacks.onError(new Error('WebSocket error occurred'));
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        this.callbacks.onDisconnected();
        this.handleReconnection();
      };

    } catch (error) {
      this.isConnecting = false;
      this.callbacks.onError(error instanceof Error ? error : new Error('Failed to connect'));
    }
  }

  private handleReconnection() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
      
      this.reconnectTimeout = setTimeout(() => {
        this.connect();
      }, delay);
    }
  }

  sendMessage(message: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ 
        type: 'query',
        content: message,
        timestamp: new Date().toISOString()
      }));
    } else {
      this.callbacks.onError(new Error('WebSocket is not connected'));
    }
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}