/**
 * Viral content pattern detection
 *
 * Analyzes content for viral characteristics and patterns
 * based on successful posts across platforms.
 */

export interface ViralPattern {
  name: string;
  description: string;
  score: number; // 0-1
  examples: string[];
}

export interface ViralAnalysis {
  overallScore: number; // 0-100
  patterns: ViralPattern[];
  suggestions: string[];
  emotionalAppeal: number;
  shareability: number;
  clarity: number;
}

/**
 * Analyze content for viral potential
 */
export function analyzeViralPotential(content: string): ViralAnalysis {
  const patterns = detectPatterns(content);
  const emotionalAppeal = calculateEmotionalAppeal(content);
  const shareability = calculateShareability(content);
  const clarity = calculateClarity(content);

  // Overall score (weighted average)
  const overallScore =
    patterns.reduce((sum, p) => sum + p.score, 0) / patterns.length * 40 +
    emotionalAppeal * 30 +
    shareability * 20 +
    clarity * 10;

  const suggestions = generateSuggestions(patterns, emotionalAppeal, shareability, clarity);

  return {
    overallScore: Math.min(100, Math.max(0, overallScore)),
    patterns,
    suggestions,
    emotionalAppeal,
    shareability,
    clarity,
  };
}

/**
 * Detect viral patterns in content
 */
function detectPatterns(content: string): ViralPattern[] {
  const patterns: ViralPattern[] = [];

  // Pattern 1: Numbered lists
  if (hasNumberedList(content)) {
    patterns.push({
      name: 'Numbered List',
      description: 'Content includes actionable numbered steps or points',
      score: 0.8,
      examples: ['5 ways to...', '10 tips for...', '3 mistakes to avoid...'],
    });
  }

  // Pattern 2: How-to format
  if (isHowTo(content)) {
    patterns.push({
      name: 'How-To Format',
      description: 'Provides instructional or educational value',
      score: 0.85,
      examples: ['How to...', 'Guide to...', 'Learn how...'],
    });
  }

  // Pattern 3: Controversy/Contrarian
  if (isControversial(content)) {
    patterns.push({
      name: 'Contrarian Take',
      description: 'Challenges conventional wisdom or common beliefs',
      score: 0.75,
      examples: ['Actually...', 'Unpopular opinion:', 'Everyone is wrong about...'],
    });
  }

  // Pattern 4: Personal story
  if (hasPersonalStory(content)) {
    patterns.push({
      name: 'Personal Story',
      description: 'Includes relatable personal experience or anecdote',
      score: 0.9,
      examples: ['I learned...', 'My mistake was...', 'This happened to me...'],
    });
  }

  // Pattern 5: Strong hook
  if (hasStrongHook(content)) {
    patterns.push({
      name: 'Strong Hook',
      description: 'Compelling opening that grabs attention',
      score: 0.95,
      examples: ['You won\'t believe...', 'This changed everything...', 'Stop doing...'],
    });
  }

  // Pattern 6: Data/Statistics
  if (hasDataPoints(content)) {
    patterns.push({
      name: 'Data-Driven',
      description: 'Uses specific numbers, statistics, or research',
      score: 0.85,
      examples: ['Studies show...', '73% of...', 'Research proves...'],
    });
  }

  // Pattern 7: Emotional triggers
  if (hasEmotionalTriggers(content)) {
    patterns.push({
      name: 'Emotional Trigger',
      description: 'Evokes strong emotions (surprise, fear, joy)',
      score: 0.8,
      examples: ['Shocking...', 'Amazing...', 'Heartbreaking...'],
    });
  }

  // Pattern 8: Call-to-action
  if (hasCallToAction(content)) {
    patterns.push({
      name: 'Clear CTA',
      description: 'Includes specific call-to-action',
      score: 0.7,
      examples: ['Share if...', 'Tag someone...', 'Comment below...'],
    });
  }

  return patterns;
}

/**
 * Check for numbered lists
 */
function hasNumberedList(content: string): boolean {
  const numberedPatterns = [
    /\b\d+\s*(ways|tips|steps|reasons|things|mistakes|secrets)\b/i,
    /\b(top|best)\s+\d+\b/i,
    /^\d+[.)]/m, // Lines starting with numbers
  ];

  return numberedPatterns.some((pattern) => pattern.test(content));
}

/**
 * Check for how-to format
 */
function isHowTo(content: string): boolean {
  const howToPatterns = [
    /\bhow\s+to\b/i,
    /\bguide\s+to\b/i,
    /\blearn\s+how\b/i,
    /\bstep\s+by\s+step\b/i,
  ];

  return howToPatterns.some((pattern) => pattern.test(content));
}

/**
 * Check for controversial/contrarian content
 */
function isControversial(content: string): boolean {
  const controversialPatterns = [
    /\b(actually|unpopular\s+opinion|hot\s+take|controversial)\b/i,
    /\beveryone\s+is\s+wrong\b/i,
    /\bstop\s+(believing|doing|saying)\b/i,
    /\byou['']re\s+wrong\b/i,
  ];

  return controversialPatterns.some((pattern) => pattern.test(content));
}

/**
 * Check for personal story
 */
function hasPersonalStory(content: string): boolean {
  const storyPatterns = [
    /\b(I\s+learned|my\s+mistake|this\s+happened|I\s+discovered)\b/i,
    /\bwhen\s+I\b/i,
    /\bmy\s+(journey|experience|story)\b/i,
  ];

  return storyPatterns.some((pattern) => pattern.test(content));
}

/**
 * Check for strong hook
 */
