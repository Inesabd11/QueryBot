// frontend/src/store/chatStore.ts
import { create } from 'zustand';
import axios from 'axios';

interface Message {
  role: 'user' | 'assistant' | 'system';
  message: string;
  timestamp: string;
}

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  socket: WebSocket | null;
  
  // Actions
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

  setMessages: (messages) => set({ messages }),

  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message] 
  })),

  sendMessage: async (content) => {
    const userMessage: Message = {
      role: 'user',
      message: content,
      timestamp: new Date().toISOString()
    };

    set((state) => ({ 
      messages: [...state.messages, userMessage],
      isLoading: true 
    }));

    // WebSocket handling with proper null checks
    const { socket } = get();
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(userMessage));
      return;
    }

    // Fallback to HTTP API
    try {
      const response = await axios.post(`${API_URL}/api/chat`, { message: content });
      const botMessage: Message = {
        role: 'assistant',
        message: response.data.response,
        timestamp: new Date().toISOString()
      };
      set((state) => ({
        messages: [...state.messages, botMessage],
        isLoading: false
      }));
    } catch (error) {
      console.error('Error sending message:', error);
      set({ 
        error: 'Failed to send message',
        isLoading: false
      });
    }
  },

  uploadFile: async (file) => {
    set({ isLoading: true });
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      await axios.post(`${API_URL}/api/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      const systemMessage: Message = {
        role: 'system',
        message: `File '${file.name}' uploaded successfully. I can now answer questions based on its content.`,
        timestamp: new Date().toISOString()
      };
      
      set((state) => ({
        messages: [...state.messages, systemMessage],
        isLoading: false
      }));
    } catch (error) {
      console.error('Error uploading file:', error);
      set({ 
        error: 'Failed to upload file',
        isLoading: false
      });
    }
  },

  clearHistory: async () => {
    try {
      await axios.post(`${API_URL}/api/clear-history`);
      set({ messages: [] });
    } catch (error) {
      console.error('Error clearing history:', error);
      set({ error: 'Failed to clear history' });
    }
  },

  connectWebSocket: () => {
    // Close existing connection if any
    get().socket?.close();

    const socket = new WebSocket(WS_URL);
    
    socket.onopen = () => {
      console.log('WebSocket connection established');
    };
    
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as Message;
        if (data.role === 'assistant') {
          set((state) => ({
            messages: [...state.messages, data],
            isLoading: false
          }));
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    socket.onclose = () => {
      console.log('WebSocket connection closed');
    };
    
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      set({ error: 'WebSocket connection error' });
    };
    
    set({ socket });
  },
  
  disconnectWebSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.close();
      set({ socket: null });
    }
  }
}));