/**
 * @fileoverview Stripe integration for subscription billing and customer management.
 * @module lib/stripe
 */

import Stripe from 'stripe'

/**
 * Pre-configured Stripe client instance.
 * Uses STRIPE_SECRET_KEY environment variable for authentication.
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

/**
 * Creates a Stripe Checkout session for subscription purchases.
 *
 * @param customerId - The Stripe customer ID
 * @param priceId - The Stripe price ID for the subscription plan
 * @param successUrl - URL to redirect to after successful checkout
 * @param cancelUrl - URL to redirect to if checkout is cancelled
 * @returns Promise resolving to a Stripe Checkout Session object
 *
 * @example
 * ```ts
 * const session = await createCheckoutSession(
 *   'cus_xxx',
 *   'price_xxx',
 *   'https://app.example.com/success',
 *   'https://app.example.com/cancel'
 * );
 * // Redirect user to session.url
 * ```
 */
export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<Stripe.Checkout.Session> {
  return stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
  })
}

/**
 * Creates a Stripe Customer Portal session for managing subscriptions.
 * Allows customers to update payment methods, view invoices, and cancel subscriptions.
 *
 * @param customerId - The Stripe customer ID
 * @param returnUrl - URL to redirect to after leaving the portal
 * @returns Promise resolving to a Stripe Billing Portal Session object
 *
 * @example
 * ```ts
 * const portalSession = await createCustomerPortalSession(
 *   'cus_xxx',
 *   'https://app.example.com/dashboard'
 * );
 * // Redirect user to portalSession.url
 * ```
 */
export async function createCustomerPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
}

/**
 * Retrieves an existing Stripe customer by email, or creates a new one if not found.
 * Links the Stripe customer to a Supabase user ID via metadata.
 *
 * @param email - Customer's email address
 * @param userId - Supabase user ID to link with the Stripe customer
 * @returns Promise resolving to the Stripe customer ID
 *
 * @example
 * ```ts
 * const customerId = await createOrGetCustomer(
 *   'user@example.com',
 *   'supabase-user-uuid'
 * );
 * ```
 */
export async function createOrGetCustomer(
  email: string,
  userId: string
): Promise<string> {
  // Check if customer exists by email
  const customers = await stripe.customers.list({
    email,
    limit: 1,
  })

  if (customers.data.length > 0) {
    return customers.data[0].id
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    metadata: {
      supabase_user_id: userId,
    },
  })

  return customer.id
}
