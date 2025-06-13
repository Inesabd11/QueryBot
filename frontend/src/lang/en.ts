const en = {
  appName: "QueryBot",
  startConversation: "Start a conversation",
  askAnything: "Ask me anything, upload documents, or get help with your questions!",
  searchPlaceholder: "Search in conversation...",
  clearConversationConfirm: "Are you sure you want to clear the current conversation?",
  clearConversation: "Clear conversation",
  theme: "Theme",
  search: "Search messages",
  uploadFile: "Upload file",
  typeMessage: "Type your message...",
  connecting: "Connecting to server...",
  send: "Send message",
  pressEnter: "Press Enter to send, Shift+Enter for new line",
  processingFiles: "Processing files...",
  thinking: "Thinking...",
  fileUploaded: (filename: string) => `File \"${filename}\" has been uploaded and processed successfully. You can now ask questions about its content.`,
  fileUploadFailed: (filename: string, error: string) => `Failed to upload \"${filename}\": ${error}`,
  connectionStatus: {
    connected: "Connected",
    disconnected: "Disconnected"
  },
  language: "Language",
  english: "English",
  french: "French"
}

export default en;
