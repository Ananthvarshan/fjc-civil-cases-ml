import React, { useRef, useEffect } from 'react'
import * as d3 from 'd3'
import { CHART_THEME, MODEL_COLORS } from './chartTheme'

interface Props {
  metrics: Record<string, { accuracy: number; precision: number; recall: number; f1: number }>
  width?:  number
  height?: number
}

const KEYS = ['accuracy', 'precision', 'recall', 'f1'] as const
const LABELS: Record<string, string> = { accuracy: 'Acc', precision: 'Pre', recall: 'Rec', f1: 'F1' }

export default function GroupedBars({ metrics, width = 480, height = 280 }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || !Object.keys(metrics).length) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const margin = { top: 28, right: 16, bottom: 48, left: 44 }
    const innerW = width - margin.left - margin.right
    const innerH = height - margin.top - margin.bottom
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    const modelIds = Object.keys(metrics)
    const x0 = d3.scaleBand().domain(modelIds).range([0, innerW]).paddingInner(0.25)
    const x1 = d3.scaleBand().domain(KEYS).range([0, x0.bandwidth()]).padding(0.05)
    const y  = d3.scaleLinear().domain([0, 1]).range([innerH, 0])

    // Grid
    g.append('g').call(d3.axisLeft(y).ticks(5).tickSize(-innerW).tickFormat(d3.format('.0%')))
     .call(ax => { ax.select('.domain').remove(); ax.selectAll('line').attr('stroke', CHART_THEME.gridColor) })
     .selectAll('text').attr('fill', CHART_THEME.labelColor).attr('font-size', 9)

    // Bars
    for (const [mid, m] of Object.entries(metrics)) {
      const color = MODEL_COLORS[mid] ?? '#888'
      const gx = g.append('g').attr('transform', `translate(${x0(mid)},0)`)

      KEYS.forEach((key) => {
        gx.append('rect')
          .attr('x', x1(key)!)
          .attr('width', x1.bandwidth())
          .attr('y', innerH)
          .attr('height', 0)
          .attr('rx', 3)
          .attr('fill', color)
          .attr('opacity', ['accuracy', 'f1'].includes(key) ? 0.9 : 0.5)
          .transition().duration(600).delay(KEYS.indexOf(key) * 60)
          .attr('y', y((m as Record<string, number>)[key] ?? 0))
          .attr('height', innerH - y((m as Record<string, number>)[key] ?? 0))
      })
    }

    // x axis: model names
    const xAxis = g.append('g').attr('transform', `translate(0,${innerH})`).call(d3.axisBottom(x0).tickSize(0))
    xAxis.select('.domain').remove()
    xAxis.selectAll('text')
      .attr('fill', CHART_THEME.labelColor).attr('font-size', 9)
      .attr('transform', 'rotate(-20)').style('text-anchor', 'end')
      .text((d) => (d as string).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))

    // Legend
    const legend = svg.append('g').attr('transform', `translate(${margin.left}, ${height - 8})`)
    KEYS.forEach((key, i) => {
      legend.append('rect').attr('x', i * 70).attr('width', 8).attr('height', 8).attr('rx', 2).attr('fill', '#888').attr('opacity', ['accuracy', 'f1'].includes(key) ? 0.9 : 0.5)
      legend.append('text').attr('x', i * 70 + 12).attr('y', 8).attr('fill', CHART_THEME.labelColor).attr('font-size', 9).text(LABELS[key])
    })
  }, [metrics, width, height])

  return <svg ref={svgRef} width={width} height={height} />
}
