import React, { useRef, useEffect } from 'react'
import * as d3 from 'd3'
import { CHART_THEME, MODEL_COLORS } from './chartTheme'

interface Props {
  metrics: Record<string, { accuracy: number; precision: number; recall: number; f1: number; roc_auc: number }>
  width?:  number
  height?: number
}

const METRICS_KEYS = ['accuracy', 'precision', 'recall', 'f1', 'roc_auc'] as const
const METRIC_LABELS = { accuracy: 'Accuracy', precision: 'Precision', recall: 'Recall', f1: 'F1', roc_auc: 'AUC' }

export default function RadarCompare({ metrics, width = 340, height = 300 }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || !Object.keys(metrics).length) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const cx = width / 2, cy = height / 2
    const r  = Math.min(cx, cy) - 48
    const n  = METRICS_KEYS.length
    const angleSlice = (Math.PI * 2) / n

    const g = svg.append('g').attr('transform', `translate(${cx},${cy})`)

    // Grid rings
    for (let lvl = 1; lvl <= 5; lvl++) {
      const frac = lvl / 5
      const pts = METRICS_KEYS.map((_, i) => {
        const angle = i * angleSlice - Math.PI / 2
        return [Math.cos(angle) * r * frac, Math.sin(angle) * r * frac] as [number, number]
      })
      g.append('polygon')
        .attr('points', pts.map((p) => p.join(',')).join(' '))
        .attr('fill', 'none').attr('stroke', CHART_THEME.gridColor)
    }

    // Axes
    METRICS_KEYS.forEach((key, i) => {
      const angle = i * angleSlice - Math.PI / 2
      const x = Math.cos(angle) * r, y = Math.sin(angle) * r
      g.append('line').attr('x1', 0).attr('y1', 0).attr('x2', x).attr('y2', y)
       .attr('stroke', CHART_THEME.gridColor)
      const lx = Math.cos(angle) * (r + 20), ly = Math.sin(angle) * (r + 20)
      g.append('text').attr('x', lx).attr('y', ly)
       .attr('text-anchor', Math.abs(lx) < 10 ? 'middle' : lx > 0 ? 'start' : 'end')
       .attr('dominant-baseline', 'central')
       .attr('fill', CHART_THEME.labelColor).attr('font-size', 10)
       .attr('font-family', CHART_THEME.font).text(METRIC_LABELS[key])
    })

    // Data polygons
    for (const [modelId, m] of Object.entries(metrics)) {
      const color = MODEL_COLORS[modelId] ?? '#888'
      const pts = METRICS_KEYS.map((key, i) => {
        const angle = i * angleSlice - Math.PI / 2
        const val = Math.min(1, (m as Record<string, number>)[key] ?? 0)
        return [Math.cos(angle) * r * val, Math.sin(angle) * r * val] as [number, number]
      })
      g.append('polygon')
        .attr('points', pts.map((p) => p.join(',')).join(' '))
        .attr('fill', color + '22').attr('stroke', color).attr('stroke-width', 1.5)
        .attr('opacity', 0)
        .transition().duration(600).attr('opacity', 1)
    }
  }, [metrics, width, height])

  return <svg ref={svgRef} width={width} height={height} />
}
