import React, { useState } from "react";
import { UploadCloud } from "lucide-react";

const ChatInput = () => {
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      console.log("Selected file:", file.name);
    }
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      console.log("Sending message:", message);
      setMessage("");
    }
 
    if (selectedFile) {
      console.log("Sending file:", selectedFile.name);
      setSelectedFile(null);
     }
  };
 
  return (
    <div className="flex items-center gap-2 p-2 border-t border-gray-300">
      {/* Upload Button */}
      <div className="flex items-center space-x-2">
        <input
          type="file"
          id="upload-file"
          onChange={handleFileChange}
          className="hidden"
        />
        <label
          htmlFor="upload-file"
          className="cursor-pointer p-2 border border-dashed border-gray-300 rounded-md hover:bg-gray-100 flex items-center space-x-1 transition"
        >
          <UploadCloud className="w-5 h-5 text-blue-600" />
          <span className="text-sm text-gray-700">Upload File</span>
        </label>
      </div>

      {/* File name preview */}
      {selectedFile && (
        <span className="text-sm text-gray-600 truncate max-w-[200px]">
          {selectedFile.name}
        </span>
      )}

      {/* Message input */}
      <input
        type="text"
        className="flex-1 border border-gray-300 rounded px-2 py-1"
        placeholder="Type a message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      {/* Send button */}
      <button
        onClick={handleSendMessage}
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded"
      >
        ➤
      </button>
    </div>
  );
};

export default ChatInput;
