/**
 * @fileoverview Platform-specific content templates for RepostAI.
 *
 * Provides optimized templates and guidelines for each social media
 * platform, ensuring content matches platform best practices.
 *
 * @module lib/platform-templates
 *
 * @example
 * ```typescript
 * import { getTemplate, getPlatformGuide, formatForPlatform } from '@/lib/platform-templates';
 *
 * const guide = getPlatformGuide('twitter');
 * const formatted = formatForPlatform('twitter', content, 'engagement');
 * ```
 */

/**
 * Supported social media platforms.
 */
export type Platform =
  | "twitter"
  | "linkedin"
  | "instagram"
  | "facebook"
  | "threads"
  | "tiktok";

/**
 * Content tone options.
 */
export type ContentTone =
  | "professional"
  | "casual"
  | "humorous"
  | "inspirational"
  | "educational"
  | "promotional";

/**
 * Post type categories.
 */
export type PostType =
  | "engagement"
  | "announcement"
  | "educational"
  | "promotional"
  | "storytelling"
  | "thread";

/**
 * Platform-specific guidelines and constraints.
 */
export interface PlatformGuide {
  /** Platform identifier */
  platform: Platform;
  /** Maximum character count */
  maxLength: number;
  /** Optimal character range */
  optimalLength: { min: number; max: number };
  /** Maximum hashtags recommended */
  maxHashtags: number;
  /** Whether platform supports threads/carousels */
  supportsThreads: boolean;
  /** Best posting times (UTC) */
  bestTimes: string[];
  /** Platform-specific tips */
  tips: string[];
  /** Content format preferences */
  formatPreferences: string[];
}

/**
 * Content template structure.
 */
export interface ContentTemplate {
  /** Template identifier */
  id: string;
  /** Display name */
  name: string;
  /** Template description */
  description: string;
  /** Compatible platforms */
  platforms: Platform[];
  /** Compatible post types */
  postTypes: PostType[];
  /** Template structure with placeholders */
  structure: string;
  /** Example filled template */
  example: string;
  /** Usage tips */
  tips: string[];
}

/**
 * Platform guidelines database.
 */
export const platformGuides: Record<Platform, PlatformGuide> = {
  twitter: {
    platform: "twitter",
    maxLength: 280,
    optimalLength: { min: 71, max: 100 },
    maxHashtags: 2,
    supportsThreads: true,
    bestTimes: ["09:00", "12:00", "17:00"],
    tips: [
      "Keep it concise and punchy",
      "Use threads for longer content",
      "Ask questions to drive engagement",
      "Include a clear call-to-action",
      "Visual content gets 150% more retweets"
    ],
    formatPreferences: [
      "Short, impactful sentences",
      "Emojis for visual breaks",
      "Line breaks for readability",
      "Minimal hashtags (1-2)"
    ]
  },

  linkedin: {
    platform: "linkedin",
    maxLength: 3000,
    optimalLength: { min: 150, max: 300 },
    maxHashtags: 5,
    supportsThreads: false,
    bestTimes: ["08:00", "10:00", "12:00", "17:00"],
    tips: [
      "Lead with a hook in first 2 lines",
      "Share professional insights and learnings",
      "Use line breaks every 1-2 sentences",
      "End with a question or CTA",
      "Personal stories outperform generic content"
    ],
    formatPreferences: [
      "Hook in first line",
      "Single-line paragraphs",
      "Bullet points for lists",
      "Professional but personable tone"
    ]
  },

  instagram: {
    platform: "instagram",
    maxLength: 2200,
    optimalLength: { min: 138, max: 150 },
    maxHashtags: 30,
    supportsThreads: true,
    bestTimes: ["11:00", "13:00", "19:00"],
    tips: [
      "Front-load important information",
      "Use hashtags in first comment",
      "Include emojis for personality",
      "Ask for engagement (save/share)",
      "Carousel posts get 3x more engagement"
    ],
    formatPreferences: [
      "Short caption with CTA",
      "Hashtags in comments",
      "Emojis as bullet points",
      "Visual-first storytelling"
    ]
  },

  facebook: {
    platform: "facebook",
    maxLength: 63206,
    optimalLength: { min: 40, max: 80 },
    maxHashtags: 3,
    supportsThreads: false,
    bestTimes: ["09:00", "13:00", "16:00"],
    tips: [
      "Shorter posts perform better",
      "Ask questions to boost engagement",
      "Native video outperforms links",
      "Use Facebook-specific features (polls, events)",
      "Personal stories resonate well"
    ],
    formatPreferences: [
      "Conversational tone",
      "Clear and simple language",
      "Minimal hashtags",
      "Direct questions"
    ]
  },

  threads: {
    platform: "threads",
    maxLength: 500,
    optimalLength: { min: 100, max: 280 },
    maxHashtags: 3,
    supportsThreads: true,
    bestTimes: ["09:00", "12:00", "21:00"],
    tips: [
      "Conversational and authentic tone",
      "Join trending conversations",
      "Build on existing discussions",
      "Share behind-the-scenes content",
      "Cross-post strategically from other platforms"
    ],
    formatPreferences: [
      "Casual, authentic voice",
      "Minimal hashtags",
      "Reply-style format",
      "Personal opinions welcome"
    ]
  },

  tiktok: {
    platform: "tiktok",
    maxLength: 2200,
    optimalLength: { min: 100, max: 150 },
    maxHashtags: 5,
    supportsThreads: false,
    bestTimes: ["07:00", "12:00", "15:00", "19:00"],
    tips: [
      "Hook viewers in first 3 seconds",
      "Use trending sounds and hashtags",
      "Captions should complement video",
      "Include a strong CTA",
      "Authentic > polished"
    ],
    formatPreferences: [
      "Short, punchy captions",
      "Trending hashtags",
      "Emoji-rich",
      "Casual and fun tone"
    ]
  }
};

