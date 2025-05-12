// frontend/src/components/ChatInput.tsx
import React, { useRef, useState } from 'react';
import { Send, Paperclip, X, FileText } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onFileUpload: (file: File) => void;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, onFileUpload, isLoading }) => {
  const [message, setMessage] = useState('');
  const [showDropzone, setShowDropzone] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message);
      setMessage('');
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setSelectedFile(acceptedFiles[0]);
      }
    },
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv']
    },
    multiple: false
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (message.trim() && !isLoading) {
        onSendMessage(message);
        setMessage('');
        
        // Reset textarea height
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
  };

  const uploadSelectedFile = () => {
    if (selectedFile) {
      onFileUpload(selectedFile);
      setSelectedFile(null);
      setShowDropzone(false);
    }
  };

  const cancelFileSelection = () => {
    setSelectedFile(null);
    setShowDropzone(false);
  };

  return (
    <div className="border-t border-gray-200 px-4 py-3 bg-white">
      {showDropzone && (
        <div className="mb-4">
          {!selectedFile ? (
            <div 
              {...getRootProps()} 
              className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center cursor-pointer hover:bg-blue-50 transition-colors"
            >
              <input {...getInputProps()} />
              <p className="text-blue-500 flex items-center justify-center gap-2">
                <Paperclip size={20} />
                Drag & drop a file here, or click to select
              </p>
              <p className="text-xs text-gray-500 mt-2">Supported formats: PDF, DOCX, TXT, CSV</p>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText size={20} className="text-blue-500" />
                  <div>
                    <p className="font-medium text-gray-700">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={uploadSelectedFile}
                    className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                  >
                    Upload
                  </button>
                  <button 
                    onClick={cancelFileSelection}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end">
        <button 
          type="button" 
          className="p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
          onClick={() => setShowDropzone(!showDropzone)}
          aria-label="Attach file"
        >
          <Paperclip size={20} />
        </button>
        
        <div className="relative flex-1 mx-2">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-hidden"
            disabled={isLoading}
            rows={1}
            style={{ maxHeight: '150px' }}
          />
        </div>
        
        <button
          type="submit"
          className={`p-3 rounded-full ${
            message.trim() && !isLoading
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-200 text-gray-400'
          } transition-colors`}
          disabled={!message.trim() || isLoading}
          aria-label="Send message"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};

export default ChatInput;