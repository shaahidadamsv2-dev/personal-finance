import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/router'

const UpdatePassword = () => {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    // Supabase sends access_token in URL after password reset
    const { access_token } = router.query
    if (!access_token) setMessage('No reset token found. Please use the email link.')
  }, [router.query])

  const updatePassword = async () => {
    if (!password || !confirmPassword) return alert('Fill both fields')
    if (password !== confirmPassword) return alert('Passwords do not match')

    setLoading(true)
    const { error } = await supabase.auth.updateUser({
      password
    })

    setLoading(false)
    if (error) {
      setMessage(`Error: ${error.message}`)
    } else {
      setMessage('Password updated successfully! You can now login.')
    }
  }

  return (
    <div className='min-h-screen flex flex-col items-center justify-center p-4'>
      <h1 className='text-2xl font-bold mb-4'>Update Password</h1>
      {message && <p className='mb-4 text-center'>{message}</p>}

      <div className='flex flex-col gap-2 w-full max-w-sm'>
        <input
          type='password'
          placeholder='New password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className='border p-2 rounded'
        />
        <input
          type='password'
          placeholder='Confirm new password'
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className='border p-2 rounded'
        />
        <button
          onClick={updatePassword}
          disabled={loading}
          className='bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition'
        >
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </div>
    </div>
  )
}

export default UpdatePassword