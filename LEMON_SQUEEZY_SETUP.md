# LemonSqueezy Integration Guide for Element Blur

## Why LemonSqueezy?

✅ **Built-in license key management**
✅ **Automatic key generation**
✅ **Low fees (5% + payment processing)**
✅ **Professional API**
✅ **Webhook support**
✅ **Perfect for scaling**
✅ **Handles taxes automatically**

---

## Step 1: Create LemonSqueezy Account

1. Go to https://lemonsqueezy.com
2. Sign up for an account
3. Complete your store setup:
   - Store name
   - Store URL (e.g., `yourname.lemonsqueezy.com`)
   - Payment details
   - Tax settings

---

## Step 2: Create Your Product

### 2.1 Create Product

1. Go to **Products** → **New Product**
2. Fill in details:
   - **Name**: "Element Blur Premium - Lifetime License"
   - **Description**:
     ```
     Unlock all premium features of Element Blur Chrome Extension:

     ✓ Unlimited Undo/Redo History
     ✓ Quick Select Similar Elements
     ✓ Unlimited Custom Presets
     ✓ Import/Export Presets
     ✓ All Future Updates

     One-time payment. No subscriptions. Lifetime access.
     ```
   - **Price**: $14.99 USD
   - **Product Type**: Single payment

### 2.2 Enable License Keys

1. In your product settings, scroll to **License Keys**
2. Toggle **Enable license keys** ON
3. Configure:
   - **Activation limit**: Unlimited (or set to 3-5 devices)
   - **Key format**: Leave default (LemonSqueezy generates secure keys)
   - **Expires**: Never

4. Save product

---

## Step 3: Get Your API Key

1. Go to **Settings** → **API**
2. Click **Create API key**
3. Name it: "Element Blur Extension"
4. **Copy the API key** - you'll need this!
5. Keep it secure (never commit to git)

Example key format:
```
eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...
```

---

## Step 4: Get Your Store ID & Product ID

### Find Store ID:
1. Go to **Settings** → **Stores**
2. Your store ID is in the URL: `lemonsqueezy.com/dashboard/stores/{STORE_ID}`

### Find Product ID:
1. Go to **Products**
2. Click your product
3. Product ID is in the URL: `lemonsqueezy.com/dashboard/products/{PRODUCT_ID}`

**Save these numbers!**

---

## Step 5: Update Extension Files

### 5.1 Update `premium-ui.js`

Update the checkout URL with your LemonSqueezy product:

```javascript
// Line 83-85 in premium-ui.js
<a href="https://yourstore.lemonsqueezy.com/checkout/buy/PRODUCT_ID" target="_blank" class="blur-btn blur-btn-buy">
  <i class="bi bi-cart-fill"></i>
  <span>Buy Premium License</span>
</a>
```

**Get checkout URL:**
1. Go to your product in LemonSqueezy
2. Click **Get Checkout URL**
3. Copy and paste it

### 5.2 Update support email

```javascript
// Line 610 in premium-ui.js
window.open('mailto:your-email@domain.com?subject=Element Blur Support', '_blank');
```

---

## Step 6: Backend Setup

You'll need a simple backend to validate licenses. Here are two options:

### Option A: Cloudflare Worker (Recommended - FREE!)

**Why?**
- ✅ Free (up to 100k requests/day)
- ✅ No server management
- ✅ Global CDN
- ✅ HTTPS by default

**Setup:**

1. **Install Wrangler (Cloudflare CLI):**
   ```bash
   npm install -g wrangler
   wrangler login
   ```

2. **Create new worker:**
   ```bash
   mkdir element-blur-api
   cd element-blur-api
   wrangler init
   ```

3. **Create `src/index.js`:**

