import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/auth'
import { repurposeContent } from '@/lib/openai'
import type { RepurposeOutput } from '@/lib/openai'
import { createAdminClient } from '@/lib/supabase/admin'
import { TIER_LIMITS } from '@/lib/constants'
import type { SubscriptionTier } from '@/lib/constants'

export async function POST(request: NextRequest) {
  try {
    // Validate API key
    const authResult = await validateApiKey(request.headers.get('authorization'))

    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      )
    }

    const user = authResult.user
    const supabase = createAdminClient()

    // Get current month
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM

    // Check current usage
    const { data: usageData } = await supabase
      .from('usage')
      .select('requests_count')
      .eq('user_id', user.id)
      .eq('month', currentMonth)
      .single()

    const currentUsage = usageData?.requests_count || 0

    // An unrecognised tier used to index TIER_LIMITS to undefined, and
    // `count >= undefined` is false, so a bad tier string granted unlimited
    // requests. Fall back to the free limit instead of trusting the cast.
    const rawTier = user.subscription_tier || 'free'
    const tier = (rawTier in TIER_LIMITS ? rawTier : 'free') as SubscriptionTier
    const limit = TIER_LIMITS[tier]

    // Cheap early rejection. This read is racy on its own, which is why the
    // quota is actually reserved atomically further down.
    if (currentUsage >= limit) {
      return NextResponse.json(
        {
          error: {
            code: 'rate_limit_exceeded',
            message: `Monthly request limit (${limit}) reached. Upgrade at ${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
          },
        },
        { status: 429 }
      )
    }

    // Parse request body with validation
    let body: any
    try {
      body = await request.json()
    } catch (parseError) {
      return NextResponse.json(
        {
          error: {
            code: 'invalid_json',
            message: 'Request body must be valid JSON',
          },
        },
        { status: 400 }
      )
    }

    const {
      content,
      url,
      platforms = ['twitter', 'linkedin', 'instagram', 'summary'],
      tone = 'professional',
    } = body

    // Validate platforms array
    if (!Array.isArray(platforms)) {
      return NextResponse.json(
        {
          error: {
            code: 'invalid_platforms',
            message: 'platforms must be an array of strings',
          },
        },
        { status: 400 }
      )
    }

    const validPlatforms = ['twitter', 'linkedin', 'instagram', 'facebook', 'summary']
    const invalidPlatforms = platforms.filter((p: string) => !validPlatforms.includes(p))

    if (invalidPlatforms.length > 0) {
      return NextResponse.json(
        {
          error: {
            code: 'invalid_platforms',
            message: `Invalid platforms: ${invalidPlatforms.join(', ')}. Valid: ${validPlatforms.join(', ')}`,
          },
        },
        { status: 400 }
      )
    }

    // Validate tone
    const validTones = ['professional', 'casual', 'enthusiastic', 'informative', 'humorous']
    if (!validTones.includes(tone)) {
      return NextResponse.json(
        {
          error: {
            code: 'invalid_tone',
            message: `Invalid tone: ${tone}. Valid: ${validTones.join(', ')}`,
          },
        },
        { status: 400 }
      )
    }

    // Validate input
    let textContent = content

    if (url && !content) {
      return NextResponse.json(
        {
          error: {
            code: 'url_not_supported_yet',
            message: 'URL content extraction coming soon. Please provide content directly.',
          },
        },
        { status: 400 }
      )
    }

    if (typeof textContent !== 'string' || textContent.length < 100) {
      return NextResponse.json(
        {
          error: {
            code: 'content_too_short',
            message: 'Content must be at least 100 characters',
          },
        },
        { status: 400 }
      )
    }

    if (textContent.length > 50000) {
      return NextResponse.json(
        {
          error: {
            code: 'content_too_long',
            message: 'Content must be under 50,000 characters',
          },
        },
        { status: 400 }
      )
    }

    // Reserve one request before doing the billable work. consume_request
    // folds the read, the limit check, and the increment into one atomic
    // statement; the previous read-then-upsert let concurrent requests all
    // read the same count, write back count + 1, and overshoot the limit.
    const { data: reservedCount, error: reserveError } = await supabase.rpc(
      'consume_request',
      {
        p_user_id: user.id,
        p_month: currentMonth,
        p_limit: limit,
      }
    )

    if (reserveError) {
      console.error('Usage reservation failed:', reserveError.message)
      return NextResponse.json(
        {
          error: {
            code: 'internal_error',
            message: 'An unexpected error occurred. Please try again.',
          },
        },
        { status: 500 }
      )
    }

    // A null count means the limit was already reached, so nothing was taken.
    if (reservedCount === null) {
      return NextResponse.json(
        {
          error: {
            code: 'rate_limit_exceeded',
            message: `Monthly request limit (${limit}) reached. Upgrade at ${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
          },
        },
        { status: 429 }
      )
    }

    const requestsUsed = reservedCount as number

    // Call the model
    let result: RepurposeOutput
    try {
      result = await repurposeContent({
        content: textContent,
        platforms,
        tone,
      })
    } catch (generationError) {
      // Hand the reservation back so an upstream outage does not burn quota.
      const { error: releaseError } = await supabase.rpc('release_request', {
        p_user_id: user.id,
        p_month: currentMonth,
      })
      if (releaseError) {
        console.error('Usage release failed:', releaseError.message)
      }
      throw generationError
    }

    // Generate response ID
    const responseId = `rp_${Date.now().toString(36)}`

    return NextResponse.json({
      id: responseId,
      ...result,
      usage: {
        requests_used: requestsUsed,
        requests_limit: limit,
      },
    })
  } catch (error: unknown) {
    console.error('Repurpose error:', error instanceof Error ? error.message : error)
    return NextResponse.json(
      {
        error: {
          code: 'internal_error',
          message: 'An unexpected error occurred. Please try again.',
        },
      },
      { status: 500 }
    )
  }
}
