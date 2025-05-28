import { ChatMessage, ChatResponse } from '@/hooks/useChat';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const sendMessage = async (message: string, chatHistory: ChatMessage[] = []): Promise<ChatResponse> => {
  try {
    // Use the correct endpoint from your backend
    const response = await fetch(`${API_BASE_URL}/api/chat_message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        chat_history: chatHistory,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

export const uploadDocument = async (file: File): Promise<{success: boolean, message: string}> => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    // Use the correct endpoint from your backend
    const response = await fetch(`${API_BASE_URL}/api/documents/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
};

export const checkServerHealth = async (): Promise<{status: string, components: any}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error checking server health:', error);
    throw error;
  }
};

export const clearChatHistory = async (): Promise<{success: boolean}> => {
  try {
    // Note: This endpoint doesn't exist in your backend yet
    // You'll need to implement it or remove this function
    const response = await fetch(`${API_BASE_URL}/api/chat/clear`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error clearing chat history:', error);
    throw error;
  }
};