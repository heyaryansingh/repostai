/**
 * Content validation utilities for multi-platform content generation.
 * Ensures content meets platform-specific requirements before generation.
 */

export interface PlatformLimits {
  twitter: {
    maxThreadLength: number;
    maxTweetLength: number;
    minThreadLength: number;
  };
  linkedin: {
    maxPostLength: number;
    minPostLength: number;
    maxFirstComment: number;
  };
  instagram: {
    maxCaptionLength: number;
    minCaptionLength: number;
    maxHashtags: number;
  };
}

export const PLATFORM_LIMITS: PlatformLimits = {
  twitter: {
    maxThreadLength: 25,
    maxTweetLength: 280,
    minThreadLength: 1,
  },
  linkedin: {
    maxPostLength: 3000,
    minPostLength: 100,
    maxFirstComment: 1250,
  },
  instagram: {
    maxCaptionLength: 2200,
    minCaptionLength: 50,
    maxHashtags: 30,
  },
};

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates input content before processing
 */
export function validateInputContent(content: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check minimum length
  if (!content || content.trim().length === 0) {
    errors.push("Content cannot be empty");
    return { valid: false, errors, warnings };
  }

  if (content.trim().length < 100) {
    errors.push("Content must be at least 100 characters for meaningful repurposing");
  }

  // Check maximum length
  if (content.length > 50000) {
    errors.push("Content exceeds maximum length of 50,000 characters");
  }

  // Warn if content is too short for quality outputs
  if (content.length < 500) {
    warnings.push("Short content may result in limited platform outputs");
  }

  // Check for common issues
  if (content.split(/\s+/).length < 20) {
    errors.push("Content must contain at least 20 words");
  }

  // Check for URL-only content
  const urlPattern = /^(https?:\/\/[^\s]+)$/;
  if (urlPattern.test(content.trim())) {
    errors.push("Please provide text content, not just a URL");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates Twitter thread output
 */
export function validateTwitterThread(thread: string[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!thread || thread.length === 0) {
    errors.push("Twitter thread cannot be empty");
    return { valid: false, errors, warnings };
  }

  if (thread.length > PLATFORM_LIMITS.twitter.maxThreadLength) {
    errors.push(
      `Twitter thread exceeds maximum length of ${PLATFORM_LIMITS.twitter.maxThreadLength} tweets`
    );
  }

  // Check individual tweets
  thread.forEach((tweet, index) => {
    if (tweet.length > PLATFORM_LIMITS.twitter.maxTweetLength) {
      errors.push(
        `Tweet ${index + 1} exceeds ${PLATFORM_LIMITS.twitter.maxTweetLength} characters (${tweet.length})`
      );
    }

    if (tweet.trim().length === 0) {
      errors.push(`Tweet ${index + 1} is empty`);
    }
  });

  // Warn if thread is very short
  if (thread.length < 3) {
    warnings.push("Short threads may have lower engagement");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates LinkedIn post output
 */
export function validateLinkedInPost(post: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!post || post.trim().length === 0) {
    errors.push("LinkedIn post cannot be empty");
    return { valid: false, errors, warnings };
  }

  if (post.length > PLATFORM_LIMITS.linkedin.maxPostLength) {
    errors.push(
      `LinkedIn post exceeds maximum length of ${PLATFORM_LIMITS.linkedin.maxPostLength} characters`
    );
  }

  if (post.length < PLATFORM_LIMITS.linkedin.minPostLength) {
    errors.push(
      `LinkedIn post must be at least ${PLATFORM_LIMITS.linkedin.minPostLength} characters`
    );
  }

  // Warn about optimal length
  if (post.length < 300) {
    warnings.push("Longer posts (300-1000 chars) typically perform better on LinkedIn");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates Instagram caption output
 */
export function validateInstagramCaption(caption: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!caption || caption.trim().length === 0) {
    errors.push("Instagram caption cannot be empty");
    return { valid: false, errors, warnings };
  }

  if (caption.length > PLATFORM_LIMITS.instagram.maxCaptionLength) {
    errors.push(
      `Instagram caption exceeds maximum length of ${PLATFORM_LIMITS.instagram.maxCaptionLength} characters`
    );
  }

  if (caption.length < PLATFORM_LIMITS.instagram.minCaptionLength) {
    warnings.push(
      `Short captions may have lower engagement (minimum ${PLATFORM_LIMITS.instagram.minCaptionLength} chars recommended)`
    );
  }

  // Count hashtags
  const hashtags = caption.match(/#\w+/g) || [];
  if (hashtags.length > PLATFORM_LIMITS.instagram.maxHashtags) {
    errors.push(
      `Instagram caption contains ${hashtags.length} hashtags (maximum ${PLATFORM_LIMITS.instagram.maxHashtags})`
    );
  }

  // Warn about no hashtags
  if (hashtags.length === 0) {
    warnings.push("Adding relevant hashtags can improve discoverability");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates all platform outputs
 */
export function validateAllOutputs(outputs: {
  twitter_thread?: string[];
  linkedin?: string;
  instagram?: string;
}): Record<string, ValidationResult> {
  const results: Record<string, ValidationResult> = {};

  if (outputs.twitter_thread) {
    results.twitter = validateTwitterThread(outputs.twitter_thread);
  }

  if (outputs.linkedin) {
    results.linkedin = validateLinkedInPost(outputs.linkedin);
  }

  if (outputs.instagram) {
    results.instagram = validateInstagramCaption(outputs.instagram);
  }

  return results;
}

/**
 * Returns a summary of all validation results
 */
export function getValidationSummary(
  results: Record<string, ValidationResult>
): {
  allValid: boolean;
  totalErrors: number;
  totalWarnings: number;
  platforms: string[];
} {
  let totalErrors = 0;
  let totalWarnings = 0;
  const platforms: string[] = [];

  Object.entries(results).forEach(([platform, result]) => {
    platforms.push(platform);
    totalErrors += result.errors.length;
    totalWarnings += result.warnings.length;
  });

  return {
    allValid: totalErrors === 0,
    totalErrors,
    totalWarnings,
    platforms,
  };
}
