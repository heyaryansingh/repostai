/**
 * Engagement Predictor
 *
 * Predicts social media post engagement based on content features,
 * timing, platform characteristics, and historical patterns.
 *
 * @module engagement-predictor
 * @example
 * ```typescript
 * import { predictEngagement, EngagementPrediction } from './engagement-predictor';
 *
 * const prediction = predictEngagement({
 *   content: "Just launched our new feature! Check it out 🚀",
 *   platform: "twitter",
 *   postTime: new Date(),
 *   hashtags: ["launch", "product"],
 * });
 *
 * console.log(`Expected engagement: ${prediction.engagementScore}`);
 * ```
 */

/**
 * Supported social media platforms.
 */
export type Platform = 'twitter' | 'linkedin' | 'instagram' | 'facebook' | 'tiktok';

/**
 * Content type classification.
 */
export type ContentType =
  | 'educational'
  | 'promotional'
  | 'entertaining'
  | 'news'
  | 'personal'
  | 'question'
  | 'announcement';

/**
 * Input parameters for engagement prediction.
 */
export interface PredictionInput {
  /** Post content text */
  content: string;
  /** Target platform */
  platform: Platform;
  /** Scheduled post time */
  postTime: Date;
  /** Hashtags to include */
  hashtags?: string[];
  /** Whether post includes media */
  hasMedia?: boolean;
  /** Media type if included */
  mediaType?: 'image' | 'video' | 'carousel' | 'link';
  /** Account follower count (for scaling) */
  followerCount?: number;
  /** Historical average engagement rate */
  avgEngagementRate?: number;
}

/**
 * Engagement prediction result.
 */
export interface EngagementPrediction {
  /** Overall engagement score (0-100) */
  engagementScore: number;
  /** Confidence level in prediction (0-1) */
  confidence: number;
  /** Predicted engagement metrics */
  metrics: {
    likes: { min: number; expected: number; max: number };
    comments: { min: number; expected: number; max: number };
    shares: { min: number; expected: number; max: number };
    reach: { min: number; expected: number; max: number };
  };
  /** Factors contributing to score */
  factors: EngagementFactor[];
  /** Suggestions for improvement */
  suggestions: string[];
  /** Best alternative post time */
  optimalPostTime: Date;
  /** Detected content type */
  contentType: ContentType;
}

/**
 * Individual factor affecting engagement.
 */
export interface EngagementFactor {
  /** Factor name */
  name: string;
  /** Impact on engagement (-1 to 1) */
  impact: number;
  /** Weight of this factor */
  weight: number;
  /** Description of the factor */
  description: string;
}

/**
 * Platform-specific engagement characteristics.
 */
const PLATFORM_CHARACTERISTICS: Record<
  Platform,
  {
    optimalLength: { min: number; max: number; ideal: number };
    hashtagLimit: number;
    peakHours: number[];
    peakDays: number[]; // 0 = Sunday
    mediaBoost: number;
    videoBoost: number;
    emojiImpact: number;
    questionBoost: number;
    avgEngagementRate: number;
  }
> = {
  twitter: {
    optimalLength: { min: 71, max: 280, ideal: 100 },
    hashtagLimit: 3,
    peakHours: [9, 12, 17, 20],
    peakDays: [2, 3, 4], // Tue, Wed, Thu
    mediaBoost: 0.35,
    videoBoost: 0.5,
    emojiImpact: 0.15,
    questionBoost: 0.25,
    avgEngagementRate: 0.045,
  },
  linkedin: {
    optimalLength: { min: 150, max: 1300, ideal: 700 },
    hashtagLimit: 5,
    peakHours: [7, 8, 12, 17, 18],
    peakDays: [2, 3, 4], // Tue, Wed, Thu
    mediaBoost: 0.4,
    videoBoost: 0.6,
    emojiImpact: 0.05,
    questionBoost: 0.3,
    avgEngagementRate: 0.038,
  },
  instagram: {
    optimalLength: { min: 70, max: 2200, ideal: 150 },
    hashtagLimit: 30,
    peakHours: [11, 13, 19, 21],
    peakDays: [1, 3, 4], // Mon, Wed, Thu
    mediaBoost: 0.0, // Always has media
    videoBoost: 0.45,
    emojiImpact: 0.2,
    questionBoost: 0.2,
    avgEngagementRate: 0.058,
  },
  facebook: {
    optimalLength: { min: 40, max: 500, ideal: 80 },
    hashtagLimit: 3,
    peakHours: [9, 13, 16, 19],
    peakDays: [3, 4, 5], // Wed, Thu, Fri
    mediaBoost: 0.3,
    videoBoost: 0.55,
    emojiImpact: 0.1,
    questionBoost: 0.25,
    avgEngagementRate: 0.025,
  },
  tiktok: {
    optimalLength: { min: 10, max: 150, ideal: 50 },
    hashtagLimit: 5,
    peakHours: [12, 15, 19, 21, 22],
    peakDays: [2, 4, 5], // Tue, Thu, Fri
    mediaBoost: 0.0, // Always video
    videoBoost: 0.0,
    emojiImpact: 0.15,
    questionBoost: 0.15,
    avgEngagementRate: 0.08,
  },
};