/**
 * Content templates database.
 */
export const contentTemplates: ContentTemplate[] = [
  {
    id: "hook-value-cta",
    name: "Hook-Value-CTA",
    description: "Classic engagement formula: grab attention, provide value, call to action",
    platforms: ["twitter", "linkedin", "threads"],
    postTypes: ["engagement", "educational"],
    structure: `[HOOK - attention-grabbing statement]

[VALUE - 2-3 key points or insights]

[CTA - what do you want readers to do?]`,
    example: `Stop scrolling. This changed how I think about productivity.

Here's what I learned after tracking my time for 30 days:
- Deep work happens in 90-min blocks
- Context switching costs 23 minutes each time
- Your peak hours matter more than total hours

What's your most productive time of day?`,
    tips: [
      "Make the hook controversial or surprising",
      "Provide actionable value",
      "End with an easy-to-answer question"
    ]
  },

  {
    id: "storytelling",
    name: "Personal Story",
    description: "Share a personal experience with a lesson or insight",
    platforms: ["linkedin", "instagram", "facebook"],
    postTypes: ["storytelling", "educational"],
    structure: `[HOOK - intriguing opening]

[CONTEXT - set the scene briefly]

[CHALLENGE - what problem did you face]

[SOLUTION - what did you do]

[LESSON - what can others learn]

[CTA - engagement question]`,
    example: `Two years ago, I almost quit tech.

I was burned out, working 70-hour weeks, and seeing no growth.

Then I made one change: I started saying "no" to everything that wasn't essential.

Within 6 months, I got promoted and cut my hours by 30%.

The lesson? Your yes is only as powerful as your no.

What's one thing you should say no to this week?`,
    tips: [
      "Be vulnerable and authentic",
      "Keep the story concise",
      "Make the lesson universally applicable"
    ]
  },

  {
    id: "listicle",
    name: "Listicle Post",
    description: "Easy-to-scan list format for tips, tools, or ideas",
    platforms: ["twitter", "linkedin", "instagram"],
    postTypes: ["educational", "engagement"],
    structure: `[HOOK/TITLE]

1. [Point 1]
2. [Point 2]
3. [Point 3]
4. [Point 4]
5. [Point 5]

[BONUS or CTA]`,
    example: `5 free tools that replaced my expensive subscriptions:

1. Notion (project management)
2. Canva (design)
3. Calendly (scheduling)
4. Loom (video recording)
5. Grammarly (writing)

Saved me $200/month.

What's your favorite free tool?`,
    tips: [
      "Odd numbers perform better",
      "Keep each point concise",
      "Include a bonus or summary"
    ]
  },

  {
    id: "thread-starter",
    name: "Thread Starter",
    description: "Opening tweet for a Twitter/X thread",
    platforms: ["twitter", "threads"],
    postTypes: ["thread", "educational"],
    structure: `[COMPELLING HOOK]

[PROMISE - what will they learn]

A thread:
[or: Here's how:]`,
    example: `I studied 100 viral LinkedIn posts.

Here are 7 patterns they all had in common:

A thread:`,
    tips: [
      "Promise specific value",
      "Create curiosity",
      "Keep thread parts connected"
    ]
  },

  {
    id: "announcement",
    name: "Announcement",
    description: "Share news, launches, or updates",
    platforms: ["twitter", "linkedin", "instagram", "facebook"],
    postTypes: ["announcement", "promotional"],
    structure: `[EXCITING NEWS HOOK]

[WHAT - what's happening]

[WHY IT MATTERS - benefits/impact]

[DETAILS - key info]

[CTA - how to learn more/participate]`,
    example: `BIG NEWS: After 6 months of work, we're launching today!

Introducing [Product] - the easiest way to [solve problem].

What makes it different:
- [Benefit 1]
- [Benefit 2]
- [Benefit 3]

Link in bio to get early access (50% off this week only).`,
    tips: [
      "Lead with excitement",
      "Focus on benefits, not features",
      "Include a clear next step"
    ]
  },

  {
    id: "controversial-take",
    name: "Controversial Take",
    description: "Share an unpopular opinion to drive discussion",
    platforms: ["twitter", "linkedin", "threads"],
    postTypes: ["engagement"],
    structure: `[CONTROVERSIAL STATEMENT]

[REASONING - why you believe this]

[NUANCE - acknowledge other side]

[DISCUSSION CTA]`,
    example: `Unpopular opinion: Morning routines are overrated.

Not everyone is a morning person, and that's fine.

What matters is finding YOUR peak hours and protecting them.

Some of the most successful people I know don't wake up at 5am.

Agree or disagree?`,
    tips: [
      "Be genuine, not provocative for attention",
      "Back up with reasoning",
      "Welcome respectful debate"
    ]
  }
];

