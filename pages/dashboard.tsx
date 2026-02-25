
  'use client'

  import { useEffect, useState, useRef } from 'react'
  import { supabase } from '../lib/supabaseClient'
  import { useRouter } from 'next/router'
  import * as d3 from 'd3'
  import { sankey, sankeyLinkHorizontal } from 'd3-sankey'

  interface Transaction {
    id: string
    amount: number
    category: string
    description?: string
    transaction_date: string
  }

  export default function Dashboard() {
    const [user, setUser] = useState<any>(null)
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [amount, setAmount] = useState('')
    const [category, setCategory] = useState('')
    const [description, setDescription] = useState('')
    const [shareEmails, setShareEmails] = useState<{ [key: string]: string }>({})
    const router = useRouter()

      const sankeyRef = useRef<SVGSVGElement | null>(null)

    // --- Fetch current user ---
    useEffect(() => {
      const getUser = async () => {
        const { data } = await supabase.auth.getUser()
        if (!data.user) {
          router.push('/login')
        } else {
          setUser(data.user)
          fetchTransactions(data.user.id)
        }
      }
      getUser()
    }, [])

    // --- Fetch transactions ---
    const fetchTransactions = async (userId: string) => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('transaction_date', { ascending: false })

      if (error) console.error(error)
      else setTransactions(data || [])
    }

    // --- Add transaction ---
    const addTransaction = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!user) return
      const { data, error } = await supabase.from('transactions').insert([
        { user_id: user.id, amount: parseFloat(amount), category, description },
      ])
      if (error) alert('Failed to add transaction')
      else {
        setAmount('')
        setCategory('')
        setDescription('')
        fetchTransactions(user.id)
      }
    }

  const deleteTransaction = async (transactionId: string) => {
    if (!user) return
    if (!confirm('Are you sure you want to delete this transaction?')) return

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId)
        .eq('user_id', user.id) // ensure only user's own transactions can be deleted

      if (error) {
        console.error('Delete error:', error)
        alert(`Delete failed: ${error.message}`)
      } else {
        // Refresh transactions after delete
        setTransactions(transactions.filter(t => t.id !== transactionId))
      }
    } catch (err) {
      console.error('Delete exception:', err)
      alert('Something went wrong while deleting')
    }
  }

    // --- Share transaction ---
    const shareTransaction = async (transactionId: string) => {
      const email = shareEmails[transactionId]
      if (!email) return alert("Enter a user's email")
      if (!user) return

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

        if (insertError) return alert(`Error sharing transaction: ${insertError.message}`)

        alert('Transaction shared!')
        setShareEmails({ ...shareEmails, [transactionId]: '' })
      } catch (err) {
        console.error('Share error:', err)
        alert('Something went wrong while sharing')
      }
    }

    const logout = async () => {
      await supabase.auth.signOut()
      router.push('/login')
    }

    useEffect(() => {
    if (!sankeyRef.current) return

    const svg = d3.select(sankeyRef.current)
    svg.selectAll('*').remove()

    const container = sankeyRef.current.parentElement
    const fullWidth = container ? container.offsetWidth : 600
    const fullHeight = 400

    // Add more right margin to avoid label cutoff
    const margin = { top: 20, right: 140, bottom: 20, left: 20 }
    const width = fullWidth - margin.left - margin.right
    const height = fullHeight - margin.top - margin.bottom

    const grossIncome = 29000
    const netIncome = 23700

    // Group transactions by category
    const categorySums: Record<string, number> = {}
    transactions.forEach(t => {
      if (!categorySums[t.category]) categorySums[t.category] = 0
      categorySums[t.category] += t.amount
    })
    const categories = Object.keys(categorySums)
    const spentTotal = Object.values(categorySums).reduce((a, b) => a + b, 0)
    const remaining = Math.max(netIncome - spentTotal, 0)

    const nodes = [
      { name: `Gross [${grossIncome}]` },
      { name: `Net [${netIncome}]` },
      ...categories.map(c => ({ name: `${c} [${categorySums[c]}]` })),
      { name: `Remaining [${remaining}]` }
    ]

    const links = [
      { source: 0, target: 1, value: netIncome },
      ...categories.map((c, i) => ({ source: 1, target: i + 2, value: categorySums[c] })),
      { source: 1, target: nodes.length - 1, value: remaining }
    ]

    interface SankeyNode { name: string; x0?: number; x1?: number; y0?: number; y1?: number }
    interface SankeyLink { source: number; target: number; value: number; width?: number }

    const sankeyGenerator = sankey<SankeyNode, SankeyLink>()
      .nodeWidth(20)
      .nodePadding(10)
      .extent([[0, 0], [width, height]])

    const { nodes: sankeyNodes, links: sankeyLinks } = sankeyGenerator({
      nodes: JSON.parse(JSON.stringify(nodes)),
      links: JSON.parse(JSON.stringify(links))
    })

    const g = svg
      .attr('width', '100%')
      .attr('height', fullHeight)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Draw links
    g.append('g')
      .selectAll('path')
      .data(sankeyLinks)
      .join('path')
      .attr('d', sankeyLinkHorizontal())
      .attr('stroke', '#4f46e5')
      .attr('stroke-width', d => Math.max(1, d.width || 1))
      .attr('fill', 'none')
      .attr('opacity', 0.5)

    // Draw nodes
    g.append('g')
      .selectAll('rect')
      .data(sankeyNodes)
      .join('rect')
      .attr('x', d => d.x0 || 0)
      .attr('y', d => d.y0 || 0)
      .attr('height', d => (d.y1 || 0) - (d.y0 || 0))
      .attr('width', d => (d.x1 || 0) - (d.x0 || 0))
      .attr('fill', d => {
        if (d.name.startsWith('Gross')) return '#f59e0b'
        if (d.name.startsWith('Net')) return '#6366f1'
        if (d.name.startsWith('Remaining')) return '#22c55e'
        return '#2563eb'
      })

    // Node labels (to the right of nodes)
    g.append('g')
      .selectAll('text')
      .data(sankeyNodes)
      .join('text')
      .attr('x', d => (d.x1 || 0) + 6) // label outside node
      .attr('y', d => ((d.y1 || 0) + (d.y0 || 0)) / 2)
      .attr('alignment-baseline', 'middle')
      .text(d => d.name)
      .attr('fill', '#000')
      .style('font-size', '12px')
  }, [transactions])

    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4 sm:mb-0">Dashboard</h1>
            <div className="flex gap-2 items-center">
              <p className="text-gray-800">Welcome {user?.email}</p>
              <button
                onClick={logout}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Add Transaction Form */}
          <div className="bg-white p-6 rounded shadow mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Add Transaction</h2>
            <form
              onSubmit={addTransaction}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end"
            >
              <input
                type="number"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="border p-2 rounded w-full text-gray-900"
                required
              />
              <input
                type="text"
                placeholder="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="border p-2 rounded w-full text-gray-900"
                required
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="border p-2 rounded w-full text-gray-900"
              />
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition col-span-full sm:col-auto"
              >
                Add
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
                {transactions.map((t) => (
                  <li
                    key={t.id}
                    className="border p-4 rounded flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 bg-gray-50"
                  >
                    <div className="text-gray-900">
                      <strong>{t.category}</strong>: ${t.amount.toFixed(2)}
                      {t.description && ` — ${t.description}`}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                      {/* Share input */}
                      <input
                        type="email"
                        placeholder="Partner email"
                        value={shareEmails[t.id] || ''}
                        onChange={(e) =>
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

              {/* Sankey Chart */}
          <div className="bg-white p-6 rounded shadow mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Transactions Sankey (Dummy)</h2>
            <svg ref={sankeyRef} width={600} height={300}></svg>
          </div>
        </div>
      </div>
    )
  }