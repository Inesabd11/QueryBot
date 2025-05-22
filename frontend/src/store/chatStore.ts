// frontend/src/store/chatStore.ts
import { create } from 'zustand';
import axios from 'axios';

export interface Source {
  title: string;
  content: string;
  similarity: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'bot';
  content: string;
  timestamp: string;
  type?: 'text' | 'file';
  metadata?: {
    sources?: Source[];
  };
}

interface RAGResponse {
  content: string;
  sources?: {
    title: string;
    content: string;
    similarity: number;
  }[];
}

interface Message {
  role: 'user' | 'assistant' | 'bot';
  content: string;
  timestamp: string;
  metadata?: {
    sources?: Array<{
      title: string;
      content: string;
      similarity: number; // check if this is required 
    }>;
    confidence?: number; // check if this is required
  };
}

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  socket: WebSocket | null;
  hasError: boolean;
  errorMessage: string;
  
  // Add missing function definitions to the interface
  clearError: () => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  sendMessage: (content: string) => Promise<void>;
  uploadFile: (file: File) => Promise<void>;
  clearHistory: () => Promise<void>;
  connectWebSocket: () => void;
  disconnectWebSocket: () => void;
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
  
  clearError: () => set({ hasError: false, errorMessage: '', error: null }),

  setMessages: (messages: Message[]) => set({ messages }),

  addMessage: (message: Message) => set((state) => ({
    messages: [...state.messages, message]
  })),

  sendMessage: async (content: string) => {
    const userMessage: Message = {
      role: 'user',
      content: content,
      timestamp: new Date().toISOString()
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

      const botMessage: Message = {
      role: 'assistant',
      content: response.data.content,
      timestamp: new Date().toISOString(),
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

      const systemMessage: Message = {
      role: 'bot',
      content: `File '${file.name}' has been processed and added to the knowledge base. You can now ask questions about it.`,
      timestamp: new Date().toISOString(),
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
        const message: Message = JSON.parse(event.data);
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
  }
}));