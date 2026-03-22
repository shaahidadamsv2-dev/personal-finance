'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { sankey, sankeyLinkHorizontal } from 'd3-sankey'

interface CategoryTotal {
  category: string
  total: number
  transaction_type: 'income' | 'expense'
}

interface SankeyChartProps {
  categoryTotals: CategoryTotal[]
  settings: {
    grossIncome: number
    monthlyTax: number
    monthlyUIF: number
    monthlyPension: number
  }
}

export default function SankeyChart({ categoryTotals, settings }: SankeyChartProps) {
  const sankeyRef = useRef<SVGSVGElement | null>(null)

  useEffect(() => {
    if (!sankeyRef.current) return
    const svg = d3.select(sankeyRef.current)
    svg.selectAll('*').remove()

    const layoutWidth = 600
    const layoutHeight = 400
    const margin = { top: 20, right: 140, bottom: 20, left: 20 }

    const grossIncome = settings.grossIncome
    const tax = settings.monthlyTax
    const uif = settings.monthlyUIF
    const pension = settings.monthlyPension
    const netIncome = grossIncome - tax - uif - pension

    const expenseSums: Record<string, number> = {}
    const incomeSums: Record<string, number> = {}
    categoryTotals.forEach(c => {
      if (c.transaction_type === 'expense') expenseSums[c.category] = (expenseSums[c.category] || 0) + c.total
      if (c.transaction_type === 'income') incomeSums[c.category] = (incomeSums[c.category] || 0) + c.total
    })

    const expenseCategories = Object.keys(expenseSums)
    const incomeCategories = Object.keys(incomeSums)
    const spentTotal = Object.values(expenseSums).reduce((a, b) => a + b, 0)
    const incomeTotal = Object.values(incomeSums).reduce((a,b)=>a+b,0)
    const remaining = Math.max(netIncome + incomeTotal - spentTotal, 0)

    const categoryColor = d3.scaleOrdinal<string>()
      .domain([...expenseCategories, ...incomeCategories])
      .range(d3.schemeTableau10)

    const nodes: { name: string }[] = [{ name: 'Gross [Gross Income]' }]
    const links: { source: number; target: number; value: number }[] = []

    let nextNodeIndex = 1
    const deductions = [
      { name: `Tax [${tax}]`, value: tax },
      { name: `UIF [${uif}]`, value: uif },
      { name: `Pension [${pension}]`, value: pension },
    ]

    deductions.forEach(d => {
      if (d.value > 0) {
        nodes.push({ name: d.name })
        links.push({ source: 0, target: nextNodeIndex, value: d.value })
        nextNodeIndex++
      }
    })

    nodes.push({ name: `Net [${netIncome}]` })
    const netIndex = nodes.length - 1
    links.push({ source: 0, target: netIndex, value: netIncome })

    const incomeStartIndex = nodes.length
    incomeCategories.forEach(c => nodes.push({ name: `${c} [${incomeSums[c]}]` }))
    incomeCategories.forEach((c, i) => links.push({ source: incomeStartIndex + i, target: netIndex, value: incomeSums[c] }))

    const expenseStartIndex = nodes.length
    expenseCategories.forEach(c => nodes.push({ name: `${c} [${expenseSums[c]}]` }))
    expenseCategories.forEach((c, i) => links.push({ source: netIndex, target: expenseStartIndex + i, value: expenseSums[c] }))

    nodes.push({ name: `Remaining [${remaining}]` })
    const remainingIndex = nodes.length - 1
    links.push({ source: netIndex, target: remainingIndex, value: remaining })

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
      .attr('viewBox', `0 0 ${layoutWidth + margin.right} ${layoutHeight + margin.top + margin.bottom}`)
      .attr('preserveAspectRatio', 'xMinYMin meet')
      .style('width', '100%')
      .style('height', 'auto')
      .style('background', 'transparent')

    const g = svg.append('g').attr('transform', `translate(0, ${margin.top})`)

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
        if (name.startsWith('Remaining')) return '#22c55e'
        if (incomeCategories.some(c=>name.startsWith(c))) return '#10b981'
        const categoryName = name.split(' [')[0]
        return categoryColor(categoryName)
      })
      .attr('stroke-width', d=>Math.max(1,d.width||1))
      .attr('fill','none')
      .attr('opacity',0.5)

    g.append('g')
      .selectAll('rect')
      .data(sankeyNodes)
      .join('rect')
      .attr('x', d => d.x0 || 0)
      .attr('y', d => d.y0 || 0)
      .attr('height', d => (d.y1||0)-(d.y0||0))
      .attr('width', d => (d.x1||0)-(d.x0||0))
      .attr('fill', d=>{
        if (d.name.startsWith('Gross')) return '#f59e0b'
        if (d.name.startsWith('Net')) return '#6366f1'
        if (d.name.startsWith('Remaining')) return '#22c55e'
        if (d.name.startsWith('Tax')) return '#ef4444'
        if (d.name.startsWith('UIF')) return '#fbbf24'
        if (d.name.startsWith('Pension')) return '#f97316'
        if (incomeCategories.some(c=>d.name.startsWith(c))) return '#10b981'
        const categoryName = d.name.split(' [')[0]
        return categoryColor(categoryName)
      })

    g.append('g')
      .selectAll('text')
      .data(sankeyNodes)
      .join('text')
      .attr('x', d=>(d.x1||0)+6)
      .attr('y', d=>((d.y1||0)+(d.y0||0))/2)
      .attr('alignment-baseline','middle')
      .text(d=>d.name)
      .attr('fill','#ffffff')
      .style('font-size','12px')

       const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3]) // min/max zoom
      .on('zoom', (event) => {
        g.attr('transform', event.transform.toString())
      })

    svg.call(zoom)


  }, [categoryTotals, settings])

  return <div>
    
      <svg className='sankey-container-svg' ref={sankeyRef}></svg>
    <style jsx>{`

    .sankey-container {
    width: 100%;
    overflow: hidden; /* clip instead of scroll */
  }
  svg {
    width: 100%;
    transform-origin: top left;
    transform: scale(1);
  }

  @media (max-width: 640px) {
    svg {
      margin-bottom: 60px;
      transform: scale(1.1);
    }
  }
`}</style>
    </div>
}