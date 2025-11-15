// Premium UI - License activation interface
// Injected into content.js for in-page activation

/**
 * Show premium unlock modal
 */
async function showPremiumModal() {
  // Remove existing modal if any
  const existing = document.getElementById('blur-premium-modal');
  if (existing) existing.remove();

  const licenseInfo = await window.LicenseManager.getLicenseInfo();

  const modal = document.createElement('div');
  modal.id = 'blur-premium-modal';
  modal.innerHTML = `
    <div class="blur-modal-overlay">
      <div class="blur-modal-content">
        <div class="blur-modal-header">
          <div class="blur-premium-badge">
            <i class="bi bi-star-fill"></i>
            <span>PREMIUM</span>
          </div>
          <button class="blur-modal-close" id="blur-modal-close">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <div class="blur-modal-body">
          ${licenseInfo.isPremium ? renderActivatedView(licenseInfo) : renderActivationView(licenseInfo)}
        </div>
      </div>
    </div>
  `;

  // Add styles
  const style = document.createElement('style');
  style.textContent = getPremiumModalStyles();
  modal.appendChild(style);

  document.body.appendChild(modal);

  // Setup event listeners
  setupPremiumModalListeners(licenseInfo);
}

/**
 * Render activation view (not premium)
 */
function renderActivationView(licenseInfo) {
  const trialInfo = licenseInfo.trialUsesRemaining > 0
    ? `
      <div class="blur-trial-banner">
        <i class="bi bi-hourglass-split"></i>
        <span>Free Trial: ${licenseInfo.trialUsesRemaining} / ${licenseInfo.maxTrialUses} uses remaining</span>
      </div>
    `
    : `
      <div class="blur-trial-expired">
        <i class="bi bi-exclamation-triangle"></i>
        <span>Trial expired - Upgrade to continue using premium features</span>
      </div>
    `;

  return `
    ${trialInfo}

    <h2 class="blur-modal-title">Unlock Premium Features</h2>
    <p class="blur-modal-subtitle">Get lifetime access to all premium features</p>

    <div class="blur-features-grid">
      <div class="blur-feature-item">
        <i class="bi bi-infinity"></i>
        <span>Unlimited Undo/Redo</span>
      </div>
      <div class="blur-feature-item">
        <i class="bi bi-grid-3x3-gap"></i>
        <span>Quick Select Tool</span>
      </div>
      <div class="blur-feature-item">
        <i class="bi bi-stars"></i>
        <span>Unlimited Presets</span>
      </div>
      <div class="blur-feature-item">
        <i class="bi bi-download"></i>
        <span>Import/Export Presets</span>
      </div>
      <div class="blur-feature-item">
        <i class="bi bi-cloud-check"></i>
        <span>Future Updates</span>
      </div>
      <div class="blur-feature-item">
        <i class="bi bi-headset"></i>
        <span>Priority Support</span>
      </div>
    </div>

    <div class="blur-pricing-box">
      <div class="blur-price">
        <span class="blur-price-amount">$14.99</span>
        <span class="blur-price-label">One-time payment</span>
      </div>
      <p class="blur-price-note">Lifetime access • No subscriptions • All future updates included</p>
    </div>

    <div class="blur-action-buttons">
      <a href="https://yourstore.lemonsqueezy.com/checkout/buy/PRODUCT_ID" target="_blank" class="blur-btn blur-btn-buy">
        <i class="bi bi-cart-fill"></i>
        <span>Buy Premium License</span>
      </a>
    </div>

    <div class="blur-divider">
      <span>Already purchased?</span>
    </div>

    <div class="blur-license-input-group">
      <input
        type="text"
        id="blur-license-input"
        class="blur-license-input"
        placeholder="Enter your license key (BLUR-XXXX-XXXX-XXXX-XXXX)"
        maxlength="29"
      />
      <input
        type="email"
        id="blur-email-input"
        class="blur-email-input"
        placeholder="Email (optional)"
      />
      <button class="blur-btn blur-btn-activate" id="blur-activate-btn">
        <i class="bi bi-key-fill"></i>
        <span>Activate License</span>
      </button>
    </div>

    <div id="blur-activation-message" class="blur-activation-message"></div>

    <div class="blur-help-links">
      <a href="#" id="blur-lost-key">Lost your key?</a>
      <span>•</span>
      <a href="#" id="blur-contact-support">Contact support</a>
    </div>
  `;
}

/**
 * Render activated view (premium user)
 */