/**
 * Keywords indicating content types.
 */
const CONTENT_TYPE_KEYWORDS: Record<ContentType, string[]> = {
  educational: [
    'learn',
    'how to',
    'guide',
    'tutorial',
    'tips',
    'explained',
    'understand',
    'lesson',
    'course',
    'framework',
    'strategy',
  ],
  promotional: [
    'buy',
    'sale',
    'discount',
    'offer',
    'limited',
    'shop',
    'get yours',
    'order now',
    'available',
    'launching',
  ],
  entertaining: [
    'funny',
    'lol',
    'haha',
    'meme',
    'joke',
    'hilarious',
    'comedy',
    'laugh',
    'fun',
  ],
  news: [
    'breaking',
    'update',
    'just in',
    'announced',
    'reports',
    'news',
    'latest',
    'happening',
  ],
  personal: [
    'i think',
    'my experience',
    'personally',
    'feeling',
    'excited',
    'grateful',
    'proud',
    'journey',
  ],
  question: ['what do you', 'how do you', 'thoughts on', 'agree?', 'opinion', '?'],
  announcement: [
    'announcing',
    'introducing',
    'welcome',
    'new',
    'launch',
    'release',
    'coming soon',
  ],
};

/**
 * Detect content type from text.
 */
function detectContentType(content: string): ContentType {
  const lowerContent = content.toLowerCase();
  const scores: Record<ContentType, number> = {
    educational: 0,
    promotional: 0,
    entertaining: 0,
    news: 0,
    personal: 0,
    question: 0,
    announcement: 0,
  };

  for (const [type, keywords] of Object.entries(CONTENT_TYPE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerContent.includes(keyword)) {
        scores[type as ContentType]++;
      }
    }
  }

  // Check for question mark
  if (content.includes('?')) {
    scores.question += 2;
  }

  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) return 'personal';

  return Object.entries(scores).find(([, score]) => score === maxScore)?.[0] as ContentType;
}

/**
 * Calculate timing score based on post time.
 */
function calculateTimingScore(postTime: Date, platform: Platform): number {
  const chars = PLATFORM_CHARACTERISTICS[platform];
  const hour = postTime.getHours();
  const day = postTime.getDay();

  let score = 0.5; // Base score

  // Peak hour bonus
  const closestPeakHour = chars.peakHours.reduce((closest, peakHour) => {
    const diff = Math.abs(hour - peakHour);
    const closestDiff = Math.abs(hour - closest);
    return diff < closestDiff ? peakHour : closest;
  }, chars.peakHours[0]);

  const hourDiff = Math.abs(hour - closestPeakHour);
  score += Math.max(0, (3 - hourDiff) * 0.1); // Up to 0.3 bonus

  // Peak day bonus
  if (chars.peakDays.includes(day)) {
    score += 0.15;
  }

  // Weekend penalty for business platforms
  if ((day === 0 || day === 6) && (platform === 'linkedin')) {
    score -= 0.2;
  }

  return Math.max(0, Math.min(1, score));
}

/**
 * Calculate content quality score.
 */
