/**
 * @fileoverview Content Analytics and Performance Tracking
 * @module lib/content-analytics
 *
 * Provides utilities for analyzing content characteristics, estimating
 * engagement potential, and tracking repurposing statistics.
 *
 * @example
 * ```typescript
 * import { analyzeContent, estimateEngagement, getContentStats } from './content-analytics';
 *
 * const analysis = analyzeContent(content);
 * console.log(`Readability: ${analysis.readability.score}`);
 *
 * const engagement = estimateEngagement(analysis, 'linkedin');
 * console.log(`Estimated engagement: ${engagement.score}/100`);
 * ```
 */

import type { Platform, ToneOption } from './openai';

export interface ContentAnalysis {
  /** Word count */
  wordCount: number;
  /** Character count */
  charCount: number;
  /** Sentence count */
  sentenceCount: number;
  /** Paragraph count */
  paragraphCount: number;
  /** Estimated reading time in minutes */
  readingTimeMinutes: number;
  /** Readability metrics */
  readability: ReadabilityScore;
  /** Key topics extracted */
  topics: string[];
  /** Detected content type */
  contentType: ContentType;
  /** Sentiment analysis */
  sentiment: SentimentScore;
  /** Structure analysis */
  structure: StructureAnalysis;
}

export interface ReadabilityScore {
  /** Overall readability score (0-100, higher = easier to read) */
  score: number;
  /** Grade level (US school grade) */
  gradeLevel: number;
  /** Description of the readability level */
  description: string;
  /** Average words per sentence */
  avgWordsPerSentence: number;
  /** Average syllables per word */
  avgSyllablesPerWord: number;
}

export type ContentType =
  | 'article'
  | 'blog_post'
  | 'tutorial'
  | 'opinion'
  | 'news'
  | 'listicle'
  | 'how_to'
  | 'case_study'
  | 'review'
  | 'unknown';

export interface SentimentScore {
  /** Overall sentiment (-1 to 1) */
  polarity: number;
  /** Sentiment label */
  label: 'positive' | 'negative' | 'neutral';
  /** Confidence in the assessment (0-1) */
  confidence: number;
}

export interface StructureAnalysis {
  /** Has clear introduction */
  hasIntroduction: boolean;
  /** Has clear conclusion */
  hasConclusion: boolean;
  /** Number of headings */
  headingCount: number;
  /** Number of lists */
  listCount: number;
  /** Number of code blocks */
  codeBlockCount: number;
  /** Number of links */
  linkCount: number;
}

export interface EngagementEstimate {
  /** Overall engagement score (0-100) */
  score: number;
  /** Breakdown by factor */
  factors: {
    readability: number;
    length: number;
    structure: number;
    sentiment: number;
  };
  /** Platform-specific recommendations */
  recommendations: string[];
  /** Estimated reach multiplier */
  reachMultiplier: number;
}

export interface ContentStats {
  /** Total content pieces processed */
  totalProcessed: number;
  /** Breakdown by platform */
  byPlatform: Record<Platform, number>;
  /** Breakdown by tone */
  byTone: Record<ToneOption, number>;
  /** Average content length */
  avgWordCount: number;
  /** Average readability score */
  avgReadability: number;
  /** Most common topics */
  topTopics: Array<{ topic: string; count: number }>;
}

// Constants for analysis
const WORDS_PER_MINUTE = 200;

const POSITIVE_WORDS = new Set([
  'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'best',
  'love', 'happy', 'success', 'successful', 'improve', 'benefit', 'easy',
  'powerful', 'effective', 'efficient', 'innovative', 'perfect', 'awesome'
]);

const NEGATIVE_WORDS = new Set([
  'bad', 'worst', 'terrible', 'horrible', 'awful', 'poor', 'fail', 'failure',
  'difficult', 'hard', 'problem', 'issue', 'error', 'wrong', 'mistake',
  'frustrating', 'annoying', 'broken', 'useless', 'waste'
]);

