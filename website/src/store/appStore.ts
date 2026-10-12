import { create } from 'zustand'
import type { PredictResponse } from '@/api/types'

export type ExplainLevel = 'beginner' | 'technical'

interface AppState {
  explainLevel:     ExplainLevel
  selectedModel:    string
  inputVector:      Record<string, number | string>
  predictionResult: PredictResponse | null

  setExplainLevel:     (level: ExplainLevel) => void
  setSelectedModel:    (id: string) => void
  setInputVector:      (vec: Record<string, number | string>) => void
  setPredictionResult: (result: PredictResponse | null) => void
  updateInput:         (key: string, value: number | string) => void
}

export const useAppStore = create<AppState>((set) => ({
  explainLevel:     'beginner',
  selectedModel:    'random_forest',
  inputVector:      {},
  predictionResult: null,

  setExplainLevel:     (level)  => set({ explainLevel: level }),
  setSelectedModel:    (id)     => set({ selectedModel: id }),
  setInputVector:      (vec)    => set({ inputVector: vec }),
  setPredictionResult: (result) => set({ predictionResult: result }),
  updateInput: (key, value) =>
    set((s) => ({ inputVector: { ...s.inputVector, [key]: value } })),
}))
