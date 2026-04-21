/**
 * A/B Test content analyzer for social media posts.
 *
 * Provides tools for creating, tracking, and analyzing A/B tests
 * on content variations to optimize engagement.
 *
 * @fileoverview A/B testing utilities for content optimization
 * @module lib/ab-test-analyzer
 *
 * @example
 * ```typescript
 * import { createABTest, analyzeResults } from './ab-test-analyzer';
 *
 * const test = createABTest({
 *   name: 'Hook Style Test',
 *   variants: [{ id: 'A', content: 'Question hook' }, { id: 'B', content: 'Statement hook' }],
 * });
 *
 * const results = analyzeResults(test, metrics);
 * console.log(`Winner: Variant ${results.winner} with ${results.improvement}% improvement`);
 * ```
 */

/**
 * Content variant for testing.
 */
export interface ContentVariant {
  id: string;
  name?: string;
  content: string;
  metadata?: Record<string, unknown>;
}

/**
 * Engagement metrics for a variant.
 */
export interface VariantMetrics {
  variantId: string;
  impressions: number;
  engagements: number;
  clicks?: number;
  shares?: number;
  comments?: number;
  saves?: number;
  conversions?: number;
  revenue?: number;
}

/**
 * A/B test configuration.
 */
export interface ABTest {
  id: string;
  name: string;
  description?: string;
  platform: string;
  variants: ContentVariant[];
  targetMetric: 'engagement_rate' | 'ctr' | 'conversion_rate' | 'shares' | 'revenue';
  trafficSplit: Record<string, number>;
  minSampleSize: number;
  confidenceLevel: number;
  status: 'draft' | 'running' | 'completed' | 'stopped';
  createdAt: Date;
  startedAt?: Date;
  endedAt?: Date;
}

/**
 * Statistical analysis results.
 */
export interface TestResults {
  testId: string;
  winner: string | null;
  isSignificant: boolean;
  confidence: number;
  pValue: number;
  improvement: number;
  variantStats: VariantStats[];
  sampleSizeReached: boolean;
  recommendation: string;
}

/**
 * Per-variant statistics.
 */
export interface VariantStats {
  variantId: string;
  sampleSize: number;
  metric: number;
  standardError: number;
  confidenceInterval: [number, number];
  isControl: boolean;
}

/**
 * Create a new A/B test.
 *
 * @param config - Test configuration
 * @returns Created test object
 */
export function createABTest(config: {
  name: string;
  description?: string;
  platform?: string;
  variants: Array<{ id?: string; name?: string; content: string }>;
  targetMetric?: ABTest['targetMetric'];
  trafficSplit?: Record<string, number>;
  minSampleSize?: number;
  confidenceLevel?: number;
}): ABTest {
  const {
    name,
    description,
    platform = 'generic',
    variants,
    targetMetric = 'engagement_rate',
    minSampleSize = 1000,
    confidenceLevel = 0.95,
  } = config;

  // Generate IDs for variants if not provided
  const processedVariants: ContentVariant[] = variants.map((v, i) => ({
    id: v.id || String.fromCharCode(65 + i), // A, B, C, ...
    name: v.name || `Variant ${String.fromCharCode(65 + i)}`,
    content: v.content,
  }));

  // Default traffic split (equal)
  const defaultSplit: Record<string, number> = {};
  const splitPct = 100 / processedVariants.length;
  processedVariants.forEach((v) => {
    defaultSplit[v.id] = splitPct;
  });

  return {
    id: generateTestId(),
    name,
    description,
    platform,
    variants: processedVariants,
    targetMetric,
    trafficSplit: config.trafficSplit || defaultSplit,
    minSampleSize,
    confidenceLevel,
    status: 'draft',
    createdAt: new Date(),
  };
}

/**
 * Calculate engagement rate from metrics.
 */
function calculateMetric(
  metrics: VariantMetrics,
  targetMetric: ABTest['targetMetric']
): number {
  const { impressions, engagements, clicks, shares, conversions, revenue } = metrics;

  switch (targetMetric) {
    case 'engagement_rate':
      return impressions > 0 ? (engagements / impressions) * 100 : 0;
    case 'ctr':
      return impressions > 0 ? ((clicks || 0) / impressions) * 100 : 0;
    case 'conversion_rate':
      return impressions > 0 ? ((conversions || 0) / impressions) * 100 : 0;
    case 'shares':
      return impressions > 0 ? ((shares || 0) / impressions) * 100 : 0;
    case 'revenue':
      return revenue || 0;
    default:
      return impressions > 0 ? (engagements / impressions) * 100 : 0;
  }
}

/**
 * Calculate standard error for a proportion.
 */
function calculateStandardError(proportion: number, sampleSize: number): number {
  if (sampleSize === 0) return 0;
  return Math.sqrt((proportion * (100 - proportion)) / sampleSize);
}

/**
 * Calculate z-score for significance test.
 */