function renderActivatedView(licenseInfo) {
  const verifiedDate = licenseInfo.verifiedDate
    ? new Date(licenseInfo.verifiedDate).toLocaleDateString()
    : 'Unknown';

  return `
    <div class="blur-success-banner">
      <i class="bi bi-check-circle-fill"></i>
      <span>Premium Active</span>
    </div>

    <h2 class="blur-modal-title">Thank You! 🎉</h2>
    <p class="blur-modal-subtitle">You have lifetime access to all premium features</p>

    <div class="blur-license-details">
      <div class="blur-detail-row">
        <span class="blur-detail-label">License Key:</span>
        <span class="blur-detail-value">${licenseInfo.licenseKey || 'N/A'}</span>
      </div>
      ${licenseInfo.email ? `
      <div class="blur-detail-row">
        <span class="blur-detail-label">Email:</span>
        <span class="blur-detail-value">${licenseInfo.email}</span>
      </div>
      ` : ''}
      <div class="blur-detail-row">
        <span class="blur-detail-label">Activated:</span>
        <span class="blur-detail-value">${verifiedDate}</span>
      </div>
    </div>

    <div class="blur-premium-features-active">
      <h3>Active Premium Features:</h3>
      <div class="blur-features-list">
        <div class="blur-feature-active">
          <i class="bi bi-check2"></i>
          <span>Unlimited Undo/Redo History</span>
        </div>
        <div class="blur-feature-active">
          <i class="bi bi-check2"></i>
          <span>Quick Select Similar Elements</span>
        </div>
        <div class="blur-feature-active">
          <i class="bi bi-check2"></i>
          <span>Unlimited Custom Presets</span>
        </div>
        <div class="blur-feature-active">
          <i class="bi bi-check2"></i>
          <span>Import/Export Presets</span>
        </div>
        <div class="blur-feature-active">
          <i class="bi bi-check2"></i>
          <span>All Future Updates</span>
        </div>
      </div>
    </div>

    <div class="blur-action-buttons">
      <button class="blur-btn blur-btn-secondary" id="blur-deactivate-btn">
        <i class="bi bi-shield-x"></i>
        <span>Deactivate License</span>
      </button>
    </div>

    <div class="blur-help-links">
      <a href="https://yourstore.lemonsqueezy.com/checkout/buy/PRODUCT_ID" target="_blank">Get license for another device</a>
      <span>•</span>
      <a href="#" id="blur-contact-support">Contact support</a>
    </div>
  `;
}

/**
 * Setup modal event listeners
 */
function setupPremiumModalListeners(licenseInfo) {
  const modal = document.getElementById('blur-premium-modal');

  // Close button
  const closeBtn = document.getElementById('blur-modal-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => modal.remove());
  }

  // Close on overlay click
  const overlay = modal.querySelector('.blur-modal-overlay');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) modal.remove();
    });
  }

  // Activate button
  const activateBtn = document.getElementById('blur-activate-btn');
  if (activateBtn) {
    activateBtn.addEventListener('click', handleLicenseActivation);
  }

  // Deactivate button
  const deactivateBtn = document.getElementById('blur-deactivate-btn');
  if (deactivateBtn) {
    deactivateBtn.addEventListener('click', handleLicenseDeactivation);
  }

  // Auto-format license key input
  const licenseInput = document.getElementById('blur-license-input');
  if (licenseInput) {
    licenseInput.addEventListener('input', (e) => {
      let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');

      // Auto-add hyphens
      if (value.length > 4) {
        value = value.match(/.{1,4}/g).join('-');
      }

      e.target.value = value.substring(0, 29); // BLUR-XXXX-XXXX-XXXX-XXXX
    });
  }

  // Lost key link
  const lostKeyLink = document.getElementById('blur-lost-key');
  if (lostKeyLink) {
    lostKeyLink.addEventListener('click', (e) => {
      e.preventDefault();
      window.open('https://app.lemonsqueezy.com/my-orders', '_blank');
    });
  }

  // Contact support
  const supportLinks = document.querySelectorAll('#blur-contact-support');
  supportLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      window.open('mailto:support@your-domain.com?subject=Element Blur Support', '_blank');
    });
  });
}

/**
 * Handle license activation
 */
