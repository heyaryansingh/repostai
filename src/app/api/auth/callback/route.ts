/**
 * @fileoverview OAuth callback handler for Supabase authentication.
 * @module app/api/auth/callback
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Handles OAuth callback by exchanging the auth code for a session.
 * Redirects to dashboard on success or login page with error on failure.
 *
 * @param request - Next.js request object containing OAuth code
 * @returns Redirect response to dashboard or login page
 */
export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (!code) {
    console.warn('Auth callback received without code parameter')
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const supabase = createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('Auth callback error:', {
      code: error.code,
      message: error.message,
      timestamp: new Date().toISOString(),
    })
    return NextResponse.redirect(
      `${origin}/login?error=auth_failed&code=${encodeURIComponent(error.code || 'unknown')}`
    )
  }

  return NextResponse.redirect(`${origin}${next}`)
}
