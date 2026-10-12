import React from 'react'
import { Link } from 'react-router-dom'
import GlassCard from '@/components/ui/GlassCard'

export default function About() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <p className="text-xs text-white/40 uppercase tracking-widest font-semibold">About</p>
          <h1 className="font-display text-4xl font-bold text-white">Method & Credits</h1>
        </div>

        <GlassCard className="rounded-2xl space-y-3">
          <h2 className="font-display text-xl font-bold text-white">Dataset</h2>
          <p className="text-sm text-white/60 leading-relaxed">
            <strong className="text-white">FJC Integrated Database (IDB)</strong> — U.S. Federal court civil litigation records
            from the Federal Judicial Center. Downloaded from{' '}
            <a href="https://www.fjc.gov" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">
              fjc.gov
            </a>{' '}
            (<code className="text-white/50">cv23.sas7bdat</code>). ~487K civil cases from 1988–2023.
          </p>
        </GlassCard>

        <GlassCard className="rounded-2xl space-y-3">
          <h2 className="font-display text-xl font-bold text-white">ML Pipeline</h2>
          <ol className="text-sm text-white/60 leading-loose list-decimal list-inside space-y-1">
            <li><strong className="text-white">Preprocessing</strong> — Missing value handling, categorical encoding, feature selection per FJC codebook</li>
            <li><strong className="text-white">Classification</strong> — 5 models: Random Forest, AdaBoost, Gradient Boosting, Bagging, MLP (target: DISP)</li>
            <li><strong className="text-white">Clustering</strong> — K-Means (k=2–10 elbow analysis) and Agglomerative (Ward linkage, dendrogram)</li>
            <li><strong className="text-white">Evaluation</strong> — Accuracy, Precision, Recall, F1, ROC-AUC (OvR), Silhouette, Davies-Bouldin, Calinski-Harabasz</li>
          </ol>
        </GlassCard>

        <GlassCard className="rounded-2xl space-y-3" style={{ borderLeft: '3px solid #f59e0b' }}>
          <h2 className="font-display text-xl font-bold text-white">⚠️ AI Use Citation</h2>
          <p className="text-sm text-white/60 leading-relaxed">
            In accordance with the assignment guidelines, <strong className="text-white">AI tools (Antigravity / Claude)</strong> were
            used solely for <em>code scaffolding</em> of the website frontend and backend structure.
            All data analysis, metric interpretation, model selection rationale, and written commentary
            were produced by the team. This website's explanatory text was written by team members.
          </p>
        </GlassCard>

        <GlassCard className="rounded-2xl space-y-3">
          <h2 className="font-display text-xl font-bold text-white">Tech Stack</h2>
          <div className="grid grid-cols-2 gap-3 text-sm text-white/60">
            {[
              ['Frontend', 'React 18 + Vite + TypeScript'],
              ['Styling', 'Tailwind CSS 3 + Custom CSS'],
              ['Charts', 'D3.js'],
              ['3D', '@react-three/fiber + Three.js'],
              ['Backend', 'FastAPI + Python 3.11'],
              ['ML', 'scikit-learn 1.4'],
              ['Deploy', 'Docker · HuggingFace Spaces / Render'],
              ['State', 'Zustand + React Query'],
            ].map(([key, val]) => (
              <div key={key}>
                <span className="text-white/30">{key}: </span>
                <span className="text-white/70">{val}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="rounded-2xl space-y-2">
          <h2 className="font-display text-xl font-bold text-white">Links</h2>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://github.com/Moorthi308/fjc-civil-cases-ml"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl glass-card-sm text-sm
                         text-white/70 hover:text-white hover:bg-white/10 transition-all"
            >
              📦 GitHub Repository ↗
            </a>
            <Link
              to="/arena"
              className="flex items-center gap-2 px-4 py-2 rounded-xl glass-card-sm text-sm
                         text-white/70 hover:text-white hover:bg-white/10 transition-all"
            >
              🏆 Model Arena
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
