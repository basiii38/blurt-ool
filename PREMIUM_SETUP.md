# Premium License System Setup Guide

## Overview

Element Blur now includes a complete **lifetime license system** with:
- ✅ License key generation and validation
- ✅ Online + offline activation support
- ✅ 20 free trial uses for testing
- ✅ Beautiful premium unlock UI
- ✅ LemonSqueezy integration ready
- ✅ Secure local storage
- ✅ Auto-revalidation every 30 days

---

## Quick Start

### 1. Test the System Locally

The extension is ready to use with trial mode:

1. **Load the extension** in Chrome (Developer mode)
2. **Click the star button** (⭐) in the toolbar
3. **Try premium features:**
   - Quick Select (20 free trial uses)
   - Future: Import/Export, Unlimited Undo, etc.

### 2. Generate Test License Keys

For testing, use the built-in key generator:

```javascript
// Open browser console on any page with the extension active
window.LicenseManager.generateLicenseKey()
// Returns: "BLUR-ABC1-DEF2-GHI3-JKL4"
```

Use this key to test activation without a backend!

---

## Production Setup (2 Options)

### Option 1: LemonSqueezy (Recommended)

**Why LemonSqueezy?**
- ✅ Built-in license key management
- ✅ Automatic key generation
- ✅ Lower fees (5% + payment processing)
- ✅ Professional API
- ✅ Webhook support
- ✅ Better for scaling

**Setup Steps:**

1. **Create LemonSqueezy account**: https://lemonsqueezy.com

2. **Create Product:**
   - Product name: "Element Blur Premium"
   - Price: $14.99
   - Enable "License Keys"

3. **API Integration:**
   - Get API key from Settings → API
   - LemonSqueezy handles key generation
   - Deploy validation API (see `LEMON_SQUEEZY_SETUP.md`)

4. **Webhook Setup:**
   - Webhook URL: Your backend endpoint
   - Event: `order_created`
   - Validates purchases automatically

5. **Update Extension:**
   - Replace checkout link in `premium-ui.js`:
     ```javascript
     // Line 107
     <a href="https://yourstore.lemonsqueezy.com/checkout/buy/PRODUCT_ID" target="_blank"...>
     ```
   - Update API endpoint in `license.js`:
     ```javascript
     // Line 7
     API_URL: 'https://your-api.workers.dev'
     ```

**See `LEMON_SQUEEZY_SETUP.md` for complete guide with Cloudflare Worker deployment.**

---

### Option 2: Custom Backend (Full Control)

**For maximum control and no fees:**

#### Backend Requirements:

1. **API Endpoint**: `POST /api/validate-license`
2. **Database**: Store license keys
3. **Key Generation**: Server-side
4. **Validation Logic**: Check key validity

#### Example Backend (Node.js/Express):

```javascript
// license-backend.js
const express = require('express');
const app = express();

// Simple in-memory storage (use database in production)
const licenses = new Set();

// Generate license key (same algorithm as extension)
function generateLicenseKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const randomString = (length) => {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const calculateChecksum = (data) => {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data.charCodeAt(i) * (i + 1);
    }
    return sum.toString(36).toUpperCase().padStart(4, '0').slice(-4);
  };

  const s1 = randomString(4);
  const s2 = randomString(4);
  const s3 = randomString(4);
  const checksum = calculateChecksum(s1 + s2 + s3);

  return `BLUR-${s1}-${s2}-${s3}-${checksum}`;
}

// Validate license
app.post('/api/validate-license', express.json(), (req, res) => {
  const { license_key, email, product, version } = req.body;

  // Check if license exists in database
  const isValid = licenses.has(license_key);

  res.json({
    valid: isValid,
    message: isValid ? 'License activated successfully!' : 'Invalid license key',
    data: isValid ? {
      email,
      activated_at: new Date().toISOString(),
      product,
      version
    } : null
  });
});

// Create license (called when payment received)
app.post('/api/create-license', express.json(), (req, res) => {
  const { email } = req.body;
  const key = generateLicenseKey();

  licenses.add(key);

  // Send email to customer with key
  // sendEmail(email, key); // Implement with SendGrid, etc.

  res.json({ license_key: key });
});

app.listen(3000);
```

#### Update Extension:

```javascript
// In license.js, line 7:
API_URL: 'https://your-domain.com/api/validate-license'
```

---

## Configuration

