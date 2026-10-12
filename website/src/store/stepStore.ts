import { create } from 'zustand'

interface StepState {
  stepIndex:  number
  isPlaying:  boolean
  speed:      number   // 0.5 | 1 | 2
  maxSteps:   number
  sceneKey:   string   // which scene is active

  setStepIndex: (i: number) => void
  setIsPlaying: (v: boolean) => void
  setSpeed:     (s: number) => void
  setMaxSteps:  (n: number) => void
  setSceneKey:  (k: string) => void
  nextStep:     () => void
  prevStep:     () => void
  reset:        () => void
}

export const useStepStore = create<StepState>((set, get) => ({
  stepIndex: 0,
  isPlaying: false,
  speed:     1,
  maxSteps:  10,
  sceneKey:  '',

  setStepIndex: (i)  => set({ stepIndex: Math.max(0, Math.min(i, get().maxSteps - 1)) }),
  setIsPlaying: (v)  => set({ isPlaying: v }),
  setSpeed:     (s)  => set({ speed: s }),
  setMaxSteps:  (n)  => set({ maxSteps: n }),
  setSceneKey:  (k)  => set({ sceneKey: k, stepIndex: 0, isPlaying: false }),
  nextStep: () => {
    const { stepIndex, maxSteps, isPlaying } = get()
    if (stepIndex >= maxSteps - 1) { set({ isPlaying: false }); return }
    set({ stepIndex: stepIndex + 1 })
  },
  prevStep: () => set((s) => ({ stepIndex: Math.max(0, s.stepIndex - 1) })),
  reset:    () => set({ stepIndex: 0, isPlaying: false }),
}))
