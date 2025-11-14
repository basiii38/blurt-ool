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
      position: fixed;
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
      position: fixed;
      background-color: ${highlightColor};
      opacity: ${highlightOpacity};
      z-index: ${Z_INDEX_REGION};
      pointer-events: auto;
      cursor: pointer;
    }
    .highlight-text {
      background-color: ${highlightColor} !important;
      opacity: ${highlightOpacity} !important;
      border-radius: 2px !important;
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
      pointer-events: auto;
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

function serializeBlurState() {
  const state = {
    blurred: [],
    highlighted: [],
    regions: [],
    highlightRegions: [],
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

  return state;
}

function getElementSelector(element) {
  if (element.id) return `#${element.id}`;
  if (element.className && typeof element.className === 'string') {
    const classes = element.className.split(' ')
      .filter(c => c && !c.startsWith('blur') && !c.startsWith('highlight') && c !== 'element-highlight')
      .join('.');
    if (classes) return `${element.tagName.toLowerCase()}.${classes}`;
  }
  return element.tagName.toLowerCase();
}

async function saveCurrentState() {
  const domain = getCurrentDomain();
  const state = serializeBlurState();

  try {
    const result = await chrome.storage.local.get(['blurConfigs']);
    const configs = result.blurConfigs || {};
    configs[domain] = state;
    await chrome.storage.local.set({ blurConfigs: configs });
    showNotification('Configuration saved for ' + domain);
  } catch (error) {
    console.error('Error saving state:', error);
    showNotification('Error saving configuration', true);
  }
}

async function loadSavedState() {
  const domain = getCurrentDomain();

  try {
    const result = await chrome.storage.local.get(['blurConfigs']);
    const configs = result.blurConfigs || {};
    const state = configs[domain];

    if (state) {
      applySavedState(state);
      return true;
    }
  } catch (error) {
    console.error('Error loading state:', error);
  }
  return false;
}

function applySavedState(state) {
  if (!state) return;

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

  // Apply blurred elements
  state.blurred?.forEach(selector => {
    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => el.classList.add('blurred'));
    } catch (e) {
      console.warn('Invalid selector:', selector);
    }
  });

  // Apply highlighted elements
  state.highlighted?.forEach(selector => {
    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => el.classList.add('highlighted'));
    } catch (e) {
      console.warn('Invalid selector:', selector);
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
  });

  showNotification('Configuration loaded');
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

