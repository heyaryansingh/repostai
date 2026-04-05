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
import Stripe from 'stripe'

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

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const customerId = session.customer as string
      const subscriptionId = session.subscription as string

      // Get subscription details
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      const priceId = subscription.items.data[0].price.id

      // Determine tier from price
      let tier = 'starter'
      if (priceId === process.env.STRIPE_PRO_PRICE_ID) tier = 'pro'
      if (priceId === process.env.STRIPE_SCALE_PRICE_ID) tier = 'scale'

      // Update user
      await supabase
        .from('users')
        .update({
          stripe_customer_id: customerId,
          subscription_tier: tier,
          subscription_status: 'active',
        })
        .eq('stripe_customer_id', customerId)

      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string
      const priceId = subscription.items.data[0].price.id

      let tier = 'starter'
      if (priceId === process.env.STRIPE_PRO_PRICE_ID) tier = 'pro'
      if (priceId === process.env.STRIPE_SCALE_PRICE_ID) tier = 'scale'

      await supabase
        .from('users')
        .update({
          subscription_tier: tier,
          subscription_status: subscription.status === 'active' ? 'active' : 'past_due',
        })
        .eq('stripe_customer_id', customerId)

      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      await supabase
        .from('users')
        .update({
          subscription_tier: 'free',
          subscription_status: 'canceled',
        })
        .eq('stripe_customer_id', customerId)

      break
    }
  }

  return NextResponse.json({ received: true })
}
