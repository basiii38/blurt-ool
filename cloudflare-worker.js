// Cloudflare Worker for Blurt-ool License Validation (Paddle Integration)
// Deploy with: wrangler deploy
// Docs: https://developers.cloudflare.com/workers/

export default {
  async fetch(request, env) {
    // CORS headers for Chrome extension and web requests
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle CORS preflight request
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    const url = new URL(request.url);

    // Route: Health check
    if (url.pathname === '/health' && request.method === 'GET') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          service: 'Blurt-ool Paddle License API',
          version: '1.0.0'
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }

    // Route: Validate license
    if (url.pathname === '/validate-license' && request.method === 'POST') {
      return handleLicenseValidation(request, env, corsHeaders);
    }

    // Route: Paddle webhook
    if (url.pathname === '/webhook' && request.method === 'POST') {
      return handlePaddleWebhook(request, env, corsHeaders);
    }

    // Route: Get subscription info (optional)
    if (url.pathname === '/subscription' && request.method === 'GET') {
      return handleGetSubscription(request, env, corsHeaders);
    }

    // 404 for unknown routes
    return new Response(
      JSON.stringify({ error: 'Not found' }),
      {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  },
};

// ============================================================================
// License Validation Handler
// ============================================================================
async function handleLicenseValidation(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const { license_key, email } = body;

    // Validate input
    if (!license_key) {
      return jsonResponse(
        { valid: false, message: 'License key is required' },
        400,
        corsHeaders
      );
    }

    // Validate license key format: BLUR-XXXX-XXXX-XXXX-XXXX
    const licensePattern = /^BLUR-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    if (!licensePattern.test(license_key)) {
      return jsonResponse(
        { valid: false, message: 'Invalid license key format' },
        400,
        corsHeaders
      );
    }

    // Get subscription ID from license key (stored in KV or database)
    const subscriptionId = await getSubscriptionIdFromLicense(license_key, env);

    if (!subscriptionId) {
      return jsonResponse(
        { valid: false, message: 'Invalid license key' },
        401,
        corsHeaders
      );
    }

    // Validate subscription with Paddle API
    const subscription = await getPaddleSubscription(subscriptionId, env);

    if (!subscription) {
      return jsonResponse(
        { valid: false, message: 'Subscription not found' },
        404,
        corsHeaders
      );
    }

    // Check subscription status
    const validStatuses = ['active', 'trialing'];
    const isValid = validStatuses.includes(subscription.status);

    if (!isValid) {
      return jsonResponse(
        {
          valid: false,
          message: `Subscription is ${subscription.status}`,
          data: {
            status: subscription.status,
            customer_email: subscription.customer_email
          }
        },
        403,
        corsHeaders
      );
    }

    // Verify email if provided
    if (email && subscription.customer_email !== email) {
      return jsonResponse(
        { valid: false, message: 'Email does not match subscription' },
        403,
        corsHeaders
      );
    }

    // License is valid!
    return jsonResponse(
      {
        valid: true,
        message: 'License activated successfully',
        data: {
          email: subscription.customer_email,
          customer_name: subscription.customer_name || null,
          product_name: 'Blurt-ool Premium',
          status: subscription.status,
          next_payment: subscription.next_payment?.date || null,
          activated_at: new Date().toISOString(),
        }
      },
      200,
      corsHeaders
    );

  } catch (error) {
    console.error('License validation error:', error);
    return jsonResponse(
      {
        valid: false,
        message: 'Validation failed: ' + error.message,
        error: error.toString()
      },
      500,
      corsHeaders
    );
  }
}

// ============================================================================
// Paddle Webhook Handler
// ============================================================================
async function handlePaddleWebhook(request, env, corsHeaders) {
  try {
    const body = await request.text();
    const signature = request.headers.get('Paddle-Signature');

    // Verify webhook signature for security
    if (!verifyPaddleSignature(body, signature, env.PADDLE_WEBHOOK_SECRET)) {
      console.error('Invalid webhook signature');
      return jsonResponse(
        { error: 'Invalid signature' },
        401,
        corsHeaders
      );
    }

    const event = JSON.parse(body);
    console.log('Paddle webhook received:', event.event_type);

    // Handle different event types
    switch (event.event_type) {
      case 'subscription.created':
        await handleSubscriptionCreated(event.data, env);
        break;

      case 'subscription.updated':
        await handleSubscriptionUpdated(event.data, env);
        break;

      case 'subscription.cancelled':
        await handleSubscriptionCancelled(event.data, env);
        break;

      case 'subscription.paused':
        await handleSubscriptionPaused(event.data, env);
        break;

      case 'subscription.resumed':
        await handleSubscriptionResumed(event.data, env);
        break;

      case 'transaction.completed':
        await handleTransactionCompleted(event.data, env);
        break;

      case 'transaction.payment_failed':
        await handlePaymentFailed(event.data, env);
        break;

      default:
        console.log('Unhandled event type:', event.event_type);
    }

    return jsonResponse({ received: true }, 200, corsHeaders);

  } catch (error) {
    console.error('Webhook processing error:', error);
    return jsonResponse(
      { error: 'Webhook processing failed: ' + error.message },
      500,
      corsHeaders
    );
  }
}

