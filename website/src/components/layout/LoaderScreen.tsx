import React from 'react'

interface Props {
  message?: string
}

export default function LoaderScreen({ message = 'Loading…' }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[hsl(228,45%,5%)]">
      {/* Animated logo mark */}
      <div className="relative mb-8">
        <div className="w-16 h-16 rounded-2xl glass-card-gradient flex items-center justify-center animate-float">
          <span className="font-display text-2xl font-bold text-emerald-400">ML</span>
        </div>
        {/* Orbit ring */}
        <div className="absolute inset-0 rounded-2xl border border-white/10 animate-spin"
             style={{ animationDuration: '3s' }} />
      </div>

      {/* Progress bar */}
      <div className="w-48 h-0.5 bg-white/10 rounded-full overflow-hidden mb-4">
        <div className="h-full bg-gradient-to-r from-emerald-500 to-violet-500 rounded-full
                        animate-[shimmer_1.5s_ease-in-out_infinite]"
             style={{
               width: '60%',
               animation: 'loading-bar 1.5s ease-in-out infinite',
             }}
        />
      </div>

      <p className="text-white/40 text-sm font-body">{message}</p>

      <style>{`
        @keyframes loading-bar {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  )
}
