/**
 * Content hashing and deduplication utilities.
 * Detects duplicate or similar content to prevent redundant API calls.
 */

export interface ContentHash {
  hash: string;
  timestamp: number;
  content: string;
  platforms: string[];
}

/**
 * Generate a simple hash from content for deduplication
 */
export function hashContent(content: string): string {
  const normalized = content
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return Math.abs(hash).toString(36);
}

/**
 * Calculate similarity between two content strings (0-1)
 */
export function calculateSimilarity(content1: string, content2: string): number {
  const words1 = new Set(content1.toLowerCase().split(/\s+/));
  const words2 = new Set(content2.toLowerCase().split(/\s+/));

  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

/**
 * Check if content is a duplicate or too similar to cached content
 */
export function isDuplicate(
  newContent: string,
  cachedHashes: ContentHash[],
  similarityThreshold: number = 0.85
): { isDuplicate: boolean; match?: ContentHash } {
  const newHash = hashContent(newContent);

  // Check exact hash match
  const exactMatch = cachedHashes.find(h => h.hash === newHash);
  if (exactMatch) {
    return { isDuplicate: true, match: exactMatch };
  }

  // Check similarity
  for (const cached of cachedHashes) {
    const similarity = calculateSimilarity(newContent, cached.content);
    if (similarity >= similarityThreshold) {
      return { isDuplicate: true, match: cached };
    }
  }

  return { isDuplicate: false };
}

/**
 * Clean old hashes from cache (older than 7 days)
 */
export function cleanOldHashes(
  hashes: ContentHash[],
  maxAgeMs: number = 7 * 24 * 60 * 60 * 1000
): ContentHash[] {
  const now = Date.now();
  return hashes.filter(h => (now - h.timestamp) < maxAgeMs);
}

/**
 * Get content fingerprint (first 100 chars for quick comparison)
 */
export function getFingerprint(content: string): string {
  return content
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100);
}
