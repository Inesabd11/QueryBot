"use client"

import React, { useState, useRef, useCallback } from "react"
import { Send, Loader2, UploadCloud, Keyboard } from "lucide-react"
import { FilePreview } from "./FilePreview" // Adjust the import path as necessary

interface FilePreviewProps {
  files: any[]
  onRemoveFile: (index: number) => void
  theme: string
  borderClass?: string
}

interface ChatInputProps {
  isLoading: boolean
  isUploading: boolean
  isConnected: boolean
  uploadedFiles: any[]
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onSendMessage: (text: string) => void
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveFile: (index: number) => void
  onShowShortcuts: () => void
  getThemeClasses: () => any
  theme: string
  t: any
}

export const ChatInput = React.memo<ChatInputProps>(
  ({
    isLoading,
    isUploading,
    isConnected,
    uploadedFiles,
    fileInputRef,
    onSendMessage,
    onFileUpload,
    onRemoveFile,
    onShowShortcuts,
    getThemeClasses,
    theme,
    t,
  }) => {
    const [inputText, setInputText] = useState("")
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const adjustTextareaHeight = useCallback((element: HTMLTextAreaElement) => {
      element.style.height = "auto"
      element.style.height = `${Math.min(element.scrollHeight, 200)}px`
    }, [])

    const handleSend = useCallback(async () => {
      if (inputText.trim() === "" && uploadedFiles.length === 0) return

      const text = inputText
      setInputText("")

      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }

      await onSendMessage(text)
    }, [inputText, uploadedFiles.length, onSendMessage])

    const handleKeyPress = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault()
          handleSend()
        }
      },
      [handleSend],
    )

    const handleInputChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputText(e.target.value)
        adjustTextareaHeight(e.target)
      },
      [adjustTextareaHeight],
    )

    const isDisabled = isLoading || isUploading
    const canSend = !isDisabled && (inputText.trim() !== "" || uploadedFiles.length > 0)

    return (
      <div className={`border-t ${getThemeClasses().border}`}>
        <FilePreview files={uploadedFiles} onRemoveFile={onRemoveFile} theme={theme} borderClass={getThemeClasses().border} />

        <div className="p-4">
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={handleKeyPress}
                disabled={isDisabled}
                placeholder={isConnected ? t.inputPlaceholder : t.connectingPlaceholder}
                rows={1}
                className={`
                w-full px-4 py-3 pr-20 rounded-2xl resize-none border-0 
                ${getThemeClasses().input}
                focus:outline-none focus:ring-2 focus:ring-blue-500 
                shadow-lg transition-all duration-200
                placeholder:text-gray-400 dark:placeholder:text-gray-500
              `}
                style={{
                  minHeight: "56px",
                  maxHeight: "200px",
                  fontSize: "16px",
                  lineHeight: "1.5",
                }}
              />

              <div className="absolute right-3 bottom-3 flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={onFileUpload}
                  multiple
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isDisabled}
                  className={`
                  p-2 rounded-lg transition-all duration-200
                  ${
                    theme === "light"
                      ? "hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                      : "hover:bg-gray-700 text-gray-400 hover:text-gray-300"
                  }
                  ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
                `}
                  title="Upload file"
                >
                  <UploadCloud size={20} />
                </button>

                <button
                  onClick={handleSend}
                  disabled={!canSend}
                  className={`
                  p-2 rounded-lg transition-all duration-200
                  ${
                    canSend
                      ? "bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg hover:scale-105"
                      : "opacity-50 cursor-not-allowed bg-gray-300 dark:bg-gray-600 text-gray-500"
                  }
                `}
                  title="Send message"
                >
                  {isLoading || isUploading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Enter</kbd>
                  {t.pressEnter}
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Shift</kbd>+
                  <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Enter</kbd>
                  {t.shiftEnter}
                </span>
              </div>
              <button
                onClick={onShowShortcuts}
                className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <Keyboard size={14} />
                <span>{t.shortcuts}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  },
)

ChatInput.displayName = "ChatInput"
