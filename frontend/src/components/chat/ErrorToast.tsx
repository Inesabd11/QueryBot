"use client"

import React from "react"
import { X, AlertCircle } from "lucide-react"

interface ErrorToastProps {
  error: string | null
  onClear: () => void
  theme: string
  t: any
}

export const ErrorToast = React.memo<ErrorToastProps>(({ error, onClear, theme, t }) => {
  if (!error) return null

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md animate-in slide-in-from-right">
      <div
        className={`
        p-4 rounded-xl shadow-xl border-l-4 border-red-500 backdrop-blur-sm
        ${
          theme === "light"
            ? "bg-red-50/90 text-red-800 border border-red-200"
            : "bg-red-900/20 text-red-200 border border-red-800"
        }
      `}
      >
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium mb-1">Error</p>
            <p className="text-sm opacity-90">{error}</p>
          </div>
          <button
            onClick={onClear}
            className="text-red-500 hover:text-red-700 dark:hover:text-red-300 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  )
})

ErrorToast.displayName = "ErrorToast"
