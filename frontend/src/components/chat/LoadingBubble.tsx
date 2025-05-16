'use client';
import React from 'react';
import { useTheme } from './theme/ThemeContext';

const LoadingBubble: React.FC = () => {
    const { getThemeClasses } = useTheme();
    const themeClasses = getThemeClasses();
    
    return (
        <div
      className={`max-w-[80%] px-4 py-2 rounded-lg text-sm flex space-x-1
        ${themeClasses.bg} ${themeClasses.text} border ${themeClasses.border}`}
    >
      <span className="animate-bounce">.</span>
      <span className="animate-bounce delay-100">.</span>
      <span className="animate-bounce delay-200">.</span>
    </div>
    );
};
export default LoadingBubble;