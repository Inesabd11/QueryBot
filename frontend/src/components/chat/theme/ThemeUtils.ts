// src/app/chat/theme/ThemeUtils.ts

export type ThemeName = 'default' | 'black-dark' | 'blue-dark';

export interface ThemeClasses {
  bg: string;
  border: string;
  text: string;
  input: string;
}

export function getThemeClasses(theme: ThemeName): ThemeClasses {
  switch (theme) {
    case 'black-dark':
      return {
        bg: 'bg-[#1e1e1e]',
        border: 'border-[#2a2a2a]',
        text: 'text-white',
        input: 'bg-[#2a2a2a] text-white placeholder-gray-400',
      };
    case 'blue-dark':
      return {
        bg: 'bg-[#192233]',
        border: 'border-[#3f3f46]',
        text: 'text-white',
        input: 'bg-[#3f3f46] text-white placeholder-gray-400',
      };
    default:
      return {
        bg: 'bg-white',
        border: 'border-[#e5e7eb]',
        text: 'text-black',
        input: 'bg-white text-black placeholder-gray-500',
      };
  }
}
