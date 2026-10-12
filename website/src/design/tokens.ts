/** Design tokens as typed TypeScript constants — keep in sync with theme.css */

export const COLORS = {
  bg: {
    deepest:  'hsl(228, 45%, 5%)',
    deep:     'hsl(228, 40%, 8%)',
    card:     'hsl(228, 35%, 11%)',
    elevated: 'hsl(228, 30%, 15%)',
  },
  text: {
    primary:   'hsl(220, 20%, 95%)',
    secondary: 'hsl(220, 15%, 65%)',
    muted:     'hsl(220, 12%, 45%)',
  },
  model: {
    random_forest:     '#10b981',
    adaboost:          '#f59e0b',
    gradient_boosting: '#8b5cf6',
    bagging:           '#38bdf8',
    mlp:               '#f43f5e',
  },
  /** Colourblind-safe class palette (Tableau 10 subset) */
  classes: ['#4e79a7', '#f28e2b', '#59a14f', '#e15759', '#76b7b2'],
} as const

export const RADII = {
  sm: '6px',
  md: '12px',
  lg: '20px',
  xl: '28px',
} as const

export const EASINGS = {
  outExpo:   'cubic-bezier(0.16, 1, 0.3, 1)',
  inOutExpo: 'cubic-bezier(0.87, 0, 0.13, 1)',
  spring:    'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const

export const DURATIONS = {
  fast:   150,
  normal: 350,
  slow:   700,
} as const

export type ModelId = keyof typeof COLORS.model
export const MODEL_IDS: ModelId[] = [
  'random_forest', 'adaboost', 'gradient_boosting', 'bagging', 'mlp',
]
