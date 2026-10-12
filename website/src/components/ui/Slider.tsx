import React from 'react'

interface Props {
  label:    string
  value:    number
  min:      number
  max:      number
  step?:    number
  unit?:    string
  accent?:  string
  onChange: (v: number) => void
}

export default function Slider({ label, value, min, max, step = 1, unit, accent = '#10b981', onChange }: Props) {
  const pct = ((value - min) / (max - min)) * 100

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm text-white/70">{label}</span>
        <span className="text-sm font-mono font-medium" style={{ color: accent }}>
          {value}{unit}
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-white/10">
        {/* Filled track */}
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: accent }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          style={{ zIndex: 1 }}
          aria-label={label}
        />
        {/* Thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white
                     shadow-lg transition-all pointer-events-none"
          style={{ left: `calc(${pct}% - 8px)`, background: accent }}
        />
      </div>
    </div>
  )
}
