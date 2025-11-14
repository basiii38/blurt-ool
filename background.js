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
        <button id="toolbar-mode-toggle" title="Switch to Highlight Mode">🌫️</button>
        <div class="toolbar-separator"></div>
        <button id="toolbar-select-element" title="Select Element (Ctrl+Shift+E)">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M11.4 12.8L8.9 8.45L13.48 10.55L11.85 11.18Z" stroke="currentColor" stroke-width="1" fill="none"/>
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
            <path d="M10 2.6C9.9 2.6 9.9 2.6 9.8 2.7L4.7 2.7L4 2.7C3.7 2.7 3.3 3 3.3 3.3L3.3 5.3C3.3 5.7 3.7 6 4 6L4.7 6C5 6 5.3 5.7 5.3 5.3L5.3 4.7L8.7 4.7L8.7 15.3L8 15.3C7.7 15.3 7.3 15.7 7.3 16L7.3 16.7C7.3 17 7.7 17.3 8 17.3L9.8 17.3C9.9 17.4 10.1 17.4 10.2 17.3L12 17.3C12.4 17.3 12.7 17 12.7 16.7L12.7 16C12.7 15.7 12.4 15.3 12 15.3L11.3 15.3L11.3 4.7L14.7 4.7L14.7 5.3C14.7 5.7 15 6 15.3 6L16 6C16.4 6 16.7 5.7 16.7 5.3L16.7 3.3C16.7 3 16.4 2.7 16 2.7L15.3 2.7L10.2 2.7C10.1 2.6 10.1 2.6 10 2.6Z" fill="currentColor"/>
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
        <button id="toolbar-presets" title="Blur Presets">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="3" r="1.5" fill="currentColor"/>
            <circle cx="8" cy="8" r="2" fill="currentColor" opacity="0.6"/>
            <circle cx="8" cy="13" r="2.5" fill="currentColor" opacity="0.3"/>
          </svg>
        </button>
        <div class="color-picker-container">
          <input type="color" id="toolbar-color-picker" value="#FFFF00" title="Highlight Color">
        </div>
        <div class="slider-container">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.5" fill="none"/>
            <circle cx="7" cy="7" r="2" fill="currentColor"/>
          </svg>
          <input type="range" id="toolbar-blur-intensity" min="0" max="100" value="8" title="Blur Intensity (0-100px)">
        </div>
        <div class="toolbar-separator"></div>
        <button id="toolbar-save" title="Save (Ctrl+S)">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 2C2.45 2 2 2.45 2 3V13C2 13.55 2.45 14 3 14H13C13.55 14 14 13.55 14 13V5L11 2H3Z" stroke="currentColor" stroke-width="1.5" fill="none"/>
            <rect x="5" y="1" width="5" height="4" rx="0.5" fill="currentColor"/>
            <rect x="4" y="9" width="8" height="5" rx="0.5" stroke="currentColor" stroke-width="1" fill="none"/>
          </svg>
        </button>
        <button id="toolbar-load" title="Load (Ctrl+O)">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 2C2.45 2 2 2.45 2 3V13C2 13.55 2.45 14 3 14H13C13.55 14 14 13.55 14 13V5L11 2H3Z" stroke="currentColor" stroke-width="1.5" fill="none"/>
            <path d="M8 5V11M8 11L6 9M8 11L10 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <button id="toolbar-export" title="Export (Ctrl+E)">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2V8M8 2L6 4M8 2L10 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M3 9V12C3 12.55 3.45 13 4 13H12C12.55 13 13 12.55 13 12V9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
        <button id="toolbar-import" title="Import">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 8V2M8 8L6 6M8 8L10 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M3 9V12C3 12.55 3.45 13 4 13H12C12.55 13 13 12.55 13 12V9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
        <div class="toolbar-separator"></div>
        <button id="toolbar-screenshot" title="Screenshot">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="4" width="12" height="9" rx="1" stroke="currentColor" stroke-width="1.5" fill="none"/>
            <circle cx="8" cy="8.5" r="2" stroke="currentColor" stroke-width="1.5" fill="none"/>
            <rect x="6" y="2" width="4" height="2" rx="0.5" fill="currentColor"/>
          </svg>
        </button>
        <button id="toolbar-undo" title="Undo (Ctrl+Z)">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M 1.3 4.7 L 1.3 10.7 L 7.3 10.7 L 4.9 8.25 C 5.8 7.47 7 7 8.3 7 C 10.7 7 12.7 8.53 13.4 10.65 L 15 10.12 C 14 7.34 11.4 5.3 8.3 5.3 C 6.6 5.3 4.9 5.97 3.7 7.08 L 1.3 4.7 Z" fill="currentColor"/>
          </svg>
        </button>
        <button id="toolbar-redo" title="Redo (Ctrl+Shift+Z)">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M 14.7 4.7 L 14.7 10.7 L 8.7 10.7 L 11.1 8.25 C 10.2 7.47 9 7 7.7 7 C 5.3 7 3.3 8.53 2.6 10.65 L 1 10.12 C 2 7.34 4.6 5.3 7.7 5.3 C 9.4 5.3 11.1 5.97 12.3 7.08 L 14.7 4.7 Z" fill="currentColor"/>
          </svg>
        </button>
        <button id="toolbar-clear-all" title="Clear All">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 2V3H10V2C10 1.45 9.55 1 9 1H7C6.45 1 6 1.45 6 2Z" fill="currentColor"/>
            <path d="M3 4V13C3 14.1 3.9 15 5 15H11C12.1 15 13 14.1 13 13V4H3ZM6 12C6 12.28 5.78 12.5 5.5 12.5S5 12.28 5 12V7C5 6.72 5.22 6.5 5.5 6.5S6 6.72 6 7V12ZM8.5 12C8.5 12.28 8.28 12.5 8 12.5S7.5 12.28 7.5 12V7C7.5 6.72 7.72 6.5 8 6.5S8.5 6.72 8.5 7V12ZM11 12C11 12.28 10.78 12.5 10.5 12.5S10 12.28 10 12V7C10 6.72 10.22 6.5 10.5 6.5S11 6.72 11 7V12Z" fill="currentColor"/>
            <rect x="1" y="3" width="14" height="1.5" rx="0.5" fill="currentColor"/>
          </svg>
        </button>
        <div class="toolbar-separator"></div>
        <button id="toolbar-help" title="Help (?)">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.5" fill="none"/>
            <path d="M8 11.5V11.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M8 4.5C6.62 4.5 5.5 5.62 5.5 7H7C7 6.45 7.45 6 8 6C8.55 6 9 6.45 9 7C9 7.5 8.5 7.75 8 8.5V9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
        <button id="toolbar-close" title="Close">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
      <div id="toolbar-status-bar" style="padding: 8px 12px; border-top: 1px solid rgba(0,0,0,0.05); display: flex; align-items: center; justify-content: space-between; font-size: 12px;">
        <span id="toolbar-status" style="color: #6b7280; font-weight: 500;">Ready</span>
        <span style="color: #9ca3af; font-size: 11px;">Press ? for help</span>
      </div>
    `;
    document.body.appendChild(toolbarContainer);

    // Add CSS
    const style = document.createElement('style');
    style.textContent = `
      #blur-toolbar-container {
        position: fixed !important;
        z-index: 2147483647 !important;
        pointer-events: auto !important;
        filter: none !important;
      }
      
      #blur-toolbar {
        position: relative;
        top: 0;
        left: 0;
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 12px;
        padding: 8px;
        z-index: 2147483647 !important;
        display: flex;
        gap: 4px;
        align-items: center;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
        backdrop-filter: blur(20px);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        user-select: none;
        pointer-events: auto !important;
        filter: none !important;
      }
      
      #toolbar-drag-handle {
        cursor: move;
        color: #6b7280;
        padding: 6px 4px;
        opacity: 0.7;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        transition: all 0.2s ease;
        pointer-events: auto !important;
        filter: none !important;
        z-index: 2147483647 !important;
      }
      
      #toolbar-drag-handle:hover {
        opacity: 1;
        background: rgba(0, 0, 0, 0.05);
      }
      
      #blur-toolbar button {
        cursor: pointer;
        padding: 8px;
        border: none;
        border-radius: 8px;
        background: rgba(0, 0, 0, 0.05);
        color: #1f2937;
        min-width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        pointer-events: auto !important;
        filter: none !important;
        z-index: 2147483647 !important;
        border: 1px solid rgba(0, 0, 0, 0.08);
      }

      #blur-toolbar button svg {
        filter: drop-shadow(0 0 1px rgba(255, 255, 255, 0.5));
      }

      #blur-toolbar button:hover {
        background: rgba(102, 126, 234, 0.15);
        border-color: rgba(102, 126, 234, 0.3);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
      }

      #blur-toolbar button:active {
        transform: translateY(0);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      #toolbar-mode-toggle {
        font-size: 18px;
        line-height: 1;
        padding: 6px 8px;
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(139, 92, 246, 0.1));
        border: 1px solid rgba(102, 126, 234, 0.2);
      }

      #toolbar-mode-toggle:hover {
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(139, 92, 246, 0.2));
      }

      /* Enhanced visibility for Quick Select and Presets */
      #toolbar-quick-select,
      #toolbar-presets {
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.08));
        border: 1px solid rgba(59, 130, 246, 0.2);
      }

      #toolbar-quick-select:hover,
      #toolbar-presets:hover {
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.15));
        border-color: rgba(59, 130, 246, 0.4);
      }

      #toolbar-quick-select svg,
      #toolbar-presets svg {
        filter: drop-shadow(0 1px 2px rgba(59, 130, 246, 0.3));
      }

      /* Visual separators between button groups */
      .toolbar-separator {
        width: 1px;
        height: 24px;
        background: linear-gradient(to bottom,
          transparent,
          rgba(0, 0, 0, 0.15) 20%,
          rgba(0, 0, 0, 0.15) 80%,
          transparent);
        margin: 0 4px;
        flex-shrink: 0;
      }

      /* Enhanced toolbar container */
      #blur-toolbar {
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15),
                    0 2px 8px rgba(0, 0, 0, 0.1),
                    inset 0 1px 0 rgba(255, 255, 255, 0.8);
      }

      /* Status bar enhancement */
      #toolbar-status-bar {
        background: linear-gradient(to bottom, rgba(0, 0, 0, 0.02), rgba(0, 0, 0, 0.04));
      }

      .color-picker-container {
        display: flex;
        align-items: center;
        background: linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(245, 158, 11, 0.1));
        border: 1px solid rgba(251, 191, 36, 0.2);
        border-radius: 8px;
        padding: 4px;
        pointer-events: auto !important;
        filter: none !important;
        z-index: 2147483647 !important;
      }

      .color-picker-container:hover {
        background: linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.15));
        border-color: rgba(251, 191, 36, 0.3);
      }
      
      #toolbar-color-picker {
        width: 32px;
        height: 24px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        background: none;
        padding: 0;
      }
      
      #toolbar-color-picker::-webkit-color-swatch-wrapper {
        padding: 0;
      }
      
      #toolbar-color-picker::-webkit-color-swatch {
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 6px;
      }
      
      #toolbar-color-picker::-moz-color-swatch {
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 6px;
      }
      
      .slider-container {
        display: flex;
        align-items: center;
        gap: 6px;
        background: linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(124, 58, 237, 0.08));
        border: 1px solid rgba(139, 92, 246, 0.15);
        border-radius: 8px;
        padding: 6px 10px;
        pointer-events: auto !important;
        filter: none !important;
        z-index: 2147483647 !important;
      }

      .slider-container:hover {
        background: linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(124, 58, 237, 0.12));
        border-color: rgba(139, 92, 246, 0.25);
      }

      .slider-container svg {
        color: #7c3aed;
        filter: drop-shadow(0 1px 2px rgba(139, 92, 246, 0.2));
      }
      
      #blur-toolbar input[type="range"] {
        width: 80px;
        height: 4px;
        appearance: none;
        background: rgba(0, 0, 0, 0.1);
        border-radius: 2px;
        outline: none;
      }
      
      #blur-toolbar input[type="range"]::-webkit-slider-thumb {
        appearance: none;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: linear-gradient(135deg, #7c3aed, #6d28d9);
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(124, 58, 237, 0.4),
                    0 0 0 2px rgba(255, 255, 255, 0.8);
        transition: all 0.2s ease;
      }

      #blur-toolbar input[type="range"]::-webkit-slider-thumb:hover {
        background: linear-gradient(135deg, #8b5cf6, #7c3aed);
        transform: scale(1.15);
        box-shadow: 0 4px 12px rgba(124, 58, 237, 0.5),
                    0 0 0 3px rgba(255, 255, 255, 0.9);
      }

      #blur-toolbar input[type="range"]::-moz-range-thumb {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: linear-gradient(135deg, #7c3aed, #6d28d9);
        cursor: pointer;
        border: 2px solid rgba(255, 255, 255, 0.8);
        box-shadow: 0 2px 8px rgba(124, 58, 237, 0.4);
      }
    `;
    document.head.appendChild(style);

    // Send message to content script to set up event handlers
    window.postMessage({ type: 'SETUP_TOOLBAR' }, '*');
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toolbar-screenshot') {
    chrome.tabs.captureVisibleTab(null, {}, (image) => {
      chrome.tabs.create({ url: image });
    });
  }
});
