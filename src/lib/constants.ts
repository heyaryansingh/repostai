/**
 * @fileoverview Subscription tier configuration constants
 * @module lib/constants
 *
 * Defines pricing, usage limits, and display names for subscription tiers.
 */

/**
 * Monthly request limits per subscription tier
 * @constant {Record<SubscriptionTier, number>}
 */
export const TIER_LIMITS = {
  free: 10,
  starter: 100,
  pro: 500,
  scale: 2000,
} as const

/**
 * Monthly prices in cents per subscription tier (excludes free tier)
 * @constant {Record<Exclude<SubscriptionTier, 'free'>, number>}
 */
export const TIER_PRICES = {
  starter: 1900,
  pro: 4900,
  scale: 9900,
} as const

/**
 * Human-readable display names for subscription tiers
 * @constant {Record<SubscriptionTier, string>}
 */
export const TIER_NAMES = {
  free: 'Free',
  starter: 'Starter',
  pro: 'Pro',
  scale: 'Scale',
} as const

/**
 * Valid subscription tier identifiers
 * @typedef {'free' | 'starter' | 'pro' | 'scale'} SubscriptionTier
 */
export type SubscriptionTier = keyof typeof TIER_LIMITS

/**
 * Resolve a stored tier string to a known tier, falling back to 'free'.
 * Uses an own-property check so inherited keys like "toString" don't pass.
 */
export function resolveTier(raw: string | null | undefined): SubscriptionTier {
  return raw && Object.prototype.hasOwnProperty.call(TIER_LIMITS, raw)
    ? (raw as SubscriptionTier)
    : 'free'
}
