# Creating Full Height iPhone Screenshots (1290 × 2796)

## The Problem
Your webpage content doesn't fill the full 2796 pixel height, so you can't scroll to capture the full dimensions.

## Solution 1: Use CSS to Extend Page Height

1. **In Chrome Dev Tools**, go to the **Console tab**
2. **Paste this code** and press Enter:
```javascript
document.body.style.minHeight = '2796px';
document.documentElement.style.minHeight = '2796px';
```
3. **Now take the full size screenshot** (Ctrl+Shift+P → "Capture full size screenshot")

## Solution 2: Add Content Temporarily

1. **In Console**, add temporary content:
```javascript
const spacer = document.createElement('div');
spacer.style.height = '2000px';
spacer.style.background = 'linear-gradient(to bottom, #f8f9fa, #e9ecef)';
document.body.appendChild(spacer);
```
2. **Take screenshot**

## Solution 3: Multiple Screenshots + Stitch

Since App Store accepts different content in each screenshot:

1. **Take multiple screenshots** of different app sections:
   - Dashboard (current screenshot)
   - Daily Tasks page
   - Medical Information page
   - Mood Tracking page
   - Academic Planner page

2. **Each should be 1290 × 2796** showing different features

## Solution 4: Design-Focused Screenshot

Create marketing-style screenshots:

1. **In Console**, add text overlays:
```javascript
const overlay = document.createElement('div');
overlay.innerHTML = `
<div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
background: rgba(0,0,0,0.8); color: white; padding: 40px; border-radius: 20px; 
text-align: center; z-index: 9999;">
<h2>Build Independence with Confidence</h2>
<p>Daily task management designed for neurodevelopmental support</p>
</div>`;
document.body.appendChild(overlay);
```

## Solution 5: Use Different Pages for Each Screenshot

Navigate to different sections of your app:
- www.adaptalyfeapp.com (Dashboard)
- Add `/daily-tasks` to URL for tasks page
- Add `/medical` for medical page
- Add `/student` for academic features
- Add `/mood-tracking` for mood features

Each page will have different content and fill the height naturally.

## Recommended Approach

**Take 5-6 different screenshots** showing:
1. **Dashboard Overview** - Main interface
2. **Daily Tasks** - Task management features  
3. **Medical Info** - Health tracking
4. **Student Tools** - Academic planning
5. **Mood Tracking** - Emotional wellness
6. **Safety Features** - Emergency contacts

This gives Apple reviewers a complete view of your app's capabilities, and each screenshot can focus on different features at the full 1290 × 2796 dimensions.