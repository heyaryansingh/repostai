/**
 * Multi-platform engagement tracker with analytics and insights.
 *
 * Tracks engagement metrics across social media platforms, analyzes patterns,
 * and provides actionable insights for content optimization.
 */

export interface EngagementMetrics {
  postId: string;
  platform: Platform;
  timestamp: Date;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  clicks: number;
  saves?: number;
  retweets?: number;
  quotes?: number;
}

export interface EngagementRate {
  platform: Platform;
  rate: number;
  totalEngagements: number;
  totalReach: number;
  benchmark: number;
  performanceVsBenchmark: number;
}

export interface EngagementInsight {
  type: InsightType;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  recommendation: string;
  metrics: Record<string, number>;
}

export interface TimeSeriesEngagement {
  date: Date;
  engagements: number;
  reach: number;
  rate: number;
}

export enum Platform {
  TWITTER = 'twitter',
  LINKEDIN = 'linkedin',
  INSTAGRAM = 'instagram',
  FACEBOOK = 'facebook',
  TIKTOK = 'tiktok',
  YOUTUBE = 'youtube',
  THREADS = 'threads',
}

export enum InsightType {
  DECLINING_ENGAGEMENT = 'declining_engagement',
  VIRAL_CONTENT = 'viral_content',
  OPTIMAL_TIME = 'optimal_time',
  CONTENT_TYPE_PREFERENCE = 'content_type_preference',
  AUDIENCE_FATIGUE = 'audience_fatigue',
  GROWTH_OPPORTUNITY = 'growth_opportunity',
}

export class EngagementTracker {
  private metrics: Map<string, EngagementMetrics[]>;
  private benchmarks: Map<Platform, number>;

  constructor() {
    this.metrics = new Map();
    this.benchmarks = new Map([
      [Platform.TWITTER, 0.045], // 4.5% industry average
      [Platform.LINKEDIN, 0.039], // 3.9%
      [Platform.INSTAGRAM, 0.058], // 5.8%
      [Platform.FACEBOOK, 0.063], // 6.3%
      [Platform.TIKTOK, 0.179], // 17.9%
      [Platform.YOUTUBE, 0.042], // 4.2%
      [Platform.THREADS, 0.035], // 3.5% (estimated)
    ]);
  }

  /**
   * Track engagement for a post.
   */
  trackEngagement(metrics: EngagementMetrics): void {
    const key = `${metrics.platform}-${metrics.postId}`;

    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }

