let isSelecting = false;
let isDrawing = false;
let isSelectingText = false;
let blurIntensity = 5;
let highlightOpacity = 0.5;
let highlightColor = '#FFFF00';
let isHighlightMode = false;
let startX, startY;
let region;
let overlay;
let lastHighlightedElement = null;
let blurHistory = [];
let redoHistory = [];
let originalUserSelect = '';
let toolbarVisible = true;
let activeToolMode = null; // Track which tool is currently active
let toolbarCompact = false; // Track toolbar compact mode
let keepBlurEnabled = true; // Auto-save/load is always enabled
let multiSelectElements = []; // Track elements selected with Shift key
let isMultiSelectMode = false; // Track if Shift is held during selection

// Constants for z-index
const Z_INDEX_MAX = 2147483647;
const Z_INDEX_OVERLAY = 2147483646;
const Z_INDEX_REGION = 2147483645;

// Blur presets
const BLUR_PRESETS = {
  light: 3,
  medium: 8,
  heavy: 15
};

// Custom presets storage
let customPresets = [];

// Clear all blur and highlight effects
// @param {boolean} clearStorage - If true, also delete saved state from storage (default: true)
async function clearAllBlurs(clearStorage = true) {
  document.querySelectorAll('.blurred').forEach(el => el.classList.remove('blurred'));
  document.querySelectorAll('.highlighted').forEach(el => el.classList.remove('highlighted'));
  document.querySelectorAll('.blur-region').forEach(el => el.remove());
  document.querySelectorAll('.highlight-region').forEach(el => el.remove());

  // Properly unwrap text blur/highlight spans
  document.querySelectorAll('.blur-text, .highlight-text').forEach(span => {
    if (span.parentNode) {
      // Move all child nodes before the span
      while (span.firstChild) {
        span.parentNode.insertBefore(span.firstChild, span);
      }
      // Remove the empty span
      span.remove();
    }
  });

  // Only clear saved state if explicitly requested (e.g., user clicked Clear All button)
  // Don't clear when we're just preparing DOM to load saved state
  if (clearStorage) {
    const domain = getCurrentDomain();
    try {
      const result = await chrome.storage.local.get(['blurConfigs']);
      const configs = result.blurConfigs || {};
      if (configs[domain]) {
        delete configs[domain];
        await chrome.storage.local.set({ blurConfigs: configs });
        console.log('[Blurt-ool] Cleared saved state for', domain);
      }
    } catch (error) {
      console.error('[Blurt-ool] Error clearing saved state:', error);
    }
  }
}

// Save complete blur state as a preset
async function saveAsPreset(name, description = '') {
  const state = serializeBlurState();
  const domain = getCurrentDomain();

  const preset = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: name.trim(),
    description: description.trim(),
    domain: domain,
    createdAt: new Date().toISOString(),
    state: state,
    // Snapshot of current settings
    settings: {
      blurIntensity,
      highlightColor,
      highlightOpacity,
      isHighlightMode
    }
  };

  customPresets.push(preset);
  await saveCustomPresets();
  return preset;
}

// Apply a saved preset
async function applyPreset(preset) {
  // Validate preset structure
  if (!preset || typeof preset !== 'object') {
    console.error('[Blurt-ool] Invalid preset: not an object');
    showNotification('❌ Invalid preset data', true);
    return;
  }

  if (!preset.settings || typeof preset.settings !== 'object') {
    console.error('[Blurt-ool] Invalid preset: missing or invalid settings');
    showNotification('❌ Incomplete preset data (missing settings)', true);
    return;
  }

  if (!preset.state || typeof preset.state !== 'object') {
    console.error('[Blurt-ool] Invalid preset: missing or invalid state');
    showNotification('❌ Incomplete preset data (missing state)', true);
    return;
  }

  // Validate settings values
  if (preset.settings.blurIntensity !== undefined) {
    const intensity = Number(preset.settings.blurIntensity);
    if (isNaN(intensity) || intensity < 0 || intensity > 50) {
      console.error('[Blurt-ool] Invalid blur intensity:', preset.settings.blurIntensity);
      showNotification('❌ Invalid blur intensity in preset', true);
      return;
    }
  }

  if (preset.settings.highlightOpacity !== undefined) {
    const opacity = Number(preset.settings.highlightOpacity);
    if (isNaN(opacity) || opacity < 0 || opacity > 1) {
      console.error('[Blurt-ool] Invalid highlight opacity:', preset.settings.highlightOpacity);
      showNotification('❌ Invalid highlight opacity in preset', true);
      return;
    }
  }

  if (preset.settings.highlightColor !== undefined) {
    const color = String(preset.settings.highlightColor);
    // Basic hex color validation
    if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
      console.error('[Blurt-ool] Invalid highlight color:', preset.settings.highlightColor);
      showNotification('❌ Invalid highlight color in preset', true);
      return;
    }
  }

  // Validate state arrays
  if (preset.state.blurred && !Array.isArray(preset.state.blurred)) {
    console.error('[Blurt-ool] Invalid state: blurred is not an array');
    showNotification('❌ Invalid preset state format', true);
    return;
  }

  if (preset.state.highlighted && !Array.isArray(preset.state.highlighted)) {
    console.error('[Blurt-ool] Invalid state: highlighted is not an array');
    showNotification('❌ Invalid preset state format', true);
    return;
  }

  if (preset.state.regions && !Array.isArray(preset.state.regions)) {
    console.error('[Blurt-ool] Invalid state: regions is not an array');
    showNotification('❌ Invalid preset state format', true);
    return;
  }

  if (preset.state.highlightRegions && !Array.isArray(preset.state.highlightRegions)) {
    console.error('[Blurt-ool] Invalid state: highlightRegions is not an array');
    showNotification('❌ Invalid preset state format', true);
    return;
  }

  // Clear current state (but don't delete saved config - we're applying it)
  await clearAllBlurs(false);

  // Restore settings
  blurIntensity = preset.settings.blurIntensity || blurIntensity;
  highlightColor = preset.settings.highlightColor || highlightColor;
  highlightOpacity = preset.settings.highlightOpacity || highlightOpacity;
  isHighlightMode = preset.settings.isHighlightMode || false;

  // Update UI
  const intensitySlider = document.getElementById('toolbar-blur-intensity');
  const colorPicker = document.getElementById('toolbar-color-picker');
  const modeToggle = document.getElementById('toolbar-mode-toggle');

  if (intensitySlider) intensitySlider.value = blurIntensity;
  if (colorPicker) colorPicker.value = highlightColor;
  if (modeToggle) {
    const modeIcon = modeToggle.querySelector('#mode-icon');
    if (modeIcon) {
      // Switch between blur and highlight icon
      if (isHighlightMode) {
        modeIcon.className = 'bi bi-highlighter';
      } else {
        modeIcon.className = 'bi bi-droplet-fill';
      }
    }
    modeToggle.title = isHighlightMode ? 'Switch to Blur Mode' : 'Switch to Highlight Mode';
  }

  const colorPickerContainer = document.querySelector('.color-picker-container');
  if (colorPickerContainer) {
    colorPickerContainer.style.display = isHighlightMode ? 'flex' : 'none';
  }

  updateBlurStyle();
  updateStatusIndicator();

  // Restore blur state
  if (preset.state) {
    applySavedState(preset.state);
  }

  showNotification(`✨ Applied preset: ${preset.name}`);
}

// History management with memory leak prevention
const MAX_HISTORY_SIZE = 50;

function cleanupHistory() {
  if (blurHistory.length > MAX_HISTORY_SIZE) {
    blurHistory = blurHistory.slice(-MAX_HISTORY_SIZE);
  }
  if (redoHistory.length > MAX_HISTORY_SIZE) {
    redoHistory = redoHistory.slice(-MAX_HISTORY_SIZE);
  }
}

function trackBlurAction(element, action) {
  if (!element) return;
  blurHistory.push({ element, action });
  redoHistory = []; // Clear redo history when new action is performed
  cleanupHistory();
}

const style = document.createElement('style');
document.head.appendChild(style);

// Load Bootstrap Icons CSS for toolbar icons
if (!document.getElementById('bootstrap-icons-css')) {
  const iconLink = document.createElement('link');
  iconLink.id = 'bootstrap-icons-css';
  iconLink.rel = 'stylesheet';
  iconLink.href = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css';
  iconLink.crossOrigin = 'anonymous';
  document.head.appendChild(iconLink);
  iconLink.onload = () => {
    console.log('[Blurt-ool] Bootstrap Icons CSS loaded successfully');
  };
  iconLink.onerror = () => {
    console.error('[Blurt-ool] Failed to load Bootstrap Icons CSS');
  };
}

function createOverlay() {
  if (overlay) return;
  overlay = document.createElement('div');
  overlay.id = 'blur-mode-overlay';
  document.body.appendChild(overlay);
  document.body.style.cursor = 'crosshair';
}

function removeOverlay() {
  if (overlay) {
    overlay.remove();
    overlay = null;
  }
  if (lastHighlightedElement) {
    lastHighlightedElement.classList.remove('element-highlight');
    lastHighlightedElement = null;
  }
  // Clear multi-select elements and remove outlines
  multiSelectElements.forEach(el => {
    if (el.style.outline) {
      el.style.outline = '';
      el.style.outlineOffset = '';
    }
  });
  multiSelectElements = [];
  // Fix text selection restoration
  if (originalUserSelect !== '') {
    document.body.style.userSelect = originalUserSelect;
    originalUserSelect = '';
  }
  isSelecting = false;
  isDrawing = false;
  isSelectingText = false;
  updateBlurStyle(); // Update cursor
  setActiveTool(null); // Clear active tool state
}