// Keyboard shortcuts help modal
function showKeyboardShortcuts() {
  // Check if modal already exists
  if (document.getElementById('blur-shortcuts-modal')) {
    document.getElementById('blur-shortcuts-modal').remove();
    return;
  }

  const modal = document.createElement('div');
  modal.id = 'blur-shortcuts-modal';
  modal.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    border-radius: 12px;
    padding: 0;
    z-index: ${Z_INDEX_MAX};
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  const shortcuts = [
    { category: 'Selection Tools', items: [
      { key: 'Ctrl+Shift+E', desc: 'Activate element selection tool' },
      { key: 'Click', desc: 'Select/blur element (when selection tool active)' },
      { key: 'Esc', desc: 'Cancel current selection mode' }
    ]},
    { category: 'Modes & Effects', items: [
      { key: 'Ctrl+Shift+B', desc: 'Toggle Blur/Highlight mode' },
      { key: '1, 2, 3', desc: 'Quick blur presets (Light, Medium, Heavy)' }
    ]},
    { category: 'History', items: [
      { key: 'Ctrl+Z', desc: 'Undo last action' },
      { key: 'Ctrl+Shift+Z', desc: 'Redo last undone action' },
      { key: 'Ctrl+Y', desc: 'Redo (alternative)' }
    ]},
    { category: 'File Operations', items: [
      { key: 'Ctrl+S', desc: 'Save current configuration' },
      { key: 'Ctrl+O', desc: 'Load saved configuration' },
      { key: 'Ctrl+E', desc: 'Export configuration to file' }
    ]},
    { category: 'View', items: [
      { key: 'Ctrl+Shift+H', desc: 'Toggle toolbar visibility' },
      { key: 'Ctrl+Shift+C', desc: 'Toggle compact toolbar mode' },
      { key: '?', desc: 'Show/hide this help (Shift+/)' }
    ]},
    { category: 'Quick Actions', items: [
      { key: 'Delete', desc: 'Clear all blur/highlight effects' },
      { key: 'Ctrl+A', desc: 'Select all images' },
      { key: 'Ctrl+Shift+A', desc: 'Select all videos' }
    ]}
  ];

  let content = `
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 24px; border-radius: 12px 12px 0 0;">
      <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600;">Keyboard Shortcuts</h2>
      <p style="margin: 0; opacity: 0.9; font-size: 14px;">Master Element Blur with these shortcuts</p>
    </div>
    <div style="padding: 24px;">
  `;

  shortcuts.forEach(section => {
    content += `
      <div style="margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #374151;">${section.category}</h3>
        <div style="display: grid; gap: 8px;">
    `;

    section.items.forEach(item => {
      content += `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: #f3f4f6; border-radius: 6px;">
          <span style="color: #6b7280; font-size: 14px;">${item.desc}</span>
          <kbd style="background: white; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-size: 12px; color: #374151; border: 1px solid #d1d5db; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">${item.key}</kbd>
        </div>
      `;
    });

    content += `
        </div>
      </div>
    `;
  });

  content += `
      <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
        <button id="close-shortcuts-modal" style="background: #667eea; color: white; border: none; padding: 10px 24px; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; transition: background 0.2s;">
          Got it! (Press Esc or ?)
        </button>
      </div>
    </div>
  `;

  modal.innerHTML = content;

  // Add overlay
  const overlay = document.createElement('div');
  overlay.id = 'blur-shortcuts-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    z-index: ${Z_INDEX_MAX - 1};
    backdrop-filter: blur(4px);
  `;

  overlay.addEventListener('click', () => {
    modal.remove();
    overlay.remove();
  });

  document.body.appendChild(overlay);
  document.body.appendChild(modal);

  // Close button
  const closeBtn = document.getElementById('close-shortcuts-modal');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.remove();
      overlay.remove();
    });
    closeBtn.addEventListener('mouseover', () => {
      closeBtn.style.background = '#5a67d8';
    });
    closeBtn.addEventListener('mouseout', () => {
      closeBtn.style.background = '#667eea';
    });
  }
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
    statusText = 'Click element to blur/highlight';
    statusColor = '#667eea';
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
function quickSelectElements(selector, description) {
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
}

function setupToolbarEventListeners() {
  // Tab switching logic
  const tabButtons = document.querySelectorAll('.toolbar-tab');
  const tabPanels = document.querySelectorAll('.toolbar-panel');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.dataset.tab;

      // Remove active class from all tabs and panels
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabPanels.forEach(panel => panel.classList.remove('active'));

      // Add active class to clicked tab and corresponding panel
      button.classList.add('active');
      const targetPanel = document.querySelector(`.toolbar-panel[data-panel="${targetTab}"]`);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }
    });
  });

  const selectBtn = document.getElementById('toolbar-select-element');
  const drawBtn = document.getElementById('toolbar-draw-region');
  const clearBtn = document.getElementById('toolbar-clear-all');
  const undoBtn = document.getElementById('toolbar-undo');
  const redoBtn = document.getElementById('toolbar-redo');
  const intensitySlider = document.getElementById('toolbar-blur-intensity');
  const screenshotBtn = document.getElementById('toolbar-screenshot');
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
      modeToggle.textContent = isHighlightMode ? '🖍️' : '🌫️';
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
    selectBtn.addEventListener('click', () => {
      isSelecting = true;
      isDrawing = false;
      isSelectingText = false;
      updateBlurStyle(); // Update cursor
      setActiveTool('toolbar-select-element');
    });
  }

  // Select text button
  const selectTextBtn = document.getElementById('toolbar-select-text');
  if (selectTextBtn) {
    selectTextBtn.addEventListener('click', () => {
      isSelectingText = true;
      isSelecting = false;
      isDrawing = false;
      originalUserSelect = getComputedStyle(document.body).userSelect;
      document.body.style.userSelect = 'text';
      updateBlurStyle(); // Update cursor
      setActiveTool('toolbar-select-text');
    });
  }

  // Undo button with DOM existence check
  if (undoBtn) {
    undoBtn.addEventListener('click', () => {
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
    });
  }

  // Redo button
  if (redoBtn) {
    redoBtn.addEventListener('click', () => {
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
    });
  }

  // Draw region button
  if (drawBtn) {
    drawBtn.addEventListener('click', () => {
      isDrawing = true;
      isSelecting = false;
      isSelectingText = false;
      createOverlay();
      updateBlurStyle(); // Update cursor
      setActiveTool('toolbar-draw-region');
    });
  }

  // Clear all button
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      document.querySelectorAll('.blurred').forEach(el => el.classList.remove('blurred'));
      document.querySelectorAll('.highlighted').forEach(el => el.classList.remove('highlighted'));
      document.querySelectorAll('.blur-region').forEach(el => el.remove());
      document.querySelectorAll('.highlight-region').forEach(el => el.remove());
      document.querySelectorAll('.blur-text').forEach(el => el.classList.remove('blur-text'));
      document.querySelectorAll('.highlight-text').forEach(el => el.classList.remove('highlight-text'));
      blurHistory = [];
      redoHistory = [];
      removeOverlay();
      showNotification('All blur/highlight effects cleared');
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

  // Screenshot button with improved timing
  if (screenshotBtn) {
    screenshotBtn.addEventListener('click', async () => {
      const toolbar = document.getElementById('blur-toolbar-container');
      const overlay = document.getElementById('blur-mode-overlay');

      if (toolbar) toolbar.style.display = 'none';
      if (overlay) overlay.style.display = 'none';

      // Use requestAnimationFrame for better timing
      await new Promise(resolve => requestAnimationFrame(resolve));
      await new Promise(resolve => requestAnimationFrame(resolve));

      try {
        await chrome.runtime.sendMessage({ action: 'toolbar-screenshot' });
      } catch (error) {
        console.error('Screenshot error:', error);
      }

      // Restore UI
      await new Promise(resolve => setTimeout(resolve, 500));
      if (toolbar) toolbar.style.display = 'block';
      if (overlay) overlay.style.display = 'block';
    });
  }

  // Help button
  const helpBtn = document.getElementById('toolbar-help');
  if (helpBtn) {
    helpBtn.addEventListener('click', () => {
      showKeyboardShortcuts();
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
    loadBtn.addEventListener('click', loadSavedState);
  }

  // Export configuration button
  if (exportBtn) {
    exportBtn.addEventListener('click', exportConfiguration);
  }

  // Import configuration button
  if (importBtn) {
    importBtn.addEventListener('click', importConfiguration);
  }

  // Blur presets dropdown
  if (presetsBtn) {
    presetsBtn.addEventListener('click', () => {
      const menu = document.createElement('div');
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

      const presetOptions = [
        { name: 'Light Blur', value: BLUR_PRESETS.light },
        { name: 'Medium Blur', value: BLUR_PRESETS.medium },
        { name: 'Heavy Blur', value: BLUR_PRESETS.heavy }
      ];

      presetOptions.forEach(preset => {
        const btn = document.createElement('button');
        btn.textContent = preset.name;
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
        btn.addEventListener('click', () => {
          blurIntensity = preset.value;
          updateBlurStyle();
          if (intensitySlider) intensitySlider.value = blurIntensity;
          menu.remove();
          showNotification(`Preset applied: ${preset.name}`);
        });
        menu.appendChild(btn);
      });

      document.body.appendChild(menu);

      setTimeout(() => {
        const closeMenu = (e) => {
          if (!menu.contains(e.target) && e.target !== presetsBtn) {
            menu.remove();
            document.removeEventListener('click', closeMenu);
          }
        };
        document.addEventListener('click', closeMenu);
      }, 100);
    });
  }

  // Quick select menu
  if (quickSelectBtn) {
    quickSelectBtn.addEventListener('click', () => {
      const menu = document.createElement('div');
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
        btn.addEventListener('click', () => {
          quickSelectElements(option.selector, option.description);
          menu.remove();
        });
        menu.appendChild(btn);
      });

      document.body.appendChild(menu);

      setTimeout(() => {
        const closeMenu = (e) => {
          if (!menu.contains(e.target) && e.target !== quickSelectBtn) {
            menu.remove();
            document.removeEventListener('click', closeMenu);
          }
        };
        document.addEventListener('click', closeMenu);
      }, 100);
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
document.addEventListener('keydown', (event) => {
  // Don't trigger shortcuts if user is typing in an input field (except for inputs in our toolbar)
  const targetIsInput = event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA';
  const targetInToolbar = event.target.closest('#blur-toolbar-container');

  if (targetIsInput && !targetInToolbar) {
    return;
  }

  // ?: Show keyboard shortcuts help (Shift + /)
  if ((event.shiftKey && event.key === '?') || (event.shiftKey && event.key === '/')) {
    event.preventDefault();
    event.stopPropagation();
    showKeyboardShortcuts();
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
    quickSelectElements('img', 'images');
    return;
  }

  // Ctrl+Shift+A: Select all videos
  if (event.ctrlKey && event.shiftKey && event.key === 'A') {
    event.preventDefault();
    quickSelectElements('video', 'videos');
    return;
  }

  // 1, 2, 3: Quick blur presets
  if (!event.ctrlKey && !event.shiftKey && event.key >= '1' && event.key <= '3') {
    const presets = [BLUR_PRESETS.light, BLUR_PRESETS.medium, BLUR_PRESETS.heavy];
    const presetNames = ['Light', 'Medium', 'Heavy'];
    const index = parseInt(event.key) - 1;

    blurIntensity = presets[index];
    updateBlurStyle();

    const intensitySlider = document.getElementById('toolbar-blur-intensity');
    if (intensitySlider) intensitySlider.value = blurIntensity;

    showNotification(`${presetNames[index]} blur preset applied`);
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
    } else if (isDrawing || isSelectingText) {
      removeOverlay();
    }
  }
});

// Global event handlers
document.addEventListener('mousemove', (event) => {
  if (!isSelecting) return;

  const element = document.elementFromPoint(event.clientX, event.clientY);
  if (element && !element.closest('#blur-toolbar-container')) {
    highlightElement(element);
  }
});

document.addEventListener('click', (event) => {
  if (isSelecting) {
    event.preventDefault();
    event.stopPropagation();
    const element = document.elementFromPoint(event.clientX, event.clientY);
    if (element && !element.closest('#blur-toolbar-container')) {
      if (element.classList.contains('blur-region') || element.classList.contains('highlight-region')) {
        // Track before removing (bug fix)
        trackBlurAction(element, element.classList.contains('blur-region') ? 'region' : 'highlight-region');
        element.remove();
      } else {
        if (isHighlightMode) {
          element.classList.toggle('highlighted');
          if (element.classList.contains('highlighted')) {
            trackBlurAction(element, 'highlighted');
          }
        } else {
          element.classList.toggle('blurred');
          if (element.classList.contains('blurred')) {
            trackBlurAction(element, 'blurred');
          }
        }
      }
    }
    exitSelectMode();
    return false;
  }
}, true);

// Draw region handlers with fixed positioning
document.addEventListener('mousedown', (event) => {
  if (isDrawing) {
    startX = event.clientX + window.scrollX;
    startY = event.clientY + window.scrollY;
    region = document.createElement('div');
    region.className = isHighlightMode ? 'highlight-region' : 'blur-region';
    region.style.left = `${event.clientX}px`;
    region.style.top = `${event.clientY}px`;
    document.body.appendChild(region);
  }
});

document.addEventListener('mousemove', (event) => {
  if (region && isDrawing) {
    const currentX = event.clientX;
    const currentY = event.clientY;
    const initialX = startX - window.scrollX;
    const initialY = startY - window.scrollY;

    const width = Math.abs(currentX - initialX);
    const height = Math.abs(currentY - initialY);
    const left = Math.min(currentX, initialX);
    const top = Math.min(currentY, initialY);

    region.style.width = `${width}px`;
    region.style.height = `${height}px`;
    region.style.left = `${left}px`;
    region.style.top = `${top}px`;
  }
});

document.addEventListener('mouseup', (event) => {
  if (isDrawing) {
    isDrawing = false;
    if (region) {
      const width = parseInt(region.style.width || '0');
      const height = parseInt(region.style.height || '0');
      if (width > 0 && height > 0) {
        const actionType = region.classList.contains('highlight-region') ? 'highlight-region' : 'region';
        trackBlurAction(region, actionType);
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
    const selection = window.getSelection();
    if (selection.rangeCount > 0 && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);

      const span = document.createElement('span');
      span.className = isHighlightMode ? 'highlight-text' : 'blur-text';

      try {
        const contents = range.extractContents();
        span.appendChild(contents);
        range.insertNode(span);

        const actionType = isHighlightMode ? 'text-highlight' : 'text-blur';
        trackBlurAction(span, actionType);

        selection.removeAllRanges();
        isSelectingText = false;
        document.body.style.cursor = 'default';
        if (originalUserSelect !== '') {
          document.body.style.userSelect = originalUserSelect;
          originalUserSelect = '';
        }
      } catch (error) {
        console.warn('Could not blur selected text:', error);
      }
    }
  }
});

updateBlurStyle();

// Listen for messages from the injected script
window.addEventListener('message', async (event) => {
  if (event.source !== window) return;
  if (event.data.type === 'SETUP_TOOLBAR') {
    setupToolbarEventListeners();

    // Auto-load saved configuration for this domain
    setTimeout(() => {
      loadSavedState();
    }, 500);
  }
});
