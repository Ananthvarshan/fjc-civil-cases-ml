/** All TypeScript interfaces matching backend Pydantic schemas exactly. */

export interface FeatureSchema {
  name: string
  type: 'numerical' | 'categorical'
  description: string
  min?: number
  max?: number
  categories?: (number | string)[]
}

export interface PcaPoint {
  x: number
  y: number
  z: number
  label: number
}

// ── /api/meta ────────────────────────────────────────────────────────────────

export interface MetaResponse {
  name: string
  description: string
  n_samples: number
  n_features: number
  class_names: string[]
  task: string
  features: FeatureSchema[]
  presets: Array<{ label: string; values: Record<string, number | string> }>
  pca_points: PcaPoint[]
  model_ids: string[]
}

// ── /api/models ───────────────────────────────────────────────────────────────

export interface ModelMeta {
  id: string
  name: string
  short_description: string
  accent_color: string
}

export interface ModelListResponse {
  models: ModelMeta[]
}

export interface MetricDetail {
  accuracy: number
  precision: number
  recall: number
  f1: number
  roc_auc: number
  train_time_s: number
  confusion_matrix: number[][]
  roc_points: Array<{ fpr: number; tpr: number }>
}

export interface ModelDetailResponse {
  id: string
  name: string
  short_description: string
  accent_color: string
  metrics: MetricDetail
  trace: Record<string, unknown>
}

// ── /api/predict ──────────────────────────────────────────────────────────────

export interface PredictRequest {
  features: Record<string, number | string>
}

export interface PredictResponse {
  model: string
  label: string
  label_index: number
  probabilities: Record<string, number>
  trace: Record<string, unknown>
}

export interface PredictAllResponse {
  results: Record<string, PredictResponse>
}

// ── /api/compare ──────────────────────────────────────────────────────────────

export interface CompareResponse {
  metrics: Record<string, MetricDetail>
  roc_curves: Record<string, Array<{ fpr: number; tpr: number }>>
}

// ── /api/cluster ──────────────────────────────────────────────────────────────

export interface ClusterPoint {
  x: number
  y: number
  z: number
  label: number
}

export interface ClusterResponse {
  type: 'kmeans' | 'agglo'
  k: number
  points: ClusterPoint[]
  metrics: {
    silhouette: number
    davies_bouldin: number
    calinski_harabasz: number
  }
  extra: Record<string, unknown>
}

// ── Model-specific trace types ────────────────────────────────────────────────

export interface RFTrace {
  votes: number[]
  n_estimators: number
  shown: number
}

export interface AdaBoostTrace {
  stage_confidences: Array<Record<string, number>>
  n_estimators: number
}

export interface GBTrace {
  stage_probas: number[][]
  n_estimators: number
}

export interface BaggingTrace {
  estimator_predictions: number[]
  n_estimators: number
}

export interface MLPTrace {
  layer_sizes: number[]
  activations: number[][]
}
