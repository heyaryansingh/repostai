/**
 * @fileoverview Hashtag Optimization - Generate and rank hashtags for social platforms
 * @module lib/hashtag-optimizer
 *
 * Intelligent hashtag generation and optimization for social media posts:
 * - Platform-specific hashtag strategies (Twitter, Instagram, LinkedIn, TikTok)
 * - Trending hashtag discovery
 * - Hashtag relevance scoring
 * - Optimal hashtag count recommendations
 * - Banned/restricted hashtag filtering
 *
 * @example
 * ```typescript
 * import { generateHashtags } from './hashtag-optimizer';
 *
 * const hashtags = await generateHashtags({
 *   content: "Excited to announce our new AI product!",
 *   platform: "twitter",
 *   count: 3,
 * });
 * ```
 */

export type Platform = "twitter" | "instagram" | "linkedin" | "tiktok" | "facebook";

export interface HashtagOptions {
  content: string;
  platform: Platform;
  count?: number; // Desired number of hashtags
  trending?: boolean; // Include trending hashtags
  niche?: string; // Industry/niche for specialized tags
  excludeBanned?: boolean; // Filter out banned/restricted tags
}

export interface Hashtag {
  tag: string; // Without # symbol
  relevance: number; // 0-1 score
  popularity: number; // 0-1 score (higher = more popular)
  competition: number; // 0-1 score (higher = more competition)
  isTrending: boolean;
  estimatedReach?: number;
}

export interface HashtagResult {
  hashtags: Hashtag[];
  strategy: string;
  platform: Platform;
  optimalCount: number;
}

// Platform-specific hashtag limits and best practices
const PLATFORM_LIMITS = {
  twitter: { max: 2, optimal: 1-2, strategy: "quality_over_quantity" },
  instagram: { max: 30, optimal: 5-10, strategy: "mix_popular_niche" },
  linkedin: { max: 3, optimal: 1-3, strategy: "professional_only" },
  tiktok: { max: 5, optimal: 3-5, strategy: "trending_first" },
  facebook: { max: 2, optimal: 1-2, strategy: "minimal_use" },
} as const;

// Common banned/restricted hashtags (sample list - expand as needed)
const BANNED_HASHTAGS = new Set([
  "follow4follow",
  "followback",
  "likeforlike",
  "like4like",
  "followme",
  "tagsforlikes",
  "spam",
]);

/**
 * Generate optimized hashtags for a social media post
 */
export async function generateHashtags(
  options: HashtagOptions
): Promise<HashtagResult> {
  const {
    content,
    platform,
    count,
    trending = false,
    niche,
    excludeBanned = true,
  } = options;

  const platformConfig = PLATFORM_LIMITS[platform];

  // Extract keywords from content
  const keywords = extractKeywords(content);

  // Generate candidate hashtags
  let candidates = await generateCandidateHashtags(keywords, niche);

  // Filter banned hashtags
  if (excludeBanned) {
    candidates = candidates.filter(
      (tag) => !BANNED_HASHTAGS.has(tag.tag.toLowerCase())
    );
  }

  // Add trending hashtags if requested
  if (trending) {
    const trendingTags = await getTrendingHashtags(platform, keywords);
    candidates.push(...trendingTags);
  }

  // Score and rank hashtags
  candidates = scoreHashtags(candidates, content, platform);

  // Apply platform-specific strategy
  const optimizedHashtags = applyPlatformStrategy(
    candidates,
    platform,
    count ?? platformConfig.optimal
  );

  return {
    hashtags: optimizedHashtags,
    strategy: platformConfig.strategy,
    platform,
    optimalCount: platformConfig.optimal,
  };
}

/**
 * Extract keywords from content using basic NLP
 */
