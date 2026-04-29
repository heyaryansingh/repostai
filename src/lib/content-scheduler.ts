/**
 * Advanced content scheduling with optimal posting time detection
 * and multi-platform coordination
 */

export interface ScheduledPost {
  id: string;
  content: string;
  platform: string;
  scheduledTime: Date;
  status: 'pending' | 'posted' | 'failed' | 'cancelled';
  userId: string;
  mediaUrls?: string[];
  hashtags?: string[];
  metadata?: Record<string, any>;
}

export interface PostingSchedule {
  platform: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  hour: number; // 0-23
  score: number; // Engagement score
}

export interface OptimalTimeResult {
  platform: string;
  bestTime: Date;
  estimatedEngagement: number;
  alternativeTimes: Date[];
}

/**
 * Content scheduler with intelligent timing
 */
export class ContentScheduler {
  private scheduledPosts: Map<string, ScheduledPost>;
  private optimalTimes: Map<string, PostingSchedule[]>;

  constructor() {
    this.scheduledPosts = new Map();
    this.optimalTimes = new Map();
    this.initializeDefaultSchedules();
  }

  /**
   * Initialize default optimal posting times based on research
   */
  private initializeDefaultSchedules() {
    // Twitter optimal times (EST)
    this.optimalTimes.set('twitter', [
      { platform: 'twitter', dayOfWeek: 1, hour: 9, score: 0.85 },   // Monday 9 AM
      { platform: 'twitter', dayOfWeek: 1, hour: 12, score: 0.90 },  // Monday 12 PM
      { platform: 'twitter', dayOfWeek: 3, hour: 9, score: 0.88 },   // Wednesday 9 AM
      { platform: 'twitter', dayOfWeek: 5, hour: 12, score: 0.82 },  // Friday 12 PM
    ]);

    // LinkedIn optimal times
    this.optimalTimes.set('linkedin', [
      { platform: 'linkedin', dayOfWeek: 2, hour: 8, score: 0.92 },  // Tuesday 8 AM
      { platform: 'linkedin', dayOfWeek: 3, hour: 10, score: 0.95 }, // Wednesday 10 AM
      { platform: 'linkedin', dayOfWeek: 4, hour: 9, score: 0.90 },  // Thursday 9 AM
    ]);

    // Instagram optimal times
    this.optimalTimes.set('instagram', [
      { platform: 'instagram', dayOfWeek: 1, hour: 11, score: 0.88 }, // Monday 11 AM
      { platform: 'instagram', dayOfWeek: 3, hour: 14, score: 0.92 }, // Wednesday 2 PM
      { platform: 'instagram', dayOfWeek: 5, hour: 10, score: 0.85 }, // Friday 10 AM
    ]);

    // Facebook optimal times
    this.optimalTimes.set('facebook', [
      { platform: 'facebook', dayOfWeek: 1, hour: 13, score: 0.87 }, // Monday 1 PM
      { platform: 'facebook', dayOfWeek: 3, hour: 12, score: 0.90 }, // Wednesday 12 PM
      { platform: 'facebook', dayOfWeek: 4, hour: 13, score: 0.85 }, // Thursday 1 PM
    ]);
  }

