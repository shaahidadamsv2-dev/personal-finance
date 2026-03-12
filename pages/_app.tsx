'use client'

import type { AppProps } from 'next/app'
import { ThemeProvider } from 'next-themes'
import { SettingsProvider } from '../context/SettingsContext'
import '@/styles/globals.css'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function App({ Component, pageProps }: AppProps) {
  const [user, setUser] = useState<any>(null)
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      // 1️⃣ Get auth user
      const { data: authData } = await supabase.auth.getUser()
      const authUser = authData.user
      if (!authUser) return

      // 2️⃣ Get profile from profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', authUser.id)
        .single()

      if (profileError) {
        console.error('Error fetching profile:', profileError.message)
      }

      // 3️⃣ Combine auth user + profile info
      setUser({ ...authUser, displayName: profileData?.display_name || '' })
    }

    fetchUserAndProfile()
  }, [])

  return (
    <SettingsProvider>
      <ThemeProvider
        attribute='class'
        defaultTheme='system'
        disableTransitionOnChange
      >
        <Component
          {...pageProps}
          user={user}
          setUser={setUser}
          selectedAccount={selectedAccount}
          setSelectedAccount={setSelectedAccount}
        />
      </ThemeProvider>
    </SettingsProvider>
  )
}