import React, { useRef, useEffect } from 'react'
import * as d3 from 'd3'
import { CHART_THEME, MODEL_COLORS } from './chartTheme'

interface RocPoint { fpr: number; tpr: number }

interface Props {
  curves: Record<string, RocPoint[]>   // model_id → points
  width?:  number
  height?: number
}

export default function RocCurves({ curves, width = 320, height = 280 }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || !Object.keys(curves).length) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const margin = { top: 24, right: 100, bottom: 44, left: 44 }
    const innerW = width - margin.left - margin.right
    const innerH = height - margin.top - margin.bottom
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    const x = d3.scaleLinear().domain([0, 1]).range([0, innerW])
    const y = d3.scaleLinear().domain([0, 1]).range([innerH, 0])

    // Grid
    g.append('g').call(d3.axisLeft(y).ticks(5).tickSize(-innerW).tickFormat(() => ''))
     .call(ax => ax.select('.domain').remove())
     .selectAll('line').attr('stroke', CHART_THEME.gridColor)
    g.append('g').attr('transform', `translate(0,${innerH})`)
     .call(d3.axisBottom(x).ticks(5).tickSize(-innerH).tickFormat(() => ''))
     .call(ax => ax.select('.domain').remove())
     .selectAll('line').attr('stroke', CHART_THEME.gridColor)

    // Axes
    g.append('g').attr('transform', `translate(0,${innerH})`).call(d3.axisBottom(x).ticks(5))
     .call(ax => ax.select('.domain').attr('stroke', CHART_THEME.axisColor))
     .selectAll('text').attr('fill', CHART_THEME.labelColor).attr('font-size', 10)
    g.append('g').call(d3.axisLeft(y).ticks(5))
     .call(ax => ax.select('.domain').attr('stroke', CHART_THEME.axisColor))
     .selectAll('text').attr('fill', CHART_THEME.labelColor).attr('font-size', 10)

    // Random baseline
    g.append('line').attr('x1', x(0)).attr('y1', y(0)).attr('x2', x(1)).attr('y2', y(1))
     .attr('stroke', 'rgba(255,255,255,0.15)').attr('stroke-dasharray', '4,4')

    // ROC curves
    const line = d3.line<RocPoint>().x((d) => x(d.fpr)).y((d) => y(d.tpr)).curve(d3.curveCatmullRom)
    let legendY = 0
    for (const [modelId, points] of Object.entries(curves)) {
      if (!points.length) continue
      const color = MODEL_COLORS[modelId] ?? '#888'
      const path = g.append('path')
        .datum(points).attr('fill', 'none').attr('stroke', color)
        .attr('stroke-width', 2).attr('stroke-linecap', 'round')
        .attr('d', line)
      // Animate draw
      const totalLen = (path.node() as SVGPathElement).getTotalLength()
      path.attr('stroke-dasharray', totalLen).attr('stroke-dashoffset', totalLen)
        .transition().duration(900).ease(d3.easeQuadOut).attr('stroke-dashoffset', 0)

      // Legend
      const label = modelId.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      g.append('circle').attr('cx', innerW + 10).attr('cy', legendY + 5).attr('r', 5).attr('fill', color)
      g.append('text').attr('x', innerW + 20).attr('y', legendY + 9)
       .attr('fill', CHART_THEME.labelColor).attr('font-size', 9).attr('font-family', CHART_THEME.font)
       .text(label)
      legendY += 18
    }

    // Axis labels
    svg.append('text').attr('x', margin.left + innerW / 2).attr('y', height - 4)
       .attr('text-anchor', 'middle').attr('fill', CHART_THEME.labelColor).attr('font-size', 10)
       .attr('font-family', CHART_THEME.font).text('False Positive Rate →')
    svg.append('text').attr('transform', `translate(12,${margin.top + innerH / 2}) rotate(-90)`)
       .attr('text-anchor', 'middle').attr('fill', CHART_THEME.labelColor).attr('font-size', 10)
       .attr('font-family', CHART_THEME.font).text('True Positive Rate ↑')
  }, [curves, width, height])

  return <svg ref={svgRef} width={width} height={height} />
}
