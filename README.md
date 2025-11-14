# Element Blur - Chrome Extension

**Version 1.3**

A powerful Chrome extension that allows you to blur or highlight any element, region, or text on web pages with advanced features including save/load configurations, presets, extensive keyboard shortcuts, and auto-apply functionality. Press **?** for help!

## Features

### Core Functionality
- **Blur Mode**: Blur sensitive information, images, or any element on a web page
- **Highlight Mode**: Highlight important content with customizable colors and opacity
- **Element Selection**: Click on any element to blur/highlight it
- **Region Drawing**: Draw rectangular regions to blur/highlight specific areas
- **Text Selection**: Select and blur/highlight specific text passages

### Advanced Features

#### Save/Load Configurations
- **Auto-Save per Domain**: Automatically save blur configurations for each website
- **Auto-Load**: Automatically apply saved configurations when revisiting pages
- **Manual Save/Load**: Save and load configurations on demand
- **Export Configurations**: Export your blur patterns as JSON files
- **Import Configurations**: Import previously exported configurations

#### Blur Presets
- **Light Blur** (3px): Subtle blur effect
- **Medium Blur** (8px): Standard blur effect
- **Heavy Blur** (15px): Strong blur effect
- **Custom Intensity**: Adjust blur intensity from 0-20px using the slider

#### Quick Select Elements
Quickly blur/highlight common elements:
- All Images
- All Videos
- All Iframes
- All Sidebars
- Ad Elements