### Update Extension Files:

1. **premium-ui.js** (line 107):
   ```javascript
   // Replace with your LemonSqueezy checkout URL
   <a href="https://yourstore.lemonsqueezy.com/checkout/buy/PRODUCT_ID" target="_blank"
   ```

2. **premium-ui.js** (line 610):
   ```javascript
   // Replace with your support email
   window.open('mailto:support@your-domain.com?subject=Element Blur Support'
   ```

3. **license.js** (line 7):
   ```javascript
   // Replace with your API endpoint
   API_URL: 'https://your-domain.com/api/validate-license'
   ```

4. **Remove test function** (license.js, line 408):
   ```javascript
   // DELETE this line in production:
   generateLicenseKey // Remove this in production
   ```

---

## Premium Features

### Currently Gated (Share 20 Free Trial Uses):

All these features share the **same pool of 20 free trial uses**:

- ✅ **Select Element** - Click and select elements to blur
- ✅ **Draw Region** - Draw custom regions to blur
- ✅ **Select Text** - Select and blur text content
- ✅ **Quick Select** - Select all similar elements (images, videos, ads, sidebars)
- ✅ **Undo/Redo** - Unlimited undo and redo history
- ✅ **Presets Manager** - Save and manage blur presets
- ✅ **Import/Export** - Import and export your blur configurations

Each use of **any** premium feature consumes 1 trial use from the shared pool.

### Implementation Pattern:

All gated features use this pattern:

```javascript
// Example: Select Element button
selectBtn.addEventListener('click', async () => {
  // Check premium access (with trial support)
  const access = await window.LicenseManager.canUsePremiumFeature(true);

  if (!access.allowed) {
    window.PremiumUI.showPremiumModal();
    return;
  }

  // Show trial reminder if using trial
  if (access.reason === 'trial') {
    showToast(`Trial: ${access.remainingUses} uses remaining`, 'info');
  }

  // Execute feature code here
  isSelecting = true;
  updateBlurStyle();
});
```

**Future Features to Gate:**
- Cloud sync (future feature)
- Batch operations (future feature)
- Advanced blur effects (future feature)

---

## Trial System

### How it Works:

1. Users get **20 free trial uses** of premium features
2. Trial counter stored in `chrome.storage.local`
3. Each premium feature use decrements counter
4. Toast notification shows remaining uses
5. When exhausted, shows upgrade modal

### Trial Flow:

**Example: User tries any premium tool**

```
User clicks premium tool (Select Element, Draw Region, Select Text, Quick Select, Undo, Redo, or Presets)
  ↓
Check: isPremium()?
  ↓ No
Check: trial uses left?
  ↓ Yes (e.g., 15 left)
Allow feature + show toast: "Trial: 15 uses remaining"
  ↓
Decrement shared counter to 14
  ↓
User clicks ANY premium tool again
  ↓
Shows: "Trial: 14 uses remaining"
  ↓
...continues until 0...
  ↓ 0 uses left
Show premium modal: "Trial expired - Upgrade now"
```

**Important:** All 7 premium tools (Select Element, Draw Region, Select Text, Quick Select, Undo, Redo, Presets/Import/Export) share the **same 20-use counter**. Using Select Element 5 times + Quick Select 10 times + Export 3 times = 18 uses consumed, leaving 2 trial uses remaining.

---

## Testing

### Test Checklist:

- [ ] Trial system (20 uses countdown across all tools)
- [ ] Select Element tool gated properly
- [ ] Draw Region tool gated properly
- [ ] Select Text tool gated properly
- [ ] Quick Select tool gated properly
- [ ] Undo button gated properly
- [ ] Redo button gated properly
- [ ] Presets manager gated properly
- [ ] License key validation (format check)
- [ ] Offline activation (no internet)
- [ ] Premium modal opens
- [ ] License activation works
- [ ] Premium button shows green when active
- [ ] Toast notifications show remaining uses
- [ ] License deactivation works
- [ ] Premium status persists after reload

### Generate Test Keys:

```javascript
// In browser console:
const testKey = window.LicenseManager.generateLicenseKey();
console.log('Test Key:', testKey);
// Use this key to activate premium
```

---

## Pricing Recommendations

### Suggested Tiers:

**Launch Pricing:**
- Early Bird: **$9.99** (first 100 buyers)
- Regular: **$14.99** (recommended)
- Professional: **$19.99** (for agencies)

