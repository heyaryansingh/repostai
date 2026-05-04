/**
 * @fileoverview Content Performance Tracking and Benchmarking
 * @module lib/content-performance
 *
 * Provides comprehensive performance tracking, benchmarking, and comparative
 * analysis for repurposed content across platforms.
 *
 * Features:
 * - Performance metrics calculation (engagement rate, virality, reach)
 * - Cross-platform benchmarking and comparison
 * - Time-series performance analysis
 * - A/B test result tracking
 * - ROI and conversion tracking
 *
 * @example
 * ```typescript
 * import { calculatePerformance, benchmarkContent, analyzeTimeSeries } from './content-performance';
 *
 * const metrics = calculatePerformance({
 *   impressions: 10000,
 *   likes: 500,
 *   shares: 50,
 *   comments: 30,
 *   clicks: 200,
 * });
 * console.log(`Engagement rate: ${metrics.engagementRate}%`);
 * ```
 */

export interface PerformanceMetrics {
  /** Total impressions/views */
  impressions: number;
  /** Total likes/reactions */
  likes: number;
  /** Total shares/retweets */
  shares: number;
  /** Total comments/replies */
  comments: number;
  /** Total clicks (link clicks) */
  clicks: number;
  /** Total saves/bookmarks */
  saves?: number;
  /** Video-specific: watch time in seconds */
  watchTimeSeconds?: number;
  /** Video-specific: completion rate (0-1) */
  completionRate?: number;
}

export interface CalculatedMetrics {
  /** Engagement rate: (likes + shares + comments) / impressions * 100 */
  engagementRate: number;
  /** Click-through rate: clicks / impressions * 100 */
  clickThroughRate: number;
  /** Share rate: shares / impressions * 100 */
  shareRate: number;
  /** Comment rate: comments / impressions * 100 */
  commentRate: number;
  /** Virality score: (shares * 3 + comments * 2 + likes) / impressions * 100 */
  viralityScore: number;
  /** Total engagement count */
  totalEngagement: number;
  /** Engagement quality score (weighted by action type) */
  qualityScore: number;
}

export interface BenchmarkData {
  platform: string;
  contentType: string;
  avgEngagementRate: number;
  avgCTR: number;
  avgShareRate: number;
  avgViralityScore: number;
  percentile25: number;
  percentile50: number;
  percentile75: number;
  percentile90: number;
}

export interface PerformanceComparison {
  metrics: CalculatedMetrics;
  benchmark: BenchmarkData;
  performance: {
    /** Comparison to median: -100 to +100 */
    vsMedian: number;
    /** Percentile rank: 0-100 */
    percentileRank: number;
    /** Performance category */
    category: "poor" | "below-average" | "average" | "above-average" | "excellent";
  };
  recommendations: string[];
}

export interface TimeSeriesPoint {
  timestamp: Date;
  metrics: PerformanceMetrics;
  calculated: CalculatedMetrics;
}

export interface TimeSeriesAnalysis {
  dataPoints: TimeSeriesPoint[];
  trends: {
    impressionsTrend: "increasing" | "decreasing" | "stable";
    engagementTrend: "increasing" | "decreasing" | "stable";
    growthRate: number; // % change per period
  };
  peakPerformance: {
    timestamp: Date;
    metric: keyof CalculatedMetrics;
    value: number;
  };
  averages: CalculatedMetrics;
}

/**
 * Calculate comprehensive performance metrics from raw data.
 */
export function calculatePerformance(raw: PerformanceMetrics): CalculatedMetrics {
  const { impressions, likes, shares, comments, clicks, saves = 0 } = raw;

  // Avoid division by zero
  const safeImpressions = Math.max(impressions, 1);

  const totalEngagement = likes + shares + comments + saves;
  const engagementRate = (totalEngagement / safeImpressions) * 100;
  const clickThroughRate = (clicks / safeImpressions) * 100;
  const shareRate = (shares / safeImpressions) * 100;
  const commentRate = (comments / safeImpressions) * 100;

  // Virality score: weighted by action importance
  // Shares are 3x, comments 2x, likes 1x
  const viralityScore = ((shares * 3 + comments * 2 + likes) / safeImpressions) * 100;

  // Quality score: weighs deeper engagement higher
  // Shares: 10 pts, comments: 5 pts, saves: 7 pts, likes: 1 pt, clicks: 3 pts
  const qualityScore =
    ((shares * 10 + comments * 5 + saves * 7 + likes * 1 + clicks * 3) / safeImpressions) * 10;

  return {
    engagementRate,
    clickThroughRate,
    shareRate,
    commentRate,
    viralityScore,
    totalEngagement,
    qualityScore,
  };
}

/**
 * Platform-specific benchmark data (industry averages).
 */
