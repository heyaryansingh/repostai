/**
 * Content variation generation for A/B testing and audience targeting.
 *
 * Provides utilities to:
 * - Generate multiple variations of social media content
 * - Adapt content tone for different audience segments
 * - Create headline/hook variations
 * - Test different CTAs and formatting
 *
 * @module content-variations
 */

export type ToneVariation = 'professional' | 'casual' | 'witty' | 'educational' | 'inspirational' | 'urgency';
export type AudienceSegment = 'executives' | 'professionals' | 'creators' | 'students' | 'general';
export type Platform = 'twitter' | 'linkedin' | 'instagram' | 'facebook' | 'threads';

export interface ContentVariation {
  id: string;
  originalContent: string;
  variations: VariationSet[];
  metadata: VariationMetadata;
}

export interface VariationSet {
  variationId: string;
  tone: ToneVariation;
  audience: AudienceSegment;
  platform: Platform;
  content: string;
  hooks: string[];
  ctas: string[];
  hashtags?: string[];
  estimatedEngagement: number;
}

export interface VariationMetadata {
  generatedAt: Date;
  baseWordCount: number;
  totalVariations: number;
  targetPlatforms: Platform[];
}

/**
 * Generate multiple content variations for A/B testing.
 *
 * @param content - Original content to vary
 * @param options - Variation generation options
 * @returns Set of content variations optimized for different scenarios
 *
 * @example
 * ```ts
 * const variations = await generateVariations(
 *   'Check out our new AI writing tool',
 *   {
 *     tones: ['professional', 'casual'],
 *     audiences: ['executives', 'creators'],
 *     platforms: ['linkedin', 'twitter'],
 *     includeHooks: true,
 *     includeCTAs: true,
 *   }
 * );
 *
 * for (const variation of variations) {
 *   console.log(`${variation.tone} for ${variation.audience}:`);
 *   console.log(variation.content);
 * }
 * ```
 */
export async function generateVariations(
  content: string,
  options: {
    tones?: ToneVariation[];
    audiences?: AudienceSegment[];
    platforms?: Platform[];
    includeHooks?: boolean;
    includeCTAs?: boolean;
    includeHashtags?: boolean;
    count?: number;
  }
): Promise<VariationSet[]> {
  const {
    tones = ['professional', 'casual'],
    audiences = ['general'],
    platforms = ['twitter', 'linkedin'],
    includeHooks = true,
    includeCTAs = true,
    includeHashtags = false,
    count = 10,
  } = options;

  const variations: VariationSet[] = [];

  // Generate combinations
  for (const tone of tones) {
    for (const audience of audiences) {
      for (const platform of platforms) {
        if (variations.length >= count) break;

        const variation = await generateSingleVariation(content, {
          tone,
          audience,
          platform,
          includeHooks,
          includeCTAs,
          includeHashtags,
        });

        variations.push(variation);
      }
    }
  }

  return variations;
}

/**
 * Generate a single content variation with specified parameters.
 */
async function generateSingleVariation(
  content: string,
  params: {
    tone: ToneVariation;
    audience: AudienceSegment;
    platform: Platform;
    includeHooks: boolean;
    includeCTAs: boolean;
    includeHashtags: boolean;
  }
): Promise<VariationSet> {
  const { tone, audience, platform, includeHooks, includeCTAs, includeHashtags } = params;

  // Apply tone transformation
  const tonedContent = applyTone(content, tone);

  // Adapt for audience
  const audienceContent = adaptForAudience(tonedContent, audience);

  // Format for platform
  const platformContent = formatForPlatform(audienceContent, platform);

  // Generate hooks
  const hooks = includeHooks ? generateHooks(content, tone, platform) : [];

  // Generate CTAs
  const ctas = includeCTAs ? generateCTAs(tone, audience, platform) : [];

  // Generate hashtags
  const hashtags = includeHashtags ? generateHashtags(content, platform) : [];

  // Estimate engagement (simplified heuristic)
  const estimatedEngagement = estimateEngagement(platformContent, {
    tone,
    audience,
    platform,
    hasHooks: hooks.length > 0,
    hasCTAs: ctas.length > 0,
    hasHashtags: hashtags.length > 0,
  });

  return {
    variationId: `var_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    tone,
    audience,
    platform,
    content: platformContent,
    hooks,
    ctas,
    hashtags: hashtags.length > 0 ? hashtags : undefined,
    estimatedEngagement,
  };
}

/**
 * Apply tone transformation to content.
 */
function applyTone(content: string, tone: ToneVariation): string {
  const toneTransforms: Record<ToneVariation, (c: string) => string> = {
    professional: (c) => {
      // More formal language, industry terminology
      return c
        .replace(/awesome/gi, 'excellent')
        .replace(/cool/gi, 'innovative')
        .replace(/check out/gi, 'explore')
        .replace(/!/g, '.');
    },
    casual: (c) => {
      // Conversational, relatable
      return c
        .replace(/utilize/gi, 'use')
        .replace(/demonstrate/gi, 'show')
        .replace(/\./g, (match, offset) => {
          // Add some excitement
          return Math.random() > 0.7 && offset > 20 ? '!' : '.';
        });
    },
    witty: (c) => {
      // Add personality and humor
      const wittyPhrases = [
        'Plot twist: ',
        'Spoiler alert: ',
        'Here\'s the thing: ',
        'Real talk: ',
      ];
      const prefix = wittyPhrases[Math.floor(Math.random() * wittyPhrases.length)];
      return prefix + c;
    },
    educational: (c) => {
      // Informative, structured
      return `Did you know? ${c}\n\nKey takeaway: [Extract main point]`;
    },
    inspirational: (c) => {
      // Motivational, uplifting
      const inspirationalStart = [
        'Imagine this: ',
        'What if ',
        'Transform your approach: ',
      ];
      const prefix = inspirationalStart[Math.floor(Math.random() * inspirationalStart.length)];
      return prefix + c;
    },
    urgency: (c) => {
      // Time-sensitive, action-oriented
      const urgencyWords = ['Now', 'Today', 'Limited time', 'Don\'t miss'];
      const word = urgencyWords[Math.floor(Math.random() * urgencyWords.length)];
      return `${word}: ${c}`;
    },
  };

  return toneTransforms[tone](content);
}

/**
 * Adapt content for specific audience segment.
 */
function adaptForAudience(content: string, audience: AudienceSegment): string {
  const audienceAdaptations: Record<AudienceSegment, (c: string) => string> = {
    executives: (c) => {
      // Focus on ROI, strategic value
      return `Strategic insight: ${c}\n\nImpact on your business metrics: [ROI/efficiency gains]`;
    },
    professionals: (c) => {
      // Practical, career-focused
      return `For professionals: ${c}\n\nHow this improves your workflow: [benefit]`;
    },
    creators: (c) => {
      // Creative angle, community focus
      return `Creator tip: ${c}\n\nGrow your craft with this: [creative benefit]`;
    },
    students: (c) => {
      // Learning-oriented, accessible
      return `Learning opportunity: ${c}\n\nSkill you'll gain: [educational value]`;
    },
    general: (c) => {
      // Broad appeal
      return c;
    },
  };

  return audienceAdaptations[audience](content);
}

