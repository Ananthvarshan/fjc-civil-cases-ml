/** D3/visx chart theme — dark, matches the 3D look */
export const CHART_THEME = {
  background:   'transparent',
  gridColor:    'rgba(255,255,255,0.06)',
  axisColor:    'rgba(255,255,255,0.2)',
  labelColor:   'rgba(255,255,255,0.45)',
  tooltipBg:    'rgba(12,18,38,0.92)',
  tooltipBorder:'rgba(255,255,255,0.08)',
  font:         '"Inter", system-ui, sans-serif',
  fontSize:     11,
} as const

export const CLASS_COLORS = [
  '#4e79a7', '#f28e2b', '#59a14f', '#e15759', '#76b7b2',
]

export const MODEL_COLORS: Record<string, string> = {
  random_forest:     '#10b981',
  adaboost:          '#f59e0b',
  gradient_boosting: '#8b5cf6',
  bagging:           '#38bdf8',
  mlp:               '#f43f5e',
}
