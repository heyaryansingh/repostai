/**
 * Input sanitization and validation utilities for content processing.
 *
 * Provides robust sanitization for user-generated content to prevent:
 * - XSS attacks
 * - SQL injection
 * - Command injection
 * - Path traversal
 * - Content injection
 *
 * @module input-sanitizer
 */

export interface SanitizationResult {
  sanitized: string;
  changed: boolean;
  removedPatterns: string[];
  warnings: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitized?: string;
}

/**
 * Sanitize HTML content to prevent XSS attacks.
 *
 * Removes dangerous tags, attributes, and JavaScript while preserving
 * safe formatting tags.
 *
 * @param input - Raw HTML input
 * @param allowedTags - List of allowed HTML tags (default: basic formatting)
 * @returns Sanitized HTML string
 */
export function sanitizeHTML(
  input: string,
  allowedTags: string[] = ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li']
): SanitizationResult {
  const removedPatterns: string[] = [];
  const warnings: string[] = [];
  let changed = false;

  const allowed = new Set(allowedTags.map((t) => t.toLowerCase()));
  const noteRemoval = (pattern: string) => {
    if (!removedPatterns.includes(pattern)) removedPatterns.push(pattern);
    changed = true;
  };

  // Drop the contents of tags whose bodies are not markup, so removing the
  // wrapper does not promote the body to visible text or live script.
  const containerPattern =
    /<(script|style|iframe|object|embed|noscript|template)\b[\s\S]*?(?:<\/\1\s*>|$)/gi;

  // Elements are rebuilt from scratch rather than pattern-matched, so this
  // matches a whole tag and captures the name and raw attribute text.
  const tagPattern = /<\s*(\/?)\s*([a-z][a-z0-9]*)\b([^>]*)>/gi;

  let sanitized = input;

  // A single pass lets a nested tag reassemble itself out of the leftovers:
  // stripping the inner tag of `<scr<script>ipt>` yields a live `<script>`.
  // Re-run until the output stops changing.
  for (let pass = 0; pass < MAX_SANITIZE_PASSES; pass++) {
    const before = sanitized;

    sanitized = sanitized.replace(containerPattern, (_match, tag: string) => {
      noteRemoval(`<${tag.toLowerCase()}> tags`);
      return '';
    });

    sanitized = sanitized.replace(
      tagPattern,
      (_match, closing: string, rawTag: string, rawAttrs: string) => {
        const tag = rawTag.toLowerCase();
        if (!allowed.has(tag)) {
          noteRemoval(`<${tag}> tag`);
          return '';
        }
        if (closing) return `${TAG_OPEN}/${tag}${TAG_CLOSE}`;

        // Allowlist attributes instead of blocklisting dangerous ones. The
        // previous event-handler pattern required quoted values, so
        // `<a href="#" onclick=alert(1)>` passed through untouched on a tag
        // that was itself allowed.
        const safeAttrs = collectSafeAttributes(tag, rawAttrs, noteRemoval);
        const body = safeAttrs ? `${tag} ${safeAttrs}` : tag;
        return `${TAG_OPEN}${body}${TAG_CLOSE}`;
      }
    );

    if (sanitized === before) break;
  }

  // Any angle bracket still literal at this point is not part of a tag we
  // approved; escape it so it cannot start one downstream. Approved tags
  // are held as placeholders until after this step.
  if (sanitized.includes('<') || sanitized.includes('>')) {
    sanitized = sanitized.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    noteRemoval('stray angle brackets');
  }

  sanitized = sanitized
    .split(TAG_OPEN)
    .join('<')
    .split(TAG_CLOSE)
    .join('>');

  return { sanitized, changed, removedPatterns, warnings };
}

/**
 * Placeholders standing in for the angle brackets of approved tags.
 *
 * They use characters from a Unicode private use area so that no input can
 * contain them, letting the stray-bracket escape run without also escaping
 * the markup we just decided to keep.
 */
