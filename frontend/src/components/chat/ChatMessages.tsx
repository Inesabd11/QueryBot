"use client"

import React, { useEffect, useRef, useCallback, useMemo } from "react"
import { MessageBubble } from "@/components/MessageBubble"
import { WelcomeScreen } from "@/components/chat/WelcomeScreen"
import type { FixedSizeList as List } from "react-window"

interface ChatMessagesProps {
  messages: any[]
  isLoading: boolean
  isUploading: boolean
  selectedModel: string
  onSelectModel: (model: string) => void
  onSetNewMessageAlert: (show: boolean) => void
  getThemeClasses: () => any
  theme: string
  t: any
}

export const ChatMessages = React.memo<ChatMessagesProps>(
  ({
    messages,
    isLoading,
    isUploading,
    selectedModel,
    onSelectModel,
    onSetNewMessageAlert,
    getThemeClasses,
    theme,
    t,
  }) => {
    const chatContainerRef = useRef<HTMLDivElement>(null)
    const chatEndRef = useRef<HTMLDivElement>(null)
    const listRef = useRef<List>(null)

    const scrollToBottom = useCallback(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
      onSetNewMessageAlert(false)
    }, [onSetNewMessageAlert])

    const isUserNearBottom = useCallback(() => {
      if (!chatContainerRef.current) return true
      const container = chatContainerRef.current
      const scrollBottom = container.scrollHeight - container.scrollTop - container.clientHeight
      return scrollBottom < 100
    }, [])

    useEffect(() => {
      if (messages.length > 0) {
        const shouldAutoScroll = isUserNearBottom()
        if (shouldAutoScroll) {
          scrollToBottom()
        } else {
          onSetNewMessageAlert(true)
        }
      }
    }, [messages, isUserNearBottom, scrollToBottom, onSetNewMessageAlert])

    // Memoize messages with loading state
    const allMessages = useMemo(() => {
      const messageList = [...messages]
      if (isLoading || isUploading) {
        messageList.push({
          id: "loading-bubble",
          role: "assistant",
          sender: "bot",
          type: "text",
          content: t.thinking,
          timestamp: Date.now().toString(),
          metadata: { isLoading: true },
        })
      }
      return messageList
    }, [messages, isLoading, isUploading, t.thinking])

    if (messages.length === 0) {
      return <WelcomeScreen selectedModel={selectedModel} onSelectModel={onSelectModel} theme={theme} t={t} />
    }

    return (
      <div className="flex-1 flex flex-col min-h-0">
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto scroll-smooth"
          style={{ scrollBehavior: "smooth" }}
        >
          <div className="mx-auto max-w-4xl px-4">
            <div className="py-4 space-y-6">
              {allMessages.map((message, index) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  showSenderIcon={index === 0 || allMessages[index - 1].sender !== message.sender}
                  getThemeClasses={getThemeClasses}
                  isStreaming={message.metadata?.isLoading}
                  t={t}
                />
              ))}
            </div>
            <div ref={chatEndRef} className="h-4" />
          </div>
        </div>
      </div>
    )
  },
)

ChatMessages.displayName = "ChatMessages"
