/**
 * @fileoverview Stripe Webhook Handler - Processes subscription lifecycle events.
 * @module app/api/webhooks/stripe
 *
 * Handles the following Stripe events:
 * - checkout.session.completed: New subscription created
 * - customer.subscription.updated: Subscription plan changed or status updated
 * - customer.subscription.deleted: Subscription canceled
 *
 * Security:
 * - Validates webhook signature using STRIPE_WEBHOOK_SECRET
 * - Rejects requests with invalid signatures
 *
 * @see https://stripe.com/docs/webhooks
 */

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import type { SupabaseClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

/**
 * Resolves the Supabase user id behind a Stripe customer.
 *
 * On the first paid event a user's `stripe_customer_id` column is still null,
 * so filtering the update on that column matches no rows and the upgrade is
 * silently dropped. The Stripe customer created by `createOrGetCustomer` carries
 * `metadata.supabase_user_id`, which is authoritative from the very first event;
 * the column lookup is only a fallback for customers created outside that flow.
 *
 * @param supabase - Admin Supabase client
 * @param customerId - The Stripe customer ID from the event
 * @returns The Supabase user id, or null if the customer cannot be matched
 */
async function resolveUserId(
  supabase: SupabaseClient,
  customerId: string
): Promise<string | null> {
  const customer = await stripe.customers.retrieve(customerId)

  if (!customer.deleted) {
    const userId = customer.metadata?.supabase_user_id
    if (userId) return userId
  }

  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle()

  return data?.id ?? null
}

/**
 * Maps a Stripe price id to a subscription tier.
 *
 * @param priceId - The Stripe price ID on the subscription item
 * @returns The tier name stored on the user record
 */
function tierForPrice(priceId: string): string {
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return 'pro'
  if (priceId === process.env.STRIPE_SCALE_PRICE_ID) return 'scale'
  return 'starter'
}

/**
 * POST /api/webhooks/stripe - Handle Stripe webhook events.
 *
 * Processes subscription events and updates user records in Supabase.
 * Verifies webhook signature before processing any events.
 *
 * @param request - The incoming webhook request from Stripe
 * @returns JSON acknowledgment or error response
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  let customerId: string | null = null
  let update: Record<string, string> | null = null

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      customerId = session.customer as string
      const subscriptionId = session.subscription as string

      // Get subscription details
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)

      update = {
        stripe_customer_id: customerId,
        subscription_tier: tierForPrice(subscription.items.data[0].price.id),
        subscription_status: 'active',
      }

      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      customerId = subscription.customer as string

      update = {
        stripe_customer_id: customerId,
        subscription_tier: tierForPrice(subscription.items.data[0].price.id),
        subscription_status: subscription.status === 'active' ? 'active' : 'past_due',
      }

      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      customerId = subscription.customer as string

      update = {
        stripe_customer_id: customerId,
        subscription_tier: 'free',
        subscription_status: 'canceled',
      }

      break
    }
  }

  if (!customerId || !update) {
    return NextResponse.json({ received: true })
  }

  const userId = await resolveUserId(supabase, customerId)

  if (!userId) {
    console.error(`No Supabase user for Stripe customer ${customerId} (${event.type})`)
    return NextResponse.json({ error: 'Unknown customer' }, { status: 404 })
  }

  const { error } = await supabase.from('users').update(update).eq('id', userId)

  if (error) {
    // 500 so Stripe retries rather than dropping a paid upgrade on the floor.
    console.error(`Failed to apply ${event.type} for user ${userId}:`, error)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
