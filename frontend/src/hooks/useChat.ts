import { useState, useCallback, useEffect } from 'react';
import { ChatMessage, FileUpload } from '@/hooks/chat';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const useChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isServerConnected, setIsServerConnected] = useState(false);

  // Check server connection on mount and periodically
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch(`${API_URL}/health`);
        setIsServerConnected(response.ok);
      } catch (error) {
        setIsServerConnected(false);
      }
    };

    // Check immediately
    checkConnection();

    // Check every 30 seconds
    const interval = setInterval(checkConnection, 30000);

    return () => clearInterval(interval);
  }, []);

  const sendMessage = useCallback(async (content: string, files?: FileUpload[]) => {
    if (!content.trim() && (!files || files.length === 0)) return;

    try {
      setIsLoading(true);
      setError(null);

      if (!isServerConnected) {
        throw new Error('Server is not connected. Please try again later.');
      }

      // Add user message immediately
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        content: content.trim(),
        sender: 'user',
        role: 'user',
        timestamp: new Date().toISOString(),
        type: 'text'
      };
      setMessages(prev => [...prev, userMessage]);

      // Handle file uploads first
      if (files && files.length > 0) {
        const uploadPromises = files.map(async (upload) => {
          const formData = new FormData();
          formData.append('file', upload.file);

          const response = await fetch(`${API_URL}/api/upload`, {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`File upload failed: ${response.statusText}`);
          }

          return response.json();
        });

        await Promise.all(uploadPromises);
      }

      // Send message
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          chat_history: messages,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      setMessages(prev => [...prev, data.message]);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isServerConnected]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearError: () => setError(null),
    clearChat: () => setMessages([]),
    isServerConnected,
  };
};