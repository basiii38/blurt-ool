# 🍋 Complete LemonSqueezy Integration Guide for Element Blur

**Last Updated**: 2025-11-18
**Estimated Time**: 2-3 hours
**Difficulty**: Beginner to Intermediate
**Domain**: blurtkit.online

---

## 📚 Table of Contents

1. [Why LemonSqueezy?](#why-lemonsqueezy)
2. [Prerequisites](#prerequisites)
3. [Architecture Overview](#architecture-overview)
4. [Part 1: LemonSqueezy Account & Product Setup](#part-1-lemonsqueezy-account--product-setup)
5. [Part 2: Backend Setup with Custom Domain](#part-2-backend-setup-with-custom-domain)
6. [Part 3: Extension Integration](#part-3-extension-integration)
7. [Part 4: Email Automation](#part-4-email-automation)
8. [Part 5: Webhooks Setup](#part-5-webhooks-setup)
9. [Part 6: Testing](#part-6-testing)
10. [Part 7: Going Live](#part-7-going-live)
11. [Advanced Features](#advanced-features)
12. [Troubleshooting](#troubleshooting)
13. [FAQ](#faq)

---

## Why LemonSqueezy?

✅ **Built-in license key management** - No need to build your own system
✅ **Automatic key generation** - Keys created instantly on purchase
✅ **Low fees** (5% + payment processing) - Better than Gumroad
✅ **Professional API** - Easy integration with excellent docs
✅ **Webhook support** - Real-time notifications for events
✅ **Perfect for scaling** - From 0 to 10,000+ customers
✅ **Handles taxes automatically** - EU VAT, US sales tax all done
✅ **No monthly fees** - Pay only when you sell

**Comparison with alternatives:**

| Feature | LemonSqueezy | Gumroad | Paddle |
|---------|-------------|---------|--------|
| License Keys | ✅ Built-in | ❌ Manual | ✅ Via API |
| Fees | 5% + stripe | 10% | 5% + $0.50 |
| API Quality | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| Setup Time | 1 hour | 30 min | 2 hours |

---

## Prerequisites

### Required:
- ✅ A LemonSqueezy account (free to create)
- ✅ Node.js installed (v18 or higher)
- ✅ Git installed
- ✅ Text editor (VS Code recommended)
- ✅ Chrome browser
- ✅ Command line/terminal access

### Optional:
- ☁️ Cloudflare account (free)
- 📧 Resend.com account (for automated emails)
- 🌐 Custom domain: **blurtkit.online** (you have this!)

### Check your Node.js version:
```bash
node --version
# Should show v18.0.0 or higher
```

If you don't have Node.js:
1. Visit https://nodejs.org
2. Download the **LTS** version
3. Install and restart your terminal

---

## Architecture Overview

Here's how everything works together:

```
┌─────────────────────────────────────────────────────────────────┐
│                         Customer Journey                         │
└─────────────────────────────────────────────────────────────────┘

1. Customer visits Chrome Web Store
   └─> Installs Element Blur Extension

2. Customer clicks "⭐ Go Premium" button
   └─> Redirects to: https://blurtkit.online/buy
       (or LemonSqueezy checkout URL)

3. Customer completes purchase on LemonSqueezy
   └─> LemonSqueezy generates license key
   └─> Sends email with license key
   └─> Triggers webhook (optional)

4. Customer enters license key in extension
   └─> Extension calls: https://api.blurtkit.online/validate
   └─> Cloudflare Worker validates with LemonSqueezy API
   └─> Returns: { valid: true/false }

5. Extension unlocks premium features
   └─> License stored locally in Chrome storage
   └─> Premium features activated
```

### Components:

1. **LemonSqueezy** - Payment processor & license key manager
2. **Cloudflare Worker** - Serverless API at api.blurtkit.online
3. **Extension** - Chrome extension with premium features
4. **Custom Domain** - blurtkit.online for professional branding

---

## Part 1: LemonSqueezy Account & Product Setup

⏱️ **Estimated Time**: 45 minutes

### Step 1.1: Create LemonSqueezy Account

**Follow these exact steps:**

1. **Open your browser** and go to https://lemonsqueezy.com

2. **Click "Get started free"** (purple button in top right)

3. **Fill in registration form:**
   ```
   Email: your-email@domain.com
   Password: [Create a strong password - min 8 characters]
   Name: Your Name
   ```

4. **Verify your email:**
   - Check your inbox for verification email
   - Click the verification link
   - Wait for redirect back to LemonSqueezy

5. **Complete store setup wizard:**

   **Page 1 - Store Details:**
   ```
   Store Name: Element Blur
   Store URL: element-blur.lemonsqueezy.com
   (or use: blurtkit.lemonsqueezy.com)
   ```
   > ⚠️ **Important**: Store URL cannot be changed later!

   **Page 2 - What will you sell:**
   ```
   Select: "Software" or "Digital Products"
   ```

   **Page 3 - Business Details:**
   ```
   Country: [Your country]
   Business Type: Individual / Company
   ```

6. **Click "Complete Setup"**

**✅ Checkpoint:** You should now see your LemonSqueezy dashboard with a sidebar menu.

---

### Step 1.2: Configure Payment & Tax Settings

**Why this matters:** LemonSqueezy needs to know where to send your money and handles tax compliance automatically.

#### Configure Payouts:

1. **Navigate:** Click **Settings** (gear icon) → **Payouts**

2. **Add payout method:**
   - **Option A - Bank Account (Recommended):**
     ```
     Account holder name: [Your name]
     Account number: [Your bank account]
     Routing number: [Your routing number]
     Bank name: [Your bank]
     ```

   - **Option B - PayPal:**
     ```
     PayPal email: your-paypal@email.com
     ```

3. **Set payout schedule:**
   ```
   Frequency: Monthly (recommended for beginners)
   Minimum threshold: $50 (default)
   ```

4. **Click "Save"**

#### Configure Tax Settings:

1. **Navigate:** Settings → **Tax & Billing**

2. **Enter tax information:**
   ```
   Country: [Your country]
   State/Province: [If applicable]
   Tax ID/VAT ID: [If you have one - optional for small sellers]
   ```

3. **Enable automatic tax collection:**
   ```
   ✅ Collect EU VAT (if selling to EU)
   ✅ Collect US Sales Tax (if selling to US)
   ```

   > 💡 **Tip**: LemonSqueezy handles all tax calculations and reporting automatically!

4. **Click "Save Settings"**

**✅ Checkpoint:** Green checkmarks next to "Payouts" and "Tax" in Settings menu.

**📸 Screenshot tip:** Take a screenshot of your settings for reference.

---

### Step 1.3: Create Your Product

**This is the core of your monetization!**

#### Create Product:

1. **Navigate:** Click **Products** in sidebar → **Click "+" button**

2. **Fill in product details:**

   **Basic Information:**
   ```
   Name: Element Blur Premium - Lifetime License

   Slug: element-blur-premium
   (This will be in your URL: /checkout/buy/element-blur-premium)
   ```

   **Description:** (Copy this template)
   ```
   🎨 Unlock the Full Power of Element Blur

   Transform how you browse the web with premium features:

   ✅ Unlimited Undo/Redo History - Never lose your changes
   ✅ Quick Select Similar Elements - Blur multiple items instantly
   ✅ Unlimited Custom Presets - Save your favorite blur configurations
   ✅ Import/Export Presets - Share and backup your settings
   ✅ Priority Support - Get help when you need it
   ✅ All Future Updates - New features included forever

   🎁 ONE-TIME PAYMENT | NO SUBSCRIPTION | LIFETIME ACCESS

   💰 30-Day Money-Back Guarantee
   📧 Instant license delivery via email
   ⚡ Activates in seconds

   Works with Chrome, Edge, Brave, and all Chromium browsers.
   ```

   **Pricing:**
   ```
   Price: $14.99 USD
   Currency: USD
   ```

   **Product Type:**
   ```
   Select: "Single Payment" (NOT subscription)
   ```

3. **Add product image** (optional but recommended):
   - Recommended size: 1200 x 630 pixels
   - Use a logo or screenshot of the extension
   - Click "Upload Image"

4. **Click "Create Product"**

**✅ Checkpoint:** Your product appears in the Products list.

---

### Step 1.4: Enable License Keys (CRITICAL!)

**This is what makes the premium features work!**

1. **Open your product:** Click on the product you just created

2. **Scroll to "License Keys" section** (about halfway down the page)

3. **Toggle "Enable license keys"** to ON (should turn purple/blue)

4. **Configure license settings:**

   ```
   ┌─────────────────────────────────────────────────────────┐
   │ License Key Settings                                     │
   ├─────────────────────────────────────────────────────────┤
   │ ✅ Enable license keys: ON                              │
   │                                                          │
   │ Activation Limit:                                        │
   │ ○ Unlimited                                             │
   │ ● Limited [5] activations per license                   │
   │                                                          │
   │ License Expiration:                                      │
   │ ● Never expires (Lifetime)                              │
   │ ○ Expires after [X] days                                │
   │                                                          │
   │ Key Format: [Auto-generated secure keys]                │
   └─────────────────────────────────────────────────────────┘
   ```

   **Recommended Settings:**
   - **Activation Limit**: 5 activations
     > This prevents abuse while allowing legitimate customers to use multiple devices

   - **Expires**: Never
     > Lifetime license is more attractive to customers

   - **Key Format**: Leave as default
     > LemonSqueezy generates secure, unique keys

5. **Scroll up and click "Save Product"** (top right corner)

**✅ Checkpoint:** Refresh the product page. License Keys section should still show "Enabled" with your settings.

**⚠️ Common Mistake:** Forgetting to click "Save Product" - your changes won't be saved!

---

### Step 1.5: Get Your API Key

**What is an API Key?**
Think of it as a secure password that lets your Cloudflare Worker communicate with LemonSqueezy to validate license keys.

**Steps:**

1. **Navigate:** Click **Settings** → **API**

2. **Click "Create API key"** button (top right)

3. **Fill in API key form:**
   ```
   Name: Element Blur Production API
   Description: Used by Cloudflare Worker to validate licenses
   ```

4. **Click "Create"**

5. **🔴 CRITICAL - COPY THE API KEY NOW:**
   ```
   Your API key will look like:
   eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpZCI6IjEyMzQ1Njc4OTAi...
   [Very long string - about 500+ characters]
   ```

   **⚠️ YOU CAN ONLY SEE THIS ONCE!**

   **Save it immediately:**
   - Open Notepad/TextEdit
   - Paste the key
   - Save as `lemonsqueezy-api-key.txt`
   - **DO NOT commit this to git**
   - **DO NOT share publicly**

6. **Click "Done"**

**✅ Checkpoint:** You have the API key saved in a text file on your computer.

---

### Step 1.6: Find Your Store ID & Product ID

**Why you need these:** Your extension needs these IDs to know which LemonSqueezy store and product to interact with.

#### Find Store ID:

1. **Navigate:** Settings → **Stores**

2. **Look at browser URL bar:**
   ```
   https://app.lemonsqueezy.com/settings/stores/12345
                                                  ^^^^^
                                            This is your Store ID
   ```

3. **Copy the number** (example: `12345`)

4. **Save it:**
   ```
   Store ID: 12345
   ```

#### Find Product ID:

1. **Navigate:** Products → **Click your product**

2. **Look at browser URL bar:**
   ```
   https://app.lemonsqueezy.com/products/67890
                                         ^^^^^
                                    This is your Product ID
   ```

3. **Copy the number** (example: `67890`)

4. **Save it:**
   ```
   Product ID: 67890
   ```

**📝 Create a reference document:**
Create a file called `lemonsqueezy-config.txt` with:
```
LEMONSQUEEZY CONFIGURATION
=========================

Store ID: 12345
Product ID: 67890
Store URL: element-blur.lemonsqueezy.com
API Key: eyJ0eXAiOiJKV... [KEEP SECRET]

Checkout URL: https://element-blur.lemonsqueezy.com/checkout/buy/67890
```

**✅ Checkpoint:** You have all IDs saved and can reference them easily.

---

## Part 2: Backend Setup with Custom Domain

⏱️ **Estimated Time**: 60 minutes

### Overview

We'll set up a Cloudflare Worker that:
1. Validates license keys with LemonSqueezy API
2. Runs on your custom domain: `api.blurtkit.online`
3. Handles CORS for extension requests
4. Returns validation responses

**Why Cloudflare Workers?**
- ✅ FREE (100,000 requests/day)
- ✅ Global edge network (super fast)
- ✅ No server management
- ✅ HTTPS by default
- ✅ Custom domain support

---

### Step 2.1: Install Prerequisites

#### Check if you have Node.js:

Open terminal and run:
```bash
node --version
npm --version
```

**Expected output:**
```
v18.16.0  (or higher)
9.5.1    (or higher)
```

**If you get "command not found":**

1. Go to https://nodejs.org/
2. Download **LTS version** (left button)
3. Install (click through wizard)
4. **Restart your terminal**
5. Try `node --version` again

---

### Step 2.2: Install Wrangler CLI

**What is Wrangler?**
Cloudflare's command-line tool for deploying workers.

**Install globally:**
```bash
npm install -g wrangler
```

**Verify installation:**
```bash
wrangler --version
```

**Expected output:**
```
⛅️ wrangler 3.22.0
```

**Troubleshooting:**
- **Mac permission error:** Use `sudo npm install -g wrangler`
- **Windows permission error:** Run PowerShell as Administrator

---

### Step 2.3: Login to Cloudflare

#### Create Cloudflare account (if you don't have one):

1. Go to https://dash.cloudflare.com/sign-up
2. Enter email and create password
3. Verify email

#### Login with Wrangler:

```bash
wrangler login
```

**What happens:**
1. Browser opens automatically
2. Cloudflare asks: "Allow Wrangler to access your account?"
3. Click **"Allow"**
4. Terminal shows: **"Successfully logged in!"**

**✅ Checkpoint:** Terminal shows you're logged in.

---

### Step 2.4: Create Worker Project

#### Create project directory:

```bash
# Navigate to where you want to create the project
cd ~/projects  # or wherever you keep your code

# Create new directory
mkdir blurtkit-api
cd blurtkit-api
```

#### Initialize Worker:

```bash
wrangler init
```

**Answer the prompts:**
```
? Would you like to use git for version control? › Yes
? Would you like to use TypeScript? › No (choose JavaScript for simplicity)
? Would you like to install dependencies with npm? › Yes
? Would you like to create a Worker at src/index.js? › Fetch handler
```

**What you'll see:**
```
✨ Created blurtkit-api/wrangler.toml
✨ Created blurtkit-api/src/index.js
✨ Installed dependencies
```

**✅ Checkpoint:** You should now have these files:
```
blurtkit-api/
├── node_modules/
├── src/
│   └── index.js
├── package.json
├── package-lock.json
└── wrangler.toml
```

---

### Step 2.5: Configure Worker

#### Edit wrangler.toml:

Open `wrangler.toml` in your text editor and update it:

```toml
name = "blurtkit-api"
main = "src/index.js"
compatibility_date = "2025-01-01"

# We'll add custom domain later
# For now, we'll use the default workers.dev subdomain
```

**Save the file.**

---

### Step 2.6: Write License Validation Code

#### Replace src/index.js:

Open `src/index.js` and **replace everything** with this code:

```javascript
/**
 * Blurt Kit - License Validation API
 * Validates Element Blur Premium licenses with LemonSqueezy
 */

export default {
  async fetch(request, env) {
    // CORS headers to allow extension to make requests
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400', // 24 hours
    };

    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders
      });
    }

    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response(
        JSON.stringify({
          error: 'Method not allowed',
          message: 'This endpoint only accepts POST requests'
        }),
        {
          status: 405,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }

    try {
      // Parse request body
      const body = await request.json();
      const { license_key, email, product, version } = body;

      // Validate required fields
      if (!license_key) {
        return new Response(
          JSON.stringify({
            valid: false,
            message: 'License key is required'
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          }
        );
      }

      // Validate license key with LemonSqueezy API
      const lemonSqueezyResponse = await fetch(
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

      const data = await lemonSqueezyResponse.json();

      // Check if license is valid and active
      const isValid = data.valid === true &&
                     data.license_key?.status === 'active';

      // Log validation attempt (useful for debugging)
      console.log('License validation:', {
        valid: isValid,
        status: data.license_key?.status,
        product: data.meta?.product_name,
        timestamp: new Date().toISOString()
      });

      // Return validation result
      return new Response(
        JSON.stringify({
          valid: isValid,
          message: isValid
            ? 'License activated successfully! Premium features unlocked.'
            : data.error || 'Invalid or inactive license key',
          data: isValid ? {
            email: data.meta?.customer_email,
            customer_name: data.meta?.customer_name,
            product_name: data.meta?.product_name,
            activated_at: new Date().toISOString(),
            expires_at: data.license_key?.expires_at,
            activation_usage: data.license_key?.activation_usage,
            activation_limit: data.license_key?.activation_limit,
          } : null,
        }),
        {
          status: isValid ? 200 : 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );

    } catch (error) {
      // Handle errors gracefully
      console.error('Validation error:', error);

      return new Response(
        JSON.stringify({
          valid: false,
          message: 'License validation failed. Please try again.',
          error: error.message,
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

**Save the file.**

**What this code does:**
1. ✅ Accepts POST requests from your extension
2. ✅ Handles CORS (Cross-Origin Resource Sharing)
3. ✅ Validates license keys with LemonSqueezy
4. ✅ Returns detailed validation results
5. ✅ Logs attempts for debugging
6. ✅ Handles errors gracefully

---

### Step 2.7: Deploy Worker

#### Deploy to Cloudflare:

```bash
wrangler deploy
```

**What happens:**
```
⛅️ wrangler 3.22.0
-----------------
Total Upload: 1.23 KiB / gzip: 0.56 KiB
Uploaded blurtkit-api (1.02 sec)
Published blurtkit-api (0.31 sec)
  https://blurtkit-api.YOUR-USERNAME.workers.dev
Current Deployment ID: abc123def456
```

**🎉 Your API is live!**

**Copy and save your Worker URL:**
```
https://blurtkit-api.YOUR-USERNAME.workers.dev
```

**✅ Checkpoint:** Worker is deployed and accessible.

---

### Step 2.8: Test the Worker

#### Test with curl:

```bash
curl -X POST https://blurtkit-api.YOUR-USERNAME.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"license_key":"test-key-12345","email":"test@example.com"}'
```

**Expected response:**
```json
{
  "valid": false,
  "message": "Invalid or inactive license key"
}
```

**This is GOOD!** It means the worker is running and validating (the test key is intentionally invalid).

#### Test with browser console:

1. Open Chrome
2. Press F12 (DevTools)
3. Go to Console tab
4. Paste this code (replace with your worker URL):

```javascript
fetch('https://blurtkit-api.YOUR-USERNAME.workers.dev', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    license_key: 'test-12345',
    email: 'test@example.com'
  })
})
.then(r => r.json())
.then(d => console.log('Response:', d));
```

**Expected console output:**
```javascript
Response: {
  valid: false,
  message: "Invalid or inactive license key"
}
```

**✅ Checkpoint:** Worker responds to requests correctly.

---

### Step 2.9: Set Up Custom Domain (blurtkit.online)

**Why use a custom domain?**
- ✅ Professional branding (`api.blurtkit.online` vs `blurtkit-api.username.workers.dev`)
- ✅ Easier to remember
- ✅ You can change worker names without breaking your extension

#### Add domain to Cloudflare:

1. **Go to Cloudflare Dashboard:** https://dash.cloudflare.com

2. **Click "Add a Site"**

3. **Enter your domain:**
   ```
   blurtkit.online
   ```

4. **Select plan:** Free (no credit card needed)

5. **Cloudflare will scan your DNS records**
   - Click "Continue"

6. **Update nameservers at your domain registrar:**

   Cloudflare will show you something like:
   ```
   Replace your nameservers with:
   - alexa.ns.cloudflare.com
   - reza.ns.cloudflare.com
   ```

   **Where did you buy blurtkit.online?**
   - **Namecheap:** Dashboard → Domain List → Manage → Nameservers → Custom DNS
   - **GoDaddy:** My Products → Domains → DNS → Nameservers → Change
   - **Google Domains:** DNS → Name servers → Custom name servers

   **Paste Cloudflare's nameservers** and save.

7. **Wait for DNS propagation** (can take 5-60 minutes)
   - Cloudflare will email you when it's active

**✅ Checkpoint:** Domain shows "Active" status in Cloudflare dashboard.

---

### Step 2.10: Configure Custom Domain for Worker

#### Add route to your worker:

1. **In Cloudflare dashboard,** go to: **Workers & Pages**

2. **Click your worker:** `blurtkit-api`

3. **Click "Settings" tab** → **Domains & Routes**

4. **Click "Add Custom Domain"**

5. **Enter subdomain:**
   ```
   api.blurtkit.online
   ```

6. **Click "Add Custom Domain"**

**Cloudflare automatically:**
- Creates DNS records
- Provisions SSL certificate
- Routes traffic to your worker

**Wait 1-2 minutes for SSL certificate provisioning.**

---

### Step 2.11: Test Custom Domain

#### Test with curl:

```bash
curl -X POST https://api.blurtkit.online \
  -H "Content-Type: application/json" \
  -d '{"license_key":"test","email":"test@example.com"}'
```

**Expected:**
```json
{
  "valid": false,
  "message": "Invalid or inactive license key"
}
```

**✅ Checkpoint:** Your worker responds on your custom domain!

**🎉 Your professional API is live at: `https://api.blurtkit.online`**

---

## Part 3: Extension Integration

⏱️ **Estimated Time**: 15 minutes

Now let's connect your extension to use your new API and LemonSqueezy checkout.

---

### Step 3.1: Update API URL in license.js

**File:** `license.js`

**Find this line (around line 7):**
```javascript
API_URL: 'https://your-domain.com/api/validate-license',
```

**Replace with your custom domain:**
```javascript
API_URL: 'https://api.blurtkit.online',
```

**Save the file.**

**✅ Checkpoint:** Extension will now use your Cloudflare Worker for validation.

---

### Step 3.2: Get Your LemonSqueezy Checkout URL

Before updating the extension, get your checkout URL from LemonSqueezy:

1. **Go to LemonSqueezy dashboard**
2. **Click Products** → **Click your product**
3. **Look for "Links" section** (right sidebar)
4. **Click "Get Checkout Link"** or find the checkout URL

**Your URL will look like:**
```
https://element-blur.lemonsqueezy.com/checkout/buy/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

**Or it might use your product ID:**
```
https://element-blur.lemonsqueezy.com/checkout/buy/67890-element-blur-premium
```

**Copy this entire URL!**

---

### Step 3.3: Update Checkout URL in premium-ui.js

**File:** `premium-ui.js`

**Find the buy button link (around line 83-85):**
```javascript
<a href="https://yourstore.lemonsqueezy.com/checkout/buy/PRODUCT_ID"
   target="_blank"
   class="blur-btn blur-btn-buy">
  <i class="bi bi-cart-fill"></i>
  <span>Buy Premium License</span>
</a>
```

**Replace with your actual checkout URL:**
```javascript
<a href="https://element-blur.lemonsqueezy.com/checkout/buy/YOUR-CHECKOUT-URL"
   target="_blank"
   class="blur-btn blur-btn-buy">
  <i class="bi bi-cart-fill"></i>
  <span>Buy Premium License - $14.99</span>
</a>
```

**Save the file.**

**✅ Checkpoint:** Clicking "Buy Premium" will now open your LemonSqueezy checkout.

---

### Step 3.4: Update Support Email

**File:** `premium-ui.js`

**Find the support email handler (around line 610):**
```javascript
window.open('mailto:your-email@domain.com?subject=Element Blur Support', '_blank');
```

**Replace with your real email:**
```javascript
window.open('mailto:support@blurtkit.online?subject=Element Blur Support', '_blank');
```

**Or use your personal email:**
```javascript
window.open('mailto:yourname@gmail.com?subject=Element Blur Support', '_blank');
```

**Save the file.**

---

### Step 3.5: Optional - Add Custom Domain for Checkout

Want to use `blurtkit.online/buy` instead of the long LemonSqueezy URL?

**Set up a redirect:**

1. **In Cloudflare dashboard** → **blurtkit.online** → **Rules** → **Page Rules**

2. **Create Page Rule:**
   ```
   URL: blurtkit.online/buy
   Setting: Forwarding URL (301 - Permanent Redirect)
   Destination: https://element-blur.lemonsqueezy.com/checkout/buy/YOUR-CHECKOUT-URL
   ```

3. **Save and Deploy**

**Now you can use:**
```javascript
<a href="https://blurtkit.online/buy" ...>
```

**Much cleaner!**

**✅ Checkpoint:** All extension files are updated with correct URLs.

---
## Part 4: Testing Everything

⏱️ **Estimated Time**: 20 minutes

Before going live, let's test the complete flow from purchase to activation.

---

### Step 4.1: Enable Test Mode in LemonSqueezy

1. **Go to LemonSqueezy dashboard**
2. **Toggle "Test Mode"** (top right corner) - should turn purple/blue
3. **You'll see a yellow banner:** "Test Mode Active"

**✅ Checkpoint:** Test Mode is enabled.

---

### Step 4.2: Make a Test Purchase

1. **Get your checkout URL** (from Step 3.2)
2. **Open in new tab**
3. **Complete checkout with test card:**
   ```
   Card Number: 4242 4242 4242 4242
   Expiry: 12/25 (any future date)
   CVC: 123 (any 3 digits)
   Email: your-real-email@domain.com (to receive test license)
   ```
4. **Complete purchase**

**What happens:**
- ✅ You'll see "Payment successful" page
- ✅ Email arrives with license key
- ✅ Order appears in LemonSqueezy dashboard

**✅ Checkpoint:** You have a test license key in your email.

---

### Step 4.3: Test License Activation

1. **Load extension in Chrome:**
   ```
   1. Go to chrome://extensions/
   2. Enable "Developer mode" (top right)
   3. Click "Load unpacked"
   4. Select your extension folder
   ```

2. **Open extension** (click icon in toolbar)

3. **Click ⭐ Premium button**

4. **Enter test license key** (from email)

5. **Click "Activate License"**

**Expected result:**
```
✅ License activated successfully! Premium features unlocked.
```

**Check in browser console (F12):**
```javascript
// Should see API request
POST https://api.blurtkit.online
Status: 200
Response: { valid: true, message: "License activated successfully!", data: {...} }
```

**✅ Checkpoint:** Extension shows "Premium Active" and premium features work.

---

### Step 4.4: Test Full Customer Journey

**Simulate a real customer:**

1. **Uninstall extension** (to reset state)
2. **Install extension again**
3. **Try premium feature** → Should show upgrade prompt
4. **Click "Buy Premium"** → Opens checkout
5. **Complete test purchase** → Get license key
6. **Activate license** → Premium unlocked
7. **Reload extension** → License still active (persisted)
8. **Try premium features** → All working!

**✅ Checkpoint:** Complete customer journey works perfectly.

---

### Step 4.5: Test Error Scenarios

**Test invalid license:**
```
License key: invalid-key-12345
Expected: ❌ "Invalid or inactive license key"
```

**Test empty license:**
```
License key: [leave empty]
Expected: ❌ "License key is required"
```

**Test network error:**
```
1. Disconnect internet
2. Try to activate license
Expected: ❌ "License validation failed. Please try again."
```

**✅ Checkpoint:** Error handling works correctly.

---

## Part 5: Webhooks Setup (Optional but Recommended)

⏱️ **Estimated Time**: 30 minutes

Webhooks notify you when purchases happen, allowing you to automate:
- Welcome emails with license keys
- Analytics tracking
- Customer database updates
- Slack notifications

---

### Step 5.1: Add Webhook Handler to Worker

**Edit your Cloudflare Worker** (`src/index.js`):

Add this webhook handler function at the end:

```javascript
// Add after the main export default { ... }

// Webhook endpoint for LemonSqueezy events
async function handleWebhook(request) {
  try {
    const payload = await request.json();
    const event = payload.meta?.event_name;

    console.log('Webhook received:', event);

    switch (event) {
      case 'order_created':
        await handleOrderCreated(payload);
        break;

      case 'license_key_created':
        await handleLicenseCreated(payload);
        break;

      default:
        console.log('Unhandled event:', event);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleOrderCreated(payload) {
  const order = payload.data.attributes;

  console.log('New order:', {
    email: order.user_email,
    name: order.user_name,
    total: order.total_formatted,
    created: order.created_at
  });

  // Here you could:
  // - Send welcome email (via Resend, SendGrid, etc.)
  // - Track analytics
  // - Update database
  // - Notify Slack/Discord
}

async function handleLicenseCreated(payload) {
  const license = payload.data.attributes;

  console.log('License created:', {
    key: license.key,
    status: license.status,
    customer: payload.meta?.customer_email
  });
}
```

**Update the main fetch handler to route webhooks:**

```javascript
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Route webhook requests
    if (url.pathname === '/webhook' && request.method === 'POST') {
      return handleWebhook(request);
    }

    // Existing license validation code...
    const corsHeaders = { /* ... */ };
    // ... rest of your code
  }
};
```

**Deploy the update:**
```bash
wrangler deploy
```

---

### Step 5.2: Register Webhook in LemonSqueezy

1. **Go to LemonSqueezy** → **Settings** → **Webhooks**

2. **Click "+" (Add webhook)**

3. **Fill in webhook details:**
   ```
   URL: https://api.blurtkit.online/webhook
   Events to send:
     ✅ order_created
     ✅ license_key_created
     ✅ license_key_updated (optional)
     ✅ subscription_payment_success (if using subscriptions)
   ```

4. **Copy the Signing Secret** (we'll verify signatures later)

5. **Click "Save"**

---

### Step 5.3: Test Webhook

1. **In LemonSqueezy** → **Settings** → **Webhooks** → **Click your webhook**

2. **Click "Send test webhook"**

3. **Check Cloudflare Worker logs:**
   ```bash
   wrangler tail
   ```

**Expected output:**
```
Webhook received: order_created
New order: { email: "test@example.com", ... }
```

**✅ Checkpoint:** Webhooks are working!

---

## Part 6: Email Automation (Optional)

⏱️ **Estimated Time**: 20 minutes

Automatically send welcome emails with license keys using Resend.com (free tier: 3,000 emails/month).

### Step 6.1: Set Up Resend

1. **Go to https://resend.com/signup**
2. **Create account**
3. **Get API key:** Dashboard → API Keys → Create
4. **Add DNS records** for your domain (to send from @blurtkit.online)

### Step 6.2: Add Resend to Worker

**Install Resend in your worker:**

```bash
npm install resend
```

**Update webhook handler:**

```javascript
import { Resend } from 'resend';

const resend = new Resend('YOUR_RESEND_API_KEY');

async function handleOrderCreated(payload) {
  const order = payload.data.attributes;
  const licenseKey = order.first_order_item?.license_key;

  // Send welcome email
  await resend.emails.send({
    from: 'Element Blur <noreply@blurtkit.online>',
    to: order.user_email,
    subject: 'Your Element Blur Premium License 🎉',
    html: `
      <h2>Hi ${order.user_name},</h2>
      <p>Thank you for purchasing Element Blur Premium!</p>

      <h3>Your License Key:</h3>
      <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; font-family: monospace; font-size: 18px; text-align: center; margin: 20px 0;">
        ${licenseKey}
      </div>

      <h3>How to Activate:</h3>
      <ol>
        <li>Open Chrome and click the Element Blur extension icon</li>
        <li>Click the ⭐ Premium button in the toolbar</li>
        <li>Enter your license key above</li>
        <li>Click "Activate License"</li>
      </ol>

      <p><strong>All premium features are now unlocked forever!</strong></p>

      <ul>
        <li>✅ Unlimited Undo/Redo</li>
        <li>✅ Quick Select Similar Elements</li>
        <li>✅ Unlimited Custom Presets</li>
        <li>✅ Import/Export Presets</li>
        <li>✅ All Future Updates</li>
      </ul>

      <p>Need help? Just reply to this email.</p>

      <p>Best regards,<br>The Element Blur Team</p>

      <p style="font-size: 12px; color: #666;">P.S. Save this email - you'll need the license key if you reinstall the extension.</p>
    `
  });
}
```

---

## Part 7: Going Live

⏱️ **Estimated Time**: 15 minutes

### Pre-Launch Checklist

Before you turn off test mode and go live:

- [ ] **LemonSqueezy Setup:**
  - [ ] Product created and configured
  - [ ] License keys enabled
  - [ ] Pricing set ($14.99 or your choice)
  - [ ] Checkout URL working
  - [ ] Payout method configured
  - [ ] Tax settings configured

- [ ] **Backend/API:**
  - [ ] Cloudflare Worker deployed
  - [ ] Custom domain configured (api.blurtkit.online)
  - [ ] License validation tested
  - [ ] Webhook configured (optional)
  - [ ] Email automation set up (optional)

- [ ] **Extension:**
  - [ ] API URL updated to api.blurtkit.online
  - [ ] Checkout URL updated
  - [ ] Support email updated
  - [ ] Test mode activation works
  - [ ] Premium features work when activated

- [ ] **Testing:**
  - [ ] Test purchase completed successfully
  - [ ] Test license activation works
  - [ ] Premium features unlock
  - [ ] Error handling tested

---

### Step 7.1: Turn Off Test Mode

1. **Go to LemonSqueezy dashboard**
2. **Toggle "Test Mode" OFF** (top right)
3. **Confirm:** "Yes, go live"

**⚠️ Important:** Test licenses won't work in production mode!

---

### Step 7.2: Submit Extension to Chrome Web Store

1. **Create `.zip` of extension:**
   ```bash
   cd /path/to/your/extension
   zip -r element-blur-v1.0.0.zip . -x "*.git*" -x "*node_modules*"
   ```

2. **Go to Chrome Web Store Developer Dashboard:**
   https://chrome.google.com/webstore/devconsole

3. **Click "New Item"**

4. **Upload .zip file**

5. **Fill in listing details:**
   - Title: "Element Blur - Blur Any Web Content"
   - Description: [Your description]
   - Screenshots: At least 5 screenshots (1280x800 or 640x400)
   - Category: Productivity
   - Language: English
   - Price: Free (with in-extension premium upgrade)

6. **Submit for review**

**⏱️ Review time:** Usually 1-7 days

---

### Step 7.3: Set Up Analytics (Recommended)

Track key metrics to understand your business:

**Free options:**
- **Plausible Analytics** (privacy-friendly, GDPR compliant)
- **Google Analytics** (more features, less privacy)
- **Mixpanel** (event-based tracking)

**Key metrics to track:**
1. Extension installs
2. Active users
3. Premium button clicks
4. Checkout visits
5. Purchases completed
6. License activations
7. Revenue

---

## Advanced Features

### Add Discount Codes

**In LemonSqueezy:**

1. **Go to Products** → **Your Product** → **Discounts**
2. **Create discount code:**
   ```
   Code: LAUNCH50
   Type: Percentage
   Amount: 50%
   Limit: 100 uses
   Expires: 7 days from now
   ```
3. **Share on launch:**
   ```
   🎉 Launch Special: 50% off with code LAUNCH50
   (First 100 customers only!)
   ```

### Add Activation Limits

**Limit devices per license:**

1. **Product Settings** → **License Keys**
2. **Set activation limit:** 3 or 5 devices
3. **Users can deactivate devices** in your extension settings

**Add deactivation button in extension:**

```javascript
async function deactivateLicense() {
  const licenseKey = await getLicenseKey();

  const response = await fetch('https://api.blurtkit.online/deactivate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ license_key: licenseKey })
  });

  if (response.ok) {
    await clearLicense();
    alert('License deactivated on this device');
  }
}
```

### Add License Management Dashboard

**Create a simple webpage:**

`https://blurtkit.online/manage`

Features:
- Enter license key
- See activation status
- View activated devices
- Deactivate devices remotely
- Download invoices

---

## Troubleshooting

### Issue: "Worker returns 404"

**Solutions:**
1. Verify worker is deployed: `wrangler deploy`
2. Check custom domain is set up correctly
3. Wait 1-2 minutes after deployment
4. Test with default workers.dev URL first

---

### Issue: "CORS error when validating license"

**Solutions:**
1. Check CORS headers in worker code
2. Verify corsHeaders includes `Access-Control-Allow-Origin: '*'`
3. Check browser console for exact error
4. Test API with curl to isolate extension vs API issue

---

### Issue: "License shows as invalid in production"

**Checklist:**
1. Test mode is OFF in LemonSqueezy?
2. Using production license (not test license)?
3. License status is "active" in LemonSqueezy dashboard?
4. License hasn't been refunded?
5. Activation limit not exceeded?

---

### Issue: "Custom domain not working"

**Solutions:**
1. Verify nameservers are updated at domain registrar
2. Check DNS propagation: https://www.whatsmydns.net/
3. Wait up to 24 hours for full DNS propagation
4. Check Cloudflare dashboard shows domain as "Active"
5. Verify custom domain route is configured for worker

---

### Issue: "Webhook not receiving events"

**Solutions:**
1. Check webhook URL is correct: `https://api.blurtkit.online/webhook`
2. Verify webhook is enabled in LemonSqueezy
3. Check worker logs: `wrangler tail`
4. Send test webhook from LemonSqueezy dashboard
5. Verify HTTPS (not HTTP)

---

## FAQ

### Q: Do I need the LemonSqueezy API key in my worker?

**A:** No! The `/licenses/validate` endpoint doesn't require authentication. This is by design - it only validates public license keys.

---

### Q: What if my Cloudflare Worker goes down?

**A:** Your extension can fall back to offline validation using checksum-based verification. Already implemented in `license.js`.

---

### Q: Can I change pricing after launch?

**A:** Yes! In LemonSqueezy, you can:
- Update product price anytime
- Create discount codes
- Run sales/promotions
- Existing customers keep their original price

---

### Q: How do I handle refunds?

**A:**
1. LemonSqueezy handles refund processing
2. You can issue refunds manually in dashboard
3. Recommend: 30-day money-back guarantee
4. Refunded licenses automatically become "inactive"

---

### Q: Should I use activation limits?

**A:**
- **3-5 devices:** Prevents abuse, allows legitimate use cases
- **Unlimited:** More customer-friendly, risk of sharing
- **Recommended:** 5 devices (covers most users, prevents mass sharing)

---

### Q: How do I migrate to a different domain later?

**A:**
1. Set up new domain in Cloudflare
2. Add new route to worker
3. Keep old domain active for 30 days
4. Update extension with new URL
5. Publish extension update
6. After 30 days, remove old domain

---

### Q: Can I use this with other payment processors?

**A:** Yes! The architecture works with:
- **Stripe:** Use Stripe Checkout + your own license generation
- **Gumroad:** Similar to LemonSqueezy but manual license management
- **Paddle:** Has license key API similar to LemonSqueezy

---

### Q: What happens if I hit Cloudflare's free tier limit?

**A:** Free tier: 100,000 requests/day

**Example:**
- 1,000 active users
- Each validates once per day = 1,000 requests/day
- **You'd need 100,000 active daily users to hit the limit!**

If you do hit it:
- Cloudflare Workers Paid: $5/month for 10 million requests
- Still cheaper than any VPS!

---

### Q: How do I add a team/family license?

**A:**

1. **Create new product in LemonSqueezy:**
   ```
   Name: Element Blur Premium - Family Pack (5 seats)
   Price: $39.99
   License Keys: Enable with activation limit of 5
   ```

2. **Same workflow applies!**

---

### Q: Can I add subscription pricing?

**A:** Yes!

1. **Change product type to "Subscription"**
2. **Set billing:** Monthly/Yearly
3. **Pricing:**
   ```
   Monthly: $2.99/month
   Yearly: $24.99/year (save 30%)
   ```
4. **Update validation logic** to check `expires_at`

---

### Q: How do I see who purchased?

**A:**
- **LemonSqueezy Dashboard** → **Orders**
- Shows: Name, email, date, amount, license key
- Export to CSV for analysis

---

### Q: Should I offer free trial?

**A:** Two approaches:

**Option 1: Freemium (Recommended for extensions)**
- Core features free
- Premium features paid
- Users try before buying

**Option 2: Time-limited trial**
- Create trial licenses in LemonSqueezy
- Set expiration: 7 or 14 days
- Require email to get trial license

---

## Cost Breakdown

### Monthly Costs (Starting)

| Service | Cost | Notes |
|---------|------|-------|
| **LemonSqueezy** | $0 | Only pay 5% when you sell |
| **Cloudflare Worker** | $0 | Free tier: 100k requests/day |
| **Domain (blurtkit.online)** | ~$10/year | One-time annual fee |
| **Resend (emails)** | $0 | Free: 3,000 emails/month |
| **Total monthly** | **~$0.83** | Just domain cost |

### Revenue Example

**Scenario:** 100 customers @ $14.99/each

```
Gross revenue: $1,499.00
LemonSqueezy fee (5%): -$74.95
Payment processing (~3%): -$44.97
───────────────────────────
Net profit: ~$1,379.08

Monthly costs: -$0.83
───────────────────────────
Actual profit: $1,378.25
```

**💰 92% profit margin!**

---

## Next Steps & Launch Strategy

### Week 1: Soft Launch
- ✅ Test with friends/beta users
- ✅ Collect feedback
- ✅ Fix any bugs
- ✅ Iterate on pricing if needed

### Week 2: Public Launch
- 🚀 Post on Product Hunt
- 📝 Write blog post about building it
- 🐦 Tweet about launch
- 📧 Email list (if you have one)
- 💬 Reddit (r/SideProject, r/webdev, r/chrome)

### Week 3-4: Content Marketing
- 🎥 Create demo video for YouTube
- 📝 Write tutorial: "How I built a Chrome extension"
- 🎨 Create memes/GIFs showing the extension
- 📊 Share metrics: "Launched X days ago, Y users, $Z revenue"

### Month 2+: Growth
- 🔍 SEO: Optimize Chrome Web Store listing
- 💰 Consider paid ads (Google Ads, Twitter Ads)
- 🤝 Partnerships with related tools
- ✨ Add requested features
- 📧 Build email list for announcements

---

## Conclusion

**🎉 Congratulations!** You now have a complete monetization system for your Chrome extension:

✅ Professional payment processing with LemonSqueezy
✅ Automated license key delivery
✅ Fast, free global API with Cloudflare Workers
✅ Custom domain for professional branding
✅ Webhook automation for emails and analytics
✅ Complete testing and error handling

**Your setup is better than 95% of indie dev products!**

### What You Built:

```
Customer Purchases → LemonSqueezy → License Key
                            ↓
                    Email Delivered
                            ↓
Customer Activates → api.blurtkit.online → Validated ✅
                            ↓
                  Premium Features Unlocked
```

### Total Setup Time: ~3 hours
### Monthly Cost: ~$1
### Scalability: 100,000+ customers
### Maintenance: ~1 hour/month

---

## Resources & Links

### Documentation:
- **LemonSqueezy Docs:** https://docs.lemonsqueezy.com
- **Cloudflare Workers:** https://developers.cloudflare.com/workers
- **Chrome Extension Docs:** https://developer.chrome.com/docs/extensions

### Tools:
- **Resend (emails):** https://resend.com
- **Plausible (analytics):** https://plausible.io
- **Product Hunt:** https://www.producthunt.com

### Communities:
- **Indie Hackers:** https://www.indiehackers.com
- **r/SideProject:** https://reddit.com/r/SideProject
- **Chrome Extension Discord:** https://discord.gg/chrome-extension-devs

---

## Support

**Questions? Issues?**

1. **Check this guide** - 90% of questions are answered here
2. **Check browser console** - F12 → Console tab for errors
3. **Check worker logs** - `wrangler tail`
4. **Check LemonSqueezy logs** - Dashboard → Settings → API

**Still stuck?**
- Open an issue on GitHub
- Email: support@blurtkit.online
- Check LemonSqueezy community forums

---

**Good luck with your launch! 🚀**

**Your first sale is just around the corner!**

---

*Last updated: 2025-11-18*
*Guide version: 2.0*
*Compatible with: LemonSqueezy API v1, Cloudflare Workers, Chrome Extensions Manifest V3*
