import React, { useState } from 'react'
import { useMeta, usePredict, usePredictAll } from '@/api/hooks'
import GlassCard from '@/components/ui/GlassCard'
import Button from '@/components/ui/Button'
import { COLORS, MODEL_IDS } from '@/design/tokens'
import { MODEL_CONTENT } from '@/content/models'
import type { PredictResponse } from '@/api/types'
import { useAppStore } from '@/store/appStore'

const MODEL_LABELS: Record<string, string> = {
  random_forest:     'Random Forest',
  adaboost:          'AdaBoost',
  gradient_boosting: 'Gradient Boosting',
  bagging:           'Bagging',
  mlp:               'Neural Network',
}

function ProbabilityBar({ label, prob, accent }: { label: string; prob: number; accent: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-white/60">{label}</span>
        <span className="font-mono font-bold" style={{ color: accent }}>{(prob * 100).toFixed(1)}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${prob * 100}%`, background: accent }}
        />
      </div>
    </div>
  )
}

function ResultCard({ result, classNames }: { result: PredictResponse; classNames: string[] }) {
  const accent = COLORS.model[result.model as keyof typeof COLORS.model] ?? '#10b981'
  return (
    <GlassCard variant="sm" className="rounded-2xl space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ background: accent }} />
        <span className="text-xs font-semibold" style={{ color: accent }}>
          {MODEL_LABELS[result.model]}
        </span>
        {(result.trace as { mock?: boolean })?.mock && (
          <span className="text-[10px] text-white/30 ml-auto">mock</span>
        )}
      </div>
      <div className="font-display text-lg font-bold text-white">{result.label}</div>
      <div className="space-y-2">
        {classNames.map((cn) => (
          <ProbabilityBar key={cn} label={cn} prob={result.probabilities[cn] ?? 0} accent={accent} />
        ))}
      </div>
    </GlassCard>
  )
}

export default function Playground() {
  const { data: meta } = useMeta()
  const { selectedModel, setSelectedModel, inputVector, updateInput } = useAppStore()
  const predictOne = usePredict(selectedModel)
  const predictAll = usePredictAll()
  const [mode, setMode] = useState<'single' | 'all'>('all')
  const [results, setResults] = useState<PredictResponse[]>([])

  const classNames = meta?.class_names ?? ['Transfer', 'Remand', 'Vol. Dismissal', 'Judgment', 'Other']
  const features   = meta?.features ?? []

  // Apply preset
  const applyPreset = (preset: { label: string; values: Record<string, number | string> }) => {
    Object.entries(preset.values).forEach(([k, v]) => updateInput(k, v))
  }

  const handlePredict = async () => {
    const body = { features: inputVector }
    if (mode === 'all') {
      const res = await predictAll.mutateAsync(body)
      setResults(Object.values(res.results))
    } else {
      const res = await predictOne.mutateAsync(body)
      setResults([res])
    }
  }

  const isLoading = predictOne.isPending || predictAll.isPending

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <p className="text-xs text-white/40 uppercase tracking-widest font-semibold">Playground</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white">Try it Yourself</h1>
          <p className="text-white/50">Enter case features and watch the models predict the outcome.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
          {/* Left: Input form */}
          <GlassCard className="rounded-3xl space-y-5 self-start">
            {/* Presets */}
            {meta?.presets && (
              <div className="space-y-2">
                <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">Presets</p>
                <div className="flex flex-wrap gap-2">
                  {meta.presets.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => applyPreset(p)}
                      className="px-3 py-1.5 text-xs rounded-lg glass-card-sm
                                 text-white/60 hover:text-white hover:bg-white/10 transition-all"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Feature inputs */}
            <div className="space-y-3">
              <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">Features</p>
              {features.map((f) => (
                <div key={f.name} className="space-y-1">
                  <div className="flex justify-between">
                    <label className="text-xs text-white/60">{f.name}</label>
                    <span className="text-xs text-white/30">{f.description}</span>
                  </div>
                  {f.type === 'numerical' ? (
                    <input
                      type="number"
                      min={f.min} max={f.max}
                      value={(inputVector[f.name] as number) ?? f.min ?? 0}
                      onChange={(e) => updateInput(f.name, parseFloat(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5
                                 text-sm text-white focus:outline-none focus:border-white/30 transition-colors"
                    />
                  ) : (
                    <select
                      value={(inputVector[f.name] as string) ?? (f.categories?.[0] ?? '')}
                      onChange={(e) => updateInput(f.name, e.target.value)}
                      className="w-full bg-[hsl(228,35%,11%)] border border-white/10 rounded-lg px-3 py-1.5
                                 text-sm text-white focus:outline-none focus:border-white/30 transition-colors"
                    >
                      {f.categories?.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>

            {/* Mode + Predict */}
            <div className="space-y-3 pt-2 border-t border-white/10">
              <div className="flex gap-2">
                {(['all', 'single'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
                      ${mode === m ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70 hover:bg-white/5'}`}
                  >
                    {m === 'all' ? 'All Models' : MODEL_LABELS[selectedModel]}
                  </button>
                ))}
              </div>

              {mode === 'single' && (
                <div className="flex flex-wrap gap-1.5">
                  {MODEL_IDS.map((id) => {
                    const accent = COLORS.model[id]
                    return (
                      <button
                        key={id}
                        onClick={() => setSelectedModel(id)}
                        className={`px-2 py-1 text-[10px] rounded-lg transition-all duration-150
                          ${selectedModel === id ? 'text-white' : 'text-white/30 hover:text-white/60'}`}
                        style={selectedModel === id ? { background: accent + '30', color: accent } : {}}
                      >
                        {MODEL_LABELS[id]}
                      </button>
                    )
                  })}
                </div>
              )}

              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handlePredict}
                disabled={isLoading || features.length === 0}
              >
                {isLoading ? '⟳ Predicting…' : '🎯 Predict'}
              </Button>
            </div>
          </GlassCard>

          {/* Right: Results */}
          <div className="space-y-4">
            {results.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 glass-card rounded-3xl">
                <div className="text-4xl mb-3">🎯</div>
                <p className="text-white/30 text-sm">Run a prediction to see results here</p>
              </div>
            ) : (
              <>
                {predictAll.data && (
                  <div className="glass-card-sm rounded-2xl px-4 py-3">
                    <p className="text-xs text-white/40">
                      {Object.values(predictAll.data.results).map((r) => r.label).join(', ')} —{' '}
                      <span className="text-white/60">
                        {/* Consensus check */}
                        {new Set(Object.values(predictAll.data.results).map((r) => r.label)).size === 1
                          ? '✅ All models agree'
                          : '⚠️ Models disagree'}
                      </span>
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {results.map((r) => (
                    <ResultCard key={r.model} result={r} classNames={classNames} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
