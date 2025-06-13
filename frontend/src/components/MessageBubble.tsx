import type React from "react"
import type { ChatMessage } from "../hooks/useChat"
import { BotMessageSquare, User, FileText } from "lucide-react"

interface MessageBubbleProps {
  message: ChatMessage
  showSenderIcon: boolean
  getThemeClasses: () => any
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, showSenderIcon, getThemeClasses }) => {
  const isUser = message.role === "user"

  return (
    <div key={message.id} className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4 items-end group`}>
      {!isUser && showSenderIcon && (
        <div
          className={`
            flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mr-2
            ${getThemeClasses().bg} ${getThemeClasses().text}
            transition-colors duration-300
          `}
        >
          <BotMessageSquare className="h-5 w-5 text-white" />
        </div>
      )}

      <div
        className={`
          relative max-w-[80%] p-3 rounded-2xl shadow-sm
          ${
            isUser
              ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-tr-sm"
              : `${getThemeClasses().bg} ${getThemeClasses().text} ${getThemeClasses().border} rounded-tl-sm`
          }
          transform transition-all duration-200 ease-in-out hover:scale-[1.01]
        `}
      >
        {message.type === "text" && <p className="whitespace-pre-wrap">{message.content}</p>}
        {message.type === "image" && (
          <img
            src={message.metadata?.imageUrl || "/placeholder.svg"}
            alt="Uploaded"
            className="max-w-full rounded-md"
          />
        )}
        {message.type === "file" && (
          <div className="flex items-center bg-opacity-10 bg-gray-100 dark:bg-gray-900 p-2 rounded-md">
            <FileText className="mr-2 text-gray-500 dark:text-gray-300" size={16} />
            <span className="text-sm truncate max-w-xs">{message.metadata?.fileName}</span>
          </div> 
        )} 
      </div>

      {isUser && showSenderIcon && (
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center ml-2 shadow-sm">
          <User className="h-5 w-5 text-white" />
        </div>
      )}
    </div> 
  )
}
 