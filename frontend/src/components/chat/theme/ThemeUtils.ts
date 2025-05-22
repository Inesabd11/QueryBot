export type ThemeName = 'light' | 'blue-dark';

export interface ThemeClasses {
  bg: string;
  border: string;
  text: string;
  input: string;
  sidebar: string;
  header: string;
  messageBox: string;
  chatBg: string;
}

export function getThemeClasses(theme: ThemeName): ThemeClasses {
  switch (theme) {
    
    case 'blue-dark':
      return {
        bg: 'bg-gradient-to-br from-[#000028] to-[#000014]',
        border: 'border-[#3c50dc]/20',
        text: 'text-[#f0f0f0]',
        input: 'bg-[#141424] text-[#f0f0f0] placeholder-[#6a6a80]',
        sidebar: 'bg-gradient-to-b from-[#000028] to-[#00003c] border-r border-[#3c50dc]/10',
        header: 'bg-[#000028] border-b border-[#3c50dc]/20 text-[#f0f0f0]',
        messageBox: 'bg-[#141424] border border-[#3c50dc]/20 focus-within:border-[#3c50dc]/60',
        chatBg: 'bg-gradient-to-b from-[#0c0c18] to-[#141424]'
      };
    case 'light':
      return {
        bg: 'bg-gradient-to-br from-[#f0f2ff] to-[#ffffff]',
        border: 'border-[#3c50dc]/20',
        text: 'text-[#212136]',
        input: 'bg-white text-[#212136] placeholder-[#9090a0]',
        sidebar: 'bg-gradient-to-b from-[#f0f2ff] to-[#e8eafd] border-r border-[#3c50dc]/10',
        header: 'bg-[#f0f2ff] border-b border-[#3c50dc]/10 text-[#212136]',
        messageBox: 'bg-white border border-[#3c50dc]/20 focus-within:border-[#3c50dc]/40',
        chatBg: 'bg-gradient-to-b from-[#f8f9ff] to-[#f0f2ff]'
      };
    
  }
}
