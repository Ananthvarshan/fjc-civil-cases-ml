import React from 'react'
import { useStepStore } from '@/store/stepStore'
import { useAppStore } from '@/store/appStore'

interface StepCaption {
  label:     string
  beginner:  string
  technical: string
}

interface Props {
  captions: StepCaption[]
  accent?:  string
}

export default function StepCaption({ captions, accent = '#10b981' }: Props) {
  const { stepIndex } = useStepStore()
  const { explainLevel } = useAppStore()
  const caption = captions[Math.min(stepIndex, captions.length - 1)]

  if (!caption) return null

  return (
    <div className="glass-card-sm rounded-xl p-4 space-y-1 transition-all duration-300">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
        <span className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: accent }}>{caption.label}</span>
      </div>
      <p className="text-sm text-white/70 leading-relaxed">
        {explainLevel === 'beginner' ? caption.beginner : caption.technical}
      </p>
    </div>
  )
}
