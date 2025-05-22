import React from 'react';
import { Loader2 } from 'lucide-react';
import { useTheme } from './chat/theme/ThemeContext';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
    message = 'Loading...',
}) => {
  const { getThemeClasses } = useTheme();
  const themeClasses = getThemeClasses();
  const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-6 w-6',
        lg: 'h-8 w-8',
  };

  return (
    <div className={`flex items-center justify-center p-4 ${themeClasses.text}`}>
      <Loader2 className={`animate-spin ${sizeClasses[size]}`} />
      {message && <span className="ml-2 opacity-75">{message}</span>}
    </div>
  );
};