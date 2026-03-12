import Head from 'next/head'
import Appbar from '@/components/appbar'
import BottomNav from '@/components/bottom-nav'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

interface Props {
	title?: string
	children: React.ReactNode
	user?: any
	setUser: (user: any) => void
	selectedAccount?: string | null
	setSelectedAccount: (account: string | null) => void
}

const Page = ({ title, children, user, setUser, selectedAccount, setSelectedAccount }: Props) => 
{
	const [sharedAccounts, setSharedAccounts] = useState<string[]>([])
	
	useEffect(() => {
    if (!user?.id) return

    const fetchSharedAccounts = async () => {

      const { data, error } = await supabase
        .from("transaction_permissions")
        .select("owner_id")
        .eq("viewer_id", user.id)

      if (error) {
        console.error(error)
        return
      }
      const ids = data.map((row: any) => row.owner_id)
      setSharedAccounts(ids)
	  console.log('Fetched shared accounts:', ids)
      // default selected account to self
      setSelectedAccount(user.id)
    }
    fetchSharedAccounts()
  }, [setSelectedAccount, user])
	
	return (
	<>
		{title ? (
			<Head>
				<title>Rice Bowl | {title}</title>
			</Head>
		) : null}

		<Appbar user={user} setUser={setUser} selectedAccount={selectedAccount} setSelectedAccount={setSelectedAccount} sharedAccounts={sharedAccounts} setSharedAccounts={setSharedAccounts} />

		<main
			/**
			 * Padding top = `appbar` height
			 * Padding bottom = `bottom-nav` height
			 */
			className='mx-auto max-w-screen-md pt-20 pb-16 px-safe sm:pb-0'
		>
			<div className='p-6'>{children}</div>
		</main>

		<BottomNav />
	</>
	)
}
export default Page
