/**
 * @fileoverview Type definitions for RepostAI application
 * @module types
 *
 * Defines core domain types used throughout the application including
 * user models, API request/response types, and subscription tiers.
 *
 * @example
 * ```typescript
 * import { User, RepurposeRequest, SubscriptionTier } from '@/types';
 *
 * const user: User = { id: '123', email: 'user@example.com', ... };
 * ```
 */

/**
 * Available subscription tiers for users
 * @typedef {'free' | 'starter' | 'pro' | 'scale'} SubscriptionTier
 */
export type SubscriptionTier = 'free' | 'starter' | 'pro' | 'scale'

/**
 * User account information
 * @interface User
 * @property {string} id - Unique user identifier
 * @property {string} email - User's email address
 * @property {string} created_at - ISO timestamp of account creation
 * @property {string | null} stripe_customer_id - Stripe customer ID for billing
 * @property {SubscriptionTier} subscription_tier - Current subscription level
 * @property {'active' | 'canceled' | 'past_due' | null} subscription_status - Subscription state
 */
export interface User {
  id: string
  email: string
  created_at: string
  stripe_customer_id: string | null
  subscription_tier: SubscriptionTier
  subscription_status: 'active' | 'canceled' | 'past_due' | null
}

/**
 * API key for authentication
 * @interface ApiKey
 * @property {string} id - Unique key identifier
 * @property {string} user_id - Owner's user ID
 * @property {string} key_hash - Hashed API key value
 * @property {string} prefix - Visible key prefix (e.g., "sk_...")
 * @property {string} created_at - ISO timestamp of key creation
 * @property {string | null} revoked_at - ISO timestamp when key was revoked, or null if active
 */
export interface ApiKey {
  id: string
  user_id: string
  key_hash: string
  prefix: string
  created_at: string
  revoked_at: string | null
}

/**
 * Monthly usage tracking for a user
 * @interface Usage
 * @property {string} id - Unique record identifier
 * @property {string} user_id - User ID for this usage record
 * @property {string} month - Billing period in YYYY-MM format
 * @property {number} requests_count - Number of API requests made this period
 * @property {string} updated_at - ISO timestamp of last update
 */
export interface Usage {
  id: string
  user_id: string
  month: string
  requests_count: number
  updated_at: string
}

/**
 * Request payload for content repurposing
 * @interface RepurposeRequest
 * @property {string} [content] - Raw text content to repurpose
 * @property {string} [url] - URL to extract content from
 * @property {Array<'twitter' | 'linkedin' | 'instagram' | 'summary'>} [platforms] - Target platforms
 * @property {'professional' | 'casual' | 'witty'} [tone] - Desired tone for output
 */
export interface RepurposeRequest {
  content?: string
  url?: string
  platforms?: ('twitter' | 'linkedin' | 'instagram' | 'summary')[]
  tone?: 'professional' | 'casual' | 'witty'
}

/**
 * Response from content repurposing API
 * @interface RepurposeResponse
 * @property {string} id - Unique response identifier
 * @property {string[]} twitter_thread - Array of tweets forming a thread
 * @property {string} linkedin - LinkedIn post content
 * @property {string} instagram - Instagram caption content
 * @property {string} summary - Brief summary of original content
 * @property {string[]} quotes - Extracted notable quotes
 * @property {object} usage - Current usage statistics
 * @property {number} usage.requests_used - Requests used this billing period
 * @property {number} usage.requests_limit - Maximum requests for subscription tier
 */
export interface RepurposeResponse {
  id: string
  twitter_thread: string[]
  linkedin: string
  instagram: string
  summary: string
  quotes: string[]
  usage: {
    requests_used: number
    requests_limit: number
  }
}

/**
 * Standard API error response format
 * @interface ApiError
 * @property {object} error - Error details container
 * @property {string} error.code - Machine-readable error code (e.g., 'rate_limit_exceeded')
 * @property {string} error.message - Human-readable error description
 */
export interface ApiError {
  error: {
    code: string
    message: string
  }
}
