import React from 'react'

interface Props {
  label:    string
  value:    number
  goodIs:   'high' | 'low'
  tooltip:  string
  accent?:  string
  format?:  (v: number) => string
}

export default function MetricBadge({
  label,
  value,
  goodIs,
  tooltip,
  accent = '#10b981',
  format = (v) => (v < 10 ? v.toFixed(4) : v.toFixed(1)),
}: Props) {
  return (
    <div
      className="group relative glass-card-sm rounded-xl px-4 py-3 flex flex-col gap-1
                 hover:bg-white/10 transition-all duration-200 cursor-help"
    >
      <span className="text-xs text-white/50 font-medium uppercase tracking-wide">{label}</span>
      <span className="text-xl font-display font-bold" style={{ color: accent }}>
        {format(value)}
      </span>
      <span className="text-xs" style={{ color: goodIs === 'high' ? '#10b981' : '#f59e0b' }}>
        {goodIs === 'high' ? '↑ Higher is better' : '↓ Lower is better'}
      </span>

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 glass-card p-3
                      text-xs text-white/70 rounded-xl opacity-0 group-hover:opacity-100
                      transition-opacity duration-200 pointer-events-none z-10 text-center">
        {tooltip}
      </div>
    </div>
  )
}
