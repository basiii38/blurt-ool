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
      <div id="blur-toolbar">
        <!-- Drag Handle -->
        <div id="toolbar-drag-handle" title="Drag to move">
          <svg width="12" height="16" viewBox="0 0 12 16" fill="none">
            <circle cx="3" cy="3" r="1.5" fill="currentColor"/>
            <circle cx="9" cy="3" r="1.5" fill="currentColor"/>
            <circle cx="3" cy="8" r="1.5" fill="currentColor"/>
            <circle cx="9" cy="8" r="1.5" fill="currentColor"/>
            <circle cx="3" cy="13" r="1.5" fill="currentColor"/>
            <circle cx="9" cy="13" r="1.5" fill="currentColor"/>
          </svg>
        </div>

        <!-- Mode Toggle -->
        <button id="toolbar-mode-toggle" title="Switch Mode" class="mode-btn">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" id="mode-icon">
            <path d="M8 2C8 2 6 4 6 6C6 7.1 6.9 8 8 8C9.1 8 10 7.1 10 6C10 4 8 2 8 2Z" fill="currentColor"/>
            <ellipse cx="8" cy="11" rx="4" ry="3" fill="currentColor" opacity="0.4"/>
          </svg>
        </button>

        <div class="toolbar-separator"></div>

        <!-- Blur Intensity Slider -->
        <div class="slider-container">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="2" fill="currentColor"/>
            <circle cx="7" cy="7" r="4" fill="currentColor" opacity="0.3"/>
            <circle cx="7" cy="7" r="6" fill="currentColor" opacity="0.1"/>
          </svg>
          <input type="range" id="toolbar-blur-intensity" min="0" max="100" value="8" title="Blur Intensity">
        </div>

        <!-- Color Picker -->
        <div class="color-picker-container" style="display: none;">
          <input type="color" id="toolbar-color-picker" value="#FFFF00" title="Highlight Color">
        </div>

        <div class="toolbar-separator"></div>

        <!-- Tool Buttons (Flattened) -->
        <button id="toolbar-select-element" title="Select Element (Ctrl+Shift+E)">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 2L2 12L6 9L8.5 14L10 13.5L7.5 8.5L12 8L2 2Z" fill="currentColor" stroke="currentColor" stroke-width="0.5" stroke-linejoin="round"/>
          </svg>
        </button>

        <button id="toolbar-draw-region" title="Draw Region">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="2" width="12" height="12" rx="1" stroke="currentColor" stroke-width="1.5" fill="none"/>
            <rect x="5" y="5" width="6" height="6" fill="currentColor" opacity="0.3"/>
          </svg>
        </button>

        <button id="toolbar-select-text" title="Select Text">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 3H13M8 3V13M5 13H11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <rect x="2" y="2" width="4" height="4" fill="none" stroke="currentColor" stroke-width="1.5"/>
            <rect x="10" y="10" width="4" height="4" fill="none" stroke="currentColor" stroke-width="1.5"/>
          </svg>
        </button>

        <button id="toolbar-quick-select" title="Quick Select">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="2" width="4" height="4" rx="1" fill="currentColor" opacity="0.7"/>
            <rect x="10" y="2" width="4" height="4" rx="1" fill="currentColor" opacity="0.7"/>
            <rect x="2" y="10" width="4" height="4" rx="1" fill="currentColor" opacity="0.7"/>
            <rect x="10" y="10" width="4" height="4" rx="1" fill="currentColor" opacity="0.7"/>
          </svg>
        </button>

        <div class="toolbar-separator"></div>

        <!-- Action Buttons (Flattened) -->
        <button id="toolbar-undo" title="Undo (Ctrl+Z)">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 8H10C11.5 8 13 9.5 13 11M2 8L5 5M2 8L5 11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>

        <button id="toolbar-redo" title="Redo (Ctrl+Y)">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M14 8H6C4.5 8 3 9.5 3 11M14 8L11 5M14 8L11 11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>

        <!-- Clear All - Prominent -->
        <button id="toolbar-clear-all" title="Clear All (Delete)" class="clear-btn">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 2V3H10V2C10 1.45 9.55 1 9 1H7C6.45 1 6 1.45 6 2Z" fill="currentColor"/>
            <path d="M3 4V13C3 14.1 3.9 15 5 15H11C12.1 15 13 14.1 13 13V4H3ZM6 12C6 12.28 5.78 12.5 5.5 12.5S5 12.28 5 12V7C5 6.72 5.22 6.5 5.5 6.5S6 6.72 6 7V12ZM8.5 12C8.5 12.28 8.28 12.5 8 12.5S7.5 12.28 7.5 12V7C7.5 6.72 7.72 6.5 8 6.5S8.5 6.72 8.5 7V12ZM11 12C11 12.28 10.78 12.5 10.5 12.5S10 12.28 10 12V7C10 6.72 10.22 6.5 10.5 6.5S11 6.72 11 7V12Z" fill="currentColor"/>
            <rect x="1" y="3" width="14" height="1.5" rx="0.5" fill="currentColor"/>
          </svg>
        </button>

        <div class="toolbar-separator"></div>

        <!-- Manage Dropdown (Keep for file operations) -->
        <div class="dropdown-container">
          <button class="dropdown-toggle" id="manage-dropdown" title="Manage">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 3C2 2.45 2.45 2 3 2H8L11 5V13C11 13.55 10.55 14 10 14H3C2.45 14 2 13.55 2 13V3Z" fill="currentColor" opacity="0.3"/>
              <path d="M5 6H14V13C14 13.55 13.55 14 13 14H6C5.45 14 5 13.55 5 13V6Z" stroke="currentColor" stroke-width="1.5" fill="none"/>
              <path d="M5 6L8 3H14" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
            </svg>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" class="dropdown-arrow">
              <path d="M2 3L5 6L8 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <div class="dropdown-menu" id="manage-menu">
            <button class="dropdown-item" id="toolbar-presets">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="2" fill="currentColor"/>
                <circle cx="8" cy="8" r="4" stroke="currentColor" stroke-width="1.5" fill="none"/>
                <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1" fill="none" opacity="0.5"/>
                <circle cx="8" cy="2" r="1" fill="currentColor"/>
                <circle cx="8" cy="14" r="1" fill="currentColor"/>
                <circle cx="2" cy="8" r="1" fill="currentColor"/>
                <circle cx="14" cy="8" r="1" fill="currentColor"/>
              </svg>
              <span>Presets</span>
            </button>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item" id="toolbar-save">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="2" width="12" height="12" rx="1" stroke="currentColor" stroke-width="1.5" fill="none"/>
                <rect x="4" y="2" width="5" height="3" fill="currentColor"/>
                <rect x="4" y="9" width="8" height="5" rx="0.5" stroke="currentColor" stroke-width="1" fill="none"/>
                <path d="M11 2V6" stroke="currentColor" stroke-width="1.5"/>
              </svg>
              <span>Save</span>
              <span class="shortcut">Ctrl+S</span>
            </button>
            <button class="dropdown-item" id="toolbar-load">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 6H13M3 6L5 4M3 6L5 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M4 9V13C4 13.55 4.45 14 5 14H11C11.55 14 12 13.55 12 13V9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              <span>Load</span>
            </button>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item" id="toolbar-export">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 9V3M8 3L6 5M8 3L10 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M3 11V13C3 13.55 3.45 14 4 14H12C12.55 14 13 13.55 13 13V11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              <span>Export</span>
            </button>
            <button class="dropdown-item" id="toolbar-import">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 3V9M8 9L6 7M8 9L10 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M3 11V13C3 13.55 3.45 14 4 14H12C12.55 14 13 13.55 13 13V11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              <span>Import</span>
            </button>
          </div>
        </div>

        <div class="toolbar-separator"></div>

        <!-- Premium Button -->
        <button id="toolbar-premium" title="Premium Features" class="premium-btn">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1L10 5.5L15 6.2L11.5 9.5L12.5 14.5L8 12L3.5 14.5L4.5 9.5L1 6.2L6 5.5L8 1Z" fill="currentColor"/>
          </svg>
        </button>

        <!-- Close -->
        <button id="toolbar-close" title="Close">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
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

    setTimeout(setupDropdowns, 100);

    // Send message to content script to set up event listeners
    window.postMessage({ type: 'SETUP_TOOLBAR' }, '*');
  }
}
