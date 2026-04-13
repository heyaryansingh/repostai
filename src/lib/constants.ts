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
