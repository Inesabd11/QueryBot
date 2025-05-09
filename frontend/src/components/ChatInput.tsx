// frontend/src/components/ChatInput.tsx
import React, { useState } from 'react';
import { Send, Paperclip } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onFileUpload: (file: File) => void;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, onFileUpload, isLoading }) => {
  const [message, setMessage] = useState('');
  const [showDropzone, setShowDropzone] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        onFileUpload(acceptedFiles[0]);
        setShowDropzone(false);
      }
    },
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv']
    }
  });

  return (
    <div className="border-t border-gray-200 px-4 py-2">
      {showDropzone && (
        <div 
          {...getRootProps()} 
          className="border-2 border-dashed border-blue-300 rounded-lg p-6 mb-4 text-center cursor-pointer hover:bg-blue-50"
        >
          <input {...getInputProps()} />
          <p className="text-blue-500">Drag & drop a file here, or click to select file</p>
          <p className="text-xs text-gray-500 mt-1">Supported formats: PDF, DOCX, TXT, CSV</p>
          <button 
            className="mt-2 text-xs text-gray-500 underline" 
            onClick={() => setShowDropzone(false)}
          >
            Cancel
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center">
        <button 
          type="button" 
          className="p-2 rounded-full text-gray-500 hover:bg-gray-100"
          onClick={() => setShowDropzone(!showDropzone)}
        >
          <Paperclip size={20} />
        </button>
        
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 mx-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
        
        <button
          type="submit"
          className={`p-2 rounded-full ${
            message.trim() && !isLoading
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-400'
          }`}
          disabled={!message.trim() || isLoading}
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default ChatInput;