async function handleLicenseActivation() {
  const licenseInput = document.getElementById('blur-license-input');
  const emailInput = document.getElementById('blur-email-input');
  const activateBtn = document.getElementById('blur-activate-btn');
  const messageDiv = document.getElementById('blur-activation-message');

  const licenseKey = licenseInput.value.trim();
  const email = emailInput.value.trim();

  // Validate input
  if (!licenseKey) {
    showActivationMessage('Please enter a license key', 'error');
    return;
  }

  // Check format
  if (!window.LicenseManager.validateKeyFormat(licenseKey)) {
    showActivationMessage('Invalid license key format. Should be BLUR-XXXX-XXXX-XXXX-XXXX', 'error');
    return;
  }

  // Disable button and show loading
  activateBtn.disabled = true;
  activateBtn.innerHTML = '<i class="bi bi-hourglass-split"></i><span>Activating...</span>';

  try {
    const result = await window.LicenseManager.activateLicense(licenseKey, email);

    if (result.success) {
      showActivationMessage(result.message, 'success');
      // Reload modal to show activated state
      setTimeout(() => {
        showPremiumModal();
      }, 1500);
    } else {
      showActivationMessage(result.message, 'error');
      activateBtn.disabled = false;
      activateBtn.innerHTML = '<i class="bi bi-key-fill"></i><span>Activate License</span>';
    }
  } catch (error) {
    showActivationMessage('Activation failed: ' + error.message, 'error');
    activateBtn.disabled = false;
    activateBtn.innerHTML = '<i class="bi bi-key-fill"></i><span>Activate License</span>';
  }
}

/**
 * Handle license deactivation
 */
async function handleLicenseDeactivation() {
  if (!confirm('Are you sure you want to deactivate this license? You can reactivate it later with the same key.')) {
    return;
  }

  try {
    await window.LicenseManager.deactivateLicense();
    showPremiumModal(); // Reload to show activation view
  } catch (error) {
    alert('Deactivation failed: ' + error.message);
  }
}

/**
 * Show activation message
 */
function showActivationMessage(message, type) {
  const messageDiv = document.getElementById('blur-activation-message');
  if (!messageDiv) return;

  const icon = type === 'success' ? 'check-circle-fill' : 'exclamation-circle-fill';

  messageDiv.className = `blur-activation-message blur-message-${type}`;
  messageDiv.innerHTML = `
    <i class="bi bi-${icon}"></i>
    <span>${message}</span>
  `;
}

/**
 * Get premium modal styles
 */
