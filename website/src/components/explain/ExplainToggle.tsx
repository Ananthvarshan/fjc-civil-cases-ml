import React from 'react'
import { useAppStore, type ExplainLevel } from '@/store/appStore'

export default function ExplainToggle() {
  const { explainLevel, setExplainLevel } = useAppStore()

  const opts: Array<{ key: ExplainLevel; label: string; color: string }> = [
    { key: 'beginner',  label: '🎓 Beginner',  color: '#10b981' },
    { key: 'technical', label: '⚙️ Technical', color: '#8b5cf6' },
  ]

  return (
    <div className="inline-flex glass-card-sm rounded-xl p-1 gap-1">
      {opts.map(({ key, label, color }) => (
        <button
          key={key}
          onClick={() => setExplainLevel(key)}
          className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
            ${explainLevel === key ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
          style={explainLevel === key ? { background: color + '25', color } : {}}
          aria-pressed={explainLevel === key}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
