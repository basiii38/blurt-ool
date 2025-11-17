# 🍋 LemonSqueezy Setup for Complete Beginners

**A step-by-step guide to monetize your Element Blur extension**

⏱️ **Total Time**: 1-2 hours
💰 **Cost**: $0 to start (Cloudflare Worker is free!)
🎯 **Goal**: Accept payments and automatically deliver license keys

---

## 📋 Table of Contents

1. [What You'll Need](#what-youll-need)
2. [Understanding the Big Picture](#understanding-the-big-picture)
3. [Part 1: LemonSqueezy Setup](#part-1-lemonsqueezy-setup)
4. [Part 2: Backend Setup (Cloudflare Worker)](#part-2-backend-setup)
5. [Part 3: Update Extension Files](#part-3-update-extension-files)
6. [Part 4: Testing](#part-4-testing)
7. [Part 5: Going Live](#part-5-going-live)
8. [Troubleshooting for Beginners](#troubleshooting-for-beginners)
9. [Common Beginner Mistakes](#common-beginner-mistakes)
10. [Getting Help](#getting-help)

---

## What You'll Need

### Before You Start:

✅ **A LemonSqueezy Account** (free to create)
✅ **A Text Editor** (VS Code, Notepad++, or even Notepad)
✅ **Google Chrome Browser**
✅ **Basic Copy-Paste Skills** (that's it!)

### Optional but Helpful:
- ☁️ **Cloudflare Account** (free - for the backend)
- 📧 **Email Service** (like Resend.com - free tier available)

### What You DON'T Need:
❌ Advanced coding skills
❌ A server or hosting
❌ Credit card (until you're ready to go live)
❌ Previous e-commerce experience

---

## Understanding the Big Picture

### How It Works (Simple Explanation):

```
Customer → Buys License → LemonSqueezy → Creates License Key
                                ↓
                          Sends to Customer
                                ↓
Customer → Enters Key → Extension → Checks with Backend → ✅ Activated!
```

### The 4 Main Parts:

1. **LemonSqueezy** - Handles payments and generates license keys (Like Shopify for digital products)
2. **Cloudflare Worker** - A tiny server that validates license keys (Free and super fast!)
3. **Extension Files** - Your Chrome extension that customers use
4. **Customer Experience** - They buy, get a key, enter it, and unlock features

**Think of it like:**
- LemonSqueezy = Your cashier
- Cloudflare Worker = Your security guard checking tickets
- Extension = Your product that unlocks after verification

---

## Part 1: LemonSqueezy Setup

⏱️ **Time**: 30 minutes

### Step 1.1: Create Your LemonSqueezy Account

**What to do:**

1. Go to https://lemonsqueezy.com
2. Click the purple **"Get started free"** button (top right)
3. Enter your:
   - Email address
   - Password (make it strong!)
   - Name
4. Click **"Create account"**

**What you'll see:**
- A welcome screen asking about your business

**What to enter:**
- **Store name**: "Element Blur" (or your preferred name)
- **Store URL**: Choose a subdomain like `yourname.lemonsqueezy.com`
- **What will you sell**: Select "Software" or "Digital Products"

**⚠️ Common Mistake:** Don't use spaces in your store URL. Use hyphens instead: `your-name` not `your name`

**✅ Expected Result:** You should now see your LemonSqueezy dashboard with a sidebar on the left

---

### Step 1.2: Set Up Payment & Tax Details

**Why this matters:** LemonSqueezy needs to know where to send your money and how to handle taxes.

**What to do:**

1. Click **"Settings"** in the left sidebar
2. Click **"Payouts"**
3. Enter your:
   - Bank account details OR
   - PayPal email
4. Click **"Save"**

**For taxes:**
1. Go to **Settings** → **Tax & Billing**
2. Enter your:
   - Country
   - VAT ID (if applicable - skip if you don't have one)
3. Click **"Save"**

**💡 Beginner Tip:** If you're in the US and making less than $600/year, you might not need a business license. If unsure, consult a local accountant (but you can set this up now and worry about taxes when you start making money).

**✅ Expected Result:** Green checkmarks next to "Payouts" and "Tax" settings

---

### Step 1.3: Create Your Product

**What to do:**

1. Click **"Products"** in the left sidebar
2. Click the big **"+"** button (or "New Product")
3. Fill in the form:

**Product Details:**

| Field | What to Enter | Example |
|-------|---------------|---------|
| **Name** | Your product name | "Element Blur Premium - Lifetime License" |
| **Description** | What they get | See template below ⬇️ |
| **Price** | How much to charge | $14.99 USD |
| **Type** | Payment type | Single payment (one-time) |

**Description Template (Copy & Paste):**
```
Unlock all premium features of Element Blur Chrome Extension:

✅ Unlimited Undo/Redo History
✅ Quick Select Similar Elements
✅ Unlimited Custom Presets
✅ Import/Export Presets
✅ All Future Updates

🎁 ONE-TIME PAYMENT. NO SUBSCRIPTIONS. LIFETIME ACCESS.

💰 30-day money-back guarantee
📧 Email support included
⚡ Instant delivery
```

4. Click **"Create Product"**

**⚠️ Common Mistake:** Don't make it a subscription unless you want monthly billing. Choose "Single payment" for a lifetime license.

**✅ Expected Result:** You should see your new product in the Products list

---

### Step 1.4: Enable License Keys (IMPORTANT!)

**Why this matters:** This is what makes your product work! Without license keys, customers can't activate the extension.

**What to do:**

1. Click on your product (the one you just created)
2. Scroll down until you see a section called **"License Keys"**
3. Toggle the switch **ON** (it should turn purple/blue)
4. Configure these settings:

| Setting | What to Choose | Why |
|---------|---------------|-----|
| **Enable license keys** | ON ✅ | Generates keys for customers |
| **Activation limit** | Unlimited (or 3-5) | How many devices can use one key |
| **Expires** | Never | Keys never expire |

**💡 Beginner Tip:**
- Choose "Unlimited" if you trust customers won't share keys
- Choose "3-5" if you want to prevent one key being used by 100 people
- Most indie developers choose 3-5 activations

5. Scroll up and click **"Save Product"** (top right)

**✅ Expected Result:** When you refresh the product page, you should still see "License Keys: Enabled"

---

### Step 1.5: Get Your API Key (Very Important!)

**What is an API Key?** Think of it like a password that lets your extension talk to LemonSqueezy.

**What to do:**

1. Click **"Settings"** in the left sidebar
2. Click **"API"**
3. Click **"Create API key"** button
4. Fill in:
   - **Name**: "Element Blur Extension"
   - **Permissions**: Leave default (Read + Write)
5. Click **"Create"**

**🔴 SUPER IMPORTANT:**
- Copy the API key that appears
- **Save it somewhere safe** (Notepad, password manager)
- **You can only see it ONCE**
- It looks like: `eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...` (very long)

**⚠️ Common Mistake:** Forgetting to save the API key. If you lose it, you'll need to create a new one.

**✅ Expected Result:** You have a long string of text saved somewhere safe

---

### Step 1.6: Find Your Store ID and Product ID

**Why you need these:** Your extension needs these numbers to know which product to check.

**Finding your Store ID:**

1. Go to **Settings** → **Stores**
2. Look at the URL in your browser:
   ```
   https://app.lemonsqueezy.com/settings/stores/12345
                                                  ^^^^^
                                            This is your Store ID!
   ```
3. Write down this number

**Finding your Product ID:**

1. Go to **Products**
2. Click on your product
3. Look at the URL:
   ```
   https://app.lemonsqueezy.com/products/67890
                                         ^^^^^
                                   This is your Product ID!
   ```
4. Write down this number

**💡 Beginner Tip:** Take a screenshot of both URLs so you have them saved!

**✅ Expected Result:** You should have 2 numbers written down:
- Store ID: `12345` (example)
- Product ID: `67890` (example)

---

## Part 2: Backend Setup (Cloudflare Worker)

⏱️ **Time**: 20-30 minutes

**What's a Cloudflare Worker?** Think of it as a tiny, free server that runs your code. It's perfect for beginners because:
- ✅ Free (100,000 requests per day!)
- ✅ No server management
- ✅ Super fast (runs on Cloudflare's global network)
- ✅ HTTPS by default (secure)

### Step 2.1: Install Node.js (If You Don't Have It)

**What is Node.js?** It's software that lets you run JavaScript on your computer (needed for the next steps).

**Check if you have it:**

1. Open Terminal (Mac) or Command Prompt (Windows):
   - **Windows**: Press `Win + R`, type `cmd`, press Enter
   - **Mac**: Press `Cmd + Space`, type `terminal`, press Enter

2. Type this and press Enter:
   ```bash
   node --version
   ```

**If you see a version number (like `v18.0.0`):** ✅ You're good! Skip to Step 2.2

**If you see an error:** You need to install Node.js:

1. Go to https://nodejs.org
2. Download the **LTS version** (the green one)
3. Run the installer
4. Click "Next" through all the prompts
5. Restart your terminal and try `node --version` again

**✅ Expected Result:** Terminal shows `v18.0.0` or similar

---

### Step 2.2: Install Wrangler (Cloudflare's Tool)

**What is Wrangler?** It's a tool that helps you deploy code to Cloudflare.

**What to do:**

1. In your terminal, type this and press Enter:
   ```bash
   npm install -g wrangler
   ```

2. Wait for it to install (might take 1-2 minutes)

3. Test that it worked:
   ```bash
   wrangler --version
   ```

**⚠️ Common Mistakes:**
- **"npm not found"**: You need to install Node.js first (see Step 2.1)
- **Permission error on Mac**: Try `sudo npm install -g wrangler` (it will ask for your password)

**✅ Expected Result:** You see a version number like `3.0.0`

---

### Step 2.3: Login to Cloudflare

**What to do:**

1. In terminal, type:
   ```bash
   wrangler login
   ```

2. Your browser will open automatically

3. If you don't have a Cloudflare account:
   - Click **"Sign Up"**
   - Enter email and password
   - Verify your email

4. Click **"Allow"** to let Wrangler access your account

**✅ Expected Result:** Terminal shows "Successfully logged in!"

---

### Step 2.4: Create Your Worker

**What to do:**

1. Create a new folder for your worker:
   ```bash
   mkdir element-blur-api
   cd element-blur-api
   ```

2. Initialize the worker:
   ```bash
   wrangler init
   ```

3. Answer the questions:
   - **Name**: `element-blur-api` (press Enter)
   - **TypeScript or JavaScript**: Choose "JavaScript" (press Enter)
   - **Git repository**: Yes (press Enter)

**💡 Beginner Tip:** If you make a mistake, just delete the folder and start over!

**✅ Expected Result:** You should see a new folder with these files:
```
element-blur-api/
├── src/
│   └── index.js
├── wrangler.toml
└── package.json
```

---

### Step 2.5: Add the License Validation Code

**What to do:**

1. Open the `src/index.js` file in your text editor

2. **Delete everything** in the file

3. Copy and paste this code:

```javascript
// This code validates license keys with LemonSqueezy
export default {
  async fetch(request, env) {
    // Allow requests from any website (CORS)
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      // Get the license key from the request
      const { license_key, email } = await request.json();

      // Ask LemonSqueezy if the key is valid
      const response = await fetch(
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

      const data = await response.json();

      // Check if the license is valid and active
      const isValid = data.valid === true && data.license_key?.status === 'active';

      // Send response back to the extension
      return new Response(
        JSON.stringify({
          valid: isValid,
          message: isValid
            ? 'License activated successfully!'
            : 'Invalid or inactive license key',
          data: isValid ? {
            email: data.meta?.customer_email,
            activated_at: new Date().toISOString(),
            product: data.meta?.product_name,
            customer_name: data.meta?.customer_name,
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
      // If something goes wrong, send an error
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

4. Save the file

**💡 What this code does:**
- Takes a license key from your extension
- Asks LemonSqueezy "Is this key valid?"
- Sends back "Yes" or "No" to your extension

**⚠️ Common Mistake:** Make sure you **delete the old code** before pasting. The file should ONLY contain the code above.

**✅ Expected Result:** Your `src/index.js` file has exactly the code above and nothing else

---

### Step 2.6: Deploy Your Worker

**What to do:**

1. In terminal (make sure you're in the `element-blur-api` folder), type:
   ```bash
   wrangler deploy
   ```

2. Wait for it to deploy (10-30 seconds)

3. **Save the URL** it shows you! It looks like:
   ```
   https://element-blur-api.YOUR-USERNAME.workers.dev
   ```

**💡 Beginner Tip:** Copy this URL and save it in Notepad. You'll need it soon!

**✅ Expected Result:** Terminal shows "Deployed successfully" and gives you a URL

---

### Step 2.7: Test Your Worker

**Let's make sure it works!**

**What to do:**

1. Open a new tab in Chrome
2. Press `F12` to open Developer Tools
3. Click the **"Console"** tab
4. Paste this code (replace `YOUR-WORKER-URL` with your actual URL):

```javascript
fetch('https://YOUR-WORKER-URL.workers.dev', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    license_key: 'test-key-12345',
    email: 'test@example.com'
  })
})
.then(r => r.json())
.then(d => console.log('Response:', d))
```

5. Press Enter

**What you should see:**
```javascript
Response: { valid: false, message: "Invalid or inactive license key" }
```

**This is GOOD!** It means your worker is running. It says "invalid" because we used a fake license key.

**⚠️ If you see an error:** Check the [Troubleshooting](#troubleshooting-for-beginners) section below

**✅ Expected Result:** Console shows a response object with `valid: false`

---

## Part 3: Update Extension Files

⏱️ **Time**: 10 minutes

Now let's connect your extension to LemonSqueezy!

### Step 3.1: Update the Backend URL

**What to do:**

1. Open `license.js` in your extension folder
2. Find line 7 (should look like this):
   ```javascript
   API_URL: 'https://your-domain.com/api/validate-license',
   ```

3. Replace it with your Cloudflare Worker URL:
   ```javascript
   API_URL: 'https://element-blur-api.YOUR-USERNAME.workers.dev',
   ```

4. Save the file

**⚠️ Common Mistake:** Don't forget the `https://` at the beginning!

**✅ Expected Result:** Your extension will now check licenses with your worker

---

### Step 3.2: Update the Checkout URL

**What to do:**

1. Go back to LemonSqueezy
2. Click **Products** → Click your product
3. Look for the **"Checkout URL"** button (top right, purple button)
4. Click it and **copy the URL** (looks like `https://yourstore.lemonsqueezy.com/checkout/buy/abc123`)

5. Open `premium-ui.js` in your extension folder
6. Find the checkout link (around line 83-85):
   ```javascript
   <a href="https://yourstore.lemonsqueezy.com/checkout/buy/PRODUCT_ID"
   ```

7. Replace `PRODUCT_ID` with the URL you copied
8. Save the file

**✅ Expected Result:** When users click "Buy Premium", they'll go to your LemonSqueezy checkout page

---

### Step 3.3: Update Your Support Email

**What to do:**

1. In `premium-ui.js`, find the support email (around line 610):
   ```javascript
   window.open('mailto:your-email@domain.com?subject=Element Blur Support', '_blank');
   ```

2. Replace `your-email@domain.com` with your real email
3. Save the file

**✅ Expected Result:** Customer support emails will come to you

---

## Part 4: Testing

⏱️ **Time**: 15 minutes

Let's test everything before going live!

### Step 4.1: Enable Test Mode in LemonSqueezy

**What to do:**

1. Go to your LemonSqueezy dashboard
2. Look for the **"Test Mode"** toggle (top right corner)
3. Turn it **ON** (should turn purple/blue)

**💡 What this does:** Lets you test payments without real money!

**✅ Expected Result:** You should see a yellow banner saying "Test Mode Active"

---

### Step 4.2: Make a Test Purchase

**What to do:**

1. Open your LemonSqueezy product page
2. Click **"Preview"** or get the checkout URL
3. Click **"Buy Now"**
4. Use this test card:
   - **Card Number**: `4242 4242 4242 4242`
   - **Expiry**: Any future date (like `12/25`)
   - **CVC**: Any 3 digits (like `123`)
   - **Email**: Your real email (so you get the test license)

5. Complete the checkout
6. Check your email for the license key

**⚠️ Common Mistake:** Don't use a real card in test mode! Use the test card above.

**✅ Expected Result:** You receive an email with a test license key

---

### Step 4.3: Test License Activation

**What to do:**

1. Load your extension in Chrome:
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select your extension folder

2. Click the extension icon
3. Click the **⭐ Star** button (Premium)
4. Enter the test license key from your email
5. Click **"Activate License"**

**What should happen:**
- ✅ Message: "License activated successfully!"
- ✅ Star button turns gold/highlighted
- ✅ Premium features unlock

**⚠️ If it doesn't work:** Check [Troubleshooting](#troubleshooting-for-beginners) below

**✅ Expected Result:** Extension shows "Premium Active"

---

## Part 5: Going Live

⏱️ **Time**: 10 minutes

### Step 5.1: Final Checks

**Before you launch, verify:**

- [x] LemonSqueezy product is created
- [x] License keys are enabled
- [x] Pricing is set ($14.99 or your choice)
- [x] Checkout URL is correct in extension
- [x] Cloudflare Worker is deployed
- [x] API URL is correct in license.js
- [x] Test purchase worked
- [x] Test activation worked
- [x] Support email is correct

### Step 5.2: Turn Off Test Mode

**What to do:**

1. Go to LemonSqueezy dashboard
2. Toggle **"Test Mode"** OFF
3. You'll see a popup: "Are you sure?" → Click **"Yes"**

**✅ Expected Result:** Yellow "Test Mode" banner disappears

---

### Step 5.3: Publish Your Extension

**What to do:**

1. Create a `.zip` file of your extension folder
2. Go to https://chrome.google.com/webstore/devconsole
3. Click **"New Item"**
4. Upload your `.zip` file
5. Fill in all the details (screenshots, description, etc.)
6. Click **"Publish"**

**⏱️ Note:** Chrome review can take 1-7 days

**✅ Expected Result:** Extension is submitted for review

---

## Troubleshooting for Beginners

### Problem: "Worker URL returns 404"

**Solution:**
1. Make sure you deployed: `wrangler deploy`
2. Check the URL is correct (copy from terminal output)
3. Wait 1-2 minutes after deployment

---

### Problem: "License validation failed"

**Possible causes:**

1. **Wrong API URL in license.js**
   - Double-check the URL matches your worker URL exactly
   - Make sure it has `https://`

2. **CORS error**
   - Check browser console (F12)
   - Make sure corsHeaders is in the worker code

3. **Worker not deployed**
   - Run `wrangler deploy` again
   - Check for deployment errors

---

### Problem: "Can't find Product ID or Store ID"

**Solution:**
- Store ID: Go to Settings → Stores, look at URL
- Product ID: Go to Products, click product, look at URL
- The ID is always the NUMBER at the end of the URL

---

### Problem: "npm: command not found"

**Solution:**
- You need to install Node.js first
- Go to https://nodejs.org
- Download and install the LTS version
- Restart your terminal

---

### Problem: "License key not sent after purchase"

**Check:**
1. License keys are enabled in product settings
2. Product type is "Single payment" (not subscription)
3. Check spam folder for email
4. Check LemonSqueezy dashboard → Orders → View the order

---

## Common Beginner Mistakes

### ❌ Mistake 1: Using Test License in Production
**Problem:** Trying to use test mode license keys after turning off test mode
**Solution:** Make a new purchase in production mode to get a real license

### ❌ Mistake 2: Forgetting to Save API Key
**Problem:** Closing the API key window without saving it
**Solution:** Create a new API key and save it this time

### ❌ Mistake 3: Wrong Worker URL
**Problem:** Copying the URL incorrectly (missing https:// or adding extra characters)
**Solution:** Copy directly from terminal output after `wrangler deploy`

### ❌ Mistake 4: Not Deploying After Code Changes
**Problem:** Editing worker code but forgetting to redeploy
**Solution:** Always run `wrangler deploy` after changing `src/index.js`

### ❌ Mistake 5: Using Real Credit Card in Test Mode
**Problem:** Charges won't work anyway, and it's confusing
**Solution:** Always use test card `4242 4242 4242 4242` in test mode

---

## Getting Help

### Quick Help Resources:

1. **LemonSqueezy Docs**: https://docs.lemonsqueezy.com
2. **Cloudflare Workers Docs**: https://developers.cloudflare.com/workers
3. **Extension Issues**: Check `chrome://extensions/` → Click "Errors"

### If You're Still Stuck:

1. **Check browser console** (F12 → Console tab)
2. **Check worker logs**: Run `wrangler tail` in terminal
3. **Check LemonSqueezy logs**: Dashboard → Settings → API
4. **Post in Discord/Forum**: Include error messages and what you tried

---

## Next Steps After Setup

### Week 1: Soft Launch
- Share with friends/beta testers
- Get feedback
- Fix any issues

### Week 2-4: Marketing
- Post on Product Hunt
- Share on Reddit (r/SideProject, r/webdev)
- Tweet about it
- Make tutorial videos

### Month 2+: Improve
- Add requested features
- Improve documentation
- Build email list
- Consider paid ads

---

## 🎉 Congratulations!

You've set up a complete payment system for your extension!

**What you achieved:**
- ✅ Created a LemonSqueezy store
- ✅ Set up automatic license key delivery
- ✅ Deployed a FREE backend server
- ✅ Connected everything together
- ✅ Tested the entire flow
- ✅ Ready to make money!

**Your first sale is just around the corner! 🚀**

---

## Appendix: Video Tutorial Suggestions

If you want to create a video tutorial for this, here's a suggested structure:

1. **Part 1: LemonSqueezy Setup** (10 min)
   - Account creation
   - Product setup
   - License key configuration

2. **Part 2: Cloudflare Worker** (15 min)
   - Install Node.js and Wrangler
   - Create and deploy worker
   - Test the API

3. **Part 3: Integration** (10 min)
   - Update extension files
   - Test purchase flow
   - Go live

**Total video time: ~35 minutes**

---

**Questions? Something unclear? Please open an issue on GitHub and I'll help! 🙌**
