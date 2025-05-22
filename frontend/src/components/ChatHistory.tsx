import React, { useState } from 'react';
import { MessageCircle, Search, X, PanelRight } from 'lucide-react';
import { useTheme } from '@/components/chat/theme/ThemeContext';

// Keep your existing interface for chat history items
interface ChatHistoryItem {
  id: string;
  title: string;
  preview: string;
  timestamp: number;
  unread?: boolean;
}

interface ChatHistoryProps {
  chatHistory: ChatHistoryItem[];
  onClose: () => void;
  isSidebarOpen: boolean;
  formatTimestamp: (timestamp: number) => string;
}

// Parent container component that manages the chat history state
export const ChatHistoryContainer: React.FC<{
  onClose: () => void;
  isSidebarOpen: boolean;
}> = ({ onClose, isSidebarOpen }) => {
  
  // Initialize chat history state with sample data
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([
    {
      id: 'chat-1',
      title: 'Document Analysis',
      preview: 'Analyzing quarterly sales report...',
      timestamp: Date.now() - 86400000, // 1 day ago
      unread: true
    },
    {
      id: 'chat-2',
      title: 'Product Research',
      preview: 'Tell me about the latest AI trends...',
      timestamp: Date.now() - 172800000, // 2 days ago
    },
    {
      id: 'chat-3',
      title: 'Meeting Notes',
      preview: 'Summarize the key points from...',
      timestamp: Date.now() - 259200000, // 3 days ago
    }
  ]);

  // Function to format timestamps
  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    // Less than 24 hours
    if (diff < 86400000) {
      return 'Today';
    }
    // Less than 48 hours
    else if (diff < 172800000) {
      return 'Yesterday';
    }
    // Otherwise show the date
    else {
      return new Date(timestamp).toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  // You can add functions to manipulate the chat history here
  const addNewChat = () => {
    const newChat = {
      id: `chat-${chatHistory.length + 1}`,
      title: 'New Conversation',
      preview: 'Start typing to begin...',
      timestamp: Date.now(),
      unread: false
    };
    
    setChatHistory([newChat, ...chatHistory]);
  };

  return (
    <ChatHistory 
      chatHistory={chatHistory}
      onClose={onClose}
      isSidebarOpen={isSidebarOpen}
      formatTimestamp={formatTimestamp}
    />
  );
};

// Keep your original ChatHistory component unchanged
const ChatHistory: React.FC<ChatHistoryProps> = ({
  chatHistory,
  onClose,
  isSidebarOpen,
  formatTimestamp
}) => {
  const { theme, getThemeClasses } = useTheme();

  if (!isSidebarOpen) return null;

  return (
    <div className="flex flex-col h-full">
      <div className={`flex items-center justify-between p-4 border-b ${getThemeClasses().border}`}>
        <div className="flex items-center gap-2"> {/* Added flex container for icon and text */}
          <div className={getThemeClasses().bg + " h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center"}>
            <PanelRight className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500">
            Chat History
          </h3>
        </div>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 md:hidden"
        >
          <X size={20} />
        </button>
      </div>
      
      <div className="p-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Search conversations..."
            className={`
              w-full p-2 pl-8 text-sm rounded-lg border
              ${getThemeClasses().input}
              focus:outline-none focus:ring-2 focus:ring-blue-500
            `}
          />
          <Search 
            size={16} 
            className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3">
        {chatHistory.map((chat) => (
          <div 
            key={chat.id}
            className={`
              flex items-center p-3 rounded-lg cursor-pointer mb-1 
              transition-colors duration-200
              ${getThemeClasses().bg} hover:bg-opacity-80
            `}
          >
            <div className={`
              h-10 w-10 rounded-full flex items-center justify-center mr-3
              ${getThemeClasses().border}
            `}>
              <MessageCircle className="h-5 w-5 text-gray-500 dark:text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium truncate">{chat.title}</h3>
              <p className="text-xs text-gray-700 dark:text-gray-600 truncate">
                {chat.preview}
              </p>
            </div>
            <div className="ml-2 flex flex-col items-end">
              <span className="text-xs text-gray-400 dark:text-gray-600">
                {formatTimestamp(chat.timestamp)}
              </span>
              {chat.unread && (
                <span className="h-2 w-2 bg-blue-500 rounded-full mt-1" />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="p-3">
        <button className={`
          w-full flex items-center justify-center space-x-2 p-2 rounded-lg
          bg-gradient-to-r from-blue-500 to-blue-600 
          hover:from-blue-600 hover:to-blue-700 
          text-white transition-all duration-200
        `}>
          <MessageCircle size={16} />
          <span>New Chat</span>
        </button>
      </div>
    </div>
  );
};

export default ChatHistoryContainer;