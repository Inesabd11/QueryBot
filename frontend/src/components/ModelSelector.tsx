"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, Check, Sparkles, Zap, Cpu, Brain, Gauge } from "lucide-react"

export interface Model {
  id: string
  name: string
  description: string
  capabilities: string[]
  icon: React.ReactNode
  isDefault?: boolean
}

interface ModelSelectorProps {
  selectedModel: string
  onSelectModel: (modelId: string) => void
}

export const defaultModels: Model[] = [
  {
    id: "gpt-4o",
    name: "GPT-4o",
    description: "Le plus avancé pour l'analyse industrielle",
    capabilities: ["Analyse complexe", "Multimodal", "Contexte étendu"],
    icon: <Sparkles className="h-4 w-4 text-yellow-500" />,
    isDefault: true,
  },
  {
    id: "claude-3-opus",
    name: "Claude 3 Opus",
    description: "Haute précision pour données techniques",
    capabilities: ["Raisonnement", "Analyse détaillée", "Contexte étendu"],
    icon: <Brain className="h-4 w-4 text-purple-500" />,
  },
  {
    id: "gemini-pro",
    name: "Gemini Pro",
    description: "Rapide et efficace pour requêtes simples",
    capabilities: ["Multimodal", "Rapide", "Efficace"],
    icon: <Zap className="h-4 w-4 text-blue-500" />,
  },
  {
    id: "llama-3",
    name: "Llama 3",
    description: "Modèle open-source performant",
    capabilities: ["Open-source", "Flexible", "Personnalisable"],
    icon: <Cpu className="h-4 w-4 text-green-500" />,
  },
  {
    id: "mistral-large",
    name: "Mistral Large",
    description: "Modèle français pour données industrielles",
    capabilities: ["Français natif", "Contexte industriel", "Efficace"],
    icon: <Gauge className="h-4 w-4 text-indigo-500" />,
  },
]

export const ModelSelector: React.FC<ModelSelectorProps> = ({ selectedModel, onSelectModel }) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const currentModel = defaultModels.find((model) => model.id === selectedModel) || defaultModels[0]

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm text-gray-900 dark:text-gray-100"
      >
        {currentModel.icon}
        <span>{currentModel.name}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="max-h-80 overflow-y-auto py-1">
            {defaultModels.map((model) => (
              <button
                key={model.id}
                onClick={() => {
                  onSelectModel(model.id)
                  setIsOpen(false)
                }}
                className={`w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  selectedModel === model.id ? "bg-gray-100 dark:bg-gray-700" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {model.icon}
                    <span className="font-medium text-gray-900 dark:text-gray-100">{model.name}</span>
                  </div>
                  {selectedModel === model.id && <Check className="h-4 w-4 text-green-500" />}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{model.description}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {model.capabilities.map((capability, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-[10px] border border-gray-300 dark:border-gray-500"
                    >
                      {capability}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
