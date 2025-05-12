'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trash2, UploadCloud } from 'lucide-react';
import ChatWindow from '@/components/ChatWindow';
import ChatInput from '@/components/ChatInput';
import { useChatStore } from '@/store/chatStore';

export default function ChatPage() {
  const router = useRouter();
  const { 
    messages, 
    isLoading, 
    sendMessage, 
    uploadFile, 
    clearHistory, 
    connectWebSocket,
    disconnectWebSocket
  } = useChatStore();

  // Connect to WebSocket when the component mounts
  useEffect(() => {
    connectWebSocket();
    
    // Clean up WebSocket connection when component unmounts
    return () => {
      disconnectWebSocket();
    };
  }, [connectWebSocket, disconnectWebSocket]);

  // Load chat history from the API
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/history`);
        const data = await response.json();
        if (data.history) {
          useChatStore.getState().setMessages(data.history);
        }
      } catch (error) {
        console.error('Failed to fetch chat history:', error);
      }
    };

    fetchHistory();
  }, []);

  const handleClearHistory = async () => {
    await clearHistory();
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm p-4 flex justify-between items-center z-10">
        <Link href="/" className="text-xl font-bold text-blue-600">
          QueryBot
        </Link>
        <div className="flex gap-2">
          <button
            onClick={handleClearHistory}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            <Trash2 size={16} />
            <span className="hidden sm:inline">Clear History</span>
          </button>
        </div>
      </header>

      {/* Chat content */}
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-gray-400">
          <UploadCloud size={48} className="mb-2" />
          <p className="text-lg font-medium">Start chatting or upload a document</p>
          <p className="text-sm">QueryBot will help you find answers based on your data</p>
        </div>
      ) : (
        <ChatWindow messages={messages} isLoading={isLoading} />
      )}

      {/* Input area */}
      <ChatInput 
        onSendMessage={sendMessage} 
        onFileUpload={uploadFile}
        isLoading={isLoading}
      />
    </div>
  );
}
