"use client"

import React from "react"
import { X } from "lucide-react"

interface KeyboardShortcutsProps {
  show: boolean
  onClose: () => void
  onSend: () => void
  theme: string
  t: any
}

export const KeyboardShortcuts = React.memo<KeyboardShortcutsProps>(({ show, onClose, theme, t }) => {
  if (!show) return null

  const shortcuts = [
    { action: t.shortcutSend, keys: ["Ctrl", "Enter"] },
    { action: t.shortcutNewline, keys: ["Shift", "Enter"] },
    { action: t.shortcutShow, keys: ["Ctrl", "/"] },
    { action: t.shortcutClose, keys: ["Esc"] },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div
        className={`
        max-w-md w-full rounded-2xl shadow-2xl p-6 animate-in zoom-in-95
        ${theme === "light" ? "bg-white" : "bg-gray-800"}
      `}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">{t.shortcutsTitle}</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm font-medium">{shortcut.action}</span>
              <div className="flex items-center gap-1">
                {shortcut.keys.map((key, keyIndex) => (
                  <span key={keyIndex} className="flex items-center gap-1">
                    {keyIndex > 0 && <span className="text-xs text-gray-400">+</span>}
                    <kbd
                      className={`
                      px-3 py-1.5 text-xs rounded-lg border font-mono
                      ${
                        theme === "light"
                          ? "bg-gray-100 border-gray-300 text-gray-700"
                          : "bg-gray-700 border-gray-600 text-gray-300"
                      }
                    `}
                    >
                      {key}
                    </kbd>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})

KeyboardShortcuts.displayName = "KeyboardShortcuts"
