/**
 * @fileoverview API key authentication and validation utilities.
 * Handles secure API key validation, hashing, and user lookup.
 * @module lib/auth
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { createHash, randomBytes } from 'crypto'
import type { User } from '@/types'

/** Result of an authentication attempt */
export interface AuthResult {
  success: boolean
  user?: User
  error?: {
    code: string
    message: string
  }
}

export async function validateApiKey(authHeader: string | null): Promise<AuthResult> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      success: false,
      error: {
        code: 'missing_api_key',
        message: 'API key is required. Pass it in the Authorization header as: Bearer YOUR_API_KEY',
      },
    }
  }

  const apiKey = authHeader.replace('Bearer ', '')

  if (!apiKey.startsWith('rp_live_')) {
    return {
      success: false,
      error: {
        code: 'invalid_api_key',
        message: 'Invalid API key format. Keys should start with rp_live_',
      },
    }
  }

  const keyHash = createHash('sha256').update(apiKey).digest('hex')

  const supabase = createAdminClient()

  // Find the API key
  const { data: keyData, error: keyError } = await supabase
    .from('api_keys')
    .select('user_id')
    .eq('key_hash', keyHash)
    .is('revoked_at', null)
    .single()

  if (keyError || !keyData) {
    return {
      success: false,
      error: {
        code: 'invalid_api_key',
        message: 'Invalid or revoked API key',
      },
    }
  }

  // Get the user
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', keyData.user_id)
    .single()

  if (userError || !userData) {
    return {
      success: false,
      error: {
        code: 'user_not_found',
        message: 'User not found',
      },
    }
  }

  return {
    success: true,
    user: userData as User,
  }
}

/**
 * Generates a new API key with its hash and display prefix.
 * @returns Object containing the full key, SHA-256 hash, and truncated prefix for display
 */
export function generateApiKey(): { key: string; hash: string; prefix: string } {
  const keyBytes = randomBytes(24).toString('hex')
  const key = `rp_live_${keyBytes}`
  const hash = createHash('sha256').update(key).digest('hex')
  const prefix = `rp_live_${keyBytes.slice(0, 8)}...`

  return { key, hash, prefix }
}
