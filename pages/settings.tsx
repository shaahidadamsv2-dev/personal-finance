'use client'

import Page from '@/components/page'
import Section from '@/components/section'
import { useState } from 'react'
import { useSettings } from '../context/SettingsContext'

interface TransactionsProps {
  user: any
  setUser: (user: any) => void
  selectedAccount?: string | null
  setSelectedAccount: (account: string | null) => void
}

const Settings = ({ user, setUser, selectedAccount, setSelectedAccount }: TransactionsProps) => {
  const { settings, updateSettings } = useSettings()

  const [localSettings, setLocalSettings] = useState({
    payday: settings.payday || 1,
    interestRate: settings.interestRate || 0,
    investmentBalance: settings.investmentBalance || 0,
    linechartInterval: settings.linechartInterval || 'monthly'
  })

  const handleChange = (key: string, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    updateSettings(localSettings)
    alert('Settings saved!')
  }

  return (
    <Page
      title="Settings"
      user={user}
      setUser={setUser}
      selectedAccount={selectedAccount}
      setSelectedAccount={setSelectedAccount}
    >
      <Section>
        <h2 className="text-xl font-semibold mb-4">Settings</h2>

        <div className="space-y-4">

          <div>
            <label className="block font-medium mb-1">Payday (1–31)</label>
            <input
              type="number"
              min={1}
              max={31}
              value={localSettings.payday}
              onChange={e => handleChange('payday', parseInt(e.target.value))}
              className="border p-2 rounded w-full"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Interest Rate (%)</label>
            <input
              type="number"
              step={0.01}
              value={localSettings.interestRate}
              onChange={e => handleChange('interestRate', parseFloat(e.target.value))}
              className="border p-2 rounded w-full"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Investment Account Balance (Start of Month)</label>
            <input
              type="number"
              step={0.01}
              value={localSettings.investmentBalance}
              onChange={e => handleChange('investmentBalance', parseFloat(e.target.value))}
              className="border p-2 rounded w-full"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Line Chart Interval</label>
            <select
              value={localSettings.linechartInterval}
              onChange={e => handleChange('linechartInterval', e.target.value)}
              className="border p-2 rounded w-full"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <button
            onClick={handleSave}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Save Settings
          </button>

        </div>
      </Section>
    </Page>
  )
}

export default Settings