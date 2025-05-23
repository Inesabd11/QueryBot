export interface FileUpload {
  file: File;
  preview: string;
  type: string;
}

export interface Source {
  title: string;
  content: string;
  similarity: number;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: string;
  role: 'user' | 'assistant' | 'bot';
  timestamp: string;
  type?: 'text' | 'file' | 'image';
  metadata?: {
    fileName?: string;
    fileType?: string;
    fileSize?: number;
    imageUrl?: string;
    sources?: Source[];
    isStreaming?: boolean;
    isComplete?: boolean;
  };
}

export interface ChatHistory {
  id:string;
  title: string;
  preview: string;
  timestamp: number;
  unread?: boolean;
  messages?: ChatMessage[];
}

export interface ChatResponse {
  message: ChatMessage;
}

export interface WebSocketMessage {
  type: 'query' | 'stream' | 'complete' | 'error';
  content: string;
  sources?: Source[];
}