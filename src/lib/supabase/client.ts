/**
 * @fileoverview Supabase browser client for client-side operations
 * @module lib/supabase/client
 *
 * Creates a Supabase client configured for browser environments using SSR-safe
 * cookie storage. Use this client for client-side data fetching and auth operations.
 *
 * Required environment variables:
 * - NEXT_PUBLIC_SUPABASE_URL: Your Supabase project URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY: Your Supabase anon/public key
 *
 * @example
 * ```typescript
 * import { createClient } from '@/lib/supabase/client';
 *
 * const supabase = createClient();
 * const { data, error } = await supabase.from('posts').select('*');
 * ```
 */

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Create a Supabase client for browser-side operations
 *
 * @returns {SupabaseClient} Configured Supabase browser client
 * @throws {Error} If required environment variables are not set
 *
 * @example
 * ```typescript
 * const supabase = createClient();
 * const { data: user } = await supabase.auth.getUser();
 * ```
 */
export function createClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL')
  }

  if (!supabaseAnonKey) {
    throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
