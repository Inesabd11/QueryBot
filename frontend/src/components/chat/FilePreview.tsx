'use client';
import React from 'react';
import { FileText, X } from 'react-feather';
import { useTheme } from '@/components/chat/theme/ThemeContext';

interface FilePreviewProps {
  file: File[];
  onRemove: (index: number) => void;
}

const FilePreview: React.FC<FilePreviewProps> = ({ file, onRemove }) => {
    const { getThemeClasses } = useTheme();
    const themeClasses = getThemeClasses();

  return (
    <div className="flex space-x-2 overflow-x-auto pb-1">
      {file.map((file: File, idx: number) => (
        <div
          key={idx}
          className={`relative flex items-center rounded-md p-1 pr-6 ${themeClasses.bg} ${themeClasses.text} border ${themeClasses.border}`}
        >
          <span className="truncate max-w-xs">{file.name}</span>
          <button
            type="button"
            onClick={() => onRemove(idx)}
            className="absolute right-1 top-1 text-gray-500 hover:text-red-500"
            aria-label="Remove file"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};
export default FilePreview;