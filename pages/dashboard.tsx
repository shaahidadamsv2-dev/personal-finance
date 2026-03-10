'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/router'
import * as d3 from 'd3'
import { sankey, sankeyLinkHorizontal } from 'd3-sankey'
import Page from '@/components/page'

interface CategoryTotal {
  category: string
  total: number
}

interface DashboardProps {
  user: any // you can type this properly later
  setUser: (user: any) => void
}

export default function Dashboard({ user, setUser }: DashboardProps) {
  const [categoryTotals, setCategoryTotals] = useState<CategoryTotal[]>([])
  const [payday, setPayday] = useState(25) // default pay date
  const router = useRouter()
  const sankeyRef = useRef<SVGSVGElement | null>(null)

  // --- Fetch current user ---
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) router.push('/login')
      else {
        setUser(data.user)
        fetchCategoryTotals(data.user.id)
      }
    }
    getUser()
  }, [])

  // --- Fetch category totals via stored procedure ---
  const fetchCategoryTotals = async (userId: string) => {
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth()
    console.log('Fetching category totals for:', year, month)

    const { data, error } = await supabase.rpc('get_category_totals_by_paymonth', {
      p_user_id: userId,
      p_year: year,
      p_month: month,
      p_payday: payday
    })

    if (error) console.error(error)
    else setCategoryTotals(data || [])
  console.log('Fetched category totals:', data)
  }

  // --- Sankey chart ---
  useEffect(() => {
    if (!sankeyRef.current) return

    const svg = d3.select(sankeyRef.current)
    svg.selectAll('*').remove()

    const layoutWidth = 600
    const layoutHeight = 400
    const margin = { top: 20, right: 140, bottom: 20, left: 20 }

    const grossIncome = 29000
    const tax = 5300
    const uif = 177
    const pension = 582
    const netIncome = grossIncome - tax - uif - pension

    const categories = categoryTotals.map(c => c.category)
    const categorySums: Record<string, number> = {}
    categoryTotals.forEach(c => (categorySums[c.category] = c.total))
    const spentTotal = Object.values(categorySums).reduce((a, b) => a + b, 0)
    const remaining = Math.max(netIncome - spentTotal, 0)

    const nodes = [
      { name: `Gross [${grossIncome}]` },
      { name: `Tax [${tax}]` },
      { name: `UIF [${uif}]` },
      { name: `Pension [${pension}]` },
      { name: `Net [${netIncome}]` },
      ...categories.map(c => ({ name: `${c} [${categorySums[c]}]` })),
      { name: `Remaining [${remaining}]` }
    ]

    const links = [
      { source: 0, target: 1, value: tax },
      { source: 0, target: 2, value: uif },
      { source: 0, target: 3, value: pension },
      { source: 0, target: 4, value: netIncome },
      ...categories.map((c, i) => ({ source: 4, target: i + 5, value: categorySums[c] })),
      { source: 4, target: nodes.length - 1, value: remaining }
    ]

    interface SankeyNode { name: string; x0?: number; x1?: number; y0?: number; y1?: number }
    interface SankeyLink { source: number; target: number; value: number; width?: number }

    const sankeyGenerator = sankey<SankeyNode, SankeyLink>()
      .nodeWidth(20)
      .nodePadding(10)
      .extent([[0, 0], [layoutWidth, layoutHeight]])

    const { nodes: sankeyNodes, links: sankeyLinks } = sankeyGenerator({
      nodes: JSON.parse(JSON.stringify(nodes)),
      links: JSON.parse(JSON.stringify(links))
    })

    svg
      .attr('viewBox', `0 0 ${layoutWidth + margin.left + margin.right} ${layoutHeight + margin.top + margin.bottom}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .style('width', '100%')
      .style('height', 'auto')

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    // Links
    g.append('g')
      .selectAll('path')
      .data(sankeyLinks)
      .join('path')
      .attr('d', sankeyLinkHorizontal())
      .attr('stroke', d => {
        const name = (d.target as SankeyNode).name
        if (name.startsWith('Tax')) return '#ef4444'
        if (name.startsWith('UIF')) return '#fbbf24'
        if (name.startsWith('Pension')) return '#f97316'
        return '#4f46e5'
      })
      .attr('stroke-width', d => Math.max(1, d.width || 1))
      .attr('fill', 'none')
      .attr('opacity', 0.5)

    // Nodes
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
        if (d.name.startsWith('Tax')) return '#ef4444'
        if (d.name.startsWith('UIF')) return '#fbbf24'
        if (d.name.startsWith('Pension')) return '#f97316'
        return '#2563eb'
      })

    // Node labels
    g.append('g')
      .selectAll('text')
      .data(sankeyNodes)
      .join('text')
      .attr('x', d => (d.x1 || 0) + 6)
      .attr('y', d => ((d.y1 || 0) + (d.y0 || 0)) / 2)
      .attr('alignment-baseline', 'middle')
      .text(d => d.name)
      .attr('fill', '#000')
      .style('font-size', '12px')
  }, [categoryTotals])

  return (
    <Page title="Dashboard" user={user}>
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Sankey Chart */}
          <div className="bg-white p-6 rounded shadow mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Transactions Sankey</h2>
            <svg ref={sankeyRef} width={600} height={300}></svg>
          </div>
        </div>
      </div>
    </Page>
  )
}