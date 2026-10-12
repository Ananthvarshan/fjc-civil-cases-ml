import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'

const LINKS = [
  { to: '/data',           label: 'Data' },
  { to: '/classification', label: 'Classifiers' },
  { to: '/clustering',     label: 'Clustering' },
  { to: '/playground',     label: 'Playground' },
  { to: '/arena',          label: 'Arena' },
  { to: '/about',          label: 'About' },
]

export default function Nav() {
  const location  = useLocation()
  const { explainLevel, setExplainLevel } = useAppStore()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen]         = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'py-2' : 'py-4'
      }`}
    >
      <div
        className="mx-auto max-w-7xl px-4 flex items-center justify-between
                   glass-card-sm rounded-2xl"
        style={{ margin: '0 16px' }}
      >
        {/* Logo */}
        <Link
          to="/"
          className="font-display text-lg font-bold tracking-tight
                     bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent
                     hover:from-white hover:to-white transition-all duration-300"
        >
          FJC<span className="text-emerald-400">·ML</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {LINKS.map(({ to, label }) => {
            const active = location.pathname.startsWith(to)
            return (
              <Link
                key={to}
                to={to}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
                  ${active
                    ? 'bg-white/10 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          {/* Explain level toggle */}
          <button
            onClick={() => setExplainLevel(explainLevel === 'beginner' ? 'technical' : 'beginner')}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg
                       glass-card-sm text-xs font-medium text-white/70 hover:text-white
                       transition-all duration-200 hover:bg-white/10"
            aria-label="Toggle explanation level"
          >
            <span className={explainLevel === 'beginner' ? 'text-emerald-400' : 'text-white/40'}>
              Beginner
            </span>
            <span className="text-white/20">/</span>
            <span className={explainLevel === 'technical' ? 'text-violet-400' : 'text-white/40'}>
              Technical
            </span>
          </button>

          {/* Mobile burger */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            <div className="space-y-1">
              <span className={`block h-0.5 w-5 bg-white transition-all ${open ? 'rotate-45 translate-y-1.5' : ''}`} />
              <span className={`block h-0.5 w-5 bg-white transition-all ${open ? 'opacity-0' : ''}`} />
              <span className={`block h-0.5 w-5 bg-white transition-all ${open ? '-rotate-45 -translate-y-1.5' : ''}`} />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden mx-4 mt-2 glass-card p-4 space-y-1 rounded-2xl">
          {LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className="block px-3 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
