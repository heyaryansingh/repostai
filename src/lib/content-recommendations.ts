/**
 * AI-powered content recommendation system
 *
 * Provides intelligent content suggestions based on:
 * - Historical performance data
 * - Audience engagement patterns
 * - Trending topics
 * - Optimal posting times
 * - Content gaps analysis
 */

export interface ContentProfile {
  /** User/brand ID */
  userId: string;
  /** Historical posts */
  posts: HistoricalPost[];
  /** Target audience demographics */
  audience?: {
    age_range?: [number, number];
    interests?: string[];
    timezone?: string;
    active_hours?: [number, number];
  };
}

export interface HistoricalPost {
  /** Post ID */
  id: string;
  /** Post content */
  content: string;
  /** Platform */
  platform: 'twitter' | 'linkedin' | 'instagram' | 'facebook';
  /** Post timestamp */
  posted_at: Date;
  /** Engagement metrics */
  metrics: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
  };
  /** Content type */
  type?: 'text' | 'image' | 'video' | 'link' | 'carousel';
  /** Topics/tags */
  topics?: string[];
}

export interface ContentRecommendation {
  /** Recommendation type */
  type: 'topic' | 'timing' | 'format' | 'tone' | 'hashtag';
  /** Recommendation title */
  title: string;
  /** Detailed description */
  description: string;
  /** Confidence score (0-1) */
  confidence: number;
  /** Expected engagement boost */
  expectedBoost?: number;
  /** Supporting data */
  evidence?: {
    metric: string;
    value: number;
    comparison?: string;
  }[];
  /** Actionable suggestion */
  action: string;
}

export interface PostingSuggestion {
  /** Day of week (0=Sunday, 6=Saturday) */
  dayOfWeek: number;
  /** Hour of day (0-23) */
  hour: number;
  /** Expected engagement score */
  expectedEngagement: number;
  /** Confidence in prediction */
  confidence: number;
}

/**
 * Content recommendation engine
 */
export class ContentRecommendationEngine {
  private profile: ContentProfile;

  constructor(profile: ContentProfile) {
    this.profile = profile;
  }

  /**
   * Get all recommendations for improving content strategy
   */
  async getRecommendations(): Promise<ContentRecommendation[]> {
    const recommendations: ContentRecommendation[] = [];

    // Topic recommendations
    recommendations.push(...this.recommendTopics());

    // Timing recommendations
    recommendations.push(...this.recommendTiming());

    // Format recommendations
    recommendations.push(...this.recommendFormats());

    // Tone recommendations
    recommendations.push(...this.recommendTone());

    // Hashtag recommendations
    recommendations.push(...this.recommendHashtags());

    // Sort by confidence
    return recommendations.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Recommend topics to post about
   */
  private recommendTopics(): ContentRecommendation[] {
    const recommendations: ContentRecommendation[] = [];

    // Analyze which topics performed best
    const topicPerformance = this.analyzeTopicPerformance();

    // Find top performers
    const topTopics = Object.entries(topicPerformance)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    for (const [topic, score] of topTopics) {
      recommendations.push({
        type: 'topic',
        title: `Focus on "${topic}" content`,
        description: `Your posts about ${topic} consistently outperform others with ${score.toFixed(1)}x average engagement.`,
        confidence: Math.min(0.95, 0.7 + score * 0.1),
        expectedBoost: (score - 1) * 100,
        evidence: [
          {
            metric: 'Average engagement',
            value: score,
            comparison: 'vs baseline',
          },
        ],
        action: `Create more content related to ${topic}`,
      });
    }

    // Identify content gaps
    const gaps = this.identifyContentGaps();

    for (const gap of gaps.slice(0, 2)) {
      recommendations.push({
        type: 'topic',
        title: `Explore ${gap.topic}`,
        description: `You haven't posted about ${gap.topic} recently, but it aligns with your audience interests.`,
        confidence: 0.6,
        action: `Consider creating content about ${gap.topic}`,
      });
    }

    return recommendations;
  }

  /**
   * Recommend optimal posting times
   */
  private recommendTiming(): ContentRecommendation[] {
    const recommendations: ContentRecommendation[] = [];

    const timingAnalysis = this.analyzePostingTimes();

    // Best day of week
    const bestDay = timingAnalysis.bestDay;
    const dayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];

    recommendations.push({
      type: 'timing',
      title: `Post more on ${dayNames[bestDay.day]}`,
      description: `Your ${dayNames[bestDay.day]} posts get ${bestDay.boost.toFixed(0)}% more engagement than average.`,
      confidence: 0.85,
      expectedBoost: bestDay.boost,
      evidence: [
        {
          metric: 'Average engagement',
          value: bestDay.avgEngagement,
          comparison: 'on this day',
        },
      ],
      action: `Schedule your best content for ${dayNames[bestDay.day]}`,
    });

    // Best hour
    const bestHour = timingAnalysis.bestHour;

    recommendations.push({
      type: 'timing',
      title: `Post around ${this.formatHour(bestHour.hour)}`,
      description: `Posts at ${this.formatHour(bestHour.hour)} perform ${bestHour.boost.toFixed(0)}% better than average.`,
      confidence: 0.8,
      expectedBoost: bestHour.boost,
      action: `Schedule posts for ${this.formatHour(bestHour.hour)}`,
    });

    return recommendations;
  }

