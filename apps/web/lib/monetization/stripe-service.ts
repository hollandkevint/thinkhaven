/**
 * Stripe Service
 *
 * Handles all Stripe-related operations:
 * - Checkout session creation
 * - Webhook event verification
 * - Payment processing
 *
 * Security:
 * - Always verify webhook signatures
 * - Never trust client-provided data for payment amounts
 * - Use Stripe's server-side SDK for all operations
 */

import Stripe from 'stripe';

// ============================================================================
// CONFIGURATION
// ============================================================================

// Lazy initialization to avoid build-time errors when env vars aren't set
let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
      typescript: true,
    });
  }
  return stripeInstance;
}

// Export the getter function
export { getStripe };

// Webhook secret for signature verification
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

if (!STRIPE_WEBHOOK_SECRET && process.env.NODE_ENV === 'production') {
  console.warn('WARNING: STRIPE_WEBHOOK_SECRET is not set in production');
}

// Application URL for redirects
const APP_URL = (() => {
  const url = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (url) return url;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('NEXT_PUBLIC_APP_URL (or APP_URL) must be set in production');
  }
  return 'http://localhost:3000';
})();

// ============================================================================
// CREDIT PACKAGES CONFIGURATION
// ============================================================================

/**
 * Products definition
 * Stripe Price IDs must be configured in Stripe Dashboard
 */

// Primary product: Idea Validation ($99 one-time)
export const IDEA_VALIDATION_PRODUCT = {
  id: 'idea_validation',
  name: 'Startup Idea Validation',
  priceCents: 9900, // $99.00
  stripePriceId: process.env.STRIPE_PRICE_ID_IDEA_VALIDATION || '',
  description: '30-minute AI-powered validation session with professional PDF report',
  features: [
    '30-minute structured validation session',
    '10 critical questions answered',
    'Validation scorecard with clear verdict',
    'Professional PDF report',
    'Share with co-founders & advisors',
    'Money-back guarantee',
  ],
} as const;

/**
 * Credit packages definition (legacy - kept for existing users)
 * These should match the database credit_packages table
 */
export const CREDIT_PACKAGES = {
  starter: {
    id: 'starter',
    name: 'Starter Pack',
    credits: 5,
    priceCents: 1900, // $19.00
    stripePriceId: process.env.STRIPE_PRICE_ID_STARTER || '',
    description: 'Perfect for trying out ThinkHaven',
  },
  professional: {
    id: 'professional',
    name: 'Professional Pack',
    credits: 10,
    priceCents: 3900, // $39.00
    stripePriceId: process.env.STRIPE_PRICE_ID_PROFESSIONAL || '',
    description: 'Best value for regular users',
  },
  business: {
    id: 'business',
    name: 'Business Pack',
    credits: 20,
    priceCents: 7900, // $79.00
    stripePriceId: process.env.STRIPE_PRICE_ID_BUSINESS || '',
    description: 'For teams and frequent users',
  },
} as const;

export type PackageType = keyof typeof CREDIT_PACKAGES;

// ============================================================================
// CHECKOUT SESSION CREATION
// ============================================================================

/**
 * Create a Stripe Checkout session for credit purchase
 *
 * @param userId - User ID making the purchase
 * @param packageType - Type of package to purchase
 * @param customerEmail - Optional customer email for receipt
 * @returns Stripe Checkout Session with URL for redirect
 */
export async function createCheckoutSession(
  userId: string,
  packageType: PackageType,
  customerEmail?: string
): Promise<Stripe.Checkout.Session> {
  const pkg = CREDIT_PACKAGES[packageType];

  if (!pkg.stripePriceId) {
    throw new Error(`Stripe Price ID not configured for package: ${packageType}`);
  }

  // Create checkout session
  const session = await getStripe().checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price: pkg.stripePriceId,
        quantity: 1,
      },
    ],
    success_url: `${APP_URL}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${APP_URL}/pricing?cancelled=true`,
    customer_email: customerEmail,
    client_reference_id: userId,
    metadata: {
      userId,
      packageType,
      credits: pkg.credits.toString(),
      priceCents: pkg.priceCents.toString(),
    },
    // Enable automatic tax calculation if configured
    automatic_tax: {
      enabled: true,
    },
  });

  return session;
}

/**
 * Create a Stripe Checkout session for Idea Validation purchase
 * Primary product: $99 one-time validation session
 *
 * @param userId - User ID making the purchase
 * @param customerEmail - Optional customer email for receipt
 * @returns Stripe Checkout Session with URL for redirect
 */