**Why $14.99?**
- Sweet spot for productivity tools
- Not too cheap (implies low value)
- Not too expensive (high conversion)
- Comparable to successful Chrome extensions

---

## Email Templates

### Purchase Confirmation Email:

```
Subject: Your Element Blur Premium License Key 🎉

Hi there!

Thank you for purchasing Element Blur Premium! Here's your lifetime license key:

━━━━━━━━━━━━━━━━━━━━━━━
LICENSE KEY: BLUR-XXXX-XXXX-XXXX-XXXX
━━━━━━━━━━━━━━━━━━━━━━━

HOW TO ACTIVATE:

1. Click the Extension icon in Chrome
2. Click the ⭐ Star button in the toolbar
3. Enter your license key above
4. Click "Activate License"

That's it! All premium features are now unlocked forever.

PREMIUM FEATURES:
✓ Unlimited Undo/Redo
✓ Quick Select Similar Elements
✓ Unlimited Custom Presets
✓ Import/Export Presets
✓ All Future Updates

Need help? Reply to this email!

Best regards,
[Your Name]

P.S. Save this email - you'll need the license key if you reinstall the extension or use it on another computer.
```

---

## Troubleshooting

### Common Issues:

**1. "Invalid license key format"**
- Key must be: `BLUR-XXXX-XXXX-XXXX-XXXX`
- All uppercase letters and numbers
- Exactly 4 characters per segment

**2. "API validation failed"**
- Check API_URL in license.js
- Verify backend is running
- Check CORS headers
- Extension falls back to offline validation

**3. "Trial expired" but should have premium**
- Check activation worked: Click star button
- Should show "Premium Active" banner
- Check browser console for errors

**4. Premium button not pulsing**
- Clear browser cache
- Reload extension
- Check CSS loaded properly

---

## Security Notes

### Best Practices:

✅ **DO:**
- Validate licenses server-side
- Use HTTPS for API calls
- Store activation status in chrome.storage.local
- Implement rate limiting on API
- Log activation attempts

❌ **DON'T:**
- Store license keys in plain text on server
- Allow unlimited validation attempts
- Hardcode API keys in extension
- Trust client-side validation alone

### License Key Security:

The extension uses:
- Checksum validation (offline)
- Server validation (online)
- 30-day revalidation
- Secure local storage

Not foolproof, but **good enough** for a Chrome extension. Perfect security isn't possible in client-side code.

---

## Next Steps

1. **Set up LemonSqueezy:**
   - Follow `LEMON_SQUEEZY_SETUP.md` guide
   - Deploy Cloudflare Worker (FREE)
   - Configure product with license keys
   - Custom backend only if you have specific needs

2. **Update Extension:**
   - Replace purchase URL
   - Set API endpoint
   - Update support email

3. **Test Everything:**
   - Generate test keys
   - Try full purchase flow
   - Test trial system
   - Verify premium unlocks

4. **Launch:**
   - Publish to Chrome Web Store
   - Announce on social media
   - Offer early bird pricing
   - Collect testimonials

---

## Support

### Resources:

- **LemonSqueezy Docs**: https://docs.lemonsqueezy.com
- **LemonSqueezy Setup Guide**: See `LEMON_SQUEEZY_SETUP.md` in this repository
- **Cloudflare Workers**: https://developers.cloudflare.com/workers/
- **Chrome Extension Payments**: https://developer.chrome.com/docs/webstore/payments/

### Questions?

For implementation help:
- Check browser console for errors
- Review commit: `ab86e38` for full code
- Test with `window.LicenseManager.generateLicenseKey()`

---

## Revenue Projections

**Conservative Estimates:**

| Users | Conversion | Revenue/Month |
|-------|-----------|---------------|
| 1,000 | 1% | $150 |
| 5,000 | 2% | $1,500 |
| 10,000 | 3% | $4,500 |
| 50,000 | 2% | $15,000 |

**Assumptions:**
- $14.99 price point
- 1-3% free-to-paid conversion (typical for Chrome extensions)
- One-time payment (no recurring revenue)

**Growth Strategies:**
- Chrome Web Store SEO
- Product Hunt launch
- Reddit communities (webdev, productivity)
- YouTube tutorials
- Affiliate program (give 30% commission)

---

## License

This premium system is part of Element Blur.

**Good luck with your launch! 🚀**
