'use client'

import Page from '@/components/page'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useUser } from '../context/UserContext'

interface Transaction {
  id: string
  amount: number
  category: string
  description?: string
  transaction_date: string
  transaction_type: string
}

const Transactions = () => {
  const router = useRouter()
  const {
    memoUser,
    setUser,
    selectedAccount,
  } = useUser()

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [shareEmails, setShareEmails] = useState<{ [key: string]: string }>({})


  // --- Fetch transactions when selectedAccount exists ---
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!selectedAccount) return
      console.log('Fetching transactions for account:', selectedAccount)

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', selectedAccount)
        .order('transaction_date', { ascending: false })

      if (error) {
        console.error('Fetch transactions error:', error)
      } else {
        setTransactions(data || [])
      }
    }

    fetchTransactions()
  }, [selectedAccount])

  // --- Add transaction ---
  const addTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!memoUser || !selectedAccount) return

    const parsedAmount = parseFloat(amount)
    const sanitizedCategory = category.trim()
    const sanitizedDescription = description.trim()

    if (!sanitizedCategory) return alert('Category cannot be empty')
    if (isNaN(parsedAmount) || parsedAmount <= 0)
      return alert('Amount must be a valid number greater than 0')

    try {
      const { error } = await supabase.from('transactions').insert([
        {
          user_id: selectedAccount,
          amount: parsedAmount,
          category: sanitizedCategory,
          description: sanitizedDescription || null,
          transaction_type: 'expense'
        },
      ])
      if (error) throw error

      // Reset form
      setAmount('')
      setCategory('')
      setDescription('')

      // Refresh transactions
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', selectedAccount)
        .order('transaction_date', { ascending: false })

      setTransactions(data || [])
    } catch (err: any) {
      console.error('Add transaction error:', err)
      alert(`Failed to add transaction: ${err.message}`)
    }
  }

  // --- Delete transaction ---
  const deleteTransaction = async (id: string) => {
    if (!memoUser || !selectedAccount) return
    if (!confirm('Are you sure you want to delete this transaction?')) return

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', selectedAccount)

      if (error) throw error
      setTransactions(transactions.filter(t => t.id !== id))
    } catch (err: any) {
      console.error('Delete transaction error:', err)
      alert(`Delete failed: ${err.message}`)
    }
  }

  // --- Share transaction ---
  const shareTransaction = async (transactionId: string) => {
    const email = shareEmails[transactionId]?.trim()
    if (!email) return alert("Enter a user's email")
    if (!memoUser) return

    try {
      const { data: partnerUser, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single()

      if (userError || !partnerUser) return alert('User not found')

      const { error: insertError } = await supabase
        .from('transaction_access')
        .insert([{ transaction_id: transactionId, user_id: partnerUser.id }])

      if (insertError) throw insertError

      alert('Transaction shared!')
      setShareEmails({ ...shareEmails, [transactionId]: '' })
    } catch (err: any) {
      console.error('Share transaction error:', err)
      alert(`Something went wrong: ${err.message}`)
    }
  }

  return (
    <Page title="Transactions">
      {/* Add Transaction Form */}
      <div className="bg-white p-6 rounded shadow mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Add Transaction</h2>
        <form
          
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end"
        >
          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="border p-2 rounded w-full text-gray-900"
            required
          />
          <input
            type="text"
            placeholder="Category"
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="border p-2 rounded w-full text-gray-900"
            required
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="border p-2 rounded w-full text-gray-900"
          />
          <button
            type="submit"
            onClick={addTransaction}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition col-span-full sm:col-auto"
          >
            Add Expense
          </button>
          
          <button
            type="submit"
            onClick={()=> alert("Functionality Loading!")}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition col-span-full sm:col-auto"
          >
            Add Income
          </button>
        </form>
      </div>

      {/* Transactions List */}
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Transactions</h2>
        {transactions.length === 0 ? (
          <p className="text-gray-500">No transactions yet</p>
        ) : (
          <ul className="space-y-4">
            {transactions.map(t => (
              <li
                key={t.id}
                className="border p-4 rounded flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 bg-gray-50"
              >
                <div className="text-gray-900">
                  {`${t.transaction_type} `}<strong>{t.category}</strong>: ${t.amount.toFixed(2)}
                  {t.description && ` — ${t.description}`}
                  
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                  <input
                    type="email"
                    placeholder="Partner email"
                    value={shareEmails[t.id] || ''}
                    onChange={e =>
                      setShareEmails({ ...shareEmails, [t.id]: e.target.value })
                    }
                    className="border p-1 rounded flex-1 sm:w-48 text-gray-900"
                  />
                  <button
                    onClick={() => shareTransaction(t.id)}
                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
                  >
                    Share
                  </button>
                  <button
                    onClick={() => deleteTransaction(t.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Page>
  )
}

export default Transactions