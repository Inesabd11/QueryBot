"use client"

import React from "react"
import { Bot, User, Copy, ThumbsUp, ThumbsDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface MessageBubbleProps {
  message: any
  showSenderIcon: boolean
  getThemeClasses: () => any
  isStreaming?: boolean
  t: any
}

export const MessageBubble = React.memo<MessageBubbleProps>(
  ({ message, showSenderIcon, getThemeClasses, isStreaming = false, t }) => {
    const isUser = message.sender === "user"
    const isBot = message.sender === "bot"

    const handleCopy = () => {
      navigator.clipboard.writeText(message.content)
    }

    return (
      <div
        className={cn(
          "group flex gap-4 px-4 py-6 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors",
          isUser && "bg-blue-50/30 dark:bg-blue-900/20",
          isBot && "bg-gradient-to-br from-purple-50 to-pink-50/30 dark:from-purple-900/20 dark:to-pink-900/20"
        )}
      >
        {/* Avatar */}
        <div className="flex-shrink-0">
          {showSenderIcon && (
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                isUser ? "bg-blue-500 text-white" : "bg-gradient-to-br from-purple-500 to-pink-500 text-white",
              )}
            >
              {isUser ? <User size={16} /> : <Bot size={16} />}
            </div>
          )}
        </div>

        {/* Message Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-sm">{isUser ? t.you : t.assistant}</span>
            <span className="text-xs text-gray-500">
              {new Date(Number.parseInt(message.timestamp)).toLocaleTimeString()}
            </span>
          </div>

          <div
            className={cn(
              "prose prose-sm max-w-none dark:prose-invert",
              "prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800",
              "prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded",
              isStreaming && "animate-pulse",
            )}
          >
            {message.content}
            {isStreaming && <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse ml-1" />}
          </div>

          {/* Message Actions */}
          {!isUser && !isStreaming && (
            <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title={t.copyMessage}
              >
                <Copy size={14} />
              </button>
              <button
                className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title={t.goodResponse}
              >
                <ThumbsUp size={14} />
              </button>
              <button
                className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title={t.badResponse}
              >
                <ThumbsDown size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    )
  },
)

MessageBubble.displayName = "MessageBubble"
