export function formatTimestamp(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp

  // Less than a minute
  if (diff < 60000) {
    return "Just now"
  }

  // Less than an hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000)
    return `${minutes}m ago`
  }

  // Less than 24 hours
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000)
    return `${hours}h ago`
  }

  // Less than 48 hours
  if (diff < 172800000) {
    return "Yesterday"
  }

  // Otherwise show the date
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })
}

export function getFileTypeIcon(mimeType: string): string {
  // Return appropriate icon URL based on mime type
  if (mimeType.startsWith("image/")) {
    return "/icons/image-file.svg"
  } else if (mimeType.startsWith("application/pdf")) {
    return "/icons/pdf-file.svg"
  } else if (mimeType.includes("word") || mimeType.includes("document")) {
    return "/icons/doc-file.svg"
  } else if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) {
    return "/icons/xls-file.svg"
  } else if (mimeType.includes("text/")) {
    return "/icons/txt-file.svg"
  } else {
    return "/icons/generic-file.svg"
  }
}

export function getFileSize(bytes: number): string {
  if (bytes < 1024) {
    return bytes + " B"
  } else if (bytes < 1048576) {
    return (bytes / 1024).toFixed(1) + " KB"
  } else if (bytes < 1073741824) {
    return (bytes / 1048576).toFixed(1) + " MB"
  } else {
    return (bytes / 1073741824).toFixed(1) + " GB"
  }
}

export function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}