function getPremiumModalStyles() {
  return `
    .blur-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2147483646;
      animation: fadeIn 0.2s ease-out;
      padding: 20px;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .blur-modal-content {
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
      border-radius: 20px;
      max-width: 550px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow:
        0 25px 70px -15px rgba(0, 0, 0, 0.4),
        0 10px 30px -10px rgba(0, 0, 0, 0.3);
      animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(30px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .blur-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px 28px 16px;
      border-bottom: 1px solid rgba(226, 232, 240, 0.8);
    }

    .blur-premium-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: 700;
      font-size: 13px;
      letter-spacing: 1px;
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
    }

    .blur-premium-badge i {
      font-size: 14px;
    }

    .blur-modal-close {
      background: rgba(148, 163, 184, 0.1);
      border: none;
      border-radius: 10px;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      color: #64748b;
    }

    .blur-modal-close:hover {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
      transform: scale(1.05);
    }

    .blur-modal-body {
      padding: 28px;
    }

    .blur-modal-title {
      font-size: 28px;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 8px 0;
      text-align: center;
    }

    .blur-modal-subtitle {
      font-size: 15px;
      color: #64748b;
      margin: 0 0 24px 0;
      text-align: center;
    }

    .blur-trial-banner,
    .blur-trial-expired,
    .blur-success-banner {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      border-radius: 12px;
      margin-bottom: 24px;
      font-size: 14px;
      font-weight: 600;
    }

    .blur-trial-banner {
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.1));
      color: #2563eb;
      border: 1px solid rgba(59, 130, 246, 0.3);
    }

    .blur-trial-expired {
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.1));
      color: #dc2626;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }

    .blur-success-banner {
      background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(22, 163, 74, 0.1));
      color: #16a34a;
      border: 1px solid rgba(34, 197, 94, 0.3);
    }

    .blur-features-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }

    .blur-feature-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 14px;
      background: linear-gradient(135deg, rgba(241, 245, 249, 0.8), rgba(248, 250, 252, 0.8));
      border: 1px solid rgba(226, 232, 240, 0.8);
      border-radius: 10px;
      font-size: 13px;
      font-weight: 500;
      color: #475569;
      transition: all 0.2s;
    }

    .blur-feature-item:hover {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1));
      border-color: rgba(99, 102, 241, 0.3);
      transform: translateX(4px);
    }

    .blur-feature-item i {
      color: #6366f1;
      font-size: 16px;
    }

    .blur-pricing-box {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 24px;
      border-radius: 16px;
      text-align: center;
      margin-bottom: 24px;
      box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
    }

    .blur-price {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 12px;
    }

    .blur-price-amount {
      font-size: 42px;
      font-weight: 800;
      line-height: 1;
    }

    .blur-price-label {
      font-size: 14px;
      opacity: 0.9;
      margin-top: 6px;
    }

    .blur-price-note {
      font-size: 13px;
      opacity: 0.95;
      margin: 0;
    }

    .blur-action-buttons {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 24px;
    }

    .blur-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 14px 24px;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      text-decoration: none;
    }

    .blur-btn-buy {
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      box-shadow: 0 6px 20px rgba(16, 185, 129, 0.3);
    }

    .blur-btn-buy:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 30px rgba(16, 185, 129, 0.4);
    }

    .blur-btn-activate {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      box-shadow: 0 6px 20px rgba(99, 102, 241, 0.3);
    }

    .blur-btn-activate:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 10px 30px rgba(99, 102, 241, 0.4);
    }

    .blur-btn-activate:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .blur-btn-secondary {
      background: rgba(148, 163, 184, 0.15);
      color: #64748b;
      border: 1px solid rgba(148, 163, 184, 0.3);
    }

    .blur-btn-secondary:hover {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
      border-color: rgba(239, 68, 68, 0.3);
    }

    .blur-divider {
      text-align: center;
      color: #94a3b8;
      font-size: 13px;
      margin: 24px 0;
      position: relative;
    }

    .blur-divider::before,
    .blur-divider::after {
      content: '';
      position: absolute;
      top: 50%;
      width: calc(50% - 80px);
      height: 1px;
      background: linear-gradient(to right, transparent, rgba(203, 213, 225, 0.5), transparent);
    }

    .blur-divider::before { left: 0; }
    .blur-divider::after { right: 0; }

    .blur-license-input-group {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 16px;
    }

    .blur-license-input,
    .blur-email-input {
      padding: 14px 16px;
      border: 2px solid rgba(226, 232, 240, 0.8);
      border-radius: 10px;
      font-size: 14px;
      font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
      transition: all 0.2s;
      background: white;
    }

    .blur-license-input:focus,
    .blur-email-input:focus {
      outline: none;
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }

    .blur-activation-message {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      border-radius: 10px;
      margin-bottom: 16px;
      font-size: 14px;
      font-weight: 500;
    }

    .blur-message-success {
      background: rgba(34, 197, 94, 0.1);
      color: #16a34a;
      border: 1px solid rgba(34, 197, 94, 0.3);
    }

    .blur-message-error {
      background: rgba(239, 68, 68, 0.1);
      color: #dc2626;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }

    .blur-help-links {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      font-size: 13px;
      color: #94a3b8;
    }

    .blur-help-links a {
      color: #6366f1;
      text-decoration: none;
      transition: color 0.2s;
    }

    .blur-help-links a:hover {
      color: #8b5cf6;
      text-decoration: underline;
    }

    .blur-license-details {
      background: linear-gradient(135deg, rgba(241, 245, 249, 0.8), rgba(248, 250, 252, 0.8));
      border: 1px solid rgba(226, 232, 240, 0.8);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
    }

    .blur-detail-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid rgba(226, 232, 240, 0.5);
    }

    .blur-detail-row:last-child {
      border-bottom: none;
    }

    .blur-detail-label {
      font-weight: 600;
      color: #64748b;
      font-size: 13px;
    }

    .blur-detail-value {
      color: #1e293b;
      font-size: 13px;
      font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
    }

    .blur-premium-features-active h3 {
      font-size: 16px;
      color: #1e293b;
      margin: 0 0 16px 0;
      font-weight: 600;
    }

    .blur-features-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 24px;
    }

    .blur-feature-active {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      background: rgba(34, 197, 94, 0.08);
      border-radius: 8px;
      color: #16a34a;
      font-size: 14px;
      font-weight: 500;
    }

    .blur-feature-active i {
      font-size: 18px;
    }
  `;
}

// Export for use in content.js
if (typeof window !== 'undefined') {
  window.PremiumUI = {
    showPremiumModal
  };
}
