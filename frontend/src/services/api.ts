import { ChatMessage, ChatResponse } from '@/hooks/chat';  // Changed from @/hooks/chat

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
//
export const sendMessage = async (message: string, chatHistory: ChatMessage[] = []): Promise<ChatResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
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
    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
};

export const clearChatHistory = async (): Promise<{success: boolean}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/chat/clear`, {
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