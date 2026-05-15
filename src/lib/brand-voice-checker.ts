/**
 * Brand Voice Consistency Checker
 *
 * Analyzes and ensures generated content maintains consistent brand voice,
 * tone, and messaging style across all platforms and posts.
 *
 * Features:
 * - Voice consistency scoring (0-100)
 * - Tone analysis (formal, casual, professional, friendly, etc.)
 * - Vocabulary consistency checks
 * - Brand keyword usage tracking
 * - Messaging alignment detection
 * - Multi-post consistency analysis
 *
 * @example
 * ```typescript
 * const checker = new BrandVoiceChecker({
 *   brandKeywords: ['innovative', 'sustainable', 'community'],
 *   tone: 'professional-friendly',
 *   vocabularyLevel: 'accessible'
 * });
 *
 * const score = checker.checkConsistency(generatedPost);
 * if (score < 70) {
 *   console.log('Content does not match brand voice');
 * }
 * ```
 */

export type BrandTone =
  | 'professional'
  | 'casual'
  | 'friendly'
  | 'authoritative'
  | 'playful'
  | 'inspirational'
  | 'educational'
  | 'conversational'
  | 'formal'
  | 'professional-friendly';

export type VocabularyLevel =
  | 'simple'      // Elementary (5th-8th grade)
  | 'accessible'  // High school (9th-12th grade)
  | 'advanced'    // College level
  | 'technical';  // Industry-specific

export interface BrandVoiceProfile {
  /** Brand name for identification */
  brandName: string;
  /** Target tone of voice */
  tone: BrandTone;
  /** Vocabulary complexity level */
  vocabularyLevel: VocabularyLevel;
  /** Core brand keywords to use consistently */
  brandKeywords: string[];
  /** Words/phrases to avoid */
  avoidWords?: string[];
  /** Preferred sentence structure (avg words per sentence) */
  avgSentenceLength?: number;
  /** Use of emojis (0 = none, 1 = minimal, 2 = moderate, 3 = heavy) */
  emojiUsage?: 0 | 1 | 2 | 3;
  /** Use first person (we, our) or third person (the company, they) */
  perspective?: 'first-person' | 'third-person';
  /** Call-to-action style */
  ctaStyle?: 'direct' | 'subtle' | 'question' | 'none';
}

export interface ConsistencyScore {
  /** Overall consistency score (0-100) */
  overall: number;
  /** Breakdown by dimension */
  dimensions: {
    tone: number;
    vocabulary: number;
    keywords: number;
    structure: number;
    style: number;
  };
  /** Specific issues found */
  issues: string[];
  /** Suggestions for improvement */
  suggestions: string[];
}

export class BrandVoiceChecker {
  private profile: BrandVoiceProfile;
  private historicalContent: string[] = [];

  constructor(profile: BrandVoiceProfile) {
    this.profile = profile;
  }

  /**
   * Add historical content for consistency comparison
   */
  addHistoricalContent(content: string[]): void {
    this.historicalContent.push(...content);
  }

  /**
   * Check consistency of new content against brand voice profile
   */
  checkConsistency(content: string): ConsistencyScore {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // 1. Tone consistency
    const toneScore = this.analyzeTone(content, issues, suggestions);

    // 2. Vocabulary level
    const vocabScore = this.analyzeVocabulary(content, issues, suggestions);

    // 3. Brand keyword usage
    const keywordScore = this.analyzeBrandKeywords(content, issues, suggestions);

    // 4. Sentence structure
    const structureScore = this.analyzeSentenceStructure(content, issues, suggestions);

    // 5. Style elements (emojis, perspective, CTA)
    const styleScore = this.analyzeStyle(content, issues, suggestions);

    // Calculate weighted overall score
    const overall = Math.round(
      toneScore * 0.30 +
      vocabScore * 0.25 +
      keywordScore * 0.20 +
      structureScore * 0.15 +
      styleScore * 0.10
    );

    return {
      overall,
      dimensions: {
        tone: toneScore,
        vocabulary: vocabScore,
        keywords: keywordScore,
        structure: structureScore,
        style: styleScore,
      },
      issues,
      suggestions,
    };
  }

