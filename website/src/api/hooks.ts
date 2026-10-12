import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from './client'
import type {
  MetaResponse,
  ModelDetailResponse,
  CompareResponse,
  ClusterResponse,
  PredictRequest,
  PredictResponse,
  PredictAllResponse,
} from './types'

// ── Keys ──────────────────────────────────────────────────────────────────────
export const QK = {
  meta:    ['meta']                      as const,
  model:   (id: string) => ['model', id] as const,
  compare: ['compare']                   as const,
  cluster: (type: string, k: number) => ['cluster', type, k] as const,
}

// ── Queries ───────────────────────────────────────────────────────────────────

export function useMeta() {
  return useQuery({
    queryKey: QK.meta,
    queryFn:  () => api.get<MetaResponse>('/meta'),
    staleTime: Infinity,
  })
}

export function useModelDetail(id: string) {
  return useQuery({
    queryKey: QK.model(id),
    queryFn:  () => api.get<ModelDetailResponse>(`/models/${id}`),
    staleTime: Infinity,
    enabled:  !!id,
  })
}

export function useCompare() {
  return useQuery({
    queryKey: QK.compare,
    queryFn:  () => api.get<CompareResponse>('/compare'),
    staleTime: Infinity,
  })
}

export function useCluster(type: 'kmeans' | 'agglo', k: number) {
  return useQuery({
    queryKey: QK.cluster(type, k),
    queryFn:  () => api.get<ClusterResponse>(`/cluster/${type}?k=${k}`),
    staleTime: 60_000,
    enabled: !!type && k >= 2,
  })
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function usePredict(modelId: string) {
  return useMutation({
    mutationFn: (body: PredictRequest) =>
      api.post<PredictResponse>(`/predict/${modelId}`, body),
  })
}

export function usePredictAll() {
  return useMutation({
    mutationFn: (body: PredictRequest) =>
      api.post<PredictAllResponse>('/predict/all', body),
  })
}
