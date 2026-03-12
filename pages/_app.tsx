import type { AppProps } from 'next/app'
import { ThemeProvider } from 'next-themes'
import { SettingsProvider } from '../context/SettingsContext';
import '@/styles/globals.css'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
export default function App({ Component, pageProps }: AppProps) {
 const [user, setUser] = useState<any>(null)
 const [selectedAccount, setSelectedAccount] = useState<string | null>(null)
	
  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
    }
    fetchUser()
  }, [])

	
	return (
		<SettingsProvider>
		<ThemeProvider
			attribute='class'
			defaultTheme='system'
			disableTransitionOnChange
		>
			<Component {...pageProps} user={user} setUser={setUser} selectedAccount={selectedAccount} setSelectedAccount={setSelectedAccount} />
		</ThemeProvider>
		</SettingsProvider>
	)
}
