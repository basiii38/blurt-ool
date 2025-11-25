# Privacy Policy

**Last Updated:** November 15, 2025

## Introduction

This Privacy Policy explains how Element Blur ("we," "us," or "the Extension") collects, uses, stores, and protects your information when you use our Chrome browser extension.

**TL;DR:** We collect almost nothing. Your blur settings and browsing data stay on your device. We only process your license key (if you purchase premium) and optional email for license recovery.

## 1. Information We Collect

### 1.1 Information Stored Locally (On Your Device)

The following data is stored **only on your device** using Chrome's local storage:

**Extension Settings:**
- Blur intensity, radius, and style preferences
- Color picker selections
- Toolbar position and appearance settings
- Custom blur presets you create

**Premium/Trial Data:**
- License key (if activated)
- License activation status
- Email address (if provided during activation)
- Trial usage counter (number of trial uses remaining)
- License verification timestamp

**Important:** This data never leaves your device unless you explicitly choose to export presets or verify your license key.

### 1.2 Information We Receive

**License Verification (Optional):**
When you activate a premium license, we receive:
- Your license key
- Device/browser identifier (generated locally)
- Activation timestamp

**Payment Information:**
- Processed entirely by Paddle (our payment processor)
- We never receive or store credit card information
- We receive confirmation of purchase and license key generation from Paddle

**Email Address (Optional):**
- Only if you provide it during license activation
- Used solely for license recovery and critical updates
- Never used for marketing without explicit consent

### 1.3 Information We DO NOT Collect

We explicitly **DO NOT** collect:
- Browsing history
- Websites you visit
- Web pages you blur content on
- Screenshots or content you blur
- Personal identifiable information (beyond optional email)
- IP addresses (beyond temporary verification requests)
- Usage analytics or telemetry
- Cookies or tracking data
- Search queries
- Form data or passwords

## 2. How We Use Your Information

### 2.1 License Verification
- Verify your premium license is valid and not fraudulent
- Prevent license key sharing and abuse
- Enable/disable premium features based on license status

### 2.2 License Recovery
- Email you your license key if you lose it (if email provided)
- Notify you of critical security updates affecting your license
- Contact you about major version updates (rare)

### 2.3 Trial System
- Track your 20 free trial uses locally on your device
- Display remaining trial uses in the UI
- Determine when to show the premium upgrade modal

### 2.4 Product Improvement
- Anonymized, aggregated data may be used to improve the Extension
- Example: "X% of users activated premium within 30 days"
- Never tied to individual users or browsing behavior

## 3. Data Storage and Security

### 3.1 Local Storage
- All blur settings, presets, and configurations stored via Chrome's `chrome.storage.local` API
- Data encrypted by Chrome browser
- Data persists unless you uninstall the Extension or clear browser data
- Accessible only by the Extension (not other extensions or websites)

### 3.2 Server-Side Storage (Minimal)
We store only:
- License key → Activation status mapping
- License key → Email address (if provided)
- License key → Device identifier (for multi-device management)
- Purchase timestamps

**Security Measures:**
- Data encrypted in transit (HTTPS/TLS)
- Data encrypted at rest
- Regular security audits
- Access restricted to essential personnel only
- No third-party access except Paddle (payment processor)

### 3.3 Data Retention
- License data retained for the lifetime of your license
- Deactivated licenses retained for 90 days (for reactivation)
- Refunded licenses deleted within 30 days
- Email addresses deleted upon request

## 4. Third-Party Services

### 4.1 Paddle (Payment Processor)
**Purpose:** Process premium license purchases

**Data Shared:**
- Email address (required for purchase)
- Payment information (credit card, PayPal, etc.)
- Billing address

**Privacy Policy:** https://www.paddle.com/legal/privacy

**Note:** Paddle is our payment processor and Merchant of Record. We receive only:
- Confirmation of successful purchase
- License key generated for you
- Your email address (to send the license key)

### 4.2 Chrome Web Store
**Purpose:** Extension distribution and updates