export async function createIdeaValidationCheckout(
  userId: string,
  customerEmail?: string
): Promise<Stripe.Checkout.Session> {
  const product = IDEA_VALIDATION_PRODUCT;

  // Create checkout session with dynamic pricing if no Stripe Price ID
  const lineItems = product.stripePriceId
    ? [{ price: product.stripePriceId, quantity: 1 }]
    : [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.name,
            description: product.description,
          },
          unit_amount: product.priceCents,
        },
        quantity: 1,
      }];

  const session = await getStripe().checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: lineItems,
    success_url: `${APP_URL}/validate/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${APP_URL}/?cancelled=true`,
    customer_email: customerEmail,
    client_reference_id: userId,
    metadata: {
      userId,
      productType: 'idea_validation',
      priceCents: product.priceCents.toString(),
    },
    // Money-back guarantee messaging
    custom_text: {
      submit: {
        message: '30-day money-back guarantee. Not satisfied? Full refund, no questions asked.',
      },
    },
  });

  return session;
}

// ============================================================================
// WEBHOOK HANDLING
// ============================================================================

/**
 * Verify and construct a Stripe webhook event
 * CRITICAL: Always verify webhook signatures to prevent fraud
 *
 * @param body - Raw request body (MUST be raw, not parsed JSON)
 * @param signature - Stripe signature from headers
 * @returns Verified Stripe Event
 * @throws Error if signature verification fails
 */
export function constructWebhookEvent(
  body: string | Buffer,
  signature: string
): Stripe.Event {
  if (!STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
  }

  try {
    const event = getStripe().webhooks.constructEvent(
      body,
      signature,
      STRIPE_WEBHOOK_SECRET
    );
    return event;
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    throw new Error('Invalid webhook signature');
  }
}

// ============================================================================
// CHECKOUT SESSION RETRIEVAL
// ============================================================================

/**
 * Retrieve a checkout session with line items
 * Used to verify payment details from success page
 *
 * @param sessionId - Stripe Checkout Session ID
 * @returns Checkout Session with expanded line items
 */
export async function retrieveCheckoutSession(
  sessionId: string
): Promise<Stripe.Checkout.Session> {
  const session = await getStripe().checkout.sessions.retrieve(sessionId, {
    expand: ['line_items', 'payment_intent'],
  });

  return session;
}

// ============================================================================
// PAYMENT INTENT OPERATIONS
// ============================================================================

/**
 * Retrieve a payment intent
 *
 * @param paymentIntentId - Stripe Payment Intent ID
 * @returns Payment Intent object
 */
export async function retrievePaymentIntent(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> {
  const paymentIntent = await getStripe().paymentIntents.retrieve(paymentIntentId);
  return paymentIntent;
}

// ============================================================================
// REFUND OPERATIONS
// ============================================================================

/**
 * Create a refund for a payment
 * Note: Credits should be deducted from user's account separately
 *
 * @param paymentIntentId - Stripe Payment Intent ID
 * @param reason - Reason for refund
 * @returns Refund object
 */
export async function createRefund(
  paymentIntentId: string,
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer'
): Promise<Stripe.Refund> {
  const refund = await getStripe().refunds.create({
    payment_intent: paymentIntentId,
    reason,
  });

  return refund;
}

// ============================================================================
// CUSTOMER OPERATIONS
// ============================================================================

/**
 * Create or retrieve a Stripe customer
 *
 * @param userId - User ID
 * @param email - User email
 * @param name - User name (optional)
 * @returns Stripe Customer object
 */
export async function getOrCreateCustomer(
  userId: string,
  email: string,
  name?: string
): Promise<Stripe.Customer> {
  // Search for existing customer
  const existingCustomers = await getStripe().customers.list({
    email,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0];
  }

  // Create new customer
  const customer = await getStripe().customers.create({
    email,
    name,
    metadata: {
      userId,
    },
  });

  return customer;
}

// ============================================================================
// PRICE AND PRODUCT UTILITIES
// ============================================================================

/**
 * Format cents to dollar string
 *
 * @param cents - Amount in cents
 * @returns Formatted dollar amount (e.g., "$19.00")
 */
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

/**
 * Get package by Stripe Price ID
 * Used when processing webhooks to determine which package was purchased
 *
 * @param priceId - Stripe Price ID
 * @returns Package configuration or null if not found
 */
export function getPackageByPriceId(priceId: string): (typeof CREDIT_PACKAGES)[PackageType] | null {
  for (const packageType of Object.keys(CREDIT_PACKAGES) as PackageType[]) {
    const pkg = CREDIT_PACKAGES[packageType];
    if (pkg.stripePriceId === priceId) {
      return pkg;
    }
  }
  return null;
}

// ============================================================================
// TESTING UTILITIES (Development Only)
// ============================================================================

/**
 * Create a test clock for Stripe test mode
 * Used for testing subscription timing and trial periods
 *
 * @returns Test clock ID
 */
export async function createTestClock(): Promise<string> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Test clocks are only available in development');
  }

  const testClock = await getStripe().testHelpers.testClocks.create({
    frozen_time: Math.floor(Date.now() / 1000),
  });

  return testClock.id;
}

/**
 * Verify Stripe API key is valid
 * Useful for environment validation
 */
export async function verifyStripeConnection(): Promise<boolean> {
  try {
    await getStripe().balance.retrieve();
    return true;
  } catch (error) {
    console.error('Stripe connection failed:', error);
    return false;
  }
}