function exitSelectMode() {
  if (lastHighlightedElement) {
    lastHighlightedElement.classList.remove('element-highlight');
    lastHighlightedElement = null;
  }
  isSelecting = false;
  updateBlurStyle(); // Update cursor
  setActiveTool(null); // Clear active tool state
}

function exitTextSelectMode() {
  if (originalUserSelect !== '') {
    document.body.style.userSelect = originalUserSelect;
    originalUserSelect = '';
  }
  isSelectingText = false;
  updateBlurStyle(); // Update cursor
  setActiveTool(null); // Clear active tool state
}

function highlightElement(element) {
  if (lastHighlightedElement) {
    lastHighlightedElement.classList.remove('element-highlight');
  }

  if (element && element !== overlay && !element.closest('#blur-toolbar-container')) {
    element.classList.add('element-highlight');
    lastHighlightedElement = element;
  }
}

function updateBlurStyle() {
  // Set cursor based on active mode
  let bodyCursor = 'default';
  if (isSelecting) {
    bodyCursor = 'crosshair';
  } else if (isDrawing) {
    bodyCursor = 'crosshair';
  } else if (isSelectingText) {
    bodyCursor = 'text';
  }

  style.textContent = `
    body {
      cursor: ${bodyCursor} !important;
    }
    .blurred:not(#blur-toolbar-container):not(#blur-toolbar):not(#blur-toolbar *) {
      filter: blur(${blurIntensity}px);
    }
    .blur-region {
      position: absolute;
      background-color: rgba(0, 0, 0, 0.01);
      backdrop-filter: blur(${blurIntensity}px);
      z-index: ${Z_INDEX_REGION};
      pointer-events: auto;
      cursor: pointer;
    }
    .blur-text {
      color: transparent !important;
      text-shadow: 0 0 ${blurIntensity}px rgba(0,0,0,0.5) !important;
      background: rgba(0,0,0,0.1) !important;
      border-radius: 2px !important;
    }
    .highlighted:not(#blur-toolbar-container):not(#blur-toolbar):not(#blur-toolbar *) {
      background-color: ${highlightColor} !important;
      opacity: ${highlightOpacity} !important;
    }
    .highlight-region {
      position: absolute;
      background-color: ${highlightColor};
      opacity: ${highlightOpacity};
      z-index: ${Z_INDEX_REGION};
      pointer-events: auto;
      cursor: pointer;
    }
    .highlight-text {
      background-color: ${highlightColor} !important;
      border-radius: 2px !important;
      padding: 2px 0 !important;
    }
    #blur-toolbar-container {
      position: fixed !important;
      z-index: ${Z_INDEX_MAX} !important;
      pointer-events: auto !important;
      filter: none !important;
    }
    #blur-toolbar-container *, #blur-toolbar, #blur-toolbar * {
      filter: none !important;
      pointer-events: auto !important;
      z-index: ${Z_INDEX_MAX} !important;
    }
    #blur-mode-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: rgba(0, 0, 0, 0.3);
      z-index: ${Z_INDEX_OVERLAY};
      pointer-events: none;
    }
    .element-highlight {
      outline: 2px solid #007acc !important;
      outline-offset: 2px !important;
      background-color: rgba(0, 122, 204, 0.1) !important;
    }
  `;
}

// Storage functions
function getCurrentDomain() {
  return window.location.hostname;
}

// Check storage quota and warn if approaching limit
async function checkStorageQuota() {
  try {
    const result = await chrome.storage.local.get(null);
    const dataSize = JSON.stringify(result).length;
    // Chrome local storage limit is approximately 10MB (10485760 bytes)
    const maxSize = 10485760;
    const warningThreshold = maxSize * 0.8; // Warn at 80%
    const criticalThreshold = maxSize * 0.95; // Critical at 95%

    if (dataSize >= criticalThreshold) {
      showNotification('⚠️ Storage almost full! Delete old presets to free up space.', true);
      return { allowed: false, percentage: (dataSize / maxSize) * 100, size: dataSize };
    } else if (dataSize >= warningThreshold) {
      showNotification('⚠️ Storage usage high. Consider deleting old presets.', false);
      return { allowed: true, percentage: (dataSize / maxSize) * 100, size: dataSize };
    }

    return { allowed: true, percentage: (dataSize / maxSize) * 100, size: dataSize };
  } catch (error) {
    console.error('[Blurt-ool] Error checking storage quota:', error);
    return { allowed: true, percentage: 0, size: 0 };
  }
}

function serializeBlurState() {
  const state = {
    blurred: [],
    highlighted: [],
    regions: [],
    highlightRegions: [],
    textBlurs: [],
    textHighlights: [],
    settings: {
      blurIntensity,
      highlightColor,
      highlightOpacity
    }
  };

  document.querySelectorAll('.blurred').forEach(el => {
    const selector = getElementSelector(el);
    if (selector) state.blurred.push(selector);
  });

  document.querySelectorAll('.highlighted').forEach(el => {
    const selector = getElementSelector(el);
    if (selector) state.highlighted.push(selector);
  });

  document.querySelectorAll('.blur-region, .highlight-region').forEach(el => {
    const regionData = {
      left: el.style.left,
      top: el.style.top,
      width: el.style.width,
      height: el.style.height,
      type: el.classList.contains('blur-region') ? 'blur' : 'highlight'
    };
    if (regionData.type === 'blur') {
      state.regions.push(regionData);
    } else {
      state.highlightRegions.push(regionData);
    }
  });

  // Serialize text blurs and highlights
  document.querySelectorAll('.blur-text').forEach(span => {
    const textData = {
      textContent: span.textContent,
      parentSelector: getElementSelector(span.parentElement)
    };
    state.textBlurs.push(textData);
  });

  document.querySelectorAll('.highlight-text').forEach(span => {
    const textData = {
      textContent: span.textContent,
      parentSelector: getElementSelector(span.parentElement)
    };
    state.textHighlights.push(textData);
  });

  return state;
}

