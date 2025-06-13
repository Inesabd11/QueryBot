// frontend/src/store/chatStore.ts
import { create } from 'zustand';
import axios from 'axios';
import type { ChatMessage } from '@/hooks/useChat';

interface RAGResponse {
  content: string;
  sources?: {
    title: string;
    content: string;
    similarity: number;
  }[];
}

interface QueuedMessage {
  id: string;
  content: string;
  retryCount: number;
}

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  socket: WebSocket | null;
  hasError: boolean;
  errorMessage: string;
  messageQueue: QueuedMessage[];
  isConnecting: boolean;
  retryCount: number;
  isTyping: boolean;
  typingTimeout: NodeJS.Timeout | null;
  
  // Add missing function definitions to the interface
  clearError: () => void;
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  sendMessage: (content: string) => Promise<void>;
  uploadFile: (file: File) => Promise<void>;
  clearHistory: () => Promise<void>;
  connectWebSocket: () => void;
  disconnectWebSocket: () => void;
  enqueueMessage: (content: string) => void;
  processMessageQueue: () => void;
  setTyping: (typing: boolean) => void;
  startTyping: () => void;
  stopTyping: () => void;
  clearMessages: () => void; // Add clearMessages to the interface
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,
  socket: null,
  hasError: false,
  errorMessage: '',
  messageQueue: [],
  isConnecting: false,
  retryCount: 0,
  isTyping: false,
  typingTimeout: null,

  clearError: () => set({ hasError: false, errorMessage: '', error: null }),

  setMessages: (messages: ChatMessage[]) => set({ messages }),

  addMessage: (message: ChatMessage) => set((state) => ({
    messages: [...state.messages, message]
  })),

  sendMessage: async (content: string) => {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      sender: 'user',
      role: 'user',
      content: content,
      timestamp: new Date().toISOString(),
      type: 'text'
    };

    set((state) => ({
      messages: [...state.messages, userMessage],
      isLoading: true
    }));

    const { socket } = get();
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(userMessage));
      return;
    }

    try {
      const response = await axios.post<RAGResponse>(`${API_URL}/api/chat`, {
        message: content,
        use_rag: true
      });

      const botMessage: ChatMessage = {
        id: crypto.randomUUID(),
        sender: 'bot',
        role: 'assistant',
        content: response.data.content,
        timestamp: new Date().toISOString(),
        type: 'text',
        metadata: {
          sources: response.data.sources
        }
      };
      set((state) => ({
        messages: [...state.messages, botMessage],
        isLoading: false,
        hasError: false,
        errorMessage: ''
      }));
    } catch (error) {
      console.error('Error sending message:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to send message',
        isLoading: false,
        hasError: true,
        errorMessage: 'Failed to send message'
      });
    }
  },
  // Function to upload a file
  uploadFile: async (file: File) => {
    set({ isLoading: true });

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Add metadata about the file if needed
      formData.append('process_type', 'rag');  // Tell backend this is for RAG
    
      const response = await axios.post(`${API_URL}/api/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const systemMessage: ChatMessage = {
        id: crypto.randomUUID(),
        sender: 'bot',
        role: 'assistant', // changed from 'bot' to 'assistant'
        content: `File '${file.name}' has been processed and added to the knowledge base. You can now ask questions about it.`,
        timestamp: new Date().toISOString(),
        type: 'file',
        metadata: {
          sources: response.data.sources || []  // If backend returns processed chunks info
        }
      };

      set((state) => ({
        messages: [...state.messages, systemMessage],
        isLoading: false,
        hasError: false,
        errorMessage: ''
      }));
    } catch (error) {
      console.error('Error uploading file:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to upload file',
        isLoading: false,
        hasError: true,
        errorMessage: 'Failed to upload file'
      });
    }
  },

  clearHistory: async () => {
    try {
      await axios.post(`${API_URL}/api/clear-history`);
      set({ messages: [] });
    } catch (error) {
      console.error('Error clearing history:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to clear history',
        hasError: true,
        errorMessage: 'Failed to clear history'
      });
    }
  },

  connectWebSocket: () => {
    // Close existing connection if it exists
    get().disconnectWebSocket();

    const socket = new WebSocket(WS_URL);

    socket.onopen = () => {
      console.log('WebSocket connection established');
      set({ socket });
    };

    socket.onmessage = (event) => {
      try {
        const message: ChatMessage = JSON.parse(event.data);
        set((state) => ({
          messages: [...state.messages, message],
          isLoading: false
        }));
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        set({
          error: 'Failed to parse WebSocket message',
          hasError: true,
          errorMessage: 'Failed to parse WebSocket message'
        });
      }
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed');
      set({ socket: null });
    };

    socket.onerror = (event) => {
      console.error('WebSocket error:', event);
      set({
        error: 'WebSocket connection error',
        hasError: true,
        errorMessage: 'WebSocket connection error'
      });
    };
   },

  disconnectWebSocket: () => {
    const { socket } = get();
    if (socket && socket.readyState !== WebSocket.CLOSED) {
      socket.close();
      set({ socket: null });
    }
  },

  enqueueMessage: (content: string) => {
    const messageId = crypto.randomUUID();
    set((state) => ({
      messageQueue: [...state.messageQueue, {
        id: messageId,
        content,
        retryCount: 0
      }]
    }));
    get().processMessageQueue();
  },

  processMessageQueue: async () => {
    const state = get();
    if (state.messageQueue.length === 0 || state.isLoading) return;

    const [nextMessage, ...remainingMessages] = state.messageQueue;
    set({ isLoading: true });

    try {
      await state.sendMessage(nextMessage.content);
      set((state) => ({ 
        messageQueue: remainingMessages,
        isLoading: false 
      }));
    } catch (error) {
      if (nextMessage.retryCount < 3) {
        // Retry with backoff
        setTimeout(() => {
          set((state) => ({
            messageQueue: [
              { ...nextMessage, retryCount: nextMessage.retryCount + 1 },
              ...remainingMessages
            ],
            isLoading: false
          }));
          get().processMessageQueue();
        }, Math.pow(2, nextMessage.retryCount) * 1000);
      } else {
        // Message failed after retries
        set((state) => ({
          messageQueue: remainingMessages,
          isLoading: false,
          hasError: true,
          errorMessage: `Failed to send message after ${nextMessage.retryCount} retries`
        }));
      }
    }
  },

  setTyping: (typing: boolean) => set({ isTyping: typing }),
  
  startTyping: () => {
    const state = get();
    if (state.typingTimeout) clearTimeout(state.typingTimeout);
    
    set({ 
      isTyping: true,
      typingTimeout: setTimeout(() => {
        set({ isTyping: false, typingTimeout: null });
      }, 3000)
    });
  },

  stopTyping: () => {
    const state = get();
    if (state.typingTimeout) clearTimeout(state.typingTimeout);
    set({ isTyping: false, typingTimeout: null });
  },

  clearMessages: () => {
    set({ messages: [] });
  },
}));