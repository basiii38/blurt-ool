chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: toggleToolbar,
  });
});

function toggleToolbar() {
  // This function runs in the page context
  const toolbarId = 'blur-toolbar-container';
  let toolbarContainer = document.getElementById(toolbarId);

  if (toolbarContainer) {
    toolbarContainer.remove();
    // Also remove overlay if it exists
    const overlay = document.getElementById('blur-mode-overlay');
    if (overlay) overlay.remove();
    document.body.style.cursor = 'default';
  } else {
    // Create toolbar
    toolbarContainer = document.createElement('div');
    toolbarContainer.id = toolbarId;
    toolbarContainer.style.cssText = 'position: fixed !important; top: 20px; right: 20px; z-index: 2147483647 !important; pointer-events: auto !important; filter: none !important;';
    toolbarContainer.innerHTML = `
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
      <div id="blur-toolbar">
        <!-- Drag Handle -->
        <div id="toolbar-drag-handle" title="Drag to move">
          <i class="bi bi-grip-vertical"></i>
        </div>

        <!-- Mode Toggle -->
        <button id="toolbar-mode-toggle" title="Switch Mode" class="mode-btn">
          <i class="bi bi-droplet-fill" id="mode-icon"></i>
        </button>

        <div class="toolbar-separator"></div>

        <!-- Blur Intensity Slider -->
        <div class="slider-container">
          <i class="bi bi-circle"></i>
          <input type="range" id="toolbar-blur-intensity" min="0" max="100" value="8" title="Blur Intensity (0-100px)">
        </div>

        <!-- Color Picker (hidden by default, shown in highlight mode) -->
        <div class="color-picker-container" style="display: none;">
          <input type="color" id="toolbar-color-picker" value="#FFFF00" title="Highlight Color">
        </div>

        <div class="toolbar-separator"></div>

        <!-- Tools Dropdown -->
        <div class="dropdown-container">
          <button class="dropdown-toggle" id="tools-dropdown" title="Tools">
            <i class="bi bi-tools"></i>
            <i class="bi bi-chevron-down dropdown-arrow"></i>
          </button>
          <div class="dropdown-menu" id="tools-menu">
            <button class="dropdown-item" id="toolbar-select-element">
              <i class="bi bi-cursor"></i>
              <span>Select Element</span>
              <span class="shortcut">Ctrl+Shift+E</span>
            </button>
            <button class="dropdown-item" id="toolbar-draw-region">
              <i class="bi bi-bounding-box"></i>
              <span>Draw Region</span>
            </button>
            <button class="dropdown-item" id="toolbar-select-text">
              <i class="bi bi-fonts"></i>
              <span>Select Text</span>
            </button>
            <button class="dropdown-item" id="toolbar-quick-select">
              <i class="bi bi-grid-3x3-gap"></i>
              <span>Quick Select</span>
            </button>
          </div>
        </div>

        <!-- Actions Dropdown -->
        <div class="dropdown-container">
          <button class="dropdown-toggle" id="actions-dropdown" title="Actions">
            <i class="bi bi-lightning-fill"></i>
            <i class="bi bi-chevron-down dropdown-arrow"></i>
          </button>
          <div class="dropdown-menu" id="actions-menu">
            <button class="dropdown-item" id="toolbar-undo">
              <i class="bi bi-arrow-counterclockwise"></i>
              <span>Undo</span>
              <span class="shortcut">Ctrl+Z</span>
            </button>
            <button class="dropdown-item" id="toolbar-redo">
              <i class="bi bi-arrow-clockwise"></i>
              <span>Redo</span>
              <span class="shortcut">Ctrl+Y</span>
            </button>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item" id="toolbar-clear-all">
              <i class="bi bi-trash"></i>
              <span>Clear All</span>
              <span class="shortcut">Delete</span>
            </button>
            <button class="dropdown-item" id="toolbar-screenshot">
              <i class="bi bi-camera"></i>
              <span>Screenshot</span>
            </button>
          </div>
        </div>

        <!-- Manage Dropdown -->
        <div class="dropdown-container">
          <button class="dropdown-toggle" id="manage-dropdown" title="Manage">
            <i class="bi bi-folder"></i>
            <i class="bi bi-chevron-down dropdown-arrow"></i>
          </button>
          <div class="dropdown-menu" id="manage-menu">
            <button class="dropdown-item" id="toolbar-presets">
              <i class="bi bi-stars"></i>
              <span>Presets</span>
            </button>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item" id="toolbar-save">
              <i class="bi bi-floppy"></i>
              <span>Save</span>
              <span class="shortcut">Ctrl+S</span>
            </button>
            <button class="dropdown-item" id="toolbar-load">
              <i class="bi bi-folder2-open"></i>
              <span>Load</span>
              <span class="shortcut">Ctrl+O</span>
            </button>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item" id="toolbar-export">
              <i class="bi bi-download"></i>
              <span>Export</span>
              <span class="shortcut">Ctrl+E</span>
            </button>
            <button class="dropdown-item" id="toolbar-import">
              <i class="bi bi-upload"></i>
              <span>Import</span>
            </button>
          </div>
        </div>

        <div class="toolbar-separator"></div>

        <!-- Help Button -->
        <button id="toolbar-help" title="Help (?)">
          <i class="bi bi-question-circle"></i>
        </button>

        <!-- Close Button -->
        <button id="toolbar-close" title="Close">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>

      <!-- Status Bar -->
      <div id="toolbar-status-bar">
        <span id="toolbar-status">Ready</span>
        <span style="color: #9ca3af; font-size: 11px;">Press ? for help</span>
      </div>
    `;
    document.body.appendChild(toolbarContainer);

    // Add CSS
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css');

      #blur-toolbar-container {
        position: fixed !important;
        z-index: 2147483647 !important;
        pointer-events: auto !important;
        filter: none !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      #blur-toolbar {
        position: relative;
        background: rgba(255, 255, 255, 0.98);
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 12px;
        padding: 8px;
        display: flex;
        gap: 6px;
        align-items: center;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15),
                    0 2px 8px rgba(0, 0, 0, 0.1),
                    inset 0 1px 0 rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(20px);
        user-select: none;
        pointer-events: auto !important;
      }

      #toolbar-drag-handle {
        cursor: move;
        color: #6b7280;
        padding: 6px 4px;
        opacity: 0.6;
        display: flex;
        align-items: center;
        border-radius: 6px;
        transition: all 0.2s;
      }

      #toolbar-drag-handle:hover {
        opacity: 1;
        background: rgba(0, 0, 0, 0.05);
      }

      #blur-toolbar button, #blur-toolbar .dropdown-toggle {
        cursor: pointer;
        padding: 8px 10px;
        border: none;
        border-radius: 8px;
        background: rgba(0, 0, 0, 0.03);
        color: #374151;
        display: flex;
        align-items: center;
        gap: 4px;
        transition: all 0.2s;
        border: 1px solid rgba(0, 0, 0, 0.08);
        font-size: 16px;
      }

      #blur-toolbar button:hover, #blur-toolbar .dropdown-toggle:hover {
        background: rgba(102, 126, 234, 0.1);
        border-color: rgba(102, 126, 234, 0.3);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
      }

      #blur-toolbar button:active, #blur-toolbar .dropdown-toggle:active {
        transform: translateY(0);
      }

      .mode-btn {
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.15), rgba(139, 92, 246, 0.15));
        border-color: rgba(102, 126, 234, 0.3);
        min-width: 40px;
      }

      .mode-btn:hover {
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.25), rgba(139, 92, 246, 0.25));
      }

      .toolbar-separator {
        width: 1px;
        height: 24px;
        background: linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.15) 20%, rgba(0, 0, 0, 0.15) 80%, transparent);
        margin: 0 2px;
      }

      .slider-container {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 8px;
        background: rgba(0, 0, 0, 0.03);
        border-radius: 8px;
        border: 1px solid rgba(0, 0, 0, 0.08);
      }

      .slider-container i {
        color: #6b7280;
        font-size: 14px;
      }

      #toolbar-blur-intensity {
        width: 80px;
        height: 4px;
        appearance: none;
        background: rgba(0, 0, 0, 0.1);
        border-radius: 2px;
        outline: none;
        cursor: pointer;
      }

      #toolbar-blur-intensity::-webkit-slider-thumb {
        appearance: none;
        width: 14px;
        height: 14px;
        background: linear-gradient(135deg, #667eea, #764ba2);
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }

      #toolbar-blur-intensity::-moz-range-thumb {
        width: 14px;
        height: 14px;
        background: linear-gradient(135deg, #667eea, #764ba2);
        border-radius: 50%;
        cursor: pointer;
        border: none;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }

      .color-picker-container {
        display: flex;
        padding: 2px;
        background: rgba(251, 191, 36, 0.1);
        border: 1px solid rgba(251, 191, 36, 0.3);
        border-radius: 8px;
      }

      #toolbar-color-picker {
        width: 32px;
        height: 28px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        background: none;
      }

      #toolbar-color-picker::-webkit-color-swatch-wrapper {
        padding: 0;
      }

      #toolbar-color-picker::-webkit-color-swatch {
        border: 2px solid rgba(255, 255, 255, 0.8);
        border-radius: 6px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      /* Dropdown Styles */
      .dropdown-container {
        position: relative;
      }

      .dropdown-toggle {
        position: relative;
      }

      .dropdown-arrow {
        font-size: 10px;
        margin-left: 2px;
        transition: transform 0.2s;
      }

      .dropdown-container.active .dropdown-arrow {
        transform: rotate(180deg);
      }

      .dropdown-menu {
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        min-width: 200px;
        background: white;
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 10px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
        padding: 6px;
        display: none;
        z-index: 2147483647;
        animation: dropdownFadeIn 0.2s ease;
      }

      @keyframes dropdownFadeIn {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .dropdown-container.active .dropdown-menu {
        display: block;
      }

      .dropdown-item {
        width: 100%;
        padding: 8px 12px;
        border: none;
        background: none;
        text-align: left;
        cursor: pointer;
        border-radius: 6px;
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 14px;
        color: #374151;
        transition: all 0.15s;
      }

      .dropdown-item i {
        font-size: 16px;
        width: 20px;
        text-align: center;
        color: #6b7280;
      }

      .dropdown-item span:first-of-type {
        flex: 1;
      }

      .shortcut {
        font-size: 11px;
        color: #9ca3af;
        font-family: monospace;
        background: rgba(0, 0, 0, 0.05);
        padding: 2px 6px;
        border-radius: 4px;
      }

      .dropdown-item:hover {
        background: rgba(102, 126, 234, 0.1);
        color: #667eea;
      }

      .dropdown-item:hover i {
        color: #667eea;
      }

      .dropdown-divider {
        height: 1px;
        background: rgba(0, 0, 0, 0.08);
        margin: 4px 8px;
      }

      #toolbar-status-bar {
        padding: 8px 12px;
        border-top: 1px solid rgba(0, 0, 0, 0.05);
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 12px;
        background: linear-gradient(to bottom, rgba(0, 0, 0, 0.01), rgba(0, 0, 0, 0.03));
        border-radius: 0 0 12px 12px;
      }

      #toolbar-status {
        color: #6b7280;
        font-weight: 500;
      }
    `;
    document.head.appendChild(style);

    // Setup dropdown handlers
    const setupDropdowns = () => {
      document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
        toggle.addEventListener('click', (e) => {
          e.stopPropagation();
          const container = toggle.closest('.dropdown-container');
          const wasActive = container.classList.contains('active');

          // Close all dropdowns
          document.querySelectorAll('.dropdown-container').forEach(c => c.classList.remove('active'));

          // Toggle this one
          if (!wasActive) {
            container.classList.add('active');
          }
        });
      });

      // Close dropdowns when clicking outside
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.dropdown-container')) {
          document.querySelectorAll('.dropdown-container').forEach(c => c.classList.remove('active'));
        }
      });

      // Close dropdown when clicking menu item
      document.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', () => {
          document.querySelectorAll('.dropdown-container').forEach(c => c.classList.remove('active'));
        });
      });
    };

    setTimeout(setupDropdowns, 100);

    // Send message to content script to set up event listeners
    window.postMessage({ type: 'SETUP_TOOLBAR' }, '*');
  }
}

// Screenshot functionality
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toolbar-screenshot') {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `blur-screenshot-${Date.now()}.png`;
      link.click();
    });
  }
});
