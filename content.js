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
  document.body.style.cursor = 'default';
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
}

function exitSelectMode() {
  document.body.style.cursor = 'default';
  if (lastHighlightedElement) {
    lastHighlightedElement.classList.remove('element-highlight');
    lastHighlightedElement = null;
  }
  isSelecting = false;
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
  style.textContent = `
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
  const data = {
    domain,
    timestamp: new Date().toISOString(),
    state
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `blur-config-${domain}-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);

  showNotification('Configuration exported');
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
      document.body.style.cursor = 'crosshair';
    });
  }

  // Select text button
  const selectTextBtn = document.getElementById('toolbar-select-text');
  if (selectTextBtn) {
    selectTextBtn.addEventListener('click', () => {
      isSelectingText = true;
      isSelecting = false;
      isDrawing = false;
      document.body.style.cursor = 'text';
      originalUserSelect = getComputedStyle(document.body).userSelect;
      document.body.style.userSelect = 'text';
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
}

// Keyboard shortcuts
document.addEventListener('keydown', (event) => {
  // Ctrl+Shift+B: Toggle blur mode
  if (event.ctrlKey && event.shiftKey && event.key === 'B') {
    event.preventDefault();
    const modeToggle = document.getElementById('toolbar-mode-toggle');
    if (modeToggle) modeToggle.click();
  }

  // Ctrl+Shift+E: Quick select element
  if (event.ctrlKey && event.shiftKey && event.key === 'E') {
    event.preventDefault();
    const selectBtn = document.getElementById('toolbar-select-element');
    if (selectBtn) selectBtn.click();
  }

  // Ctrl+Z: Undo
  if (event.ctrlKey && !event.shiftKey && event.key === 'z') {
    event.preventDefault();
    const undoBtn = document.getElementById('toolbar-undo');
    if (undoBtn) undoBtn.click();
  }

  // Ctrl+Shift+Z or Ctrl+Y: Redo
  if ((event.ctrlKey && event.shiftKey && event.key === 'Z') || (event.ctrlKey && event.key === 'y')) {
    event.preventDefault();
    const redoBtn = document.getElementById('toolbar-redo');
    if (redoBtn) redoBtn.click();
  }

  // Ctrl+Shift+H: Toggle toolbar visibility
  if (event.ctrlKey && event.shiftKey && event.key === 'H') {
    event.preventDefault();
    const toolbarContainer = document.getElementById('blur-toolbar-container');
    if (toolbarContainer) {
      toolbarVisible = !toolbarVisible;
      toolbarContainer.style.display = toolbarVisible ? 'block' : 'none';
    }
  }

  // Escape: Cancel current mode
  if (event.key === 'Escape') {
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