function calculateZScore(p1: number, p2: number, n1: number, n2: number): number {
  // Pooled proportion
  const pooled = ((p1 / 100) * n1 + (p2 / 100) * n2) / (n1 + n2);
  const se = Math.sqrt(pooled * (1 - pooled) * (1 / n1 + 1 / n2));

  if (se === 0) return 0;
  return ((p1 - p2) / 100) / se;
}

/**
 * Convert z-score to p-value (two-tailed).
 */
function zToPValue(z: number): number {
  // Approximation using error function
  const x = Math.abs(z) / Math.sqrt(2);
  const t = 1 / (1 + 0.3275911 * x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const erf = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 2 * (1 - 0.5 * (1 + erf));
}

/**
 * Calculate confidence interval for a proportion.
 */
function calculateConfidenceInterval(
  proportion: number,
  sampleSize: number,
  confidenceLevel: number
): [number, number] {
  // Z-score for confidence level
  const zScores: Record<number, number> = {
    0.9: 1.645,
    0.95: 1.96,
    0.99: 2.576,
  };
  const z = zScores[confidenceLevel] || 1.96;

  const se = calculateStandardError(proportion, sampleSize);
  const margin = z * se;

  return [Math.max(0, proportion - margin), proportion + margin];
}

/**
 * Analyze A/B test results.
 *
 * @param test - Test configuration
 * @param metrics - Array of metrics for each variant
 * @returns Statistical analysis results
 */
export function analyzeResults(test: ABTest, metrics: VariantMetrics[]): TestResults {
  const { targetMetric, minSampleSize, confidenceLevel } = test;

  // Calculate stats for each variant
  const variantStats: VariantStats[] = metrics.map((m, i) => {
    const metric = calculateMetric(m, targetMetric);
    const se = calculateStandardError(metric, m.impressions);
    const ci = calculateConfidenceInterval(metric, m.impressions, confidenceLevel);

    return {
      variantId: m.variantId,
      sampleSize: m.impressions,
      metric,
      standardError: se,
      confidenceInterval: ci,
      isControl: i === 0, // First variant is control
    };
  });

  // Check if minimum sample size reached
  const totalSample = variantStats.reduce((sum, v) => sum + v.sampleSize, 0);
  const sampleSizeReached = totalSample >= minSampleSize * test.variants.length;

  // Find best performing variant
  const sortedVariants = [...variantStats].sort((a, b) => b.metric - a.metric);
  const best = sortedVariants[0];
  const control = variantStats.find((v) => v.isControl) || variantStats[0];

  // Statistical significance test (vs control)
  let isSignificant = false;
  let pValue = 1;
  let improvement = 0;

  if (best.variantId !== control.variantId && control.sampleSize > 0 && best.sampleSize > 0) {
    const zScore = calculateZScore(best.metric, control.metric, best.sampleSize, control.sampleSize);
    pValue = zToPValue(zScore);
    isSignificant = pValue < (1 - confidenceLevel);
    improvement = control.metric > 0 ? ((best.metric - control.metric) / control.metric) * 100 : 0;
  }

  // Generate recommendation
  let recommendation: string;
  if (!sampleSizeReached) {
    recommendation = `Continue test. Need ${minSampleSize * test.variants.length - totalSample} more impressions for reliable results.`;
  } else if (isSignificant) {
    recommendation = `Variant ${best.variantId} is the winner with ${improvement.toFixed(1)}% improvement (p=${pValue.toFixed(4)}). Consider implementing this variant.`;
  } else {
    recommendation = `No significant difference detected (p=${pValue.toFixed(4)}). Consider running longer or testing different variations.`;
  }

  return {
    testId: test.id,
    winner: isSignificant ? best.variantId : null,
    isSignificant,
    confidence: 1 - pValue,
    pValue,
    improvement,
    variantStats,
    sampleSizeReached,
    recommendation,
  };
}

/**
 * Calculate required sample size for desired statistical power.
 *
 * @param baselineRate - Expected baseline conversion/engagement rate (%)
 * @param minDetectableEffect - Minimum relative change to detect (%)
 * @param power - Statistical power (default 0.8)
 * @param confidenceLevel - Confidence level (default 0.95)
 * @returns Required sample size per variant
 */
export function calculateRequiredSampleSize(
  baselineRate: number,
  minDetectableEffect: number,
  power: number = 0.8,
  confidenceLevel: number = 0.95
): number {
  // Z-scores
  const zAlpha = confidenceLevel === 0.95 ? 1.96 : confidenceLevel === 0.99 ? 2.576 : 1.645;
  const zBeta = power === 0.8 ? 0.84 : power === 0.9 ? 1.28 : 0.84;

  // Convert percentages
  const p1 = baselineRate / 100;
  const p2 = p1 * (1 + minDetectableEffect / 100);

  // Pooled standard deviation
  const pooledVar = p1 * (1 - p1) + p2 * (1 - p2);

  // Sample size formula
  const n = (2 * pooledVar * Math.pow(zAlpha + zBeta, 2)) / Math.pow(p2 - p1, 2);

  return Math.ceil(n);
}

/**
 * Generate test duration estimate.
 *
 * @param requiredSampleSize - Required impressions per variant
 * @param dailyImpressions - Expected daily impressions
 * @param variants - Number of variants
 * @returns Estimated days to complete
 */
export function estimateTestDuration(
  requiredSampleSize: number,
  dailyImpressions: number,
  variants: number = 2
): { days: number; impressionsNeeded: number } {
  const totalNeeded = requiredSampleSize * variants;
  const days = Math.ceil(totalNeeded / dailyImpressions);

  return {
    days,
    impressionsNeeded: totalNeeded,
  };
}

/**
 * Generate a test summary report.
 *
 * @param test - Test configuration
 * @param results - Analysis results
 * @returns Formatted report string
 */
export function generateTestReport(test: ABTest, results: TestResults): string {
  const lines: string[] = [
    '═'.repeat(50),
    `A/B TEST REPORT: ${test.name}`,
    '═'.repeat(50),
    '',
    `Test ID:         ${test.id}`,
    `Platform:        ${test.platform}`,
    `Target Metric:   ${test.targetMetric}`,
    `Status:          ${test.status}`,
    `Confidence:      ${(test.confidenceLevel * 100).toFixed(0)}%`,
    '',
    '--- Variants ---',
  ];

  results.variantStats.forEach((stat) => {
    const variant = test.variants.find((v) => v.id === stat.variantId);
    const label = stat.isControl ? `${stat.variantId} (Control)` : stat.variantId;
    lines.push(
      `  ${label}: ${stat.metric.toFixed(2)}% ` +
        `(n=${stat.sampleSize.toLocaleString()}, ` +
        `CI: ${stat.confidenceInterval[0].toFixed(2)}-${stat.confidenceInterval[1].toFixed(2)}%)`
    );
  });

  lines.push('');
  lines.push('--- Results ---');
  lines.push(`Sample Size Met: ${results.sampleSizeReached ? 'Yes' : 'No'}`);
  lines.push(`Significant:     ${results.isSignificant ? 'Yes' : 'No'}`);
  lines.push(`P-Value:         ${results.pValue.toFixed(4)}`);

  if (results.winner) {
    lines.push(`Winner:          Variant ${results.winner}`);
    lines.push(`Improvement:     ${results.improvement.toFixed(1)}%`);
  }

  lines.push('');
  lines.push('--- Recommendation ---');
  lines.push(results.recommendation);
  lines.push('');

  return lines.join('\n');
}

/**
 * Generate unique test ID.
 */
function generateTestId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `test_${timestamp}_${random}`;
}

