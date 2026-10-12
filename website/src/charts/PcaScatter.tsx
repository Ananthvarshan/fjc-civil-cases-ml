import React, { useRef, useEffect } from 'react'
import * as d3 from 'd3'
import { CHART_THEME, CLASS_COLORS } from './chartTheme'

interface Point { x: number; y: number; label: number }

interface Props {
  points:     Point[]
  k:          number
  width?:     number
  height?:    number
}

export default function PcaScatter({ points, k, width = 320, height = 280 }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || !points.length) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const margin = { top: 24, right: 20, bottom: 40, left: 44 }
    const innerW = width - margin.left - margin.right
    const innerH = height - margin.top - margin.bottom
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    const xExt = d3.extent(points, (d) => d.x) as [number, number]
    const yExt = d3.extent(points, (d) => d.y) as [number, number]

    const x = d3.scaleLinear().domain(xExt).nice().range([0, innerW])
    const y = d3.scaleLinear().domain(yExt).nice().range([innerH, 0])

    // Grid
    g.append('g').call(d3.axisLeft(y).ticks(5).tickSize(-innerW).tickFormat(() => ''))
     .call(ax => { ax.select('.domain').remove(); ax.selectAll('line').attr('stroke', CHART_THEME.gridColor) })
    g.append('g').attr('transform', `translate(0,${innerH})`).call(d3.axisBottom(x).ticks(5).tickSize(-innerH).tickFormat(() => ''))
     .call(ax => { ax.select('.domain').remove(); ax.selectAll('line').attr('stroke', CHART_THEME.gridColor) })

    // Axes
    g.append('g').attr('transform', `translate(0,${innerH})`).call(d3.axisBottom(x).ticks(5))
     .call(ax => ax.select('.domain').attr('stroke', CHART_THEME.axisColor))
     .selectAll('text').attr('fill', CHART_THEME.labelColor).attr('font-size', 9)
    g.append('g').call(d3.axisLeft(y).ticks(5))
     .call(ax => ax.select('.domain').attr('stroke', CHART_THEME.axisColor))
     .selectAll('text').attr('fill', CHART_THEME.labelColor).attr('font-size', 9)

    // Points
    g.selectAll('circle').data(points).join('circle')
      .attr('cx', (d) => x(d.x))
      .attr('cy', (d) => y(d.y))
      .attr('r', 0)
      .attr('fill', (d) => CLASS_COLORS[d.label % CLASS_COLORS.length])
      .attr('fill-opacity', 0.75)
      .attr('stroke', (d) => CLASS_COLORS[d.label % CLASS_COLORS.length])
      .attr('stroke-opacity', 0.4)
      .attr('stroke-width', 1)
      .transition().delay((_, i) => i * 1.5).duration(400)
      .attr('r', 4)

    // Title & axis labels
    svg.append('text').attr('x', margin.left + innerW / 2).attr('y', 14)
       .attr('text-anchor', 'middle').attr('fill', CHART_THEME.labelColor).attr('font-size', 12)
       .attr('font-family', CHART_THEME.font).text(`PCA Cluster Scatter (k=${k})`)
    svg.append('text').attr('x', margin.left + innerW / 2).attr('y', height - 4)
       .attr('text-anchor', 'middle').attr('fill', CHART_THEME.labelColor).attr('font-size', 9)
       .attr('font-family', CHART_THEME.font).text('PCA Component 1 →')
    svg.append('text').attr('transform', `translate(12,${margin.top + innerH / 2}) rotate(-90)`)
       .attr('text-anchor', 'middle').attr('fill', CHART_THEME.labelColor).attr('font-size', 9)
       .attr('font-family', CHART_THEME.font).text('PCA Component 2 ↑')
  }, [points, k, width, height])

  return <svg ref={svgRef} width={width} height={height} />
}
