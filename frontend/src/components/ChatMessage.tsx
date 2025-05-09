// frontend/src/components/ChatMessage.tsx
import React from "react";
import {formatDistanceToNow} from 'date-fns';
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  message: {
    role: string;
    message: string;
    timestamp: string;
  };
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const time = new Date(message.timestamp);
  const formattedTime = formatDistanceToNow(time, { addSuffix: true });

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[70%] rounded-lg px-4 py-2 ${
          isUser ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
        }`}
      >
        <div className="flex items-center mb-1">
          <span className="font-semibold">{isUser ? 'You' : 'QueryBot'}</span>
          <span className="text-xs ml-2 opacity-70">{formattedTime}</span>
        </div>
        <div className="prose prose-sm">
          <ReactMarkdown>{message.message}</ReactMarkdown>
        </div>
      </div>
    </div>
  );

};
export default ChatMessage;