'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
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
  user: any
  setUser: (user: any) => void
  selectedAccount?: string | null
  setSelectedAccount: (account: string | null) => void
}

export default function Dashboard({ user, setUser, selectedAccount, setSelectedAccount }: DashboardProps) {
  const [categoryTotals, setCategoryTotals] = useState<CategoryTotal[]>([])
  const [payday, setPayday] = useState(25)
  const router = useRouter()
  const sankeyRef = useRef<SVGSVGElement | null>(null)

  const fetchCategoryTotals = useCallback(async (userId: string) => {
    if (!userId) return

    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth()
    console.log('Fetching category totals for:', userId, year, month)

    const { data, error } = await supabase.rpc('get_category_totals_by_paymonth', {
      p_user_id: userId,
      p_year: year,
      p_month: month,
      p_payday: payday
    })

    if (error) console.error(error)
    else setCategoryTotals(data || [])

    console.log('Fetched category totals:', data)
  }, [payday])

  useEffect(() => {
    if (!selectedAccount) return
    fetchCategoryTotals(selectedAccount)
  }, [selectedAccount, fetchCategoryTotals])

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
    const categoryColor = d3.scaleOrdinal<string>()
  .domain(categories)
  .range(d3.schemeObservable10)
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
  // viewBox starts at 0,0 so no extra left space
  .attr('viewBox', `0 0 ${layoutWidth + margin.right} ${layoutHeight + margin.top + margin.bottom}`)
  .attr('preserveAspectRatio', 'xMinYMin meet') // aligns to top-left, not center
  .style('width', '100%')
  .style('height', 'auto')
  svg.style('background', 'transparent');

// Move <g> down only for top margin, remove left margin translation
const g = svg.append('g')
  .attr('transform', `translate(0, ${margin.top})`) // remove margin.left

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
        if (name.startsWith('Remaining')) return '#22c55e'
        if (name.startsWith('Pension')) return '#f97316'
        const categoryName = name.split(' [')[0]
        return categoryColor(categoryName)
        
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
        const categoryName = d.name.split(' [')[0]
        return categoryColor(categoryName)

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
      .attr('fill', '#ffffff')
      .style('font-size', '12px')
  }, [categoryTotals])

  // Add this inside your Dashboard component, after the Sankey useEffect

const lineChartRef = useRef<SVGSVGElement | null>(null)

useEffect(() => {
  if (!lineChartRef.current) return

  const svg = d3.select(lineChartRef.current)
  svg.selectAll('*').remove()

  const width = 600
  const height = 220
  const margin = { top: 20, right: 20, bottom: 30, left: 40 }

  const months = ['Oct','Nov','Dec','Jan','Feb','Mar']

  const dataset = [
    { name: "Food", values: [1200,1500,900,1800,1700,2000] },
    { name: "Transport", values: [600,800,700,900,850,1000] },
    { name: "Entertainment", values: [400,500,450,600,650,700] }
  ]

  const x = d3.scalePoint()
    .domain(months)
    .range([margin.left, width - margin.right])

  const y = d3.scaleLinear()
    .domain([0, d3.max(dataset.flatMap(d => d.values))!])
    .nice()
    .range([height - margin.bottom, margin.top])

  const color = d3.scaleOrdinal<string>()
    .domain(dataset.map(d => d.name))
    .range(["#6366f1","#22c55e","#f59e0b"])

  const line = d3.line<number>()
    .x((d,i) => x(months[i])!)
    .y(d => y(d))
    .curve(d3.curveMonotoneX)

  const area = d3.area<number>()
    .x((d,i) => x(months[i])!)
    .y0(height - margin.bottom)
    .y1(d => y(d))
    .curve(d3.curveMonotoneX)

  // draw areas first
  dataset.forEach(series => {
    svg.append("path")
      .datum(series.values)
      .attr("fill", color(series.name) as string)
      .attr("opacity", 0.2)
      .attr("d", area)
  })

  // draw lines
  dataset.forEach(series => {
    svg.append("path")
      .datum(series.values)
      .attr("fill", "none")
      .attr("stroke", color(series.name) as string)
      .attr("stroke-width", 2)
      .attr("d", line)
  })

  // axes
  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x))

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y))

  svg
    .attr("viewBox", `0 0 ${width} ${height}`)
    .style("width", "100%")
    .style("height", "auto")

}, [])
  return (
    <Page title="Dashboard" user={user} setUser={setUser} selectedAccount={selectedAccount} setSelectedAccount={setSelectedAccount} >
      <div className="bg-gray-100 p-4 test">
       <div className="max-w-4xl bg-gray-100 mx-auto  test"> {/* full viewport height */}
          {/* Sankey Chart */}
          <div className="sankey-container h-full flex flex-col"> {/* full height and flex for heading + chart */}
            <h2 className="text-xl font-semibold text-white mb-4 flex-none">Transactions Sankey</h2>
            <svg ref={sankeyRef} className="flex-1 w-full"></svg> {/* takes remaining height */}
          </div>
        </div>
      </div>

      {/* Responsive Sankey CSS */}
      <style jsx>{`
      .test{
        background-color: #f9f9fb00 !important;
        height: auto;
      }
        .sankey-container {
          width: 100%;
          overflow-x: auto;
         
          overflow: hidden; /* TURN OFF ALL SCROLLING */
          
        }

        .sankey-container svg {
          width: 100%;
         
          transform-origin: top left;
          transform: scale(1);
        }

        @media (max-width: 640px) {
          .sankey-container svg {
          margin-bottom: 60px;
            transform: scale(1.1); /* zoom 1.5x on mobile */
          }
          
        }
      `}</style>

      {/* Simple line chart */}
<div className="linechart-container mt-8">
  <h2 className="text-xl font-semibold text-white mb-4">Dummy Line Chart</h2>
  <svg ref={lineChartRef}></svg>
</div>
    </Page>
  )
}