const TAG_OPEN = '';
const TAG_CLOSE = '';

/** Maximum re-sanitization passes before giving up on reaching a fixpoint. */
const MAX_SANITIZE_PASSES = 10;

/** Attributes kept on allowed tags, keyed by tag name. */
const ALLOWED_ATTRIBUTES: Record<string, readonly string[]> = {
  a: ['href', 'title'],
};

/** URL schemes permitted in an href. */
const SAFE_URL_SCHEMES = ['http:', 'https:', 'mailto:'];

/**
 * Rebuild the attribute list of an allowed tag, keeping only safe attributes.
 *
 * @param tag - Lowercased tag name
 * @param rawAttrs - Raw attribute text captured from the source tag
 * @param noteRemoval - Callback invoked with a description of what was dropped
 * @returns Serialized safe attributes, or an empty string if none survive
 */
function collectSafeAttributes(
  tag: string,
  rawAttrs: string,
  noteRemoval: (pattern: string) => void
): string {
  const permitted = ALLOWED_ATTRIBUTES[tag];
  if (!permitted || !rawAttrs.trim()) {
    if (rawAttrs.trim()) noteRemoval('tag attributes');
    return '';
  }

  const attrPattern = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
  const kept: string[] = [];

  for (const match of rawAttrs.matchAll(attrPattern)) {
    const name = match[1].toLowerCase();
    const value = match[2] ?? match[3] ?? match[4] ?? '';

    if (!permitted.includes(name)) {
      noteRemoval(name.startsWith('on') ? 'event handlers' : 'tag attributes');
      continue;
    }
    if (name === 'href' && !isSafeURL(value)) {
      noteRemoval('unsafe URL scheme');
      continue;
    }
    kept.push(`${name}="${escapeAttributeValue(value)}"`);
  }

  return kept.join(' ');
}

/**
 * Report whether a URL uses a scheme that cannot execute script.
 *
 * Decodes HTML entities and strips whitespace first: browsers accept
 * `jav&#x09;ascript:alert(1)` as the javascript: scheme, so a plain substring
 * check for "javascript:" misses it.
 *
 * @param value - Raw attribute value
 * @returns True if the URL is relative or uses an allowed scheme
 */