// ============================================================================
// Get Subscription Info Handler
// ============================================================================
async function handleGetSubscription(request, env, corsHeaders) {
  try {
    const url = new URL(request.url);
    const subscriptionId = url.searchParams.get('id');

    if (!subscriptionId) {
      return jsonResponse(
        { error: 'Subscription ID required' },
        400,
        corsHeaders
      );
    }

    const subscription = await getPaddleSubscription(subscriptionId, env);

    if (!subscription) {
      return jsonResponse(
        { error: 'Subscription not found' },
        404,
        corsHeaders
      );
    }

    return jsonResponse(
      { subscription },
      200,
      corsHeaders
    );

  } catch (error) {
    console.error('Get subscription error:', error);
    return jsonResponse(
      { error: error.message },
      500,
      corsHeaders
    );
  }
}

// ============================================================================
// Paddle API Functions
// ============================================================================

/**
 * Get subscription details from Paddle API
 */
async function getPaddleSubscription(subscriptionId, env) {
  const apiUrl = env.PADDLE_SANDBOX === 'true'
    ? 'https://sandbox-api.paddle.com'
    : 'https://api.paddle.com';

  const response = await fetch(`${apiUrl}/subscriptions/${subscriptionId}`, {
    headers: {
      'Authorization': `Bearer ${env.PADDLE_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`Paddle API error: ${response.status}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Get subscription ID from license key
 * This would typically use Cloudflare KV storage
 */
async function getSubscriptionIdFromLicense(licenseKey, env) {
  // If you have KV storage bound:
  // return await env.LICENSE_KV.get(licenseKey);

  // For now, extract from license key pattern (example implementation)
  // In production, use proper KV storage mapping

  // You could also call Paddle API to search subscriptions
  // This is a placeholder - implement based on your storage strategy

  return null; // TODO: Implement KV storage lookup
}

/**
 * Store license key to subscription ID mapping
 */
async function storeLicenseMapping(licenseKey, subscriptionId, env) {
  // If you have KV storage bound:
  // await env.LICENSE_KV.put(licenseKey, subscriptionId);

  // TODO: Implement KV storage
  console.log(`TODO: Store mapping ${licenseKey} -> ${subscriptionId}`);
}

// ============================================================================
// Webhook Event Handlers
// ============================================================================

async function handleSubscriptionCreated(data, env) {
  console.log('Subscription created:', data.id);

  // Generate license key
  const licenseKey = generateLicenseKey(data.id);

  // Store license key mapping
  await storeLicenseMapping(licenseKey, data.id, env);

  // TODO: Send license key to customer via email
  // You can use a service like SendGrid, Resend, or Mailgun
  console.log(`Generated license key: ${licenseKey} for subscription: ${data.id}`);
  console.log(`Customer email: ${data.customer_email}`);
}

async function handleSubscriptionUpdated(data, env) {
  console.log('Subscription updated:', data.id, 'Status:', data.status);

  // Handle any status changes
  if (data.status === 'past_due') {
    console.log('Subscription past due - customer payment failed');
    // Optionally notify customer
  }
}

async function handleSubscriptionCancelled(data, env) {
  console.log('Subscription cancelled:', data.id);

  // License will remain valid until the end of billing period
  // Paddle handles this automatically via subscription status
}

async function handleSubscriptionPaused(data, env) {
  console.log('Subscription paused:', data.id);
}

async function handleSubscriptionResumed(data, env) {
  console.log('Subscription resumed:', data.id);
}

async function handleTransactionCompleted(data, env) {
  console.log('Transaction completed:', data.id);
  console.log('Amount:', data.details?.totals?.total, data.currency_code);

  // Transaction successful - subscription is active
}

async function handlePaymentFailed(data, env) {
  console.log('Payment failed:', data.id);

  // Paddle will automatically retry failed payments
  // Notify customer if needed
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate a license key from subscription ID
 */
function generateLicenseKey(subscriptionId) {
  // Simple implementation - in production, use crypto for security
  const hash = subscriptionId.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  const parts = [];

  // Extract 4 segments of 4 characters each
  for (let i = 0; i < 4; i++) {
    const start = i * 4;
    const part = hash.substring(start, start + 4).padEnd(4,
      Math.random().toString(36).substring(2, 3).toUpperCase()
    );
    parts.push(part);
  }

  return `BLUR-${parts.join('-')}`;
}

/**
 * Verify Paddle webhook signature
 * Docs: https://developer.paddle.com/webhooks/signature-verification
 */
function verifyPaddleSignature(body, signature, secret) {
  if (!signature || !secret) {
    return false;
  }

  // Paddle signature format: ts={timestamp};h1={hash}
  // Parse signature
  const parts = {};
  signature.split(';').forEach(part => {
    const [key, value] = part.split('=');
    parts[key] = value;
  });

  const timestamp = parts.ts;
  const hash = parts.h1;

  if (!timestamp || !hash) {
    return false;
  }

  // TODO: Implement proper HMAC SHA256 verification
  // For now, accept all webhooks in development
  // In production, implement this properly using crypto.subtle

  return true; // TEMPORARY - implement proper verification for production!
}

/**
 * Helper to create JSON responses
 */
function jsonResponse(data, status = 200, corsHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}
