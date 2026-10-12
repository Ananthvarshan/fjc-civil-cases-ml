import React, { useRef, useEffect } from 'react'
import * as d3 from 'd3'
import { CHART_THEME } from './chartTheme'

interface Props {
  features:   string[]
  importances: number[]
  accent?:    string
  width?:     number
  height?:    number
}

export default function FeatureImportance({ features, importances, accent = '#10b981', width = 320, height = 280 }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || !features.length) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const margin = { top: 20, right: 20, bottom: 16, left: 120 }
    const innerW = width - margin.left - margin.right
    const innerH = height - margin.top - margin.bottom

    // Sort descending
    const data = features.map((f, i) => ({ feature: f, value: importances[i] ?? 0 }))
      .sort((a, b) => b.value - a.value).slice(0, 10)

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    const y = d3.scaleBand().domain(data.map((d) => d.feature)).range([0, innerH]).padding(0.3)
    const x = d3.scaleLinear().domain([0, d3.max(data, (d) => d.value) ?? 1]).range([0, innerW])

    // Bars
    g.selectAll('rect').data(data).join('rect')
      .attr('y', (d) => y(d.feature)!)
      .attr('height', y.bandwidth())
      .attr('x', 0).attr('width', 0)
      .attr('rx', 4)
      .attr('fill', accent + 'cc')
      .transition().duration(700).ease(d3.easeQuadOut)
      .attr('width', (d) => x(d.value))

    // Value labels
    g.selectAll('text.val').data(data).join('text')
      .attr('class', 'val')
      .attr('y', (d) => y(d.feature)! + y.bandwidth() / 2)
      .attr('x', (d) => x(d.value) + 4)
      .attr('dominant-baseline', 'central')
      .attr('fill', CHART_THEME.labelColor).attr('font-size', 9)
      .text((d) => d.value.toFixed(3))

    // Y axis
    g.append('g').call(d3.axisLeft(y).tickSize(0))
     .call(ax => ax.select('.domain').remove())
     .selectAll('text').attr('fill', CHART_THEME.labelColor).attr('font-size', 10)

    svg.append('text').attr('x', margin.left + innerW / 2).attr('y', 12)
       .attr('text-anchor', 'middle').attr('fill', CHART_THEME.labelColor)
       .attr('font-size', 12).attr('font-family', CHART_THEME.font).text('Feature Importances')
  }, [features, importances, accent, width, height])

  return <svg ref={svgRef} width={width} height={height} />
}
