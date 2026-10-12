import React from 'react'
import { useAppStore } from '@/store/appStore'

interface Props {
  modelId: string
  accent:  string
  beginner: string
  technical: string
}

export default function VerdictCard({ modelId, accent, beginner, technical }: Props) {
  const { explainLevel } = useAppStore()
  return (
    <div
      className="glass-card-gradient rounded-2xl p-5 space-y-2"
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: accent }} />
        <span className="text-xs font-medium uppercase tracking-widest text-white/50">
          {explainLevel === 'beginner' ? 'Plain English' : 'Technical'}
        </span>
      </div>
      <p className="text-sm text-white/80 leading-relaxed">
        {explainLevel === 'beginner' ? beginner : technical}
      </p>
    </div>
  )
}
