'use client';
import React from 'react';
import MessageBubble from './MessageBubble';
import LoadingBubble from './LoadingBubble';
import { useTheme } from './theme/ThemeContext';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'bot';
  content: string;
}
interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isLoading }) => {
  const { getThemeClasses } = useTheme();
  const themeClasses = getThemeClasses();

  return (
    <div className={`flex-1 overflow-y-auto px-4 py-2 space-y-3 ${themeClasses.bg}`}>
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <MessageBubble role={msg.role} content={msg.content} />
        </div>
      ))}
      {isLoading && (
        <div className="flex justify-start">
          <LoadingBubble />
        </div>
      )}
    </div>
  );
};
export default MessageList;
