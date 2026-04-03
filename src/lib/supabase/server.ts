/**
 * @fileoverview Server-side Supabase client with SSR cookie handling.
 * Uses Next.js cookies() API for session persistence.
 * @module lib/supabase/server
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Creates a Supabase client configured for server-side rendering.
 * Handles cookie operations for session management.
 *
 * @returns Configured Supabase client for server operations
 * @example
 * ```ts
 * const supabase = createClient()
 * const { data } = await supabase.auth.getUser()
 * ```
 */
export function createClient(): ReturnType<typeof createServerClient> {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Log error for debugging but don't throw (as per Supabase docs)
            console.warn(
              'Failed to set cookie in SSR:',
              error instanceof Error ? error.message : String(error)
            )
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            console.warn(
              'Failed to remove cookie in SSR:',
              error instanceof Error ? error.message : String(error)
            )
          }
        },
      },
    }
  )
}
