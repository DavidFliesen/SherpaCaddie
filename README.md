# Sherpa Caddie
### Version 0.3.2

**PWA:**  
https://davidfliesen.github.io/SherpaCaddy

## Purpose

Sherpa Caddie combines the practical help of a **caddie** with the guidance and perspective of a **Sherpa mentor**. It is designed especially for new and recreational golfers who benefit more from one clear decision than from a screen full of statistics.

The core idea is simple: **one shot at a time.**

## Version 0.3.2

This version corrects an earlier v0.3 update that used the wrong codebase. v0.3.2 keeps the simpler visual layout of the original PWA while preserving the complete One-Shot Sherpa feature set.

### UI direction

- Uses the project owner's exact approved Sherpa Caddie logo.
- Uses the approved color palette:
  - Forest Green `#18311C`
  - Fairway Green `#436240`
  - Meadow Green `#869250`
  - Navy Blue `#0B2033`
  - Sand Beige `#EBD9C1`
  - Warm Tan `#BA915B`
  - Stone Gray `#6C6C6A`
- Returns to the earlier four-tab structure:
  - Home
  - Play
  - Learn
  - My Rounds
- Club Setup opens as a focused modal instead of becoming another permanent navigation tab.
- About/version information is kept out of the main playing navigation.
- Main screens are designed to fit on a tablet with minimal scrolling.
- No hamburger menu.
- No disappearing pill navigation.

## Complete One-Shot Sherpa feature set

- Personal club-distance setup
- Simplified in-round screen
- Shot-quality buttons: Good / Okay / Poor
- Optional miss direction: Left / Center / Right / Short / Long
- Club recommendation based on the golfer's stored distances
- Safe-target recommendation
- One mental cue
- New-shot reset message
- Automatic scoring from recorded shots
- Three-item post-round summary

### Post-round guidance

**What cost strokes**  
Most poor shots happened when you selected too little club.

**Next-round focus**  
Pick the target, take one practice swing, and commit.

## Other retained features

- OpenGolfAPI course search
- Browser geolocation for nearby-course attempts
- Open-Meteo current weather
- Ask Sherpa text questions
- Push-to-talk voice input where supported by the browser
- Beginner golf guidance
- Local-only storage
- Round export/import
- Installable PWA
- Offline application shell

## Philosophy

- Every shot is a new start.
- Bad holes happen.
- Focus on the shot you are on.
- When your mind speeds up, return to the fundamentals.
- The last thought before the swing should describe what you want to do.
- Read the course for the safest useful target rather than automatically attacking the flag.
- Take enough club to make a comfortable, committed swing.

## Files

- `index.html` — complete UI, styles, and JavaScript
- `manifest.webmanifest`
- `sw.js`
- `assets/sherpa-caddie-logo.png`
- `assets/sherpa-caddie-palette-reference.jpeg`
- `icons/`
- `README.md`

## Changelog

### v0.3.2
- Restored the preferred original app-layout style.
- Restored all v0.3 One-Shot Sherpa additions.
- Replaced branding with the exact newly supplied logo.
- Rebuilt the interface around the newly supplied palette.
- Reduced top whitespace.
- Removed the hamburger menu and extra permanent tabs.
- Kept Club Setup accessible without cluttering primary navigation.
- Added versioned cache assets to reduce stale GitHub Pages updates.

**Created by David Fliesen**  
© 2026
