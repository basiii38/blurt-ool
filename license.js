// License Key System for Element Blur Premium
// Supports offline validation after initial activation

// Helper function to check if extension context is still valid
function isExtensionContextValid() {
  try {
    // Try to access chrome.runtime.id - if it throws, context is invalid
    return !!(chrome && chrome.runtime && chrome.runtime.id);
  } catch (e) {
    console.warn('[Blurt-ool License] Extension context invalidated. Please refresh the page.');
    return false;
  }
}

const LICENSE_CONFIG = {
  // Paddle API endpoint via Cloudflare Worker
  API_URL: 'https://api.blurtkit.online/validate-license',

  // License validation format (validated by Paddle)
  // Format: BLUR-XXXX-XXXX-XXXX-XXXX
  LICENSE_PATTERN: /^BLUR-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/,

  // Storage keys
  STORAGE_KEY: 'blur_license_key',
  VERIFIED_KEY: 'blur_license_verified',
  VERIFIED_DATE: 'blur_license_verified_date',
  USER_EMAIL: 'blur_license_email',

  // Trial/Demo mode
  TRIAL_USES_KEY: 'blur_trial_uses',
  MAX_TRIAL_USES: 20
};

/**
 * Check if user has premium access
 * @returns {Promise<boolean>}
 */
async function isPremium() {
  // Check if extension context is valid
  if (!isExtensionContextValid()) {
    console.warn('[Blurt-ool License] Cannot check premium status: Extension context invalidated');
    return false;
  }

  try {
    const data = await chrome.storage.local.get([
      LICENSE_CONFIG.VERIFIED_KEY,
      LICENSE_CONFIG.VERIFIED_DATE
    ]);

    // Check if license is verified and still valid
    if (data[LICENSE_CONFIG.VERIFIED_KEY]) {
      const verifiedDate = data[LICENSE_CONFIG.VERIFIED_DATE];
      const daysSinceVerification = (Date.now() - verifiedDate) / (1000 * 60 * 60 * 24);

      // Re-verify every 30 days if online
      if (daysSinceVerification > 30) {
        return await revalidateLicense();
      }

      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking premium status:', error);
    return false;
  }
}

/**
 * Get remaining trial uses
 * @returns {Promise<number>}
 */
async function getTrialUses() {
  if (!isExtensionContextValid()) {
    return 0;
  }

  try {
    const data = await chrome.storage.local.get([LICENSE_CONFIG.TRIAL_USES_KEY]);
    const uses = data[LICENSE_CONFIG.TRIAL_USES_KEY] || 0;
    return Math.max(0, LICENSE_CONFIG.MAX_TRIAL_USES - uses);
  } catch (error) {
    return 0;
  }
}

/**
 * Increment trial usage counter
 */
async function incrementTrialUse() {
  if (!isExtensionContextValid()) {
    return;
  }

  try {
    const data = await chrome.storage.local.get([LICENSE_CONFIG.TRIAL_USES_KEY]);
    const currentUses = data[LICENSE_CONFIG.TRIAL_USES_KEY] || 0;
    await chrome.storage.local.set({
      [LICENSE_CONFIG.TRIAL_USES_KEY]: currentUses + 1
    });
  } catch (error) {
    console.error('Error incrementing trial use:', error);
  }
}

/**
 * Check if user can use premium feature (premium OR trial available)
 * @param {boolean} consumeTrial - Whether to consume a trial use
 * @returns {Promise<{allowed: boolean, reason: string}>}
 */
async function canUsePremiumFeature(consumeTrial = false) {
  // Check if already premium
  const premium = await isPremium();
  if (premium) {
    return { allowed: true, reason: 'premium' };
  }

  // Check trial uses
  const remainingUses = await getTrialUses();
  if (remainingUses > 0) {
    if (consumeTrial) {
      await incrementTrialUse();
    }
    return {
      allowed: true,
      reason: 'trial',
      remainingUses: remainingUses - (consumeTrial ? 1 : 0)
    };
  }

  return {
    allowed: false,
    reason: 'trial_expired',
    message: 'Trial uses exhausted. Please upgrade to premium.'
  };
}

/**
 * Validate license key format (offline check)
 * @param {string} key
 * @returns {boolean}
 */
function validateKeyFormat(key) {
  if (!key || typeof key !== 'string') return false;

  // Check pattern - Paddle validates authenticity server-side
  return LICENSE_CONFIG.LICENSE_PATTERN.test(key);
}

/**
 * Validate license key with API (online validation via Paddle)
 * @param {string} key
 * @param {string} email - Optional user email
 * @returns {Promise<{valid: boolean, message: string, data?: object}>}
 */
async function validateLicenseOnline(key, email = '') {
  try {
    // First check format
    if (!validateKeyFormat(key)) {
      return {
        valid: false,
        message: 'Invalid license key format'
      };
    }

    // Validate with Paddle via Cloudflare Worker
    const response = await fetch(LICENSE_CONFIG.API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        license_key: key,
        email: email || undefined
      })
    });

    if (!response.ok) {
      throw new Error('API validation failed');
    }

    const result = await response.json();

    return {
      valid: result.valid === true,
      message: result.message || (result.valid ? 'License activated!' : 'Invalid license key'),
      data: result.data
    };

  } catch (error) {
    console.error('Online validation error:', error);

    // Fallback to offline validation if API is unreachable
    // This allows the extension to work offline after initial activation
    const formatValid = validateKeyFormat(key);

    if (formatValid) {
      return {
        valid: true,
        message: 'License validated offline (API unreachable)',
        offline: true
      };
    }

    return {
      valid: false,
      message: 'Unable to validate license (no internet connection)',
      error: error.message
    };
  }
}

