"use client"

import React from "react"
import { X, FileBarChart } from "lucide-react"

interface FilePreviewProps {
  files: any[]
  onRemoveFile: (index: number) => void
  theme: string
  borderClass?: string
}

export const FilePreview = React.memo<FilePreviewProps>(({ files, onRemoveFile, theme, borderClass = "border-gray-200" }) => {
  if (files.length === 0) return null

  return (
    <div className={`border-b ${borderClass} p-4`}>
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {files.map((upload, index) => (
            <div
              key={index}
              className={`
                relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border-2 ${borderClass}
                shadow-md hover:shadow-lg transition-shadow
              `}
            >
              {upload.type.startsWith("image/") ? (
                <img src={upload.preview || "/placeholder.svg"} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div
                  className={`
                  w-full h-full flex items-center justify-center
                  ${theme === "light" ? "bg-gray-100" : "bg-gray-700"}
                `}
                >
                  <FileBarChart size={28} className="text-blue-500" />
                </div>
              )}
              <button
                onClick={() => onRemoveFile(index)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})

FilePreview.displayName = "FilePreview"
