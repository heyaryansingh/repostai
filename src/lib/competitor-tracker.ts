/**
 * Competitor Content Tracker - Monitor and analyze competitor content strategies
 *
 * Tracks competitor posts, engagement patterns, content types, posting frequency,
 * and identifies successful content strategies for competitive intelligence.
 */

interface CompetitorPost {
  id: string;
  competitorId: string;
  platform: 'twitter' | 'linkedin' | 'instagram' | 'facebook';
  content: string;
  contentType: 'text' | 'image' | 'video' | 'carousel' | 'link';
  timestamp: Date;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    views?: number;
  };
  hashtags: string[];
  mentions: string[];
  url: string;
}

interface CompetitorProfile {
  id: string;
  name: string;
  handle: string;
  platform: string;
  followerCount: number;
  industry: string;
  monitoringSince: Date;
}

interface CompetitorMetrics {
  competitorId: string;
  avgEngagementRate: number;
  postingFrequency: number; // posts per day
  peakPostingTimes: string[];
  topPerformingContentTypes: string[];
  avgLikesPerPost: number;
  avgCommentsPerPost: number;
  avgSharesPerPost: number;
  engagementGrowthRate: number;
  topHashtags: Array<{ tag: string; count: number; avgEngagement: number }>;
}

interface ContentGap {
  topic: string;
  competitorEngagement: number;
  yourEngagement: number;
  opportunity: 'high' | 'medium' | 'low';
  suggestedStrategy: string;
}

export class CompetitorTracker {
  private posts: Map<string, CompetitorPost[]> = new Map();
  private profiles: Map<string, CompetitorProfile> = new Map();

  /**
   * Add competitor profile for tracking
   */
  addCompetitor(profile: CompetitorProfile): void {
    this.profiles.set(profile.id, profile);
    if (!this.posts.has(profile.id)) {
      this.posts.set(profile.id, []);
    }
  }

  /**
   * Track new competitor post
   */
  trackPost(post: CompetitorPost): void {
    const posts = this.posts.get(post.competitorId) || [];
    posts.push(post);
    this.posts.set(post.competitorId, posts);
  }

  /**
   * Calculate engagement rate for a post
   */
  private calculateEngagementRate(post: CompetitorPost): number {
    const competitor = this.profiles.get(post.competitorId);
    if (!competitor || competitor.followerCount === 0) return 0;

    const totalEngagement =
      post.engagement.likes +
      post.engagement.comments +
      post.engagement.shares;

    return (totalEngagement / competitor.followerCount) * 100;
  }