function extractKeywords(content: string): string[] {
  // Remove URLs, mentions, special chars
  const cleaned = content
    .replace(/https?:\/\/\S+/g, "")
    .replace(/@\w+/g, "")
    .replace(/[^\w\s]/g, " ")
    .toLowerCase();

  // Split into words and filter stop words
  const stopWords = new Set([
    "the", "is", "at", "which", "on", "a", "an", "and", "or", "but",
    "in", "with", "to", "for", "of", "as", "by", "from", "that", "this",
    "it", "be", "are", "was", "were", "been", "have", "has", "had",
  ]);

  const words = cleaned.split(/\s+/).filter(
    (word) => word.length > 3 && !stopWords.has(word)
  );

  // Count frequency
  const frequency: Record<string, number> = {};
  for (const word of words) {
    frequency[word] = (frequency[word] || 0) + 1;
  }

  // Sort by frequency and take top keywords
  return Object.entries(frequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);
}

/**
 * Generate candidate hashtags from keywords
 */
async function generateCandidateHashtags(
  keywords: string[],
  niche?: string
): Promise<Hashtag[]> {
  const candidates: Hashtag[] = [];

  // Single-word hashtags from keywords
  for (const keyword of keywords) {
    candidates.push({
      tag: keyword,
      relevance: 0.8,
      popularity: 0.5,
      competition: 0.5,
      isTrending: false,
    });
  }

  // Two-word combinations (camelCase)
  for (let i = 0; i < keywords.length - 1; i++) {
    const tag = keywords[i] + keywords[i + 1].charAt(0).toUpperCase() + keywords[i + 1].slice(1);
    candidates.push({
      tag,
      relevance: 0.7,
      popularity: 0.3,
      competition: 0.3,
      isTrending: false,
    });
  }

  // Niche-specific hashtags
  if (niche) {
    const nicheTags = getNicheHashtags(niche);
    candidates.push(...nicheTags);
  }

  return candidates;
}

/**
 * Get trending hashtags for a platform
 */
async function getTrendingHashtags(
  platform: Platform,
  keywords: string[]
): Promise<Hashtag[]> {
  // TODO: Integrate with real trending API (Twitter API, RiteTag, etc.)
  // This is a placeholder implementation

  const trendingByPlatform: Record<Platform, string[]> = {
    twitter: ["tech", "ai", "innovation", "startup", "trending"],
    instagram: ["instagood", "photooftheday", "instadaily", "reels", "explore"],
    linkedin: ["leadership", "professionaldevelopment", "business", "career", "innovation"],
    tiktok: ["fyp", "foryou", "viral", "trending", "tiktok"],
    facebook: ["socialmedia", "community", "trending", "news", "viral"],
  };

  const platformTrending = trendingByPlatform[platform];

  // Filter trending tags by keyword relevance
  return platformTrending
    .filter((tag) =>
      keywords.some((keyword) => tag.includes(keyword) || keyword.includes(tag))
    )
    .map((tag) => ({
      tag,
      relevance: 0.6,
      popularity: 0.9,
      competition: 0.8,
      isTrending: true,
    }));
}

/**
 * Score hashtags based on relevance, popularity, and competition
 */
function scoreHashtags(
  hashtags: Hashtag[],
  content: string,
  platform: Platform
): Hashtag[] {
  return hashtags.map((hashtag) => {
    // Boost relevance if hashtag appears in content
    const contentLower = content.toLowerCase();
    const tagLower = hashtag.tag.toLowerCase();
    const inContent = contentLower.includes(tagLower);

    const relevance = inContent ? Math.min(hashtag.relevance + 0.2, 1) : hashtag.relevance;

    // Platform-specific scoring adjustments
    let popularity = hashtag.popularity;
    if (platform === "instagram" && hashtag.isTrending) {
      popularity = Math.min(popularity + 0.1, 1);
    } else if (platform === "linkedin" && hashtag.tag.length > 15) {
      // LinkedIn prefers concise hashtags
      popularity *= 0.8;
    }

    return {
      ...hashtag,
      relevance,
      popularity,
    };
  });
}

/**
 * Apply platform-specific hashtag strategy
 */
