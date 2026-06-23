/**
 * Cross-Platform Analytics Aggregator
 *
 * Combine analytics from multiple social platforms into unified insights
 */

export interface PlatformMetrics {
  platform: string;
  timeRange: { start: Date; end: Date };
  impressions: number;
  engagements: number;
  clicks: number;
  shares: number;
  comments: number;
  followers: number;
  followerGrowth: number;
}

export interface UnifiedAnalytics {
  totalImpressions: number;
  totalEngagements: number;
  totalClicks: number;
  averageEngagementRate: number;
  topPlatform: string;
  platformBreakdown: Record<string, number>;
  growthRate: number;
}

export interface ContentPerformance {
  contentId: string;
  platform: string;
  publishedAt: Date;
  metrics: PlatformMetrics;
  score: number; // 0-100
}

/**
 * Aggregate metrics from multiple platforms
 */
export function aggregatePlatformMetrics(
  metrics: PlatformMetrics[]
): UnifiedAnalytics {
  let totalImpressions = 0;
  let totalEngagements = 0;
  let totalClicks = 0;
  let totalFollowers = 0;
  let totalFollowerGrowth = 0;

  const platformBreakdown: Record<string, number> = {};

  for (const metric of metrics) {
    totalImpressions += metric.impressions;
    totalEngagements += metric.engagements;
    totalClicks += metric.clicks;
    totalFollowers += metric.followers;
    totalFollowerGrowth += metric.followerGrowth;

    platformBreakdown[metric.platform] =
      (platformBreakdown[metric.platform] || 0) + metric.engagements;
  }

  const averageEngagementRate =
    totalImpressions > 0 ? (totalEngagements / totalImpressions) * 100 : 0;

  const topPlatform =
    Object.entries(platformBreakdown).sort(([, a], [, b]) => b - a)[0]?.[0] ||
    "";

  const growthRate =
    totalFollowers > 0
      ? (totalFollowerGrowth / (totalFollowers - totalFollowerGrowth)) * 100
      : 0;

  return {
    totalImpressions,
    totalEngagements,
    totalClicks,
    averageEngagementRate,
    topPlatform,
    platformBreakdown,
    growthRate,
  };
}

/**
 * Calculate engagement rate for a platform
 */
export function calculateEngagementRate(
  engagements: number,
  impressions: number
): number {
  if (impressions === 0) return 0;
  return (engagements / impressions) * 100;
}

/**
 * Rank content by performance across platforms
 */
export function rankContentByPerformance(
  content: ContentPerformance[]
): ContentPerformance[] {
  return content.sort((a, b) => {
    const scoreA =
      calculateEngagementRate(
        a.metrics.engagements,
        a.metrics.impressions
      ) * 100;
    const scoreB =
      calculateEngagementRate(
        b.metrics.engagements,
        b.metrics.impressions
      ) * 100;
    return scoreB - scoreA;
  });
}

/**
 * Identify best performing platform for a content type
 */
export function identifyBestPlatform(
  metrics: PlatformMetrics[]
): { platform: string; engagementRate: number } {
  let bestPlatform = "";
  let bestRate = 0;

  for (const metric of metrics) {
    const rate = calculateEngagementRate(
      metric.engagements,
      metric.impressions
    );

    if (rate > bestRate) {
      bestRate = rate;
      bestPlatform = metric.platform;
    }
  }

  return { platform: bestPlatform, engagementRate: bestRate };
}

/**
 * Calculate cross-platform reach
 */
export function calculateCrossPlatformReach(
  metrics: PlatformMetrics[]
): {
  totalReach: number;
  uniqueReach: number;
  overlapEstimate: number;
} {
  const totalReach = metrics.reduce((sum, m) => sum + m.impressions, 0);

  // Estimate unique reach (accounting for overlap)
  // Simplified model: assume 20% overlap between platforms
  const overlapFactor = 0.2;
  const uniqueReach = totalReach * (1 - overlapFactor * (metrics.length - 1));

  const overlapEstimate = totalReach - uniqueReach;

  return {
    totalReach,
    uniqueReach: Math.max(uniqueReach, 0),
    overlapEstimate: Math.max(overlapEstimate, 0),
  };
}

/**
 * Generate platform-specific recommendations
 */
