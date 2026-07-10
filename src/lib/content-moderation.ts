/**
 * Content moderation utility for filtering inappropriate social media content.
 */

interface ModerationResult {
  is_safe: boolean;
  flagged_categories: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestions: string[];
  confidence: number;
}

interface ModerationConfig {
  check_profanity: boolean;
  check_hate_speech: boolean;
  check_spam_patterns: boolean;
  sensitivity_level: 'low' | 'medium' | 'high';
}

const DEFAULT_CONFIG: ModerationConfig = {
  check_profanity: true,
  check_hate_speech: true,
  check_spam_patterns: true,
  sensitivity_level: 'medium',
};

const SPAM_PATTERNS = [
  /click here now/gi,
  /limited time offer/gi,
  /act now/gi,
  /100% guaranteed/gi,
];

const SEVERITY_RANK: Record<ModerationResult['severity'], number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

// Per-category severity. Each flagged category contributes its own
// severity, and the result reflects the highest one triggered instead
// of always collapsing to 'low'.
const CATEGORY_SEVERITY: Record<string, ModerationResult['severity']> = {
  spam_patterns: 'medium',
  excessive_caps: 'low',
  excessive_punctuation: 'low',
};

export function moderateContent(
  content: string,
  config: Partial<ModerationConfig> = {}
): ModerationResult {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const flaggedCategories: string[] = [];
  let maxSeverity: ModerationResult['severity'] = 'low';

  const flag = (category: string) => {
    flaggedCategories.push(category);
    const severity = CATEGORY_SEVERITY[category] ?? 'low';
    if (SEVERITY_RANK[severity] > SEVERITY_RANK[maxSeverity]) {
      maxSeverity = severity;
    }
  };

  if (fullConfig.check_spam_patterns) {
    for (const pattern of SPAM_PATTERNS) {
      if (pattern.test(content)) {
        flag('spam_patterns');
        break;
      }
    }
  }

  // Ratio of uppercase letters among alphabetic characters only, so
  // spaces/digits/punctuation don't dilute short all-caps phrases.
  const letters = content.match(/[A-Za-z]/g) || [];
  const upperLetters = content.match(/[A-Z]/g) || [];
  const capsRatio = letters.length > 0 ? upperLetters.length / letters.length : 0;
  if (capsRatio > 0.5 && content.length > 20) {
    flag('excessive_caps');
  }

  const exclamationCount = (content.match(/!/g) || []).length;
  if (exclamationCount > 3) {
    flag('excessive_punctuation');
  }

  const isSafe = flaggedCategories.length === 0;
  const suggestions = generateSuggestions(flaggedCategories);

  return {
    is_safe: isSafe,
    flagged_categories: flaggedCategories,
    severity: maxSeverity,
    suggestions,
    confidence: 0.85,
  };
}

function generateSuggestions(flaggedCategories: string[]): string[] {
  const suggestions: string[] = [];

  if (flaggedCategories.includes('spam_patterns')) {
    suggestions.push('Avoid spam trigger words');
  }

  if (flaggedCategories.includes('excessive_caps')) {
    suggestions.push('Use normal capitalization');
  }

  if (flaggedCategories.includes('excessive_punctuation')) {
    suggestions.push('Reduce exclamation marks');
  }

  return suggestions;
}

export function checkPlatformCompliance(
  content: string,
  platform: 'twitter' | 'linkedin' | 'instagram'
): { compliant: boolean; issues: string[] } {
  const issues: string[] = [];

  const limits = {
    twitter: 280,
    linkedin: 3000,
    instagram: 2200,
  };

  if (content.length > limits[platform]) {
    issues.push(`Content exceeds ${platform} limit`);
  }

  if (platform === 'twitter') {
    const hashtagCount = (content.match(/#\w+/g) || []).length;
    if (hashtagCount > 5) {
      issues.push('Too many hashtags for Twitter');
    }
  }

  return {
    compliant: issues.length === 0,
    issues,
  };
}

export function sanitizeContent(content: string): string {
  let sanitized = content;

  const words = sanitized.split(' ');
  sanitized = words
    .map((word) => {
      if (word.length > 3 && word === word.toUpperCase()) {
        return word.charAt(0) + word.slice(1).toLowerCase();
      }
      return word;
    })
    .join(' ');

  sanitized = sanitized.replace(/!{4,}/g, '!!!');

  return sanitized;
}
