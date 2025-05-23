import { useState, useRef } from 'react';
import { FileUpload } from '@/hooks/chat';  // Updated import path
import { getFileTypeIcon } from '@/utils/fileUtils';

export const useFileUpload = () => {
  const [uploadedFiles, setUploadedFiles] = useState<FileUpload[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newFiles: FileUpload[] = Array.from(files).map(file => ({
        file,
        preview: file.type.startsWith('image/') 
          ? URL.createObjectURL(file) 
          : getFileTypeIcon(file.type),
        type: file.type
      }));
      setUploadedFiles(prev => [...prev, ...newFiles]);
      
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  return {
    uploadedFiles,
    setUploadedFiles,
    fileInputRef,
    handleFileUpload
  };
};