import React, { useState } from 'react'
import Slider from '@/components/ui/Slider'

interface ParamConfig {
  key:     string
  label:   string
  min:     number
  max:     number
  default: number
  step:    number
  unit?:   string
}

interface Props {
  params:   ParamConfig[]
  accent?:  string
  onChange?: (key: string, value: number) => void
}

export default function ParamPanel({ params, accent = '#10b981', onChange }: Props) {
  const [values, setValues] = useState<Record<string, number>>(
    Object.fromEntries(params.map((p) => [p.key, p.default]))
  )

  const handleChange = (key: string, value: number) => {
    setValues((v) => ({ ...v, [key]: value }))
    onChange?.(key, value)
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">Parameters</p>
      {params.map((p) => (
        <Slider
          key={p.key}
          label={p.label}
          value={values[p.key]}
          min={p.min}
          max={p.max}
          step={p.step}
          unit={p.unit}
          accent={accent}
          onChange={(v) => handleChange(p.key, v)}
        />
      ))}
    </div>
  )
}
