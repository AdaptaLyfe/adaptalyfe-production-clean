# Fix Chrome Screenshot Scaling Issue

## Problem
Chrome is scaling the viewport automatically, giving you 1222x913 instead of 1290x2796.

## Solution 1: Disable Auto-Scaling

1. **In Chrome Developer Tools** (F12)
2. **Click the 3 dots menu** in developer tools (top right of dev tools panel)
3. **Go to Settings** 
4. **Find "Emulation"** section
5. **Uncheck "Auto-adjust zoom"** or **"Fit to window"**
6. **Set zoom to 100%**
7. **Now set device to 1290 × 2796**
8. **Take screenshot**

## Solution 2: Use Browser Zoom Reset

1. **Press Ctrl+0** (or Cmd+0 on Mac) to reset browser zoom to 100%
2. **Set viewport to 1290 × 2796**
3. **Make sure the device pixel ratio is 1**
4. **Take screenshot**

## Solution 3: Use Full Page Screenshot

1. **In Chrome Dev Tools**, press **Ctrl+Shift+P** (Cmd+Shift+P on Mac)
2. **Type "screenshot"**
3. **Select "Capture full size screenshot"**
4. **This should give you exact dimensions**

## Solution 4: Manual Browser Window

1. **Close developer tools**
2. **Open new Chrome window**
3. **Resize browser window manually** to be tall and narrow
4. **Go to www.adaptalyfeapp.com**
5. **Use system screenshot** (Windows+Shift+S or Cmd+Shift+4)
6. **Crop to exactly 1290 × 2796** in image editor

## Solution 5: Online Tool Alternative

Use **LambdaTest**: https://www.lambdatest.com/mobile-view-website
- Select "Custom Device"
- Set 1290 × 2796 resolution
- Enter URL: www.adaptalyfeapp.com
- Download screenshot

## Verification Command

After taking screenshot, verify dimensions:
- **Windows**: Right-click file → Properties → Details tab
- **Mac**: Right-click file → Get Info → More Info section
- Should show exactly **1290 × 2796 pixels**

## Quick Fix

Try **Solution 3** first - the "Capture full size screenshot" command usually gives exact dimensions without scaling issues.