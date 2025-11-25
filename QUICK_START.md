# Quick Start: Deploy in 10 Minutes

This guide will get your Element Blur premium system live in **10 minutes**.

---

## Option A: Cloudflare Worker (FREE - Recommended)

### Step 1: Install Wrangler (1 min)

```bash
npm install -g wrangler
wrangler login
```

### Step 2: Deploy Worker (1 min)

```bash
cd /path/to/blurt-ool
wrangler deploy
```

You'll get a URL like:
```
https://element-blur-license-api.YOUR_SUBDOMAIN.workers.dev
```

### Step 3: Update Extension (1 min)

Edit `license.js` line 7:

```javascript
API_URL: 'https://element-blur-license-api.YOUR_SUBDOMAIN.workers.dev',
```

### Step 4: Create Paddle Product (3 min)

1. Go to https://paddle.com
2. Create account (see PADDLE_BEGINNER_GUIDE.md for detailed steps)
3. Create new product:
   - Name: "Blurt-ool Premium"
   - Price: $9.99/month (or one-time payment)
4. Copy product ID

### Step 5: Update Extension URLs (1 min)

Edit `premium-ui.js` to point to your website:

```javascript
href="https://blurtkit.online"
```

### Step 6: Test! (3 min)

1. Load extension in Chrome
2. Click star button
3. Make test purchase (Sandbox Mode in Paddle)
4. Use test card: `4242 4242 4242 4242`
5. Get license key from webhook (see PADDLE_SETUP.md)
6. Activate in extension

**Done! You're live! 🚀**

---

## Option B: Node.js Server (If you have a server)

### Step 1: Install Dependencies (1 min)

```bash
cd /path/to/blurt-ool
npm install
```

### Step 2: Configure Environment (1 min)

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and add your Paddle API key (see PADDLE_SETUP.md).

### Step 3: Start Server (1 min)

```bash
npm start
```

Server runs on `http://localhost:3000`

### Step 4: Deploy to Production

**Heroku:**
```bash
heroku create element-blur-api
heroku config:set PADDLE_API_KEY=your_key
heroku config:set PADDLE_WEBHOOK_SECRET=your_secret
git push heroku main
```

**Railway:**
1. Connect GitHub repo
2. Add environment variables
3. Deploy automatically

**Render:**
1. Connect GitHub repo
2. Add environment variables
3. Deploy

### Step 5: Update Extension

Edit `license.js` line 7:

```javascript
API_URL: 'https://your-api.herokuapp.com/api/validate-license',
```

---

## Testing Checklist

Before going live:

- [ ] Worker/server is deployed
- [ ] Extension updated with correct API URL
- [ ] Paddle product created (see PADDLE_SETUP.md)
- [ ] Test purchase works (Sandbox Mode)
- [ ] License activation works
- [ ] Premium features unlock
- [ ] Premium button shows green
- [ ] Trial system works

---

## Common Issues

### "API validation failed"

**Fix:**
```bash
# Check worker is deployed
wrangler deployments list

# Check worker logs
wrangler tail
```

### "CORS error"

**Fix:** Already handled in worker code. If you modified it, ensure CORS headers are set.

### "License shows invalid"

**Check:**
1. Sandbox Mode is ON in Paddle (for testing)
2. License key is copied correctly
3. Check Network tab for API response

---

## Production Checklist

Before launching:

- [ ] Turn OFF Sandbox Mode in Paddle
- [ ] Remove `generateLicenseKey()` from license.js (line 408)
- [ ] Update support email in premium-ui.js
- [ ] Set up webhook (optional but recommended)
- [ ] Configure domain (optional - requires Cloudflare paid plan)
- [ ] Add .env to .gitignore (already done)
- [ ] Test with real payment

---

## Launch Pricing

**Recommended strategy:**

1. **Early Bird** (first 100): $9.99
   - Create discount code in Paddle: `EARLYBIRD`
   - 33% off
   - Limit to 100 uses

2. **Regular price**: $14.99

3. **Announce:**
   - Product Hunt
   - Twitter/X
   - Reddit (r/SideProject, r/ChromeExtensions)
   - Your email list

---

## Support

**Email template for customers:**

```
Subject: Your Element Blur Premium License

Hi [Name],

Your license key: [LICENSE_KEY]

To activate:
1. Click extension icon
2. Click star button
3. Enter license key
4. Click "Activate"

Done! All premium features unlocked.

Questions? Reply to this email.
```

**Set up auto-reply:**
Use Paddle webhook to trigger email (see PADDLE_SETUP.md)

---

## Monitoring

**Check these regularly:**

1. **Paddle Dashboard:**
   - Sales
   - Refunds
   - Active subscriptions

2. **Cloudflare Dashboard:**
   - API requests
   - Errors
   - Response times

3. **Extension Analytics:**
   - Activations
   - Trial usage
   - Conversion rate

---

## Next Steps

1. ✅ Deploy API (Cloudflare or Node.js)
2. ✅ Create Paddle product
3. ✅ Update extension URLs
4. ✅ Test everything
5. ✅ Launch! 🚀

**Estimated time: 10 minutes**

---

## Questions?

- Paddle docs: https://developer.paddle.com
- Cloudflare Workers: https://developers.cloudflare.com/workers
- Extension setup: See `PADDLE_SETUP.md` and `PADDLE_BEGINNER_GUIDE.md`

**Good luck! 🎉**