function hasStrongHook(content: string): boolean {
  const lines = content.split('\n');
  const firstLine = lines[0].toLowerCase();

  const hookPatterns = [
    /\b(stop|never|always|everyone)\b/,
    /\bwon['']t\s+believe\b/,
    /\bthis\s+changed\b/,
    /\bsecret\b/,
    /\byou\s+need\s+to\b/,
  ];

  return hookPatterns.some((pattern) => pattern.test(firstLine));
}

/**
 * Check for data points
 */
function hasDataPoints(content: string): boolean {
  const dataPatterns = [
    /\b\d+%\b/, // Percentages
    /\b(study|research|data|survey)\s+(shows?|proves?|finds?)\b/i,
    /\baccording\s+to\b/i,
    /\b\d+\s+(times|years|months|days)\b/,
  ];

  return dataPatterns.some((pattern) => pattern.test(content));
}

/**
 * Check for emotional triggers
 */
function hasEmotionalTriggers(content: string): boolean {
  const emotionalWords = [
    'shocking',
    'amazing',
    'incredible',
    'unbelievable',
    'heartbreaking',
    'inspiring',
    'devastating',
    'miraculous',
    'terrifying',
    'hilarious',
  ];

  const contentLower = content.toLowerCase();
  return emotionalWords.some((word) => contentLower.includes(word));
}

/**
 * Check for call-to-action
 */
function hasCallToAction(content: string): boolean {
  const ctaPatterns = [
    /\b(share|comment|like|tag|subscribe|follow)\b/i,
    /\blet\s+me\s+know\b/i,
    /\bwhat\s+do\s+you\s+think\b/i,
    /\bclick\s+(here|link)\b/i,
  ];

  return ctaPatterns.some((pattern) => pattern.test(content));
}

/**
 * Calculate emotional appeal (0-100)
 */
function calculateEmotionalAppeal(content: string): number {
  let score = 0;

  // Emotional words
  const emotionalWords = content.match(/\b(love|hate|fear|joy|surprise|anger|sad|happy|excited)\b/gi);
  score += Math.min(20, (emotionalWords?.length || 0) * 5);

  // Exclamation marks (moderation is key)
  const exclamations = content.match(/!/g);
  const exclamationCount = exclamations?.length || 0;
  score += exclamationCount <= 3 ? exclamationCount * 5 : 10;

  // Questions (engagement)
  const questions = content.match(/\?/g);
  score += Math.min(15, (questions?.length || 0) * 5);

  // Personal pronouns
  const personal = content.match(/\b(I|you|we|my|your|our)\b/gi);
  score += Math.min(20, (personal?.length || 0) * 2);

  // Emotional triggers
  if (hasEmotionalTriggers(content)) {
    score += 30;
  }

  return Math.min(100, score);
}

/**
 * Calculate shareability (0-100)
 */
function calculateShareability(content: string): number {
  let score = 0;

  // Actionable content
  if (hasNumberedList(content)) score += 25;
  if (isHowTo(content)) score += 25;

  // Surprising/controversial
  if (isControversial(content)) score += 20;

  // Data-driven
  if (hasDataPoints(content)) score += 15;

  // Call-to-action
  if (hasCallToAction(content)) score += 15;

  return Math.min(100, score);
}

/**
 * Calculate clarity (0-100)
 */
function calculateClarity(content: string): number {
  let score = 100;

  const words = content.split(/\s+/);
  const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;

  // Penalize overly complex words
  if (avgWordLength > 6) score -= (avgWordLength - 6) * 5;

  const sentences = content.split(/[.!?]+/);
  const avgSentenceLength = words.length / sentences.length;

  // Penalize overly long sentences
  if (avgSentenceLength > 20) score -= (avgSentenceLength - 20) * 2;

  // Bonus for short paragraphs
  const paragraphs = content.split(/\n\n+/);
  const avgParaLength = content.length / paragraphs.length;
  if (avgParaLength < 200) score += 10;

  return Math.max(0, Math.min(100, score));
}

/**
 * Generate improvement suggestions
 */
function generateSuggestions(
  patterns: ViralPattern[],
  emotional: number,
  shareability: number,
  clarity: number
): string[] {
  const suggestions: string[] = [];

  if (!patterns.some((p) => p.name === 'Strong Hook')) {
    suggestions.push('Add a compelling hook in the first line to grab attention');
  }

  if (!patterns.some((p) => p.name === 'Numbered List')) {
    suggestions.push('Consider formatting key points as a numbered list');
  }

  if (emotional < 50) {
    suggestions.push('Incorporate more emotional language to increase engagement');
  }

  if (shareability < 60) {
    suggestions.push('Add a clear call-to-action to encourage sharing');
  }

  if (clarity < 70) {
    suggestions.push('Simplify language and shorten sentences for better readability');
  }

  if (!patterns.some((p) => p.name === 'Personal Story')) {
    suggestions.push('Include a personal anecdote to make content more relatable');
  }

  if (!patterns.some((p) => p.name === 'Data-Driven')) {
    suggestions.push('Add specific statistics or data points to increase credibility');
  }

  return suggestions;
}

/**
 * Get viral score breakdown
 */
export function getScoreBreakdown(analysis: ViralAnalysis): Record<string, number> {
  return {
    patterns: (analysis.patterns.reduce((sum, p) => sum + p.score, 0) / analysis.patterns.length) * 100,
    emotionalAppeal: analysis.emotionalAppeal,
    shareability: analysis.shareability,
    clarity: analysis.clarity,
  };
}

/**
 * Compare content variations
 */
export function compareVariations(contents: string[]): {
  content: string;
  score: number;
  analysis: ViralAnalysis;
}[] {
  return contents
    .map((content) => ({
      content,
      score: analyzeViralPotential(content).overallScore,
      analysis: analyzeViralPotential(content),
    }))
    .sort((a, b) => b.score - a.score);
}
