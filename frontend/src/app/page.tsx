//
"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ThemeProvider, useTheme } from '@/components/chat/theme/ThemeContext';
import ChatHistory from '@/components/ChatHistory';
import {ErrorBoundary} from '@/components/ErrorBoundary';
import { ChatHistoryContainer } from '@/components/ChatHistory';
import { SourceDisplay } from '@/components/SourcesDisplay';
import { BotMessageSquare, MessageCircleMore  } from 'lucide-react'
import './globals.css';
import { 
  Search, 
  Trash2, 
  UploadCloud, 
  Sun, 
  Moon, 
  Mic, 
  FileText, 
  Image, 
  X, 
  MessageCircle, 
  ChevronRight,
  ChevronLeft,
  Send,
  Clock,
  Loader2,
  Menu,
  Bot,
  User,
  ArrowDown,
  Trash
} from 'lucide-react';


interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant'| 'bot';
  timestamp: number;
  type?: 'text' | 'file' | 'image';
  metadata?: {
    fileName?: string;
    fileType?: string;
    fileSize?: number;
    imageUrl?: string;
    sources?: Array<{  // Add RAG sources
      title: string;
      content: string;
      similarity: number;
    }>;
  };
}

interface ChatHistory {
  id: string;
  title: string;
  preview: string;
  timestamp: number;
  unread?: boolean;
}

