/**
 * Content quality analysis utilities for RepostAI.
 *
 * Analyzes input content quality and provides recommendations
 * for optimal social media repurposing results.
 */

export interface ContentQualityScore {
  overall: number; // 0-100
  readability: number;
  structure: number;
  length: number;
  engagement: number;
  recommendations: string[];
}

export interface ContentMetrics {
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  avgWordsPerSentence: number;
  avgSentencesPerParagraph: number;
  hasHeadings: boolean;
  hasList: boolean;
  hasLinks: boolean;
  estimatedReadingTimeMinutes: number;
}

/**
 * Calculate Flesch Reading Ease score.
 *
 * Score interpretation:
 * - 90-100: Very Easy (5th grade)
 * - 80-89: Easy (6th grade)
 * - 70-79: Fairly Easy (7th grade)
 * - 60-69: Standard (8th-9th grade)
 * - 50-59: Fairly Difficult (10th-12th grade)
 * - 30-49: Difficult (College)
 * - 0-29: Very Difficult (College graduate)
 *
 * @param text - Text to analyze
 * @returns Reading ease score (0-100)
 */
export function calculateReadabilityScore(text: string): number {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const syllables = words.reduce((count, word) => count + countSyllables(word), 0);

  if (words.length === 0 || sentences.length === 0) {
    return 0;
  }

  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;

  // Flesch Reading Ease formula
  const score = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;

  // Clamp to 0-100
  return Math.max(0, Math.min(100, score));
}

/**
 * Count syllables in a word (simplified heuristic).
 *
 * @param word - Word to analyze
 * @returns Estimated syllable count
 */
function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');

  if (word.length <= 3) {
    return 1;
  }

  // Count vowel groups
  const vowels = word.match(/[aeiouy]+/g);
  let count = vowels ? vowels.length : 1;

  // Adjust for silent e
  if (word.endsWith('e')) {
    count--;
  }

  // Adjust for le ending
  if (word.endsWith('le') && word.length > 2 && !/[aeiouy]/.test(word[word.length - 3])) {
    count++;
  }

  return Math.max(1, count);
}

/**
 * Extract content metrics from text.
 *
 * @param content - Content to analyze
 * @returns Content metrics
 */
export function extractContentMetrics(content: string): ContentMetrics {
  const words = content.split(/\s+/).filter(w => w.length > 0);
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0);

  const wordCount = words.length;
  const sentenceCount = sentences.length;
  const paragraphCount = paragraphs.length;

  const avgWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0;
  const avgSentencesPerParagraph = paragraphCount > 0 ? sentenceCount / paragraphCount : 0;

  const hasHeadings = /^#+\s/m.test(content) || /<h[1-6]>/i.test(content);
  const hasList = /^[\*\-\d+\.]\s/m.test(content) || /<[uo]l>/i.test(content);
  const hasLinks = /https?:\/\//.test(content) || /<a\s/i.test(content);

  // Average reading speed: 200-250 words per minute
  const estimatedReadingTimeMinutes = Math.ceil(wordCount / 225);

  return {
    wordCount,
    sentenceCount,
    paragraphCount,
    avgWordsPerSentence,
    avgSentencesPerParagraph,
    hasHeadings,
    hasList,
    hasLinks,
    estimatedReadingTimeMinutes,
  };
}

/**
 * Analyze content quality and provide recommendations.
 *
 * @param content - Content to analyze
 * @returns Quality score and recommendations
 *
 * @example
 * ```typescript
 * const analysis = analyzeContentQuality(blogPost);
 * if (analysis.overall < 70) {
 *   console.log('Recommendations:', analysis.recommendations);
 * }
 * ```
 */
