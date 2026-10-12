import React, { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useMeta } from '@/api/hooks'

/* ─────────────────────────────────────────────────────────────
   Animated particle background (canvas-based, no Three.js dep here)
   ───────────────────────────────────────────────────────────── */
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let raf: number

    const resize = () => {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    type Particle = { x: number; y: number; vx: number; vy: number; r: number; alpha: number; color: string }
    const COLORS = ['#10b981', '#8b5cf6', '#38bdf8', '#f59e0b', '#f43f5e']
    const particles: Particle[] = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 2 + 0.5,
      alpha: Math.random() * 0.5 + 0.1,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }))

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = p.color + Math.round(p.alpha * 255).toString(16).padStart(2, '0')
        ctx.fill()
      }
      // Draw connecting lines between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(255,255,255,${0.04 * (1 - dist / 120)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
}

/* ─────────────────────────────────────────────────────────────
   Model cards for the "portal" section
   ───────────────────────────────────────────────────────────── */
const MODEL_CARDS = [
  { id: 'random_forest',     name: 'Random Forest',       icon: '🌲', accent: '#10b981', desc: 'A grove of decision trees voting together' },
  { id: 'adaboost',          name: 'AdaBoost',            icon: '⚡', accent: '#f59e0b', desc: 'Weak stumps boosted by hard examples' },
  { id: 'gradient_boosting', name: 'Gradient Boosting',   icon: '📈', accent: '#8b5cf6', desc: 'Error corrections, stage by stage' },
  { id: 'bagging',           name: 'Bagging',             icon: '👜', accent: '#38bdf8', desc: 'Independent learners, pooled verdict' },
  { id: 'mlp',               name: 'Neural Network',      icon: '🧠', accent: '#f43f5e', desc: 'Layered learning, inspired by the brain' },
]

const CLUSTER_CARDS = [
  { id: 'kmeans', name: 'K-Means',          icon: '⭕', accent: '#38bdf8', desc: 'Centroid-based grouping' },
  { id: 'agglo',  name: 'Agglomerative',    icon: '🌿', accent: '#10b981', desc: 'Hierarchical merging clusters' },
]

/* ─────────────────────────────────────────────────────────────
   Landing Page
   ───────────────────────────────────────────────────────────── */
