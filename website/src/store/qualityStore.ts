import { create } from 'zustand'

export type QualityTier = 'high' | 'mid' | 'low'

interface QualityState {
  tier:         QualityTier
  reducedMotion: boolean
  dpr:          number

  setTier:         (t: QualityTier) => void
  setReducedMotion: (v: boolean) => void
}

function detectTier(): QualityTier {
  if (typeof window === 'undefined') return 'mid'
  // Simple heuristic: CPU cores + mobile check
  const cores = navigator.hardwareConcurrency ?? 4
  const mobile = /Mobi|Android/i.test(navigator.userAgent)
  if (mobile || cores <= 2) return 'low'
  if (cores <= 4) return 'mid'
  return 'high'
}

const tier = detectTier()

export const useQualityStore = create<QualityState>((set) => ({
  tier,
  reducedMotion: typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false,
  dpr: tier === 'high' ? Math.min(window.devicePixelRatio, 2)
     : tier === 'mid'  ? Math.min(window.devicePixelRatio, 1.5)
     : 1,

  setTier:         (t) => set({ tier: t }),
  setReducedMotion: (v) => set({ reducedMotion: v }),
}))