function isSafeURL(value: string): boolean {
  const decoded = value
    .replace(/&#x([0-9a-f]+);?/gi, (_m, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);?/g, (_m, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/[\s\u0000-\u0020\u007f]/g, '');

  const scheme = decoded.match(/^([a-z][a-z0-9+.-]*):/i);
  if (!scheme) return true; // Relative URL, no scheme to abuse.
  return SAFE_URL_SCHEMES.includes(scheme[1].toLowerCase() + ':');
}

/**
 * Escape a value for safe interpolation into a double-quoted attribute.
 *
 * @param value - Raw attribute value
 * @returns Value with quote and angle-bracket characters escaped
 */
function escapeAttributeValue(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Sanitize text content for safe display.
 *
 * Escapes HTML entities and removes control characters.
 *
 * @param input - Raw text input
 * @returns Escaped and sanitized text
 */
export function sanitizeText(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/[\x00-\x1F\x7F]/g, ''); // Remove control characters
}

/**
 * Validate and sanitize URLs.
 *
 * Ensures URLs use safe protocols and don't contain malicious content.
 *
 * @param url - URL to validate
 * @param allowedProtocols - List of allowed protocols (default: http, https)
 * @returns Validation result with sanitized URL
 */
export function validateURL(
  url: string,
  allowedProtocols: string[] = ['http', 'https']
): ValidationResult {
  const errors: string[] = [];

  try {
    const parsed = new URL(url);

    // Check protocol
    const protocol = parsed.protocol.slice(0, -1); // Remove trailing ':'
    if (!allowedProtocols.includes(protocol)) {
      errors.push(`Protocol "${protocol}" not allowed`);
      return { isValid: false, errors };
    }

    // Check for javascript: or data: schemes
    if (url.toLowerCase().includes('javascript:')) {
      errors.push('javascript: protocol detected');
      return { isValid: false, errors };
    }

    if (url.toLowerCase().includes('data:text/html')) {
      errors.push('Dangerous data URL detected');
      return { isValid: false, errors };
    }

    // Sanitize by reconstructing URL
    const sanitized = parsed.toString();

    return { isValid: true, errors: [], sanitized };
  } catch (error) {
    errors.push('Invalid URL format');
    return { isValid: false, errors };
  }
}

/**
 * Sanitize file paths to prevent directory traversal attacks.
 *
 * @param path - File path to sanitize
 * @param allowedExtensions - List of allowed file extensions
 * @returns Validation result with sanitized path
 */
export function sanitizeFilePath(
  path: string,
  allowedExtensions: string[] = ['.txt', '.md', '.json']
): ValidationResult {
  const errors: string[] = [];

  // Remove null bytes
  if (path.includes('\0')) {
    errors.push('Null bytes not allowed');
    return { isValid: false, errors };
  }

  // Check for directory traversal
  if (path.includes('..') || path.includes('./')) {
    errors.push('Directory traversal detected');
    return { isValid: false, errors };
  }

  // Check for absolute paths
  if (path.startsWith('/') || /^[a-zA-Z]:/.test(path)) {
    errors.push('Absolute paths not allowed');
    return { isValid: false, errors };
  }

  // Validate extension
  const ext = path.substring(path.lastIndexOf('.')).toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    errors.push(`File extension "${ext}" not allowed`);
    return { isValid: false, errors };
  }

  // Sanitize: only alphanumeric, dash, underscore, dot
  const sanitized = path.replace(/[^a-zA-Z0-9._-]/g, '_');

  return { isValid: true, errors: [], sanitized };
}

/**
 * Sanitize user input for database queries.
 *
 * Prevents SQL injection by escaping special characters.
 *
 * @param input - Raw user input
 * @returns Sanitized string safe for parameterized queries
 */
export function sanitizeForSQL(input: string): string {
  // Escape single quotes
  return input.replace(/'/g, "''").replace(/\\/g, '\\\\');
}

/**
 * Validate email address format.
 *
 * @param email - Email address to validate
 * @returns Validation result
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];

  // Basic email regex (simplified)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    errors.push('Invalid email format');
    return { isValid: false, errors };
  }

  // Check length
  if (email.length > 254) {
    errors.push('Email too long (max 254 characters)');
    return { isValid: false, errors };
  }

  // Sanitize: lowercase and trim
  const sanitized = email.toLowerCase().trim();

  return { isValid: true, errors: [], sanitized };
}

/**
 * Sanitize content for social media posts.
 *
 * Removes prohibited content and validates length constraints.
 *
 * @param content - Post content to sanitize
 * @param platform - Target platform (twitter, linkedin, etc.)
 * @returns Sanitization result
 */
export function sanitizeSocialContent(
  content: string,
  platform: 'twitter' | 'linkedin' | 'instagram' | 'facebook' = 'twitter'
): SanitizationResult {
  const removedPatterns: string[] = [];
  const warnings: string[] = [];
  let sanitized = content;
  let changed = false;

  // Platform-specific max lengths
  const maxLengths = {
    twitter: 280,
    linkedin: 3000,
    instagram: 2200,
    facebook: 63206,
  };

  const maxLength = maxLengths[platform];

  // Remove null bytes
  if (sanitized.includes('\0')) {
    sanitized = sanitized.replace(/\0/g, '');
    removedPatterns.push('null bytes');
    changed = true;
  }

  // Remove excessive whitespace
  const originalLength = sanitized.length;
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  if (sanitized.length !== originalLength) {
    removedPatterns.push('excessive whitespace');
    changed = true;
  }

  // Truncate if too long
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength - 3) + '...';
    warnings.push(`Content truncated to ${maxLength} characters`);
    changed = true;
  }

  // Remove control characters
  const controlChars = /[\x00-\x1F\x7F]/g;
  if (controlChars.test(sanitized)) {
    sanitized = sanitized.replace(controlChars, '');
    removedPatterns.push('control characters');
    changed = true;
  }

  return { sanitized, changed, removedPatterns, warnings };
}

