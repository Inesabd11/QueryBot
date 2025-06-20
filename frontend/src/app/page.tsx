"use client"

import { ErrorBoundary } from "@/components/ErrorBoundary"
import { ThemeProvider } from "@/components/chat/theme/ThemeContext"
import { LanguageProvider } from "@/components/useLanguage"
import { ChatInterface } from "@/components/chat/ChatInterface"

export default function Page() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <ChatInterface />
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
