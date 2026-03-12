import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabaseClient'
import { useState, useEffect } from 'react'

const links = [
  {label: 'Dashboard', href:"/dashboard"},
  { label: 'Transactions', href: '/transactions' },
  
]

interface AppbarProps {
  user: any
  setUser: (user: any) => void
  selectedAccount?: string | null
  setSelectedAccount: (account: string | null) => void
  sharedAccounts: string[]
  setSharedAccounts: (accounts: string[]) => void
}

const Appbar = ({ user, setUser, selectedAccount, setSelectedAccount, sharedAccounts, setSharedAccounts }: AppbarProps) => {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  return (
    <div className='fixed top-0 left-0 z-20 w-full bg-zinc-900 pt-safe'>
      <header className='border-b bg-zinc-100 px-safe dark:border-zinc-800 dark:bg-zinc-900'>
        <div className='mx-auto flex h-20 max-w-screen-md items-center justify-between px-6'>

          <Link href='/'>
            <h1 className='font-medium'>Welcome {user?.displayName}</h1>
          </Link>

          <nav className='flex items-center space-x-6'>
            <div className='hidden sm:block'>
              <div className='flex items-center space-x-6'>
                {links.map(({ label, href }) => (
                  <Link
                    key={label}
                    href={href}
                    className={`text-sm ${
                      router.pathname === href
                        ? 'text-indigo-500 dark:text-indigo-400'
                        : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50'
                    }`}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Selected account dropdown */}
            <div className="relative">
              <div
                onClick={() => setOpen(!open)}
                className='cursor-pointer h-10 w-28 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-medium text-sm'
              >
                {selectedAccount || "Select"}
              </div>

              {open && (
                <div className="absolute right-0 mt-3 w-56 rounded-xl bg-white shadow-lg dark:bg-zinc-800 p-2 space-y-2">

                  <Link href="/user">
                    <div className="text-sm px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded cursor-pointer">
                      My Account
                    </div>
                  </Link>

                  <div className="border-t border-zinc-200 dark:border-zinc-700 my-1"/>

                  <div className="text-xs text-zinc-500 px-2">Select Account</div>

                  {/* Always include the current logged-in user */}
                  <div
                    className="text-xs px-2 py-1 bg-zinc-100 dark:bg-zinc-700 rounded cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-700"
                    onClick={() => { setSelectedAccount(user.id); setOpen(false) }}
                  >
                    {user.id} (You)
                  </div>

                  {/* Shared accounts */}
                  {sharedAccounts.length === 0 ? (
                    <div className="text-xs px-2 text-zinc-400">None</div>
                  ) : (
                    sharedAccounts.map((id) => (
                      <div
                        key={id}
                        className="text-xs px-2 py-1 bg-zinc-100 dark:bg-zinc-700 rounded cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-700"
                        onClick={() => { setSelectedAccount(id); setOpen(false) }}
                      >
                        {id}
                      </div>
                    ))
                  )}

                </div>
              )}
            </div>

          </nav>
        </div>
      </header>
    </div>
  )
}

export default Appbar