**Data Shared:**
- Extension usage statistics (provided by Google)
- Crash reports (if Chrome's automatic crash reporting is enabled)

**Privacy Policy:** https://policies.google.com/privacy

### 4.3 No Other Third Parties
- We do not use analytics services (Google Analytics, Mixpanel, etc.)
- We do not use advertising networks
- We do not sell or share your data with anyone

## 5. Permissions Explained

The Extension requests the following Chrome permissions:

### 5.1 `storage`
**Why:** Store your blur settings, presets, license key, and trial counter locally
**Data Access:** Local storage only (your device)
**Privacy Impact:** Minimal - data never transmitted

### 5.2 `activeTab`
**Why:** Access the current tab to apply blur effects when you click the extension icon
**Data Access:** Only the current active tab, only when you activate the Extension
**Privacy Impact:** Minimal - we only modify the page visually based on your commands

### 5.3 `scripting`
**Why:** Inject content scripts to enable blur functionality on web pages
**Data Access:** Ability to read and modify page content
**Privacy Impact:** We only add blur effects; we don't read, collect, or transmit page content

**Important:** We can technically read page content due to content script permissions, but we **do not** collect, store, or transmit any website content, form data, or personal information from pages you visit.

## 6. Children's Privacy

Element Blur is not directed to children under 13 years of age. We do not knowingly collect personal information from children under 13.

If you believe a child under 13 has provided us with personal information, please contact us at support@your-domain.com and we will delete it immediately.

## 7. Your Privacy Rights

### 7.1 Access and Portability
- **View your data:** All local data visible in Extension settings
- **Export your data:** Export your blur presets at any time via Import/Export feature
- **Request server data:** Email us to receive all data we store about your license

### 7.2 Correction and Deletion
- **Update email:** Contact support to change your email address
- **Delete local data:** Uninstall the Extension or use Chrome's "Clear browsing data" feature
- **Delete server data:** Email us to delete your license information (license will be deactivated)

### 7.3 Opt-Out
- **Email communications:** Unsubscribe from any email we send (except transactional emails like license delivery)
- **License verification:** Use offline activation if you prefer not to verify online

### 7.4 Data Portability
- Export blur presets as JSON files
- Portable to other devices or for backup purposes

## 8. International Users

### 8.1 Data Transfers
- Data may be transferred to and stored on servers in the United States or other countries
- By using the Extension, you consent to such transfers
- We ensure adequate safeguards for international data transfers

### 8.2 EU/EEA Users (GDPR)
If you are in the European Union or European Economic Area:

**Legal Basis for Processing:**
- **Contract:** License activation necessary to provide premium service
- **Consent:** Optional email collection requires your consent
- **Legitimate Interest:** Security and fraud prevention

**Your GDPR Rights:**
- Right to access your personal data
- Right to rectification (correct inaccurate data)
- Right to erasure ("right to be forgotten")
- Right to restrict processing
- Right to data portability
- Right to object to processing
- Right to withdraw consent
- Right to lodge a complaint with your supervisory authority

**Contact our Data Protection Officer:** privacy@your-domain.com

### 8.3 California Users (CCPA)
If you are a California resident:

**Your CCPA Rights:**
- Right to know what personal information is collected
- Right to know if personal information is sold or disclosed (we don't sell data)
- Right to opt-out of sale (not applicable - we don't sell data)
- Right to deletion
- Right to non-discrimination for exercising your rights

**Do Not Sell My Personal Information:** We do not sell personal information.

## 9. Cookies and Tracking

**We do not use cookies or tracking technologies.**

- No cookies set by the Extension
- No browser fingerprinting
- No tracking pixels
- No session tracking
- No cross-site tracking

Websites you visit may use their own cookies, but those are not controlled by or related to Element Blur.

## 10. Data Breach Notification

In the unlikely event of a data breach involving your personal information:
- We will notify affected users within 72 hours
- Notification via email (if provided) or Extension update notice
- We will describe the breach, affected data, and steps we're taking
- We will report to relevant authorities as required by law

## 11. Changes to This Privacy Policy

- We may update this Privacy Policy from time to time
- Changes posted with updated "Last Updated" date
- Material changes will be communicated via Extension update notes
- Continued use after changes constitutes acceptance

**How to stay informed:**
- Check this policy periodically
- Review Extension update notes
- Subscribe to our email updates (optional)

## 12. Your Consent

By using Element Blur, you consent to this Privacy Policy.

**You can withdraw consent by:**
- Uninstalling the Extension
- Requesting deletion of your license data
- Deactivating your premium license

## 13. Contact Us

For privacy-related questions, concerns, or requests:

**Email:** privacy@your-domain.com
**Support:** support@your-domain.com
**Website:** https://your-domain.com

**Data Requests:**
To exercise your privacy rights, email privacy@your-domain.com with:
- Your license key (if applicable)
- Specific request (access, deletion, correction, etc.)
- Proof of identity (to prevent unauthorized access)

We will respond within 30 days of receiving a valid request.

## 14. Transparency Commitment

We are committed to transparency about our data practices:

**What we know about you:**
- Your license key (if premium)
- Your email address (if provided)
- Your trial usage count (stored locally)

**What we DON'T know:**
- Websites you visit
- Content you blur
- Your browsing habits
- Your personal information (beyond email)

## 15. Open Source Disclosure

[Optional - if you make it open source]
Element Blur's code is [open source / proprietary]. You can review our data handling practices directly in the source code at [GitHub URL].

---

## Summary

**Privacy-First Design:**
- Minimal data collection
- Local-first architecture
- No tracking or analytics
- No data selling
- Transparent practices

**We collect:** License key, optional email, trial counter
**We don't collect:** Browsing data, website content, personal info
**Your data stays:** On your device (except license verification)

Questions? Email privacy@your-domain.com

---

**Version:** 1.0
**Effective Date:** November 15, 2025
**Copyright © 2025 Element Blur. All rights reserved.**
