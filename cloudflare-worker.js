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

    // Get purchase record from license key (stored in KV or database)
    const purchaseRecord = await getPurchaseFromLicense(license_key, env);

    if (!purchaseRecord) {
      return jsonResponse(
        { valid: false, message: 'Invalid license key' },
        401,
        corsHeaders
      );
    }

    // Verify email if provided
    if (email && purchaseRecord.customer_email !== email) {
      return jsonResponse(
        { valid: false, message: 'Email does not match purchase record' },
        403,
        corsHeaders
      );
    }

    // Check if license is revoked or refunded
    if (purchaseRecord.status === 'refunded' || purchaseRecord.status === 'revoked') {
      return jsonResponse(
        {
          valid: false,
          message: `License has been ${purchaseRecord.status}`,
          data: {
            status: purchaseRecord.status
          }
        },
        403,
        corsHeaders
      );
    }

    // License is valid! (one-time purchase = lifetime access)
    return jsonResponse(
      {
        valid: true,
        message: 'License activated successfully',
        data: {
          email: purchaseRecord.customer_email,
          customer_name: purchaseRecord.customer_name || null,
          product_name: 'Blurt-ool Premium - Lifetime License',
          license_type: 'lifetime',
          purchased_at: purchaseRecord.purchased_at,
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
      case 'transaction.completed':
        // One-time purchase completed - generate license key
        await handleTransactionCompleted(event.data, env);
        break;

      case 'transaction.payment_failed':
        await handlePaymentFailed(event.data, env);
        break;

      case 'transaction.refunded':
        // Customer refunded - revoke license
        await handleTransactionRefunded(event.data, env);
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
// Paddle API Functions
// ============================================================================

/**
 * Get purchase record from license key
 * This uses Cloudflare KV storage to map license key -> purchase data
 */
async function getPurchaseFromLicense(licenseKey, env) {
  // If you have KV storage bound:
  // const purchaseData = await env.LICENSE_KV.get(licenseKey, { type: 'json' });
  // return purchaseData;

  // TODO: Implement KV storage lookup
  // For now, return null - you need to set up KV storage
  // See: https://developers.cloudflare.com/workers/runtime-apis/kv/

  return null; // TODO: Implement KV storage lookup
}

/**
 * Store license key to purchase data mapping
 */
async function storeLicenseMapping(licenseKey, purchaseData, env) {
  // If you have KV storage bound:
  // await env.LICENSE_KV.put(licenseKey, JSON.stringify(purchaseData));

  // TODO: Implement KV storage
  console.log(`TODO: Store license ${licenseKey} with purchase data:`, purchaseData);
}

// ============================================================================
// Webhook Event Handlers
// ============================================================================

async function handleTransactionCompleted(data, env) {
  console.log('Transaction completed:', data.id);
  console.log('Amount:', data.details?.totals?.total, data.currency_code);
  console.log('Customer:', data.customer_id);

  // Generate license key for the purchase
  const licenseKey = generateLicenseKey(data.id);

  // Prepare purchase data to store
  const purchaseData = {
    transaction_id: data.id,
    customer_id: data.customer_id,
    customer_email: data.customer_email || 'unknown',
    customer_name: data.customer_name || null,
    product_id: data.items?.[0]?.price?.product_id || null,
    amount: data.details?.totals?.total || 0,
    currency: data.currency_code || 'USD',
    status: 'active',
    purchased_at: data.created_at || new Date().toISOString(),
  };

  // Store license key with purchase data
  await storeLicenseMapping(licenseKey, purchaseData, env);

  // TODO: Send license key to customer via email
  // You can use a service like SendGrid, Resend, or Mailgun
  console.log(`Generated license key: ${licenseKey}`);
  console.log(`Customer email: ${purchaseData.customer_email}`);
  console.log(`Purchase data:`, purchaseData);
}

async function handlePaymentFailed(data, env) {
  console.log('Payment failed:', data.id);
  console.log('Customer:', data.customer_id);

  // Payment failed - no license key generated
  // Customer will need to try again
}

async function handleTransactionRefunded(data, env) {
  console.log('Transaction refunded:', data.id);

  // TODO: Mark license as refunded in KV storage
  // You would need to look up the license key by transaction ID
  // and update its status to 'refunded'

  // For now, just log it
  console.log('TODO: Revoke license for transaction:', data.id);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate a license key from transaction ID
 */
function generateLicenseKey(transactionId) {
  // Simple implementation - in production, use crypto for security
  const hash = transactionId.replace(/[^A-Z0-9]/gi, '').toUpperCase();
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
