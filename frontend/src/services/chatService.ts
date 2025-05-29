import { ChatMessage } from '../hooks/useChat';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export class ChatService {
  private socket: WebSocket | null = null;
  
  async sendMessage(message: string): Promise<ChatMessage> {
    const response = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    
    if (!response.ok) {
      throw new Error('Failed to send message');
    }
    
    return response.json();
  }

  async uploadFile(file: File): Promise<ChatMessage> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/api/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('File upload failed');
    }

    return response.json();
  } 
}