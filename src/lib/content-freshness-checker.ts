/**
 * Content freshness and engagement-decay checker.
 *
 * Estimates how "stale" a piece of published content has become by modeling
 * engagement decay over time relative to a platform-specific half-life, and
 * flags candidates for repurposing, updating, or archiving.
 */

export enum FreshnessStatus {
  FRESH = 'fresh',
  AGING = 'aging',
  STALE = 'stale',
  ARCHIVE_CANDIDATE = 'archive_candidate',
}

export interface ContentAgeInput {
  postId: string;
  publishedAt: Date;
  initialEngagementRate: number;
  currentEngagementRate: number;
  platform: string;
}

export interface ContentFreshnessResult {
  postId: string;
  ageInDays: number;
  engagementDecay: number;
  freshnessScore: number;
  status: FreshnessStatus;
  recommendation: string;
}

/**
 * Platform-specific engagement half-life in days, i.e. how long it typically
 * takes for a post's engagement rate to fall to half of its initial value.
 * Falls back to a generic default for unlisted platforms.
 */
const PLATFORM_HALF_LIFE_DAYS: Record<string, number> = {
  twitter: 1,
  linkedin: 3,
  instagram: 2,
  facebook: 2,
  tiktok: 1,
  youtube: 30,
  blog: 90,
};

const DEFAULT_HALF_LIFE_DAYS = 7;

function getHalfLifeDays(platform: string): number {
  return PLATFORM_HALF_LIFE_DAYS[platform.toLowerCase()] ?? DEFAULT_HALF_LIFE_DAYS;
}

/**
 * Calculate the fractional engagement decay for a post, i.e. how much of its
 * initial engagement rate has been lost, on a 0 (no decay) to 1 (fully
 * decayed) scale.
 */
export function calculateEngagementDecay(
  initialEngagementRate: number,
  currentEngagementRate: number,
): number {
  if (initialEngagementRate <= 0) {
    return 0;
  }

  const decay = 1 - currentEngagementRate / initialEngagementRate;
  return Math.min(Math.max(decay, 0), 1);
}

function scoreToStatus(freshnessScore: number): FreshnessStatus {
  if (freshnessScore >= 75) return FreshnessStatus.FRESH;
  if (freshnessScore >= 40) return FreshnessStatus.AGING;
  if (freshnessScore >= 15) return FreshnessStatus.STALE;
  return FreshnessStatus.ARCHIVE_CANDIDATE;
}

function recommendationForStatus(status: FreshnessStatus, ageInDays: number): string {
  switch (status) {
    case FreshnessStatus.FRESH:
      return 'Performing well; no action needed yet.';
    case FreshnessStatus.AGING:
      return 'Engagement is slowing; consider a follow-up post or cross-platform repost.';
    case FreshnessStatus.STALE:
      return `Engagement has significantly decayed after ${ageInDays} days; repurpose into a new format or update and republish.`;
    case FreshnessStatus.ARCHIVE_CANDIDATE:
      return 'Content has effectively stopped generating engagement; archive or retire unless evergreen.';
    default:
      return 'Review content status manually.';
  }
}

/**
 * Assess the freshness of a single piece of content, combining its age
 * relative to the platform's typical engagement half-life with its observed
 * engagement decay into a single 0-100 freshness score.
 */
export function assessContentFreshness(input: ContentAgeInput): ContentFreshnessResult {
  const now = new Date();
  const ageInMs = now.getTime() - input.publishedAt.getTime();
  const ageInDays = Math.max(ageInMs / (1000 * 60 * 60 * 24), 0);

  const halfLifeDays = getHalfLifeDays(input.platform);
  const engagementDecay = calculateEngagementDecay(
    input.initialEngagementRate,
    input.currentEngagementRate,
  );

  // Time-based decay follows an exponential half-life curve; combine it with
  // observed engagement decay (weighted higher, since it reflects reality)
  // to produce a single freshness score.
  const timeDecayFactor = Math.pow(0.5, ageInDays / halfLifeDays);
  const timeFreshness = timeDecayFactor * 100;
  const engagementFreshness = (1 - engagementDecay) * 100;
  const freshnessScore = Math.round(engagementFreshness * 0.7 + timeFreshness * 0.3);

  const status = scoreToStatus(freshnessScore);

  return {
    postId: input.postId,
    ageInDays: Math.round(ageInDays * 10) / 10,
    engagementDecay: Math.round(engagementDecay * 1000) / 1000,
    freshnessScore: Math.min(Math.max(freshnessScore, 0), 100),
    status,
    recommendation: recommendationForStatus(status, Math.round(ageInDays)),
  };
}

/**
 * Assess freshness for a batch of content items, sorted by freshness score
 * ascending (staleest / most urgent items first).
 */
export function batchAssessFreshness(inputs: ContentAgeInput[]): ContentFreshnessResult[] {
  return inputs
    .map(assessContentFreshness)
    .sort((a, b) => a.freshnessScore - b.freshnessScore);
}