export function generatePlatformRecommendations(
  metrics: PlatformMetrics[]
): Record<string, string[]> {
  const recommendations: Record<string, string[]> = {};

  for (const metric of metrics) {
    const recs: string[] = [];
    const engagementRate = calculateEngagementRate(
      metric.engagements,
      metric.impressions
    );

    if (engagementRate < 1) {
      recs.push(
        "Low engagement rate. Consider posting at different times or using more engaging content formats."
      );
    }

    if (metric.followerGrowth < 0) {
      recs.push(
        "Negative follower growth. Review content quality and posting frequency."
      );
    }

    if (metric.shares < metric.engagements * 0.1) {
      recs.push(
        "Low share rate. Create more shareable content with strong hooks or CTAs."
      );
    }

    if (metric.comments < metric.engagements * 0.05) {
      recs.push(
        "Low comment rate. Ask questions or create content that encourages discussion."
      );
    }

    recommendations[metric.platform] = recs;
  }

  return recommendations;
}

/**
 * Calculate ROI across platforms
 */
export function calculateCrossPlatformROI(
  metrics: PlatformMetrics[],
  costs: Record<string, number>
): Record<
  string,
  { cost: number; engagements: number; costPerEngagement: number; roi: number }
> {
  const roi: Record<
    string,
    { cost: number; engagements: number; costPerEngagement: number; roi: number }
  > = {};

  for (const metric of metrics) {
    const cost = costs[metric.platform] || 0;
    const engagements = metric.engagements;
    const costPerEngagement = engagements > 0 ? cost / engagements : 0;

    // Simple ROI calculation (engagements value - cost) / cost
    // Assuming each engagement is worth $0.10
    const engagementValue = engagements * 0.1;
    const roiValue = cost > 0 ? ((engagementValue - cost) / cost) * 100 : 0;

    roi[metric.platform] = {
      cost,
      engagements,
      costPerEngagement,
      roi: roiValue,
    };
  }

  return roi;
}

/**
 * Compare performance across time periods
 */
export function comparePeriods(
  current: PlatformMetrics[],
  previous: PlatformMetrics[]
): Record<string, { metric: string; change: number; percentChange: number }[]> {
  const comparison: Record<
    string,
    { metric: string; change: number; percentChange: number }[]
  > = {};

  for (const curr of current) {
    const prev = previous.find((p) => p.platform === curr.platform);
    if (!prev) continue;

    const changes = [
      {
        metric: "impressions",
        change: curr.impressions - prev.impressions,
        percentChange:
          prev.impressions > 0
            ? ((curr.impressions - prev.impressions) / prev.impressions) * 100
            : 0,
      },
      {
        metric: "engagements",
        change: curr.engagements - prev.engagements,
        percentChange:
          prev.engagements > 0
            ? ((curr.engagements - prev.engagements) / prev.engagements) * 100
            : 0,
      },
      {
        metric: "followers",
        change: curr.followers - prev.followers,
        percentChange:
          prev.followers > 0
            ? ((curr.followers - prev.followers) / prev.followers) * 100
            : 0,
      },
    ];

    comparison[curr.platform] = changes;
  }

  return comparison;
}

/**
 * Export unified analytics report
 */
export function exportAnalyticsReport(
  analytics: UnifiedAnalytics,
  metrics: PlatformMetrics[]
): string {
  const lines: string[] = [];

  lines.push("=== Cross-Platform Analytics Report ===\n");
  lines.push(`Total Impressions: ${analytics.totalImpressions.toLocaleString()}`);
  lines.push(`Total Engagements: ${analytics.totalEngagements.toLocaleString()}`);
  lines.push(`Total Clicks: ${analytics.totalClicks.toLocaleString()}`);
  lines.push(
    `Average Engagement Rate: ${analytics.averageEngagementRate.toFixed(2)}%`
  );
  lines.push(`Top Platform: ${analytics.topPlatform}`);
  lines.push(`Growth Rate: ${analytics.growthRate.toFixed(2)}%\n`);

  lines.push("=== Platform Breakdown ===");
  for (const [platform, engagements] of Object.entries(
    analytics.platformBreakdown
  )) {
    const percentage =
      (engagements / analytics.totalEngagements) * 100 || 0;
    lines.push(
      `${platform}: ${engagements.toLocaleString()} (${percentage.toFixed(1)}%)`
    );
  }

  lines.push("\n=== Individual Platform Metrics ===");
  for (const metric of metrics) {
    const rate = calculateEngagementRate(
      metric.engagements,
      metric.impressions
    );
    lines.push(`\n${metric.platform}:`);
    lines.push(`  Impressions: ${metric.impressions.toLocaleString()}`);
    lines.push(`  Engagements: ${metric.engagements.toLocaleString()}`);
    lines.push(`  Engagement Rate: ${rate.toFixed(2)}%`);
    lines.push(`  Followers: ${metric.followers.toLocaleString()}`);
    lines.push(`  Follower Growth: ${metric.followerGrowth >= 0 ? '+' : ''}${metric.followerGrowth}`);
  }

  return lines.join("\n");
}