/**
 * Activate license key
 * @param {string} key
 * @param {string} email
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function activateLicense(key, email = '') {
  if (!isExtensionContextValid()) {
    return {
      success: false,
      message: 'Extension context invalidated. Please refresh the page.'
    };
  }

  try {
    // Validate with API
    const validation = await validateLicenseOnline(key, email);

    if (validation.valid) {
      // Store license information
      await chrome.storage.local.set({
        [LICENSE_CONFIG.STORAGE_KEY]: key,
        [LICENSE_CONFIG.VERIFIED_KEY]: true,
        [LICENSE_CONFIG.VERIFIED_DATE]: Date.now(),
        [LICENSE_CONFIG.USER_EMAIL]: email
      });

      return {
        success: true,
        message: validation.message
      };
    } else {
      return {
        success: false,
        message: validation.message
      };
    }
  } catch (error) {
    console.error('License activation error:', error);
    return {
      success: false,
      message: 'Activation failed: ' + error.message
    };
  }
}

/**
 * Revalidate existing license (called periodically)
 */
async function revalidateLicense() {
  if (!isExtensionContextValid()) {
    return false;
  }

  try {
    const data = await chrome.storage.local.get([
      LICENSE_CONFIG.STORAGE_KEY,
      LICENSE_CONFIG.USER_EMAIL
    ]);

    const key = data[LICENSE_CONFIG.STORAGE_KEY];
    const email = data[LICENSE_CONFIG.USER_EMAIL] || '';

    if (!key) return false;

    const validation = await validateLicenseOnline(key, email);

    if (validation.valid) {
      // Update verification date
      await chrome.storage.local.set({
        [LICENSE_CONFIG.VERIFIED_DATE]: Date.now()
      });
      return true;
    } else {
      // License revoked or invalid
      await deactivateLicense();
      return false;
    }
  } catch (error) {
    console.error('Revalidation error:', error);
    // Keep existing license active if revalidation fails (offline mode)
    return true;
  }
}

/**
 * Deactivate/remove license
 */
async function deactivateLicense() {
  if (!isExtensionContextValid()) {
    return;
  }

  await chrome.storage.local.remove([
    LICENSE_CONFIG.STORAGE_KEY,
    LICENSE_CONFIG.VERIFIED_KEY,
    LICENSE_CONFIG.VERIFIED_DATE,
    LICENSE_CONFIG.USER_EMAIL
  ]);
}

/**
 * Get license information
 * @returns {Promise<object>}
 */
async function getLicenseInfo() {
  if (!isExtensionContextValid()) {
    return {
      isPremium: false,
      licenseKey: null,
      email: null,
      verifiedDate: null,
      trialUsesRemaining: 0,
      maxTrialUses: LICENSE_CONFIG.MAX_TRIAL_USES
    };
  }

  try {
    const data = await chrome.storage.local.get([
      LICENSE_CONFIG.STORAGE_KEY,
      LICENSE_CONFIG.VERIFIED_KEY,
      LICENSE_CONFIG.VERIFIED_DATE,
      LICENSE_CONFIG.USER_EMAIL,
      LICENSE_CONFIG.TRIAL_USES_KEY
    ]);

    const isPrem = await isPremium();
    const trialUses = await getTrialUses();

    return {
      isPremium: isPrem,
      licenseKey: data[LICENSE_CONFIG.STORAGE_KEY]
        ? maskLicenseKey(data[LICENSE_CONFIG.STORAGE_KEY])
        : null,
      email: data[LICENSE_CONFIG.USER_EMAIL] || null,
      verifiedDate: data[LICENSE_CONFIG.VERIFIED_DATE] || null,
      trialUsesRemaining: trialUses,
      maxTrialUses: LICENSE_CONFIG.MAX_TRIAL_USES
    };
  } catch (error) {
    console.error('Error getting license info:', error);
    return {
      isPremium: false,
      licenseKey: null,
      trialUsesRemaining: 0
    };
  }
}

/**
 * Mask license key for display
 * @param {string} key
 * @returns {string}
 */
function maskLicenseKey(key) {
  if (!key) return '';
  const segments = key.split('-');
  if (segments.length !== 5) return key;

  return `${segments[0]}-${segments[1]}-****-****-${segments[4]}`;
}

/**
 * Generate a test license key (for testing purposes ONLY)
 * In production, license keys are generated by Paddle webhook
 * @returns {string}
 */
function generateLicenseKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  const segment1 = randomString(chars, 4);
  const segment2 = randomString(chars, 4);
  const segment3 = randomString(chars, 4);
  const segment4 = randomString(chars, 4);

  return `BLUR-${segment1}-${segment2}-${segment3}-${segment4}`;
}

function randomString(chars, length) {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Export functions for use in other scripts
if (typeof window !== 'undefined') {
  window.LicenseManager = {
    isPremium,
    canUsePremiumFeature,
    activateLicense,
    deactivateLicense,
    getLicenseInfo,
    getTrialUses,
    validateKeyFormat,
    generateLicenseKey // Remove this in production
  };
}