/**
 * Format content for specific platform constraints.
 */
function formatForPlatform(content: string, platform: Platform): string {
  const platformFormats: Record<Platform, (c: string) => string> = {
    twitter: (c) => {
      // Twitter: 280 chars, thread-friendly
      const maxLength = 280;
      if (c.length <= maxLength) return c;

      // Create thread
      const sentences = c.match(/[^.!?]+[.!?]+/g) || [c];
      const tweets: string[] = [];
      let current = '';

      for (const sentence of sentences) {
        if ((current + sentence).length <= maxLength - 10) {
          current += sentence;
        } else {
          if (current) tweets.push(current.trim());
          current = sentence;
        }
      }
      if (current) tweets.push(current.trim());

      return tweets
        .map((tweet, i) => `${i + 1}/ ${tweet}`)
        .join('\n\n');
    },
    linkedin: (c) => {
      // LinkedIn: professional, longer-form
      return `${c}\n\n---\n\nWhat are your thoughts? Share in the comments below. 👇`;
    },
    instagram: (c) => {
      // Instagram: visual-first, emoji-heavy
      const withEmojis = c
        .replace(/\./g, '. ✨')
        .replace(/!/g, '! 🚀');
      return `${withEmojis}\n\n[Add relevant image/carousel]\n\n#SaveForLater 📌`;
    },
    facebook: (c) => {
      // Facebook: community-focused
      return `${c}\n\nTag someone who needs to see this! 👥`;
    },
    threads: (c) => {
      // Threads: casual, conversational
      return `${c}\n\nYour take? Reply below 💬`;
    },
  };

  return platformFormats[platform](content);
}

/**
 * Generate attention-grabbing hooks for content.
 */
function generateHooks(content: string, tone: ToneVariation, platform: Platform): string[] {
  const hooks: string[] = [];

  const baseHooks: Record<ToneVariation, string[]> = {
    professional: [
      'Key insight:',
      'Industry update:',
      'Data-driven perspective:',
      'Strategic analysis:',
    ],
    casual: [
      'Hot take:',
      'Real talk:',
      'Here\'s the thing:',
      'Quick thought:',
    ],
    witty: [
      'Plot twist:',
      'Unpopular opinion:',
      'Fun fact:',
      'Confession time:',
    ],
    educational: [
      'Did you know?',
      'Quick lesson:',
      'Pro tip:',
      'TIL (Today I Learned):',
    ],
    inspirational: [
      'Imagine this:',
      'Transform your:',
      'Unlock your potential:',
      'Start your journey:',
    ],
    urgency: [
      'Don\'t miss:',
      'Limited time:',
      'Act now:',
      'Final chance:',
    ],
  };

  // Platform-specific hooks
  if (platform === 'twitter' || platform === 'threads') {
    hooks.push('🧵 Thread:', '💡 Insight:', '⚡ Quick take:');
  } else if (platform === 'linkedin') {
    hooks.push('📊 Analysis:', '🎯 Strategy:', '💼 Business insight:');
  } else if (platform === 'instagram') {
    hooks.push('✨ Inspo:', '📸 Behind the scenes:', '💫 Creator tip:');
  }

  // Add tone-specific hooks
  hooks.push(...(baseHooks[tone] || baseHooks.casual));

  return hooks.slice(0, 5); // Return top 5
}