export function analyzeContentQuality(content: string): ContentQualityScore {
  const metrics = extractContentMetrics(content);
  const readability = calculateReadabilityScore(content);

  const recommendations: string[] = [];
  let structureScore = 100;
  let lengthScore = 100;
  let engagementScore = 100;

  // Readability scoring (higher is better for social media)
  let readabilityScore = readability;
  if (readability < 50) {
    recommendations.push('Content is difficult to read. Simplify sentences for better social media engagement.');
    readabilityScore = readability * 0.8; // Penalty for low readability
  } else if (readability > 80) {
    recommendations.push('Excellent readability! Content will perform well on social media.');
  }

  // Structure scoring
  if (!metrics.hasHeadings && metrics.wordCount > 300) {
    structureScore -= 20;
    recommendations.push('Add headings to break up long content.');
  }

  if (!metrics.hasList && metrics.wordCount > 500) {
    structureScore -= 15;
    recommendations.push('Consider adding bullet points or numbered lists for scannability.');
  }

  if (metrics.avgSentencesPerParagraph > 8) {
    structureScore -= 10;
    recommendations.push('Paragraphs are too long. Break them into smaller chunks.');
  }

  if (metrics.avgWordsPerSentence > 25) {
    structureScore -= 10;
    recommendations.push('Sentences are too long. Aim for 15-20 words per sentence.');
  }

  // Length scoring
  if (metrics.wordCount < 100) {
    lengthScore = 40;
    recommendations.push('Content is very short. Add more substance for better repurposing.');
  } else if (metrics.wordCount < 300) {
    lengthScore = 70;
    recommendations.push('Content is short. Consider adding more details or examples.');
  } else if (metrics.wordCount > 2000) {
    lengthScore = 85;
    recommendations.push('Content is quite long. AI will extract key points for social posts.');
  } else {
    lengthScore = 100;
  }

  // Engagement scoring
  if (!metrics.hasLinks) {
    engagementScore -= 10;
    recommendations.push('Consider adding relevant links to increase engagement potential.');
  }

  if (metrics.paragraphCount < 3 && metrics.wordCount > 300) {
    engagementScore -= 15;
    recommendations.push('Break content into more paragraphs for better readability.');
  }

  // Overall score (weighted average)
  const overall = Math.round(
    readabilityScore * 0.3 +
    structureScore * 0.3 +
    lengthScore * 0.2 +
    engagementScore * 0.2
  );

  return {
    overall,
    readability: Math.round(readabilityScore),
    structure: structureScore,
    length: lengthScore,
    engagement: engagementScore,
    recommendations: recommendations.slice(0, 5), // Limit to top 5
  };
}

/**
 * Estimate how many social posts can be generated from content.
 *
 * @param content - Content to analyze
 * @returns Estimated number of posts per platform
 */
export function estimatePostGeneration(content: string): {
  twitter: number;
  linkedin: number;
  instagram: number;
  quotes: number;
} {
  const metrics = extractContentMetrics(content);

  // Twitter threads: ~1 tweet per 50-75 words
  const twitter = Math.max(3, Math.min(20, Math.ceil(metrics.wordCount / 60)));

  // LinkedIn: Usually 1-2 posts
  const linkedin = metrics.wordCount > 800 ? 2 : 1;

  // Instagram: Usually 1 caption
  const instagram = 1;

  // Quotes: ~1 per 100-150 words
  const quotes = Math.min(10, Math.ceil(metrics.wordCount / 125));

  return { twitter, linkedin, instagram, quotes };
}

/**
 * Detect content language (simplified).
 *
 * @param text - Text to analyze
 * @returns Detected language code or 'unknown'
 */
export function detectLanguage(text: string): string {
  // Simple heuristic based on common words
  const sample = text.toLowerCase().slice(0, 500);

  const englishWords = ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it'];
  const spanishWords = ['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'ser', 'se'];
  const frenchWords = ['le', 'de', 'un', 'être', 'et', 'à', 'il', 'avoir', 'ne', 'je'];

  let englishCount = 0;
  let spanishCount = 0;
  let frenchCount = 0;

  englishWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    englishCount += (sample.match(regex) || []).length;
  });

  spanishWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    spanishCount += (sample.match(regex) || []).length;
  });

  frenchWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    frenchCount += (sample.match(regex) || []).length;
  });

  const max = Math.max(englishCount, spanishCount, frenchCount);

  if (max === 0) return 'unknown';
  if (max === englishCount) return 'en';
  if (max === spanishCount) return 'es';
  if (max === frenchCount) return 'fr';

  return 'unknown';
}
