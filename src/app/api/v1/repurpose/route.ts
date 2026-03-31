import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/auth'
import { repurposeContent } from '@/lib/openai'
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

    // Check/create usage record
    const { data: usageData } = await supabase
      .from('usage')
      .select('requests_count')
      .eq('user_id', user.id)
      .eq('month', currentMonth)
      .single()

    const currentUsage = usageData?.requests_count || 0
    const tier = (user.subscription_tier || 'free') as SubscriptionTier
    const limit = TIER_LIMITS[tier]

    // Check rate limit
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

    // Parse request body
    const body = await request.json()
    const {
      content,
      url,
      platforms = ['twitter', 'linkedin', 'instagram', 'summary'],
      tone = 'professional',
    } = body

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

    if (!textContent || textContent.length < 100) {
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

    // Call OpenAI
    const result = await repurposeContent({
      content: textContent,
      platforms,
      tone,
    })

    // Update usage
    await supabase
      .from('usage')
      .upsert(
        {
          user_id: user.id,
          month: currentMonth,
          requests_count: currentUsage + 1,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,month' }
      )

    // Generate response ID
    const responseId = `rp_${Date.now().toString(36)}`

    return NextResponse.json({
      id: responseId,
      ...result,
      usage: {
        requests_used: currentUsage + 1,
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
