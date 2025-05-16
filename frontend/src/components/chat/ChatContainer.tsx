'use client';

import React, { useState } from 'react';
import ChatInput from './ChatInput';
import MessageList from './MessageList';
import { useTheme } from './theme/ThemeContext';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'bot';
  content: string;
}

const ChatContainer: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const { getThemeClasses } = useTheme();
  const themeClasses = getThemeClasses();

  const sendMessage = async (content: string, files?: File[]) => {
    if (!content && (!files || files.length === 0)) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsSending(true);

    // Simulate bot response after a delay
    setTimeout(() => {
      const botMessage: Message = {
        id: crypto.randomUUID(),
        role: 'bot',
        content: `Echo: ${content}`,
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsSending(false);
    }, 1200);
  };

  return (
    <div className={`flex flex-col h-full w-full ${themeClasses.bg} ${themeClasses.text}`}>
      <MessageList messages={messages} isLoading={isSending} />
      <ChatInput onSendMessage={sendMessage} isSending={isSending} />
    </div>
  );
};

export default ChatContainer;