const TOPIC_KEYWORDS: Record<string, string[]> = {
  'technology': ['tech', 'software', 'app', 'digital', 'ai', 'machine learning', 'data'],
  'business': ['business', 'company', 'startup', 'enterprise', 'market', 'revenue', 'growth'],
  'marketing': ['marketing', 'brand', 'campaign', 'audience', 'engagement', 'content', 'social'],
  'productivity': ['productivity', 'workflow', 'efficiency', 'time', 'manage', 'organize', 'task'],
  'development': ['code', 'developer', 'programming', 'api', 'framework', 'build', 'deploy'],
  'design': ['design', 'ux', 'ui', 'user experience', 'interface', 'visual', 'creative'],
  'leadership': ['leadership', 'team', 'manage', 'lead', 'strategy', 'vision', 'culture'],
  'finance': ['finance', 'money', 'investment', 'budget', 'cost', 'profit', 'revenue'],
};

/**
 * Analyze content characteristics
 *
 * @param content - The text content to analyze
 * @returns Comprehensive content analysis
 *
 * @example
 * ```typescript
 * const analysis = analyzeContent(blogPost);
 * console.log(`Reading time: ${analysis.readingTimeMinutes} minutes`);
 * ```
 */
export function analyzeContent(content: string): ContentAnalysis {
  const cleanContent = content.trim();
  const words = cleanContent.split(/\s+/).filter(w => w.length > 0);
  const sentences = cleanContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const paragraphs = cleanContent.split(/\n\n+/).filter(p => p.trim().length > 0);

  const wordCount = words.length;
  const charCount = cleanContent.length;
  const sentenceCount = sentences.length;
  const paragraphCount = paragraphs.length;

  const readingTimeMinutes = Math.ceil(wordCount / WORDS_PER_MINUTE);

  return {
    wordCount,
    charCount,
    sentenceCount,
    paragraphCount,
    readingTimeMinutes,
    readability: calculateReadability(words, sentences),
    topics: extractTopics(cleanContent),
    contentType: detectContentType(cleanContent),
    sentiment: analyzeSentiment(words),
    structure: analyzeStructure(cleanContent),
  };
}

/**
 * Calculate readability metrics
 */
function calculateReadability(words: string[], sentences: string[]): ReadabilityScore {
  const wordCount = words.length;
  const sentenceCount = sentences.length || 1;

  const avgWordsPerSentence = wordCount / sentenceCount;

  // Estimate syllables (simplified)
  const totalSyllables = words.reduce((sum, word) => sum + countSyllables(word), 0);
  const avgSyllablesPerWord = totalSyllables / wordCount || 1;

  // Flesch Reading Ease formula
  const fleschScore = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
  const score = Math.max(0, Math.min(100, fleschScore));

  // Flesch-Kincaid Grade Level
  const gradeLevel = Math.max(1, Math.min(16,
    (0.39 * avgWordsPerSentence) + (11.8 * avgSyllablesPerWord) - 15.59
  ));

  return {
    score: Math.round(score),
    gradeLevel: Math.round(gradeLevel),
    description: getReadabilityDescription(score),
    avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
    avgSyllablesPerWord: Math.round(avgSyllablesPerWord * 100) / 100,
  };
}

/**
 * Count syllables in a word (approximation)
 */
function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;

  const vowels = 'aeiouy';
  let count = 0;
  let prevWasVowel = false;

  for (const char of word) {
    const isVowel = vowels.includes(char);
    if (isVowel && !prevWasVowel) {
      count++;
    }
    prevWasVowel = isVowel;
  }

  // Adjust for silent 'e'
  if (word.endsWith('e') && count > 1) {
    count--;
  }

  return Math.max(1, count);
}

/**
 * Get readability description based on score
 */
function getReadabilityDescription(score: number): string {
  if (score >= 90) return 'Very easy to read';
  if (score >= 80) return 'Easy to read';
  if (score >= 70) return 'Fairly easy to read';
  if (score >= 60) return 'Standard';
  if (score >= 50) return 'Fairly difficult';
  if (score >= 30) return 'Difficult';
  return 'Very difficult';
}

/**
 * Extract main topics from content
 */