```javascript
// Cloudflare Worker for LemonSqueezy License Validation
export default {
  async fetch(request, env) {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Only allow POST
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const { license_key, email, product, version } = await request.json();

      // Validate with LemonSqueezy API
      const response = await fetch(
        `https://api.lemonsqueezy.com/v1/licenses/validate`,
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

      const data = await response.json();

      // Check if license is valid
      const isValid = data.valid === true && data.license_key?.status === 'active';

      return new Response(
        JSON.stringify({
          valid: isValid,
          message: isValid ? 'License activated successfully!' : 'Invalid or inactive license key',
          data: isValid ? {
            email: data.meta?.customer_email,
            activated_at: new Date().toISOString(),
            product: data.meta?.product_name,
            customer_name: data.meta?.customer_name,
            expires: data.license_key?.expires_at,
          } : null,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({
          valid: false,
          message: 'Validation error: ' + error.message,
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
  },
};
```

4. **Deploy:**
   ```bash
   wrangler deploy
   ```

5. **Get your worker URL:**
   ```
   https://element-blur-api.YOUR_SUBDOMAIN.workers.dev
   ```

6. **Update `license.js` (line 7):**
   ```javascript
   API_URL: 'https://element-blur-api.YOUR_SUBDOMAIN.workers.dev',
   ```

---

### Option B: Node.js/Express (If you have a server)

**Create `server.js`:**

```javascript
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

const LEMONSQUEEZY_API_KEY = process.env.LEMONSQUEEZY_API_KEY;

app.post('/api/validate-license', async (req, res) => {
  try {
    const { license_key, email, product, version } = req.body;

    // Validate with LemonSqueezy
    const response = await fetch('https://api.lemonsqueezy.com/v1/licenses/validate', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        license_key: license_key,
        instance_name: email || 'chrome-extension',
      }),
    });

    const data = await response.json();
    const isValid = data.valid === true && data.license_key?.status === 'active';

    res.json({
      valid: isValid,
      message: isValid ? 'License activated successfully!' : 'Invalid or inactive license key',
      data: isValid ? {
        email: data.meta?.customer_email,
        activated_at: new Date().toISOString(),
        product: data.meta?.product_name,
        customer_name: data.meta?.customer_name,
        expires: data.license_key?.expires_at,
      } : null,
    });
  } catch (error) {
    res.status(500).json({
      valid: false,
      message: 'Validation error: ' + error.message,
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

**Run:**
```bash
npm install express cors node-fetch
export LEMONSQUEEZY_API_KEY="your_api_key"
node server.js
```

---

## Step 7: Setup Webhook (Optional but Recommended)

Webhooks notify you when purchases happen. You can auto-send welcome emails, log sales, etc.

### 7.1 Create Webhook Endpoint

Add to your Cloudflare Worker or Node.js server:

```javascript
// Add this route to handle webhooks
app.post('/webhooks/lemonsqueezy', async (req, res) => {
  const event = req.body;

  // Verify webhook signature (recommended)
  // See: https://docs.lemonsqueezy.com/help/webhooks#signing-requests

  if (event.meta.event_name === 'order_created') {
    const order = event.data.attributes;
    const licenseKey = order.first_order_item?.license_key;
    const customerEmail = order.user_email;
    const customerName = order.user_name;

    // Send welcome email with license key
    await sendWelcomeEmail(customerEmail, customerName, licenseKey);

    // Log sale to analytics
    console.log('New sale:', {
      email: customerEmail,
      license: licenseKey,
      amount: order.total,
    });
  }

  res.json({ received: true });
});

async function sendWelcomeEmail(email, name, licenseKey) {
  // Use SendGrid, Resend, or your email service
  // See email template below
}
```

### 7.2 Register Webhook in LemonSqueezy

1. Go to **Settings** → **Webhooks**
2. Click **Add webhook**
3. Fill in:
   - **URL**: `https://your-api.workers.dev/webhooks/lemonsqueezy`
   - **Events**: Select `order_created`
   - **Signing secret**: Copy this (for verification)
4. Save

---

## Step 8: Email Template for Customers

When someone purchases, send them this email (via webhook or manually):

```
Subject: Your Element Blur Premium License 🎉

Hi {{customer_name}},

Thank you for purchasing Element Blur Premium!

Your lifetime license key is:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{{license_key}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HOW TO ACTIVATE:

1. Open Chrome and click the Element Blur extension icon
2. Click the ⭐ Star button in the toolbar
3. Enter your license key above
4. Click "Activate License"

All premium features are now unlocked forever!

✓ Unlimited Undo/Redo
✓ Quick Select Similar Elements
✓ Unlimited Custom Presets
✓ Import/Export Presets
✓ All Future Updates

Need help? Just reply to this email.

Best regards,
{{your_name}}

P.S. Save this email - you'll need the license key if you reinstall the extension.
```

**Automate with Resend.com (recommended):**

```javascript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendWelcomeEmail(email, name, licenseKey) {
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
      <!-- Rest of template -->
    `,
  });
}
```

---

## Step 9: Testing

### Test the Complete Flow:

1. **Create test purchase in LemonSqueezy:**
   - Go to your product
   - Click **Test Mode** toggle (top right)
   - Use test card: `4242 4242 4242 4242`
   - Complete purchase
   - Get test license key

2. **Test activation:**
   - Load extension in Chrome
   - Click star button
   - Enter test license key
   - Should activate successfully!

3. **Test validation:**
   - Check browser console for API calls
   - Verify backend receives requests
   - Check LemonSqueezy dashboard for API logs

---

## Step 10: Go Live

### Pre-launch Checklist:

- [ ] LemonSqueezy product created
- [ ] License keys enabled
- [ ] Pricing set ($14.99)
- [ ] Checkout URL updated in extension
- [ ] Backend deployed and working
- [ ] API endpoint updated in license.js
- [ ] Webhook configured (optional)
- [ ] Test purchase completed successfully
- [ ] Test activation works
- [ ] Email template ready
- [ ] Support email updated
- [ ] Removed `generateLicenseKey()` from production

### Launch:

1. **Turn off Test Mode** in LemonSqueezy
2. **Publish extension** to Chrome Web Store
3. **Announce launch:**
   - Twitter/X
   - Product Hunt
   - Reddit (r/SideProject, r/webdev)
   - Your email list

---

## Pricing Strategy

### Recommended Launch Pricing:

**Early Bird Special:**
- Price: **$9.99**
- Limit: First 100 buyers
- Creates urgency

**Regular Price:**
- Price: **$14.99**
- Standard lifetime license

**Implement in LemonSqueezy:**
1. Create discount code: `EARLYBIRD`
2. 33% off ($9.99)
3. Limit to 100 uses
4. Share on launch

---

## Analytics & Tracking

### Track Key Metrics:

1. **In LemonSqueezy Dashboard:**
   - Revenue
   - Conversion rate
   - Average order value
   - Refund rate

2. **Custom Analytics:**

```javascript
// Add to webhook handler
app.post('/webhooks/lemonsqueezy', async (req, res) => {
  const event = req.body;

  if (event.meta.event_name === 'order_created') {
    // Track with your analytics
    await analytics.track({
      event: 'License Purchased',
      userId: event.data.attributes.user_email,
      properties: {
        revenue: event.data.attributes.total / 100,
        licenseKey: event.data.attributes.first_order_item?.license_key,
      },
    });
  }
});
```

---

## Support & Refunds

### Handle Support Requests:

**Common issues:**

1. **"Lost my license key"**
   - Customers can access via LemonSqueezy email
   - Or check their dashboard at lemonsqueezy.com/my-orders

2. **"License not activating"**
   - Check they're copying full key
   - Verify backend is running
   - Check browser console for errors

3. **"Request a refund"**
   - LemonSqueezy handles automatically
   - 30-day money-back guarantee
   - You can manually issue refunds in dashboard

### Refund Policy:

Add to your product description:
```
30-day money-back guarantee. If you're not satisfied,
email us for a full refund, no questions asked.
```

---

## Advanced: License Key Limits

If you want to limit activations per license:

1. **In LemonSqueezy product settings:**
   - Set **Activation limit**: 3 devices

2. **Update validation logic:**
   - LemonSqueezy API returns `activation_usage`
   - Check if limit exceeded
   - Show message: "License activated on maximum devices"

3. **Allow deactivation:**
   - Users can deactivate from extension
   - Call LemonSqueezy API to remove instance
   - Frees up slot for new device

---

## Cost Breakdown

### LemonSqueezy Fees:

**Per Sale ($14.99):**
- LemonSqueezy fee: 5% = $0.75
- Payment processing: ~2.9% + $0.30 = $0.74
- **Total fees**: ~$1.49
- **Your profit**: ~$13.50

**Cloudflare Worker:**
- Free up to 100k requests/day
- Even 1000 sales = only 2000 requests (well within limit)

**Total monthly cost**: **$0** (until you scale significantly)

---

## Troubleshooting

### "API validation failed"

**Check:**
1. Worker URL is correct in license.js
2. CORS is enabled
3. Worker is deployed: `wrangler deploy`
4. Check worker logs: `wrangler tail`

### "License shows as invalid"

**Check:**
1. License key status in LemonSqueezy dashboard
2. API response in Network tab
3. License hasn't been refunded
4. License activation limit not exceeded

### "No license key in order"

**Check:**
1. License keys are enabled in product settings
2. Product type is correct
3. Check LemonSqueezy dashboard for the order

---

## Environment Variables

Create `.env` file (DON'T commit to git):

```bash
# LemonSqueezy
LEMONSQUEEZY_API_KEY=eyJ0eXAiOiJKV1QiLCJhbGc...
LEMONSQUEEZY_STORE_ID=12345
LEMONSQUEEZY_PRODUCT_ID=67890
LEMONSQUEEZY_WEBHOOK_SECRET=whsec_...

# Email (if using Resend)
RESEND_API_KEY=re_...

# Optional analytics
MIXPANEL_TOKEN=...
```

Add to `.gitignore`:
```
.env
.env.local
```

---

## Next Steps

1. ✅ Create LemonSqueezy account
2. ✅ Set up product with license keys
3. ✅ Get API key
4. ✅ Deploy Cloudflare Worker
5. ✅ Update extension URLs
6. ✅ Test with test mode
7. ✅ Set up webhook
8. ✅ Create email template
9. ✅ Launch! 🚀

---

## Resources

- **LemonSqueezy Docs**: https://docs.lemonsqueezy.com
- **API Reference**: https://docs.lemonsqueezy.com/api
- **Webhooks Guide**: https://docs.lemonsqueezy.com/help/webhooks
- **Cloudflare Workers**: https://workers.cloudflare.com
- **Resend (emails)**: https://resend.com

---

## Questions?

Common questions answered:

**Q: Do I need the webhook?**
A: No, but it's very useful for automated emails and analytics.

**Q: Can I use Vercel/Netlify instead of Cloudflare?**
A: Yes! Both support serverless functions. Similar setup.

**Q: What if my API goes down?**
A: Extension falls back to offline validation (checksum-based).

**Q: Can I change pricing later?**
A: Yes, in LemonSqueezy dashboard. Existing customers keep their price.

**Q: How do I handle taxes?**
A: LemonSqueezy handles EU VAT, US sales tax automatically.

---

**Ready to launch! Good luck! 🚀**
