'use client';
import React from 'react';
import { useTheme } from './theme/ThemeContext';

interface MessageBubbleProps {
  role: 'user' | 'assistant' | 'bot';
  content: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ role, content }) => {
  const { getThemeClasses } = useTheme();
  const themeClasses = getThemeClasses();
  const isUser = role === 'user';

  return (
    <div
      className={`max-w-[80%] px-4 py-2 rounded-lg text-sm whitespace-pre-wrap break-words
        ${isUser ? 'self-end bg-blue-600 text-white' : `${themeClasses.bg} ${themeClasses.text} border ${themeClasses.border}`}`}
    >
      {content}
    </div>
  );
};

export default MessageBubble;