function extractTopics(content: string): string[] {
  const lowerContent = content.toLowerCase();
  const topics: string[] = [];

  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    const matches = keywords.filter(kw => lowerContent.includes(kw)).length;
    if (matches >= 2) {
      topics.push(topic);
    }
  }

  return topics.slice(0, 5);
}

/**
 * Detect content type based on patterns
 */
function detectContentType(content: string): ContentType {
  const lower = content.toLowerCase();

  if (/^\d+\.\s/.test(content) || /^-\s/.test(content)) {
    return 'listicle';
  }
  if (lower.includes('step 1') || lower.includes('how to ')) {
    return 'how_to';
  }
  if (lower.includes('tutorial') || lower.includes('learn how')) {
    return 'tutorial';
  }
  if (lower.includes('case study') || lower.includes('we implemented')) {
    return 'case_study';
  }
  if (lower.includes('review') || lower.includes('pros and cons')) {
    return 'review';
  }
  if (lower.includes('breaking') || lower.includes('announced today')) {
    return 'news';
  }
  if (lower.includes('i think') || lower.includes('in my opinion')) {
    return 'opinion';
  }

  return 'article';
}

/**
 * Analyze sentiment of content
 */
function analyzeSentiment(words: string[]): SentimentScore {
  let positive = 0;
  let negative = 0;

  for (const word of words) {
    const lower = word.toLowerCase().replace(/[^a-z]/g, '');
    if (POSITIVE_WORDS.has(lower)) positive++;
    if (NEGATIVE_WORDS.has(lower)) negative++;
  }

  const total = positive + negative;
  if (total === 0) {
    return { polarity: 0, label: 'neutral', confidence: 0.5 };
  }

  const polarity = (positive - negative) / total;
  const confidence = Math.min(1, total / words.length * 10);

  return {
    polarity: Math.round(polarity * 100) / 100,
    label: polarity > 0.1 ? 'positive' : polarity < -0.1 ? 'negative' : 'neutral',
    confidence: Math.round(confidence * 100) / 100,
  };
}

/**
 * Analyze content structure
 */