  /**
   * Analyze tone consistency
   */
  private analyzeTone(content: string, issues: string[], suggestions: string[]): number {
    const targetTone = this.profile.tone;
    const contentLower = content.toLowerCase();

    // Tone indicators
    const toneMarkers = {
      professional: ['expertise', 'research', 'analysis', 'proven', 'industry', 'solution'],
      casual: ['hey', 'cool', 'awesome', 'yeah', 'gonna', 'stuff'],
      friendly: ['we', 'you', 'your', 'together', 'help', 'happy'],
      authoritative: ['must', 'should', 'critical', 'essential', 'imperative', 'fact'],
      playful: ['fun', 'exciting', 'yay', 'wow', 'love', 'amazing'],
      inspirational: ['achieve', 'dream', 'inspire', 'possible', 'believe', 'transform'],
      educational: ['learn', 'understand', 'discover', 'explore', 'knowledge', 'teach'],
      conversational: ['you know', 'right', 'think', 'feel', 'ever wonder', 'let\'s'],
      formal: ['therefore', 'furthermore', 'consequently', 'hereby', 'pursuant', 'aforementioned'],
      'professional-friendly': ['we', 'help', 'solution', 'together', 'expertise', 'support'],
    };

    const markers = toneMarkers[targetTone] || [];
    const matchCount = markers.filter(marker => contentLower.includes(marker)).length;
    const matchRate = markers.length > 0 ? matchCount / markers.length : 0.5;

    // Check for conflicting tones
    const conflictingTones: Record<BrandTone, BrandTone[]> = {
      professional: ['casual', 'playful'],
      casual: ['formal', 'authoritative'],
      friendly: ['authoritative', 'formal'],
      authoritative: ['casual', 'playful'],
      playful: ['professional', 'formal'],
      inspirational: ['formal'],
      educational: ['playful'],
      conversational: ['formal'],
      formal: ['casual', 'playful', 'conversational'],
      'professional-friendly': ['casual', 'formal'],
    };

    const conflicts = conflictingTones[targetTone] || [];
    for (const conflictTone of conflicts) {
      const conflictMarkers = toneMarkers[conflictTone] || [];
      const conflictMatches = conflictMarkers.filter(m => contentLower.includes(m));
      if (conflictMatches.length > 0) {
        issues.push(`Detected ${conflictTone} tone (${conflictMatches.join(', ')}), but brand uses ${targetTone}`);
        suggestions.push(`Remove ${conflictTone} language and use more ${targetTone} phrasing`);
      }
    }

    const score = Math.max(0, Math.min(100, matchRate * 100 - (issues.length * 10)));
    return score;
  }

  /**
   * Analyze vocabulary level consistency
   */
  private analyzeVocabulary(content: string, issues: string[], suggestions: string[]): number {
    const words = content.toLowerCase().match(/\b[a-z]+\b/g) || [];
    const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;

    // Expected word length ranges by vocabulary level
    const expectedRanges = {
      simple: [3.5, 5.0],
      accessible: [4.5, 6.0],
      advanced: [5.5, 7.0],
      technical: [6.0, 8.0],
    };

    const [minLen, maxLen] = expectedRanges[this.profile.vocabularyLevel];

    if (avgWordLength < minLen) {
      issues.push(`Vocabulary too simple (avg ${avgWordLength.toFixed(1)} letters/word, expected ${minLen}-${maxLen})`);
      suggestions.push('Use more sophisticated vocabulary appropriate for your audience');
    } else if (avgWordLength > maxLen) {
      issues.push(`Vocabulary too complex (avg ${avgWordLength.toFixed(1)} letters/word, expected ${minLen}-${maxLen})`);
      suggestions.push('Simplify language for better accessibility');
    }

    // Calculate score based on deviation from target range
    const midPoint = (minLen + maxLen) / 2;
    const deviation = Math.abs(avgWordLength - midPoint);
    const maxDeviation = (maxLen - minLen) / 2;
    const score = Math.max(0, 100 - (deviation / maxDeviation) * 100);

    return Math.round(score);
  }

  /**
   * Analyze brand keyword usage
   */
  private analyzeBrandKeywords(content: string, issues: string[], suggestions: string[]): number {
    const contentLower = content.toLowerCase();
    const keywordsUsed = this.profile.brandKeywords.filter(kw =>
      contentLower.includes(kw.toLowerCase())
    );

    const usageRate = keywordsUsed.length / this.profile.brandKeywords.length;

    if (usageRate === 0) {
      issues.push('No brand keywords found in content');
      suggestions.push(`Consider using brand keywords: ${this.profile.brandKeywords.slice(0, 3).join(', ')}`);
    } else if (usageRate < 0.3) {
      suggestions.push('Include more brand keywords to strengthen brand identity');
    }

    // Check for avoided words
    if (this.profile.avoidWords) {
      const foundAvoidWords = this.profile.avoidWords.filter(word =>
        contentLower.includes(word.toLowerCase())
      );
      if (foundAvoidWords.length > 0) {
        issues.push(`Contains words to avoid: ${foundAvoidWords.join(', ')}`);
        suggestions.push('Remove or replace words that don\'t align with brand voice');
      }
    }

    // Score based on usage rate and avoid words
    const score = Math.round(
      usageRate * 100 - (this.profile.avoidWords && issues.length > 0 ? 30 : 0)
    );

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Analyze sentence structure
   */
  private analyzeSentenceStructure(content: string, issues: string[], suggestions: string[]): number {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim());
    const words = content.split(/\s+/);
    const avgSentenceLength = words.length / sentences.length;

    if (this.profile.avgSentenceLength) {
      const target = this.profile.avgSentenceLength;
      const deviation = Math.abs(avgSentenceLength - target);

      if (deviation > target * 0.3) {
        if (avgSentenceLength > target) {
          issues.push(`Sentences too long (avg ${avgSentenceLength.toFixed(1)} words, target ${target})`);
          suggestions.push('Break up long sentences for better readability');
        } else {
          issues.push(`Sentences too short (avg ${avgSentenceLength.toFixed(1)} words, target ${target})`);
          suggestions.push('Combine some short sentences for better flow');
        }
      }

      const score = Math.max(0, 100 - (deviation / target) * 100);
      return Math.round(score);
    }

    return 100; // No target specified, assume perfect
  }

