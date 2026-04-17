/**
 * @fileoverview Content Scheduling and Posting Queue
 * @module lib/scheduling-queue
 *
 * Provides utilities for scheduling content posts across platforms,
 * managing posting queues, and determining optimal posting times.
 *
 * @example
 * ```typescript
 * import { SchedulingQueue, getOptimalPostingTime } from './scheduling-queue';
 *
 * const queue = new SchedulingQueue();
 * queue.schedulePost({
 *   content: 'Hello world!',
 *   platform: 'twitter',
 *   scheduledTime: new Date('2026-04-20T10:00:00'),
 * });
 *
 * const optimal = getOptimalPostingTime('linkedin', 'technology');
 * console.log(`Best time to post: ${optimal.time}`);
 * ```
 */

import type { Platform } from './openai';

export interface ScheduledPost {
  /** Unique post identifier */
  id: string;
  /** Post content */
  content: string;
  /** Target platform */
  platform: Platform;
  /** Scheduled publish time */
  scheduledTime: Date;
  /** Post status */
  status: PostStatus;
  /** Optional media attachments */
  media?: MediaAttachment[];
  /** Hashtags to include */
  hashtags?: string[];
  /** Post metadata */
  metadata?: PostMetadata;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed' | 'cancelled';

export interface MediaAttachment {
  /** Media type */
  type: 'image' | 'video' | 'gif';
  /** Media URL or blob reference */
  url: string;
  /** Alt text for accessibility */
  altText?: string;
}

export interface PostMetadata {
  /** Original content source */
  sourceUrl?: string;
  /** Associated campaign */
  campaign?: string;
  /** Content topic/category */
  topic?: string;
  /** A/B test variant */
  variant?: string;
  /** Custom tags */
  tags?: string[];
}

export interface OptimalTimeResult {
  /** Recommended posting time */
  time: Date;
  /** Day of week (0-6, Sunday-Saturday) */
  dayOfWeek: number;
  /** Hour (0-23) */
  hour: number;
  /** Confidence score (0-100) */
  confidence: number;
  /** Reasoning for the recommendation */
  reason: string;
}

export interface PostingWindow {
  /** Start hour (0-23) */
  startHour: number;
  /** End hour (0-23) */
  endHour: number;
  /** Days this window applies (0-6) */
  days: number[];
  /** Window priority (higher = better) */
  priority: number;
}

/**
 * Platform-specific optimal posting windows based on engagement data
 */
const OPTIMAL_POSTING_WINDOWS: Record<Platform, PostingWindow[]> = {
  twitter: [
    { startHour: 8, endHour: 10, days: [1, 2, 3, 4, 5], priority: 100 }, // Weekday mornings
    { startHour: 12, endHour: 13, days: [1, 2, 3, 4, 5], priority: 90 }, // Lunch break
    { startHour: 17, endHour: 19, days: [1, 2, 3, 4, 5], priority: 85 }, // After work
    { startHour: 9, endHour: 12, days: [0, 6], priority: 70 }, // Weekend mornings
  ],
  linkedin: [
    { startHour: 7, endHour: 9, days: [2, 3, 4], priority: 100 }, // Tue-Thu morning
    { startHour: 12, endHour: 13, days: [1, 2, 3, 4, 5], priority: 85 }, // Lunch
    { startHour: 17, endHour: 18, days: [2, 3], priority: 80 }, // Mid-week evening
  ],
  instagram: [
    { startHour: 11, endHour: 13, days: [1, 2, 3, 4, 5], priority: 95 }, // Late morning
    { startHour: 19, endHour: 21, days: [0, 1, 2, 3, 4, 5, 6], priority: 100 }, // Evening
    { startHour: 14, endHour: 16, days: [0, 6], priority: 85 }, // Weekend afternoon
  ],
  facebook: [
    { startHour: 13, endHour: 16, days: [1, 2, 3, 4, 5], priority: 90 }, // Early afternoon
    { startHour: 9, endHour: 11, days: [0, 6], priority: 85 }, // Weekend morning
    { startHour: 19, endHour: 21, days: [0, 1, 2, 3, 4, 5, 6], priority: 80 }, // Evening
  ],
  threads: [
    { startHour: 9, endHour: 11, days: [1, 2, 3, 4, 5], priority: 90 },
    { startHour: 19, endHour: 21, days: [0, 1, 2, 3, 4, 5, 6], priority: 95 },
  ],
  tiktok: [
    { startHour: 19, endHour: 22, days: [0, 1, 2, 3, 4, 5, 6], priority: 100 }, // Prime time
    { startHour: 12, endHour: 15, days: [0, 6], priority: 90 }, // Weekend afternoon
    { startHour: 7, endHour: 9, days: [1, 2, 3, 4, 5], priority: 75 }, // Morning commute
  ],
};

/**
 * Topic-based posting time adjustments
 */
const TOPIC_ADJUSTMENTS: Record<string, { preferredDays: number[]; preferredHours: number[] }> = {
  technology: { preferredDays: [1, 2, 3, 4], preferredHours: [9, 10, 14, 15] },
  business: { preferredDays: [1, 2, 3, 4, 5], preferredHours: [7, 8, 12, 17] },
  entertainment: { preferredDays: [4, 5, 0], preferredHours: [19, 20, 21] },
  lifestyle: { preferredDays: [0, 6], preferredHours: [10, 11, 14, 15] },
  news: { preferredDays: [1, 2, 3, 4, 5], preferredHours: [6, 7, 8, 12, 18] },
  education: { preferredDays: [1, 2, 3, 4], preferredHours: [9, 10, 14, 15, 19] },
  health: { preferredDays: [1, 2, 3], preferredHours: [7, 8, 12, 18, 19] },
  food: { preferredDays: [5, 6, 0], preferredHours: [11, 12, 17, 18, 19] },
};

/**
 * Generate a unique post ID
 */
function generatePostId(): string {
  return `post_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Scheduling queue for managing scheduled posts
 *
 * @example
 * ```typescript
 * const queue = new SchedulingQueue();
 *
 * // Schedule a post
 * const post = queue.schedulePost({
 *   content: 'Check out our new feature!',
 *   platform: 'twitter',
 *   scheduledTime: new Date('2026-04-20T10:00:00'),
 * });
 *
 * // Get upcoming posts
 * const upcoming = queue.getUpcomingPosts(7); // Next 7 days
 * ```
 */
export class SchedulingQueue {
  private posts: Map<string, ScheduledPost> = new Map();

  /**
   * Schedule a new post
   *
   * @param options - Post options
   * @returns The scheduled post
   */
  schedulePost(options: {
    content: string;
    platform: Platform;
    scheduledTime: Date;
    media?: MediaAttachment[];
    hashtags?: string[];
    metadata?: PostMetadata;
  }): ScheduledPost {
    const now = new Date();
    const post: ScheduledPost = {
      id: generatePostId(),
      content: options.content,
      platform: options.platform,
      scheduledTime: options.scheduledTime,
      status: options.scheduledTime > now ? 'scheduled' : 'draft',
      media: options.media,
      hashtags: options.hashtags,
      metadata: options.metadata,
      createdAt: now,
      updatedAt: now,
    };

    this.posts.set(post.id, post);
    return post;
  }

  /**
   * Get a post by ID
   */
  getPost(id: string): ScheduledPost | undefined {
    return this.posts.get(id);
  }

  /**
   * Update a scheduled post
   */
  updatePost(
    id: string,
    updates: Partial<Omit<ScheduledPost, 'id' | 'createdAt'>>
  ): ScheduledPost | undefined {
    const post = this.posts.get(id);
    if (!post) return undefined;

    const updated: ScheduledPost = {
      ...post,
      ...updates,
      updatedAt: new Date(),
    };
    this.posts.set(id, updated);
    return updated;
  }

  /**
   * Cancel a scheduled post
   */
  cancelPost(id: string): boolean {
    const post = this.posts.get(id);
    if (!post || post.status === 'published') return false;

    post.status = 'cancelled';
    post.updatedAt = new Date();
    return true;
  }

  /**
   * Delete a post from the queue
   */
  deletePost(id: string): boolean {
    return this.posts.delete(id);
  }

  /**
   * Get all posts with optional filtering
   */
  getPosts(options?: {
    platform?: Platform;
    status?: PostStatus;
    startDate?: Date;
    endDate?: Date;
  }): ScheduledPost[] {
    let results = Array.from(this.posts.values());

    if (options?.platform) {
      results = results.filter((p) => p.platform === options.platform);
    }
    if (options?.status) {
      results = results.filter((p) => p.status === options.status);
    }
    if (options?.startDate) {
      results = results.filter((p) => p.scheduledTime >= options.startDate!);
    }
    if (options?.endDate) {
      results = results.filter((p) => p.scheduledTime <= options.endDate!);
    }

    return results.sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());
  }

  /**
   * Get upcoming posts within a time window
   *
   * @param days - Number of days to look ahead
   */
  getUpcomingPosts(days: number = 7): ScheduledPost[] {
    const now = new Date();
    const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return this.getPosts({
      status: 'scheduled',
      startDate: now,
      endDate,
    });
  }

  /**
   * Get posts due for publishing (past scheduled time)
   */
  getDuePosts(): ScheduledPost[] {
    const now = new Date();
    return Array.from(this.posts.values())
      .filter((p) => p.status === 'scheduled' && p.scheduledTime <= now)
      .sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());
  }

  /**
   * Mark a post as published
   */
  markPublished(id: string): boolean {
    const post = this.posts.get(id);
    if (!post || post.status !== 'scheduled') return false;

    post.status = 'published';
    post.updatedAt = new Date();
    return true;
  }

  /**
   * Mark a post as failed
   */
  markFailed(id: string, error?: string): boolean {
    const post = this.posts.get(id);
    if (!post) return false;

    post.status = 'failed';
    post.updatedAt = new Date();
    if (error && post.metadata) {
      post.metadata.tags = [...(post.metadata.tags || []), `error:${error}`];
    }
    return true;
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    total: number;
    byStatus: Record<PostStatus, number>;
    byPlatform: Record<string, number>;
    upcoming24h: number;
    upcoming7d: number;
  } {
    const posts = Array.from(this.posts.values());
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in7d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const byStatus: Record<PostStatus, number> = {
      draft: 0,
      scheduled: 0,
      published: 0,
      failed: 0,
      cancelled: 0,
    };

    const byPlatform: Record<string, number> = {};

    for (const post of posts) {
      byStatus[post.status]++;
      byPlatform[post.platform] = (byPlatform[post.platform] || 0) + 1;
    }

    const scheduled = posts.filter((p) => p.status === 'scheduled');
    const upcoming24h = scheduled.filter(
      (p) => p.scheduledTime >= now && p.scheduledTime <= in24h
    ).length;
    const upcoming7d = scheduled.filter(
      (p) => p.scheduledTime >= now && p.scheduledTime <= in7d
    ).length;

    return {
      total: posts.length,
      byStatus,
      byPlatform,
      upcoming24h,
      upcoming7d,
    };
  }

  /**
   * Clear all posts (use with caution)
   */
  clear(): void {
    this.posts.clear();
  }

  /**
   * Export queue to JSON
   */
  toJSON(): ScheduledPost[] {
    return Array.from(this.posts.values());
  }

  /**
   * Import posts from JSON
   */
  fromJSON(posts: ScheduledPost[]): void {
    for (const post of posts) {
      this.posts.set(post.id, {
        ...post,
        scheduledTime: new Date(post.scheduledTime),
        createdAt: new Date(post.createdAt),
        updatedAt: new Date(post.updatedAt),
      });
    }
  }
}

/**
 * Get the optimal posting time for a platform
 *
 * @param platform - Target platform
 * @param topic - Content topic (optional, for better recommendations)
 * @param timezone - User timezone offset in hours (default: 0/UTC)
 * @returns Optimal posting time recommendation
 *
 * @example
 * ```typescript
 * const optimal = getOptimalPostingTime('linkedin', 'technology');
 * console.log(`Post at ${optimal.time.toISOString()}`);
 * console.log(`Confidence: ${optimal.confidence}%`);
 * ```
 */
export function getOptimalPostingTime(
  platform: Platform,
  topic?: string,
  timezone: number = 0
): OptimalTimeResult {
  const windows = OPTIMAL_POSTING_WINDOWS[platform] || OPTIMAL_POSTING_WINDOWS.twitter;
  const topicAdjust = topic ? TOPIC_ADJUSTMENTS[topic.toLowerCase()] : undefined;

  // Find the best window
  let bestWindow = windows[0];
  let bestScore = bestWindow.priority;

  for (const window of windows) {
    let score = window.priority;

    // Boost score if topic preferences align
    if (topicAdjust) {
      const dayOverlap = window.days.filter((d) =>
        topicAdjust.preferredDays.includes(d)
      ).length;
      const hourOverlap = topicAdjust.preferredHours.filter(
        (h) => h >= window.startHour && h <= window.endHour
      ).length;
      score += dayOverlap * 5 + hourOverlap * 3;
    }

    if (score > bestScore) {
      bestScore = score;
      bestWindow = window;
    }
  }

  // Calculate the next occurrence of this window
  const now = new Date();
  const targetHour = Math.floor((bestWindow.startHour + bestWindow.endHour) / 2);

  // Find the next day that matches
  let targetDate = new Date(now);
  targetDate.setHours(targetHour - timezone, 0, 0, 0);

  // If today's time has passed, start from tomorrow
  if (targetDate <= now) {
    targetDate.setDate(targetDate.getDate() + 1);
  }

  // Find next matching day
  let attempts = 0;
  while (!bestWindow.days.includes(targetDate.getDay()) && attempts < 7) {
    targetDate.setDate(targetDate.getDate() + 1);
    attempts++;
  }

  // Calculate confidence based on window priority and topic match
  const maxPriority = Math.max(...windows.map((w) => w.priority));
  let confidence = Math.round((bestWindow.priority / maxPriority) * 80);
  if (topicAdjust) confidence = Math.min(100, confidence + 15);

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return {
    time: targetDate,
    dayOfWeek: targetDate.getDay(),
    hour: targetHour,
    confidence,
    reason: `${dayNames[targetDate.getDay()]} at ${targetHour}:00 is optimal for ${platform}${
      topic ? ` ${topic} content` : ''
    }. This time slot typically sees ${confidence >= 90 ? 'peak' : confidence >= 70 ? 'high' : 'moderate'} engagement.`,
  };
}

/**
 * Get multiple optimal posting times for scheduling a week of content
 *
 * @param platform - Target platform
 * @param count - Number of time slots to return
 * @param topic - Content topic (optional)
 * @returns Array of optimal posting times
 */
export function getWeeklySchedule(
  platform: Platform,
  count: number = 7,
  topic?: string
): OptimalTimeResult[] {
  const results: OptimalTimeResult[] = [];
  const usedSlots = new Set<string>();

  for (let i = 0; i < count * 2 && results.length < count; i++) {
    const result = getOptimalPostingTime(platform, topic);

    // Adjust date to avoid duplicates
    const adjustedDate = new Date(result.time);
    adjustedDate.setDate(adjustedDate.getDate() + Math.floor(i / 2));

    const slotKey = `${adjustedDate.getDay()}-${result.hour}`;
    if (!usedSlots.has(slotKey)) {
      usedSlots.add(slotKey);
      results.push({
        ...result,
        time: adjustedDate,
        dayOfWeek: adjustedDate.getDay(),
      });
    }
  }

  return results.sort((a, b) => a.time.getTime() - b.time.getTime());
}

/**
 * Check if a given time is within an optimal posting window
 *
 * @param platform - Target platform
 * @param time - Time to check
 * @returns Whether the time is optimal and why
 */
export function isOptimalTime(
  platform: Platform,
  time: Date
): { isOptimal: boolean; score: number; reason: string } {
  const windows = OPTIMAL_POSTING_WINDOWS[platform] || [];
  const hour = time.getHours();
  const day = time.getDay();

  for (const window of windows) {
    if (
      window.days.includes(day) &&
      hour >= window.startHour &&
      hour <= window.endHour
    ) {
      return {
        isOptimal: true,
        score: window.priority,
        reason: `This time falls within a high-engagement window for ${platform}.`,
      };
    }
  }

  // Check if it's close to an optimal window
  for (const window of windows) {
    if (window.days.includes(day)) {
      const distanceToStart = Math.abs(hour - window.startHour);
      const distanceToEnd = Math.abs(hour - window.endHour);
      const minDistance = Math.min(distanceToStart, distanceToEnd);

      if (minDistance <= 2) {
        return {
          isOptimal: false,
          score: Math.max(0, window.priority - minDistance * 20),
          reason: `Close to optimal time (${minDistance} hour${minDistance === 1 ? '' : 's'} away from peak window).`,
        };
      }
    }
  }

  return {
    isOptimal: false,
    score: 0,
    reason: 'This time is outside typical high-engagement windows.',
  };
}

/**
 * Suggest content distribution across platforms
 *
 * @param platforms - Target platforms
 * @param postsPerWeek - Desired posts per week
 * @returns Suggested schedule with platform distribution
 */
export function suggestContentCalendar(
  platforms: Platform[],
  postsPerWeek: number = 14
): Array<{ platform: Platform; time: OptimalTimeResult }> {
  const postsPerPlatform = Math.ceil(postsPerWeek / platforms.length);
  const calendar: Array<{ platform: Platform; time: OptimalTimeResult }> = [];

  for (const platform of platforms) {
    const schedule = getWeeklySchedule(platform, postsPerPlatform);
    for (const time of schedule) {
      calendar.push({ platform, time });
    }
  }

  // Sort by time
  return calendar.sort((a, b) => a.time.time.getTime() - b.time.time.getTime());
}

export default SchedulingQueue;