function applyPlatformStrategy(
  hashtags: Hashtag[],
  platform: Platform,
  count: number
): Hashtag[] {
  const config = PLATFORM_LIMITS[platform];

  // Sort by composite score
  const sorted = hashtags.sort((a, b) => {
    const scoreA = calculateCompositeScore(a, config.strategy);
    const scoreB = calculateCompositeScore(b, config.strategy);
    return scoreB - scoreA;
  });

  // Take top N hashtags
  const selected = sorted.slice(0, Math.min(count, config.max));

  // Ensure diversity (not all high-competition or all low-competition)
  return ensureDiversity(selected);
}

/**
 * Calculate composite score based on platform strategy
 */
function calculateCompositeScore(
  hashtag: Hashtag,
  strategy: string
): number {
  switch (strategy) {
    case "quality_over_quantity":
      // Twitter/Facebook: prioritize relevance and moderate competition
      return hashtag.relevance * 0.7 + (1 - hashtag.competition) * 0.3;

    case "mix_popular_niche":
      // Instagram: balance between popular and niche tags
      return (
        hashtag.relevance * 0.4 +
        hashtag.popularity * 0.3 +
        (1 - hashtag.competition) * 0.3
      );

    case "professional_only":
      // LinkedIn: relevance is king, avoid overly popular tags
      return hashtag.relevance * 0.8 + (1 - hashtag.popularity) * 0.2;

    case "trending_first":
      // TikTok: trending tags are critical
      const trendingBonus = hashtag.isTrending ? 0.3 : 0;
      return (
        hashtag.popularity * 0.5 + hashtag.relevance * 0.3 + trendingBonus
      );

    default:
      return hashtag.relevance;
  }
}

/**
 * Ensure diversity in hashtag selection
 */
function ensureDiversity(hashtags: Hashtag[]): Hashtag[] {
  if (hashtags.length < 3) return hashtags;

  // Categorize by competition level
  const high = hashtags.filter((h) => h.competition > 0.7);
  const medium = hashtags.filter((h) => h.competition >= 0.3 && h.competition <= 0.7);
  const low = hashtags.filter((h) => h.competition < 0.3);

  // Aim for balanced distribution
  const diverse: Hashtag[] = [];
  const targetPerTier = Math.ceil(hashtags.length / 3);

  diverse.push(...high.slice(0, targetPerTier));
  diverse.push(...medium.slice(0, targetPerTier));
  diverse.push(...low.slice(0, targetPerTier));

  return diverse.slice(0, hashtags.length);
}

/**
 * Get niche-specific hashtags
 */
function getNicheHashtags(niche: string): Hashtag[] {
  const nicheMap: Record<string, string[]> = {
    tech: ["techstartup", "innovation", "ai", "machinelearning", "devlife"],
    fitness: ["fitfam", "gymlife", "workout", "healthylifestyle", "fitness"],
    food: ["foodie", "instafood", "foodporn", "yummy", "delicious"],
    travel: ["wanderlust", "travelgram", "instatravel", "explore", "adventure"],
    business: ["entrepreneur", "startup", "businessowner", "success", "motivation"],
  };

  const tags = nicheMap[niche.toLowerCase()] || [];

  return tags.map((tag) => ({
    tag,
    relevance: 0.9,
    popularity: 0.6,
    competition: 0.5,
    isTrending: false,
  }));
}

/**
 * Validate hashtag format
 */
export function isValidHashtag(tag: string): boolean {
  // Hashtags must be alphanumeric (no spaces, special chars except underscore)
  return /^[a-zA-Z0-9_]+$/.test(tag);
}

/**
 * Format hashtags for a post
 */
export function formatHashtagsForPost(
  hashtags: Hashtag[],
  platform: Platform,
  inline: boolean = false
): string {
  const tags = hashtags.map((h) => `#${h.tag}`);

  if (platform === "linkedin" || inline) {
    // LinkedIn and inline mode: add hashtags at the end on new line
    return tags.join(" ");
  }

  // Instagram/TikTok: put on separate line
  return "\n\n" + tags.join(" ");
}