const PLATFORM_BENCHMARKS: Record<string, BenchmarkData> = {
  linkedin: {
    platform: "linkedin",
    contentType: "post",
    avgEngagementRate: 2.5,
    avgCTR: 0.4,
    avgShareRate: 0.3,
    avgViralityScore: 3.2,
    percentile25: 1.0,
    percentile50: 2.5,
    percentile75: 4.5,
    percentile90: 8.0,
  },
  twitter: {
    platform: "twitter",
    contentType: "tweet",
    avgEngagementRate: 1.8,
    avgCTR: 0.5,
    avgShareRate: 0.4,
    avgViralityScore: 2.8,
    percentile25: 0.8,
    percentile50: 1.8,
    percentile75: 3.5,
    percentile90: 6.5,
  },
  instagram: {
    platform: "instagram",
    contentType: "post",
    avgEngagementRate: 3.5,
    avgCTR: 0.3,
    avgShareRate: 0.2,
    avgViralityScore: 4.0,
    percentile25: 1.5,
    percentile50: 3.5,
    percentile75: 6.0,
    percentile90: 10.0,
  },
  facebook: {
    platform: "facebook",
    contentType: "post",
    avgEngagementRate: 1.2,
    avgCTR: 0.6,
    avgShareRate: 0.5,
    avgViralityScore: 2.0,
    percentile25: 0.5,
    percentile50: 1.2,
    percentile75: 2.5,
    percentile90: 5.0,
  },
};

/**
 * Benchmark content performance against platform averages.
 */
export function benchmarkContent(
  metrics: CalculatedMetrics,
  platform: string
): PerformanceComparison {
  const benchmark = PLATFORM_BENCHMARKS[platform.toLowerCase()] || PLATFORM_BENCHMARKS.linkedin;

  // Calculate performance vs median
  const vsMedian = ((metrics.engagementRate - benchmark.percentile50) / benchmark.percentile50) * 100;

  // Estimate percentile rank
  let percentileRank: number;
  if (metrics.engagementRate <= benchmark.percentile25) {
    percentileRank = (metrics.engagementRate / benchmark.percentile25) * 25;
  } else if (metrics.engagementRate <= benchmark.percentile50) {
    percentileRank = 25 + ((metrics.engagementRate - benchmark.percentile25) / (benchmark.percentile50 - benchmark.percentile25)) * 25;
  } else if (metrics.engagementRate <= benchmark.percentile75) {
    percentileRank = 50 + ((metrics.engagementRate - benchmark.percentile50) / (benchmark.percentile75 - benchmark.percentile50)) * 25;
  } else if (metrics.engagementRate <= benchmark.percentile90) {
    percentileRank = 75 + ((metrics.engagementRate - benchmark.percentile75) / (benchmark.percentile90 - benchmark.percentile75)) * 15;
  } else {
    percentileRank = 90 + Math.min((metrics.engagementRate - benchmark.percentile90) / benchmark.percentile90, 1.0) * 10;
  }

  // Categorize performance
  let category: PerformanceComparison["performance"]["category"];
  if (percentileRank >= 75) {
    category = "excellent";
  } else if (percentileRank >= 60) {
    category = "above-average";
  } else if (percentileRank >= 40) {
    category = "average";
  } else if (percentileRank >= 25) {
    category = "below-average";
  } else {
    category = "poor";
  }

  // Generate recommendations
  const recommendations: string[] = [];

  if (metrics.shareRate < benchmark.avgShareRate * 0.8) {
    recommendations.push("Consider adding shareable quotes or statistics to increase share rate");
  }

  if (metrics.commentRate < benchmark.avgShareRate * 0.7) {
    recommendations.push("Add a call-to-action or question to encourage comments");
  }

  if (metrics.clickThroughRate < benchmark.avgCTR * 0.8) {
    recommendations.push("Optimize link placement and add compelling CTAs to improve click-through rate");
  }

  if (metrics.viralityScore < benchmark.avgViralityScore * 0.7) {
    recommendations.push("Focus on emotional appeal or controversial topics to increase virality");
  }

  if (category === "excellent") {
    recommendations.push("Excellent performance! Analyze what made this content successful and replicate those elements");
  }

  return {
    metrics,
    benchmark,
    performance: {
      vsMedian,
      percentileRank,
      category,
    },
    recommendations,
  };
}

/**
 * Analyze time-series performance data to identify trends.
 */
