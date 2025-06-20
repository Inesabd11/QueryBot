"use client"

import React, { useState, useRef, useEffect } from "react"
import { Menu, Globe, Sun, Moon, ChevronDown, BotMessageSquare } from "lucide-react"
import ReactCountryFlag from "react-country-flag"
import { useLanguage } from "@/components/useLanguage"
import { useTheme } from "@/components/chat/theme/ThemeContext"

interface ChatHeaderProps {
  isSidebarOpen: boolean
  onToggleSidebar: () => void
  onShowShortcuts: () => void
  theme: string
  getThemeClasses: () => any
  t: any
}

export const ChatHeader = React.memo<ChatHeaderProps>(
  ({ isSidebarOpen, onToggleSidebar, onShowShortcuts, theme, getThemeClasses, t }) => {
    const { language, setLanguage } = useLanguage()
    const { setTheme } = useTheme()
    const [showDropdowns, setShowDropdowns] = useState({
      language: false,
      theme: false,
    })

    const langDropdownRef = useRef<HTMLDivElement>(null)
    const themeDropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          langDropdownRef.current &&
          !langDropdownRef.current.contains(event.target as Node) &&
          themeDropdownRef.current &&
          !themeDropdownRef.current.contains(event.target as Node)
        ) {
          setShowDropdowns({ language: false, theme: false })
        }
      }
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    return (
      <header
        className={`
      flex items-center justify-between px-6 py-4 border-b ${getThemeClasses().border}
      ${theme === "light" ? "bg-white/95" : "bg-gray-900/95"} backdrop-blur-md z-30
    `}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className={`
            p-2 rounded-lg transition-colors
            ${theme === "light" ? "hover:bg-gray-100 text-gray-600" : "hover:bg-gray-800 text-gray-400"}
          `}
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-300 to-blue-800 rounded-4xl flex items-center justify-center shadow-lg">
              <BotMessageSquare size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl">{t.headerTitle}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Acoba Assistant</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="relative z-50" ref={langDropdownRef}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowDropdowns((prev) => ({ ...prev, language: !prev.language }))
              }}
              className={`
              flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors
              ${theme === "light" ? "hover:bg-gray-100 text-gray-600" : "hover:bg-gray-800 text-gray-400"}
            `}
            >
              <Globe size={16} />
              <span>{language.toUpperCase()}</span>
              <ChevronDown size={14} />
            </button>
            {showDropdowns.language && (
              <div
                className={`
              absolute right-0 top-full mt-2 w-40 rounded-xl shadow-xl border z-50
              ${theme === "light" ? "bg-white border-gray-200" : "bg-gray-800 border-gray-700"}
            `}
              >
                <button
                  onClick={() => {
                    setLanguage("en")
                    setShowDropdowns((prev) => ({ ...prev, language: false }))
                  }}
                  className={`
                  w-full px-3 py-2 text-left text-sm rounded-t-xl transition-colors flex items-center gap-2
                  ${
                    language === "en"
                      ? "bg-blue-500 text-white"
                      : theme === "light"
                        ? "hover:bg-gray-100 text-gray-700"
                        : "hover:bg-gray-700 text-gray-300"
                  }
                `}
                >
                  <ReactCountryFlag countryCode="GB" svg style={{ width: "16px", height: "12px" }} />
                  <span>English</span>
                </button>
                <button
                  onClick={() => {
                    setLanguage("fr")
                    setShowDropdowns((prev) => ({ ...prev, language: false }))
                  }}
                  className={`
                  w-full px-3 py-2 text-left text-sm rounded-b-xl transition-colors flex items-center gap-2
                  ${
                    language === "fr"
                      ? "bg-blue-500 text-white"
                      : theme === "light"
                        ? "hover:bg-gray-100 text-gray-700"
                        : "hover:bg-gray-700 text-gray-300"
                  }
                `}
                >
                  <ReactCountryFlag countryCode="FR" svg style={{ width: "16px", height: "12px" }} />
                  <span>Français</span>
                </button>
              </div>
            )}
          </div>

          {/* Theme Selector */}
          <div className="relative z-50" ref={themeDropdownRef}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowDropdowns((prev) => ({ ...prev, theme: !prev.theme }))
              }}
              className={`
              p-2 rounded-lg transition-colors
              ${theme === "light" ? "hover:bg-gray-100 text-gray-600" : "hover:bg-gray-800 text-gray-400"}
            `}
            >
              {theme === "light" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {showDropdowns.theme && (
              <div
                className={`
              absolute right-0 top-full mt-2 w-32 rounded-xl shadow-xl border z-50
              ${theme === "light" ? "bg-white border-gray-200" : "bg-gray-800 border-gray-700"}
            `}
              >
                <button
                  onClick={() => {
                    setTheme("light")
                    setShowDropdowns((prev) => ({ ...prev, theme: false }))
                  }}
                  className={`
                  w-full flex items-center gap-2 px-3 py-2 text-left text-sm rounded-t-xl transition-colors
                  ${theme === "light" ? "bg-blue-500 text-white" : "hover:bg-gray-700 text-gray-300"}
                `}
                >
                  <Sun size={16} /> Light
                </button>
                <button
                  onClick={() => {
                    setTheme("dark")
                    setShowDropdowns((prev) => ({ ...prev, theme: false }))
                  }}
                  className={`
                  w-full flex items-center gap-2 px-3 py-2 text-left text-sm rounded-b-xl transition-colors
                  ${theme === "dark" ? "bg-blue-500 text-white" : "hover:bg-gray-700 text-gray-300"}
                `}
                >
                  <Moon size={16} /> Dark
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    )
  },
)

ChatHeader.displayName = "ChatHeader"
