/**
 * @fileoverview Supabase admin client for server-side operations requiring elevated privileges.
 * Uses the service role key for administrative database operations.
 * @module lib/supabase/admin
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase admin client with service role privileges.
 *
 * This client bypasses Row Level Security (RLS) and should only be used
 * in secure server-side contexts. Do not expose to client-side code.
 *
 * @returns {SupabaseClient} Supabase client with admin privileges
 * @throws {Error} When required environment variables are missing
 * @example
 * ```typescript
 * const admin = createAdminClient();
 * const { data } = await admin.from('users').select('*');
 * ```
 */
export function createAdminClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }
  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