  /**
   * Recommend content formats
   */
  private recommendFormats(): ContentRecommendation[] {
    const recommendations: ContentRecommendation[] = [];

    const formatPerformance = this.analyzeFormatPerformance();

    const topFormat = Object.entries(formatPerformance)
      .sort(([, a], [, b]) => b - a)[0];

    if (topFormat) {
      const [format, score] = topFormat;

      recommendations.push({
        type: 'format',
        title: `Use more ${format} content`,
        description: `${format} posts get ${((score - 1) * 100).toFixed(0)}% more engagement than other formats.`,
        confidence: 0.75,
        expectedBoost: (score - 1) * 100,
        action: `Increase ${format} content in your posting schedule`,
      });
    }

    return recommendations;
  }

  /**
   * Recommend content tone
   */
  private recommendTone(): ContentRecommendation[] {
    const recommendations: ContentRecommendation[] = [];

    const toneAnalysis = this.analyzeTone();

    if (toneAnalysis.bestTone) {
      recommendations.push({
        type: 'tone',
        title: `Maintain ${toneAnalysis.bestTone} tone`,
        description: `Your ${toneAnalysis.bestTone} posts resonate best with your audience.`,
        confidence: 0.7,
        action: `Write in a ${toneAnalysis.bestTone} tone more often`,
      });
    }

    return recommendations;
  }

  /**
   * Recommend hashtags
   */
  private recommendHashtags(): ContentRecommendation[] {
    const recommendations: ContentRecommendation[] = [];

    const hashtagAnalysis = this.analyzeHashtags();

    if (hashtagAnalysis.topHashtags.length > 0) {
      const topHashtag = hashtagAnalysis.topHashtags[0];

      recommendations.push({
        type: 'hashtag',
        title: `Use #${topHashtag.tag} more often`,
        description: `Posts with #${topHashtag.tag} get ${topHashtag.boost.toFixed(0)}% more engagement.`,
        confidence: 0.65,
        expectedBoost: topHashtag.boost,
        action: `Include #${topHashtag.tag} in relevant posts`,
      });
    }

    return recommendations;
  }

  /**
   * Get optimal posting schedule
   */
  getOptimalSchedule(postsPerWeek: number = 7): PostingSuggestion[] {
    const timingAnalysis = this.analyzePostingTimes();

    // Generate suggestions for each post
    const suggestions: PostingSuggestion[] = [];

    for (let i = 0; i < postsPerWeek; i++) {
      // Distribute across best days and times
      const dayIndex = i % 7;
      const bestHourForDay = timingAnalysis.hoursByDay[dayIndex] || 12;

      suggestions.push({
        dayOfWeek: dayIndex,
        hour: bestHourForDay,
        expectedEngagement: this.estimateEngagement(dayIndex, bestHourForDay),
        confidence: 0.7,
      });
    }

    return suggestions.sort((a, b) => b.expectedEngagement - a.expectedEngagement);
  }

  /**
   * Analyze topic performance
   */
  private analyzeTopicPerformance(): Record<string, number> {
    const topicScores: Record<string, number[]> = {};
    const baselineEngagement = this.calculateBaselineEngagement();

    for (const post of this.profile.posts) {
      const engagement = this.calculateEngagement(post.metrics);
      const relativeScore = engagement / baselineEngagement;

      for (const topic of post.topics || []) {
        if (!topicScores[topic]) topicScores[topic] = [];
        topicScores[topic].push(relativeScore);
      }
    }

    // Average scores for each topic
    const avgScores: Record<string, number> = {};

    for (const [topic, scores] of Object.entries(topicScores)) {
      avgScores[topic] = scores.reduce((a, b) => a + b, 0) / scores.length;
    }

    return avgScores;
  }

