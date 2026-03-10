import Page from '@/components/page'
import Section from '@/components/section'
import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

interface TransactionsProps {
  user: any // type properly later
  setUser: (user: any) => void
}

const User = ({ user, setUser }: TransactionsProps) => {
  const [email, setEmail] = useState(user?.email || '')
  const [loading, setLoading] = useState(false)

  const logout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login' // redirect after logout
  }

  const resetPassword = async () => {
    if (!email) return alert('Email is required')
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/updatepassword' // optional redirect after reset
    })
    setLoading(false)
    if (error) {
      alert(`Failed to send reset email: ${error.message}`)
    } else {
      alert('Password reset email sent! Check your inbox.')
    }
  }

  return (
    <Page title='User' user={user}>
      <Section>
        <h2 className='text-xl font-semibold'>Story</h2>
        <div className='mt-2'>
          <p className='text-zinc-600 dark:text-zinc-400'>
            &quot;I confess that when this all started, you were like a picture
            out of focus to me. And it took time for my eyes to adjust to you, to
            make sense of you, to really recognize you.&quot;
          </p>

          <br />

          <p className='text-sm text-zinc-600 dark:text-zinc-400'>
            <a href='https://twosentencestories.com/vision' className='underline'>
              Vision
            </a>
            , a two sentence story
          </p>
        </div>
      </Section>

      <Section>
        <h2 className='text-xl font-semibold mb-2'>Account Actions</h2>
        <div className='flex flex-col sm:flex-row gap-3'>
          {/* Logout button */}
          <button
            onClick={logout}
            className='bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition'
          >
            Logout
          </button>

          {/* Reset Password */}
          <div className='flex flex-col sm:flex-row gap-2'>
            <input
              type='email'
              placeholder='Your email'
              value={email}
              onChange={(e) => setEmail(e.target.value.trim())} // sanitize input
              className='border p-2 rounded text-gray-900'
            />
            <button
              onClick={resetPassword}
              disabled={loading}
              className='bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition'
            >
              {loading ? 'Sending...' : 'Reset Password'}
            </button>
          </div>
        </div>
      </Section>
    </Page>
  )
}

export default User