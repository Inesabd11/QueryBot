export type ThemeName = "light" | "dark"

export interface ThemeClasses {
  bg: string
  border: string
  text: string
  input: string
  sidebar: string
  header: string
  messageBox: string
  chatBg: string
}

export function getThemeClasses(theme: ThemeName): ThemeClasses {
  switch (theme) {
    case "light":
      return {
        bg: "bg-white",
        border: "border-gray-200",
        text: "text-gray-900",
        input: "bg-white text-gray-900 placeholder-gray-500 border-gray-300 focus:border-gray-400",
        sidebar: "bg-gray-50 border-r border-gray-200",
        header: "bg-white border-b border-gray-200 text-gray-900",
        messageBox: "bg-white border border-gray-200 focus-within:border-gray-400",
        chatBg: "bg-gray-50",
      }
    case "dark":
      return {
        bg: "bg-gray-900",
        border: "border-gray-700",
        text: "text-gray-100",
        input: "bg-gray-800 text-gray-100 placeholder-gray-400 border-gray-600 focus:border-gray-500",
        sidebar: "bg-gray-900 border-r border-gray-700",
        header: "bg-gray-900 border-b border-gray-700 text-gray-100",
        messageBox: "bg-gray-800 border border-gray-600 focus-within:border-gray-500",
        chatBg: "bg-gray-800",
      }
    default:
      return {
        bg: "bg-white",
        border: "border-gray-200",
        text: "text-gray-900",
        input: "bg-white text-gray-900 placeholder-gray-500 border-gray-300 focus:border-gray-400",
        sidebar: "bg-gray-50 border-r border-gray-200",
        header: "bg-white border-b border-gray-200 text-gray-900",
        messageBox: "bg-white border border-gray-200 focus-within:border-gray-400",
        chatBg: "bg-gray-50",
      }
  }
}