function calculateContentScore(
  content: string,
  platform: Platform,
  hashtags: string[] = []
): { score: number; factors: EngagementFactor[] } {
  const chars = PLATFORM_CHARACTERISTICS[platform];
  const factors: EngagementFactor[] = [];
  let score = 0.5;

  // Length analysis
  const length = content.length;
  const { min, max, ideal } = chars.optimalLength;

  if (length >= min && length <= max) {
    const lengthScore = 1 - Math.abs(length - ideal) / ideal;
    const impact = (lengthScore - 0.5) * 0.3;
    score += impact;

    factors.push({
      name: 'Content Length',
      impact,
      weight: 0.15,
      description:
        length < ideal
          ? `Content is shorter than ideal (${length}/${ideal} chars)`
          : length > ideal
            ? `Content is longer than ideal (${length}/${ideal} chars)`
            : 'Content length is optimal',
    });
  } else {
    const impact = -0.15;
    score += impact;
    factors.push({
      name: 'Content Length',
      impact,
      weight: 0.15,
      description: `Content length (${length}) is outside optimal range (${min}-${max})`,
    });
  }

  // Hashtag analysis
  const hashtagCount = hashtags.length;
  if (hashtagCount > 0) {
    if (hashtagCount <= chars.hashtagLimit) {
      const impact = 0.1 * (hashtagCount / chars.hashtagLimit);
      score += impact;
      factors.push({
        name: 'Hashtags',
        impact,
        weight: 0.1,
        description: `Using ${hashtagCount} hashtags (optimal: 1-${chars.hashtagLimit})`,
      });
    } else {
      const impact = -0.1;
      score += impact;
      factors.push({
        name: 'Hashtags',
        impact,
        weight: 0.1,
        description: `Too many hashtags (${hashtagCount}/${chars.hashtagLimit})`,
      });
    }
  }

  // Emoji analysis
  const emojiCount = (content.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
  if (emojiCount > 0 && emojiCount <= 5) {
    const impact = chars.emojiImpact * Math.min(1, emojiCount / 3);
    score += impact;
    factors.push({
      name: 'Emojis',
      impact,
      weight: 0.08,
      description: `Using ${emojiCount} emoji(s) - adds visual appeal`,
    });
  } else if (emojiCount > 5) {
    const impact = -0.05;
    score += impact;
    factors.push({
      name: 'Emojis',
      impact,
      weight: 0.08,
      description: 'Too many emojis may reduce credibility',
    });
  }

  // Question analysis
  if (content.includes('?')) {
    const impact = chars.questionBoost;
    score += impact;
    factors.push({
      name: 'Question',
      impact,
      weight: 0.12,
      description: 'Questions encourage engagement and comments',
    });
  }

  // Call to action
  const ctaPatterns = [
    'comment below',
    'let me know',
    'share your',
    'what do you think',
    'tag someone',
    'follow for',
    'link in bio',
    'check out',
    'click',
  ];
  const hasCTA = ctaPatterns.some((cta) => content.toLowerCase().includes(cta));
  if (hasCTA) {
    const impact = 0.12;
    score += impact;
    factors.push({
      name: 'Call to Action',
      impact,
      weight: 0.1,
      description: 'Clear call to action increases engagement',
    });
  }

  // First person usage (authenticity)
  const firstPersonCount = (content.match(/\b(I|my|me|we|our)\b/gi) || []).length;
  if (firstPersonCount > 0 && platform !== 'linkedin') {
    const impact = 0.05;
    score += impact;
    factors.push({
      name: 'Personal Voice',
      impact,
      weight: 0.05,
      description: 'First-person language adds authenticity',
    });
  }

  return { score: Math.max(0, Math.min(1, score)), factors };
}

/**
 * Calculate media impact score.
 */
function calculateMediaScore(
  hasMedia: boolean,
  mediaType: string | undefined,
  platform: Platform
): { score: number; factor: EngagementFactor | null } {
  const chars = PLATFORM_CHARACTERISTICS[platform];

  if (!hasMedia) {
    if (platform === 'instagram' || platform === 'tiktok') {
      return {
        score: 0,
        factor: {
          name: 'Media',
          impact: -0.3,
          weight: 0.2,
          description: `${platform} posts require media content`,
        },
      };
    }
    return {
      score: 0,
      factor: {
        name: 'Media',
        impact: -0.1,
        weight: 0.15,
        description: 'Posts with media typically get higher engagement',
      },
    };
  }

  let boost = chars.mediaBoost;
  if (mediaType === 'video') {
    boost = Math.max(boost, chars.videoBoost);
  } else if (mediaType === 'carousel') {
    boost = boost * 1.2; // Carousels often perform well
  }

  return {
    score: boost,
    factor: {
      name: 'Media',
      impact: boost,
      weight: 0.2,
      description:
        mediaType === 'video'
          ? 'Video content typically has highest engagement'
          : mediaType === 'carousel'
            ? 'Carousel posts encourage swiping and time spent'
            : 'Visual content increases engagement',
    },
  };
}

/**
 * Find optimal posting time.
 */
function findOptimalPostTime(postTime: Date, platform: Platform): Date {
  const chars = PLATFORM_CHARACTERISTICS[platform];

  // Find next peak hour
  const currentHour = postTime.getHours();
  let nextPeakHour = chars.peakHours.find((h) => h > currentHour);

  const result = new Date(postTime);

  if (nextPeakHour === undefined) {
    // Move to next day's first peak hour
    nextPeakHour = chars.peakHours[0];
    result.setDate(result.getDate() + 1);
  }

  result.setHours(nextPeakHour, 0, 0, 0);

  // If not a peak day, find next peak day
  let currentDay = result.getDay();
  let daysToAdd = 0;

  while (!chars.peakDays.includes(currentDay) && daysToAdd < 7) {
    daysToAdd++;
    currentDay = (currentDay + 1) % 7;
  }

  if (daysToAdd > 0 && daysToAdd < 4) {
    result.setDate(result.getDate() + daysToAdd);
  }

  return result;
}

/**
 * Generate improvement suggestions.
 */
function generateSuggestions(
  input: PredictionInput,
  factors: EngagementFactor[]
): string[] {
  const suggestions: string[] = [];
  const chars = PLATFORM_CHARACTERISTICS[input.platform];

  // Check negative factors
  for (const factor of factors) {
    if (factor.impact < -0.05) {
      if (factor.name === 'Content Length') {
        if (input.content.length < chars.optimalLength.min) {
          suggestions.push(
            `Add more context to reach at least ${chars.optimalLength.min} characters`
          );
        } else if (input.content.length > chars.optimalLength.max) {
          suggestions.push(
            `Shorten content to under ${chars.optimalLength.max} characters`
          );
        }
      }
      if (factor.name === 'Hashtags') {
        suggestions.push(`Reduce hashtags to ${chars.hashtagLimit} or fewer`);
      }
      if (factor.name === 'Media') {
        suggestions.push('Add an image or video to boost engagement');
      }
    }
  }

  // Check missing positive factors
  const hasQuestion = factors.some((f) => f.name === 'Question' && f.impact > 0);
  const hasCTA = factors.some((f) => f.name === 'Call to Action' && f.impact > 0);

  if (!hasQuestion) {
    suggestions.push('Add a question to encourage comments');
  }

  if (!hasCTA) {
    suggestions.push('Include a clear call to action');
  }

  // Platform-specific suggestions
  if (input.platform === 'linkedin' && !input.content.includes('\n\n')) {
    suggestions.push('Use line breaks to improve readability on LinkedIn');
  }

  if (input.platform === 'instagram' && (!input.hashtags || input.hashtags.length < 5)) {
    suggestions.push('Instagram posts perform better with 5-15 relevant hashtags');
  }

  if (input.platform === 'twitter' && input.content.length > 200) {
    suggestions.push('Shorter tweets (under 100 chars) often get more engagement');
  }

  return suggestions.slice(0, 5); // Limit to 5 suggestions
}

/**
 * Estimate engagement metrics based on score and follower count.
 */
function estimateMetrics(
  engagementScore: number,
  followerCount: number,
  platform: Platform,
  avgEngagementRate?: number
): EngagementPrediction['metrics'] {
  const chars = PLATFORM_CHARACTERISTICS[platform];
  const baseRate = avgEngagementRate || chars.avgEngagementRate;

  // Adjust rate based on engagement score
  const adjustedRate = baseRate * (0.5 + engagementScore * 1.0);

  const expectedEngagements = followerCount * adjustedRate;

  // Platform-specific metric distribution
  const distributions: Record<Platform, { likes: number; comments: number; shares: number }> =
    {
      twitter: { likes: 0.6, comments: 0.15, shares: 0.25 },
      linkedin: { likes: 0.7, comments: 0.2, shares: 0.1 },
      instagram: { likes: 0.85, comments: 0.12, shares: 0.03 },
      facebook: { likes: 0.65, comments: 0.2, shares: 0.15 },
      tiktok: { likes: 0.75, comments: 0.15, shares: 0.1 },
    };

  const dist = distributions[platform];

  const likes = Math.round(expectedEngagements * dist.likes);
  const comments = Math.round(expectedEngagements * dist.comments);
  const shares = Math.round(expectedEngagements * dist.shares);

  // Reach estimate (typically 10-30% of followers see a post)
  const reachRate = 0.1 + engagementScore * 0.2;
  const reach = Math.round(followerCount * reachRate);

  const variance = 0.4; // 40% variance for min/max

  return {
    likes: {
      min: Math.round(likes * (1 - variance)),
      expected: likes,
      max: Math.round(likes * (1 + variance)),
    },
    comments: {
      min: Math.round(comments * (1 - variance)),
      expected: comments,
      max: Math.round(comments * (1 + variance)),
    },
    shares: {
      min: Math.round(shares * (1 - variance)),
      expected: shares,
      max: Math.round(shares * (1 + variance)),
    },
    reach: {
      min: Math.round(reach * (1 - variance)),
      expected: reach,
      max: Math.round(reach * (1 + variance)),
    },
  };
}

/**
 * Predict engagement for a social media post.
 *
 * @param input - Post parameters for prediction
 * @returns Engagement prediction with score, metrics, and suggestions
 */
export function predictEngagement(input: PredictionInput): EngagementPrediction {
  const factors: EngagementFactor[] = [];

  // Calculate component scores
  const timingScore = calculateTimingScore(input.postTime, input.platform);
  factors.push({
    name: 'Timing',
    impact: (timingScore - 0.5) * 0.4,
    weight: 0.2,
    description:
      timingScore > 0.6
        ? 'Good posting time for this platform'
        : 'Consider posting at a peak engagement time',
  });

  const { score: contentScore, factors: contentFactors } = calculateContentScore(
    input.content,
    input.platform,
    input.hashtags
  );
  factors.push(...contentFactors);

  const { score: mediaScore, factor: mediaFactor } = calculateMediaScore(
    input.hasMedia || false,
    input.mediaType,
    input.platform
  );
  if (mediaFactor) {
    factors.push(mediaFactor);
  }

  // Weighted combination
  const weights = {
    timing: 0.2,
    content: 0.5,
    media: 0.3,
  };

  const rawScore =
    timingScore * weights.timing +
    contentScore * weights.content +
    (0.5 + mediaScore) * weights.media;

  const engagementScore = Math.round(Math.max(0, Math.min(100, rawScore * 100)));

  // Calculate confidence based on input completeness
  let confidence = 0.6;
  if (input.followerCount) confidence += 0.1;
  if (input.avgEngagementRate) confidence += 0.1;
  if (input.hasMedia !== undefined) confidence += 0.1;
  if (input.hashtags && input.hashtags.length > 0) confidence += 0.1;

  const contentType = detectContentType(input.content);
  const optimalPostTime = findOptimalPostTime(input.postTime, input.platform);
  const suggestions = generateSuggestions(input, factors);
  const metrics = estimateMetrics(
    engagementScore / 100,
    input.followerCount || 1000,
    input.platform,
    input.avgEngagementRate
  );

  return {
    engagementScore,
    confidence: Math.min(1, confidence),
    metrics,
    factors: factors.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact)),
    suggestions,
    optimalPostTime,
    contentType,
  };
}

/**
 * Compare multiple content variations.
 *
 * @param variations - Array of content variations to compare
 * @param baseInput - Base input parameters (platform, time, etc.)
 * @returns Sorted predictions from best to worst
 */
export function compareVariations(
  variations: string[],
  baseInput: Omit<PredictionInput, 'content'>
): Array<{ content: string; prediction: EngagementPrediction; rank: number }> {
  const results = variations.map((content) => ({
    content,
    prediction: predictEngagement({ ...baseInput, content }),
  }));

  results.sort((a, b) => b.prediction.engagementScore - a.prediction.engagementScore);

  return results.map((r, i) => ({ ...r, rank: i + 1 }));
}
