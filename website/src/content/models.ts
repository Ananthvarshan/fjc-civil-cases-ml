/** All explanatory copy for every model. Never inline text in components. */

import type { ModelId } from '@/design/tokens'

export interface ModelContent {
  id:            ModelId
  name:          string
  tagline:       string
  analogy:       string
  beginnerText:  string
  technicalText: string
  stepCaptions:  Array<{ label: string; beginner: string; technical: string }>
  pros:          string[]
  cons:          string[]
  params: Array<{
    key:     string
    label:   string
    min:     number
    max:     number
    default: number
    step:    number
    unit?:   string
  }>
}

export const MODEL_CONTENT: Record<ModelId, ModelContent> = {
  random_forest: {
    id:   'random_forest',
    name: 'Random Forest',
    tagline: 'A democracy of decision trees',
    analogy: 'Imagine asking 100 different lawyers to predict the case outcome, each trained on a slightly different subset of past cases. The final verdict goes with the majority. That\'s Random Forest.',
    beginnerText: 'A Random Forest trains many individual decision trees on different random slices of the data. When predicting, every tree votes, and the most popular answer wins. More trees → more reliable, but slower.',
    technicalText: 'Bagged ensemble of CART trees trained on bootstrap samples with feature sub-sampling (√p features per split). Variance is reduced via averaging, with no bias increase. Out-of-bag samples allow unbiased error estimation without a separate validation set.',
    stepCaptions: [
      { label: 'Bootstrap Sampling', beginner: 'Each tree picks a random 63% of the training data (with repetition).', technical: 'Sampling with replacement (bootstrap) creates B datasets each of size n. OOB samples (~37%) are used for error estimation.' },
      { label: 'Growing Trees',      beginner: 'Each tree learns rules from its subset, like "if JURY=1 and NOS>200, predict Judgment".', technical: 'CART grows each tree to full depth with no pruning. At each node, √p features are randomly selected as candidates for the best Gini split.' },
      { label: 'Voting',             beginner: 'All 100 trees vote on your case. The outcome with the most votes wins.', technical: 'Class prediction is the argmax of the averaged predicted class probabilities across all B estimators.' },
      { label: 'Results',            beginner: 'See which outcome won and by how wide a margin.', technical: 'Inspect out-of-bag accuracy, feature importances (mean decrease in impurity), and the vote distribution.' },
    ],
    pros: ['Handles many features and mixed types', 'Robust to outliers', 'Built-in feature importance', 'No hyperparameter sensitivity'],
    cons: ['Black-box (hard to interpret individual trees)', 'Slower at inference with many trees', 'Memory-intensive'],
    params: [
      { key: 'n_estimators', label: 'Number of trees', min: 10, max: 200, default: 100, step: 10 },
      { key: 'max_depth',    label: 'Max tree depth',  min: 2,  max: 20,  default: 10,  step: 1 },
    ],
  },

  adaboost: {
    id:   'adaboost',
    name: 'AdaBoost',
    tagline: 'Turning weak learners into a strong team',
    analogy: 'Imagine 50 junior analysts, each only a little better than random. After each round, the cases they got wrong get more attention in the next round. Together, they become surprisingly accurate.',
    beginnerText: 'AdaBoost trains a series of tiny "stump" classifiers (just one split). Each round focuses on the samples the previous stumps got wrong by upweighting them. The final answer is a weighted vote across all stumps.',
    technicalText: 'SAMME.R variant: each round t trains a weak learner h_t minimising the exponential loss on weighted samples. Weights w_i are multiplied by exp(-α_t · y_i · h_t(x_i)). Final classifier is H(x) = sign(Σ α_t h_t(x)).',
    stepCaptions: [
      { label: 'Initialise Weights',  beginner: 'All cases start equal — each has the same importance.', technical: 'Uniform sample weights: w_i = 1/n for all i.' },
      { label: 'Train Stump',         beginner: 'A tiny one-split classifier does its best on the current weights.', technical: 'Decision stump h_t minimises weighted Gini impurity. Error ε_t = Σ w_i · 𝟙[h_t(x_i) ≠ y_i].' },
      { label: 'Reweight Samples',    beginner: 'Wrong cases get bigger weights so the next stump pays more attention to them.', technical: 'α_t = ½ ln((1−ε_t)/ε_t). Weights: w_i ← w_i · exp(−α_t y_i h_t(x_i)), then renormalise.' },
      { label: 'Aggregate Votes',     beginner: 'All stumps cast weighted votes. Stumps that were more accurate count for more.', technical: 'F(x) = Σ_t α_t h_t(x). Class probabilities via softmax of the stage scores.' },
    ],
    pros: ['Simple to understand and implement', 'Low bias', 'Works well with simple base learners'],
    cons: ['Sensitive to noisy labels and outliers (they get upweighted)', 'Slower than RF for the same accuracy', 'No parallelism'],
    params: [
      { key: 'n_estimators',   label: 'Number of rounds', min: 10,  max: 200,  default: 50,  step: 10 },
      { key: 'learning_rate',  label: 'Learning rate',    min: 0.01, max: 2.0, default: 1.0, step: 0.05 },
    ],
  },

  gradient_boosting: {
    id:   'gradient_boosting',
    name: 'Gradient Boosting',
    tagline: 'Correcting mistakes, stage by stage',
    analogy: 'Imagine building a sculpture by repeatedly filling in the dents. Each stage adds a small correction to what remains imperfect. Gradient Boosting does the same for prediction errors.',
    beginnerText: 'Gradient Boosting adds decision trees one at a time. Each new tree focuses on the residual errors of the combined ensemble so far. With enough stages, even hard-to-predict cases get captured.',
    technicalText: 'Functional gradient descent in the space of prediction functions. At each stage m, fit a regression tree to −∂L/∂F(x) (negative gradient of the loss). Update: F_m(x) = F_{m-1}(x) + ν · h_m(x), where ν is the learning rate (shrinkage).',
    stepCaptions: [
      { label: 'Initial Prediction',  beginner: 'Start with the simplest guess: the most common class.', technical: 'F_0(x) = argmin_γ Σ L(y_i, γ) — for log-loss this is log(p/(1−p)) of the base rate.' },
      { label: 'Compute Residuals',   beginner: 'Check how wrong the current prediction is for every case.', technical: 'Pseudo-residuals r_im = −[∂L(y_i, F(x_i))/∂F(x_i)] evaluated at F_{m-1}.' },
      { label: 'Fit Correction Tree', beginner: 'Train a small tree to predict those residuals.', technical: 'Fit h_m to {(x_i, r_im)}. Leaf values γ_jm are set by line search: argmin_γ Σ_{x_i in R_jm} L(y_i, F_{m-1}(x_i) + γ).' },
      { label: 'Shrink and Add',      beginner: 'Add a small fraction of the correction tree to the ensemble.', technical: 'F_m(x) = F_{m-1}(x) + ν h_m(x). Small ν regularises; requires more stages but generalises better.' },
    ],
    pros: ['Often highest accuracy on tabular data', 'Handles mixed feature types', 'Feature importances via split gain'],
    cons: ['Slowest to train (sequential)', 'More hyperparameters to tune', 'Can overfit without careful regularisation'],
    params: [
      { key: 'n_estimators',  label: 'Stages',         min: 10,   max: 300,  default: 100, step: 10 },
      { key: 'learning_rate', label: 'Learning rate',  min: 0.01, max: 0.5,  default: 0.1, step: 0.01 },
      { key: 'max_depth',     label: 'Tree depth',     min: 1,    max: 8,    default: 3,   step: 1 },
    ],
  },

  bagging: {
    id:   'bagging',
    name: 'Bagging',
    tagline: 'Independent experts, pooled wisdom',
    analogy: 'Each juror sees a different sample of the evidence and renders an independent verdict. Bagging works the same way: independent models trained on random subsets, then voted together.',
    beginnerText: 'Bagging (Bootstrap Aggregation) trains several identical classifiers on different random samples of the data. Each works independently, and the final prediction is a majority vote — reducing the risk that any one model is wrong.',
    technicalText: 'Ensemble of B base estimators each trained on an i.i.d. bootstrap sample of size n. Reduces variance ∝ 1/B without changing bias. Key difference from RF: no feature sub-sampling — each estimator sees all features at every split.',
    stepCaptions: [
      { label: 'Bootstrap Samples',  beginner: 'Create multiple random copies of the data (with repetition) — one for each model.', technical: 'Sample with replacement: each bootstrap dataset D_b ~ D (size n). ~37% of original samples excluded (OOB).' },
      { label: 'Train Estimators',   beginner: 'Train a classifier independently on each data sample.', technical: 'Each h_b is fitted on D_b. No inter-estimator communication during training — full parallelism.' },
      { label: 'Majority Vote',      beginner: 'Combine predictions by counting votes across all models.', technical: 'Soft voting: P(y|x) = (1/B) Σ_b h_b.predict_proba(x). Hard voting: argmax of the sum.' },
    ],
    pros: ['Reduces variance, stable predictions', 'Fully parallelisable', 'Simple to understand'],
    cons: ['Does not reduce bias', 'Less powerful than RF (no feature sub-sampling)', 'Still a black box'],
    params: [
      { key: 'n_estimators', label: 'Number of bags', min: 5,  max: 50, default: 10, step: 5 },
      { key: 'max_samples',  label: 'Sample fraction (0–1)', min: 0.5, max: 1.0, default: 1.0, step: 0.05 },
    ],
  },

  mlp: {
    id:   'mlp',
    name: 'Neural Network (MLP)',
    tagline: 'Layered learning, inspired by the brain',
    analogy: 'Neurons in your brain pass signals through layers. Early layers detect simple patterns; later layers combine them into complex concepts. A neural network learns case outcomes the same way.',
    beginnerText: 'A Multi-Layer Perceptron stacks layers of artificial neurons. Each layer transforms the input, building up richer representations. The final layer outputs the probability of each outcome.',
    technicalText: 'Feedforward network f: ℝ^d → ℝ^K. Each layer l: z^(l) = W^(l) a^(l-1) + b^(l), a^(l) = σ(z^(l)). σ = ReLU for hidden layers, Softmax for output. Trained with Adam on cross-entropy loss, with optional L2 regularisation.',
    stepCaptions: [
      { label: 'Input Layer',    beginner: 'Feed the case features into the network — one value per input neuron.', technical: 'Input: x ∈ ℝ^d after preprocessing (StandardScaler + OHE). d = number of encoded features.' },
      { label: 'Hidden Layers',  beginner: 'Each layer transforms the data, detecting patterns the previous layer couldn\'t see.', technical: 'Hidden layers: a^(l) = ReLU(W^(l) a^(l-1) + b^(l)). ReLU preserves gradients; optional BatchNorm stabilises training.' },
      { label: 'Output Layer',   beginner: 'The final layer outputs how likely each case outcome is.', technical: 'Output: Softmax(W^(L) a^(L-1) + b^(L)) → probability vector p ∈ ℝ^K, Σ p_k = 1.' },
      { label: 'Backpropagation',beginner: 'The network adjusts its weights based on its mistakes, getting better each epoch.', technical: 'Adam update: Δθ = −η · m̂_t / (√v̂_t + ε), where m̂, v̂ are bias-corrected 1st/2nd moment estimates.' },
    ],
    pros: ['Learns complex non-linear patterns', 'Flexible architecture', 'State-of-the-art on many tasks'],
    cons: ['Requires large datasets and compute', 'Many hyperparameters', 'Black box — hard to interpret'],
    params: [
      { key: 'hidden_layer_sizes', label: 'Hidden neurons (per layer)', min: 32, max: 512, default: 128, step: 32 },
      { key: 'max_iter',           label: 'Max epochs',                  min: 50, max: 500, default: 200, step: 50 },
      { key: 'alpha',              label: 'L2 regularisation (×0.001)',  min: 0,  max: 10,  default: 1,   step: 1 },
    ],
  },
}