export function analyzeTimeSeries(data: TimeSeriesPoint[]): TimeSeriesAnalysis {
  if (data.length === 0) {
    throw new Error("Cannot analyze empty time series");
  }

  // Sort by timestamp
  const sorted = [...data].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  // Calculate averages
  const avgEngagementRate =
    sorted.reduce((sum, p) => sum + p.calculated.engagementRate, 0) / sorted.length;
  const avgCTR = sorted.reduce((sum, p) => sum + p.calculated.clickThroughRate, 0) / sorted.length;
  const avgShareRate = sorted.reduce((sum, p) => sum + p.calculated.shareRate, 0) / sorted.length;
  const avgCommentRate =
    sorted.reduce((sum, p) => sum + p.calculated.commentRate, 0) / sorted.length;
  const avgViralityScore =
    sorted.reduce((sum, p) => sum + p.calculated.viralityScore, 0) / sorted.length;
  const avgTotalEngagement =
    sorted.reduce((sum, p) => sum + p.calculated.totalEngagement, 0) / sorted.length;
  const avgQualityScore =
    sorted.reduce((sum, p) => sum + p.calculated.qualityScore, 0) / sorted.length;

  const averages: CalculatedMetrics = {
    engagementRate: avgEngagementRate,
    clickThroughRate: avgCTR,
    shareRate: avgShareRate,
    commentRate: avgCommentRate,
    viralityScore: avgViralityScore,
    totalEngagement: avgTotalEngagement,
    qualityScore: avgQualityScore,
  };

  // Detect trends (simple linear regression on last 10 points)
  const recentPoints = sorted.slice(-Math.min(10, sorted.length));
  const impressionsTrend = calculateTrend(recentPoints.map((p) => p.metrics.impressions));
  const engagementTrend = calculateTrend(recentPoints.map((p) => p.calculated.engagementRate));

  // Calculate growth rate (first to last point)
  const firstImpressions = sorted[0].metrics.impressions;
  const lastImpressions = sorted[sorted.length - 1].metrics.impressions;
  const growthRate = ((lastImpressions - firstImpressions) / Math.max(firstImpressions, 1)) * 100;

  // Find peak performance
  let peakPoint = sorted[0];
  let peakMetric: keyof CalculatedMetrics = "engagementRate";
  let peakValue = peakPoint.calculated.engagementRate;

  for (const point of sorted) {
    if (point.calculated.viralityScore > peakValue) {
      peakPoint = point;
      peakMetric = "viralityScore";
      peakValue = point.calculated.viralityScore;
    }
  }

  return {
    dataPoints: sorted,
    trends: {
      impressionsTrend,
      engagementTrend,
      growthRate,
    },
    peakPerformance: {
      timestamp: peakPoint.timestamp,
      metric: peakMetric,
      value: peakValue,
    },
    averages,
  };
}

/**
 * Helper: Calculate trend direction from numeric series.
 */
function calculateTrend(values: number[]): "increasing" | "decreasing" | "stable" {
  if (values.length < 2) return "stable";

  // Simple linear regression slope
  const n = values.length;
  const sumX = values.reduce((sum, _, i) => sum + i, 0);
  const sumY = values.reduce((sum, v) => sum + v, 0);
  const sumXY = values.reduce((sum, v, i) => sum + i * v, 0);
  const sumXX = values.reduce((sum, _, i) => sum + i * i, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

  const threshold = 0.1; // 10% change threshold
  if (slope > threshold) return "increasing";
  if (slope < -threshold) return "decreasing";
  return "stable";
}

/**
 * Compare two content pieces to identify what drove performance difference.
 */
export function compareContent(
  contentA: { metrics: PerformanceMetrics; metadata: Record<string, any> },
  contentB: { metrics: PerformanceMetrics; metadata: Record<string, any> }
): {
  winner: "A" | "B" | "tie";
  metricsA: CalculatedMetrics;
  metricsB: CalculatedMetrics;
  keyDifferences: Array<{ metric: string; diff: number; winner: "A" | "B" }>;
  insights: string[];
} {
  const metricsA = calculatePerformance(contentA.metrics);
  const metricsB = calculatePerformance(contentB.metrics);

  // Determine winner based on quality score
  let winner: "A" | "B" | "tie";
  const scoreDiff = metricsA.qualityScore - metricsB.qualityScore;
  if (Math.abs(scoreDiff) < 5) {
    winner = "tie";
  } else {
    winner = scoreDiff > 0 ? "A" : "B";
  }

  // Identify key differences
  const keyDifferences: Array<{ metric: string; diff: number; winner: "A" | "B" }> = [];

  const compareMetric = (metric: keyof CalculatedMetrics, name: string) => {
    const diff = ((metricsA[metric] - metricsB[metric]) / Math.max(metricsB[metric], 0.01)) * 100;
    if (Math.abs(diff) > 10) {
      keyDifferences.push({
        metric: name,
        diff,
        winner: diff > 0 ? "A" : "B",
      });
    }
  };

  compareMetric("engagementRate", "Engagement Rate");
  compareMetric("clickThroughRate", "Click-Through Rate");
  compareMetric("shareRate", "Share Rate");
  compareMetric("viralityScore", "Virality Score");

  // Generate insights
  const insights: string[] = [];

  keyDifferences.forEach(({ metric, diff, winner: metricWinner }) => {
    const betterContent = metricWinner === "A" ? contentA : contentB;
    insights.push(
      `Content ${metricWinner} had ${Math.abs(diff).toFixed(1)}% better ${metric}. ` +
        `Consider replicating its ${JSON.stringify(betterContent.metadata).substring(0, 50)}...`
    );
  });

  return {
    winner,
    metricsA,
    metricsB,
    keyDifferences,
    insights,
  };
}