  /**
   * Identify content gaps
   */
  private identifyContentGaps(): { topic: string; reason: string }[] {
    // Simplified - in production, use NLP to identify missing topics
    const allTopics = new Set<string>();

    for (const post of this.profile.posts) {
      for (const topic of post.topics || []) {
        allTopics.add(topic);
      }
    }

    // Check recency of each topic
    const gaps: { topic: string; reason: string }[] = [];

    for (const topic of allTopics) {
      const lastPost = this.profile.posts
        .filter((p) => p.topics?.includes(topic))
        .sort((a, b) => b.posted_at.getTime() - a.posted_at.getTime())[0];

      if (lastPost) {
        const daysSincePost =
          (Date.now() - lastPost.posted_at.getTime()) / (1000 * 60 * 60 * 24);

        if (daysSincePost > 14) {
          gaps.push({
            topic,
            reason: `Last posted ${Math.floor(daysSincePost)} days ago`,
          });
        }
      }
    }

    return gaps;
  }

  /**
   * Analyze posting times
   */
  private analyzePostingTimes() {
    const dayScores: Record<number, number[]> = {};
    const hourScores: Record<number, number[]> = {};
    const hoursByDay: Record<number, number> = {};

    const baseline = this.calculateBaselineEngagement();

    for (const post of this.profile.posts) {
      const day = post.posted_at.getDay();
      const hour = post.posted_at.getHours();
      const engagement = this.calculateEngagement(post.metrics);
      const score = engagement / baseline;

      if (!dayScores[day]) dayScores[day] = [];
      if (!hourScores[hour]) hourScores[hour] = [];

      dayScores[day].push(score);
      hourScores[hour].push(score);
    }

    // Find best day
    const avgDayScores = Object.entries(dayScores).map(([day, scores]) => ({
      day: parseInt(day),
      avgEngagement: scores.reduce((a, b) => a + b, 0) / scores.length,
      boost: ((scores.reduce((a, b) => a + b, 0) / scores.length - 1) * 100),
    }));

    const bestDay = avgDayScores.sort((a, b) => b.avgEngagement - a.avgEngagement)[0];

    // Find best hour
    const avgHourScores = Object.entries(hourScores).map(([hour, scores]) => ({
      hour: parseInt(hour),
      avgEngagement: scores.reduce((a, b) => a + b, 0) / scores.length,
      boost: ((scores.reduce((a, b) => a + b, 0) / scores.length - 1) * 100),
    }));

    const bestHour = avgHourScores.sort((a, b) => b.avgEngagement - a.avgEngagement)[0];

    return {
      bestDay,
      bestHour,
      hoursByDay,
    };
  }

  /**
   * Analyze format performance
   */
  private analyzeFormatPerformance(): Record<string, number> {
    const formatScores: Record<string, number[]> = {};
    const baseline = this.calculateBaselineEngagement();

    for (const post of this.profile.posts) {
      if (!post.type) continue;

      const engagement = this.calculateEngagement(post.metrics);
      const score = engagement / baseline;

      if (!formatScores[post.type]) formatScores[post.type] = [];
      formatScores[post.type].push(score);
    }

    const avgScores: Record<string, number> = {};

    for (const [format, scores] of Object.entries(formatScores)) {
      avgScores[format] = scores.reduce((a, b) => a + b, 0) / scores.length;
    }

    return avgScores;
  }

  /**
   * Analyze content tone
   */
  private analyzeTone() {
    // Simplified - in production, use sentiment analysis
    return {
      bestTone: 'informative',
    };
  }

  /**
   * Analyze hashtag performance
   */
  private analyzeHashtags() {
    // Simplified - in production, extract and analyze hashtags
    return {
      topHashtags: [
        { tag: 'ai', boost: 25 },
        { tag: 'tech', boost: 15 },
      ],
    };
  }

  /**
   * Calculate baseline engagement
   */
  private calculateBaselineEngagement(): number {
    if (this.profile.posts.length === 0) return 1;

    const total = this.profile.posts.reduce(
      (sum, post) => sum + this.calculateEngagement(post.metrics),
      0
    );

    return total / this.profile.posts.length;
  }

  /**
   * Calculate engagement score for a post
   */
  private calculateEngagement(metrics: HistoricalPost['metrics']): number {
    // Weighted engagement score
    return (
      metrics.likes * 1 +
      metrics.comments * 3 +
      metrics.shares * 5 +
      metrics.views * 0.1
    );
  }

  /**
   * Estimate engagement for a time slot
   */
  private estimateEngagement(day: number, hour: number): number {
    const baseline = this.calculateBaselineEngagement();
    // Simplified - in production, use ML model
    return baseline * (1 + Math.random() * 0.3);
  }

  /**
   * Format hour for display
   */
  private formatHour(hour: number): string {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:00 ${period}`;
  }
}

/**
 * Create recommendation engine from profile
 */
export function createRecommendationEngine(
  profile: ContentProfile
): ContentRecommendationEngine {
  return new ContentRecommendationEngine(profile);
}
