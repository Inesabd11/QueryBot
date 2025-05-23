//
"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ThemeProvider, useTheme } from '@/components/chat/theme/ThemeContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ChatHistoryContainer } from '@/components/ChatHistory';
import { MessageBubble } from '@/components/MessageBubble';
import { ChatHistory, ChatMessage } from '@/hooks/chat';
import { formatTimestamp } from '@/utils/fileUtils';
import { useChat } from '@/hooks/useChat';
import { useFileUpload } from '@/hooks/useFileUploads';
import { BotMessageSquare, MessageCircleMore  } from 'lucide-react'
import './globals.css';
import { 
  Search, Trash2, UploadCloud, Sun, Moon, FileText, X, MessageCircle, ChevronLeft,Send, Loader2, Menu, Bot, ArrowDown,
    } from 'lucide-react';

  function ChatBot() {
    const { theme, toggleTheme, getThemeClasses } = useTheme();
    const { 
      messages, 
      isLoading, 
      error, 
      sendMessage, 
      clearChat, 
      clearError 
    } = useChat();
    const {
      uploadedFiles,
      setUploadedFiles,
      fileInputRef,
      handleFileUpload
    } = useFileUpload();

    // State Management
    const [inputText, setInputText] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [newMessageAlert, setNewMessageAlert] = useState(false);

    // Refs
    const chatEndRef = useRef<HTMLDivElement>(null);
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
  
  // Simplified send handler
  const handleSend = async () => {
    if (inputText.trim() === '' && uploadedFiles.length === 0) return;
    
    await sendMessage(inputText, uploadedFiles);
    setInputText('');
    setUploadedFiles([]);
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

  // Add error notification
  useEffect(() => {
    if (error) {
      // You can replace this with a proper toast notification
      console.error('Chat Error:', error);
      
      // Auto-clear error after 5 seconds
      const timer = setTimeout(() => {
        clearError();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

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
              onClick={() => {
                if (confirm("Are you sure you want to clear the current conversation?")) {
                  clearChat(); 
                }
              }}
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
                {filteredMessages.map((message, index) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    showSenderIcon={index === 0 || filteredMessages[index - 1].sender !== message.sender}
                    getThemeClasses={getThemeClasses}
                  />
                ))}
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
                    handleSend();
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
              onClick={handleSend}
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

        {/* Add error message to UI */}
        {error && (
          <div className="p-4 bg-red-100 border-l-4 border-red-500 text-red-700 mb-4 rounded shadow-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={clearError}
                  className="text-red-700 hover:text-red-900 focus:outline-none"
                >
                  <span className="sr-only">Dismiss</span>
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
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
// This is a simple chat application using React and TypeScript. It includes features like file uploads, message history, and a theme toggle. The code is structured to provide a clean and responsive user interface.