  /**
   * Schedule a post
   */
  schedulePost(post: Omit<ScheduledPost, 'id' | 'status'>): ScheduledPost {
    const id = `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const scheduledPost: ScheduledPost = {
      ...post,
      id,
      status: 'pending'
    };

    this.scheduledPosts.set(id, scheduledPost);
    return scheduledPost;
  }

  /**
   * Get optimal posting time for a platform
   */
  getOptimalTime(
    platform: string,
    afterDate?: Date
  ): OptimalTimeResult | null {
    const platformSchedules = this.optimalTimes.get(platform.toLowerCase());

    if (!platformSchedules) {
      return null;
    }

    const now = afterDate || new Date();
    const alternatives: Date[] = [];

    // Sort by score (highest first)
    const sortedSchedules = [...platformSchedules].sort((a, b) => b.score - a.score);

    // Find next available optimal time
    for (const schedule of sortedSchedules) {
      const nextTime = this.getNextOccurrence(schedule, now);

      if (alternatives.length === 0) {
        // This is the best time
        return {
          platform,
          bestTime: nextTime,
          estimatedEngagement: schedule.score,
          alternativeTimes: sortedSchedules.slice(1, 4).map(s =>
            this.getNextOccurrence(s, now)
          )
        };
      }

      if (alternatives.length < 3) {
        alternatives.push(nextTime);
      }
    }

    return null;
  }

  /**
   * Get next occurrence of a schedule
   */
  private getNextOccurrence(schedule: PostingSchedule, after: Date): Date {
    const result = new Date(after);

    // Move to next week if time has passed today
    const currentDay = result.getDay();
    const currentHour = result.getHours();

    if (
      currentDay === schedule.dayOfWeek &&
      currentHour >= schedule.hour
    ) {
      result.setDate(result.getDate() + 7);
    } else if (currentDay > schedule.dayOfWeek) {
      result.setDate(result.getDate() + (7 - currentDay + schedule.dayOfWeek));
    } else {
      result.setDate(result.getDate() + (schedule.dayOfWeek - currentDay));
    }

    result.setHours(schedule.hour, 0, 0, 0);
    return result;
  }

  /**
   * Get all scheduled posts
   */
  getScheduledPosts(
    filters?: {
      platform?: string;
      status?: ScheduledPost['status'];
      userId?: string;
    }
  ): ScheduledPost[] {
    let posts = Array.from(this.scheduledPosts.values());

    if (filters) {
      if (filters.platform) {
        posts = posts.filter(p => p.platform === filters.platform);
      }
      if (filters.status) {
        posts = posts.filter(p => p.status === filters.status);
      }
      if (filters.userId) {
        posts = posts.filter(p => p.userId === filters.userId);
      }
    }

    return posts.sort((a, b) =>
      a.scheduledTime.getTime() - b.scheduledTime.getTime()
    );
  }

  /**
   * Update post status
   */
  updatePostStatus(
    postId: string,
    status: ScheduledPost['status']
  ): boolean {
    const post = this.scheduledPosts.get(postId);

    if (!post) {
      return false;
    }

    post.status = status;
    this.scheduledPosts.set(postId, post);
    return true;
  }

  /**
   * Cancel a scheduled post
   */
  cancelPost(postId: string): boolean {
    return this.updatePostStatus(postId, 'cancelled');
  }

  /**
   * Get posts ready to be published
   */
  getPostsDueNow(bufferMinutes = 5): ScheduledPost[] {
    const now = new Date();
    const buffer = bufferMinutes * 60 * 1000;

    return this.getScheduledPosts({ status: 'pending' }).filter(post => {
      const timeDiff = post.scheduledTime.getTime() - now.getTime();
      return timeDiff >= 0 && timeDiff <= buffer;
    });
  }

  /**
   * Bulk schedule posts across multiple platforms
   */
  bulkSchedule(
    content: string,
    platforms: string[],
    userId: string,
    mediaUrls?: string[]
  ): ScheduledPost[] {
    const scheduled: ScheduledPost[] = [];

    for (const platform of platforms) {
      const optimalTime = this.getOptimalTime(platform);

      if (optimalTime) {
        const post = this.schedulePost({
          content,
          platform,
          scheduledTime: optimalTime.bestTime,
          userId,
          mediaUrls
        });
        scheduled.push(post);
      }
    }

    return scheduled;
  }

  /**
   * Add custom optimal time for a platform
   */
  addOptimalTime(schedule: PostingSchedule): void {
    const platformSchedules = this.optimalTimes.get(schedule.platform) || [];
    platformSchedules.push(schedule);
    this.optimalTimes.set(schedule.platform, platformSchedules);
  }

  /**
   * Get scheduling statistics
   */
  getStatistics() {
    const posts = Array.from(this.scheduledPosts.values());

    const byStatus = posts.reduce((acc, post) => {
      acc[post.status] = (acc[post.status] || 0) + 1;
      return acc;
    }, {} as Record<ScheduledPost['status'], number>);

    const byPlatform = posts.reduce((acc, post) => {
      acc[post.platform] = (acc[post.platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: posts.length,
      byStatus,
      byPlatform,
      upcomingCount: this.getScheduledPosts({ status: 'pending' }).length,
      nextPost: this.getScheduledPosts({ status: 'pending' })[0] || null
    };
  }

  /**
   * Clean up old posts
   */
  cleanup(olderThanDays = 30): number {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);

    let removed = 0;

    for (const [id, post] of this.scheduledPosts) {
      if (
        post.scheduledTime < cutoff &&
        (post.status === 'posted' || post.status === 'cancelled')
      ) {
        this.scheduledPosts.delete(id);
        removed++;
      }
    }

    return removed;
  }
}

/**
 * Create a content scheduler instance
 */
export function createScheduler(): ContentScheduler {
  return new ContentScheduler();
}