function analyzeStructure(content: string): StructureAnalysis {
  const lines = content.split('\n');

  // Check for headings (markdown style)
  const headingCount = lines.filter(l => /^#{1,6}\s/.test(l)).length;

  // Check for lists
  const listCount = lines.filter(l => /^[-*]\s|^\d+\.\s/.test(l.trim())).length;

  // Check for code blocks
  const codeBlockCount = (content.match(/```/g) || []).length / 2;

  // Check for links
  const linkCount = (content.match(/\[([^\]]+)\]\([^)]+\)/g) || []).length +
                    (content.match(/https?:\/\/\S+/g) || []).length;

  // Check introduction (first paragraph mentions topic broadly)
  const firstParagraph = content.split('\n\n')[0] || '';
  const hasIntroduction = firstParagraph.length > 100;

  // Check conclusion (last paragraph has summary words)
  const paragraphs = content.split('\n\n');
  const lastParagraph = paragraphs[paragraphs.length - 1] || '';
  const conclusionWords = ['conclusion', 'summary', 'finally', 'in conclusion', 'to sum up'];
  const hasConclusion = conclusionWords.some(w => lastParagraph.toLowerCase().includes(w));

  return {
    hasIntroduction,
    hasConclusion,
    headingCount,
    listCount,
    codeBlockCount,
    linkCount,
  };
}

/**
 * Estimate engagement potential for a platform
 *
 * @param analysis - Content analysis from analyzeContent()
 * @param platform - Target platform
 * @returns Engagement estimate with recommendations
 *
 * @example
 * ```typescript
 * const engagement = estimateEngagement(analysis, 'twitter');
 * console.log(`Recommendations: ${engagement.recommendations.join(', ')}`);
 * ```
 */
export function estimateEngagement(
  analysis: ContentAnalysis,
  platform: Platform
): EngagementEstimate {
  const recommendations: string[] = [];

  // Platform-specific optimal ranges
  const optimalLengths: Record<Platform, { min: number; max: number }> = {
    twitter: { min: 100, max: 500 },
    linkedin: { min: 500, max: 1500 },
    instagram: { min: 100, max: 300 },
    summary: { min: 50, max: 150 },
  };

  // Calculate length score
  const { min, max } = optimalLengths[platform];
  let lengthScore: number;
  if (analysis.wordCount < min) {
    lengthScore = (analysis.wordCount / min) * 100;
    recommendations.push(`Content may be too short for ${platform}. Consider adding more detail.`);
  } else if (analysis.wordCount > max * 2) {
    lengthScore = 50;
    recommendations.push(`Content is long. Focus on key points for ${platform}.`);
  } else if (analysis.wordCount > max) {
    lengthScore = 75;
  } else {
    lengthScore = 100;
  }

  // Readability score
  const readabilityScore = analysis.readability.score;
  if (readabilityScore < 60) {
    recommendations.push('Consider simplifying language for broader appeal.');
  }

  // Structure score
  let structureScore = 50;
  if (analysis.structure.hasIntroduction) structureScore += 15;
  if (analysis.structure.hasConclusion) structureScore += 15;
  if (analysis.structure.headingCount > 0) structureScore += 10;
  if (analysis.structure.listCount > 0) structureScore += 10;
  structureScore = Math.min(100, structureScore);

  if (!analysis.structure.hasConclusion) {
    recommendations.push('Add a clear call-to-action or conclusion.');
  }

  // Sentiment score (positive content performs better)
  let sentimentScore: number;
  if (analysis.sentiment.label === 'positive') {
    sentimentScore = 80 + (analysis.sentiment.polarity * 20);
  } else if (analysis.sentiment.label === 'negative') {
    sentimentScore = 50 + (analysis.sentiment.polarity * 30);
    recommendations.push('Consider balancing negative points with solutions or positive takeaways.');
  } else {
    sentimentScore = 60;
    recommendations.push('Adding emotional appeal may increase engagement.');
  }

  // Calculate overall score
  const weights = {
    readability: 0.25,
    length: 0.25,
    structure: 0.25,
    sentiment: 0.25,
  };

  const overallScore = Math.round(
    readabilityScore * weights.readability +
    lengthScore * weights.length +
    structureScore * weights.structure +
    sentimentScore * weights.sentiment
  );

  // Calculate reach multiplier
  const reachMultiplier = 1 + (overallScore - 50) / 100;

  return {
    score: overallScore,
    factors: {
      readability: Math.round(readabilityScore),
      length: Math.round(lengthScore),
      structure: Math.round(structureScore),
      sentiment: Math.round(sentimentScore),
    },
    recommendations: recommendations.slice(0, 3),
    reachMultiplier: Math.round(reachMultiplier * 100) / 100,
  };
}

/**
 * Format content analysis as readable summary
 *
 * @param analysis - Content analysis to format
 * @returns Human-readable summary string
 */
export function formatAnalysisSummary(analysis: ContentAnalysis): string {
  const lines = [
    '=== Content Analysis ===',
    '',
    'Metrics:',
    `  Words: ${analysis.wordCount.toLocaleString()}`,
    `  Sentences: ${analysis.sentenceCount}`,
    `  Reading time: ${analysis.readingTimeMinutes} min`,
    '',
    'Readability:',
    `  Score: ${analysis.readability.score}/100 (${analysis.readability.description})`,
    `  Grade level: ${analysis.readability.gradeLevel}`,
    '',
    `Content type: ${analysis.contentType.replace('_', ' ')}`,
    `Sentiment: ${analysis.sentiment.label} (${analysis.sentiment.polarity > 0 ? '+' : ''}${analysis.sentiment.polarity})`,
    '',
    'Structure:',
    `  Headings: ${analysis.structure.headingCount}`,
    `  Lists: ${analysis.structure.listCount}`,
    `  Links: ${analysis.structure.linkCount}`,
  ];

  if (analysis.topics.length > 0) {
    lines.push('');
    lines.push(`Topics: ${analysis.topics.join(', ')}`);
  }

  return lines.join('\n');
}
