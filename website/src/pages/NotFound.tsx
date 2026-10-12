import React from 'react'
import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 gap-6">
      <div className="text-8xl font-display font-bold text-white/10">404</div>
      <h1 className="font-display text-2xl font-bold text-white">Page Not Found</h1>
      <p className="text-white/40 max-w-sm">
        This page doesn't exist in the dataset.
      </p>
      <Link
        to="/"
        className="px-6 py-3 rounded-xl font-medium text-sm glass-card-gradient text-white
                   hover:bg-white/10 transition-all hover:-translate-y-0.5"
      >
        ← Back to Home
      </Link>
    </div>
  )
}
