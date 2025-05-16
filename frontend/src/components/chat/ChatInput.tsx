'use client';
import React, { useState, useRef } from 'react';
import { Send, Upload } from 'react-feather';
import { useTheme } from '@/components/chat/theme/ThemeContext';
import FilePreview from './FilePreview';

interface ChatInputProps {
  onSendMessage: (message: string, files?: File[]) => void;
  isSending: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isSending }) => {
  const { getThemeClasses } = useTheme();
  const themeClasses = getThemeClasses();

  const [input, setInput] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSend = () => {
    if (!input.trim() && attachedFiles.length === 0) return;
    onSendMessage(input.trim(), attachedFiles);
    setInput('');
    setAttachedFiles([]);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!e.target.files) return;
    if (files) {
      setAttachedFiles((prevFiles) => [...prevFiles, ...Array.from(files)]);
    }
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setAttachedFiles((files) => files.filter((_, i) => i !== index));
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className={`${themeClasses.bg} ${themeClasses.border} border-t p-4 flex flex-col space-y-2`}
    >
      {attachedFiles.length > 0 && (
        <div className="flex space-x-2 overflow-x-auto pb-1">
          {attachedFiles.map((file, idx) => (
            <div
              key={idx}
              className={`${themeClasses.bg} rounded-md p-1 pr-6 flex items-center relative`}
            >
              <span className="truncate max-w-xs">{file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(idx)}
                className="absolute right-1 top-1 text-gray-500 hover:text-red-500"
                aria-label="Remove file"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center space-x-2">
        <textarea
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type your message..."
          className={`flex-grow resize-none rounded-md border ${themeClasses.border} ${themeClasses.input} p-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
        />
        <input
          type="file"
          multiple
          ref={fileInputRef}
          onChange={onFileChange}
          className="hidden"
          accept="image/*,video/*,application/pdf,text/plain"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          aria-label="Attach files"
        >
          <Upload size={20} />
        </button>
        <button
          type="button"
          onClick={handleSend}
          disabled={isSending}
          className="p-2 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition"
          aria-label="Send message"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
