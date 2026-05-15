/**
 * Content calendar generation and optimization
 *
 * Generates optimized posting schedules based on engagement patterns,
 * platform best practices, and content type.
 */

export interface TimeSlot {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  hour: number; // 0-23
  engagementScore: number; // 0-1
  platform: string;
}

export interface CalendarEntry {
  date: Date;
  platform: string;
  contentType: string;
  timeSlot: TimeSlot;
  priority: 'high' | 'medium' | 'low';
  notes?: string;
}

export interface ContentCalendarConfig {
  startDate: Date;
  endDate: Date;
  platforms: string[];
  postsPerWeek?: number;
  includeWeekends?: boolean;
  timezone?: string;
}

/**
 * Best times to post by platform (based on general engagement data)
 */
const PLATFORM_BEST_TIMES: Record<string, TimeSlot[]> = {
  twitter: [
    { dayOfWeek: 1, hour: 12, engagementScore: 0.9, platform: 'twitter' }, // Monday noon
    { dayOfWeek: 2, hour: 9, engagementScore: 0.85, platform: 'twitter' }, // Tuesday 9am
    { dayOfWeek: 3, hour: 15, engagementScore: 0.8, platform: 'twitter' }, // Wednesday 3pm
    { dayOfWeek: 4, hour: 12, engagementScore: 0.75, platform: 'twitter' }, // Thursday noon
    { dayOfWeek: 5, hour: 14, engagementScore: 0.7, platform: 'twitter' }, // Friday 2pm
  ],
  linkedin: [
    { dayOfWeek: 2, hour: 8, engagementScore: 0.95, platform: 'linkedin' }, // Tuesday 8am
    { dayOfWeek: 3, hour: 10, engagementScore: 0.9, platform: 'linkedin' }, // Wednesday 10am
    { dayOfWeek: 4, hour: 9, engagementScore: 0.85, platform: 'linkedin' }, // Thursday 9am
    { dayOfWeek: 1, hour: 12, engagementScore: 0.75, platform: 'linkedin' }, // Monday noon
  ],
  instagram: [
    { dayOfWeek: 1, hour: 11, engagementScore: 0.9, platform: 'instagram' }, // Monday 11am
    { dayOfWeek: 3, hour: 15, engagementScore: 0.85, platform: 'instagram' }, // Wednesday 3pm
    { dayOfWeek: 5, hour: 14, engagementScore: 0.8, platform: 'instagram' }, // Friday 2pm
    { dayOfWeek: 0, hour: 12, engagementScore: 0.75, platform: 'instagram' }, // Sunday noon
  ],
  facebook: [
    { dayOfWeek: 1, hour: 13, engagementScore: 0.85, platform: 'facebook' }, // Monday 1pm
    { dayOfWeek: 3, hour: 11, engagementScore: 0.8, platform: 'facebook' }, // Wednesday 11am
    { dayOfWeek: 4, hour: 13, engagementScore: 0.75, platform: 'facebook' }, // Thursday 1pm
  ],
};

/**
 * Generate content calendar
 */