/**
 * Bayesian A/B test analysis (alternative to frequentist).
 *
 * @param metrics - Variant metrics
 * @param priorAlpha - Beta distribution alpha (default 1)
 * @param priorBeta - Beta distribution beta (default 1)
 * @returns Probability each variant is best
 */
export function bayesianAnalysis(
  metrics: VariantMetrics[],
  priorAlpha: number = 1,
  priorBeta: number = 1
): Record<string, number> {
  const samples = 10000;
  const winCounts: Record<string, number> = {};

  metrics.forEach((m) => {
    winCounts[m.variantId] = 0;
  });

  // Monte Carlo simulation
  for (let i = 0; i < samples; i++) {
    let maxRate = -1;
    let winner = '';

    metrics.forEach((m) => {
      // Sample from beta posterior
      const alpha = priorAlpha + m.engagements;
      const beta = priorBeta + (m.impressions - m.engagements);
      const rate = sampleBeta(alpha, beta);

      if (rate > maxRate) {
        maxRate = rate;
        winner = m.variantId;
      }
    });

    winCounts[winner]++;
  }

  // Convert to probabilities
  const probabilities: Record<string, number> = {};
  Object.keys(winCounts).forEach((id) => {
    probabilities[id] = winCounts[id] / samples;
  });

  return probabilities;
}

/**
 * Sample from beta distribution (using gamma sampling).
 */
function sampleBeta(alpha: number, beta: number): number {
  const x = sampleGamma(alpha);
  const y = sampleGamma(beta);
  return x / (x + y);
}

/**
 * Sample from gamma distribution (Marsaglia and Tsang's method).
 */
function sampleGamma(alpha: number): number {
  if (alpha < 1) {
    return sampleGamma(1 + alpha) * Math.pow(Math.random(), 1 / alpha);
  }

  const d = alpha - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);

  while (true) {
    let x: number, v: number;
    do {
      x = normalRandom();
      v = 1 + c * x;
    } while (v <= 0);

    v = v * v * v;
    const u = Math.random();

    if (u < 1 - 0.0331 * x * x * x * x) {
      return d * v;
    }

    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
      return d * v;
    }
  }
}

/**
 * Generate standard normal random variable (Box-Muller).
 */
function normalRandom(): number {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}
