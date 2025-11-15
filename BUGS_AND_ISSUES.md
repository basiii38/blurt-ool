# Bug Report - Element Blur Extension

## Critical Bugs

### 🔴 Bug #1: Text Blur/Highlight Not Properly Cleared
**Location:** `content.js:35-42` (clearAllBlurs function)

**Issue:**
The `clearAllBlurs()` function only removes CSS classes from `.blur-text` and `.highlight-text` elements but doesn't unwrap the `<span>` elements. This leaves empty span wrappers in the DOM.

**Current Code:**
```javascript
document.querySelectorAll('.blur-text').forEach(el => el.classList.remove('blur-text'));
document.querySelectorAll('.highlight-text').forEach(el => el.classList.remove('highlight-text'));
```

**Expected Behavior:**
Should unwrap the span elements and restore original text structure, like the undo function does:
```javascript
while (span.firstChild) {
  span.parentNode.insertBefore(span.firstChild, span);
}
span.remove();
```

**Impact:** High
- Leaves broken HTML structure in the page
- Multiple clear operations create nested empty spans
- Can break page functionality

---

### 🔴 Bug #2: Text Blurs Not Saved in State
**Location:** `content.js:274-313` (serializeBlurState function)

**Issue:**
The `serializeBlurState()` function saves blurred/highlighted elements and regions, but completely ignores `.blur-text` and `.highlight-text` span elements.

**Current Code:**
```javascript
function serializeBlurState() {
  const state = {
    blurred: [],
    highlighted: [],
    regions: [],
    highlightRegions: [],
    settings: { ... }
  };

  document.querySelectorAll('.blurred').forEach(el => { ... });
  document.querySelectorAll('.highlighted').forEach(el => { ... });
  document.querySelectorAll('.blur-region, .highlight-region').forEach(el => { ... });

  // Missing: .blur-text and .highlight-text elements!

  return state;
}
```

**Impact:** Critical
- Text blurs are lost when saving configuration (Ctrl+S)
- Text blurs are lost when saving custom presets
- Text blurs are lost on page reload
- Users think text is saved but it's actually not

---

### 🟡 Bug #3: Preset Import Checks Name Instead of ID for Duplicates
**Location:** `content.js:1294` (importPresetsFile function)

**Issue:**
When importing presets, the duplicate check uses `preset.name` instead of `preset.id`. This can cause:
1. ID collisions (two presets with same ID but different names)
2. Presets with same name but different IDs being treated as duplicates

**Current Code:**
```javascript
if (!customPresets.some(p => p.name === preset.name)) {
  customPresets.push(preset);
  added++;
}
```

**Should Be:**
```javascript
if (!customPresets.some(p => p.id === preset.id)) {
  customPresets.push(preset);
  added++;
}
```

**Impact:** Medium
- Can create duplicate IDs in storage
- Delete operations might delete wrong preset
- Prevents importing presets with same name but different content

---

### 🟡 Bug #4: Preset ID Collision Possible
**Location:** `content.js:50` (saveAsPreset function)

**Issue:**
Using `Date.now().toString()` for preset IDs can cause collisions if two presets are created in the same millisecond (possible with fast clicking or automated actions).

**Current Code:**
```javascript
id: Date.now().toString()
```

**Better Approach:**
```javascript
id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
```

**Impact:** Low
- Rare edge case
- More likely in automated testing
- Could cause confusion if it happens

---

### 🟡 Bug #5: CSS Selectors May Not Be Unique or Stable
**Location:** `content.js:304-313` (getElementSelector function)

**Issue:**
The selector generation is too simplistic:
1. Elements without IDs or classes only get tag name (e.g., "div")
2. Multiple elements can match the same selector
3. Selectors break if classes change dynamically

**Current Code:**
```javascript
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
```

**Impact:** Medium
- Saved configurations may apply to wrong elements
- Multiple elements get blurred when only one should
- Breaks on dynamic pages (React, Vue, etc.)

---

## Medium Issues

