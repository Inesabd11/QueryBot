'use client';
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { getThemeClasses as getThemeClassesUtil } from './ThemeUtils';
import type { ThemeName } from './ThemeUtils';

interface ThemeContextProps {
  theme: string;
  toggleTheme: () => void;
  getThemeClasses: () => ReturnType<typeof getThemeClassesUtil>;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<ThemeName>('blue-dark');

  const toggleTheme = () => {
    setTheme((prev: ThemeName) => {
      return prev === 'blue-dark' ? 'light' : 'blue-dark';
    });
  };


  const getThemeClasses = () => getThemeClassesUtil(theme);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, getThemeClasses }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