interface FileUpload {
  file: File;
  preview: string;
  type: string;
};
// Main ChatBot Component
function ChatBot() {

  // Get theme from context
  const { theme, toggleTheme, getThemeClasses } = useTheme();
  // State Management
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [uploadedFiles, setUploadedFiles] = useState<FileUpload[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [newMessageAlert, setNewMessageAlert] = useState(false);

  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Dummy chat history data (replace with real data or state as needed)
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      const shouldAutoScroll = isUserNearBottom();
      if (shouldAutoScroll) {
        scrollToBottom();
      } else {
        setNewMessageAlert(true);
      }
    }
  }, [messages]);

  // Check if user is near bottom of chat
  const isUserNearBottom = () => {
    if (!chatContainerRef.current) return true;
    
    const container = chatContainerRef.current;
    const scrollBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    return scrollBottom < 100; // If user is within 100px of bottom
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setNewMessageAlert(false);
  };

  // File Handling
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newFiles: FileUpload[] = Array.from(files).map(file => ({
        file,
        preview: file.type.startsWith('image/') 
          ? URL.createObjectURL(file) 
          : getFileTypeIcon(file.type),
        type: file.type
      }));
      setUploadedFiles(prev => [...prev, ...newFiles]);
      
      // Reset file input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  // Send Message Function
  const sendMessage = async () => {
    if (inputText.trim() === '' && uploadedFiles.length === 0) return;

    try {
      setIsLoading(true);
      setError(null);  // Clear any previous errors

      // Handle file uploads first
      if (uploadedFiles.length > 0) {
        for (const upload of uploadedFiles) {
          const formData = new FormData();
          formData.append('file', upload.file);
          
          const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload`, {
            method: 'POST',
            body: formData
          });
          
          if (!uploadResponse.ok) throw new Error('File upload failed');
        }
      }

      // Send message
      if (inputText.trim()) {
        const response = await fetch('http://localhost:8000/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ message: inputText })
        });

        if (!response.ok) throw new Error('Failed to send message');
        const data = await response.json();

        // Add bot response with RAG sources
        const botMessage: Message = {
          id: `msg-${Date.now()}`,
          content: data.content,
          sender: 'bot',
          timestamp: Date.now(),
          type: 'text',
          metadata: {
            sources: data.metadata?.sources
          }
        };
        setMessages(prev => [...prev, botMessage]);
      }

      setInputText('');
      setUploadedFiles([]);
    } catch (error) {
      console.error('Error:', error);
      // Add error handling UI
    } finally {
      setIsLoading(false);
    }
  };

  // Get appropriate bot response 
  const getBotResponse = (userMessage: string): string => {
    if (!userMessage) return "I've received your file. Would you like me to analyze it?";
    
    if (userMessage.toLowerCase().includes('hello') || userMessage.toLowerCase().includes('hi')) {
      return "Hello! How can I assist you today? I can help answer questions, analyze documents, or discuss any topic you're interested in.";
    }
    
    if (userMessage.toLowerCase().includes('help')) {
      return "I'm here to help! You can ask me questions, upload documents for analysis, or just chat about any topic. What would you like to explore today?";
    }
    
    return `I've processed your message: "${userMessage}". How would you like me to help you with this?`;
  };

  // Search Messages
  const filteredMessages = useMemo(() => {
    if (!searchQuery) return messages;
    return messages.filter(msg => 
      msg.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [messages, searchQuery]);
  
  // Clear Search
  const clearSearch = () => {
    setSearchQuery('');
  };
  // Clear Uploaded Files
  const clearUploadedFiles = () => {
    setUploadedFiles([]);
  };
  // Clear Chat History
  const clearChatHistory = () => {
    setMessages([]);
  };
  // Clear Chat
  const clearChat = () => {
    if (confirm("Are you sure you want to clear the current conversation?")) {
      setMessages([]);
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };



  // Render Methods
  const renderMessageBubble = (message: Message, index: number) => {
    const isUser = message.sender === 'user';
    const showSenderIcon = index === 0 || messages[index - 1].sender !== message.sender;
    
    return (
      <div 
        key={message.id} 
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 items-end group`}
      >
        {!isUser && showSenderIcon && (
          <div className={`
              flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mr-2
              ${getThemeClasses().bg} ${getThemeClasses().text}
              transition-colors duration-300
            `}>
            <Bot className="h-5 w-5 text-white" />
          </div>
        )}
        
        <div 
          className={`
            relative max-w-[80%] p-3 rounded-2xl shadow-sm
            ${isUser 
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-tr-sm' // User message (same for all themes)
              : getThemeClasses().bg} ${getThemeClasses().text} ${getThemeClasses().border} rounded-tl-sm'
             
              transform transition-all duration-200 ease-in-out hover:scale-[1.01]
          `}
        >

          {message.type === 'text' && <p className="whitespace-pre-wrap">{message.content}</p>}
          {message.type === 'image' && (
            <img 
              src={message.metadata?.imageUrl} 
              alt="Uploaded" 
              className="max-w-full rounded-md"
            />
          )}
          {message.type === 'file' && (
            <div className="flex items-center bg-opacity-10 bg-gray-100 dark:bg-gray-900 p-2 rounded-md">
              <FileText className="mr-2 text-gray-500 dark:text-gray-300" size={16} />
              <span className="text-sm truncate max-w-xs">{message.metadata?.fileName}</span>
              <button className="ml-2 text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-xs">
                Download
              </button>
            </div>
          )}
          <div className="text-xs opacity-70 mt-1 text-right">
            {formatTimestamp(message.timestamp)}
          </div>
        </div>
        
        {isUser && showSenderIcon && (
          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center ml-2 shadow-sm">
            <User className="h-5 w-5 text-white" />
          </div>
        )}
        {/* Display sources if available */}
        {message.metadata?.sources && (
          <SourceDisplay sources={message.metadata.sources} />
        )}
      </div>
    );
  };

  // Render Chat History Item
  const renderChatHistoryItem = (chat: ChatHistory) => {
    return (
      <div 
        key={chat.id}
        className="flex items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer mb-1 transition-colors duration-200"
      >
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center mr-3">
          <MessageCircle className="h-5 w-5 text-gray-500 dark:text-gray-300" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{chat.title}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{chat.preview}</p>
        </div>
        <div className="ml-2 flex flex-col items-end">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {formatTimestamp(chat.timestamp)}
          </span>
          {chat.unread && (
            <span className="h-2 w-2 bg-blue-500 rounded-full mt-1"></span>
          )}
        </div>
      </div>
    );
  };

  // Render
  return (
    <div 
      className={`
        flex h-screen overflow-hidden
        ${theme === 'black-dark' ? 'dark bg-gray-900 text-white' : 
         theme === 'blue-dark' ? 'dark bg-gray-800 text-white' : 
         'bg-gray-50 text-black'}
        transition-colors duration-300
      `}
    >
      {/* Sidebar */}
      <div 
        className={`
          flex-shrink-0 
          ${getThemeClasses().sidebar}
          transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'w-72' : 'w-0'}
          md:relative absolute h-full z-20
        `}
      >
       <ChatHistoryContainer 
          onClose={() => setIsSidebarOpen(false)} 
          isSidebarOpen={isSidebarOpen} 
      />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full">
{/* Header */}
<header 
  className={`
    flex justify-between items-center p-4 border-b mt-4 rounded-xl
    ${getThemeClasses().header}
    shadow-lg z-10
  `}
>
  <div className="flex items-center gap-2">
    <button
      onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
    >
      {isSidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
    </button>
    
    <div className="flex items-center gap-2">
      <div className={getThemeClasses().bg + " h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center"}>
        <BotMessageSquare className="h-5 w-5 text-white" />
      </div>
      <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500">QueryBot</h1>
    </div>
  </div>
  
  <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme} 
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {/* Search Toggle */}
            <button 
              onClick={() => setIsSearching(!isSearching)}
              className={`p-2 rounded-full transition-colors duration-200 ${
                isSearching 
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              aria-label="Search messages"
            >
              <Search size={18} />
            </button>

            {/* Clear History */}
            <button 
              onClick={clearChat}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              aria-label="Clear conversation"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </header>

        {/* Search Bar */}
        {isSearching && (
          <div 
            className={`
              p-3 border-b
              ${theme === 'black-dark' ? 'bg-gray-800 border-gray-700' :
               theme === 'blue-dark' ? 'bg-blue-900 border-blue-800' :
               'bg-white border-gray-200'}
              animate-fadeIn
            `}
          >
            <div className="relative">
              <input 
                type="text"
                placeholder="Search in conversation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`
                  w-full p-2 pl-8 rounded-lg border 
                  ${theme === 'light' 
                    ? 'bg-gray-50 border-gray-200 text-black' 
                    : 'bg-gray-700 border-gray-600 text-white'}
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                `}
              />
              <Search 
                size={16} 
                className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Chat Messages */}
        <div 
          ref={chatContainerRef}
          className={`
            flex-1 overflow-y-auto p-4 rounded-xl shadow-lg
            ${getThemeClasses().chatBg}}
            relative
          `}
        >
          {filteredMessages.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center text-gray-400">
              <div className="w-24 h-24 mb-6 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                <MessageCircleMore  size={48} className="text-gray-400 dark:text-gray-300" />
              </div>
              <h2 className="text-xl font-medium mb-2 text-gray-600 dark:text-gray-500">Start a conversation</h2>
              <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm">
                Ask me anything, upload documents, or get help with your questions!
              </p>
            </div>
          ) : (
            <>
              <div className="pb-2">
                {filteredMessages.map((message, index) => renderMessageBubble(message, index))}
                {isLoading && (
                  <div className="flex justify-start mb-4 items-end">
                    <div className={
                      "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center mr-2 " +
                      (theme === 'light'
                        ? "bg-gradient-to-br from-purple-500 to-blue-500"
                        : theme === 'blue-dark'
                        ? "bg-gradient-to-br from-blue-500 to-indigo-700"
                        : "bg-gradient-to-br from-gray-600 to-gray-700")
                    }>
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                    <div className={getThemeClasses().bg + " p-3 rounded-2xl rounded-tl-sm shadow-sm"}>
                      <div className="flex space-x-2">
                        <div className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse"></div>
                        <div className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse delay-75"></div>
                        <div className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse delay-150"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div ref={chatEndRef} />
            </>
          )}
          
          {/* Scroll to bottom button */}
          {newMessageAlert && (
            <button
              onClick={scrollToBottom}
              className="absolute bottom-4 right-4 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-200 animate-bounce"
            >
              <ArrowDown size={16} />
            </button>
          )}
        </div>

        {/* File Preview */}
        {uploadedFiles.length > 0 && (
          <div 
            className={`
              flex gap-2 p-2 overflow-x-auto border-t
              ${theme === 'black-dark' ? 'bg-gray-800 border-gray-700' : 
               theme === 'blue-dark' ? 'bg-blue-900 border-blue-800' : 
               'bg-white border-gray-200'}
            `}
          >
            {uploadedFiles.map((upload, index) => (
              <div 
                key={index} 
                className="relative flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm"
              >
                {upload.type.startsWith('image/') ? (
                  <img 
                    src={upload.preview} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <FileText size={24} className="text-gray-500 dark:text-gray-400" />
                  </div>
                )}
                <button 
                  onClick={() => {
                    setUploadedFiles(prev => 
                      prev.filter((_, i) => i !== index)
                    );
                  }}
                  className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full shadow-sm hover:bg-red-600 transition-colors duration-200"
                >
                  <X size={10} />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
                  {upload.file.name.substring(0, 12)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div 
          className={`
            p-4 border-t rounded-xl shadow-lg mb-4
            ${getThemeClasses().messageBox}
          `}
        >
          <div className="flex items-center gap-2 ">
            {/* File Upload */}
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              className="hidden"
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className={`
                p-2 rounded-full transition-colors duration-200
                ${theme === 'light'
                  ? 'hover:bg-gray-100 text-gray-600' 
                  : 'hover:bg-gray-700 text-gray-300'}
              `}
              aria-label="Upload file"
            >
              <UploadCloud size={20} />
            </button>
            
            {/* Text Input */}
            <div className="flex-1 relative">
              <textarea 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Type your message..."
                rows={1}
                className={`
                  w-full p-3 rounded-2xl shadow-sm resize-none
                  ${(theme === 'blue-dark' || theme === 'black-dark')
                    ? 'bg-gray-700 text-white placeholder-gray-400 border-gray-600' 
                    : 'bg-gray-50 text-black placeholder-gray-500 border-gray-200'}
                  focus:outline-none focus:ring-2 focus:ring-blue-500 border
                `}
                style={{
                  minHeight: '46px',
                  maxHeight: '120px'
                }}
              />
            </div>

            {/* Send Button */}
            <button 
              onClick={sendMessage}
              disabled={isLoading}
              className={`
                p-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700
                text-white shadow-md transition-all duration-200
                ${isLoading || (inputText.trim() === '' && uploadedFiles.length === 0) 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:shadow-lg'}
              `}
              aria-label="Send message"
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>
          <div className="text-xs text-gray-400 mt-2 text-center">
            Press Enter to send, Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  );
}
export default function page() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ChatBot />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

// Utility function to get file type icon
function getFileTypeIcon(fileType: string): string {
  const iconMap: {[key: string]: string} = {
    'application/pdf': '📄',
    'text/plain': '📝',
    'application/msword': '📄',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📄',
    'application/vnd.ms-excel': '📊',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊'
  };
  return iconMap[fileType] || '📁';
}
// Error state for displaying error messages
const [error, setError] = useState<string | null>(null);
// 