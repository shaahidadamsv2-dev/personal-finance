'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Settings = {
  darkMode: boolean
  language: string
  payday: number
  interestRate: number
  investmentBalance: number
  linechartInterval: 'daily' | 'weekly' | 'monthly' | 'yearly'
}

type SettingsContextType = {
  settings: Settings
  updateSettings: (newSettings: Partial<Settings>) => void
}

const defaultSettings: Settings = {
  darkMode: false,
  language: 'en',
  payday: 25,
  interestRate: 0,
  investmentBalance: 0,
  linechartInterval: 'monthly',
}

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  updateSettings: () => {},
})

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [hydrated, setHydrated] = useState(false) // NEW

  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = localStorage.getItem('appSettings')
    if (saved) {
      try {
        setSettings(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse settings', e)
      }
    }
    setHydrated(true) // mark as ready
  }, [])

  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem('appSettings', JSON.stringify(settings))
  }, [settings, hydrated])

  if (!hydrated) return null // prevent rendering until client-side

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => useContext(SettingsContext)