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
    // Create toolbar function - icons are now inline SVG so no need to wait
    function createToolbar() {
  const toolbarId = 'blur-toolbar-container';
  const toolbarContainer = document.createElement('div');
  toolbarContainer.id = toolbarId;
  toolbarContainer.style.cssText = 'position: fixed !important; top: 20px; right: 20px; z-index: 2147483647 !important; pointer-events: auto !important; filter: none !important;';

  toolbarContainer.innerHTML = `
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
          <i class="bi bi-bullseye"></i>
          <input type="range" id="toolbar-blur-intensity" min="0" max="100" value="8" title="Blur Intensity">
        </div>

        <!-- Color Picker -->
        <div class="color-picker-container" style="display: none;">
          <input type="color" id="toolbar-color-picker" value="#FFFF00" title="Highlight Color">
        </div>

        <div class="toolbar-separator"></div>

        <!-- Tool Buttons (Flattened) -->
        <button id="toolbar-select-element" title="Select Element (Ctrl+Shift+E)">
          <i class="bi bi-cursor-fill"></i>
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
          <i class="bi bi-trash-fill"></i>
        </button>

        <div class="toolbar-separator"></div>

        <!-- Manage Dropdown (Keep for file operations) -->
        <div class="dropdown-container">
          <button class="dropdown-toggle" id="manage-dropdown" title="Manage">
            <i class="bi bi-folder-fill"></i>
            <i class="bi bi-chevron-down dropdown-arrow"></i>
          </button>
          <div class="dropdown-menu" id="manage-menu">
            <button class="dropdown-item" id="toolbar-presets">
              <i class="bi bi-sliders"></i>
              <span>Presets</span>
            </button>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item" id="toolbar-save">
              <i class="bi bi-floppy-fill"></i>
              <span>Save</span>
              <span class="shortcut">Ctrl+S</span>
            </button>
            <button class="dropdown-item" id="toolbar-load">
              <i class="bi bi-folder-open"></i>
              <span>Load</span>
            </button>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item" id="toolbar-export">
              <i class="bi bi-box-arrow-up"></i>
              <span>Export</span>
            </button>
            <button class="dropdown-item" id="toolbar-import">
              <i class="bi bi-box-arrow-in-down"></i>
              <span>Import</span>
            </button>
          </div>
        </div>

        <div class="toolbar-separator"></div>

        <!-- Premium Button -->
        <button id="toolbar-premium" title="Premium Features" class="premium-btn">
          <i class="bi bi-star-fill"></i>
        </button>

        <!-- Close -->
        <button id="toolbar-close" title="Close">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
    `;
    document.body.appendChild(toolbarContainer);

    // Add CSS
    const style = document.createElement('style');
    style.textContent = `
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

      #blur-toolbar button svg, #blur-toolbar .dropdown-toggle svg {
        transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      }

      #blur-toolbar button:hover svg:not(.dropdown-arrow), #blur-toolbar .dropdown-toggle:hover svg:not(.dropdown-arrow) {
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

      .mode-btn svg {
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

      .premium-btn {
        background: linear-gradient(135deg, #f59e0b, #d97706) !important;
        border-color: rgba(245, 158, 11, 0.4) !important;
        color: white !important;
        box-shadow:
          0 3px 9px rgba(245, 158, 11, 0.3),
          inset 0 1px 0 rgba(255, 255, 255, 0.2);
        animation: premiumPulse 2s ease-in-out infinite;
      }

      @keyframes premiumPulse {
        0%, 100% {
          box-shadow:
            0 3px 9px rgba(245, 158, 11, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }
        50% {
          box-shadow:
            0 3px 9px rgba(245, 158, 11, 0.5),
            0 0 0 3px rgba(245, 158, 11, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }
      }

      .premium-btn::before {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05)) !important;
      }

      .premium-btn:hover {
        background: linear-gradient(135deg, #fbbf24, #f59e0b) !important;
        box-shadow:
          0 8px 20px rgba(245, 158, 11, 0.4),
          0 4px 10px rgba(245, 158, 11, 0.2),
          inset 0 1px 0 rgba(255, 255, 255, 0.3);
        transform: translateY(-2px) scale(1.02);
        animation: none;
      }

      .premium-btn svg {
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
      }

      .premium-btn.premium-active {
        background: linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(22, 163, 74, 0.15)) !important;
        border-color: rgba(34, 197, 94, 0.4) !important;
        color: #16a34a !important;
        animation: none;
      }

      .premium-btn.premium-active:hover {
        background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(22, 163, 74, 0.2)) !important;
        color: #15803d !important;
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

      .slider-container svg {
        color: #6366f1;
        opacity: 0.8;
        flex-shrink: 0;
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

      .dropdown-item svg {
        width: 16px;
        height: 16px;
        color: #64748b;
        transition: all 0.15s;
        flex-shrink: 0;
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

      .dropdown-item:hover svg {
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

    // Setup dropdowns immediately instead of using setTimeout
    setupDropdowns();

      // Send message to content script to set up event listeners
      window.postMessage({ type: 'SETUP_TOOLBAR' }, '*');

      // Apply inline SVG icons immediately - this ensures icons work even if content.js hasn't loaded yet
      const inlineSVGIcons = {
        'bi-grip-vertical': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M7 2a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/></svg>',
        'bi-droplet-fill': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 16a6 6 0 0 0 6-6c0-1.655-1.122-2.904-2.432-4.362C10.254 4.176 8.75 2.503 8 0c0 0-6 5.686-6 10a6 6 0 0 0 6 6ZM6.646 4.646l.708.708c-.29.29-1.128 1.311-1.907 2.87l-.894-.448c.82-1.641 1.717-2.753 2.093-3.13Z"/></svg>',
        'bi-highlighter': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M11.096.644a2 2 0 0 1 2.791.036l1.433 1.433a2 2 0 0 1 .035 2.791l-.413.435-8.07 8.995a.5.5 0 0 1-.372.166h-3a.5.5 0 0 1-.234-.058l-.412.412A.5.5 0 0 1 2.5 15h-2a.5.5 0 0 1-.354-.146L.146 14.854a.5.5 0 0 1 0-.708l1.412-1.412A.5.5 0 0 1 1.5 12.5v-3a.5.5 0 0 1 .166-.372l8.995-8.07.435-.414Zm-.115 1.47L2.727 9.52l3.753 3.753 7.406-8.254-2.905-2.905Z"/></svg>',
        'bi-bullseye': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M8 13A5 5 0 1 1 8 3a5 5 0 0 1 0 10zm0 1A6 6 0 1 0 8 2a6 6 0 0 0 0 12z"/><path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm0 1a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/><path d="M9.5 8a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/></svg>',
        'bi-cursor-fill': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M14.082 2.182a.5.5 0 0 1 .103.557L8.528 15.467a.5.5 0 0 1-.917-.007L5.57 10.694.803 8.652a.5.5 0 0 1-.006-.916l12.728-5.657a.5.5 0 0 1 .556.103z"/></svg>',
        'bi-bounding-box': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5 2V0H0v5h2v6H0v5h5v-2h6v2h5v-5h-2V5h2V0h-5v2H5zm6 1v2h2v6h-2v2H5v-2H3V5h2V3h6zm1-2h3v3h-3V1zm3 11v3h-3v-3h3zM4 15H1v-3h3v3zM1 4V1h3v3H1z"/></svg>',
        'bi-fonts': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M12.258 3h-8.51l-.083 2.46h.479c.26-1.544.758-1.783 2.693-1.845l.424-.013v7.827c0 .663-.144.82-1.3.923v.52h4.082v-.52c-1.162-.103-1.306-.26-1.306-.923V3.602l.431.013c1.934.062 2.434.301 2.693 1.846h.479L12.258 3z"/></svg>',
        'bi-grid-3x3-gap': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M4 2v2H2V2h2zm1 12v-2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1zm0-5V7a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1zm0-5V2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1zm5 10v-2a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1zm0-5V7a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1zm0-5V2a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1zM9 2v2H7V2h2zm5 0v2h-2V2h2zM4 7v2H2V7h2zm5 0v2H7V7h2zm5 0h-2v2h2V7zM4 12v2H2v-2h2zm5 0v2H7v-2h2zm5 0v2h-2v-2h2zM12 1a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1h-2zm-1 6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V7zm1 4a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1h-2z"/></svg>',
        'bi-arrow-counterclockwise': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M8 3a5 5 0 1 1-4.546 2.914.5.5 0 0 0-.908-.417A6 6 0 1 0 8 2v1z"/><path d="M8 4.466V.534a.25.25 0 0 0-.41-.192L5.23 2.308a.25.25 0 0 0 0 .384l2.36 1.966A.25.25 0 0 0 8 4.466z"/></svg>',
        'bi-arrow-clockwise': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/><path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/></svg>',
        'bi-trash-fill': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1H2.5zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5zM8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5zm3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0z"/></svg>',
        'bi-folder-fill': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M9.828 3h3.982a2 2 0 0 1 1.992 2.181l-.637 7A2 2 0 0 1 13.174 14H2.825a2 2 0 0 1-1.991-1.819l-.637-7a1.99 1.99 0 0 1 .342-1.31L.5 3a2 2 0 0 1 2-2h3.672a2 2 0 0 1 1.414.586l.828.828A2 2 0 0 0 9.828 3zm-8.322.12C1.72 3.042 1.95 3 2.19 3h5.396l-.707-.707A1 1 0 0 0 6.172 2H2.5a1 1 0 0 0-1 .981l.006.139z"/></svg>',
        'bi-chevron-down': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/></svg>',
        'bi-sliders': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M11.5 2a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM9.05 3a2.5 2.5 0 0 1 4.9 0H16v1h-2.05a2.5 2.5 0 0 1-4.9 0H0V3h9.05zM4.5 7a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM2.05 8a2.5 2.5 0 0 1 4.9 0H16v1H6.95a2.5 2.5 0 0 1-4.9 0H0V8h2.05zm9.45 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm-2.45 1a2.5 2.5 0 0 1 4.9 0H16v1h-2.05a2.5 2.5 0 0 1-4.9 0H0v-1h9.05z"/></svg>',
        'bi-floppy-fill': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M0 1.5A1.5 1.5 0 0 1 1.5 0H3v5.5A1.5 1.5 0 0 0 4.5 7h7A1.5 1.5 0 0 0 13 5.5V0h.086a1.5 1.5 0 0 1 1.06.44l1.415 1.414A1.5 1.5 0 0 1 16 2.914V14.5a1.5 1.5 0 0 1-1.5 1.5H14v-5.5A1.5 1.5 0 0 0 12.5 9h-9A1.5 1.5 0 0 0 2 10.5V16h-.5A1.5 1.5 0 0 1 0 14.5v-13z"/><path d="M3 16h10v-5.5a.5.5 0 0 0-.5-.5h-9a.5.5 0 0 0-.5.5V16zm9-16H4v5.5a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5V0zM9 1h2v4H9V1z"/></svg>',
        'bi-folder-open': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z"/><path fill-rule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z"/></svg>',
        'bi-box-arrow-up': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M3.5 6a.5.5 0 0 0-.5.5v8a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5v-8a.5.5 0 0 0-.5-.5h-2a.5.5 0 0 1 0-1h2A1.5 1.5 0 0 1 14 6.5v8a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 14.5v-8A1.5 1.5 0 0 1 3.5 5h2a.5.5 0 0 1 0 1h-2z"/><path fill-rule="evenodd" d="M7.646.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 1.707V10.5a.5.5 0 0 1-1 0V1.707L5.354 3.854a.5.5 0 1 1-.708-.708l3-3z"/></svg>',
        'bi-box-arrow-in-down': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M3.5 6a.5.5 0 0 0-.5.5v8a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5v-8a.5.5 0 0 0-.5-.5h-2a.5.5 0 0 1 0-1h2A1.5 1.5 0 0 1 14 6.5v8a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 14.5v-8A1.5 1.5 0 0 1 3.5 5h2a.5.5 0 0 1 0 1h-2z"/><path fill-rule="evenodd" d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/></svg>',
        'bi-star-fill': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/></svg>',
        'bi-x-lg': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/></svg>'
      };

      // Replace icon placeholders with inline SVG
      document.querySelectorAll('#blur-toolbar i[class*="bi-"]').forEach(icon => {
        const classes = icon.className.split(' ');
        const iconClass = classes.find(c => c.startsWith('bi-'));

        if (iconClass && inlineSVGIcons[iconClass]) {
          icon.innerHTML = inlineSVGIcons[iconClass];
          icon.style.display = 'inline-block';
          icon.style.width = '16px';
          icon.style.height = '16px';
          icon.style.verticalAlign = 'text-bottom';
        }
      });

      console.log('[Blurt-ool] Toolbar created with inline SVG icons');
    }

    // Create toolbar immediately - icons are inline SVG so no CSS loading needed
    createToolbar();
  }
}