  /**
   * Analyze competitor metrics
   */
  analyzeCompetitor(competitorId: string, daysBack: number = 30): CompetitorMetrics {
    const posts = this.posts.get(competitorId) || [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    const recentPosts = posts.filter(p => p.timestamp >= cutoffDate);

    if (recentPosts.length === 0) {
      return {
        competitorId,
        avgEngagementRate: 0,
        postingFrequency: 0,
        peakPostingTimes: [],
        topPerformingContentTypes: [],
        avgLikesPerPost: 0,
        avgCommentsPerPost: 0,
        avgSharesPerPost: 0,
        engagementGrowthRate: 0,
        topHashtags: []
      };
    }

    // Engagement rate
    const engagementRates = recentPosts.map(p => this.calculateEngagementRate(p));
    const avgEngagementRate = engagementRates.reduce((a, b) => a + b, 0) / engagementRates.length;

    // Posting frequency
    const postingFrequency = recentPosts.length / daysBack;

    // Peak posting times
    const hourCounts = new Map<number, number>();
    recentPosts.forEach(p => {
      const hour = p.timestamp.getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });

    const peakPostingTimes = Array.from(hourCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => `${hour}:00`);

    // Top performing content types
    const contentTypeEngagement = new Map<string, number[]>();
    recentPosts.forEach(p => {
      const rates = contentTypeEngagement.get(p.contentType) || [];
      rates.push(this.calculateEngagementRate(p));
      contentTypeEngagement.set(p.contentType, rates);
    });

    const topPerformingContentTypes = Array.from(contentTypeEngagement.entries())
      .map(([type, rates]) => ({
        type,
        avgRate: rates.reduce((a, b) => a + b, 0) / rates.length
      }))
      .sort((a, b) => b.avgRate - a.avgRate)
      .map(({ type }) => type);

    // Average metrics
    const avgLikesPerPost = recentPosts.reduce((sum, p) => sum + p.engagement.likes, 0) / recentPosts.length;
    const avgCommentsPerPost = recentPosts.reduce((sum, p) => sum + p.engagement.comments, 0) / recentPosts.length;
    const avgSharesPerPost = recentPosts.reduce((sum, p) => sum + p.engagement.shares, 0) / recentPosts.length;

    // Engagement growth rate
    const firstHalf = recentPosts.slice(0, Math.floor(recentPosts.length / 2));
    const secondHalf = recentPosts.slice(Math.floor(recentPosts.length / 2));

    const firstHalfEngagement = firstHalf.reduce((sum, p) =>
      sum + this.calculateEngagementRate(p), 0) / firstHalf.length;
    const secondHalfEngagement = secondHalf.reduce((sum, p) =>
      sum + this.calculateEngagementRate(p), 0) / secondHalf.length;

    const engagementGrowthRate = firstHalfEngagement > 0
      ? ((secondHalfEngagement - firstHalfEngagement) / firstHalfEngagement) * 100
      : 0;

    // Top hashtags
    const hashtagEngagement = new Map<string, { count: number; totalEngagement: number }>();
    recentPosts.forEach(p => {
      const engRate = this.calculateEngagementRate(p);
      p.hashtags.forEach(tag => {
        const current = hashtagEngagement.get(tag) || { count: 0, totalEngagement: 0 };
        current.count++;
        current.totalEngagement += engRate;
        hashtagEngagement.set(tag, current);
      });
    });

    const topHashtags = Array.from(hashtagEngagement.entries())
      .map(([tag, data]) => ({
        tag,
        count: data.count,
        avgEngagement: data.totalEngagement / data.count
      }))
      .sort((a, b) => b.avgEngagement - a.avgEngagement)
      .slice(0, 10);

    return {
      competitorId,
      avgEngagementRate,
      postingFrequency,
      peakPostingTimes,
      topPerformingContentTypes,
      avgLikesPerPost,
      avgCommentsPerPost,
      avgSharesPerPost,
      engagementGrowthRate,
      topHashtags
    };
  }

  /**
   * Compare your performance against competitors
   */
  identifyContentGaps(
    yourPosts: CompetitorPost[],
    competitorIds: string[]
  ): ContentGap[] {
    const gaps: ContentGap[] = [];

    // Extract topics from hashtags and content
    const yourTopics = this.extractTopics(yourPosts);

    competitorIds.forEach(competitorId => {
      const competitorPosts = this.posts.get(competitorId) || [];
      const competitorTopics = this.extractTopics(competitorPosts);

      // Find topics competitors excel at
      competitorTopics.forEach(({ topic, avgEngagement }) => {
        const yourTopic = yourTopics.find(t => t.topic === topic);
        const yourEngagement = yourTopic?.avgEngagement || 0;

        if (avgEngagement > yourEngagement * 1.5) {
          const opportunity = avgEngagement > yourEngagement * 3 ? 'high' :
                             avgEngagement > yourEngagement * 2 ? 'medium' : 'low';

          gaps.push({
            topic,
            competitorEngagement: avgEngagement,
            yourEngagement,
            opportunity,
            suggestedStrategy: this.generateStrategy(topic, avgEngagement, yourEngagement)
          });
        }
      });
    });

    return gaps.sort((a, b) => {
      const opportunityWeight = { high: 3, medium: 2, low: 1 };
      return opportunityWeight[b.opportunity] - opportunityWeight[a.opportunity];
    });
  }

  /**
   * Extract topics from posts
   */
  private extractTopics(posts: CompetitorPost[]): Array<{ topic: string; avgEngagement: number }> {
    const topicEngagement = new Map<string, number[]>();

    posts.forEach(post => {
      const engagementRate = this.calculateEngagementRate(post);

      // Use hashtags as topics
      post.hashtags.forEach(tag => {
        const rates = topicEngagement.get(tag) || [];
        rates.push(engagementRate);
        topicEngagement.set(tag, rates);
      });
    });

    return Array.from(topicEngagement.entries())
      .map(([topic, rates]) => ({
        topic,
        avgEngagement: rates.reduce((a, b) => a + b, 0) / rates.length
      }))
      .sort((a, b) => b.avgEngagement - a.avgEngagement);
  }

  /**
   * Generate strategy suggestion
   */
  private generateStrategy(topic: string, competitorEngagement: number, yourEngagement: number): string {
    const gap = ((competitorEngagement - yourEngagement) / competitorEngagement) * 100;

    if (gap > 80) {
      return `High-priority: Increase content about "${topic}". Competitors see ${competitorEngagement.toFixed(1)}% engagement vs your ${yourEngagement.toFixed(1)}%.`;
    } else if (gap > 50) {
      return `Medium-priority: Enhance "${topic}" content strategy. Consider different formats or posting times.`;
    } else {
      return `Low-priority: Monitor "${topic}" performance. Small optimization could yield returns.`;
    }
  }

  /**
   * Get best performing posts from competitor
   */
  getTopPosts(competitorId: string, limit: number = 10): CompetitorPost[] {
    const posts = this.posts.get(competitorId) || [];

    return posts
      .sort((a, b) => {
        const aEngagement = this.calculateEngagementRate(a);
        const bEngagement = this.calculateEngagementRate(b);
        return bEngagement - aEngagement;
      })
      .slice(0, limit);
  }

  /**
   * Get posting schedule analysis
   */
  getBestPostingSchedule(competitorIds: string[]): {
    dayOfWeek: number;
    hour: number;
    avgEngagement: number;
  }[] {
    const scheduleEngagement = new Map<string, number[]>();

    competitorIds.forEach(competitorId => {
      const posts = this.posts.get(competitorId) || [];

      posts.forEach(post => {
        const dayOfWeek = post.timestamp.getDay();
        const hour = post.timestamp.getHours();
        const key = `${dayOfWeek}-${hour}`;
        const engagementRate = this.calculateEngagementRate(post);

        const rates = scheduleEngagement.get(key) || [];
        rates.push(engagementRate);
        scheduleEngagement.set(key, rates);
      });
    });

    return Array.from(scheduleEngagement.entries())
      .map(([key, rates]) => {
        const [dayOfWeek, hour] = key.split('-').map(Number);
        return {
          dayOfWeek,
          hour,
          avgEngagement: rates.reduce((a, b) => a + b, 0) / rates.length
        };
      })
      .sort((a, b) => b.avgEngagement - a.avgEngagement);
  }

  /**
   * Export competitor analysis report
   */
  exportReport(competitorIds: string[]): {
    competitors: CompetitorMetrics[];
    contentGaps: ContentGap[];
    bestPostingSchedule: Array<{ dayOfWeek: number; hour: number; avgEngagement: number }>;
  } {
    const competitors = competitorIds.map(id => this.analyzeCompetitor(id));
    const contentGaps = this.identifyContentGaps([], competitorIds);
    const bestPostingSchedule = this.getBestPostingSchedule(competitorIds);

    return {
      competitors,
      contentGaps,
      bestPostingSchedule: bestPostingSchedule.slice(0, 10)
    };
  }
}

export type { CompetitorPost, CompetitorProfile, CompetitorMetrics, ContentGap };
