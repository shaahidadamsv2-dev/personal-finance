'use client'

import { useCallback, useEffect, useState } from 'react'
import { useUser } from '../context/UserContext'
import { useSettings } from '../context/SettingsContext'
import { supabase } from '../lib/supabaseClient'
import Page from '@/components/page'
import SankeyChart from '../components/SankeyChart'
import LineChart from '../components/LineChart'

interface CategoryTotal {
  category: string
  total: number
  transaction_type: 'income' | 'expense'
}

export default function Dashboard() {
  const { selectedAccount } = useUser()
  const { settings } = useSettings()
  const [categoryTotals, setCategoryTotals] = useState<CategoryTotal[]>([])
  const [last12Months, setLast12Months] = useState<any[]>([])

  // Fetch category totals
  const fetchCategoryTotals = useCallback(async (userId: string) => {
    if (!userId) return
    const today = new Date()
    const { data, error } = await supabase.rpc('get_category_totals_by_paymonth', {
      p_user_id: userId,
      p_year: today.getFullYear(),
      p_month: today.getMonth(),
      p_payday: settings.payday
    })
    if (error) console.error(error)
    else setCategoryTotals(data || [])
  }, [settings.payday])

  // Fetch last 12 months
  const fetchLast12Months = useCallback(async (userId: string) => {
    if (!userId) return
    const { data, error } = await supabase.rpc('get_category_totals_last_months', {
      p_user_id: userId,
      p_months_back: 12
    })
    if (error) console.error(error)
    else setLast12Months(data || [])
  }, [])

  useEffect(() => {
    if (!selectedAccount) return
    fetchCategoryTotals(selectedAccount)
    fetchLast12Months(selectedAccount)
  }, [selectedAccount, fetchCategoryTotals, fetchLast12Months])

  return (
    <Page title="Dashboard">
      <div className="transparent-bg sankey-container">
        <h2 className="text-xl font-semibold text-white mb-4">Transactions Sankey</h2>
        <SankeyChart categoryTotals={categoryTotals} settings={settings} />
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold text-white mb-4">Transactions Last 12 Months</h2>
        <LineChart last12Months={last12Months} />
      </div>
    </Page>
  )
}