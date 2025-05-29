"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import type { FileUpload } from "@/hooks/useChat"
import { getFileTypeIcon } from "@/utils/fileUtils"

interface UploadResult {
  success: boolean
  filename: string
  message?: string
  error?: string
}

export const useFileUpload = (
  onFileMessageSent?: (file: FileUpload) => void,
  onUploadComplete?: (result: UploadResult) => void,
) => {
  const [uploadedFiles, setUploadedFiles] = useState<FileUpload[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      const newFiles: FileUpload[] = Array.from(files).map((file) => ({
        file,
        preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : getFileTypeIcon(file.type),
        type: file.type,
      }))
      setUploadedFiles((prev) => [...prev, ...newFiles])

      if (event.target) {
        event.target.value = ""
      }
    }
  }

  const uploadFile = useCallback(
    async (file: FileUpload): Promise<UploadResult> => {
      setIsUploading(true)
      setUploadError(null)

      // Notify that a file message is being sent
      if (onFileMessageSent) {
        onFileMessageSent(file)
      }

      const formData = new FormData()
      formData.append("file", file.file)

      try {
        const response = await fetch("http://localhost:8000/api/documents/upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: response.statusText }))
          throw new Error(`Upload failed: ${errorData.detail || response.statusText}`)
        }

        const result = await response.json()

        const uploadResult: UploadResult = {
          success: true,
          filename: file.file.name,
          message: `File "${file.file.name}" has been uploaded and processed successfully. You can now ask questions about its content.`,
        }

        // Notify about upload completion
        if (onUploadComplete) {
          onUploadComplete(uploadResult)
        }

        return uploadResult
      } catch (err) {
        console.error("File upload error:", err)
        const errorMessage = err instanceof Error ? err.message : "Unknown error"
        setUploadError(errorMessage)

        const failResult: UploadResult = {
          success: false,
          filename: file.file.name,
          error: errorMessage,
        }

        // Notify about upload failure
        if (onUploadComplete) {
          onUploadComplete(failResult)
        }

        return failResult
      } finally {
        setIsUploading(false)
      }
    },
    [onFileMessageSent, onUploadComplete],
  )

  const uploadAllFiles = useCallback(async () => {
    if (uploadedFiles.length === 0) return []

    const results: UploadResult[] = []

    for (const file of uploadedFiles) {
      const result = await uploadFile(file)
      results.push(result)
    }

    // Clear all files after upload
    clearAllFiles()

    return results
  }, [uploadedFiles, uploadFile])

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => {
      const newFiles = prev.filter((_, i) => i !== index)
      // Clean up object URLs to prevent memory leaks
      const removedFile = prev[index]
      if (removedFile.preview && removedFile.preview.startsWith("blob:")) {
        URL.revokeObjectURL(removedFile.preview)
      }
      return newFiles
    })
  }

  const clearAllFiles = () => {
    // Clean up object URLs
    uploadedFiles.forEach((file) => {
      if (file.preview && file.preview.startsWith("blob:")) {
        URL.revokeObjectURL(file.preview)
      }
    })
    setUploadedFiles([])
    setUploadError(null)
  }

  const clearError = () => {
    setUploadError(null)
  }

  return {
    uploadedFiles,
    setUploadedFiles,
    fileInputRef,
    handleFileUpload,
    uploadFile,
    uploadAllFiles,
    removeFile,
    clearAllFiles,
    isUploading,
    uploadError,
    clearError,
  }
}
