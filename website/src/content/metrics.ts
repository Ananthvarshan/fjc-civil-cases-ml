/** Metric definitions and chart reading guides */

export interface MetricDef {
  key:        string
  name:       string
  definition: string
  goodIs:     'high' | 'low'
  range:      string
  tip:        string
}

export const METRICS: MetricDef[] = [
  {
    key:        'accuracy',
    name:       'Accuracy',
    definition: 'The fraction of predictions that were correct.',
    goodIs:     'high',
    range:      '0 → 1',
    tip:        'Can be misleading on imbalanced classes — check F1 too.',
  },
  {
    key:        'precision',
    name:       'Precision',
    definition: 'Of all the cases predicted as class X, how many really were X?',
    goodIs:     'high',
    range:      '0 → 1',
    tip:        'High precision = few false alarms.',
  },
  {
    key:        'recall',
    name:       'Recall',
    definition: 'Of all the real class-X cases, how many did we catch?',
    goodIs:     'high',
    range:      '0 → 1',
    tip:        'High recall = few misses. Trade-off with precision.',
  },
  {
    key:        'f1',
    name:       'F1 Score',
    definition: 'Harmonic mean of precision and recall — balances both.',
    goodIs:     'high',
    range:      '0 → 1',
    tip:        'Best single metric when classes are imbalanced.',
  },
  {
    key:        'roc_auc',
    name:       'ROC-AUC',
    definition: 'Area under the Receiver Operating Characteristic curve. Measures how well the model separates classes across all thresholds.',
    goodIs:     'high',
    range:      '0.5 (random) → 1 (perfect)',
    tip:        'AUC = 0.9 means a 90% chance the model ranks a true positive above a true negative.',
  },
  {
    key:        'train_time_s',
    name:       'Training Time',
    definition: 'How many seconds the model took to train.',
    goodIs:     'low',
    range:      'seconds',
    tip:        'Fast models can be retrained quickly as new data arrives.',
  },
  {
    key:        'silhouette',
    name:       'Silhouette Score',
    definition: 'How similar each point is to its own cluster vs. the nearest other cluster.',
    goodIs:     'high',
    range:      '−1 → 1 (>0.5 is good)',
    tip:        'Negative values mean the point was placed in the wrong cluster.',
  },
  {
    key:        'davies_bouldin',
    name:       'Davies-Bouldin Index',
    definition: 'Average ratio of within-cluster scatter to between-cluster separation.',
    goodIs:     'low',
    range:      '≥ 0 (lower is better)',
    tip:        'A DB index near 0 means compact, well-separated clusters.',
  },
  {
    key:        'calinski_harabasz',
    name:       'Calinski-Harabasz Index',
    definition: 'Ratio of between-cluster dispersion to within-cluster dispersion.',
    goodIs:     'high',
    range:      '≥ 0 (higher is better)',
    tip:        'Penalises both loose clusters and poor separation.',
  },
]

export const METRIC_MAP: Record<string, MetricDef> = Object.fromEntries(
  METRICS.map((m) => [m.key, m])
)

/** Chart reading guides */
export const GRAPH_GUIDES: Record<string, { title: string; howToRead: string; whatGoodLooksLike: string }> = {
  confusion_matrix: {
    title: 'Confusion Matrix',
    howToRead: 'Rows = actual class, Columns = predicted class. The diagonal (top-left to bottom-right) shows correct predictions. Off-diagonal cells show mistakes.',
    whatGoodLooksLike: 'A bright diagonal and dark off-diagonal squares. Large bright off-diagonal cells reveal which class pairs the model confuses most.',
  },
  roc_curve: {
    title: 'ROC Curve',
    howToRead: 'X-axis = False Positive Rate (how often we cry wolf). Y-axis = True Positive Rate (how often we catch the real thing). Each point on the curve is a different decision threshold.',
    whatGoodLooksLike: 'A curve that hugs the top-left corner. A diagonal line from (0,0) to (1,1) is a random model. AUC is the area under the curve.',
  },
  feature_importance: {
    title: 'Feature Importance',
    howToRead: 'Each bar shows how much a feature contributed to the model\'s decisions. Longer bar = more important. Based on mean decrease in Gini impurity (for tree models).',
    whatGoodLooksLike: 'A clear leader indicates one dominant predictor. Many roughly equal bars suggest the model uses diverse signals.',
  },
  loss_curve: {
    title: 'Training Loss Curve',
    howToRead: 'X-axis = training epoch. Y-axis = loss (lower is better). The training curve should decrease. The validation curve shows how well the model generalises.',
    whatGoodLooksLike: 'Both curves decrease and then plateau together. If training loss falls but validation loss rises (diverges), the model is overfitting.',
  },
  elbow_curve: {
    title: 'Elbow Curve (K-Means)',
    howToRead: 'X-axis = number of clusters k. Y-axis = total within-cluster sum of squares (inertia). Inertia always decreases as k grows.',
    whatGoodLooksLike: 'A sharp "elbow" where the rate of improvement slows. The k at the elbow is usually the sweet spot.',
  },
  pca_scatter: {
    title: 'PCA Cluster Scatter',
    howToRead: 'Each point is a court case projected onto its two most variable dimensions (principal components). Colour = cluster assignment.',
    whatGoodLooksLike: 'Tight, separated colour blobs. Overlapping colours suggest the clusters aren\'t well-separated in the original feature space.',
  },
}
