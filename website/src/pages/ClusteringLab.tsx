import React, { useState } from 'react'
import { useCluster } from '@/api/hooks'
import GlassCard from '@/components/ui/GlassCard'
import Slider from '@/components/ui/Slider'
import PcaScatter from '@/charts/PcaScatter'
import ElbowCurve from '@/charts/ElbowCurve'
import HowToRead from '@/components/explain/HowToRead'
import MetricBadge from '@/components/explain/MetricBadge'
import { GRAPH_GUIDES, METRIC_MAP } from '@/content/metrics'
import Tabs from '@/components/ui/Tabs'

export default function ClusteringLab() {
  const [activeAlgo, setActiveAlgo] = useState<'kmeans' | 'agglo'>('kmeans')
  const [k, setK] = useState(3)
  const { data: clusterData, isFetching } = useCluster(activeAlgo, k)

  const points = clusterData?.points.map((p) => ({ x: p.x, y: p.y, label: p.label })) ?? []
  const elbowData = (clusterData?.extra as { elbow?: { k: number; inertia: number }[] })?.elbow ?? []

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <p className="text-xs text-white/40 uppercase tracking-widest font-semibold">Clustering Lab</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white">Unsupervised Grouping</h1>
          <p className="text-white/50 max-w-xl mx-auto">
            Watch cases cluster themselves without labels — explore how structure emerges.
          </p>
        </div>

        {/* Algo selector */}
        <div className="flex gap-3 justify-center">
          {(['kmeans', 'agglo'] as const).map((algo) => {
            const isActive = activeAlgo === algo
            const accent   = algo === 'kmeans' ? '#38bdf8' : '#10b981'
            return (
              <button
                key={algo}
                onClick={() => setActiveAlgo(algo)}
                className={`px-6 py-3 rounded-2xl font-semibold text-sm transition-all duration-200
                  ${isActive ? 'text-white' : 'glass-card-sm text-white/50 hover:text-white'}`}
                style={isActive ? { background: accent + '25', border: `1px solid ${accent}50`, color: accent } : {}}
              >
                {algo === 'kmeans' ? '⭕ K-Means' : '🌿 Agglomerative'}
              </button>
            )
          })}
        </div>

        {/* k slider */}
        <GlassCard variant="sm" className="max-w-sm mx-auto rounded-2xl">
          <Slider
            label="Number of clusters (k)"
            value={k} min={2} max={10} step={1}
            accent={activeAlgo === 'kmeans' ? '#38bdf8' : '#10b981'}
            onChange={setK}
          />
        </GlassCard>

        {/* Main content */}
        {isFetching ? (
          <div className="flex items-center justify-center h-48 glass-card rounded-3xl">
            <p className="text-white/40 text-sm animate-pulse">Loading cluster data…</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* PCA scatter */}
            <div className="glass-card rounded-2xl p-5 space-y-4">
              <h2 className="font-display text-lg font-bold text-white">PCA Scatter</h2>
              <div className="flex justify-center">
                <PcaScatter points={points} k={k} width={320} height={280} />
              </div>
              <HowToRead {...GRAPH_GUIDES.pca_scatter} />
            </div>

            {/* Metrics + elbow */}
            <div className="space-y-4">
              {/* Cluster metrics */}
              {clusterData?.metrics && (
                <GlassCard className="rounded-2xl space-y-4">
                  <h2 className="font-display text-lg font-bold text-white">Cluster Quality (k={k})</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(['silhouette', 'davies_bouldin', 'calinski_harabasz'] as const).map((key) => {
                      const def = METRIC_MAP[key]
                      const val = clusterData.metrics[key] ?? 0
                      return def ? (
                        <MetricBadge
                          key={key}
                          label={def.name}
                          value={val}
                          goodIs={def.goodIs}
                          tooltip={def.definition}
                          accent={activeAlgo === 'kmeans' ? '#38bdf8' : '#10b981'}
                          format={(v) => key === 'calinski_harabasz' ? v.toFixed(0) : v.toFixed(3)}
                        />
                      ) : null
                    })}
                  </div>
                </GlassCard>
              )}

              {/* Elbow (K-Means only) */}
              {activeAlgo === 'kmeans' && elbowData.length > 0 && (
                <GlassCard className="rounded-2xl space-y-3">
                  <h2 className="font-display text-lg font-bold text-white">Elbow Curve</h2>
                  <div className="flex justify-center">
                    <ElbowCurve data={elbowData} accent="#38bdf8" width={300} height={220} />
                  </div>
                  <HowToRead {...GRAPH_GUIDES.elbow_curve} />
                </GlassCard>
              )}

              {activeAlgo === 'agglo' && (
                <GlassCard variant="sm" className="rounded-2xl">
                  <p className="text-xs text-white/40 uppercase tracking-wider font-semibold mb-2">About Agglomerative</p>
                  <p className="text-sm text-white/60 leading-relaxed">
                    Agglomerative clustering merges the two closest clusters at each step using <strong className="text-white">Ward linkage</strong>,
                    which minimises the increase in total within-cluster variance. The full merge tree (dendrogram) is available once real artifacts are loaded.
                  </p>
                </GlassCard>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
