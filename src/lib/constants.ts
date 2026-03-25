export const TIER_LIMITS = {
  free: 10,
  starter: 100,
  pro: 500,
  scale: 2000,
} as const

export const TIER_PRICES = {
  starter: 1900,
  pro: 4900,
  scale: 9900,
} as const

export const TIER_NAMES = {
  free: 'Free',
  starter: 'Starter',
  pro: 'Pro',
  scale: 'Scale',
} as const

export type SubscriptionTier = keyof typeof TIER_LIMITS
