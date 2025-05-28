import { useState, useCallback, useRef } from 'react';

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  role: 'user' | 'assistant';
  timestamp: string;
  type?: 'text' | 'file' | 'image';
  metadata?: {
    fileName?: string;
    fileType?: string;
    fileSize?: number;
    imageUrl?: string;
    sources?: string[];
    isStreaming?: boolean;
    isComplete?: boolean;
  };
}

export interface ChatResponse {
  content: string;
  role: string;
  timestamp: string;
  type: string;
}

export interface ChatHistory {
  id: string;
  title: string;
  preview: string;
  timestamp: string;
  unread?: boolean;
}

export interface FileUpload {
  file: File;
  type: string;
  preview: string;
}

interface SSEMessage {
  type: 'status' | 'stream' | 'complete' | 'error';
  content: string;
  role?: string;
  timestamp: string;
  accumulated?: string;
}

interface SSECallbacks {
  onMessage: (message: ChatMessage) => void;
  onError: (error: Error) => void;
  onStatusUpdate: (status: string) => void;
  onStreamStart: () => void;
  onStreamEnd: () => void;
}

export class SSEService {
  private eventSource: EventSource | null = null;
  private currentMessageId: string | null = null;
  private accumulatedContent: string = '';

  constructor(
    private callbacks: SSECallbacks,
    private apiUrl: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  ) {}

  async sendMessage(message: string, chatHistory: ChatMessage[] = []) {
    if (this.eventSource) {
      this.eventSource.close();
    }

    try {
      // Reset state
      this.accumulatedContent = '';
      this.currentMessageId = `msg-${Date.now()}`;
      
      this.callbacks.onStreamStart();

      // Make POST request to initiate streaming
      const response = await fetch(`${this.apiUrl}/api/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          chat_history: chatHistory
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      // Read the streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6); // Remove "data: " prefix
              
              if (data === '[DONE]') {
                this.callbacks.onStreamEnd();
                return;
              }

              try {
                const parsed: SSEMessage = JSON.parse(data);
                this.handleMessage(parsed);
              } catch (e) {
                console.warn('Failed to parse SSE message:', data);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

    } catch (error) {
      this.callbacks.onError(error instanceof Error ? error : new Error('Unknown error occurred'));
      this.callbacks.onStreamEnd();
    }
  }

  private handleMessage(data: SSEMessage) {
    switch (data.type) {
      case 'status':
        this.callbacks.onStatusUpdate(data.content);
        break;

      case 'stream':
        // Update accumulated content
        if (data.accumulated) {
          this.accumulatedContent = data.accumulated;
        } else {
          this.accumulatedContent += data.content + ' ';
        }

        // Send streaming message
        this.callbacks.onMessage({
          id: this.currentMessageId!,
          role: 'assistant',
          sender: 'bot',
          content: this.accumulatedContent.trim(),
          timestamp: data.timestamp,
          type: 'text',
          metadata: {
            isStreaming: true
          }
        });
        break;

      case 'complete':
        // Send final complete message
        this.callbacks.onMessage({
          id: this.currentMessageId!,
          role: 'assistant',
          sender: 'bot',
          content: data.content || this.accumulatedContent.trim(),
          timestamp: data.timestamp,
          type: 'text',
          metadata: {
            isStreaming: false,
            isComplete: true
          }
        });
        this.callbacks.onStreamEnd();
        break;

      case 'error':
        this.callbacks.onError(new Error(data.content));
        this.callbacks.onStreamEnd();
        break;

      default:
        console.warn('Unknown SSE message type:', data.type);
    }
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }
}