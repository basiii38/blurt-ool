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
          <input type="range" id="toolbar-blur-intensity" min="0" max="100" value="8" title="Blur Intensity">
        </div>

        <!-- Color Picker -->
        <div class="color-picker-container" style="display: none;">
          <input type="color" id="toolbar-color-picker" value="#FFFF00" title="Highlight Color">
        </div>

        <div class="toolbar-separator"></div>

        <!-- Tool Buttons (Flattened) -->
        <button id="toolbar-select-element" title="Select Element (Ctrl+Shift+E)">
          <i class="bi bi-cursor"></i>
        </button>

        <button id="toolbar-draw-region" title="Draw Region">
          <i class="bi bi-bounding-box"></i>
        </button>

        <button id="toolbar-select-text" title="Select Text">
          <i class="bi bi-fonts"></i>
        </button>

        <button id="toolbar-quick-select" title="Quick Select">
          <i class="bi bi-grid-3x3-gap"></i>
        </button>

        <div class="toolbar-separator"></div>

        <!-- Action Buttons (Flattened) -->
        <button id="toolbar-undo" title="Undo (Ctrl+Z)">
          <i class="bi bi-arrow-counterclockwise"></i>
        </button>

        <button id="toolbar-redo" title="Redo (Ctrl+Y)">
          <i class="bi bi-arrow-clockwise"></i>
        </button>

        <!-- Clear All - Prominent -->
        <button id="toolbar-clear-all" title="Clear All (Delete)" class="clear-btn">
          <i class="bi bi-trash"></i>
        </button>

        <button id="toolbar-screenshot" title="Screenshot">
          <i class="bi bi-camera"></i>
        </button>

        <div class="toolbar-separator"></div>

        <!-- Manage Dropdown (Keep for file operations) -->
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
            </button>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item" id="toolbar-export">
              <i class="bi bi-download"></i>
              <span>Export</span>
            </button>
            <button class="dropdown-item" id="toolbar-import">
              <i class="bi bi-upload"></i>
              <span>Import</span>
            </button>
          </div>
        </div>

        <!-- Help and Close -->
        <button id="toolbar-help" title="Help">
          <i class="bi bi-question-circle"></i>
        </button>

        <button id="toolbar-close" title="Close">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
    `;
    document.body.appendChild(toolbarContainer);

    // Add CSS
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css');

      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }

      #blur-toolbar-container {
        position: fixed !important;
        z-index: 2147483647 !important;
        pointer-events: auto !important;
        filter: none !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif;
        animation: slideIn 0.3s ease-out;
      }

      #blur-toolbar {
        position: relative;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%);
        border: 1px solid rgba(226, 232, 240, 0.8);
        border-radius: 12px;
        padding: 6px;
        display: flex;
        gap: 4px;
        align-items: center;
        box-shadow:
          0 10px 30px -10px rgba(0, 0, 0, 0.15),
          0 5px 15px -5px rgba(0, 0, 0, 0.1),
          inset 0 1px 0 rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(40px) saturate(180%);
        user-select: none;
        pointer-events: auto !important;
      }

      #toolbar-drag-handle {
        cursor: move;
        color: #94a3b8;
        padding: 6px 4px;
        opacity: 0.7;
        display: flex;
        align-items: center;
        border-radius: 6px;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        font-size: 12px;
      }

      #toolbar-drag-handle:hover {
        opacity: 1;
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(139, 92, 246, 0.08));
        color: #6366f1;
        transform: scale(1.05);
      }

      #blur-toolbar button, #blur-toolbar .dropdown-toggle {
        cursor: pointer;
        padding: 6px 8px;
        border: none;
        border-radius: 8px;
        background: linear-gradient(135deg, rgba(241, 245, 249, 0.8), rgba(248, 250, 252, 0.8));
        color: #475569;
        display: flex;
        align-items: center;
        gap: 4px;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        border: 1px solid rgba(203, 213, 225, 0.4);
        font-size: 14px;
        position: relative;
        overflow: hidden;
        font-weight: 500;
      }

      #blur-toolbar button::before, #blur-toolbar .dropdown-toggle::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1));
        opacity: 0;
        transition: opacity 0.3s;
      }

      #blur-toolbar button:hover, #blur-toolbar .dropdown-toggle:hover {
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(139, 92, 246, 0.12));
        border-color: rgba(99, 102, 241, 0.3);
        transform: translateY(-2px);
        box-shadow:
          0 8px 16px -4px rgba(99, 102, 241, 0.2),
          0 4px 8px -2px rgba(99, 102, 241, 0.1);
        color: #6366f1;
      }

      #blur-toolbar button:hover::before, #blur-toolbar .dropdown-toggle:hover::before {
        opacity: 1;
      }

      #blur-toolbar button:active, #blur-toolbar .dropdown-toggle:active {
        transform: translateY(0) scale(0.98);
        box-shadow:
          0 4px 8px -2px rgba(99, 102, 241, 0.15),
          0 2px 4px -1px rgba(99, 102, 241, 0.08);
      }

      #blur-toolbar button i, #blur-toolbar .dropdown-toggle i {
        transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      }

      #blur-toolbar button:hover i, #blur-toolbar .dropdown-toggle:hover i {
        transform: scale(1.1);
      }

      .mode-btn {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
        border-color: rgba(102, 126, 234, 0.4) !important;
        min-width: 36px;
        color: white !important;
        box-shadow:
          0 3px 9px rgba(102, 126, 234, 0.3),
          inset 0 1px 0 rgba(255, 255, 255, 0.2);
      }

      .mode-btn::before {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05)) !important;
      }

      .mode-btn:hover {
        background: linear-gradient(135deg, #7c8ff5 0%, #8b5bbb 100%) !important;
        box-shadow:
          0 8px 20px rgba(102, 126, 234, 0.4),
          0 4px 10px rgba(102, 126, 234, 0.2),
          inset 0 1px 0 rgba(255, 255, 255, 0.3);
        transform: translateY(-2px) scale(1.02);
      }

      .mode-btn i {
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
      }

      .clear-btn {
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.1)) !important;
        border-color: rgba(239, 68, 68, 0.3) !important;
        color: #dc2626 !important;
      }

      .clear-btn::before {
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.15)) !important;
      }

      .clear-btn:hover {
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.15)) !important;
        border-color: rgba(239, 68, 68, 0.5) !important;
        color: #ef4444 !important;
        box-shadow:
          0 6px 12px -4px rgba(239, 68, 68, 0.3),
          0 3px 6px -2px rgba(239, 68, 68, 0.2) !important;
      }

      .toolbar-separator {
        width: 1px;
        height: 22px;
        background: linear-gradient(
          to bottom,
          transparent 0%,
          rgba(203, 213, 225, 0.4) 15%,
          rgba(148, 163, 184, 0.5) 50%,
          rgba(203, 213, 225, 0.4) 85%,
          transparent 100%
        );
        margin: 0 3px;
        border-radius: 1px;
      }

      .slider-container {
        display: flex;
        align-items: center;
        gap: 5px;
        padding: 4px 8px;
        background: linear-gradient(135deg, rgba(241, 245, 249, 0.9), rgba(248, 250, 252, 0.9));
        border-radius: 8px;
        border: 1px solid rgba(203, 213, 225, 0.5);
        transition: all 0.2s;
      }

      .slider-container:hover {
        border-color: rgba(99, 102, 241, 0.3);
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(139, 92, 246, 0.05));
        box-shadow: 0 3px 8px rgba(99, 102, 241, 0.1);
      }

      .slider-container i {
        color: #6366f1;
        font-size: 12px;
        opacity: 0.8;
      }

      #toolbar-blur-intensity {
        width: 70px;
        height: 4px;
        appearance: none;
        background: linear-gradient(to right,
          rgba(99, 102, 241, 0.15) 0%,
          rgba(139, 92, 246, 0.25) 100%);
        border-radius: 8px;
        outline: none;
        cursor: pointer;
        position: relative;
      }

      #toolbar-blur-intensity::-webkit-slider-thumb {
        appearance: none;
        width: 14px;
        height: 14px;
        background: linear-gradient(135deg, #667eea, #764ba2);
        border-radius: 50%;
        cursor: pointer;
        box-shadow:
          0 2px 6px rgba(102, 126, 234, 0.4),
          0 1px 3px rgba(102, 126, 234, 0.3),
          inset 0 1px 0 rgba(255, 255, 255, 0.3);
        transition: transform 0.15s;
      }

      #toolbar-blur-intensity::-webkit-slider-thumb:hover {
        transform: scale(1.1);
        box-shadow:
          0 3px 9px rgba(102, 126, 234, 0.5),
          0 2px 5px rgba(102, 126, 234, 0.4),
          inset 0 1px 0 rgba(255, 255, 255, 0.4);
      }

      #toolbar-blur-intensity::-moz-range-thumb {
        width: 14px;
        height: 14px;
        background: linear-gradient(135deg, #667eea, #764ba2);
        border-radius: 50%;
        cursor: pointer;
        border: none;
        box-shadow:
          0 2px 6px rgba(102, 126, 234, 0.4),
          0 1px 3px rgba(102, 126, 234, 0.3),
          inset 0 1px 0 rgba(255, 255, 255, 0.3);
        transition: transform 0.15s;
      }

      #toolbar-blur-intensity::-moz-range-thumb:hover {
        transform: scale(1.1);
      }

      .color-picker-container {
        display: flex;
        padding: 3px;
        background: linear-gradient(135deg, rgba(251, 191, 36, 0.12), rgba(245, 158, 11, 0.12));
        border: 1px solid rgba(251, 191, 36, 0.4);
        border-radius: 8px;
        transition: all 0.2s;
      }

      .color-picker-container:hover {
        box-shadow: 0 3px 8px rgba(251, 191, 36, 0.25);
        border-color: rgba(251, 191, 36, 0.6);
      }

      #toolbar-color-picker {
        width: 30px;
        height: 24px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        background: none;
      }

      #toolbar-color-picker::-webkit-color-swatch-wrapper {
        padding: 0;
      }

      #toolbar-color-picker::-webkit-color-swatch {
        border: 2px solid rgba(255, 255, 255, 0.9);
        border-radius: 7px;
        box-shadow:
          0 2px 8px rgba(0, 0, 0, 0.15),
          inset 0 1px 0 rgba(255, 255, 255, 0.3);
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
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        opacity: 0.7;
      }

      .dropdown-container.active .dropdown-arrow {
        transform: rotate(180deg);
        opacity: 1;
      }

      .dropdown-container.active .dropdown-toggle {
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.15)) !important;
        border-color: rgba(99, 102, 241, 0.4) !important;
        color: #6366f1 !important;
      }

      .dropdown-menu {
        position: absolute;
        top: calc(100% + 6px);
        right: 0;
        min-width: 190px;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%);
        border: 1px solid rgba(226, 232, 240, 0.8);
        border-radius: 10px;
        box-shadow:
          0 15px 35px -10px rgba(0, 0, 0, 0.25),
          0 8px 18px -6px rgba(0, 0, 0, 0.15);
        padding: 6px;
        display: none;
        z-index: 2147483647;
        animation: dropdownFadeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        backdrop-filter: blur(20px) saturate(180%);
      }

      @keyframes dropdownFadeIn {
        from {
          opacity: 0;
          transform: translateY(-12px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      .dropdown-container.active .dropdown-menu {
        display: block;
      }

      .dropdown-item {
        width: 100%;
        padding: 8px 10px;
        border: none;
        background: none;
        text-align: left;
        cursor: pointer;
        border-radius: 6px;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: #475569;
        transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
        font-weight: 500;
      }

      .dropdown-item i {
        font-size: 15px;
        width: 18px;
        text-align: center;
        color: #64748b;
        transition: all 0.15s;
      }

      .dropdown-item span:first-of-type {
        flex: 1;
      }

      .shortcut {
        font-size: 10px;
        color: #94a3b8;
        font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
        background: rgba(148, 163, 184, 0.12);
        padding: 2px 5px;
        border-radius: 4px;
        font-weight: 600;
        letter-spacing: 0.2px;
      }

      .dropdown-item:hover {
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(139, 92, 246, 0.10));
        color: #6366f1;
        transform: translateX(2px);
      }

      .dropdown-item:hover i {
        color: #6366f1;
        transform: scale(1.1);
      }

      .dropdown-item:hover .shortcut {
        background: rgba(99, 102, 241, 0.15);
        color: #6366f1;
      }

      .dropdown-divider {
        height: 1px;
        background: linear-gradient(
          to right,
          transparent 0%,
          rgba(203, 213, 225, 0.5) 15%,
          rgba(148, 163, 184, 0.6) 50%,
          rgba(203, 213, 225, 0.5) 85%,
          transparent 100%
        );
        margin: 6px 10px;
      }

      #toolbar-help {
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.1)) !important;
        border-color: rgba(59, 130, 246, 0.3) !important;
      }

      #toolbar-help:hover {
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.15)) !important;
        color: #3b82f6 !important;
      }

      #toolbar-close {
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(220, 38, 38, 0.08)) !important;
        border-color: rgba(239, 68, 68, 0.25) !important;
      }

      #toolbar-close:hover {
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.15)) !important;
        color: #ef4444 !important;
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
