import React from 'react'
import { Link } from 'react-router-dom'
import GlassCard from '@/components/ui/GlassCard'
import MetricBadge from '@/components/explain/MetricBadge'
import ExplainToggle from '@/components/explain/ExplainToggle'
import Tabs from '@/components/ui/Tabs'
import { useModelDetail } from '@/api/hooks'
import { MODEL_CONTENT } from '@/content/models'
import { METRIC_MAP } from '@/content/metrics'
import VerdictCard from '@/components/explain/VerdictCard'
import StepCaption from '@/components/explain/StepCaption'
import StepperControls from '@/components/stage/StepperControls'
import ParamPanel from '@/components/stage/ParamPanel'
import ConfusionMatrix from '@/charts/ConfusionMatrix'
import RocCurves from '@/charts/RocCurves'
import HowToRead from '@/components/explain/HowToRead'
import { GRAPH_GUIDES } from '@/content/metrics'
import { useStepStore } from '@/store/stepStore'
import { useParams } from 'react-router-dom'
import type { ModelId } from '@/design/tokens'

const CLASS_NAMES = ['Transfer', 'Remand', 'Vol. Dismissal', 'Judgment', 'Other']

export default function ModelStage() {
  const { modelId } = useParams<{ modelId: string }>()
  const id = (modelId as ModelId) ?? 'random_forest'
  const content = MODEL_CONTENT[id]
  const { data: detail, isLoading } = useModelDetail(id)
  const { setMaxSteps } = useStepStore()

  React.useEffect(() => {
    if (content) setMaxSteps(content.stepCaptions.length)
  }, [content, setMaxSteps])

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white/40">Unknown model: {modelId}</p>
      </div>
    )
  }

  const accent = detail?.accent_color ?? '#10b981'
  const metrics = detail?.metrics

  return (
    <div className="min-h-screen pt-20">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 pb-4">
        <nav className="flex items-center gap-2 text-xs text-white/40">
          <Link to="/classification" className="hover:text-white/70 transition-colors">Classifiers</Link>
          <span>/</span>
          <span style={{ color: accent }}>{content.name}</span>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 pb-16">
        {/* Left: scene placeholder (3D scene goes here when wired up) */}
        <div className="glass-card rounded-3xl overflow-hidden min-h-[480px] relative flex items-center justify-center">
          {/* Animated placeholder until Three.js scenes are wired */}
          <div className="text-center space-y-4 p-8">
            <div className="text-6xl animate-float">{getModelEmoji(id)}</div>
            <div className="font-display text-2xl font-bold" style={{ color: accent }}>{content.name}</div>
            <div className="text-sm text-white/40 max-w-xs mx-auto">{content.tagline}</div>
            <div className="text-xs text-white/20">3D scene renders here</div>
          </div>
          {/* Glow */}
          <div className="absolute inset-0 pointer-events-none"
               style={{ background: `radial-gradient(ellipse 60% 50% at 50% 50%, ${accent}15, transparent)` }} />
        </div>

        {/* Right: glass panel */}
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-bold text-white">{content.name}</h1>
              <p className="text-sm text-white/50 mt-0.5">{content.tagline}</p>
            </div>
            <ExplainToggle />
          </div>

          {/* Tabs */}
          <Tabs tabs={[{ key: 'explain', label: 'Explain' }, { key: 'play', label: 'Play' }, { key: 'results', label: 'Results' }]}>
            {(active) => (
              <>
                {/* ── EXPLAIN ── */}
                {active === 'explain' && (
                  <div className="space-y-4">
                    <GlassCard variant="sm" className="rounded-2xl">
                      <p className="text-sm text-amber-300/80 italic leading-relaxed">💡 {content.analogy}</p>
                    </GlassCard>
                    <StepCaption captions={content.stepCaptions} accent={accent} />
                    <div className="space-y-1.5">
                      <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">Pros</p>
                      {content.pros.map((p) => (
                        <div key={p} className="flex gap-2 text-xs text-white/60">
                          <span className="text-emerald-400 shrink-0">✓</span>{p}
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">Cons</p>
                      {content.cons.map((c) => (
                        <div key={c} className="flex gap-2 text-xs text-white/60">
                          <span className="text-rose-400 shrink-0">✗</span>{c}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── PLAY ── */}
                {active === 'play' && (
                  <div className="space-y-5">
                    <StepperControls accent={accent} />
                    <ParamPanel params={content.params} accent={accent} />
                  </div>
                )}

                {/* ── RESULTS ── */}
                {active === 'results' && (
                  <div className="space-y-5">
                    {isLoading && <p className="text-xs text-white/40">Loading metrics…</p>}
                    {metrics && (
                      <>
                        {/* Verdict */}
                        <VerdictCard
                          modelId={id}
                          accent={accent}
                          beginner={`${content.name} achieved ${(metrics.accuracy * 100).toFixed(1)}% accuracy on the test set with an AUC of ${metrics.roc_auc.toFixed(3)}. It trained in ${metrics.train_time_s.toFixed(1)}s.`}
                          technical={`Macro-averaged — Accuracy: ${metrics.accuracy.toFixed(4)}, Precision: ${metrics.precision.toFixed(4)}, Recall: ${metrics.recall.toFixed(4)}, F1: ${metrics.f1.toFixed(4)}, ROC-AUC (OvR): ${metrics.roc_auc.toFixed(4)}. Train time: ${metrics.train_time_s.toFixed(1)}s.`}
                        />

                        {/* Metric badges */}
                        <div className="grid grid-cols-2 gap-2">
                          {(['accuracy', 'f1', 'roc_auc', 'train_time_s'] as const).map((key) => {
                            const def = METRIC_MAP[key]
                            return def ? (
                              <MetricBadge
                                key={key}
                                label={def.name}
                                value={metrics[key]}
                                goodIs={def.goodIs}
                                tooltip={def.definition}
                                accent={accent}
                                format={key === 'train_time_s' ? (v) => `${v.toFixed(1)}s` : undefined}
                              />
                            ) : null
                          })}
                        </div>

                        {/* Confusion matrix */}
                        {metrics.confusion_matrix.length > 0 && (
                          <div className="space-y-2">
                            <ConfusionMatrix
                              matrix={metrics.confusion_matrix}
                              classNames={CLASS_NAMES}
                              accent={accent}
                              width={320}
                              height={300}
                            />
                            <HowToRead {...GRAPH_GUIDES.confusion_matrix} />
                          </div>
                        )}

                        {/* ROC curve */}
                        {metrics.roc_points.length > 0 && (
                          <div className="space-y-2">
                            <RocCurves
                              curves={{ [id]: metrics.roc_points }}
                              width={320}
                              height={240}
                            />
                            <HowToRead {...GRAPH_GUIDES.roc_curve} />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  )
}

function getModelEmoji(id: string): string {
  const map: Record<string, string> = {
    random_forest: '🌲', adaboost: '⚡', gradient_boosting: '📈', bagging: '👜', mlp: '🧠',
  }
  return map[id] ?? '🤖'
}
