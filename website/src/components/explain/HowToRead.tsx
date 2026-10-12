import React from 'react'

interface Props {
  title:              string
  howToRead:          string
  whatGoodLooksLike:  string
}

export default function HowToRead({ title, howToRead, whatGoodLooksLike }: Props) {
  return (
    <div className="glass-card-sm rounded-xl p-4 space-y-2 border-l-2 border-violet-500/50">
      <p className="text-xs font-semibold text-violet-400 uppercase tracking-wider">
        How to read this — {title}
      </p>
      <p className="text-xs text-white/60 leading-relaxed">{howToRead}</p>
      <p className="text-xs text-emerald-400/80 leading-relaxed">
        <span className="font-semibold">What good looks like: </span>
        {whatGoodLooksLike}
      </p>
    </div>
  )
}