### 🟠 Issue #1: History Memory Leak Potential
**Location:** `content.js:111-116` (trackBlurAction function)

**Issue:**
History stores references to DOM elements. If an element is removed from the page but still in history, it won't be garbage collected until history is cleared or element is pushed out by MAX_HISTORY_SIZE limit.

**Impact:** Low-Medium
- Memory accumulates on long sessions
- Especially bad on dynamic single-page apps
- MAX_HISTORY_SIZE=50 helps but doesn't eliminate issue

**Recommendation:**
Consider storing element data instead of element references, or implement history cleanup when elements are removed.

---

### 🟠 Issue #2: Race Condition on Page Load
**Location:** `content.js:1944-1946` (auto-load on page setup)

**Issue:**
Configuration auto-loads with 500ms delay, but:
1. Page might still be loading (dynamic content not yet rendered)
2. DOM elements might not exist yet
3. Layout shifts could happen after load

**Current Code:**
```javascript
setTimeout(async () => {
  await loadSavedState(false);
}, 500);
```

**Impact:** Medium
- Saved blurs might not apply to late-loading elements
- Regions might be positioned incorrectly
- Inconsistent behavior across different page types

**Recommendation:**
Use MutationObserver or listen for DOMContentLoaded / window.load events.

---

### 🟠 Issue #3: Undo After Clear Tries to Restore Removed Elements
**Location:** `content.js:1449-1455` (clear button) and `content.js:1400-1434` (undo button)

**Issue:**
When you clear all blurs, the regions are removed from DOM but still tracked in history. If you undo, it tries to re-append removed elements which may cause issues.

**Flow:**
1. Draw blur region → tracked in history
2. Click Clear All → region removed from DOM
3. Click Undo → tries to restore, but element was already removed by clear

**Impact:** Low
- Undo after clear might not work correctly
- History becomes out of sync with DOM state

**Recommendation:**
Clear history when Clear All is clicked, or mark history items as "cleared".

---

## Low Priority Issues

### 🟢 Issue #4: No Validation on Preset Names
**Location:** `content.js:1164-1189` (createNewPreset function)

**Issue:**
Preset names aren't validated for:
- Empty strings after trim
- Special characters that might break UI
- Extremely long names
- HTML injection in name field

**Impact:** Low
- UI might break with very long names
- No security risk (not eval'd or executed)
- Just UX issue

---

### 🟢 Issue #5: applyPreset Doesn't Validate Preset Structure
**Location:** `content.js:71-97` (applyPreset function)

**Issue:**
No validation that preset contains required fields before applying:
```javascript
blurIntensity = preset.settings.blurIntensity || blurIntensity;
```

If `preset.settings` is undefined, this throws an error.

**Impact:** Low
- Only happens with corrupted data
- Try-catch in calling code might handle it
- Could show better error message to user

---

## Recommendations Summary

### High Priority Fixes:
1. ✅ Fix clearAllBlurs() to properly unwrap text blur spans
2. ✅ Add text blur/highlight serialization to serializeBlurState()
3. ✅ Fix import duplicate check to use ID instead of name

### Medium Priority Fixes:
4. ⚠️ Improve preset ID generation to prevent collisions
5. ⚠️ Enhance CSS selector generation for better stability
6. ⚠️ Add validation to applyPreset() for preset structure

### Low Priority Improvements:
7. 💡 Implement better element reference handling in history
8. 💡 Improve auto-load timing with proper page load detection
9. 💡 Add preset name validation
10. 💡 Clear history when Clear All is used

---

## Testing Recommendations

### Test Scenarios to Verify:
1. ✅ Create text blur → Save → Reload page → Should restore text blur
2. ✅ Create multiple blur types → Clear All → Undo → Should restore correctly
3. ✅ Create preset → Export → Import → Should not create duplicates
4. ✅ Apply blur to dynamic content → Refresh → Should restore correctly
5. ✅ Create many presets quickly → Check for ID collisions

---

Last Updated: 2024