#### Keyboard Shortcuts
- **?** or **Shift+/**: Show keyboard shortcuts help modal
- **Ctrl+Shift+B**: Toggle between Blur and Highlight modes
- **Ctrl+Shift+E**: Activate element selection tool
- **Ctrl+Z**: Undo last action
- **Ctrl+Shift+Z** or **Ctrl+Y**: Redo last undone action
- **Ctrl+S**: Save current configuration
- **Ctrl+O**: Load saved configuration
- **Ctrl+E**: Export configuration to file
- **Ctrl+A**: Select all images
- **Ctrl+Shift+A**: Select all videos
- **1, 2, 3**: Quick blur presets (Light, Medium, Heavy)
- **Delete**: Clear all blur/highlight effects
- **Ctrl+Shift+H**: Toggle toolbar visibility
- **Ctrl+Shift+C**: Toggle compact toolbar mode
- **Escape**: Cancel current mode or close modals

### UI Features
- **Draggable Toolbar**: Move the toolbar anywhere on the page
- **Compact Mode**: Toggle compact toolbar mode (Ctrl+Shift+C) for minimal UI
- **Active Tool Highlighting**: Visual feedback shows which tool is currently active
- **Keyboard Shortcuts Help**: Press **?** to see all available shortcuts
- **Modern Design**: Clean, minimalist interface with smooth animations
- **Visual Feedback**: See notifications for actions (save, load, export, etc.)
- **Undo/Redo**: Full history management with undo/redo support
- **Smart Filename**: Exports use format `blur-domain.com-2024-11-14.json`

## Installation

### From Source
1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked"
5. Select the extension directory

### Icon Setup
The extension includes PNG icons. If you need to regenerate them:
```bash
node create-png-icons.js
```

## Usage Guide

### Getting Started
1. Click the Element Blur extension icon in your Chrome toolbar
2. The floating toolbar will appear on the page
3. Choose your desired mode (Blur or Highlight)
4. Select elements, draw regions, or select text to apply effects

### Toolbar Buttons

| Icon | Button | Description |
|------|--------|-------------|
| ⋮⋮ | Drag Handle | Drag to reposition the toolbar |
| 🌫️ | Mode Toggle | Switch between Blur and Highlight modes |
| 🎯 | Select Element | Click to select individual elements |
| ▢ | Draw Region | Draw rectangular regions to blur/highlight |
| T | Select Text | Select and blur/highlight specific text |
| ⊞ | Quick Select | Quickly select common elements (images, videos, etc.) |
| ⚙ | Presets | Choose blur intensity presets (Light/Medium/Heavy) |
| 🎨 | Color Picker | Choose highlight color (Highlight mode only) |
| ◉ | Intensity Slider | Adjust blur intensity or highlight opacity |
| 💾 | Save | Save current configuration for this domain |
| 📂 | Load | Load saved configuration for this domain |
| ⬆ | Export | Export configuration as JSON file |
| ⬇ | Import | Import configuration from JSON file |
| 📷 | Screenshot | Capture page with blur/highlight effects |
| ↶ | Undo | Undo last action |
| ↷ | Redo | Redo last undone action |
| 🗑 | Clear All | Remove all blur/highlight effects |
| ✕ | Close | Close the toolbar |

### Workflow Examples

#### Example 1: Blur Sensitive Information for Screenshot
1. Open the page with sensitive information
2. Click the extension icon to open the toolbar
3. Use "Select Element" or "Draw Region" to blur sensitive areas
4. Click the Screenshot button to capture
5. The screenshot opens in a new tab with effects applied

#### Example 2: Create Reusable Configuration
1. Blur/highlight elements as desired
2. Click the "Save" button to save the configuration for this domain
3. Next time you visit the page, the configuration auto-loads
4. Click "Export" to save as a file for backup or sharing

#### Example 3: Use Quick Select for Common Tasks
1. Click the "Quick Select" button
2. Choose "All Images" to blur all images on the page
3. Use "Undo" if you need to adjust
4. Fine-tune with individual element selection

## Technical Details

### Bug Fixes in Version 1.2
All bugs from version 1.1 have been fixed:

1. ✅ **Missing icon files**: Added PNG icons for all sizes
2. ✅ **Unused files**: Removed toolbar.html and toolbar.css
3. ✅ **History tracking order**: Fixed element removal tracking
4. ✅ **DOM existence checks**: Added validation in undo function
5. ✅ **Memory leak prevention**: Implemented history cleanup (max 50 items)
6. ✅ **Text selection restoration**: Fixed flag handling logic
7. ✅ **Screenshot timing**: Improved with requestAnimationFrame
8. ✅ **Region positioning**: Fixed for scrollable pages using fixed positioning
9. ✅ **Z-index consistency**: Standardized to 2147483647
10. ✅ **State persistence**: Implemented full storage system

### Architecture
- **manifest.json**: Extension configuration
- **background.js**: Service worker for toolbar injection and screenshots
- **content.js**: Main logic for blur/highlight functionality
- **images/**: Icon files for the extension

### Storage Format
Configurations are stored in Chrome's local storage:
```json
{
  "blurConfigs": {
    "example.com": {
      "blurred": ["img.profile", "div.sidebar"],
      "highlighted": ["h1", ".important"],
      "regions": [...],
      "highlightRegions": [...],
      "settings": {
        "blurIntensity": 5,
        "highlightColor": "#FFFF00",
        "highlightOpacity": 0.5
      }
    }
  }
}
```

## Privacy

- **No Data Collection**: This extension does not collect, transmit, or store any user data externally
- **Local Storage Only**: All configurations are stored locally in your browser
- **No Network Requests**: The extension works completely offline
- **No Tracking**: No analytics or tracking of any kind

## Permissions

- **activeTab**: To access and modify the current page
- **scripting**: To inject the blur/highlight functionality
- **storage**: To save and load configurations

## Browser Compatibility

- Chrome/Chromium 88+
- Microsoft Edge (Chromium-based)
- Other Chromium-based browsers

## Development

### Project Structure
```
blurt-ool/
├── background.js       # Service worker
├── content.js          # Content script (main logic)
├── manifest.json       # Extension manifest
├── images/             # Icon files
│   ├── icon16.png
│   ├── icon64.png
│   └── icon128.png
├── generate-icons.js   # SVG icon generator
├── create-png-icons.js # PNG icon generator
└── README.md          # This file
```

### Building Icons
```bash
# Generate SVG icons
node generate-icons.js

# Generate PNG icons
node create-png-icons.js
```

## Changelog

### Version 1.3 (Current)
**New Features:**
- ✨ **Keyboard Shortcuts Help Modal** - Press **?** to see all shortcuts
- ✨ **Enhanced Keyboard Shortcuts** - 15+ new shortcuts including:
  - Ctrl+S (Save), Ctrl+O (Load), Ctrl+E (Export)
  - Ctrl+A (Select all images), Ctrl+Shift+A (Select all videos)
  - 1, 2, 3 (Quick preset application)
  - Delete (Clear all effects)
- ✨ **Compact Toolbar Mode** - Toggle with Ctrl+Shift+C for minimal UI
- ✨ **Active Tool Visual Feedback** - Highlighted buttons show active tool
- ✨ **Smart Export Filenames** - Format: `blur-domain.com-2024-11-14.json`
- ✨ **Help Button** - Click **?** button in toolbar for shortcuts guide
- ✨ **Input Field Protection** - Shortcuts disabled when typing in inputs

**UX Improvements:**
- 🎨 Beautiful keyboard shortcuts modal with categorized shortcuts
- 🎨 Active tool highlighting with color and shadow
- 🎨 Compact mode reduces toolbar size by 25%
- 🎨 Smart notifications for all keyboard actions
- 🎨 Modal closes with Esc or ? key

### Version 1.2
**New Features:**
- ✨ Save/Load configurations per domain
- ✨ Auto-apply saved configurations
- ✨ Export/Import blur patterns
- ✨ Keyboard shortcuts (Ctrl+Shift+B, Ctrl+Z, etc.)
- ✨ Blur presets (Light/Medium/Heavy)
- ✨ Quick-select common elements
- ✨ Redo functionality
- ✨ Visual notifications for actions
- ✨ Toolbar visibility toggle

**Bug Fixes:**
- 🐛 Fixed missing icon files
- 🐛 Fixed memory leaks in history
- 🐛 Fixed screenshot timing issues
- 🐛 Fixed region positioning on scroll
- 🐛 Fixed z-index conflicts
- 🐛 Fixed text selection restoration
- 🐛 Added DOM existence checks
- 🐛 Fixed history tracking order
- 🐛 Removed unused files

### Version 1.1
- Initial release with basic blur/highlight functionality

## Known Limitations

1. **Dynamic Content**: Saved configurations may not work perfectly with dynamically loaded content
2. **Complex Selectors**: Some complex CSS selectors may not be generated accurately
3. **PDF Export**: Not currently implemented (PNG screenshots only)

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

This project is open source. Feel free to use, modify, and distribute as needed.

## Support

If you encounter any issues or have feature requests, please:
1. Check the existing issues
2. Create a new issue with detailed information
3. Include browser version and steps to reproduce

## Credits

Developed with ❤️ for privacy-conscious users who need to blur sensitive information in screenshots and presentations.

---

**Version**: 1.3
**Last Updated**: November 2024
**Manifest Version**: 3 (Chrome Extensions Manifest V3)

💡 **Pro Tip**: Press **?** anytime to see all keyboard shortcuts!
