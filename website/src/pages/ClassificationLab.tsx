import React from 'react'
import { Link } from 'react-router-dom'
import { MODEL_CONTENT } from '@/content/models'
import { COLORS } from '@/design/tokens'

const MODEL_CARDS = [
  { id: 'random_forest',     emoji: '🌲' },
  { id: 'adaboost',          emoji: '⚡' },
  { id: 'gradient_boosting', emoji: '📈' },
  { id: 'bagging',           emoji: '👜' },
  { id: 'mlp',               emoji: '🧠' },
] as const

export default function ClassificationLab() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-3">
          <p className="text-xs text-white/40 uppercase tracking-widest font-semibold">Classification Lab</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white">Choose a Model</h1>
          <p className="text-white/50 max-w-xl mx-auto">
            Each model predicts the disposition of a U.S. federal civil case.
            Explore how differently they think — same data, different algorithms.
          </p>
        </div>

        {/* Model grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {MODEL_CARDS.map(({ id, emoji }) => {
            const content = MODEL_CONTENT[id]
            const accent  = COLORS.model[id]
            return (
              <Link
                key={id}
                to={`/classification/${id}`}
                className="glass-card-gradient rounded-3xl p-7 flex flex-col gap-4
                           hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 group"
              >
                {/* Icon circle */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl
                             transition-transform duration-300 group-hover:scale-110"
                  style={{ background: accent + '20', border: `1px solid ${accent}40` }}
                >
                  {emoji}
                </div>

                {/* Name + tagline */}
                <div>
                  <h2 className="font-display text-xl font-bold text-white">{content.name}</h2>
                  <p className="text-sm text-white/40 mt-1">{content.tagline}</p>
                </div>

                {/* Analogy preview */}
                <p className="text-xs text-white/30 leading-relaxed line-clamp-2">
                  {content.analogy}
                </p>

                {/* Pros chips */}
                <div className="flex flex-wrap gap-1.5">
                  {content.pros.slice(0, 2).map((p) => (
                    <span key={p} className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{ background: accent + '18', color: accent }}>
                      {p.split(' ').slice(0, 3).join(' ')}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <div className="mt-auto flex items-center gap-1 text-sm font-semibold transition-all duration-200"
                     style={{ color: accent }}>
                  Open Scene
                  <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Arena link */}
        <div className="text-center pt-4">
          <Link
            to="/arena"
            className="inline-flex items-center gap-2 glass-card-gradient rounded-2xl px-6 py-3
                       text-sm font-medium text-white/70 hover:text-white hover:bg-white/10
                       transition-all duration-200 hover:-translate-y-0.5"
          >
            🏆 Compare all models in the Arena
          </Link>
        </div>
      </div>
    </div>
  )
}
