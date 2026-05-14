/**
 * @fileoverview Platform Character Optimizer - Smart content truncation
 * @module lib/platform-character-optimizer
 *
 * Intelligently truncates and optimizes content for platform-specific
 * character limits while preserving meaning, hashtags, and CTAs.
 *
 * @example
 * ```typescript
 * import { optimizeForPlatform, PlatformLimits } from './platform-character-optimizer';
 *
 * const long = "This is a very long post...";
 * const optimized = optimizeForPlatform(long, 'twitter');
 * // Returns: truncated version with preserved hashtags and ellipsis
 * ```
 */

export type Platform =
  | "twitter"
  | "linkedin"
  | "facebook"
  | "instagram"
  | "threads"
  | "mastodon"
  | "bluesky";

export interface CharacterLimits {
  max: number;
  optimalMin: number;
  optimalMax: number;
  hashtagLimit?: number;
}

export const PLATFORM_LIMITS: Record<Platform, CharacterLimits> = {
  twitter: {
    max: 280,
    optimalMin: 100,
    optimalMax: 240,
    hashtagLimit: 2,
  },
  linkedin: {
    max: 3000,
    optimalMin: 150,
    optimalMax: 1500,
    hashtagLimit: 5,
  },
  facebook: {
    max: 63206,
    optimalMin: 40,
    optimalMax: 500,
    hashtagLimit: 3,
  },
  instagram: {
    max: 2200,
    optimalMin: 125,
    optimalMax: 500,
    hashtagLimit: 30,
  },
  threads: {
    max: 500,
    optimalMin: 100,
    optimalMax: 400,
    hashtagLimit: 3,
  },
  mastodon: {
    max: 500,
    optimalMin: 100,
    optimalMax: 400,
    hashtagLimit: 5,
  },
  bluesky: {
    max: 300,
    optimalMin: 100,
    optimalMax: 250,
    hashtagLimit: 3,
  },
};

export interface OptimizationResult {
  original: string;
  optimized: string;
  characterCount: number;
  truncated: boolean;
  hashtagsPreserved: string[];
  ctaPreserved: boolean;
  metadata: {
    platform: Platform;
    limit: number;
    efficiency: number; // 0-1, how well it uses available space
  };
}

/**
 * Extract hashtags from text
 */
export function extractHashtags(text: string): string[] {
  const hashtagRegex = /#[\w]+/g;
  const matches = text.match(hashtagRegex);
  return matches ? [...new Set(matches)] : [];
}

/**
 * Extract URLs from text
 */
export function extractURLs(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex);
  return matches || [];
}

/**
 * Detect call-to-action phrases
 */
export function detectCTA(text: string): string | null {
  const ctaPatterns = [
    /click (here|link|below)/i,
    /learn more/i,
    /sign up/i,
    /get started/i,
    /try (it |now |today )?free/i,
    /download (now|today)?/i,
    /join (us|now|today)/i,
    /visit (our |my )?website/i,
    /check (it )?out/i,
    /read more/i,
    /subscribe/i,
  ];

  for (const pattern of ctaPatterns) {
    const match = text.match(pattern);
    if (match) {
      // Extract sentence containing CTA
      const sentences = text.split(/[.!?]+/);
      for (const sentence of sentences) {
        if (pattern.test(sentence)) {
          return sentence.trim();
        }
      }
    }
  }

  return null;
}

/**
 * Find optimal truncation point (prioritize sentence boundaries)
 */
export function findTruncationPoint(text: string, maxLength: number): number {
  if (text.length <= maxLength) {
    return text.length;
  }

  // Try to truncate at sentence boundary
  const beforeLimit = text.substring(0, maxLength);
  const sentenceEnd = Math.max(
    beforeLimit.lastIndexOf(". "),
    beforeLimit.lastIndexOf("! "),
    beforeLimit.lastIndexOf("? ")
  );

  if (sentenceEnd > maxLength * 0.7) {
    // If we can preserve 70%+, use sentence boundary
    return sentenceEnd + 1;
  }

  // Otherwise, truncate at word boundary
  const wordEnd = beforeLimit.lastIndexOf(" ");
  if (wordEnd > maxLength * 0.8) {
    return wordEnd;
  }

  // Last resort: hard truncate
  return maxLength - 3; // Leave room for ellipsis
}

/**
 * Intelligently truncate content for platform limits
 */
export function smartTruncate(
  text: string,
  maxLength: number,
  preserveElements: {
    hashtags?: string[];
    cta?: string;
    urls?: string[];
  } = {}
): string {
  // Calculate required space for preserved elements
  const hashtagSpace =
    preserveElements.hashtags?.reduce((sum, tag) => sum + tag.length + 1, 0) || 0;
  const ctaSpace = preserveElements.cta ? preserveElements.cta.length + 1 : 0;
  const urlSpace =
    preserveElements.urls?.reduce((sum, url) => sum + url.length + 1, 0) || 0;

  const ellipsisSpace = 3; // "..."
  const reservedSpace = hashtagSpace + ctaSpace + urlSpace + ellipsisSpace;
  const availableSpace = maxLength - reservedSpace;

  if (availableSpace < 50) {
    // Not enough space, just hard truncate
    return text.substring(0, maxLength - 3) + "...";
  }

  // Remove preserved elements from text before truncation
  let workingText = text;

  if (preserveElements.hashtags) {
    for (const tag of preserveElements.hashtags) {
      workingText = workingText.replace(tag, "").trim();
    }
  }

  if (preserveElements.cta) {
    workingText = workingText.replace(preserveElements.cta, "").trim();
  }

  if (preserveElements.urls) {
    for (const url of preserveElements.urls) {
      workingText = workingText.replace(url, "").trim();
    }
  }

  // Truncate main text
  const truncPoint = findTruncationPoint(workingText, availableSpace);
  let result = workingText.substring(0, truncPoint).trim();

  // Add ellipsis if truncated
  if (truncPoint < workingText.length) {
    result += "...";
  }

  // Reattach preserved elements
  if (preserveElements.cta) {
    result += " " + preserveElements.cta;
  }

  if (preserveElements.urls && preserveElements.urls.length > 0) {
    result += " " + preserveElements.urls.join(" ");
  }

  if (preserveElements.hashtags && preserveElements.hashtags.length > 0) {
    result += " " + preserveElements.hashtags.join(" ");
  }

  return result.trim();
}

