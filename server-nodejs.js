// Node.js/Express server for Element Blur License Validation
// Alternative to Cloudflare Worker if you have your own server
// Run with: node server-nodejs.js

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'element-blur-license-api' });
});

// License validation endpoint
app.post('/api/validate-license', async (req, res) => {
  try {
    const { license_key, email, product, version } = req.body;

    // Validate input
    if (!license_key) {
      return res.status(400).json({
        valid: false,
        message: 'License key is required'
      });
    }

    console.log('Validating license:', {
      key: license_key.substring(0, 10) + '...',
      email,
      product,
      version
    });

    // Validate with LemonSqueezy API
    const lsResponse = await fetch(
      'https://api.lemonsqueezy.com/v1/licenses/validate',
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          license_key: license_key,
          instance_name: email || 'chrome-extension',
        }),
      }
    );

    if (!lsResponse.ok) {
      throw new Error(`LemonSqueezy API error: ${lsResponse.status}`);
    }

    const data = await lsResponse.json();

    // Check if license is valid and active
    const isValid = data.valid === true && data.license_key?.status === 'active';

    // Check activation limit
    const activationLimit = data.license_key?.activation_limit;
    const activationUsage = data.license_key?.activation_usage;
    const limitReached = activationLimit && activationUsage >= activationLimit;

    // Prepare response
    const response = {
      valid: isValid && !limitReached,
      message: isValid
        ? (limitReached
            ? 'License activated on maximum number of devices. Please deactivate on another device.'
            : 'License activated successfully!')
        : 'Invalid or inactive license key',
      data: isValid ? {
        email: data.meta?.customer_email,
        customer_name: data.meta?.customer_name,
        product_name: data.meta?.product_name,
        variant_name: data.meta?.variant_name,
        activated_at: new Date().toISOString(),
        activation_limit: activationLimit,
        activation_usage: activationUsage,
        expires_at: data.license_key?.expires_at,
        status: data.license_key?.status,
      } : null,
    };

    console.log('Validation result:', {
      valid: response.valid,
      email: data.meta?.customer_email
    });

    res.json(response);

  } catch (error) {
    console.error('Validation error:', error);

    res.status(500).json({
      valid: false,
      message: 'Validation failed: ' + error.message,
      error: error.toString(),
    });
  }
});

// Webhook endpoint for LemonSqueezy
app.post('/webhooks/lemonsqueezy', async (req, res) => {
  try {
    const event = req.body;

    // TODO: Verify webhook signature
    // See: https://docs.lemonsqueezy.com/help/webhooks#signing-requests
    // const signature = req.headers['x-signature'];
    // const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
    // if (!verifySignature(signature, req.body, secret)) {
    //   return res.status(401).json({ error: 'Invalid signature' });
    // }

    console.log('Webhook received:', event.meta?.event_name);

    // Handle different webhook events
    switch (event.meta?.event_name) {
      case 'order_created':
        await handleOrderCreated(event);
        break;

      case 'order_refunded':
        await handleOrderRefunded(event);
        break;

      case 'license_key_created':
        await handleLicenseKeyCreated(event);
        break;

      default:
        console.log('Unhandled webhook event:', event.meta?.event_name);
    }

    res.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook handlers
async function handleOrderCreated(event) {
  const order = event.data.attributes;
  const licenseKey = order.first_order_item?.license_key;
  const customerEmail = order.user_email;
  const customerName = order.user_name;

  console.log('New order:', {
    email: customerEmail,
    license: licenseKey ? licenseKey.substring(0, 10) + '...' : 'N/A',
    total: order.total_formatted,
  });

  // TODO: Send welcome email with license key
  // await sendWelcomeEmail(customerEmail, customerName, licenseKey);

  // TODO: Track in analytics
  // await analytics.track({
  //   event: 'License Purchased',
  //   userId: customerEmail,
  //   properties: {
  //     revenue: order.total / 100,
  //     licenseKey: licenseKey,
  //   },
  // });
}

async function handleOrderRefunded(event) {
  const order = event.data.attributes;
  console.log('Order refunded:', order.user_email);

  // TODO: Notify customer
  // TODO: Deactivate license if needed
}

async function handleLicenseKeyCreated(event) {
  const license = event.data.attributes;
  console.log('License key created:', license.key?.substring(0, 10) + '...');
}

// Email function (placeholder)
async function sendWelcomeEmail(email, name, licenseKey) {
  // TODO: Implement with SendGrid, Resend, or your email service
  console.log(`Would send email to ${email} with license ${licenseKey}`);

  /*
  // Example with Resend:
  const { Resend } = require('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: 'Element Blur <noreply@yourdomain.com>',
    to: email,
    subject: 'Your Element Blur Premium License 🎉',
    html: `
      <h2>Hi ${name},</h2>
      <p>Thank you for purchasing Element Blur Premium!</p>
      <p>Your lifetime license key is:</p>
      <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; font-family: monospace; font-size: 18px; text-align: center;">
        ${licenseKey}
      </div>
      <p>To activate, open the extension and click the star button, then enter your license key.</p>
    `,
  });
  */
}

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Element Blur License API running on port ${PORT}`);
  console.log(`📍 Validation endpoint: http://localhost:${PORT}/api/validate-license`);
  console.log(`📍 Webhook endpoint: http://localhost:${PORT}/webhooks/lemonsqueezy`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  process.exit(0);
});
