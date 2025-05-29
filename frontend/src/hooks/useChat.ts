"use client"

import { useState, useEffect, useRef, useCallback } from "react"

export interface ChatMessage {
  id: string
  content: string
  sender: "user" | "bot"
  role: "user" | "assistant"
  timestamp: string
  type: "text" | "file" | "image"
  metadata?: {
    fileName?: string
    fileType?: string
    fileSize?: number
    imageUrl?: string
    sources?: any[]
    isStreaming?: boolean
    isComplete?: boolean
    isSystemMessage?: boolean
    isErrorMessage?: boolean
  }
}

export interface ChatResponse {
  content: string
  role: string
  timestamp: string
  type: string
}

export interface ChatHistory {
  id: string
  title: string
  preview: string
  timestamp: string
  unread?: boolean
}

export interface FileUpload {
  file: File
  type: string
  preview: string
}

interface SSEMessage {
  type: "status" | "stream" | "complete" | "error"
  content: string
  role?: string
  timestamp: string
  accumulated?: string
  metadata?: {
    sources?: any[]
  }
}

interface SSECallbacks {
  onMessage: (message: ChatMessage) => void
  onError: (error: Error) => void
  onStatusUpdate: (status: string) => void
  onStreamStart: () => void
  onStreamEnd: () => void
}

export class SSEService {
  private eventSource: EventSource | null = null
  private currentMessageId: string | null = null
  private accumulatedContent = ""

  constructor(
    private callbacks: SSECallbacks,
    private apiUrl: string = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  ) {}

  async sendMessage(message: string, chatHistory: ChatMessage[] = []) {
    if (this.eventSource) {
      this.eventSource.close()
    }

    try {
      // Reset state
      this.accumulatedContent = ""
      this.currentMessageId = `msg-${Date.now()}`

      this.callbacks.onStreamStart()

      // Make POST request to initiate streaming
      const response = await fetch(`${this.apiUrl}/api/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          message,
          chat_history: chatHistory.map((msg) => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
          })),
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      if (!response.body) {
        throw new Error("No response body")
      }

      // Read the streaming response
      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      try {
        while (true) {
          const { done, value } = await reader.read()

          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split("\n")

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6) // Remove "data: " prefix

              if (data === "[DONE]") {
                this.callbacks.onStreamEnd()
                return
              }

              try {
                const parsed: SSEMessage = JSON.parse(data)
                this.handleMessage(parsed)
              } catch (e) {
                console.warn("Failed to parse SSE message:", data)
              }
            }
          }
        }
      } finally {
        reader.releaseLock()
      }
    } catch (error) {
      this.callbacks.onError(error instanceof Error ? error : new Error("Unknown error occurred"))
      this.callbacks.onStreamEnd()
    }
  }

  private handleMessage(data: SSEMessage) {
    switch (data.type) {
      case "status":
        this.callbacks.onStatusUpdate(data.content)
        break

      case "stream":
        // Update accumulated content
        if (data.accumulated) {
          this.accumulatedContent = data.accumulated
        } else {
          this.accumulatedContent += data.content + " "
        }

        // Send streaming message
        this.callbacks.onMessage({
          id: this.currentMessageId!,
          role: "assistant",
          sender: "bot",
          content: this.accumulatedContent.trim(),
          timestamp: data.timestamp,
          type: "text",
          metadata: {
            isStreaming: true,
          },
        })
        break

      case "complete":
        // Send final complete message
        this.callbacks.onMessage({
          id: this.currentMessageId!,
          role: "assistant",
          sender: "bot",
          content: data.content || this.accumulatedContent.trim(),
          timestamp: data.timestamp,
          type: "text",
          metadata: {
            isStreaming: false,
            isComplete: true,
            sources: data.metadata?.sources || [],
          },
        })
        this.callbacks.onStreamEnd()
        break

      case "error":
        this.callbacks.onError(new Error(data.content))
        this.callbacks.onStreamEnd()
        break

      default:
        console.warn("Unknown SSE message type:", data.type)
    }
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }
  }

  isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN
  }
}

export const useChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(true)
  const sseServiceRef = useRef<SSEService | null>(null)

  // Initialize SSE service
  useEffect(() => {
    const callbacks = {
      onMessage: (message: ChatMessage) => {
        setMessages((prev) => {
          // Replace existing message with same ID or add new one
          const existingIndex = prev.findIndex((m) => m.id === message.id)
          if (existingIndex >= 0) {
            const newMessages = [...prev]
            newMessages[existingIndex] = message
            return newMessages
          }
          return [...prev, message]
        })
      },
      onError: (error: Error) => {
        setError(error.message)
        setIsLoading(false)
        setIsConnected(false)
      },
      onStatusUpdate: (status: string) => {
        console.log("Status:", status)
      },
      onStreamStart: () => {
        setIsLoading(true)
        setError(null)
      },
      onStreamEnd: () => {
        setIsLoading(false)
      },
    }

    sseServiceRef.current = new SSEService(callbacks)
    return () => {
      sseServiceRef.current?.disconnect()
    }
  }, [])

  // Add a text message from the user
  const addUserMessage = useCallback((content: string) => {
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      content,
      sender: "user",
      role: "user",
      timestamp: new Date().toISOString(),
      type: "text",
    }

    setMessages((prev) => [...prev, userMessage])
    return userMessage
  }, [])

  // Add a file message from the user
  const addUserFileMessage = useCallback((fileUpload: FileUpload) => {
    const userMessage: ChatMessage = {
      id: `user-file-${Date.now()}`,
      content: `Uploaded file: ${fileUpload.file.name}`,
      sender: "user",
      role: "user",
      timestamp: new Date().toISOString(),
      type: "file",
      metadata: {
        fileName: fileUpload.file.name,
        fileType: fileUpload.type,
        fileSize: fileUpload.file.size,
      },
    }

    setMessages((prev) => [...prev, userMessage])
    return userMessage
  }, [])

  // Add a bot message
  const addBotMessage = useCallback((content: string, isError = false) => {
    const botMessage: ChatMessage = {
      id: `bot-${Date.now()}`,
      content,
      sender: "bot",
      role: "assistant",
      timestamp: new Date().toISOString(),
      type: "text",
      metadata: {
        isErrorMessage: isError,
      },
    }

    setMessages((prev) => [...prev, botMessage])
    return botMessage
  }, [])

  // Send a message to the chatbot
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return

      try {
        setIsConnected(true)

        // Add user message immediately
        addUserMessage(content)

        // Send message via SSE
        await sseServiceRef.current?.sendMessage(content, messages)
      } catch (err) {
        console.error("Send message error:", err)
        setError(err instanceof Error ? err.message : "Failed to send message")
        setIsLoading(false)
      }
    },
    [messages, addUserMessage],
  )

  const clearChat = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    messages,
    isLoading,
    error,
    isConnected,
    sendMessage,
    addUserMessage,
    addUserFileMessage,
    addBotMessage,
    clearChat,
    clearError,
  }
}