  /**
   * Analyze style elements (emojis, perspective, CTA)
   */
  private analyzeStyle(content: string, issues: string[], suggestions: string[]): number {
    let score = 100;

    // Check emoji usage
    if (this.profile.emojiUsage !== undefined) {
      const emojiCount = (content.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
      const expectedRange = {
        0: [0, 0],
        1: [1, 2],
        2: [3, 5],
        3: [6, 10],
      }[this.profile.emojiUsage];

      if (emojiCount < expectedRange[0]) {
        suggestions.push('Consider adding emojis to match brand style');
        score -= 10;
      } else if (emojiCount > expectedRange[1]) {
        issues.push('Too many emojis for brand voice');
        suggestions.push('Reduce emoji usage to match brand guidelines');
        score -= 20;
      }
    }

    // Check perspective
    if (this.profile.perspective) {
      const firstPersonWords = ['we', 'our', 'us'].filter(w =>
        content.toLowerCase().includes(w)
      ).length;
      const thirdPersonWords = ['the company', 'they', 'it'].filter(p =>
        content.toLowerCase().includes(p)
      ).length;

      if (this.profile.perspective === 'first-person' && thirdPersonWords > firstPersonWords) {
        issues.push('Should use first-person perspective (we, our) instead of third-person');
        score -= 15;
      } else if (this.profile.perspective === 'third-person' && firstPersonWords > thirdPersonWords) {
        issues.push('Should use third-person perspective instead of first-person');
        score -= 15;
      }
    }

    // Check CTA style
    if (this.profile.ctaStyle) {
      const hasCTA = /\b(click|sign up|learn more|get started|join|try|download|subscribe)\b/i.test(content);
      const hasQuestion = content.includes('?');

      if (this.profile.ctaStyle === 'direct' && !hasCTA) {
        suggestions.push('Add a direct call-to-action');
        score -= 10;
      } else if (this.profile.ctaStyle === 'question' && !hasQuestion) {
        suggestions.push('Consider framing CTA as a question');
        score -= 10;
      } else if (this.profile.ctaStyle === 'none' && hasCTA) {
        issues.push('Avoid explicit CTAs per brand guidelines');
        score -= 15;
      }
    }

    return Math.max(0, score);
  }

  /**
   * Compare new content against historical content for consistency
   */
  compareWithHistory(newContent: string): ConsistencyScore {
    if (this.historicalContent.length === 0) {
      return this.checkConsistency(newContent);
    }

    const historicalScores = this.historicalContent.map(content =>
      this.checkConsistency(content)
    );

    const avgHistoricalScore = historicalScores.reduce((sum, s) => sum + s.overall, 0) / historicalScores.length;
    const newScore = this.checkConsistency(newContent);

    // Check if new content deviates significantly from historical average
    const deviation = Math.abs(newScore.overall - avgHistoricalScore);
    if (deviation > 15) {
      newScore.issues.push(`Content consistency deviates ${deviation.toFixed(0)} points from historical average`);
      newScore.suggestions.push('Review historical content for reference and adjust accordingly');
    }

    return newScore;
  }

  /**
   * Generate a consistency report for multiple pieces of content
   */
  batchAnalysis(contents: string[]): {
    individual: ConsistencyScore[];
    summary: {
      avgScore: number;
      minScore: number;
      maxScore: number;
      inconsistentCount: number;
      commonIssues: string[];
    };
  } {
    const individual = contents.map(content => this.checkConsistency(content));

    const scores = individual.map(s => s.overall);
    const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    const inconsistentCount = scores.filter(s => s < 70).length;

    // Find common issues
    const allIssues = individual.flatMap(s => s.issues);
    const issueCounts: Record<string, number> = {};
    allIssues.forEach(issue => {
      issueCounts[issue] = (issueCounts[issue] || 0) + 1;
    });

    const commonIssues = Object.entries(issueCounts)
      .filter(([_, count]) => count >= contents.length * 0.3)
      .map(([issue]) => issue);

    return {
      individual,
      summary: {
        avgScore: Math.round(avgScore),
        minScore,
        maxScore,
        inconsistentCount,
        commonIssues,
      },
    };
  }
}

/**
 * Quick consistency check with default profile
 */
export function quickConsistencyCheck(
  content: string,
  brandKeywords: string[],
  tone: BrandTone = 'professional-friendly'
): number {
  const checker = new BrandVoiceChecker({
    brandName: 'Default',
    tone,
    vocabularyLevel: 'accessible',
    brandKeywords,
  });

  const score = checker.checkConsistency(content);
  return score.overall;
}
