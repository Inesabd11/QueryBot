// app/fonts.ts 
import { Inter } from 'next/font/google';
import localFont from 'next/font/local';

// Use local font files for Geist instead of Google Fonts
export const geist = localFont({
  src: [
    {
      path: '../public/fonts/Geist-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/Geist-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/fonts/Geist-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  display: 'swap',
  variable: '--font-geist',
});

export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});