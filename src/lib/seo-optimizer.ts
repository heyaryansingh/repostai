/**
 * SEO Optimizer for Social Media Content
 *
 * Optimizes repurposed content for search and discovery:
 * - Keyword density analysis
 * - Hashtag relevance scoring
 * - Title/headline optimization
 * - Meta description generation
 * - Link preview optimization
 */

export interface SEOMetrics {
  score: number; // 0-100
  keywordDensity: Record<string, number>;
  titleScore: number;
  readabilityScore: number;
  hashtagRelevance: number;
  recommendations: string[];
  optimizedVersion?: {
    title?: string;
    description?: string;
    hashtags?: string[];
  };
}

export interface ContentKeywords {
  primary: string[];
  secondary: string[];
  longtail: string[];
}

/**
 * Analyze SEO quality of social media content
 */
export function analyzeContentSEO(
  content: string,
  targetKeywords: string[] = [],
  platform: 'twitter' | 'linkedin' | 'instagram' = 'twitter'
): SEOMetrics {
  const keywordDensity = calculateKeywordDensity(content, targetKeywords);
  const titleScore = content.includes('\n') ? scoreTitleQuality(content.split('\n')[0]) : 0;
  const readabilityScore = calculateReadability(content);
  const hashtagRelevance = scoreHashtagRelevance(content, targetKeywords);
  const recommendations = generateSEORecommendations(
    content,
    keywordDensity,
    titleScore,
    readabilityScore,
    hashtagRelevance,
    platform
  );

  const score = calculateOverallSEOScore(titleScore, readabilityScore, hashtagRelevance, keywordDensity);

  const optimizedVersion = generateOptimizedVersion(content, recommendations, platform);

  return {
    score,
    keywordDensity,
    titleScore,
    readabilityScore,
    hashtagRelevance,
    recommendations,
    optimizedVersion,
  };
}

/**
 * Calculate keyword density for target keywords
 */
function calculateKeywordDensity(content: string, keywords: string[]): Record<string, number> {
  const lowerContent = content.toLowerCase();
  const words = lowerContent.split(/\s+/);
  const totalWords = words.length;

  const density: Record<string, number> = {};

  for (const keyword of keywords) {
    const lowerKeyword = keyword.toLowerCase();
    const occurrences = (lowerContent.match(new RegExp(lowerKeyword, 'gi')) || []).length;
    density[keyword] = totalWords > 0 ? (occurrences / totalWords) * 100 : 0;
  }

  return density;
}

/**
 * Score title/headline quality
 */
function scoreTitleQuality(title: string): number {
  let score = 0;

  // Length check (50-60 chars is optimal for SEO)
  const length = title.length;
  if (length >= 50 && length <= 60) {
    score += 30;
  } else if (length >= 40 && length <= 70) {
    score += 20;
  } else if (length >= 30 && length <= 80) {
    score += 10;
  }

  // Has numbers (5, 10, etc.)
  if (/\d+/.test(title)) {
    score += 15;
  }

  // Has power words
  const powerWords = ['ultimate', 'essential', 'complete', 'proven', 'simple', 'effective', 'powerful'];
  const hasPowerWord = powerWords.some(word => title.toLowerCase().includes(word));
  if (hasPowerWord) {
    score += 15;
  }

  // Starts with action verb or question
  const actionVerbs = ['discover', 'learn', 'master', 'unlock', 'boost', 'improve', 'increase'];
  const startsWithAction = actionVerbs.some(verb => title.toLowerCase().startsWith(verb));
  const isQuestion = title.trim().endsWith('?');
  if (startsWithAction || isQuestion) {
    score += 20;
  }

  // Contains emotional trigger
  const emotionalWords = ['secret', 'surprising', 'shocking', 'amazing', 'incredible', 'revolutionary'];
  const hasEmotion = emotionalWords.some(word => title.toLowerCase().includes(word));
  if (hasEmotion) {
    score += 10;
  }

  // Capitalization (title case or sentence case)
  const isProperlyCapitalized = /^[A-Z]/.test(title) && !/[A-Z]{2,}/.test(title.slice(1));
  if (isProperlyCapitalized) {
    score += 10;
  }

  return Math.min(100, score);
}

/**
 * Calculate readability score (Flesch-Kincaid inspired)
 */
