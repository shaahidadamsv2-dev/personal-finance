'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/router'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const router = useRouter()

  const handleRegister = async () => {
    // 1️⃣ Sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password
    })

    if (authError) {
      alert(authError.message)
      return
    }

    if (authData?.user) {
      const userId = authData.user.id

      // 2️⃣ Insert display name into profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{ id: userId, email, display_name: displayName }])

      if (profileError) {
        alert('Failed to save display name: ' + profileError.message)
      } else {
        router.push('/dashboard')
      }
    }
  }

  return (
    <div className="flex flex-col gap-4 p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold">Register</h1>

      <input
        type="email"
        placeholder="Email"
        className="border p-2"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        className="border p-2"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <input
        type="text"
        placeholder="Display Name"
        className="border p-2"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
      />

      <button
        onClick={handleRegister}
        className="bg-green-600 text-white p-2 rounded"
      >
        Create Account
      </button>
    </div>
  )
}