export function generateContentCalendar(
  config: ContentCalendarConfig
): CalendarEntry[] {
  const calendar: CalendarEntry[] = [];
  const { startDate, endDate, platforms, postsPerWeek = 3, includeWeekends = false } = config;

  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();

    // Skip weekends if not included
    if (!includeWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
      currentDate.setDate(currentDate.getDate() + 1);
      continue;
    }

    // Generate posts for each platform
    for (const platform of platforms) {
      const bestTimes = PLATFORM_BEST_TIMES[platform.toLowerCase()] || [];

      // Find best time slot for this day
      const matchingSlots = bestTimes.filter((slot) => slot.dayOfWeek === dayOfWeek);

      if (matchingSlots.length > 0) {
        // Use best time slot
        const slot = matchingSlots[0];
        const postDate = new Date(currentDate);
        postDate.setHours(slot.hour, 0, 0, 0);

        calendar.push({
          date: postDate,
          platform,
          contentType: inferContentType(platform),
          timeSlot: slot,
          priority: calculatePriority(slot.engagementScore),
        });
      }
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Limit to postsPerWeek
  return limitPostsPerWeek(calendar, postsPerWeek);
}

/**
 * Infer content type based on platform
 */
function inferContentType(platform: string): string {
  const contentTypes: Record<string, string> = {
    twitter: 'thread',
    linkedin: 'article',
    instagram: 'carousel',
    facebook: 'post',
  };

  return contentTypes[platform.toLowerCase()] || 'post';
}

/**
 * Calculate priority based on engagement score
 */
function calculatePriority(engagementScore: number): 'high' | 'medium' | 'low' {
  if (engagementScore >= 0.8) return 'high';
  if (engagementScore >= 0.6) return 'medium';
  return 'low';
}

/**
 * Limit posts to specified number per week
 */
function limitPostsPerWeek(calendar: CalendarEntry[], postsPerWeek: number): CalendarEntry[] {
  const weeks = groupByWeek(calendar);
  const limited: CalendarEntry[] = [];

  for (const week of weeks) {
    // Sort by engagement score (descending)
    const sorted = week.sort((a, b) => b.timeSlot.engagementScore - a.timeSlot.engagementScore);

    // Take top N posts
    limited.push(...sorted.slice(0, postsPerWeek));
  }

  return limited.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Group calendar entries by week
 */
function groupByWeek(calendar: CalendarEntry[]): CalendarEntry[][] {
  const weeks: Map<string, CalendarEntry[]> = new Map();

  for (const entry of calendar) {
    const weekKey = getWeekKey(entry.date);

    if (!weeks.has(weekKey)) {
      weeks.set(weekKey, []);
    }

    weeks.get(weekKey)!.push(entry);
  }

  return Array.from(weeks.values());
}

/**
 * Get week identifier for a date
 */
function getWeekKey(date: Date): string {
  const year = date.getFullYear();
  const week = getWeekNumber(date);
  return `${year}-W${week}`;
}

/**
 * Get ISO week number
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Export calendar to CSV
 */
export function exportToCSV(calendar: CalendarEntry[]): string {
  const header = 'Date,Time,Platform,Content Type,Priority,Engagement Score\n';

  const rows = calendar.map((entry) => {
    const date = entry.date.toISOString().split('T')[0];
    const time = entry.date.toTimeString().split(' ')[0];
    const score = entry.timeSlot.engagementScore.toFixed(2);

    return `${date},${time},${entry.platform},${entry.contentType},${entry.priority},${score}`;
  });

  return header + rows.join('\n');
}

/**
 * Get posting recommendations for a specific date/time
 */
export function getRecommendations(date: Date, platform: string): {
  recommended: boolean;
  reason: string;
  alternativeSlots: TimeSlot[];
} {
  const dayOfWeek = date.getDay();
  const hour = date.getHours();

  const platformSlots = PLATFORM_BEST_TIMES[platform.toLowerCase()] || [];

  // Check if current slot is optimal
  const matchingSlot = platformSlots.find(
    (slot) => slot.dayOfWeek === dayOfWeek && Math.abs(slot.hour - hour) <= 1
  );

  if (matchingSlot) {
    return {
      recommended: true,
      reason: `This is a high-engagement time for ${platform}`,
      alternativeSlots: [],
    };
  }

  // Find alternatives
  const alternatives = platformSlots
    .filter((slot) => slot.engagementScore >= 0.7)
    .slice(0, 3);

  return {
    recommended: false,
    reason: `Low engagement expected for ${platform} at this time`,
    alternativeSlots: alternatives,
  };
}

/**
 * Analyze calendar coverage
 */
export function analyzeCalendarCoverage(calendar: CalendarEntry[]): {
  totalPosts: number;
  platformBreakdown: Record<string, number>;
  avgPostsPerWeek: number;
  highPriorityPercentage: number;
  coverageScore: number;
} {
  const totalPosts = calendar.length;

  // Platform breakdown
  const platformBreakdown: Record<string, number> = {};
  for (const entry of calendar) {
    platformBreakdown[entry.platform] = (platformBreakdown[entry.platform] || 0) + 1;
  }

  // High priority percentage
  const highPriorityCount = calendar.filter((e) => e.priority === 'high').length;
  const highPriorityPercentage = (highPriorityCount / totalPosts) * 100;

  // Average posts per week
  const weeks = groupByWeek(calendar);
  const avgPostsPerWeek = totalPosts / weeks.length;

  // Coverage score (0-100)
  const platformDiversity = Object.keys(platformBreakdown).length * 20;
  const postingFrequency = Math.min(avgPostsPerWeek * 10, 30);
  const qualityScore = highPriorityPercentage * 0.5;

  const coverageScore = Math.min(100, platformDiversity + postingFrequency + qualityScore);

  return {
    totalPosts,
    platformBreakdown,
    avgPostsPerWeek,
    highPriorityPercentage,
    coverageScore,
  };
}

/**
 * Find optimal time slots for a platform
 */
export function findOptimalSlots(
  platform: string,
  count: number = 5
): TimeSlot[] {
  const slots = PLATFORM_BEST_TIMES[platform.toLowerCase()] || [];

  return slots
    .sort((a, b) => b.engagementScore - a.engagementScore)
    .slice(0, count);
}

/**
 * Check for scheduling conflicts
 */
export function checkConflicts(calendar: CalendarEntry[]): {
  platform: string;
  date: Date;
  conflictingEntries: CalendarEntry[];
}[] {
  const conflicts: {
    platform: string;
    date: Date;
    conflictingEntries: CalendarEntry[];
  }[] = [];

  const grouped = new Map<string, CalendarEntry[]>();

  for (const entry of calendar) {
    const key = `${entry.platform}-${entry.date.toISOString()}`;

    if (!grouped.has(key)) {
      grouped.set(key, []);
    }

    grouped.get(key)!.push(entry);
  }

  for (const [key, entries] of grouped) {
    if (entries.length > 1) {
      conflicts.push({
        platform: entries[0].platform,
        date: entries[0].date,
        conflictingEntries: entries,
      });
    }
  }

  return conflicts;
}
