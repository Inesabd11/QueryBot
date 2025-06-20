"use client"

import React from "react"
import { BotMessageSquare, BarChart2, Settings, Clipboard, Gauge } from "lucide-react"
import { ModelSelector } from "@/components/ModelSelector"
import { getThemeClasses, ThemeName } from "@/components/chat/theme/ThemeUtils"

interface WelcomeScreenProps {
  selectedModel: string
  onSelectModel: (model: string) => void
  theme: string
  t: any
}

export const WelcomeScreen = React.memo<WelcomeScreenProps>(({ selectedModel, onSelectModel, theme, t }) => {
  const quickActions = [
    {
      icon: BarChart2,
      title: t.quickAction1Title,
      description: t.quickAction1Desc,
      query: t.quickAction1Query,
    },
    {
      icon: Settings,
      title: t.quickAction2Title,
      description: t.quickAction2Desc,
      query: t.quickAction2Query,
    },
    {
      icon: Clipboard,
      title: t.quickAction3Title,
      description: t.quickAction3Desc,
      query: t.quickAction3Query,
    },
    {
      icon: Gauge,
      title: t.quickAction4Title,
      description: t.quickAction4Desc,
      query: t.quickAction4Query,
    },
  ]

    const setInputText = (query: string) => {
        const input = document.getElementById("chat-input") as HTMLInputElement | null
        if (input) {
            input.value = query
            input.focus()
            // Optionally, you can dispatch an input event if needed:
            const event = new Event('input', { bubbles: true })
            input.dispatchEvent(event)
        }
    }

  return (
    <div className="flex-1 flex flex-col min-h-0 z-0">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-2 md:mx-4 lg:mx-auto w-full max-w-2xl">
          <div className="h-full flex flex-col items-center justify-center p-4">
            <div className="max-w-2xl w-full text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-800 rounded-4xl flex items-center justify-center mx-auto mb-6">
                <BotMessageSquare size={40} className="text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-4">{t.headerTitle}</h2>
              <p className="text-lg opacity-70 mb-8">{t.askAnything}</p>
              {/* Model Selector */}
              <div className="mb-8 flex justify-center">
                <ModelSelector selectedModel={selectedModel} onSelectModel={onSelectModel} />
              </div>
              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => setInputText(action.query)}
                    className={`
                      p-3 rounded-xl text-left transition-all duration-200 group
                      border border-l-4 ${getThemeClasses(theme as ThemeName).border}
                      ${
                        theme === "light"
                          ? "bg-white hover:border-blue-300 hover:shadow-md"
                          : "bg-gray-800 hover:border-blue-500 hover:bg-gray-750"
                      }
                    `}
                  >
                    <div className="flex items-start gap-2">
                      <div className="p-2 bg-blue-500 rounded-lg group-hover:scale-110 transition-transform">
                        <action.icon size={20} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium mb-1">{action.title}</h3>
                        <p className="text-sm opacity-70">{action.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

WelcomeScreen.displayName = "WelcomeScreen"
