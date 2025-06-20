"use client"

import type React from "react"
import { useState } from "react"
import { MessageCircle, Search, X, Database, Plus } from "lucide-react"
import { useTheme } from "@/components/chat/theme/ThemeContext"

// Keep your existing interface for chat history items
interface ChatHistoryItem {
  id: string
  title: string
  preview: string
  timestamp: number
  unread?: boolean
}

interface ChatHistoryProps {
  chatHistory: ChatHistoryItem[]
  onClose: () => void
  isSidebarOpen: boolean
  formatTimestamp: (timestamp: number) => string
}

// Parent container component that manages the chat history state
export const ChatHistoryContainer: React.FC<{
  onClose: () => void
  isSidebarOpen: boolean
}> = ({ onClose, isSidebarOpen }) => {
  // Initialize chat history state with sample data
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([
    {
      id: "chat-1",
      title: "Analyse de production",
      preview: "Analyse des données de production du trimestre...",
      timestamp: Date.now() - 86400000, // 1 day ago
      unread: true,
    },
    {
      id: "chat-2",
      title: "Maintenance prédictive",
      preview: "Quand est prévue la prochaine maintenance...",
      timestamp: Date.now() - 172800000, // 2 days ago
    },
    {
      id: "chat-3",
      title: "Rapport d'incidents",
      preview: "Résumé des incidents signalés cette semaine...",
      timestamp: Date.now() - 259200000, // 3 days ago
    },
  ])

  // Function to format timestamps
  const formatTimestamp = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp

    // Less than 24 hours
    if (diff < 86400000) {
      return "Aujourd'hui"
    }
    // Less than 48 hours
    else if (diff < 172800000) {
      return "Hier"
    }
    // Otherwise show the date
    else {
      return new Date(timestamp).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    }
  }

  // You can add functions to manipulate the chat history here
  const addNewChat = () => {
    const newChat = {
      id: `chat-${chatHistory.length + 1}`,
      title: "Nouvelle conversation",
      preview: "Commencez à écrire...",
      timestamp: Date.now(),
      unread: false,
    }

    setChatHistory([newChat, ...chatHistory])
  }

  return (
    <ChatHistory
      chatHistory={chatHistory}
      onClose={onClose}
      isSidebarOpen={isSidebarOpen}
      formatTimestamp={formatTimestamp}
    />
  )
}

// Keep your original ChatHistory component unchanged
const ChatHistory: React.FC<ChatHistoryProps> = ({ chatHistory, onClose, isSidebarOpen, formatTimestamp }) => {
  const { theme, getThemeClasses } = useTheme()

  if (!isSidebarOpen) return null

  return (
    <div className="flex flex-col h-full">
      {/* Sidebar Header */}
      <div
        className={`flex items-center justify-between p-4 border-b ${getThemeClasses().border} backdrop-blur-md bg-opacity-80 shadow-md`}
        style={{
          minHeight: "72px",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 flex items-center justify-center rounded-lg shadow-lg"
            style={{
              background: "linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)",
            }}
          >
            <Database className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-lg font-bold text-gray-100">Historique</h3>
            <span className="text-xs text-gray-400 font-medium">Conversations industrielles</span>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-200 md:hidden">
          <X size={20} />
        </button>
      </div>

      <div className="p-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Rechercher..."
            className={`
              w-full p-2 pl-8 text-sm rounded-lg border
              ${getThemeClasses().input}
              focus:outline-none focus:ring-2 focus:ring-blue-500
            `}
          />
          <Search size={16} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {chatHistory.map((chat) => (
          <div
            key={chat.id}
            className={`
              flex items-center p-3 rounded-lg cursor-pointer mb-2
              transition-all duration-200
              hover:bg-gray-800/50 border border-gray-700/50 hover:border-gray-600
              shadow-sm hover:shadow
            `}
          >
            <div className="h-10 w-10 rounded-lg flex items-center justify-center mr-3 bg-gray-800">
              <MessageCircle className="h-5 w-5 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium truncate text-gray-200">{chat.title}</h3>
              <p className="text-xs text-gray-400 truncate">{chat.preview}</p>
            </div>
            <div className="ml-2 flex flex-col items-end">
              <span className="text-xs text-gray-500">{formatTimestamp(chat.timestamp)}</span>
              {chat.unread && <span className="h-2 w-2 bg-blue-500 rounded-full mt-1" />}
            </div>
          </div>
        ))}
      </div>

      <div className="p-3">
        <button
          className={`
          w-full flex items-center justify-center space-x-2 p-2.5 rounded-lg
          bg-gradient-to-r from-blue-600 to-blue-700
          hover:from-blue-700 hover:to-blue-800
          text-white transition-all duration-200 shadow-md
        `}
        >
          <Plus size={16} />
          <span>Nouvelle conversation</span>
        </button>
      </div>
    </div>
  )
}

export default ChatHistoryContainer
