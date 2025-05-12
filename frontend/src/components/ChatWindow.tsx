// frontend/src/components/ChatWindow.tsx
import React, { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import { ArrowDown } from 'lucide-react';

interface ChatWindowProps {
  messages: Array<{
    role: string;
    message: string;
    timestamp: string;
  }>;
  isLoading: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = React.useState(false);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  // Check scroll position to show/hide scroll button
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
      setShowScrollButton(!isNearBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative flex-1 overflow-hidden">
      <div 
        ref={containerRef}
        className="h-full overflow-y-auto p-4 space-y-4"
      >
        {messages.map((msg, index) => (
          <ChatMessage key={index} message={msg} />
        ))}
        
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="bg-gray-200 text-gray-800 rounded-lg px-4 py-2 max-w-[70%]">
              <div className="flex items-center">
                <span className="font-semibold">QueryBot</span>
                <div className="ml-2 flex space-x-1">
                  <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" 
                       style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" 
                       style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" 
                       style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 right-4 bg-blue-500 text-white p-2 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
          aria-label="Scroll to bottom"
        >
          <ArrowDown size={20} />
        </button>
      )}
    </div>
  );
};

export default ChatWindow;