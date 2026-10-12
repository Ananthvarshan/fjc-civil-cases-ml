import React, { useRef, useEffect } from 'react'
import * as d3 from 'd3'
import { CHART_THEME } from './chartTheme'

interface ElbowPoint { k: number; inertia: number }

interface Props {
  data:    ElbowPoint[]
  accent?: string
  width?:  number
  height?: number
}

export default function ElbowCurve({ data, accent = '#38bdf8', width = 300, height = 220 }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || !data.length) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const margin = { top: 24, right: 20, bottom: 40, left: 56 }
    const innerW = width - margin.left - margin.right
    const innerH = height - margin.top - margin.bottom
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    const x = d3.scaleLinear().domain(d3.extent(data, (d) => d.k) as [number, number]).range([0, innerW])
    const y = d3.scaleLinear().domain([0, d3.max(data, (d) => d.inertia) ?? 1]).range([innerH, 0])

    // Grid
    g.append('g').call(d3.axisLeft(y).ticks(5).tickSize(-innerW).tickFormat(() => ''))
     .call(ax => { ax.select('.domain').remove(); ax.selectAll('line').attr('stroke', CHART_THEME.gridColor) })

    // Axes
    g.append('g').attr('transform', `translate(0,${innerH})`).call(d3.axisBottom(x).ticks(data.length).tickFormat(d3.format('d')))
     .call(ax => ax.select('.domain').attr('stroke', CHART_THEME.axisColor))
     .selectAll('text').attr('fill', CHART_THEME.labelColor).attr('font-size', 10)
    g.append('g').call(d3.axisLeft(y).ticks(5))
     .call(ax => ax.select('.domain').attr('stroke', CHART_THEME.axisColor))
     .selectAll('text').attr('fill', CHART_THEME.labelColor).attr('font-size', 10)

    // Area fill
    const area = d3.area<ElbowPoint>().x((d) => x(d.k)).y0(innerH).y1((d) => y(d.inertia)).curve(d3.curveCatmullRom)
    g.append('path').datum(data).attr('fill', accent + '18').attr('d', area)

    // Line
    const line = d3.line<ElbowPoint>().x((d) => x(d.k)).y((d) => y(d.inertia)).curve(d3.curveCatmullRom)
    const path = g.append('path').datum(data).attr('fill', 'none').attr('stroke', accent).attr('stroke-width', 2.5).attr('d', line)
    const len = (path.node() as SVGPathElement).getTotalLength()
    path.attr('stroke-dasharray', len).attr('stroke-dashoffset', len)
      .transition().duration(900).ease(d3.easeQuadOut).attr('stroke-dashoffset', 0)

    // Dots
    g.selectAll('circle').data(data).join('circle')
      .attr('cx', (d) => x(d.k)).attr('cy', (d) => y(d.inertia))
      .attr('r', 4).attr('fill', accent).attr('stroke', '#0c1226').attr('stroke-width', 2)

    // Axis labels
    svg.append('text').attr('x', margin.left + innerW / 2).attr('y', height - 4)
       .attr('text-anchor', 'middle').attr('fill', CHART_THEME.labelColor).attr('font-size', 10)
       .attr('font-family', CHART_THEME.font).text('Number of clusters (k)')
    svg.append('text').attr('transform', `translate(12,${margin.top + innerH / 2}) rotate(-90)`)
       .attr('text-anchor', 'middle').attr('fill', CHART_THEME.labelColor).attr('font-size', 10)
       .attr('font-family', CHART_THEME.font).text('Inertia')
    svg.append('text').attr('x', margin.left + innerW / 2).attr('y', 14)
       .attr('text-anchor', 'middle').attr('fill', CHART_THEME.labelColor).attr('font-size', 12)
       .attr('font-family', CHART_THEME.font).text('Elbow Curve')
  }, [data, accent, width, height])

  return <svg ref={svgRef} width={width} height={height} />
}
