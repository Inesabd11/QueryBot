export const getFileTypeIcon = (fileType: string): string => {
  const iconMap: {[key: string]: string} = {
    'application/pdf': '📄',
    'text/plain': '📝',
    'application/msword': '📄',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📄',
    'application/vnd.ms-excel': '📊',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊'
  };
  return iconMap[fileType] || '📁';
};

export const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
};