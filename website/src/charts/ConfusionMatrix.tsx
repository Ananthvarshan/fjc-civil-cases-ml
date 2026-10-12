import React, { useRef, useEffect, useState } from 'react'
import * as d3 from 'd3'
import { CHART_THEME, CLASS_COLORS } from './chartTheme'

interface Props {
  matrix:     number[][]
  classNames: string[]
  accent?:    string
  width?:     number
  height?:    number
}

export default function ConfusionMatrix({ matrix, classNames, accent = '#10b981', width = 320, height = 320 }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null)

  useEffect(() => {
    if (!svgRef.current || !matrix.length) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const margin = { top: 40, right: 16, bottom: 60, left: 60 }
    const innerW = width - margin.left - margin.right
    const innerH = height - margin.top - margin.bottom
    const n = classNames.length

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    const x = d3.scaleBand().domain(classNames).range([0, innerW]).padding(0.05)
    const y = d3.scaleBand().domain(classNames).range([0, innerH]).padding(0.05)

    const max = d3.max(matrix.flat()) ?? 1
    const colorScale = d3.scaleSequential(d3.interpolateRgb('rgba(12,18,38,0.3)', accent))
                         .domain([0, max])

    // Cells
    for (let row = 0; row < n; row++) {
      for (let col = 0; col < n; col++) {
        const val = matrix[row][col]
        g.append('rect')
          .attr('x', x(classNames[col])!)
          .attr('y', y(classNames[row])!)
          .attr('width', x.bandwidth())
          .attr('height', y.bandwidth())
          .attr('rx', 4)
          .attr('fill', colorScale(val))
          .attr('stroke', 'rgba(255,255,255,0.05)')
          .attr('stroke-width', 1)
          .style('cursor', 'pointer')
          .on('mousemove', (event) => {
            setTooltip({
              x: event.offsetX,
              y: event.offsetY,
              text: `${val} cases: actual ${classNames[row]} → predicted ${classNames[col]}`,
            })
          })
          .on('mouseleave', () => setTooltip(null))

        // Value text
        g.append('text')
          .attr('x', x(classNames[col])! + x.bandwidth() / 2)
          .attr('y', y(classNames[row])! + y.bandwidth() / 2)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'central')
          .attr('fill', val > max * 0.5 ? '#fff' : 'rgba(255,255,255,0.5)')
          .attr('font-size', 11)
          .attr('font-family', CHART_THEME.font)
          .text(val)
      }
    }

    // Axes
    const xAxis = g.append('g').attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(x).tickSize(0))
    xAxis.select('.domain').remove()
    xAxis.selectAll('text')
      .attr('fill', CHART_THEME.labelColor)
      .attr('font-size', 10)
      .attr('transform', 'rotate(-30)')
      .style('text-anchor', 'end')

    const yAxis = g.append('g').call(d3.axisLeft(y).tickSize(0))
    yAxis.select('.domain').remove()
    yAxis.selectAll('text').attr('fill', CHART_THEME.labelColor).attr('font-size', 10)

    // Labels
    svg.append('text').attr('x', width / 2).attr('y', margin.top - 16)
       .attr('text-anchor', 'middle').attr('fill', CHART_THEME.labelColor).attr('font-size', 12)
       .attr('font-family', CHART_THEME.font).text('Confusion Matrix')
    svg.append('text').attr('x', width / 2).attr('y', height - 4)
       .attr('text-anchor', 'middle').attr('fill', CHART_THEME.labelColor).attr('font-size', 10)
       .attr('font-family', CHART_THEME.font).text('Predicted class →')
    svg.append('text')
       .attr('transform', `translate(12,${height / 2}) rotate(-90)`)
       .attr('text-anchor', 'middle').attr('fill', CHART_THEME.labelColor).attr('font-size', 10)
       .attr('font-family', CHART_THEME.font).text('← Actual class')
  }, [matrix, classNames, accent, width, height])

  return (
    <div className="relative">
      <svg ref={svgRef} width={width} height={height} />
      {tooltip && (
        <div
          className="absolute pointer-events-none glass-card text-xs text-white/80 px-3 py-2 rounded-lg z-10 max-w-48"
          style={{ left: tooltip.x + 12, top: tooltip.y - 10 }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  )
}