export default function Landing() {
  const { data: meta } = useMeta()

  return (
    <div className="min-h-screen">
      {/* ── HERO ────────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden text-center px-4">
        {/* Particle background */}
        <ParticleCanvas />

        {/* Radial gradient overlay */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-[hsl(228,45%,5%)]/50 to-[hsl(228,45%,5%)]"
             style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 40%, transparent, hsl(228,45%,5%) 70%)' }} />

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto space-y-6 animate-fade-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 glass-card-sm rounded-full px-4 py-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-white/60 font-medium">
              FJC Integrated Database · {meta ? meta.n_samples.toLocaleString() : '487,842'} civil court cases
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-5xl sm:text-7xl font-bold leading-tight">
            <span className="text-white">Machine Learning</span>
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-violet-400 to-rose-400 bg-clip-text text-transparent">
              Visualised
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed">
            7 interactive 3D scenes exploring classification and clustering on
            U.S. Federal Court litigation data — built to make complex algorithms genuinely understandable.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4 justify-center pt-4">
            <Link
              to="/classification"
              className="px-7 py-3.5 rounded-xl font-semibold text-sm bg-white text-[hsl(228,45%,5%)]
                         hover:bg-white/90 hover:-translate-y-1 hover:shadow-xl hover:shadow-white/10
                         transition-all duration-300 active:scale-95"
            >
              Explore Models
            </Link>
            <Link
              to="/playground"
              className="px-7 py-3.5 rounded-xl font-semibold text-sm glass-card-gradient text-white
                         hover:bg-white/10 hover:-translate-y-1 transition-all duration-300 active:scale-95"
            >
              Try Playground →
            </Link>
          </div>

          {/* Scroll cue */}
          <div className="pt-8 flex flex-col items-center gap-2 text-white/30">
            <span className="text-xs">Scroll to explore</span>
            <div className="w-px h-12 bg-gradient-to-b from-white/30 to-transparent animate-pulse" />
          </div>
        </div>
      </section>

      {/* ── STATS ROW ───────────────────────────────────────────── */}
      <section className="py-16 px-4 max-w-5xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Civil Cases', value: '487K+', color: '#10b981' },
            { label: 'ML Models',   value: '7',     color: '#8b5cf6' },
            { label: 'Metrics',     value: '9+',    color: '#38bdf8' },
            { label: 'Features',    value: meta?.n_features ?? '9', color: '#f59e0b' },
          ].map(({ label, value, color }) => (
            <div key={label} className="glass-card-gradient rounded-2xl p-6 text-center">
              <div className="font-display text-4xl font-bold" style={{ color }}>{value}</div>
              <div className="text-sm text-white/50 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CLASSIFICATION MODELS ───────────────────────────────── */}
      <section className="py-16 px-4 max-w-6xl mx-auto">
        <div className="text-center space-y-3 mb-12">
          <p className="text-xs text-white/40 uppercase tracking-widest font-semibold">Classification</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white">5 Classifiers, Side by Side</h2>
          <p className="text-white/50 max-w-xl mx-auto">
            Each model gets its own interactive 3D scene — watch the algorithm think.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {MODEL_CARDS.map((m) => (
            <Link
              key={m.id}
              to={`/classification/${m.id}`}
              className="glass-card-gradient rounded-2xl p-5 flex flex-col gap-3
                         hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 group"
              style={{ '--accent': m.accent } as React.CSSProperties}
            >
              <div className="text-3xl">{m.icon}</div>
              <div>
                <div className="font-display font-bold text-sm text-white group-hover:text-white transition-colors">
                  {m.name}
                </div>
                <div className="text-xs text-white/40 mt-1 leading-relaxed">{m.desc}</div>
              </div>
              <div className="mt-auto flex items-center gap-1 text-xs font-medium transition-all duration-200"
                   style={{ color: m.accent }}>
                Explore <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── CLUSTERING ──────────────────────────────────────────── */}
      <section className="py-16 px-4 max-w-6xl mx-auto">
        <div className="text-center space-y-3 mb-12">
          <p className="text-xs text-white/40 uppercase tracking-widest font-semibold">Clustering</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white">Unsupervised Grouping</h2>
          <p className="text-white/50 max-w-xl mx-auto">
            Watch data self-organise — centroids drift, merges cascade, and structure emerges.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {CLUSTER_CARDS.map((c) => (
            <Link
              key={c.id}
              to="/clustering"
              className="glass-card rounded-2xl p-8 flex flex-col gap-4
                         hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 group"
            >
              <div className="text-4xl">{c.icon}</div>
              <div>
                <div className="font-display text-xl font-bold text-white">{c.name}</div>
                <div className="text-sm text-white/40 mt-1">{c.desc}</div>
              </div>
              <div className="text-sm font-medium transition-all duration-200" style={{ color: c.accent }}>
                Explore →
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── PLAYGROUND CTA ──────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center space-y-6 glass-card rounded-3xl p-12">
          <div className="text-5xl">🎮</div>
          <h2 className="font-display text-3xl font-bold text-white">Try it with your own input</h2>
          <p className="text-white/50">
            Enter case features and watch all 5 classifiers race to predict the outcome simultaneously.
          </p>
          <Link
            to="/playground"
            className="inline-block px-8 py-4 rounded-xl font-semibold text-sm
                       bg-gradient-to-r from-emerald-500 to-violet-500 text-white
                       hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/20
                       transition-all duration-300 active:scale-95"
          >
            Open Playground
          </Link>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <footer className="py-8 px-4 text-center text-xs text-white/25 border-t border-white/5">
        <p>FJC Civil Cases ML · Built for academic purposes · AI used for code scaffolding only (cited in README)</p>
        <p className="mt-1">
          <Link to="/about" className="hover:text-white/50 transition-colors">About & Credits</Link>
          {' · '}
          <a href="https://github.com/Moorthi308/fjc-civil-cases-ml" target="_blank" rel="noopener noreferrer"
             className="hover:text-white/50 transition-colors">GitHub ↗</a>
        </p>
      </footer>
    </div>
  )
}
