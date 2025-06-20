"use client"

import React from "react"
import { Plus, Edit3, Trash2, User } from "lucide-react"

interface ChatSidebarProps {
  isOpen: boolean
  onClearChat: () => void
  theme: string
  getThemeClasses: () => any
  t: any
}

export const ChatSidebar = React.memo<ChatSidebarProps>(({ isOpen, onClearChat, theme, getThemeClasses, t }) => {
  const conversations = [
    { id: 1, title: t.sidebarSample1, preview: t.sidebarSample1Preview, time: "2h" },
    { id: 2, title: t.sidebarSample2, preview: t.sidebarSample2Preview, time: "1d" },
    { id: 3, title: t.sidebarSample3, preview: t.sidebarSample3Preview, time: "3d" },
    { id: 4, title: t.sidebarSample4, preview: t.sidebarSample4Preview, time: "1w" },
  ]

  return (
    <div
      className={`
      ${isOpen ? "w-80" : "w-0"} 
      transition-all duration-300 ease-in-out overflow-hidden
      ${getThemeClasses().sidebar} border-r ${getThemeClasses().border}
      flex flex-col
    `}
    >
      {/* Header */}
      <div className={`p-4 border-b ${getThemeClasses().border}`}>
        <button
          onClick={onClearChat}
          className={`
            w-full flex items-center gap-3 px-4 py-3 rounded-xl
            ${
              theme === "light"
                ? `bg-white border ${getThemeClasses().border} hover:bg-gray-50 text-gray-700`
                : `bg-gray-800 border ${getThemeClasses().border} hover:bg-gray-700 text-gray-200`
            }
            transition-all duration-200 shadow-sm hover:shadow-md
          `}
        >
          <div className="p-1.5 bg-blue-500 rounded-lg">
            <Plus size={16} className="text-white" />
          </div>
          <span className="font-medium">{t.sidebarNewConversation}</span>
        </button>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`
                group p-3 rounded-xl cursor-pointer transition-all duration-200
                ${
                  theme === "light"
                    ? `hover:bg-gray-100 border border-transparent hover:${getThemeClasses().border}`
                    : `hover:bg-gray-800 border border-transparent hover:${getThemeClasses().border}`
                }
              `}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate mb-1">{conv.title}</h3>
                  <p className="text-xs opacity-70 line-clamp-2">{conv.preview}</p>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <span className="text-xs opacity-50">{conv.time}</span>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                      <Edit3 size={12} />
                    </button>
                    <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className={`p-4 border-t ${getThemeClasses().border}`}>
        <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-800 rounded-full flex items-center justify-center">
            <User size={16} className="text-white" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-sm">{t.sidebarUser}</div>
            <div className="text-xs opacity-60">{t.sidebarOrg}</div>
          </div>
        </div>
      </div>
    </div>
  )
})

ChatSidebar.displayName = "ChatSidebar"
