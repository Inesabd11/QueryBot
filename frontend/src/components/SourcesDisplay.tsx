'use client';
import React from 'react';
import { useTheme } from './chat/theme/ThemeContext';

interface Source {
  title: string;
  content: string;
  similarity: number;
}

interface SourceDisplayProps {
  sources: Source[];
}

export const SourceDisplay: React.FC<SourceDisplayProps> = ({ sources }) => {
  const { getThemeClasses } = useTheme();
  const themeClasses = getThemeClasses();

  return (
    <div className={`mt-2 space-y-2 ${themeClasses.text}`}>
      <div className="font-medium text-sm opacity-75">Sources:</div>
      {sources.map((source, index) => (
        <div 
          key={index} 
          className={`p-2 rounded-lg text-sm ${themeClasses.messageBox}`}
        >
          <div className="font-medium">{source.title}</div>
          <div className="mt-1 opacity-80 line-clamp-2">{source.content}</div>
          <div className="mt-1 text-xs opacity-60">
            Relevance: {(source.similarity * 100).toFixed(1)}%
          </div>
        </div>
      ))}
    </div>
  );
};