    this.metrics.get(key)!.push(metrics);
  }

  /**
   * Calculate engagement rate for a platform.
   */
  calculateEngagementRate(
    platform: Platform,
    startDate?: Date,
    endDate?: Date
  ): EngagementRate {
    const platformMetrics = this.getMetricsByPlatform(platform, startDate, endDate);

    let totalEngagements = 0;
    let totalReach = 0;

    platformMetrics.forEach(metric => {
      const engagements =
        metric.likes +
        metric.comments +
        metric.shares +
        (metric.saves || 0) +
        (metric.retweets || 0);

      totalEngagements += engagements;
      totalReach += metric.views || metric.likes * 10; // Estimate reach if not available
    });

    const rate = totalReach > 0 ? totalEngagements / totalReach : 0;
    const benchmark = this.benchmarks.get(platform) || 0.05;
    const performanceVsBenchmark = ((rate - benchmark) / benchmark) * 100;

    return {
      platform,
      rate,
      totalEngagements,
      totalReach,
      benchmark,
      performanceVsBenchmark,
    };
  }

  /**
   * Get time series engagement data.
   */
  getTimeSeriesEngagement(
    platform: Platform,
    days: number = 30
  ): TimeSeriesEngagement[] {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const metrics = this.getMetricsByPlatform(platform, startDate);

    // Group by date
    const grouped = new Map<string, EngagementMetrics[]>();

    metrics.forEach(metric => {
      const dateKey = metric.timestamp.toISOString().split('T')[0];
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(metric);
    });

    // Calculate daily aggregates
    const timeSeries: TimeSeriesEngagement[] = [];

    grouped.forEach((dayMetrics, dateKey) => {
      let engagements = 0;
      let reach = 0;

      dayMetrics.forEach(metric => {
        engagements +=
          metric.likes +
          metric.comments +
          metric.shares +
          (metric.saves || 0);
        reach += metric.views || metric.likes * 10;
      });

      const rate = reach > 0 ? engagements / reach : 0;

      timeSeries.push({
        date: new Date(dateKey),
        engagements,
        reach,
        rate,
      });
    });

    return timeSeries.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Analyze engagement patterns and generate insights.
   */
  analyzeEngagement(platform: Platform): EngagementInsight[] {
    const insights: EngagementInsight[] = [];
    const timeSeries = this.getTimeSeriesEngagement(platform, 30);

    if (timeSeries.length < 7) {
      return insights;
    }

    // Check for declining engagement
    const recentWeek = timeSeries.slice(-7);
    const previousWeek = timeSeries.slice(-14, -7);

    const recentAvg = this.average(recentWeek.map(t => t.rate));
    const previousAvg = this.average(previousWeek.map(t => t.rate));

    if (recentAvg < previousAvg * 0.8) {
      insights.push({
        type: InsightType.DECLINING_ENGAGEMENT,
        severity: 'warning',
        message: 'Engagement rate has declined 20% in the past week',
        recommendation: 'Try varying content format, posting times, or topic focus',
        metrics: {
          recentRate: recentAvg,
          previousRate: previousAvg,
          decline: ((previousAvg - recentAvg) / previousAvg) * 100,
        },
      });
    }

    // Detect viral content
    const avgEngagement = this.average(timeSeries.map(t => t.engagements));
    const stdDev = this.standardDeviation(timeSeries.map(t => t.engagements));
    const viralThreshold = avgEngagement + 2 * stdDev;

    const viralDays = timeSeries.filter(t => t.engagements > viralThreshold);

    if (viralDays.length > 0) {
      insights.push({
        type: InsightType.VIRAL_CONTENT,
        severity: 'info',
        message: `${viralDays.length} posts achieved viral performance`,
        recommendation: 'Analyze these posts to identify successful patterns',
        metrics: {
          viralPosts: viralDays.length,
          avgViralEngagement: this.average(viralDays.map(d => d.engagements)),
          threshold: viralThreshold,
        },
      });
    }

    // Optimal posting time analysis
    const optimalTime = this.findOptimalPostingTime(platform);
    if (optimalTime) {
      insights.push({
        type: InsightType.OPTIMAL_TIME,
        severity: 'info',
        message: `Best engagement at ${optimalTime.hour}:00 on ${optimalTime.day}`,
        recommendation: 'Schedule more content during this time',
        metrics: {
          hour: optimalTime.hour,
          dayOfWeek: optimalTime.dayOfWeek,
          avgEngagement: optimalTime.avgEngagement,
        },
      });
    }

    // Check for audience fatigue
    const postFrequency = this.calculatePostFrequency(platform, 7);
    const engagementRate = this.calculateEngagementRate(platform);

    if (postFrequency > 5 && engagementRate.rate < engagementRate.benchmark * 0.7) {
      insights.push({
        type: InsightType.AUDIENCE_FATIGUE,
        severity: 'critical',
        message: 'High posting frequency with low engagement suggests audience fatigue',
        recommendation: 'Reduce posting frequency and focus on quality over quantity',
        metrics: {
          postsPerWeek: postFrequency,
          engagementRate: engagementRate.rate,
          benchmark: engagementRate.benchmark,
        },
      });
    }

    return insights;
  }

  /**
   * Find optimal posting time for a platform.
   */
  private findOptimalPostingTime(platform: Platform): {
    hour: number;
    day: string;
    dayOfWeek: number;
    avgEngagement: number;
  } | null {
    const metrics = this.getMetricsByPlatform(platform);

    // Group by hour and day of week
    const grouped = new Map<string, number[]>();

    metrics.forEach(metric => {
      const hour = metric.timestamp.getHours();
      const dayOfWeek = metric.timestamp.getDay();
      const key = `${dayOfWeek}-${hour}`;

      const engagements =
        metric.likes + metric.comments + metric.shares + (metric.saves || 0);

      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(engagements);
    });

    // Find best time
    let bestKey: string | null = null;
    let bestAvg = 0;

    grouped.forEach((engagements, key) => {
      const avg = this.average(engagements);
      if (avg > bestAvg) {
        bestAvg = avg;
        bestKey = key;
      }
    });

    if (!bestKey) return null;

    const [dayOfWeek, hour] = bestKey.split('-').map(Number);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return {
      hour,
      day: days[dayOfWeek],
      dayOfWeek,
      avgEngagement: bestAvg,
    };
  }

  /**
   * Calculate posting frequency.
   */
  private calculatePostFrequency(platform: Platform, days: number): number {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const metrics = this.getMetricsByPlatform(platform, startDate);

    // Count unique posts
    const uniquePosts = new Set(metrics.map(m => m.postId));

    return uniquePosts.size;
  }

  /**
   * Compare performance across platforms.
   */
  compareplatforms(startDate?: Date, endDate?: Date): {
    platform: Platform;
    rate: EngagementRate;
  }[] {
    const platforms = Object.values(Platform);
    const results = platforms.map(platform => ({
      platform,
      rate: this.calculateEngagementRate(platform, startDate, endDate),
    }));

    return results.sort((a, b) => b.rate.rate - a.rate.rate);
  }

  /**
   * Generate engagement report.
   */
  generateReport(platform: Platform): {
    summary: EngagementRate;
    timeSeries: TimeSeriesEngagement[];
    insights: EngagementInsight[];
    topPosts: EngagementMetrics[];
  } {
    const summary = this.calculateEngagementRate(platform);
    const timeSeries = this.getTimeSeriesEngagement(platform, 30);
    const insights = this.analyzeEngagement(platform);

    // Get top performing posts
    const metrics = this.getMetricsByPlatform(platform);
    const topPosts = metrics
      .sort((a, b) => {
        const aScore = a.likes + a.comments * 2 + a.shares * 3;
        const bScore = b.likes + b.comments * 2 + b.shares * 3;
        return bScore - aScore;
      })
      .slice(0, 10);

    return {
      summary,
      timeSeries,
      insights,
      topPosts,
    };
  }

  /**
   * Get metrics by platform and date range.
   */
  private getMetricsByPlatform(
    platform: Platform,
    startDate?: Date,
    endDate?: Date
  ): EngagementMetrics[] {
    const allMetrics: EngagementMetrics[] = [];

    this.metrics.forEach((metrics, key) => {
      if (key.startsWith(platform)) {
        allMetrics.push(...metrics);
      }
    });

    // Filter by date range
    return allMetrics.filter(metric => {
      if (startDate && metric.timestamp < startDate) return false;
      if (endDate && metric.timestamp > endDate) return false;
      return true;
    });
  }

  /**
   * Calculate average.
   */
  private average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  }

  /**
   * Calculate standard deviation.
   */
  private standardDeviation(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const avg = this.average(numbers);
    const squaredDiffs = numbers.map(n => Math.pow(n - avg, 2));
    const variance = this.average(squaredDiffs);
    return Math.sqrt(variance);
  }

  /**
   * Export engagement data for external analysis.
   */
  exportData(platform?: Platform): string {
    const metrics = platform
      ? this.getMetricsByPlatform(platform)
      : Array.from(this.metrics.values()).flat();

    return JSON.stringify(metrics, null, 2);
  }

  /**
   * Get engagement velocity (rate of change).
   */
  getEngagementVelocity(platform: Platform): number {
    const timeSeries = this.getTimeSeriesEngagement(platform, 7);

    if (timeSeries.length < 2) return 0;

    const recent = timeSeries.slice(-3);
    const previous = timeSeries.slice(0, 3);

    const recentAvg = this.average(recent.map(t => t.engagements));
    const previousAvg = this.average(previous.map(t => t.engagements));

    if (previousAvg === 0) return 0;

    return ((recentAvg - previousAvg) / previousAvg) * 100;
  }
}

/**
 * Calculate engagement score for ranking content.
 */
export function calculateEngagementScore(metrics: EngagementMetrics): number {
  const weights = {
    like: 1,
    comment: 3,
    share: 5,
    save: 4,
    click: 0.5,
  };

  return (
    metrics.likes * weights.like +
    metrics.comments * weights.comment +
    metrics.shares * weights.share +
    (metrics.saves || 0) * weights.save +
    metrics.clicks * weights.click
  );
}