function getElementSelector(element) {
  if (!element || !element.tagName) return null;

  // Strategy 1: If element has a unique ID, use it
  if (element.id && /^[a-zA-Z][\w\-]*$/.test(element.id)) {
    // Verify ID is actually unique
    try {
      if (document.querySelectorAll(`#${element.id}`).length === 1) {
        return `#${element.id}`;
      }
    } catch (e) {
      // Invalid ID format, continue to next strategy
    }
  }

  // Strategy 2: Try data attributes for uniqueness
  for (const attr of element.attributes) {
    if (attr.name.startsWith('data-') && attr.value) {
      const selector = `${element.tagName.toLowerCase()}[${attr.name}="${attr.value}"]`;
      try {
        if (document.querySelectorAll(selector).length === 1) {
          return selector;
        }
      } catch (e) {
        continue;
      }
    }
  }

  // Strategy 3: Build path from root using tag names, classes, and nth-of-type
  const path = [];
  let current = element;
  let depth = 0;

  while (current && current !== document.body && depth < 10) {
    let selector = current.tagName.toLowerCase();

    // Get clean classes (exclude our extension classes)
    if (current.className && typeof current.className === 'string') {
      const classes = current.className.split(' ')
        .filter(c => c &&
          !c.startsWith('blur') &&
          !c.startsWith('highlight') &&
          c !== 'element-highlight')
        .slice(0, 3) // Limit to first 3 classes
        .join('.');
      if (classes) {
        selector += `.${classes}`;
      }
    }

    // Use nth-of-type instead of nth-child for better stability
    if (current.parentElement) {
      const siblings = Array.from(current.parentElement.children)
        .filter(el => el.tagName === current.tagName);

      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-of-type(${index})`;
      }
    }

    path.unshift(selector);
    current = current.parentElement;
    depth++;

    // Stop if we have a unique selector
    try {
      const testSelector = path.join(' > ');
      if (document.querySelectorAll(testSelector).length === 1) {
        break;
      }
    } catch (e) {
      // Invalid selector, continue building
    }
  }

  const finalSelector = path.join(' > ');

  // Validate the selector works
  try {
    const found = document.querySelectorAll(finalSelector);
    if (found.length > 0) {
      return finalSelector;
    }
  } catch (e) {
    console.warn('[Blurt-ool] Generated invalid selector:', finalSelector, e);
  }

  // Fallback: use tag name with all classes as last resort
  const fallback = element.tagName.toLowerCase() +
    (element.className && typeof element.className === 'string'
      ? '.' + element.className.split(' ').filter(c => c && !c.startsWith('blur') && !c.startsWith('highlight')).join('.')
      : '');

  return fallback || element.tagName.toLowerCase();
}

async function saveCurrentState(silent = false) {
  const domain = getCurrentDomain();
  const state = serializeBlurState();

  console.log('[Blurt-ool] Saving state for', domain, ':', state);

  try {
    // Check storage quota before saving
    const quotaCheck = await checkStorageQuota();
    if (!quotaCheck.allowed) {
      if (!silent) {
        showNotification('Cannot save: Storage is full. Delete old presets first.', true);
      }
      return false;
    }

    const result = await chrome.storage.local.get(['blurConfigs']);
    const configs = result.blurConfigs || {};
    configs[domain] = state;
    await chrome.storage.local.set({ blurConfigs: configs });
    console.log('[Blurt-ool] State saved successfully');
    if (!silent) {
      showNotification('Configuration saved for ' + domain);
    }
    return true;
  } catch (error) {
    console.error('[Blurt-ool] Error saving state:', error);
    if (!silent) {
      showNotification('Error saving configuration', true);
    }
    return false;
  }
}

async function loadSavedState(showNoConfigNotification = true) {
  const domain = getCurrentDomain();

  console.log('[Blurt-ool] Loading state for', domain);

  try {
    // First, try to load from saved configurations
    const result = await chrome.storage.local.get(['blurConfigs', 'customPresets']);
    const configs = result.blurConfigs || {};
    const state = configs[domain];

    console.log('[Blurt-ool] Found saved state:', state);

    if (state) {
      console.log('[Blurt-ool] Applying saved state');
      // Clear current state before loading (but don't delete the saved config)
      await clearAllBlurs(false);
      applySavedState(state);
      console.log('[Blurt-ool] State applied successfully');
      return true;
    }

    // If no saved config, check for custom presets for this domain
    const allPresets = result.customPresets || [];
    const domainPresets = allPresets.filter(p => p.domain === domain);

    if (domainPresets.length > 0) {
      // Apply the most recently created preset for this domain
      const mostRecent = domainPresets.sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
      )[0];

      await clearAllBlurs(false);
      await applyPreset(mostRecent);
      return true;
    }

    // No saved config or presets found
    if (showNoConfigNotification) {
      showNotification('No saved configuration or presets for ' + domain);
    }
    return false;
  } catch (error) {
    console.error('Error loading state:', error);
    showNotification('Error loading configuration', true);
    return false;
  }
}

// Auto-save functionality (Keep Blur is always enabled)
// Debounced auto-save to prevent excessive saves
let autoSaveTimeout = null;
async function autoSaveIfKeepBlurEnabled() {
  // Clear previous timeout
  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout);
  }

  // Debounce: wait 500ms after last change before saving
  autoSaveTimeout = setTimeout(async () => {
    try {
      const saved = await saveCurrentState(true); // Silent save
      if (saved) {
        console.log('[Blurt-ool] Auto-saved successfully');
        // Show subtle visual feedback
        const toolbar = document.getElementById('blur-toolbar');
        if (toolbar) {
          toolbar.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.3)';
          setTimeout(() => {
            toolbar.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
          }, 300);
        }
      }
    } catch (error) {
      console.error('[Blurt-ool] Auto-save failed:', error);
    }
  }, 500);
}

function applySavedState(state) {
  if (!state) return;

  console.log('[Blurt-ool] applySavedState called with:', state);

  // Use requestAnimationFrame to ensure DOM is ready
  requestAnimationFrame(() => {
    try {
      // Apply settings
      if (state.settings) {
        blurIntensity = state.settings.blurIntensity || 5;
        highlightColor = state.settings.highlightColor || '#FFFF00';
        highlightOpacity = state.settings.highlightOpacity || 0.5;
        updateBlurStyle();

        // Update UI controls
        const intensitySlider = document.getElementById('toolbar-blur-intensity');
        const colorPicker = document.getElementById('toolbar-color-picker');
        if (intensitySlider) intensitySlider.value = blurIntensity;
        if (colorPicker) colorPicker.value = highlightColor;
      }

      let appliedCount = 0;
      let failedCount = 0;

      // Apply blurred elements
      console.log('[Blurt-ool] Applying', state.blurred?.length || 0, 'blurred elements');
      state.blurred?.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          console.log('[Blurt-ool] Selector', selector, 'matched', elements.length, 'elements');
          if (elements.length > 0) {
            elements.forEach(el => {
              el.classList.add('blurred');
              appliedCount++;
            });
          } else {
            failedCount++;
            console.warn('[Blurt-ool] Selector matched 0 elements:', selector);
          }
        } catch (e) {
          failedCount++;
          console.warn('[Blurt-ool] Invalid selector:', selector, e);
        }
      });

      console.log(`[Blurt-ool] Applied ${appliedCount} blurred elements, ${failedCount} failed`);

      // Apply highlighted elements
      console.log('[Blurt-ool] Applying', state.highlighted?.length || 0, 'highlighted elements');
      state.highlighted?.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          console.log('[Blurt-ool] Selector', selector, 'matched', elements.length, 'elements');
          if (elements.length > 0) {
            elements.forEach(el => {
              el.classList.add('highlighted');
              appliedCount++;
            });
          } else {
            failedCount++;
            console.warn('[Blurt-ool] Highlight selector matched 0 elements:', selector);
          }
        } catch (e) {
          failedCount++;
          console.warn('[Blurt-ool] Invalid highlight selector:', selector, e);
        }
      });

      // Apply blur regions
      state.regions?.forEach(regionData => {
        const region = document.createElement('div');
        region.className = 'blur-region';
        region.style.left = regionData.left;
        region.style.top = regionData.top;
        region.style.width = regionData.width;
        region.style.height = regionData.height;
        document.body.appendChild(region);
        appliedCount++;
      });

      // Apply highlight regions
      state.highlightRegions?.forEach(regionData => {
        const region = document.createElement('div');
        region.className = 'highlight-region';
        region.style.left = regionData.left;
        region.style.top = regionData.top;
        region.style.width = regionData.width;
        region.style.height = regionData.height;
        document.body.appendChild(region);
        appliedCount++;
      });

      // Apply text blurs (best effort - may not work if page structure changed)
      console.log('[Blurt-ool] Applying', state.textBlurs?.length || 0, 'text blurs');
      state.textBlurs?.forEach(textData => {
        try {
          const parents = document.querySelectorAll(textData.parentSelector);
          console.log('[Blurt-ool] Text blur parent selector', textData.parentSelector, 'matched', parents.length, 'parents');
          parents.forEach(parent => {
            // Find text nodes containing the blurred text
            const walker = document.createTreeWalker(parent, NodeFilter.SHOW_TEXT, null, false);
            let node;
            while (node = walker.nextNode()) {
              if (node.textContent.includes(textData.textContent)) {
                // Found the text, wrap it in a span
                const range = document.createRange();
                const startIndex = node.textContent.indexOf(textData.textContent);
                if (startIndex !== -1) {
                  try {
                    range.setStart(node, startIndex);
                    range.setEnd(node, startIndex + textData.textContent.length);
                    const span = document.createElement('span');
                    span.className = 'blur-text';
                    range.surroundContents(span);
                    appliedCount++;
                    break; // Found and wrapped, move to next textData
                  } catch (e) {
                    // Range might span multiple nodes, skip
                    console.warn('Could not restore text blur:', e);
                  }
                }
              }
            }
          });
        } catch (e) {
          console.warn('Error restoring text blur:', e);
        }
      });

      // Apply text highlights (best effort - may not work if page structure changed)
      console.log('[Blurt-ool] Applying', state.textHighlights?.length || 0, 'text highlights');
      state.textHighlights?.forEach(textData => {
        try {
          const parents = document.querySelectorAll(textData.parentSelector);
          console.log('[Blurt-ool] Text highlight parent selector', textData.parentSelector, 'matched', parents.length, 'parents');
          parents.forEach(parent => {
            // Find text nodes containing the highlighted text
            const walker = document.createTreeWalker(parent, NodeFilter.SHOW_TEXT, null, false);
            let node;
            while (node = walker.nextNode()) {
              if (node.textContent.includes(textData.textContent)) {
                // Found the text, wrap it in a span
                const range = document.createRange();
                const startIndex = node.textContent.indexOf(textData.textContent);
                if (startIndex !== -1) {
                  try {
                    range.setStart(node, startIndex);
                    range.setEnd(node, startIndex + textData.textContent.length);
                    const span = document.createElement('span');
                    span.className = 'highlight-text';
                    range.surroundContents(span);
                    appliedCount++;
                    break; // Found and wrapped, move to next textData
                  } catch (e) {
                    // Range might span multiple nodes, skip
                    console.warn('Could not restore text highlight:', e);
                  }
                }
              }
            }
          });
        } catch (e) {
          console.warn('Error restoring text highlight:', e);
        }
      });

      // Show summary
      if (appliedCount > 0 || failedCount > 0) {
        console.log(`[Blurt-ool] ✅ Applied total: ${appliedCount} items, ❌ Failed: ${failedCount} items`);
        showNotification(`Restored ${appliedCount} blur/highlight effects`);
      }
    } catch (error) {
      console.error('[Blurt-ool] Error in applySavedState (inner):', error);
    }
  });
}

async function exportConfiguration() {
  const state = serializeBlurState();
  const domain = getCurrentDomain();
  const now = new Date();

  // Format date as YYYY-MM-DD
  const dateStr = now.toISOString().split('T')[0];

  // Format time as HH-MM for filename safety
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-').substring(0, 5);

  const data = {
    domain,
    timestamp: now.toISOString(),
    exportDate: dateStr,
    state
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');

  // Smart filename: blur-google.com-2024-11-14.json
  a.download = `blur-${domain}-${dateStr}.json`;
  a.href = url;
  a.click();
  URL.revokeObjectURL(url);

  showNotification(`Configuration exported: ${domain}`);
}

async function importConfiguration() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';

  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (data.state) {
        applySavedState(data.state);
        showNotification('Configuration imported successfully');
      } else {
        showNotification('Invalid configuration file', true);
      }
    } catch (error) {
      console.error('Error importing configuration:', error);
      showNotification('Error importing configuration', true);
    }
  };

  input.click();
}

function showNotification(message, isError = false) {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: ${isError ? '#f44336' : '#4CAF50'};
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    z-index: ${Z_INDEX_MAX};
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    animation: slideIn 0.3s ease-out;
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.3s';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Toggle compact toolbar mode
function toggleCompactMode() {
  toolbarCompact = !toolbarCompact;
  const toolbar = document.getElementById('blur-toolbar');

  if (!toolbar) return;

  if (toolbarCompact) {
    // Hide button text/labels, show only icons
    toolbar.style.gap = '2px';
    toolbar.querySelectorAll('button').forEach(btn => {
      btn.style.minWidth = '28px';
      btn.style.padding = '6px';
    });
    showNotification('Compact mode enabled');
  } else {
    // Restore normal mode
    toolbar.style.gap = '4px';
    toolbar.querySelectorAll('button').forEach(btn => {
      btn.style.minWidth = '32px';
      btn.style.padding = '8px';
    });
    showNotification('Compact mode disabled');
  }
}

// Update active tool visual feedback
function setActiveTool(toolName) {
  // Clear all active states - restore original button styles
  document.querySelectorAll('#blur-toolbar button').forEach(btn => {
    btn.style.background = 'rgba(0, 0, 0, 0.02)';
    btn.style.color = '#374151';
    btn.style.boxShadow = 'none';
  });

  // Set new active tool
  activeToolMode = toolName;

  if (toolName && document.getElementById(toolName)) {
    const activeBtn = document.getElementById(toolName);
    activeBtn.style.background = '#667eea';
    activeBtn.style.color = 'white';
    activeBtn.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.4)';
  }

  // Update status indicator
  updateStatusIndicator();
}

// Update status indicator
function updateStatusIndicator() {
  let statusText = 'Ready';
  let statusColor = '#6b7280';

  if (isSelecting) {
    if (multiSelectElements.length > 0) {
      statusText = `Multi-select: ${multiSelectElements.length} selected (Hold Shift to add more)`;
      statusColor = '#4CAF50';
    } else {
      statusText = 'Click element to blur/highlight (Hold Shift for multi-select)';
      statusColor = '#667eea';
    }
  } else if (isDrawing) {
    statusText = 'Drag to draw region';
    statusColor = '#667eea';
  } else if (isSelectingText) {
    statusText = 'Select text to blur/highlight';
    statusColor = '#667eea';
  } else if (isHighlightMode) {
    statusText = 'Highlight Mode';
    statusColor = '#f59e0b';
  } else {
    statusText = 'Blur Mode';
    statusColor = '#3b82f6';
  }

  const statusIndicator = document.getElementById('toolbar-status');
  if (statusIndicator) {
    statusIndicator.textContent = statusText;
    statusIndicator.style.color = statusColor;
  }
}

// Quick select common elements
async function quickSelectElements(selector, description) {
  const elements = document.querySelectorAll(selector);
  let count = 0;

  elements.forEach(el => {
    if (!el.closest('#blur-toolbar-container')) {
      if (isHighlightMode) {
        el.classList.add('highlighted');
        trackBlurAction(el, 'highlighted');
      } else {
        el.classList.add('blurred');
        trackBlurAction(el, 'blurred');
      }
      count++;
    }
  });

  showNotification(`${isHighlightMode ? 'Highlighted' : 'Blurred'} ${count} ${description}`);

  // Auto-save if Keep Blur is enabled
  await autoSaveIfKeepBlurEnabled();
}

// ===== CUSTOM PRESETS MANAGEMENT =====

// Load custom presets from storage
async function loadCustomPresets() {
  try {
    const result = await chrome.storage.local.get(['customPresets']);
    customPresets = result.customPresets || [];
    return customPresets;
  } catch (error) {
    console.error('Error loading custom presets:', error);
    return [];
  }
}

// Save custom presets to storage
async function saveCustomPresets() {
  try {
    // Check storage quota before saving
    const quotaCheck = await checkStorageQuota();
    if (!quotaCheck.allowed) {
      showNotification('Cannot save preset: Storage is full. Delete old presets first.', true);
      return false;
    }

    await chrome.storage.local.set({ customPresets });
    return true;
  } catch (error) {
    console.error('Error saving custom presets:', error);
    return false;
  }
}

// Show presets manager modal
function showPresetsManager() {
  // Remove existing modal if any
  const existing = document.getElementById('blur-presets-manager');
  if (existing) {
    existing.remove();
    return;
  }

  const modal = document.createElement('div');
  modal.id = 'blur-presets-manager';
  modal.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 16px;
    padding: 2px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    z-index: ${Z_INDEX_MAX};
    min-width: 450px;
    max-width: 600px;
    max-height: 80vh;
    overflow: hidden;
  `;

  const content = document.createElement('div');
  content.style.cssText = `
    background: white;
    border-radius: 14px;
    padding: 24px;
    max-height: calc(80vh - 4px);
    overflow-y: auto;
  `;

  const header = document.createElement('div');
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  `;

  const title = document.createElement('h2');
  title.textContent = '✨ Blur Presets Manager';
  title.style.cssText = `
    margin: 0;
    font-size: 24px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  `;

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.style.cssText = `
    border: none;
    background: rgba(0,0,0,0.05);
    width: 32px;
    height: 32px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 24px;
    line-height: 1;
    color: #666;
  `;
  closeBtn.addEventListener('click', () => modal.remove());

  header.appendChild(title);
  header.appendChild(closeBtn);

  // Default presets section
  const defaultSection = document.createElement('div');
  defaultSection.style.cssText = `margin-bottom: 24px;`;

  const defaultTitle = document.createElement('h3');
  defaultTitle.textContent = 'Default Presets';
  defaultTitle.style.cssText = `
    font-size: 14px;
    font-weight: 600;
    color: #666;
    margin: 0 0 12px 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  `;

  const defaultPresetsContainer = document.createElement('div');
  defaultPresetsContainer.style.cssText = `
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  `;

  const defaultPresets = [
    { name: 'Light', value: BLUR_PRESETS.light, desc: '3px' },
    { name: 'Medium', value: BLUR_PRESETS.medium, desc: '8px' },
    { name: 'Heavy', value: BLUR_PRESETS.heavy, desc: '15px' }
  ];

  defaultPresets.forEach(preset => {
    const btn = createPresetButton(preset.name, preset.value, preset.desc, false);
    defaultPresetsContainer.appendChild(btn);
  });

  defaultSection.appendChild(defaultTitle);
  defaultSection.appendChild(defaultPresetsContainer);

  // Custom presets section
  const customSection = document.createElement('div');
  customSection.style.cssText = `margin-bottom: 24px;`;

  const customTitle = document.createElement('h3');
  customTitle.textContent = `Custom Presets (${customPresets.length})`;
  customTitle.style.cssText = `
    font-size: 14px;
    font-weight: 600;
    color: #666;
    margin: 0 0 12px 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  `;

  const customPresetsContainer = document.createElement('div');
  customPresetsContainer.id = 'custom-presets-container';
  customPresetsContainer.style.cssText = `
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 8px;
    margin-bottom: 12px;
  `;

  renderCustomPresets(customPresetsContainer);

  // Show current blur state info
  const currentState = serializeBlurState();
  const blurredCount = currentState.blurred?.length || 0;
  const highlightedCount = currentState.highlighted?.length || 0;
  const regionsCount = (currentState.regions?.length || 0) + (currentState.highlightRegions?.length || 0);

  const currentStateInfo = document.createElement('div');
  currentStateInfo.style.cssText = `
    padding: 12px;
    background: linear-gradient(135deg, rgba(34, 197, 94, 0.05), rgba(22, 163, 74, 0.05));
    border: 1px solid rgba(34, 197, 94, 0.2);
    border-radius: 8px;
    margin-bottom: 12px;
    font-size: 13px;
    color: #065f46;
  `;

  const hasContent = blurredCount > 0 || highlightedCount > 0 || regionsCount > 0;

  if (hasContent) {
    currentStateInfo.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 6px;">📊 Current Blur State:</div>
      <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        ${blurredCount > 0 ? `<span>🌫️ ${blurredCount} blurred</span>` : ''}
        ${highlightedCount > 0 ? `<span>🖍️ ${highlightedCount} highlighted</span>` : ''}
        ${regionsCount > 0 ? `<span>▢ ${regionsCount} regions</span>` : ''}
      </div>
    `;
  } else {
    currentStateInfo.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 4px;">ℹ️ No blur state yet</div>
      <div style="font-size: 12px; opacity: 0.8;">Blur some elements first, then save as a preset!</div>
    `;
  }

  const createBtn = document.createElement('button');
  createBtn.textContent = hasContent ? '+ Save Current State as Preset' : '+ Create New Preset';
  createBtn.disabled = !hasContent;
  createBtn.style.cssText = `
    width: 100%;
    padding: 12px;
    border: 2px dashed #667eea;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.05));
    border-radius: 8px;
    cursor: ${hasContent ? 'pointer' : 'not-allowed'};
    color: ${hasContent ? '#667eea' : '#9ca3af'};
    font-weight: 600;
    font-size: 14px;
    opacity: ${hasContent ? '1' : '0.5'};
  `;

  if (hasContent) {
    createBtn.addEventListener('mouseover', () => {
      createBtn.style.background = 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))';
    });
    createBtn.addEventListener('mouseout', () => {
      createBtn.style.background = 'linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.05))';
    });
    createBtn.addEventListener('click', () => createNewPreset());
  }

  customSection.appendChild(customTitle);
  customSection.appendChild(customPresetsContainer);
  customSection.appendChild(currentStateInfo);
  customSection.appendChild(createBtn);

  // Action buttons
  const actions = document.createElement('div');
  actions.style.cssText = `
    display: flex;
    gap: 8px;
    padding-top: 16px;
    border-top: 1px solid rgba(0,0,0,0.1);
  `;

  const exportBtn = document.createElement('button');
  exportBtn.textContent = '📤 Export Presets';
  exportBtn.style.cssText = `
    flex: 1;
    padding: 10px;
    border: none;
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    font-size: 14px;
  `;
  exportBtn.addEventListener('click', exportAllPresets);

  const importBtn = document.createElement('button');
  importBtn.textContent = '📥 Import Presets';
  importBtn.style.cssText = `
    flex: 1;
    padding: 10px;
    border: 1px solid #667eea;
    background: white;
    color: #667eea;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    font-size: 14px;
  `;
  importBtn.addEventListener('click', importPresetsFile);

  actions.appendChild(exportBtn);
  actions.appendChild(importBtn);

  content.appendChild(header);
  content.appendChild(defaultSection);
  content.appendChild(customSection);
  content.appendChild(actions);
  modal.appendChild(content);
  document.body.appendChild(modal);

  // Load custom presets
  loadCustomPresets().then(() => {
    renderCustomPresets(customPresetsContainer);
    customTitle.textContent = `Custom Presets (${customPresets.length})`;
  }).catch((error) => {
    console.error('[Blurt-ool] Error loading custom presets:', error);
    showNotification('Failed to load custom presets', true);
  });
}

// Create preset button
function createPresetButton(name, valueOrPreset, desc, isCustom) {
  const btn = document.createElement('div');
  btn.style.cssText = `
    padding: 12px;
    border: 1px solid rgba(0,0,0,0.1);
    background: white;
    border-radius: 8px;
    cursor: pointer;
    text-align: ${isCustom ? 'left' : 'center'};
    transition: all 0.2s ease;
    position: relative;
  `;

  const nameEl = document.createElement('div');
  nameEl.textContent = name;
  nameEl.style.cssText = `
    font-weight: 600;
    font-size: 14px;
    color: #1f2937;
    margin-bottom: 4px;
  `;

  btn.appendChild(nameEl);

  if (isCustom && typeof valueOrPreset === 'object') {
    // New custom preset with full blur state
    const preset = valueOrPreset;
    const blurredCount = preset.state?.blurred?.length || 0;
    const highlightedCount = preset.state?.highlighted?.length || 0;
    const regionsCount = (preset.state?.regions?.length || 0) + (preset.state?.highlightRegions?.length || 0);

    if (preset.description) {
      const descEl = document.createElement('div');
      descEl.textContent = preset.description;
      descEl.style.cssText = `
        font-size: 11px;
        color: #9ca3af;
        margin-bottom: 6px;
        font-style: italic;
      `;
      btn.appendChild(descEl);
    }

    const infoEl = document.createElement('div');
    infoEl.style.cssText = `
      font-size: 11px;
      color: #6b7280;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 6px;
    `;

    const infoParts = [];
    if (blurredCount > 0) infoParts.push(`🌫️ ${blurredCount}`);
    if (highlightedCount > 0) infoParts.push(`🖍️ ${highlightedCount}`);
    if (regionsCount > 0) infoParts.push(`▢ ${regionsCount}`);
    if (preset.domain) infoParts.push(`🌐 ${preset.domain}`);

    infoEl.textContent = infoParts.join(' · ');
    btn.appendChild(infoEl);

    const actions = document.createElement('div');
    actions.style.cssText = `
      display: flex;
      gap: 4px;
      padding-top: 8px;
      border-top: 1px solid rgba(0,0,0,0.05);
    `;

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '🗑️ Delete';
    deleteBtn.title = 'Delete preset';
    deleteBtn.style.cssText = `
      flex: 1;
      border: none;
      background: rgba(239, 68, 68, 0.1);
      padding: 6px 8px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 11px;
      color: #dc2626;
      font-weight: 500;
    `;
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deletePreset(preset.id);
    });

    actions.appendChild(deleteBtn);
    btn.appendChild(actions);
  } else {
    // Default preset (just intensity value)
    const valueEl = document.createElement('div');
    valueEl.textContent = desc || `${valueOrPreset}px`;
    valueEl.style.cssText = `
      font-size: 12px;
      color: #6b7280;
    `;
    btn.appendChild(valueEl);
  }

  btn.addEventListener('mouseover', () => {
    btn.style.background = 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.05))';
    btn.style.borderColor = '#667eea';
    btn.style.transform = 'translateY(-2px)';
  });
  btn.addEventListener('mouseout', () => {
    btn.style.background = 'white';
    btn.style.borderColor = 'rgba(0,0,0,0.1)';
    btn.style.transform = 'translateY(0)';
  });
  btn.addEventListener('click', async () => {
    if (isCustom && typeof valueOrPreset === 'object') {
      // Apply full preset (new custom preset with blur state)
      await applyPreset(valueOrPreset);
    } else {
      // Apply default preset (just blur intensity)
      const value = valueOrPreset;
      blurIntensity = value;
      updateBlurStyle();
      const intensitySlider = document.getElementById('toolbar-blur-intensity');
      if (intensitySlider) intensitySlider.value = blurIntensity;
      showNotification(`✨ Preset applied: ${name} (${value}px)`);
    }
  });

  return btn;
}

// Render custom presets
function renderCustomPresets(container) {
  container.innerHTML = '';
  if (customPresets.length === 0) {
    const emptyMsg = document.createElement('div');
    emptyMsg.textContent = 'No custom presets yet. Create your first one!';
    emptyMsg.style.cssText = `
      padding: 24px;
      text-align: center;
      color: #9ca3af;
      font-size: 14px;
      grid-column: 1 / -1;
    `;
    container.appendChild(emptyMsg);
    return;
  }

  customPresets.forEach(preset => {
    // Pass the full preset object for new-style presets
    const btn = createPresetButton(preset.name, preset, null, true);
    container.appendChild(btn);
  });
}

// Create new preset
async function createNewPreset() {
  const name = prompt('📝 Enter preset name:\n(e.g., "Client Demo", "Privacy Mode", "Screenshot Ready")');
  if (!name || name.trim() === '') return;

  const trimmedName = name.trim();

  // Validate name length
  if (trimmedName.length > 50) {
    showNotification('❌ Preset name too long (max 50 characters)');
    return;
  }

  // Validate name doesn't contain problematic characters
  if (trimmedName.includes('<') || trimmedName.includes('>')) {
    showNotification('❌ Preset name cannot contain < or >');
    return;
  }

  const description = prompt('💭 Enter description (optional):\n(e.g., "Blur sidebar and ads for clean screenshots")') || '';

  // Check if name already exists
  if (customPresets.some(p => p.name === trimmedName)) {
    showNotification('❌ Preset name already exists!');
    return;
  }

  try {
    await saveAsPreset(name, description);
    showNotification(`✅ Preset saved: ${name.trim()}`);

    // Refresh manager if open
    const modal = document.getElementById('blur-presets-manager');
    if (modal) {
      modal.remove();
      showPresetsManager();
    }
  } catch (error) {
    console.error('Error creating preset:', error);
    showNotification('❌ Failed to create preset');
  }
}

// Delete preset
function deletePreset(presetId) {
  const preset = customPresets.find(p => p.id === presetId);
  if (!preset) return;

  if (!confirm(`Delete preset "${preset.name}"?`)) return;

  customPresets = customPresets.filter(p => p.id !== presetId);
  saveCustomPresets().then(() => {
    showNotification(`🗑️ Preset deleted: ${preset.name}`);
    // Refresh manager
    const modal = document.getElementById('blur-presets-manager');
    if (modal) {
      modal.remove();
      showPresetsManager();
    }
  }).catch((error) => {
    console.error('[Blurt-ool] Error deleting preset:', error);
    showNotification('Failed to delete preset', true);
  });
}

// Export all presets
function exportAllPresets() {
  const data = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    customPresets: customPresets
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  a.download = `blur-presets-${dateStr}.json`;
  a.href = url;
  a.click();
  URL.revokeObjectURL(url);

  showNotification(`📤 Exported ${customPresets.length} custom presets`);
}

// Import presets
function importPresetsFile() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (data.customPresets && Array.isArray(data.customPresets)) {
        const imported = data.customPresets;
        let added = 0;
        let skipped = 0;
        let invalid = 0;

        imported.forEach(preset => {
          // Validate preset structure before importing
          if (!preset || typeof preset !== 'object') {
            invalid++;
            return;
          }

          if (!preset.id || !preset.name || !preset.state || !preset.settings) {
            console.warn('[Blurt-ool] Skipping invalid preset (missing required fields):', preset);
            invalid++;
            return;
          }

          // Validate preset name
          if (typeof preset.name !== 'string' || preset.name.length === 0 || preset.name.length > 50) {
            console.warn('[Blurt-ool] Skipping preset with invalid name:', preset.name);
            invalid++;
            return;
          }

          // Check for duplicate by ID to prevent ID collisions
          if (!customPresets.some(p => p.id === preset.id)) {
            customPresets.push(preset);
            added++;
          } else {
            skipped++;
          }
        });

        await saveCustomPresets();

        let message = `📥 Imported ${added} presets`;
        if (skipped > 0) message += `, skipped ${skipped} duplicates`;
        if (invalid > 0) message += `, rejected ${invalid} invalid`;
        showNotification(message);

        // Refresh manager
        const modal = document.getElementById('blur-presets-manager');
        if (modal) {
          modal.remove();
          showPresetsManager();
        }
      } else {
        showNotification('❌ Invalid preset file format');
      }
    } catch (error) {
      console.error('Import error:', error);
      showNotification('❌ Failed to import presets');
    }
  });
  input.click();
}

// ===== END CUSTOM PRESETS MANAGEMENT =====

function setupToolbarEventListeners() {
  const selectBtn = document.getElementById('toolbar-select-element');
  const drawBtn = document.getElementById('toolbar-draw-region');
  const clearBtn = document.getElementById('toolbar-clear-all');
  const undoBtn = document.getElementById('toolbar-undo');
  const redoBtn = document.getElementById('toolbar-redo');
  const intensitySlider = document.getElementById('toolbar-blur-intensity');
  const closeBtn = document.getElementById('toolbar-close');
  const dragHandle = document.getElementById('toolbar-drag-handle');
  const toolbar = document.getElementById('blur-toolbar');
  const modeToggle = document.getElementById('toolbar-mode-toggle');
  const colorPicker = document.getElementById('toolbar-color-picker');
  const saveBtn = document.getElementById('toolbar-save');
  const loadBtn = document.getElementById('toolbar-load');
  const exportBtn = document.getElementById('toolbar-export');
  const importBtn = document.getElementById('toolbar-import');
  const presetsBtn = document.getElementById('toolbar-presets');
  const quickSelectBtn = document.getElementById('toolbar-quick-select');

  // Mode toggle
  if (modeToggle) {
    modeToggle.addEventListener('click', () => {
      isHighlightMode = !isHighlightMode;
      const modeIcon = modeToggle.querySelector('#mode-icon');
      if (modeIcon) {
        // Replace SVG for mode icon
        if (isHighlightMode) {
          modeIcon.innerHTML = `
            <rect x="2" y="12" width="12" height="3" rx="0.5" fill="currentColor" opacity="0.7"/>
            <path d="M14 11L14 3L12 5L10 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          `;
        } else {
          modeIcon.innerHTML = `
            <circle cx="8" cy="8" r="5" stroke="currentColor" stroke-width="1.5" fill="none"/>
            <circle cx="8" cy="8" r="2" fill="currentColor"/>
          `;
        }
      }
      modeToggle.title = isHighlightMode ? 'Switch to Blur Mode' : 'Switch to Highlight Mode';
      if (intensitySlider) {
        intensitySlider.title = isHighlightMode ? 'Highlight Opacity' : 'Blur Intensity';
      }
      const colorPickerContainer = document.querySelector('.color-picker-container');
      if (colorPickerContainer) {
        colorPickerContainer.style.display = isHighlightMode ? 'flex' : 'none';
      }
      updateStatusIndicator();
      showNotification(isHighlightMode ? 'Highlight Mode' : 'Blur Mode');
    });
  }

  // Color picker
  if (colorPicker) {
    colorPicker.addEventListener('input', (e) => {
      highlightColor = e.target.value;
      updateBlurStyle();
      document.querySelectorAll('.highlight-region').forEach(r => {
        r.style.backgroundColor = highlightColor;
      });
    });
  }

  // Select element button
  if (selectBtn) {
    selectBtn.addEventListener('click', async () => {
      try {
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

        isSelecting = true;
        isDrawing = false;
        isSelectingText = false;
        updateBlurStyle(); // Update cursor
        setActiveTool('toolbar-select-element');
      } catch (error) {
        console.error('[Blurt-ool] Error in select element handler:', error);
        showNotification('Error activating element selection', true);
      }
    });
  }

  // Select text button
  const selectTextBtn = document.getElementById('toolbar-select-text');
  if (selectTextBtn) {
    selectTextBtn.addEventListener('click', async () => {
      try {
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

        isSelectingText = true;
        isSelecting = false;
        isDrawing = false;
        originalUserSelect = getComputedStyle(document.body).userSelect;
        document.body.style.userSelect = 'text';
        updateBlurStyle(); // Update cursor
        setActiveTool('toolbar-select-text');
      } catch (error) {
        console.error('[Blurt-ool] Error in select text handler:', error);
        showNotification('Error activating text selection', true);
      }
    });
  }

  // Undo button with DOM existence check
  if (undoBtn) {
    undoBtn.addEventListener('click', async () => {
      try {
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

        while (blurHistory.length > 0) {
          const last = blurHistory.pop();
          if (!last || !last.element) continue;

          // Check if element still exists in DOM
          if (!document.body.contains(last.element)) continue;

          if (last.action === 'blurred') {
            last.element.classList.remove('blurred');
            redoHistory.push(last);
            break;
          } else if (last.action === 'highlighted') {
            last.element.classList.remove('highlighted');
            redoHistory.push(last);
            break;
          } else if (last.action === 'region' || last.action === 'highlight-region') {
            if (last.element.parentNode) {
              last.element.remove();
              redoHistory.push(last);
              break;
            }
          } else if (last.action === 'text-blur' || last.action === 'text-highlight') {
            const span = last.element;
            if (span.parentNode) {
              while (span.firstChild) {
                span.parentNode.insertBefore(span.firstChild, span);
              }
              span.remove();
              redoHistory.push(last);
              break;
            }
          }
        }
      } catch (error) {
        console.error('[Blurt-ool] Error in undo handler:', error);
        showNotification('Error performing undo', true);
      }
    });
  }

  // Redo button
  if (redoBtn) {
    redoBtn.addEventListener('click', async () => {
      try {
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

        if (redoHistory.length > 0) {
          const action = redoHistory.pop();
          if (!action || !action.element) return;

          if (action.action === 'blurred') {
            action.element.classList.add('blurred');
            blurHistory.push(action);
          } else if (action.action === 'highlighted') {
            action.element.classList.add('highlighted');
            blurHistory.push(action);
          } else if (action.action === 'region' || action.action === 'highlight-region') {
            document.body.appendChild(action.element);
            blurHistory.push(action);
          }
        }
      } catch (error) {
        console.error('[Blurt-ool] Error in redo handler:', error);
        showNotification('Error performing redo', true);
      }
    });
  }

  // Draw region button
  if (drawBtn) {
    drawBtn.addEventListener('click', async () => {
      try {
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

        isDrawing = true;
        isSelecting = false;
        isSelectingText = false;
        createOverlay();
        updateBlurStyle(); // Update cursor
        setActiveTool('toolbar-draw-region');
      } catch (error) {
        console.error('[Blurt-ool] Error in draw region handler:', error);
        showNotification('Error activating draw region mode', true);
      }
    });
  }

  // Clear all button
  if (clearBtn) {
    clearBtn.addEventListener('click', async () => {
      try {
        // Clear DOM and also delete saved state (true = clear storage)
        await clearAllBlurs(true);
        blurHistory = [];
        redoHistory = [];
        removeOverlay();
        showNotification('All blur/highlight effects cleared');
      } catch (error) {
        console.error('[Blurt-ool] Error clearing blur effects:', error);
        showNotification('Error clearing blur effects', true);
      }
    });
  }

  // Intensity slider
  if (intensitySlider) {
    intensitySlider.addEventListener('input', (e) => {
      if (isHighlightMode) {
        highlightOpacity = e.target.value / 20;
        updateBlurStyle();
        document.querySelectorAll('.highlight-region').forEach(r => {
          r.style.opacity = highlightOpacity;
        });
      } else {
        blurIntensity = e.target.value;
        updateBlurStyle();
        document.querySelectorAll('.blur-region').forEach(r => {
          r.style.backdropFilter = `blur(${blurIntensity}px)`;
        });
      }
    });
  }

  // Premium button
  const premiumBtn = document.getElementById('toolbar-premium');
  if (premiumBtn) {
    // Check premium status and update button
    window.LicenseManager.isPremium().then(isPrem => {
      if (isPrem) {
        premiumBtn.classList.add('premium-active');
        premiumBtn.title = 'Premium Active - Manage License';
      } else {
        premiumBtn.title = 'Upgrade to Premium';
      }
    }).catch((error) => {
      console.error('[Blurt-ool] Error checking premium status:', error);
      premiumBtn.title = 'Upgrade to Premium';
    });

    premiumBtn.addEventListener('click', () => {
      window.PremiumUI.showPremiumModal();
    });
  }

  // Close button
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      const toolbar = document.getElementById('blur-toolbar-container');
      if (toolbar) toolbar.remove();
      removeOverlay();
    });
  }

  // Save configuration button
  if (saveBtn) {
    saveBtn.addEventListener('click', saveCurrentState);
  }

  // Load configuration button
  if (loadBtn) {
    loadBtn.addEventListener('click', async () => {
      try {
        await loadSavedState();
      } catch (error) {
        console.error('[Blurt-ool] Error in load button handler:', error);
        showNotification('Error loading configuration', true);
      }
    });
  }

  // Export configuration button
  if (exportBtn) {
    exportBtn.addEventListener('click', async () => {
      try {
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

        exportConfiguration();
      } catch (error) {
        console.error('[Blurt-ool] Error in export button handler:', error);
        showNotification('Error exporting configuration', true);
      }
    });
  }

  // Import configuration button
  if (importBtn) {
    importBtn.addEventListener('click', async () => {
      try {
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

        importConfiguration();
      } catch (error) {
        console.error('[Blurt-ool] Error in import button handler:', error);
        showNotification('Error importing configuration', true);
      }
    });
  }

  // Blur presets manager
  if (presetsBtn) {
    presetsBtn.addEventListener('click', async () => {
      try {
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

        showPresetsManager();
      } catch (error) {
        console.error('[Blurt-ool] Error opening presets manager:', error);
        showNotification('Error opening presets manager', true);
      }
    });
  }

  // Quick select menu
  let quickSelectCloseListener = null;

  if (quickSelectBtn) {
    quickSelectBtn.addEventListener('click', async () => {
      try {
        // Check premium access WITHOUT consuming trial (just check)
        const access = await window.LicenseManager.canUsePremiumFeature(false);

        if (!access.allowed) {
          window.PremiumUI.showPremiumModal();
          return;
        }

        // Remove existing menu if any
        const existingMenu = document.getElementById('quick-select-menu');
        if (existingMenu) {
          existingMenu.remove();
        }

        // Clean up previous event listener if any
        if (quickSelectCloseListener) {
          document.removeEventListener('click', quickSelectCloseListener);
          quickSelectCloseListener = null;
        }

      const menu = document.createElement('div');
      menu.id = 'quick-select-menu';
      menu.style.cssText = `
        position: absolute;
        top: 45px;
        right: 20px;
        background: white;
        border: 1px solid rgba(0,0,0,0.1);
        border-radius: 8px;
        padding: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: ${Z_INDEX_MAX};
        min-width: 150px;
      `;

      const quickSelectOptions = [
        { name: 'All Images', selector: 'img', description: 'images' },
        { name: 'All Videos', selector: 'video', description: 'videos' },
        { name: 'All Iframes', selector: 'iframe', description: 'iframes' },
        { name: 'All Sidebars', selector: 'aside, [role="complementary"]', description: 'sidebars' },
        { name: 'Ad Elements', selector: '[id*="ad"], [class*="ad"], [id*="banner"], [class*="banner"]', description: 'ad elements' }
      ];

      quickSelectOptions.forEach(option => {
        const btn = document.createElement('button');
        btn.textContent = option.name;
        btn.style.cssText = `
          display: block;
          width: 100%;
          padding: 8px 12px;
          margin: 4px 0;
          border: none;
          background: rgba(0,0,0,0.02);
          border-radius: 6px;
          cursor: pointer;
          text-align: left;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        btn.addEventListener('mouseover', () => btn.style.background = 'rgba(0,0,0,0.08)');
        btn.addEventListener('mouseout', () => btn.style.background = 'rgba(0,0,0,0.02)');
        btn.addEventListener('click', async () => {
          // Consume trial ONLY when user actually selects an option
          const optionAccess = await window.LicenseManager.canUsePremiumFeature(true);

          if (!optionAccess.allowed) {
            window.PremiumUI.showPremiumModal();
            menu.remove();
            // Clean up listener when menu is removed
            if (quickSelectCloseListener) {
              document.removeEventListener('click', quickSelectCloseListener);
              quickSelectCloseListener = null;
            }
            return;
          }

          // Show trial reminder if using trial
          if (optionAccess.reason === 'trial') {
            showToast(`Trial: ${optionAccess.remainingUses} uses remaining`, 'info');
          }

          await quickSelectElements(option.selector, option.description);
          menu.remove();
          // Clean up listener when menu is removed
          if (quickSelectCloseListener) {
            document.removeEventListener('click', quickSelectCloseListener);
            quickSelectCloseListener = null;
          }
        });
        menu.appendChild(btn);
      });

      document.body.appendChild(menu);

      setTimeout(() => {
        quickSelectCloseListener = (e) => {
          // Check if click is outside menu AND not on the quick select button or its children
          if (!menu.contains(e.target) && !quickSelectBtn.contains(e.target)) {
            menu.remove();
            document.removeEventListener('click', quickSelectCloseListener);
            quickSelectCloseListener = null;
          }
        };
        document.addEventListener('click', quickSelectCloseListener);
      }, 100);
      } catch (error) {
        console.error('[Blurt-ool] Error in quick select handler:', error);
        showNotification('Error showing quick select menu', true);
      }
    });
  }

  // Make toolbar draggable
  if (dragHandle && toolbar) {
    const toolbarContainer = document.getElementById('blur-toolbar-container');
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };

    dragHandle.addEventListener('mousedown', (e) => {
      isDragging = true;
      const rect = toolbarContainer.getBoundingClientRect();
      dragOffset.x = e.clientX - rect.left;
      dragOffset.y = e.clientY - rect.top;
      e.preventDefault();
      e.stopPropagation();
    });

    document.addEventListener('mousemove', (e) => {
      if (isDragging && !isSelecting && !isDrawing) {
        const x = e.clientX - dragOffset.x;
        const y = e.clientY - dragOffset.y;

        const maxX = window.innerWidth - toolbarContainer.offsetWidth;
        const maxY = window.innerHeight - toolbarContainer.offsetHeight;

        toolbarContainer.style.left = Math.max(0, Math.min(x, maxX)) + 'px';
        toolbarContainer.style.top = Math.max(0, Math.min(y, maxY)) + 'px';
        toolbarContainer.style.right = 'auto';
      }
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
  }

  const colorPickerContainer = document.querySelector('.color-picker-container');
  if (colorPickerContainer) {
    colorPickerContainer.style.display = 'none';
  }

  // Initialize status indicator
  updateStatusIndicator();
}

// Keyboard shortcuts
document.addEventListener('keydown', async (event) => {
  // Don't trigger shortcuts if user is typing in an input field (except for inputs in our toolbar)
  const targetIsInput = event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA';
  const targetInToolbar = event.target.closest('#blur-toolbar-container');

  if (targetIsInput && !targetInToolbar) {
    return;
  }

  // Ctrl+Shift+B: Toggle blur mode
  if (event.ctrlKey && event.shiftKey && event.key === 'B') {
    event.preventDefault();
    const modeToggle = document.getElementById('toolbar-mode-toggle');
    if (modeToggle) modeToggle.click();
    return;
  }

  // Ctrl+Shift+E: Quick select element
  if (event.ctrlKey && event.shiftKey && event.key === 'E') {
    event.preventDefault();
    const selectBtn = document.getElementById('toolbar-select-element');
    if (selectBtn) selectBtn.click();
    return;
  }

  // Ctrl+Z: Undo
  if (event.ctrlKey && !event.shiftKey && event.key === 'z') {
    event.preventDefault();
    const undoBtn = document.getElementById('toolbar-undo');
    if (undoBtn) undoBtn.click();
    return;
  }

  // Ctrl+Shift+Z or Ctrl+Y: Redo
  if ((event.ctrlKey && event.shiftKey && event.key === 'Z') || (event.ctrlKey && event.key === 'y')) {
    event.preventDefault();
    const redoBtn = document.getElementById('toolbar-redo');
    if (redoBtn) redoBtn.click();
    return;
  }

  // Ctrl+S: Save configuration
  if (event.ctrlKey && event.key === 's') {
    event.preventDefault();
    saveCurrentState();
    return;
  }

  // Ctrl+O: Load configuration
  if (event.ctrlKey && event.key === 'o') {
    event.preventDefault();
    loadSavedState();
    return;
  }

  // Ctrl+E: Export configuration
  if (event.ctrlKey && event.key === 'e') {
    event.preventDefault();
    exportConfiguration();
    return;
  }

  // Ctrl+A: Select all images (when toolbar is active)
  if (event.ctrlKey && !event.shiftKey && event.key === 'a' && document.getElementById('blur-toolbar-container')) {
    event.preventDefault();
    await quickSelectElements('img', 'images');
    return;
  }

  // Ctrl+Shift+A: Select all videos
  if (event.ctrlKey && event.shiftKey && event.key === 'A') {
    event.preventDefault();
    await quickSelectElements('video', 'videos');
    return;
  }

  // Delete: Clear all
  if (event.key === 'Delete' && document.getElementById('blur-toolbar-container')) {
    const clearBtn = document.getElementById('toolbar-clear-all');
    if (clearBtn) clearBtn.click();
    return;
  }

  // Ctrl+Shift+H: Toggle toolbar visibility
  if (event.ctrlKey && event.shiftKey && event.key === 'H') {
    event.preventDefault();
    const toolbarContainer = document.getElementById('blur-toolbar-container');
    if (toolbarContainer) {
      toolbarVisible = !toolbarVisible;
      toolbarContainer.style.display = toolbarVisible ? 'block' : 'none';
      showNotification(toolbarVisible ? 'Toolbar shown' : 'Toolbar hidden');
    }
    return;
  }

  // Ctrl+Shift+C: Toggle compact mode
  if (event.ctrlKey && event.shiftKey && event.key === 'C') {
    event.preventDefault();
    toggleCompactMode();
    return;
  }

  // Escape: Cancel current mode or close modals
  if (event.key === 'Escape') {
    // Close keyboard shortcuts modal if open
    const modal = document.getElementById('blur-shortcuts-modal');
    const modalOverlay = document.getElementById('blur-shortcuts-overlay');
    if (modal) {
      modal.remove();
      if (modalOverlay) modalOverlay.remove();
      return;
    }

    // Cancel selection modes
    if (isSelecting) {
      exitSelectMode();
    } else if (isDrawing) {
      removeOverlay();
    } else if (isSelectingText) {
      exitTextSelectMode();
    }
  }
});

// Global event handlers
document.addEventListener('mousemove', (event) => {
  if (!isSelecting) return;

  const element = document.elementFromPoint(event.clientX, event.clientY);
  // Exclude toolbar, overlay, and extension UI elements
  if (element &&
      !element.closest('#blur-toolbar-container') &&
      element.id !== 'blur-mode-overlay' &&
      !element.closest('.blur-preset-modal')) {
    highlightElement(element);
  }
});

document.addEventListener('click', async (event) => {
  if (isSelecting) {
    event.preventDefault();
    event.stopPropagation();
    const element = document.elementFromPoint(event.clientX, event.clientY);
    // Exclude toolbar, overlay, and extension UI elements
    if (element &&
        !element.closest('#blur-toolbar-container') &&
        element.id !== 'blur-mode-overlay' &&
        !element.closest('.blur-preset-modal')) {

      // Check if Shift key is held for multi-select
      const isShiftHeld = event.shiftKey;

      if (element.classList.contains('blur-region') || element.classList.contains('highlight-region')) {
        // Track before removing (bug fix)
        trackBlurAction(element, element.classList.contains('blur-region') ? 'region' : 'highlight-region');
        element.remove();
      } else {
        if (isShiftHeld) {
          // Multi-select mode: Add element to selection
          if (!multiSelectElements.includes(element)) {
            multiSelectElements.push(element);
            // Add visual indicator for selected elements
            element.style.outline = '3px dashed #4CAF50';
            element.style.outlineOffset = '2px';
            console.log('[Blurt-ool] Multi-select: Added element. Total selected:', multiSelectElements.length);
            updateStatusIndicator(); // Update status to show selection count
          }
          // Keep selection mode active
          return false;
        } else {
          // Single select or apply multi-select
          const elementsToProcess = multiSelectElements.length > 0 ? [...multiSelectElements, element] : [element];

          // Apply blur/highlight to all selected elements
          elementsToProcess.forEach(el => {
            // Remove selection outline
            if (el.style.outline) {
              el.style.outline = '';
              el.style.outlineOffset = '';
            }

            if (isHighlightMode) {
              el.classList.toggle('highlighted');
              if (el.classList.contains('highlighted')) {
                trackBlurAction(el, 'highlighted');
              }
            } else {
              el.classList.toggle('blurred');
              if (el.classList.contains('blurred')) {
                trackBlurAction(el, 'blurred');
              }
            }
          });

          // Show notification
          if (elementsToProcess.length > 1) {
            showNotification(`${isHighlightMode ? 'Highlighted' : 'Blurred'} ${elementsToProcess.length} elements`);
          }

          // Clear multi-select
          multiSelectElements = [];
          exitSelectMode();
          // Auto-save if Keep Blur is enabled
          await autoSaveIfKeepBlurEnabled();
        }
      }
    }

    // Exit if not holding Shift
    if (!event.shiftKey && multiSelectElements.length === 0) {
      return false;
    }
  }
}, true);

// Draw region handlers with absolute positioning
document.addEventListener('mousedown', (event) => {
  if (isDrawing) {
    startX = event.clientX + window.scrollX;
    startY = event.clientY + window.scrollY;
    region = document.createElement('div');
    region.className = isHighlightMode ? 'highlight-region' : 'blur-region';
    region.style.left = `${startX}px`;
    region.style.top = `${startY}px`;
    document.body.appendChild(region);
  }
});

document.addEventListener('mousemove', (event) => {
  if (region && isDrawing) {
    const currentX = event.clientX + window.scrollX;
    const currentY = event.clientY + window.scrollY;

    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);
    const left = Math.min(currentX, startX);
    const top = Math.min(currentY, startY);

    region.style.width = `${width}px`;
    region.style.height = `${height}px`;
    region.style.left = `${left}px`;
    region.style.top = `${top}px`;
  }
});

document.addEventListener('mouseup', async (event) => {
  if (isDrawing) {
    isDrawing = false;
    if (region) {
      const width = parseInt(region.style.width || '0');
      const height = parseInt(region.style.height || '0');
      if (width > 0 && height > 0) {
        const actionType = region.classList.contains('highlight-region') ? 'highlight-region' : 'region';
        trackBlurAction(region, actionType);
        // Auto-save if Keep Blur is enabled
        await autoSaveIfKeepBlurEnabled();
      } else {
        region.remove();
      }
    }
    removeOverlay();
    region = null;
  }
});

// Text selection handler
document.addEventListener('mouseup', (event) => {
  if (isSelectingText) {
    // Small delay to allow selection to complete
    setTimeout(async () => {
      const selection = window.getSelection();
      if (selection.rangeCount > 0 && !selection.isCollapsed) {
        const range = selection.getRangeAt(0);

        // Don't process if selection is in toolbar
        const container = range.commonAncestorContainer;
        const element = container.nodeType === 3 ? container.parentNode : container;
        if (element.closest('#blur-toolbar-container')) {
          return;
        }

        const span = document.createElement('span');
        span.className = isHighlightMode ? 'highlight-text' : 'blur-text';

        try {
          const contents = range.extractContents();
          span.appendChild(contents);
          range.insertNode(span);

          const actionType = isHighlightMode ? 'text-highlight' : 'text-blur';
          trackBlurAction(span, actionType);

          selection.removeAllRanges();

          // Show notification
          showNotification(`Text ${isHighlightMode ? 'highlighted' : 'blurred'}`);

          // Wait for DOM to settle before auto-saving
          await new Promise(resolve => requestAnimationFrame(resolve));

          // Auto-save if Keep Blur is enabled
          await autoSaveIfKeepBlurEnabled();

          // Exit text selection mode after successful blur
          exitTextSelectMode();
        } catch (error) {
          console.warn('Could not blur selected text:', error);
          showNotification('Could not blur selected text', true);
        }
      }
    }, 10);
  }
});

updateBlurStyle();

// Clear drawn regions on page navigation
// This ensures drawn regions don't persist when navigating to new pages
let lastUrl = location.href;
new MutationObserver(async () => {
  const currentUrl = location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    // URL changed (SPA navigation) - clear all blur effects including drawn regions
    // Only clear the visual effects, not the toolbar
    document.querySelectorAll('.blur-region, .highlight-region').forEach(el => el.remove());
    document.querySelectorAll('.blurred').forEach(el => el.classList.remove('blurred'));
    document.querySelectorAll('.highlighted').forEach(el => el.classList.remove('highlighted'));
    // Unwrap text blurs
    document.querySelectorAll('.blur-text, .highlight-text').forEach(span => {
      if (span.parentNode) {
        while (span.firstChild) {
          span.parentNode.insertBefore(span.firstChild, span);
        }
        span.remove();
      }
    });
    // Reset history
    blurHistory = [];
    redoHistory = [];

    // Auto-load saved configuration for new URL (Keep Blur is always enabled)
    setTimeout(async () => {
      await loadSavedState(false);
    }, 500);
  }
}).observe(document, { subtree: true, childList: true });

// Also clear on full page navigation
window.addEventListener('beforeunload', () => {
  // Clear drawn regions before page unloads
  document.querySelectorAll('.blur-region, .highlight-region').forEach(el => el.remove());
});

/**
 * Show toast notification
 * @param {string} message
 * @param {string} type - 'info', 'success', 'error', 'warning'
 * @param {number} duration - milliseconds
 */
function showToast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `blur-toast blur-toast-${type}`;

  const icons = {
    info: 'bi-info-circle-fill',
    success: 'bi-check-circle-fill',
    error: 'bi-x-circle-fill',
    warning: 'bi-exclamation-triangle-fill'
  };

  toast.innerHTML = `
    <i class="bi ${icons[type]}"></i>
    <span>${message}</span>
  `;

  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .blur-toast {
      position: fixed;
      top: 80px;
      right: 20px;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.98));
      border: 1px solid rgba(226, 232, 240, 0.8);
      border-radius: 12px;
      padding: 12px 18px;
      display: flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
      z-index: ${Z_INDEX_MAX - 1};
      animation: slideInRight 0.3s ease-out;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
    }

    @keyframes slideInRight {
      from {
        opacity: 0;
        transform: translateX(100px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    .blur-toast i {
      font-size: 18px;
    }

    .blur-toast-info {
      color: #2563eb;
      border-left: 4px solid #2563eb;
    }

    .blur-toast-success {
      color: #16a34a;
      border-left: 4px solid #16a34a;
    }

    .blur-toast-error {
      color: #dc2626;
      border-left: 4px solid #dc2626;
    }

    .blur-toast-warning {
      color: #d97706;
      border-left: 4px solid #d97706;
    }
  `;

  toast.appendChild(style);
  document.body.appendChild(toast);

  // Auto remove
  setTimeout(() => {
    toast.style.animation = 'slideInRight 0.3s ease-out reverse';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Listen for messages from the injected script
window.addEventListener('message', async (event) => {
  if (event.source !== window) return;
  if (event.data.type === 'SETUP_TOOLBAR') {
    setupToolbarEventListeners();

    // Note: Auto-load is now handled by Keep Blur initialization
  }
});

// Initialize auto-load - Keep Blur is always enabled
// This runs when the page loads with smart retry logic
(async function initAutoLoad() {
  try {
    let loadAttempted = false;
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 1000; // Retry every 1 second

    // Function to attempt loading state with retry logic
    const attemptLoad = async (isRetry = false) => {
      if (loadAttempted && !isRetry) return;

      try {
        console.log(`[Blurt-ool] Auto-loading saved state (attempt ${retryCount + 1})`);

        const success = await loadSavedState(false); // Don't show "no config" notification

        if (success) {
          loadAttempted = true;
          console.log('[Blurt-ool] Auto-load successful!');

          // Show subtle visual feedback that blur was restored
          const toolbar = document.getElementById('blur-toolbar');
          if (toolbar) {
            toolbar.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.5)';
            setTimeout(() => {
              toolbar.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }, 1000);
          }
        } else if (retryCount < maxRetries && !loadAttempted) {
          // No config found, but let's retry in case page is still loading
          retryCount++;
          console.log(`[Blurt-ool] No config found, retrying in ${retryDelay}ms...`);
          setTimeout(() => attemptLoad(true), retryDelay);
        }
      } catch (error) {
        console.error('[Blurt-ool] Error during auto-load:', error);

        // Retry on error
        if (retryCount < maxRetries && !loadAttempted) {
          retryCount++;
          console.log(`[Blurt-ool] Auto-load failed, retrying in ${retryDelay}ms...`);
          setTimeout(() => attemptLoad(true), retryDelay);
        }
      }
    };

    // Smart detection of when to load
    const scheduleAutoLoad = () => {
      if (document.readyState === 'complete') {
        // Page fully loaded, wait a bit for dynamic content
        setTimeout(() => attemptLoad(), 800);
      } else if (document.readyState === 'interactive') {
        // DOM ready, wait for resources
        window.addEventListener('load', () => {
          setTimeout(() => attemptLoad(), 500);
        }, { once: true });
      } else {
        // Still loading, wait for DOM
        document.addEventListener('DOMContentLoaded', () => {
          setTimeout(() => attemptLoad(), 800);
        }, { once: true });
      }
    };

    // Start the auto-load process
    scheduleAutoLoad();

    // Also watch for dynamic content changes and retry if needed
    // This helps with SPAs and lazy-loaded content
    let dynamicLoadTimeout = null;
    const observer = new MutationObserver(() => {
      if (loadAttempted) {
        observer.disconnect();
        return;
      }

      // Debounce: wait for DOM to stabilize
      if (dynamicLoadTimeout) {
        clearTimeout(dynamicLoadTimeout);
      }

      dynamicLoadTimeout = setTimeout(() => {
        if (!loadAttempted && retryCount < maxRetries) {
          console.log('[Blurt-ool] DOM changed, attempting auto-load...');
          attemptLoad();
        }
      }, 2000);
    });

    // Observe for 10 seconds max
    observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true
    });

    setTimeout(() => {
      observer.disconnect();
    }, 10000);

  } catch (error) {
    console.error('[Blurt-ool] Error initializing auto-load:', error);
  }
})();
