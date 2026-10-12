import React from 'react'
import { useMeta } from '@/api/hooks'
import GlassCard from '@/components/ui/GlassCard'
import PcaScatter from '@/charts/PcaScatter'
import HowToRead from '@/components/explain/HowToRead'
import { GRAPH_GUIDES } from '@/content/metrics'

export default function DataExplorer() {
  const { data: meta, isLoading } = useMeta()

  const points = meta?.pca_points.map((p) => ({ x: p.x, y: p.y, label: p.label })) ?? []

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <p className="text-xs text-white/40 uppercase tracking-widest font-semibold">Data Explorer</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white">The Dataset</h1>
          <p className="text-white/50 max-w-xl mx-auto">{meta?.description}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Samples',  value: meta?.n_samples?.toLocaleString() ?? '…', color: '#10b981' },
            { label: 'Features', value: meta?.n_features ?? '…',                  color: '#8b5cf6' },
            { label: 'Classes',  value: meta?.class_names.length ?? '…',          color: '#38bdf8' },
            { label: 'Task',     value: meta?.task ?? '…',                        color: '#f59e0b' },
          ].map(({ label, value, color }) => (
            <div key={label} className="glass-card-gradient rounded-2xl p-5 text-center">
              <div className="font-display text-3xl font-bold" style={{ color }}>{value}</div>
              <div className="text-xs text-white/40 mt-1">{label}</div>
            </div>
          ))}
        </div>

        {isLoading ? (
          <p className="text-center text-white/40 animate-pulse">Loading dataset info…</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* PCA scatter */}
            <div className="glass-card rounded-2xl p-5 space-y-4">
              <h2 className="font-display text-lg font-bold text-white">PCA Projection</h2>
              <p className="text-xs text-white/40">300 sampled cases projected to 2 principal components. Colour = class.</p>
              <div className="flex justify-center">
                <PcaScatter points={points} k={meta?.class_names.length ?? 5} width={320} height={280} />
              </div>
              <HowToRead {...GRAPH_GUIDES.pca_scatter} />
            </div>

            {/* Feature list */}
            <div className="glass-card rounded-2xl p-5 space-y-3">
              <h2 className="font-display text-lg font-bold text-white">Features ({meta?.n_features})</h2>
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {meta?.features.map((f) => (
                  <div key={f.name} className="glass-card-sm rounded-xl px-4 py-2.5 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-sm font-mono font-semibold text-white">{f.name}</span>
                      <p className="text-xs text-white/40 mt-0.5">{f.description}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0
                      ${f.type === 'numerical' ? 'text-violet-400 bg-violet-400/10' : 'text-sky-400 bg-sky-400/10'}`}>
                      {f.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Class distribution */}
            <div className="glass-card rounded-2xl p-5 space-y-3 lg:col-span-2">
              <h2 className="font-display text-lg font-bold text-white">Target Classes</h2>
              <div className="flex flex-wrap gap-3">
                {meta?.class_names.map((cn, i) => {
                  const colors = ['#4e79a7', '#f28e2b', '#59a14f', '#e15759', '#76b7b2']
                  return (
                    <div key={cn} className="glass-card-sm rounded-xl px-4 py-2 flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: colors[i % colors.length] }} />
                      <span className="text-sm text-white">{cn}</span>
                    </div>
                  )
                })}
              </div>
              <p className="text-xs text-white/40 leading-relaxed">
                The classification target is <strong className="text-white/60">DISP</strong> (case disposition) — how each federal civil case was resolved.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