/**
 * Optimize content for specific platform
 */
export function optimizeForPlatform(
  text: string,
  platform: Platform,
  options: {
    preserveHashtags?: boolean;
    preserveCTA?: boolean;
    preserveURLs?: boolean;
    maxHashtags?: number;
  } = {}
): OptimizationResult {
  const limits = PLATFORM_LIMITS[platform];
  const originalLength = text.length;

  // Set defaults
  const preserveHashtags = options.preserveHashtags ?? true;
  const preserveCTA = options.preserveCTA ?? true;
  const preserveURLs = options.preserveURLs ?? true;

  // Extract elements to preserve
  const hashtags = preserveHashtags ? extractHashtags(text) : [];
  const maxHashtags = options.maxHashtags || limits.hashtagLimit || hashtags.length;
  const limitedHashtags = hashtags.slice(0, maxHashtags);

  const cta = preserveCTA ? detectCTA(text) : null;
  const urls = preserveURLs ? extractURLs(text) : [];

  // Check if truncation needed
  if (originalLength <= limits.max) {
    return {
      original: text,
      optimized: text,
      characterCount: originalLength,
      truncated: false,
      hashtagsPreserved: limitedHashtags,
      ctaPreserved: cta !== null,
      metadata: {
        platform,
        limit: limits.max,
        efficiency: originalLength / limits.optimalMax,
      },
    };
  }

  // Perform smart truncation
  const optimized = smartTruncate(text, limits.max, {
    hashtags: limitedHashtags,
    cta: cta || undefined,
    urls,
  });

  return {
    original: text,
    optimized,
    characterCount: optimized.length,
    truncated: true,
    hashtagsPreserved: limitedHashtags,
    ctaPreserved: cta !== null,
    metadata: {
      platform,
      limit: limits.max,
      efficiency: optimized.length / limits.optimalMax,
    },
  };
}

/**
 * Optimize content for multiple platforms simultaneously
 */
export function optimizeForMultiplePlatforms(
  text: string,
  platforms: Platform[],
  options: {
    preserveHashtags?: boolean;
    preserveCTA?: boolean;
    preserveURLs?: boolean;
  } = {}
): Record<Platform, OptimizationResult> {
  const results: Partial<Record<Platform, OptimizationResult>> = {};

  for (const platform of platforms) {
    results[platform] = optimizeForPlatform(text, platform, options);
  }

  return results as Record<Platform, OptimizationResult>;
}

/**
 * Suggest optimal platform based on content length and characteristics
 */
export interface PlatformSuggestion {
  platform: Platform;
  reason: string;
  fit: "perfect" | "good" | "fair" | "poor";
  truncationRequired: boolean;
}

export function suggestPlatforms(text: string): PlatformSuggestion[] {
  const length = text.length;
  const hashtags = extractHashtags(text);
  const hasMedia = /\.(jpg|jpeg|png|gif|mp4|mov)/i.test(text);
  const suggestions: PlatformSuggestion[] = [];

  for (const [platformName, limits] of Object.entries(PLATFORM_LIMITS)) {
    const platform = platformName as Platform;
    const truncationRequired = length > limits.max;

    let fit: "perfect" | "good" | "fair" | "poor";
    let reason: string;

    if (length <= limits.optimalMax && length >= limits.optimalMin) {
      fit = "perfect";
      reason = "Content length is in optimal range for engagement";
    } else if (length <= limits.max && length < limits.optimalMin) {
      fit = "good";
      reason = "Content is shorter than optimal but acceptable";
    } else if (length <= limits.max) {
      fit = "good";
      reason = "Content fits within limits";
    } else if (length <= limits.max * 1.2) {
      fit = "fair";
      reason = "Minor truncation needed";
    } else {
      fit = "poor";
      reason = "Significant truncation required";
    }

    // Special case for Instagram (great for images)
    if (platform === "instagram" && hasMedia) {
      if (fit === "good") fit = "perfect";
      reason += " (visual content platform)";
    }

    // Special case for LinkedIn (professional long-form)
    if (platform === "linkedin" && length > 500 && length < 2000) {
      fit = "perfect";
      reason = "Ideal length for professional insights";
    }

    // Hashtag considerations
    if (hashtags.length > (limits.hashtagLimit || 10)) {
      if (fit === "perfect") fit = "good";
      reason += ` (reduce hashtags to ${limits.hashtagLimit})`;
    }

    suggestions.push({
      platform,
      reason,
      fit,
      truncationRequired,
    });
  }

  // Sort by fit quality
  const fitOrder = { perfect: 0, good: 1, fair: 2, poor: 3 };
  suggestions.sort((a, b) => fitOrder[a.fit] - fitOrder[b.fit]);

  return suggestions;
}
