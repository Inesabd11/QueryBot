"use client"

import React, { useState, useCallback, useMemo } from "react"
import { useTheme } from "@/components/chat/theme/ThemeContext"
import { useLanguage } from "@/components/useLanguage"
import { ChatSidebar } from "./ChatSidebar"
import { ChatHeader } from "./ChatHeader"
import { ChatMessages } from "./ChatMessages"
import { ChatInput } from "./ChatInput"
import { useChat } from "@/hooks/useChat"
import { useFileUpload } from "@/hooks/useFileUploads"
import { ErrorToast } from "./ErrorToast"
import { KeyboardShortcuts } from "./KeyboardShortcuts"
import { ScrollToBottom } from "./ScrollToBottom"
import en from "@/lang/en"
import fr from "@/lang/fr"

const ChatInterface = React.memo(() => {
  const { theme, getThemeClasses } = useTheme()
  const { language } = useLanguage()
  const t = useMemo(() => (language === "fr" ? fr : en), [language])

  const {
    messages,
    isLoading,
    error,
    isConnected,
    sendMessage,
    addUserFileMessage,
    addBotMessage,
    clearChat,
    clearError,
  } = useChat()

  const {
    uploadedFiles,
    fileInputRef,
    handleFileUpload,
    uploadAllFiles,
    removeFile,
    isUploading,
    uploadError,
    clearError: clearUploadError,
  } = useFileUpload(
    (file) => addUserFileMessage(file),
    (result) => {
      if (result.success) {
        addBotMessage(
          result.message ||
            `File "${result.filename}" uploaded and processed successfully. You can now ask questions about its content.`,
        )
      } else {
        addBotMessage(`Failed to upload "${result.filename}": ${result.error}`, true)
      }
    },
  )

  // State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [selectedModel, setSelectedModel] = useState("gpt-4o")
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [newMessageAlert, setNewMessageAlert] = useState(false)

  // Handlers
  const handleSendMessage = useCallback(
    async (text: string) => {
      try {
        if (uploadedFiles.length > 0) {
          await uploadAllFiles()
        }
        if (text.trim()) {
          await sendMessage(text)
        }
      } catch (err) {
        console.error("Failed to send message:", err)
      }
    },
    [uploadedFiles, uploadAllFiles, sendMessage],
  )

  const handleClearChat = useCallback(() => {
    clearChat()
    setNewMessageAlert(false)
  }, [clearChat])

  const handleScrollToBottom = useCallback(() => {
    setNewMessageAlert(false)
  }, [])

  return (
    <div className={`flex h-screen ${getThemeClasses().bg} ${getThemeClasses().text}`}>
      <ChatSidebar
        isOpen={isSidebarOpen}
        onClearChat={handleClearChat}
        theme={theme}
        getThemeClasses={getThemeClasses}
        t={t}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <ChatHeader
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onShowShortcuts={() => setShowShortcuts(true)}
          theme={theme}
          getThemeClasses={getThemeClasses}
          t={t}
        />

        <ChatMessages
          messages={messages}
          isLoading={isLoading}
          isUploading={isUploading}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
          onSetNewMessageAlert={setNewMessageAlert}
          getThemeClasses={getThemeClasses}
          theme={theme}
          t={t}
        />

        <ChatInput
          isLoading={isLoading}
          isUploading={isUploading}
          isConnected={isConnected}
          uploadedFiles={uploadedFiles}
          fileInputRef={fileInputRef}
          onSendMessage={handleSendMessage}
          onFileUpload={handleFileUpload}
          onRemoveFile={removeFile}
          onShowShortcuts={() => setShowShortcuts(true)}
          getThemeClasses={getThemeClasses}
          theme={theme}
          t={t}
        />
      </div>

      <ErrorToast
        error={error || uploadError}
        onClear={() => {
          clearError()
          clearUploadError()
        }}
        theme={theme}
        t={t}
      />

      <ScrollToBottom show={newMessageAlert} onClick={handleScrollToBottom} />

      <KeyboardShortcuts
        show={showShortcuts}
        onClose={() => setShowShortcuts(false)}
        onSend={() => {}} // Will be handled by ChatInput
        theme={theme}
        t={t}
      />
    </div>
  )
})

ChatInterface.displayName = "ChatInterface"

export { ChatInterface }
