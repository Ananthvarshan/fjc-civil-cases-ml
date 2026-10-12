import React, { useState } from 'react'
import { useCompare } from '@/api/hooks'
import GlassCard from '@/components/ui/GlassCard'
import RadarCompare from '@/charts/RadarCompare'
import GroupedBars from '@/charts/GroupedBars'
import RocCurves from '@/charts/RocCurves'
import ConfusionMatrix from '@/charts/ConfusionMatrix'
import HowToRead from '@/components/explain/HowToRead'
import { GRAPH_GUIDES, METRIC_MAP } from '@/content/metrics'
import { COLORS } from '@/design/tokens'
import MetricBadge from '@/components/explain/MetricBadge'

const MODEL_LABELS: Record<string, string> = {
  random_forest:     'Random Forest',
  adaboost:          'AdaBoost',
  gradient_boosting: 'Gradient Boosting',
  bagging:           'Bagging',
  mlp:               'Neural Network',
}
const MODEL_EMOJIS: Record<string, string> = {
  random_forest: '🌲', adaboost: '⚡', gradient_boosting: '📈', bagging: '👜', mlp: '🧠',
}
const CLASS_NAMES = ['Transfer', 'Remand', 'Vol. Dismissal', 'Judgment', 'Other']

export default function Arena() {
  const { data: compare, isLoading } = useCompare()
  const [selectedMatrix, setSelectedMatrix] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <p className="text-white/40">Loading comparison data…</p>
      </div>
    )
  }

  const metrics  = compare?.metrics ?? {}
  const rocs     = compare?.roc_curves ?? {}
  const modelIds = Object.keys(metrics)

  // Sorted leaderboard by accuracy
  const leaderboard = [...modelIds].sort((a, b) => (metrics[b]?.accuracy ?? 0) - (metrics[a]?.accuracy ?? 0))

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-3">
          <p className="text-xs text-white/40 uppercase tracking-widest font-semibold">Arena</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white">Model Showdown</h1>
          <p className="text-white/50 max-w-xl mx-auto">All 5 classifiers, head to head on every metric.</p>
        </div>

        {/* Leaderboard table */}
        <section className="space-y-3">
          <h2 className="font-display text-xl font-bold text-white">🏆 Leaderboard</h2>
          <div className="overflow-x-auto glass-card rounded-2xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs text-white/40 uppercase tracking-wider">
                  <th className="text-left px-5 py-3">Rank</th>
                  <th className="text-left px-3 py-3">Model</th>
                  <th className="text-right px-3 py-3">Accuracy</th>
                  <th className="text-right px-3 py-3">F1</th>
                  <th className="text-right px-3 py-3">AUC</th>
                  <th className="text-right px-3 py-3">Precision</th>
                  <th className="text-right px-3 py-3">Recall</th>
                  <th className="text-right px-3 py-3">Train Time</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((id, rank) => {
                  const m      = metrics[id]
                  const accent = COLORS.model[id as keyof typeof COLORS.model] ?? '#888'
                  return (
                    <tr key={id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-5 py-3">
                        <span className="font-bold text-white/40">{rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `#${rank + 1}`}</span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <span>{MODEL_EMOJIS[id]}</span>
                          <span className="font-medium text-white">{MODEL_LABELS[id]}</span>
                          <div className="w-2 h-2 rounded-full" style={{ background: accent }} />
                        </div>
                      </td>
                      {(['accuracy', 'f1', 'roc_auc', 'precision', 'recall'] as const).map((key) => (
                        <td key={key} className="text-right px-3 py-3 font-mono text-sm"
                            style={{ color: rank === 0 ? accent : 'rgba(255,255,255,0.6)' }}>
                          {((m?.[key] ?? 0) * 100).toFixed(1)}%
                        </td>
                      ))}
                      <td className="text-right px-3 py-3 font-mono text-sm text-white/50">
                        {m?.train_time_s?.toFixed(1)}s
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Radar chart */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card rounded-2xl p-5 space-y-3">
            <h2 className="font-display text-lg font-bold text-white">Metric Radar</h2>
            <div className="flex justify-center">
              <RadarCompare metrics={metrics} width={340} height={300} />
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-3 justify-center">
              {modelIds.map((id) => (
                <div key={id} className="flex items-center gap-1.5 text-xs text-white/50">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS.model[id as keyof typeof COLORS.model] }} />
                  {MODEL_LABELS[id]}
                </div>
              ))}
            </div>
          </div>

          {/* ROC curves */}
          <div className="glass-card rounded-2xl p-5 space-y-3">
            <h2 className="font-display text-lg font-bold text-white">ROC Curves</h2>
            <RocCurves curves={rocs} width={340} height={280} />
            <HowToRead {...GRAPH_GUIDES.roc_curve} />
          </div>
        </section>

        {/* Grouped metric bars */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-bold text-white">Metric Comparison</h2>
          <div className="glass-card rounded-2xl p-5 overflow-x-auto">
            <GroupedBars metrics={metrics} width={540} height={280} />
          </div>
        </section>

        {/* Confusion matrices */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-bold text-white">Confusion Matrices</h2>
          <p className="text-sm text-white/40">Click a model to inspect its confusion matrix.</p>
          <div className="flex flex-wrap gap-3">
            {modelIds.map((id) => {
              const accent = COLORS.model[id as keyof typeof COLORS.model] ?? '#888'
              return (
                <button
                  key={id}
                  onClick={() => setSelectedMatrix(selectedMatrix === id ? null : id)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                    ${selectedMatrix === id ? 'text-white' : 'text-white/50 hover:text-white glass-card-sm'}`}
                  style={selectedMatrix === id ? { background: accent + '25', color: accent, border: `1px solid ${accent}50` } : {}}
                >
                  {MODEL_EMOJIS[id]} {MODEL_LABELS[id]}
                </button>
              )
            })}
          </div>
          {selectedMatrix && metrics[selectedMatrix] && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-card rounded-2xl p-5 flex justify-center">
                <ConfusionMatrix
                  matrix={metrics[selectedMatrix].confusion_matrix}
                  classNames={CLASS_NAMES}
                  accent={COLORS.model[selectedMatrix as keyof typeof COLORS.model] ?? '#10b981'}
                  width={320} height={300}
                />
              </div>
              <div className="space-y-4">
                <HowToRead {...GRAPH_GUIDES.confusion_matrix} />
                <div className="grid grid-cols-2 gap-3">
                  {(['accuracy', 'f1', 'precision', 'recall'] as const).map((key) => {
                    const def = METRIC_MAP[key]
                    return def ? (
                      <MetricBadge
                        key={key}
                        label={def.name}
                        value={metrics[selectedMatrix][key]}
                        goodIs={def.goodIs}
                        tooltip={def.definition}
                        accent={COLORS.model[selectedMatrix as keyof typeof COLORS.model] ?? '#10b981'}
                      />
                    ) : null
                  })}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* "Where it shines" cards */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-bold text-white">Where Each Model Shines</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {leaderboard.map((id, rank) => {
              const m = metrics[id]
              const accent = COLORS.model[id as keyof typeof COLORS.model] ?? '#888'
              const bestMetric = (['accuracy', 'f1', 'roc_auc'] as const).reduce((best, key) =>
                (m?.[key] ?? 0) > (m?.[best] ?? 0) ? key : best, 'accuracy' as 'accuracy' | 'f1' | 'roc_auc')
              return (
                <div key={id} className="glass-card-sm rounded-2xl p-5 space-y-2"
                     style={{ borderLeft: `3px solid ${accent}` }}>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{MODEL_EMOJIS[id]}</span>
                    <span className="font-semibold text-sm text-white">{MODEL_LABELS[id]}</span>
                    {rank === 0 && <span className="text-xs text-emerald-400 ml-auto">Best overall</span>}
                  </div>
                  <p className="text-xs text-white/50 leading-relaxed">
                    Strongest on <span style={{ color: accent }}>{METRIC_MAP[bestMetric]?.name}</span> ({((m?.[bestMetric] ?? 0) * 100).toFixed(1)}%).
                    {m?.train_time_s && m.train_time_s < 15
                      ? ' Fast to train.'
                      : m?.train_time_s && m.train_time_s > 30
                        ? ' Slow to train — best re-used from checkpoint.'
                        : ''}
                  </p>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
