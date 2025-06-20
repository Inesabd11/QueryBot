"use client"

import React from "react"
import { ArrowDown } from "lucide-react"

interface ScrollToBottomProps {
  show: boolean
  onClick: () => void
}

export const ScrollToBottom = React.memo<ScrollToBottomProps>(({ show, onClick }) => {
  if (!show) return null

  return (
    <button
      onClick={onClick}
      className="fixed bottom-32 right-6 bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition-all animate-bounce z-40 hover:scale-110"
    >
      <ArrowDown size={16} />
    </button>
  )
})

ScrollToBottom.displayName = "ScrollToBottom"
