// API utility functions with proper error handling
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export const checkBackendConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (response.ok) {
      const data = await response.json()
      console.log("Backend health check:", data)
      return true
    }
    return false
  } catch (error) {
    console.error("Backend connection failed:", error)
    return false
  }
}

export const testChatEndpoint = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "test connection",
        chat_history: [],
      }),
    })

    return response.ok
  } catch (error) {
    console.error("Chat endpoint test failed:", error)
    return false
  }
}

export const uploadFile = async (file: File): Promise<any> => {
  const formData = new FormData()
  formData.append("file", file)

  try {
    const response = await fetch(`${API_BASE_URL}/api/documents/upload`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Upload failed: ${response.statusText} - ${errorText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("File upload error:", error)
    throw error
  }
}

export const sendChatMessage = async (message: string, chatHistory: any[] = []): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        chat_history: chatHistory,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Chat failed: ${response.statusText} - ${errorText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Chat message error:", error)
    throw error
  }
}

export const getApiStatus = async (): Promise<{
  status: string
  timestamp: string
  components: any
}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`)

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error checking API status:", error)
    throw error
  }
}

export const clearChatHistory = async (): Promise<{ success: boolean }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat/history`, {
      method: "DELETE",
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error clearing chat history:", error)
    throw error
  }
}
