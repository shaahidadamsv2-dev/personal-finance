'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

interface LastMonthData {
  category: string
  total: number
  month_start: string
}

interface LineChartProps {
  last12Months: LastMonthData[]
}

export default function LineChart({ last12Months }: LineChartProps) {
  const lineChartRef = useRef<SVGSVGElement | null>(null)

  useEffect(() => {
    if (!lineChartRef.current || last12Months.length === 0) return

    const svg = d3.select(lineChartRef.current)
    svg.selectAll('*').remove()

    const width = 600
    const height = 220
    const margin = { top: 20, right: 140, bottom: 30, left: 40 }
    const legendWidth = 120

    // Generate last 12 months
    const monthDates = Array.from({ length: 12 }, (_, i) => {
      const d = new Date()
      d.setMonth(d.getMonth() - (11 - i))
      d.setDate(1)
      return d
    })

    const monthNames = monthDates.map(d =>
      d.toLocaleString('default', { month: 'short', year: '2-digit' })
    )

    // Extract unique categories
    const categories = Array.from(new Set(last12Months.map(d => d.category)))

    // Build dataset with missing months filled
    const dataset = categories.map(cat => {
      const values = monthDates.map(d => {
        const monthData = last12Months.filter(
          item =>
            item.category === cat &&
            new Date(item.month_start).getFullYear() === d.getFullYear() &&
            new Date(item.month_start).getMonth() === d.getMonth()
        )
        return monthData.reduce((sum, item) => sum + Number(item.total), 0)
      })
      return { name: cat, values }
    })

    // Scales
    const x = d3.scalePoint().domain(monthNames).range([margin.left, width - margin.right - legendWidth])
    const y = d3.scaleLinear().domain([0, d3.max(dataset.flatMap(d => d.values))!]).nice().range([height - margin.bottom, margin.top])
    const color = d3.scaleOrdinal<string>().domain(categories).range(d3.schemeTableau10)

    const line = d3
      .line<number>()
      .x((d, i) => x(monthNames[i])!)
      .y(d => y(d))
      .curve(d3.curveMonotoneX)

    // Draw lines
    dataset.forEach(series => {
      svg
        .append('path')
        .datum(series.values)
        .attr('fill', 'none')
        .attr('stroke', color(series.name)!)
        .attr('stroke-width', 2)
        .attr('d', line)
    })

    // X axis
    svg.append('g').attr('transform', `translate(0,${height - margin.bottom})`).call(d3.axisBottom(x))

    // Y axis
    svg.append('g').attr('transform', `translate(${margin.left},0)`).call(d3.axisLeft(y))

    // Legend
    const legend = svg.append('g').attr('class', 'legend').attr('transform', `translate(${width - margin.right + 10}, ${margin.top})`)
    dataset.forEach((series, i) => {
      const legendRow = legend.append('g').attr('transform', `translate(0, ${i * 20})`)
      legendRow.append('rect').attr('width', 12).attr('height', 12).attr('fill', color(series.name)!)
      legendRow.append('text').attr('x', 16).attr('y', 12).attr('fill', '#ffffff').style('font-size', '12px').style('font-family', 'sans-serif').text(series.name)
    })

    svg.attr('viewBox', `0 0 ${width} ${height}`).style('width', '100%').style('height', 'auto')

  }, [last12Months])

  return <svg ref={lineChartRef}></svg>
}