/**
 * Validate and sanitize hashtags.
 *
 * @param hashtag - Hashtag to validate (with or without #)
 * @returns Validation result with sanitized hashtag
 */
export function validateHashtag(hashtag: string): ValidationResult {
  const errors: string[] = [];
  let sanitized = hashtag;

  // Remove # if present
  if (sanitized.startsWith('#')) {
    sanitized = sanitized.substring(1);
  }

  // Check length (max 280 for Twitter)
  if (sanitized.length > 280) {
    errors.push('Hashtag too long (max 280 characters)');
    return { isValid: false, errors };
  }

  // Validate format: only letters, numbers, underscores
  const hashtagRegex = /^[a-zA-Z0-9_]+$/;
  if (!hashtagRegex.test(sanitized)) {
    errors.push('Hashtag contains invalid characters');
    return { isValid: false, errors };
  }

  // Cannot be all numbers
  if (/^\d+$/.test(sanitized)) {
    errors.push('Hashtag cannot be all numbers');
    return { isValid: false, errors };
  }

  // Add back the #
  sanitized = '#' + sanitized;

  return { isValid: true, errors: [], sanitized };
}

/**
 * Sanitize JSON input to prevent injection attacks.
 *
 * @param input - JSON string to sanitize
 * @returns Validation result with parsed and re-serialized JSON
 */
export function sanitizeJSON(input: string): ValidationResult {
  const errors: string[] = [];

  try {
    // Parse JSON
    const parsed = JSON.parse(input);

    // Re-serialize to ensure clean JSON
    const sanitized = JSON.stringify(parsed);

    return { isValid: true, errors: [], sanitized };
  } catch (error) {
    errors.push('Invalid JSON format');
    return { isValid: false, errors };
  }
}

/**
 * Comprehensive input sanitization for user-generated content.
 *
 * Applies multiple sanitization layers for maximum security.
 *
 * @param input - Raw user input
 * @param type - Input type (text, html, url, email, etc.)
 * @returns Sanitization result
 */
export function sanitizeInput(
  input: string,
  type: 'text' | 'html' | 'url' | 'email' | 'filepath' | 'json' = 'text'
): SanitizationResult | ValidationResult {
  switch (type) {
    case 'html':
      return sanitizeHTML(input);
    case 'url':
      return validateURL(input);
    case 'email':
      return validateEmail(input);
    case 'filepath':
      return sanitizeFilePath(input);
    case 'json':
      return sanitizeJSON(input);
    case 'text':
    default:
      const sanitized = sanitizeText(input);
      return {
        sanitized,
        changed: sanitized !== input,
        removedPatterns: [],
        warnings: [],
      };
  }
}

/**
 * Rate limit check for API endpoints.
 *
 * Simple in-memory rate limiter (use Redis for production).
 */
export class RateLimiter {
  private requests = new Map<string, number[]>();

  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Check if request should be allowed.
   *
   * @param identifier - Unique identifier (e.g., IP address, user ID)
   * @returns True if request is allowed, false if rate limited
   */
  check(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get existing requests for this identifier
    const timestamps = this.requests.get(identifier) || [];

    // Filter to only recent requests
    const recentRequests = timestamps.filter((ts) => ts > windowStart);

    // Check if limit exceeded
    if (recentRequests.length >= this.maxRequests) {
      return false;
    }

    // Add current request
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);

    return true;
  }

  /** Clear all rate limit data */
  clear(): void {
    this.requests.clear();
  }
}