/**
 * Get platform guidelines.
 *
 * @param platform - Platform to get guide for
 * @returns Platform guide or null if not found
 */
export function getPlatformGuide(platform: Platform): PlatformGuide | null {
  return platformGuides[platform] || null;
}

/**
 * Get templates for a specific platform.
 *
 * @param platform - Platform to filter by
 * @returns Array of compatible templates
 */
export function getTemplatesForPlatform(platform: Platform): ContentTemplate[] {
  return contentTemplates.filter((t) => t.platforms.includes(platform));
}

/**
 * Get templates by post type.
 *
 * @param postType - Post type to filter by
 * @returns Array of compatible templates
 */
export function getTemplatesByType(postType: PostType): ContentTemplate[] {
  return contentTemplates.filter((t) => t.postTypes.includes(postType));
}

/**
 * Get a specific template by ID.
 *
 * @param templateId - Template ID to find
 * @returns Template or null if not found
 */
export function getTemplate(templateId: string): ContentTemplate | null {
  return contentTemplates.find((t) => t.id === templateId) || null;
}

/**
 * Check if content fits platform constraints.
 *
 * @param platform - Target platform
 * @param content - Content to check
 * @returns Validation result with issues if any
 */
export function validateForPlatform(
  platform: Platform,
  content: string
): { valid: boolean; issues: string[]; suggestions: string[] } {
  const guide = platformGuides[platform];
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Check length
  if (content.length > guide.maxLength) {
    issues.push(
      `Content exceeds max length (${content.length}/${guide.maxLength})`
    );
  } else if (content.length < guide.optimalLength.min) {
    suggestions.push(
      `Consider expanding content (optimal: ${guide.optimalLength.min}-${guide.optimalLength.max} chars)`
    );
  } else if (content.length > guide.optimalLength.max) {
    suggestions.push(
      `Consider trimming for better engagement (optimal: ${guide.optimalLength.min}-${guide.optimalLength.max} chars)`
    );
  }

  // Check hashtags
  const hashtagCount = (content.match(/#\w+/g) || []).length;
  if (hashtagCount > guide.maxHashtags) {
    issues.push(
      `Too many hashtags (${hashtagCount}/${guide.maxHashtags} recommended)`
    );
  }

  return {
    valid: issues.length === 0,
    issues,
    suggestions
  };
}

/**
 * Format content for a specific platform.
 *
 * @param platform - Target platform
 * @param content - Content to format
 * @param postType - Type of post
 * @returns Formatted content optimized for platform
 */
export function formatForPlatform(
  platform: Platform,
  content: string,
  postType: PostType = "engagement"
): string {
  const guide = platformGuides[platform];
  let formatted = content;

  // Platform-specific formatting
  switch (platform) {
    case "linkedin":
      // Add line breaks for readability
      formatted = formatted.replace(/\. /g, ".\n\n");
      // Ensure hook is visible (first 2 lines before "see more")
      const lines = formatted.split("\n").filter((l) => l.trim());
      if (lines.length > 3) {
        formatted = lines.slice(0, 2).join("\n") + "\n\n" + lines.slice(2).join("\n");
      }
      break;

    case "twitter":
      // Truncate if needed
      if (formatted.length > guide.maxLength) {
        formatted = formatted.slice(0, guide.maxLength - 3) + "...";
      }
      break;

    case "instagram":
      // Move hashtags to end
      const hashtags = formatted.match(/#\w+/g) || [];
      formatted = formatted.replace(/#\w+/g, "").trim();
      if (hashtags.length > 0) {
        formatted += "\n\n.\n.\n.\n" + hashtags.join(" ");
      }
      break;

    case "threads":
    case "facebook":
      // Keep conversational, light formatting
      formatted = formatted.replace(/\n{3,}/g, "\n\n");
      break;
  }

  return formatted.trim();
}

/**
 * Get recommended hashtags for a platform based on content.
 *
 * @param platform - Target platform
 * @param content - Content to analyze
 * @param maxCount - Maximum hashtags to return
 * @returns Array of recommended hashtags
 */
export function suggestHashtags(
  platform: Platform,
  content: string,
  maxCount?: number
): string[] {
  const guide = platformGuides[platform];
  const max = maxCount ?? guide.maxHashtags;

  // Simple keyword extraction (in production, use NLP)
  const words = content.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
  const wordFreq = new Map<string, number>();

  for (const word of words) {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
  }

  // Sort by frequency and take top words
  const sorted = [...wordFreq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([word]) => `#${word}`);

  return sorted;
}
