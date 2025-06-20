"use client"
import { createContext, useContext, useState, type ReactNode } from "react"
import { getThemeClasses as getThemeClassesUtil } from "./ThemeUtils"
import type { ThemeName } from "./ThemeUtils"

interface ThemeContextProps {
  theme: string
  toggleTheme: () => void
  setTheme: (theme: ThemeName) => void
  getThemeClasses: () => ReturnType<typeof getThemeClassesUtil>
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined)

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeName>("light")

  const toggleTheme = () => {
    setThemeState((prev: ThemeName) => {
      if (prev === "light") return "dark"
      return "light"
    })
  }

  const setTheme = (newTheme: ThemeName) => {
    if (newTheme === "light" || newTheme === "dark") {
      setThemeState(newTheme)
    }
  }

  const getThemeClasses = () => getThemeClassesUtil(theme as ThemeName)

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, getThemeClasses }}>{children}</ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