function calculateReadability(content: string): number {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = content.split(/\s+/);
  const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0);

  if (sentences.length === 0 || words.length === 0) {
    return 0;
  }

  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;

  // Simplified Flesch Reading Ease
  const readingEase = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;

  // Convert to 0-100 scale (higher is better)
  return Math.max(0, Math.min(100, readingEase));
}

/**
 * Count syllables in a word (approximation)
 */
function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length === 0) return 0;

  const vowels = 'aeiouy';
  let count = 0;
  let previousWasVowel = false;

  for (let i = 0; i < word.length; i++) {
    const isVowel = vowels.includes(word[i]);
    if (isVowel && !previousWasVowel) {
      count++;
    }
    previousWasVowel = isVowel;
  }

  // Adjust for silent e
  if (word.endsWith('e')) {
    count--;
  }

  return Math.max(1, count);
}

/**
 * Score hashtag relevance
 */
function scoreHashtagRelevance(content: string, targetKeywords: string[]): number {
  const hashtags = content.match(/#\w+/g) || [];

  if (hashtags.length === 0) {
    return 0;
  }

  let score = 0;

  // Check hashtag count (3-5 is optimal for most platforms)
  if (hashtags.length >= 3 && hashtags.length <= 5) {
    score += 30;
  } else if (hashtags.length >= 2 && hashtags.length <= 7) {
    score += 20;
  }

  // Check relevance to target keywords
  const relevantHashtags = hashtags.filter(tag => {
    const tagText = tag.slice(1).toLowerCase();
    return targetKeywords.some(keyword => {
      const keywordLower = keyword.toLowerCase();
      return tagText.includes(keywordLower) || keywordLower.includes(tagText);
    });
  });

  const relevanceRatio = hashtags.length > 0 ? relevantHashtags.length / hashtags.length : 0;
  score += relevanceRatio * 40;

  // Check hashtag length (not too long)
  const avgHashtagLength = hashtags.reduce((sum, tag) => sum + tag.length, 0) / hashtags.length;
  if (avgHashtagLength <= 15) {
    score += 15;
  } else if (avgHashtagLength <= 20) {
    score += 10;
  }

  // Check for trending format (CamelCase)
  const camelCaseCount = hashtags.filter(tag => /^#[A-Z][a-z]+([A-Z][a-z]+)+$/.test(tag)).length;
  if (camelCaseCount > 0) {
    score += 15;
  }

  return Math.min(100, score);
}

/**
 * Calculate overall SEO score
 */
function calculateOverallSEOScore(
  titleScore: number,
  readabilityScore: number,
  hashtagRelevance: number,
  keywordDensity: Record<string, number>
): number {
  // Weighted average
  const weights = {
    title: 0.3,
    readability: 0.25,
    hashtag: 0.25,
    keyword: 0.2,
  };

  // Keyword density score (2-5% is optimal)
  const densityValues = Object.values(keywordDensity);
  const avgDensity = densityValues.length > 0 ? densityValues.reduce((sum, d) => sum + d, 0) / densityValues.length : 0;
  let keywordScore = 0;
  if (avgDensity >= 2 && avgDensity <= 5) {
    keywordScore = 100;
  } else if (avgDensity >= 1 && avgDensity <= 7) {
    keywordScore = 70;
  } else if (avgDensity > 0) {
    keywordScore = 40;
  }

  const score =
    titleScore * weights.title +
    readabilityScore * weights.readability +
    hashtagRelevance * weights.hashtag +
    keywordScore * weights.keyword;

  return Math.round(score);
}

/**
 * Generate SEO recommendations
 */
function generateSEORecommendations(
  content: string,
  keywordDensity: Record<string, number>,
  titleScore: number,
  readabilityScore: number,
  hashtagRelevance: number,
  platform: string
): string[] {
  const recommendations: string[] = [];

  // Title recommendations
  if (titleScore < 50) {
    recommendations.push('Improve title: add numbers, power words, or make it a question');
  }
  if (content.split('\n')[0]?.length > 70) {
    recommendations.push('Shorten title to 50-60 characters for better visibility');
  }

  // Readability recommendations
  if (readabilityScore < 50) {
    recommendations.push('Simplify language: use shorter sentences and common words');
  }

  // Keyword density recommendations
  const densityValues = Object.values(keywordDensity);
  const avgDensity = densityValues.length > 0 ? densityValues.reduce((sum, d) => sum + d, 0) / densityValues.length : 0;
  if (avgDensity < 1) {
    recommendations.push('Increase keyword usage (target 2-5% density)');
  } else if (avgDensity > 7) {
    recommendations.push('Reduce keyword stuffing (currently over 7% density)');
  }

  // Hashtag recommendations
  const hashtags = content.match(/#\w+/g) || [];
  if (platform === 'instagram' && hashtags.length < 5) {
    recommendations.push('Add more hashtags for Instagram (optimal: 8-11)');
  } else if (platform === 'twitter' && hashtags.length > 2) {
    recommendations.push('Reduce hashtags for Twitter (optimal: 1-2)');
  } else if (platform === 'linkedin' && hashtags.length < 3) {
    recommendations.push('Add 3-5 relevant hashtags for LinkedIn');
  }

  if (hashtagRelevance < 50) {
    recommendations.push('Use hashtags more relevant to your target keywords');
  }

  // Platform-specific recommendations
  if (platform === 'twitter' && content.length > 280) {
    recommendations.push('Split into thread - first tweet should be under 280 chars');
  }

  if (platform === 'linkedin' && content.length < 150) {
    recommendations.push('Expand content - LinkedIn posts perform better with 150+ words');
  }

  return recommendations;
}

/**
 * Generate optimized version with improvements
 */
function generateOptimizedVersion(
  content: string,
  recommendations: string[],
  platform: string
): SEOMetrics['optimizedVersion'] {
  const optimized: SEOMetrics['optimizedVersion'] = {};

  // Extract current title
  const lines = content.split('\n');
  const currentTitle = lines[0] || '';

  // Optimize title if needed
  if (recommendations.some(r => r.includes('title'))) {
    optimized.title = optimizeTitle(currentTitle);
  }

  // Generate meta description
  optimized.description = generateMetaDescription(content);

  // Optimize hashtags
  if (recommendations.some(r => r.includes('hashtag'))) {
    optimized.hashtags = optimizeHashtags(content, platform);
  }

  return optimized;
}

/**
 * Optimize title
 */
function optimizeTitle(title: string): string {
  let optimized = title;

  // Add numbers if missing
  if (!/\d/.test(optimized)) {
    optimized = `5 ${optimized}`;
  }

  // Ensure proper capitalization
  optimized = optimized.charAt(0).toUpperCase() + optimized.slice(1);

  // Trim to optimal length
  if (optimized.length > 60) {
    optimized = optimized.slice(0, 57) + '...';
  }

  return optimized;
}

/**
 * Generate meta description
 */
function generateMetaDescription(content: string): string {
  // Take first 150 characters, break at word boundary
  const preview = content.replace(/#\w+/g, '').trim().slice(0, 150);
  const lastSpace = preview.lastIndexOf(' ');
  return lastSpace > 0 ? preview.slice(0, lastSpace) + '...' : preview + '...';
}

/**
 * Optimize hashtags based on platform
 */
function optimizeHashtags(content: string, platform: string): string[] {
  const existingHashtags = content.match(/#\w+/g) || [];

  // Platform-specific hashtag counts
  const targetCount = platform === 'instagram' ? 10 : platform === 'linkedin' ? 5 : 2;

  // If we have too many, trim to best ones
  if (existingHashtags.length > targetCount) {
    return existingHashtags.slice(0, targetCount);
  }

  // If too few, return existing (caller should add more)
  return existingHashtags;
}

/**
 * Extract keywords from content using TF-IDF-like approach
 */
export function extractKeywords(content: string, topN: number = 10): ContentKeywords {
  // Remove common words
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'should', 'could', 'can', 'may', 'might', 'must', 'this', 'that', 'these', 'those',
  ]);

  const words = content
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word));

  // Count frequencies
  const freq: Record<string, number> = {};
  words.forEach(word => {
    freq[word] = (freq[word] || 0) + 1;
  });

  // Sort by frequency
  const sorted = Object.entries(freq).sort(([, a], [, b]) => b - a);

  // Categorize
  const primary = sorted.slice(0, 3).map(([word]) => word);
  const secondary = sorted.slice(3, 8).map(([word]) => word);
  const longtail = sorted.slice(8, topN).map(([word]) => word);

  return { primary, secondary, longtail };
}
