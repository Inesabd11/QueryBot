"use client"
import type React from "react"
import { useState, useEffect, useRef, useMemo } from "react"
import { ThemeProvider, useTheme } from "@/components/chat/theme/ThemeContext"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { ChatHistoryContainer } from "@/components/ChatHistory"
import { MessageBubble } from "@/components/MessageBubble"
import { type ChatHistory, useChat } from "@/hooks/useChat" 
import { useFileUpload } from "@/hooks/useFileUploads"
import { BotMessageSquare, MessageCircleMore } from "lucide-react"
import "./globals.css"
import {
  Search,
  Trash2,
  UploadCloud,
  Sun,
  Moon,
  FileText,
  X,
  ChevronLeft,
  Send,
  Loader2,
  Menu,
  Bot,
  ArrowDown,
} from "lucide-react"
import en from "@/lang/en"
import fr from "@/lang/fr"
import { LanguageProvider, useLanguage } from "@/hooks/useLanguage"

function ChatBot() {
  const { theme, toggleTheme, getThemeClasses } = useTheme()
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
    uploadFile,
    uploadAllFiles,
    removeFile,
    isUploading,
    uploadError,
    clearError: clearUploadError,
  } = useFileUpload(
    // Called when a file is being uploaded (to add as user message)
    (file) => addUserFileMessage(file),
    // Called when upload completes (to add bot response)
    (result) => {
      if (result.success) {
        addBotMessage(
          result.message ||
            `File "${result.filename}" has been uploaded and processed successfully. You can now ask questions about its content.`,
        )
      } else {
        addBotMessage(`Failed to upload "${result.filename}": ${result.error}`, true)
      }
    },
  )

  // State Management
  const [inputText, setInputText] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [newMessageAlert, setNewMessageAlert] = useState(false)

  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Dummy chat history data (replace with real data or state as needed)
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([])

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      const shouldAutoScroll = isUserNearBottom()
      if (shouldAutoScroll) {
        scrollToBottom()
      } else {
        setNewMessageAlert(true)
      }
    }
  }, [messages])

  // Check if user is near bottom of chat
  const isUserNearBottom = () => {
    if (!chatContainerRef.current) return true

    const container = chatContainerRef.current
    const scrollBottom = container.scrollHeight - container.scrollTop - container.clientHeight
    return scrollBottom < 100 // If user is within 100px of bottom
  }

  // Scroll to bottom
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
    setNewMessageAlert(false)
  }

  // Enhanced send handler with file upload
  const handleSend = async () => {
    if (inputText.trim() === "" && uploadedFiles.length === 0) return

    try {
      // Handle file uploads first if any
      if (uploadedFiles.length > 0) {
        await uploadAllFiles()
      }

      // Send the text message if there is one
      if (inputText.trim()) {
        await sendMessage(inputText)
        setInputText("")
      }
    } catch (err) {
      console.error("Failed to send message:", err)
    }
  }

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Search Messages
  const filteredMessages = useMemo(() => {
    if (!searchQuery) return messages
    return messages.filter((msg) => msg.content.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [messages, searchQuery])

  // Add error notification
  useEffect(() => {
    if (error) {
      console.error("Chat Error:", error)

      // Auto-clear error after 5 seconds
      const timer = setTimeout(() => {
        clearError()
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [error, clearError])

  // Handle upload errors
  useEffect(() => {
    if (uploadError) {
      console.error("Upload Error:", uploadError)

      // Auto-clear upload error after 5 seconds
      const timer = setTimeout(() => {
        clearUploadError()
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [uploadError, clearUploadError]) 
  // Auto-resize textarea
  const adjustTextareaHeight = (element: HTMLTextAreaElement) => {
    element.style.height = "auto"
    element.style.height = `${Math.min(element.scrollHeight, 120)}px`
  }

  const { language, setLanguage } = useLanguage()
  const t = language === "fr" ? fr : en

  // Render
  return (
    <div
      className={`
        flex h-screen overflow-hidden
        ${
          theme === "black-dark"
            ? "dark bg-gray-900 text-white"
            : theme === "blue-dark"
              ? "dark bg-gray-800 text-white"
              : "bg-gray-50 text-black"
        }
        transition-colors duration-300
      `}
    >
      {/* Sidebar */}
      <div
        className={`
          flex-shrink-0 
          ${getThemeClasses().sidebar}
          transition-all duration-300 ease-in-out
          ${isSidebarOpen ? "w-72" : "w-0"}
          md:relative absolute h-full z-20
        `}
      >
        <ChatHistoryContainer onClose={() => setIsSidebarOpen(false)} isSidebarOpen={isSidebarOpen} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full">
        {/* Header */}
        <header
          className={`
            flex justify-between items-center p-4 border-b mt-4 rounded-xl
            ${getThemeClasses().header}
            shadow-lg z-10
          `}
        >
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              {isSidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
            </button>

            <div className="flex items-center gap-2">
              <div
                className={
                  getThemeClasses().bg +
                  " h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center"
                }
              >
                <BotMessageSquare className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500">
                  {t.appName}
                </h1> 
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <div className="relative">
              <label htmlFor="lang-switch" className="sr-only">{t.language}</label>
              <div className="flex gap-1 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <button
                  id="lang-switch-en"
                  aria-label={t.english}
                  className={`px-2 py-1 flex items-center gap-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${language === "en" ? "bg-blue-500 text-white" : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"}`}
                  onClick={() => setLanguage("en")}
                  tabIndex={0}
                >
                  <span role="img" aria-label="English">🇬🇧</span> EN
                </button>
                <button
                  id="lang-switch-fr"
                  aria-label={t.french}
                  className={`px-2 py-1 flex items-center gap-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${language === "fr" ? "bg-blue-500 text-white" : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"}`}
                  onClick={() => setLanguage("fr")}
                  tabIndex={0}
                >
                  <span role="img" aria-label="Français">🇫🇷</span> FR
                </button>
              </div>
            </div>
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              aria-label={t.theme}
            >
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {/* Search Toggle */}
            <button
              onClick={() => setIsSearching(!isSearching)}
              className={`p-2 rounded-full transition-colors duration-200 ${
                isSearching
                  ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
              aria-label={t.search}
            >
              <Search size={18} />
            </button>

            {/* Clear History */}
            <button
              onClick={() => {
                if (confirm(t.clearConversationConfirm)) {
                  clearChat()
                }
              }}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              aria-label={t.clearConversation}
            >
              <Trash2 size={18} />
            </button>
          </div>
        </header>

        {/* Search Bar */}
        {isSearching && (
          <div
            className={`
              p-3 border-b
              ${
                theme === "black-dark"
                  ? "bg-gray-800 border-gray-700"
                  : theme === "blue-dark"
                    ? "bg-blue-900 border-blue-800"
                    : "bg-white border-gray-200"
              }
              animate-fadeIn
            `}
          >
            <div className="relative">
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`
                  w-full p-2 pl-8 rounded-lg border 
                  ${
                    theme === "light"
                      ? "bg-gray-50 border-gray-200 text-black"
                      : "bg-gray-700 border-gray-600 text-white"
                  }
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                `}
              />
              <Search size={16} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  aria-label={t.search}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Error Banner */}
        {(error || uploadError) && (
          <div className="p-4 bg-red-100 border-l-4 border-red-500 text-red-700 mb-4 rounded shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm">{error || uploadError}</p>
              </div>
              <button
                onClick={() => {
                  clearError()
                  clearUploadError()
                }}
                className="text-red-700 hover:text-red-900 focus:outline-none"
                aria-label="Close error"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Chat Messages */}
        <div
          ref={chatContainerRef}
          className={`
            flex-1 overflow-y-auto p-4 rounded-xl shadow-lg
            ${getThemeClasses().chatBg}
            relative
          `}
        >
          {filteredMessages.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center text-gray-400">
              <div className="w-24 h-24 mb-6 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                <MessageCircleMore size={48} className="text-gray-400 dark:text-gray-300" />
              </div>
              <h2 className="text-xl font-medium mb-2 text-gray-600 dark:text-gray-500">{t.startConversation}</h2>
              <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm">
                {t.askAnything}
              </p>
            </div>
          ) : (
            <>
              <div className="pb-2">
                {filteredMessages.map((message, index) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    showSenderIcon={index === 0 || filteredMessages[index - 1].sender !== message.sender}
                    getThemeClasses={getThemeClasses}
                  />
                ))}
                {(isLoading || isUploading) && (
                  <div className="flex justify-start mb-4 items-end">
                    <div
                      className={
                        "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center mr-2 " +
                        (theme === "light"
                          ? "bg-gradient-to-br from-purple-500 to-blue-500"
                          : theme === "blue-dark"
                            ? "bg-gradient-to-br from-blue-500 to-indigo-700"
                            : "bg-gradient-to-br from-gray-600 to-gray-700")
                      }
                    >
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                    <div className={getThemeClasses().bg + " p-3 rounded-2xl rounded-tl-sm shadow-sm"}>
                      <div className="flex space-x-2">
                        <div className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse"></div>
                        <div className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse delay-75"></div>
                        <div className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse delay-150"></div>
                      </div>
                      <p className="text-xs mt-1 opacity-70">{isUploading ? "Processing files..." : "Thinking..."}</p>
                    </div>
                  </div>
                )}
              </div>
              <div ref={chatEndRef} />
            </>
          )}

          {/* Scroll to bottom button */}
          {newMessageAlert && (
            <button
              onClick={scrollToBottom}
              className="absolute bottom-4 right-4 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-200 animate-bounce"
            >
              <ArrowDown size={16} />
            </button>
          )}
        </div>

        {/* File Preview */}
        {uploadedFiles.length > 0 && (
          <div
            className={`
              flex gap-2 p-2 overflow-x-auto border-t
              ${
                theme === "black-dark"
                  ? "bg-gray-800 border-gray-700"
                  : theme === "blue-dark"
                    ? "bg-blue-900 border-blue-800"
                    : "bg-white border-gray-200"
              }
            `}
          >
            {uploadedFiles.map((upload, index) => (
              <div
                key={index}
                className="relative flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm"
              >
                {upload.type.startsWith("image/") ? (
                  <img
                    src={upload.preview || "/placeholder.svg"}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <FileText size={24} className="text-gray-500 dark:text-gray-400" />
                  </div>
                )}
                <button
                  onClick={() => removeFile(index)}
                  className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full shadow-sm hover:bg-red-600 transition-colors duration-200"
                >
                  <X size={10} />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
                  {upload.file.name.substring(0, 12)}
                </div>
                {/* Upload status indicator */}
                {isUploading && (
                  <div className="absolute top-1 left-1">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div
          className={`
            p-4 border-t rounded-xl shadow-lg mb-4
            ${getThemeClasses().messageBox}
          `}
        >
          <div className="flex items-end gap-2">
            {/* File Upload */}
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || isUploading}
              className={`
                p-2 rounded-full transition-colors duration-200
                ${
                  isLoading || isUploading
                    ? "opacity-50 cursor-not-allowed"
                    : theme === "light"
                      ? "hover:bg-gray-100 text-gray-600"
                      : "hover:bg-gray-700 text-gray-300"
                }
              `}
              aria-label={t.uploadFile}
            >
              <UploadCloud size={20} />
            </button>

            {/* Text Input */}
            <div className="flex-1 relative">
              <textarea
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value)
                  adjustTextareaHeight(e.target)
                }}
                onKeyDown={handleKeyPress}
                disabled={isLoading || isUploading}
                placeholder={isConnected ? t.typeMessage : t.connecting}
                rows={1}
                className={`
                  w-full p-3 rounded-2xl shadow-sm resize-none
                  ${
                    theme === "blue-dark" || theme === "black-dark"
                      ? "bg-gray-700 text-white placeholder-gray-400 border-gray-600"
                      : "bg-gray-50 text-black placeholder-gray-500 border-gray-200"
                  }
                  ${isLoading || isUploading ? "opacity-50 cursor-not-allowed" : ""}
                  focus:outline-none focus:ring-2 focus:ring-blue-500 border
                `}
                style={{
                  minHeight: "46px",
                  maxHeight: "120px",
                }}
                aria-label={t.typeMessage}
              />
            </div>

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={isLoading || isUploading || (inputText.trim() === "" && uploadedFiles.length === 0)}
              className={`
                p-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700
                text-white shadow-md transition-all duration-200
                ${
                  isLoading || isUploading || (inputText.trim() === "" && uploadedFiles.length === 0)
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:shadow-lg"
                }
              `}
              aria-label={t.send}
            >
              {isLoading || isUploading ? <Loader2 size={20} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
          <div className="text-xs text-gray-400 mt-2 text-center">{t.pressEnter}</div>
        </div>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <ChatBot />
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