/**
 * Generate effective CTAs (Call-To-Actions).
 */
function generateCTAs(tone: ToneVariation, audience: AudienceSegment, platform: Platform): string[] {
  const ctas: string[] = [];

  const baseCTAs = {
    soft: [
      'Learn more',
      'Discover how',
      'Explore this',
      'Read more',
    ],
    medium: [
      'Get started today',
      'Try it now',
      'Join us',
      'Take action',
    ],
    strong: [
      'Start your free trial',
      'Sign up now',
      'Claim your spot',
      'Don\'t wait',
    ],
  };

  // Select CTA strength based on tone
  const ctaStrength =
    tone === 'urgency' ? 'strong' :
    tone === 'professional' ? 'medium' :
    'soft';

  ctas.push(...baseCTAs[ctaStrength]);

  // Platform-specific CTAs
  if (platform === 'twitter' || platform === 'threads') {
    ctas.push('Reply with your thoughts', 'Retweet if you agree', 'Follow for more');
  } else if (platform === 'linkedin') {
    ctas.push('Connect with me', 'Comment below', 'Share with your network');
  } else if (platform === 'instagram') {
    ctas.push('Save this post', 'Share to your story', 'DM me for details');
  }

  return ctas.slice(0, 4);
}

/**
 * Generate platform-optimized hashtags.
 */
function generateHashtags(content: string, platform: Platform): string[] {
  // Simplified hashtag generation
  // In production, this would use NLP/keyword extraction

  const platformLimits: Record<Platform, number> = {
    twitter: 2,
    linkedin: 5,
    instagram: 30,
    facebook: 3,
    threads: 2,
  };

  const limit = platformLimits[platform];

  // Extract potential keywords (simplified)
  const words = content
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 4);

  const hashtags = words
    .slice(0, limit)
    .map((w) => `#${w.charAt(0).toUpperCase()}${w.slice(1)}`);

  return hashtags;
}

/**
 * Estimate engagement potential (simplified scoring).
 */
function estimateEngagement(
  content: string,
  factors: {
    tone: ToneVariation;
    audience: AudienceSegment;
    platform: Platform;
    hasHooks: boolean;
    hasCTAs: boolean;
    hasHashtags: boolean;
  }
): number {
  let score = 50; // Base score

  // Tone adjustments
  if (factors.tone === 'witty' || factors.tone === 'inspirational') score += 15;
  if (factors.tone === 'urgency') score += 10;

  // Platform adjustments
  if (factors.platform === 'instagram' || factors.platform === 'threads') score += 10;

  // Content elements
  if (factors.hasHooks) score += 15;
  if (factors.hasCTAs) score += 10;
  if (factors.hasHashtags) score += 5;

  // Length considerations
  const wordCount = content.split(/\s+/).length;
  if (wordCount >= 50 && wordCount <= 150) score += 10; // Sweet spot

  // Emoji usage (simple heuristic)
  const emojiCount = (content.match(/[\u{1F600}-\u{1F64F}]/gu) || []).length;
  if (emojiCount > 0 && emojiCount <= 3) score += 5;

  // Cap at 100
  return Math.min(100, score);
}

/**
 * Compare variation performance and recommend best.
 *
 * @param variations - Array of variation sets to compare
 * @returns Ranked variations with recommendations
 *
 * @example
 * ```ts
 * const ranked = rankVariations(variations);
 * console.log(`Best variation: ${ranked[0].variationId}`);
 * console.log(`Score: ${ranked[0].estimatedEngagement}`);
 * ```
 */
export function rankVariations(variations: VariationSet[]): VariationSet[] {
  return [...variations].sort((a, b) => b.estimatedEngagement - a.estimatedEngagement);
}

/**
 * Get recommended variation for specific goal.
 *
 * @param variations - Available variations
 * @param goal - Optimization goal (engagement, reach, conversions)
 * @returns Best variation for the goal
 *
 * @example
 * ```ts
 * const best = getRecommendedVariation(variations, 'engagement');
 * console.log(`Use this for max engagement: ${best.content}`);
 * ```
 */
export function getRecommendedVariation(
  variations: VariationSet[],
  goal: 'engagement' | 'reach' | 'conversions'
): VariationSet | null {
  if (variations.length === 0) return null;

  const goalWeights: Record<typeof goal, Partial<Record<ToneVariation, number>>> = {
    engagement: {
      witty: 1.3,
      inspirational: 1.2,
      casual: 1.1,
    },
    reach: {
      urgency: 1.2,
      professional: 1.1,
    },
    conversions: {
      urgency: 1.3,
      professional: 1.2,
    },
  };

  const weights = goalWeights[goal];

  const scored = variations.map((v) => ({
    ...v,
    adjustedScore: v.estimatedEngagement * (weights[v.tone] || 1.0),
  }));

  return scored.sort((a, b) => b.adjustedScore - a.adjustedScore)[0];
}
