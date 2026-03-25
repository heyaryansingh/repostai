export type SubscriptionTier = 'free' | 'starter' | 'pro' | 'scale'

export interface User {
  id: string
  email: string
  created_at: string
  stripe_customer_id: string | null
  subscription_tier: SubscriptionTier
  subscription_status: 'active' | 'canceled' | 'past_due' | null
}

export interface ApiKey {
  id: string
  user_id: string
  key_hash: string
  prefix: string
  created_at: string
  revoked_at: string | null
}

export interface Usage {
  id: string
  user_id: string
  month: string
  requests_count: number
  updated_at: string
}

export interface RepurposeRequest {
  content?: string
  url?: string
  platforms?: ('twitter' | 'linkedin' | 'instagram' | 'summary')[]
  tone?: 'professional' | 'casual' | 'witty'
}

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

export interface ApiError {
  error: {
    code: string
    message: string
  }
}
