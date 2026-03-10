// pages/index.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient'

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    router.replace('/dashboard'); // redirect to your dashboard
  }, [router]);


  return null; // or a loading spinner
}