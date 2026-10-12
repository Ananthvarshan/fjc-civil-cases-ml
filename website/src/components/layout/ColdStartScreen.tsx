import React, { useEffect, useState } from 'react'

interface Props {
  /** Called once server responds with 200 */
  onReady: () => void
  pollUrl?: string
}

export default function ColdStartScreen({ onReady, pollUrl = '/api/health' }: Props) {
  const [dots, setDots]   = useState('.')
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    // Animate dots
    const dotTimer = setInterval(() => setDots((d) => d.length >= 3 ? '.' : d + '.'), 600)
    const secTimer  = setInterval(() => setElapsed((s) => s + 1), 1000)

    // Poll backend
    const poll = async () => {
      try {
        const res = await fetch(pollUrl)
        if (res.ok) { onReady(); clearInterval(pollTimer) }
      } catch { /* still waking */ }
    }
    const pollTimer = setInterval(poll, 3000)
    poll()  // immediate first check

    return () => { clearInterval(dotTimer); clearInterval(secTimer); clearInterval(pollTimer) }
  }, [onReady, pollUrl])

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[hsl(228,45%,5%)] gap-6">
      {/* Animated orb */}
      <div className="relative">
        <div className="w-20 h-20 rounded-full glass-card-gradient flex items-center justify-center animate-float">
          <span className="text-3xl">☁️</span>
        </div>
        <div className="absolute inset-0 rounded-full border border-emerald-500/30 animate-ping" />
      </div>

      <div className="text-center space-y-2">
        <h2 className="font-display text-xl font-bold text-white">Waking up the server{dots}</h2>
        <p className="text-sm text-white/40 max-w-xs">
          The free-tier backend sleeps after inactivity. This usually takes 30–60 seconds.
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2">
        {Array.from({ length: Math.min(elapsed, 10) }).map((_, i) => (
          <div key={i} className="w-2 h-2 rounded-full bg-emerald-400/60" />
        ))}
      </div>

      <p className="text-xs text-white/20">{elapsed}s elapsed</p>
    </div>
  )
}
