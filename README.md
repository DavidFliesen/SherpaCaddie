# Sherpa Caddie
### Version 0.3.4

**PWA:**  
https://davidfliesen.github.io/SherpaCaddy

## Purpose

Sherpa Caddie combines the practical help of a **caddie** with the guidance and perspective of a **Sherpa mentor**. It is designed especially for new and recreational golfers who benefit more from one clear decision than from a screen full of statistics.

The core idea is simple: **one shot at a time.**

## Version 0.3.3

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


### v0.3.3 — Ask Sherpa Fix
- Rebuilt Ask Sherpa interaction around a proper form submit handler.
- Ask button now responds reliably.
- Enter key submits the question.
- Microphone input submits recognized speech automatically where browser speech recognition is supported.
- Added a dedicated visible Sherpa reply panel.
- Added optional spoken answers using browser text-to-speech.
- Expanded the local Sherpa knowledge engine for club selection, safe targets, mental reset, wind, hazards, putting, scoring, etiquette, and beginner questions.
- During an active round, Ask Sherpa now uses the current hole, remaining distance, personal club distances, current recommendation, safe target, and mental cue.
- Ask Sherpa remains local and does not require a backend or API key. It is rule-based rather than a generative AI model.


### v0.3.4 — Course Planning Maps

Added an interactive course-planning map to the **Play** screen.

#### Planning map features

- New **Plan Course Map** button after a course is selected.
- Interactive mobile/tablet-friendly map using Leaflet.
- OpenStreetMap base map with required attribution.
- OpenStreetMap/Overpass golf overlays where community mapping is available:
  - course boundary
  - hole paths
  - fairways
  - greens
  - tees
  - bunkers
  - water
  - pins
- Course Overview control.
- Hole 1–18 selector that zooms to numbered hole paths when available.
- Tap anywhere on the map to place a temporary **planning target**.
- Clear Target control.
- Sherpa planning reminder to favor the widest useful landing area and avoid the trouble that can create a big number.
- Graceful fallback to the base course map when detailed golf features are not mapped.
- Course map remains a planning tool and is kept separate from the simplified in-round One-Shot Sherpa screen.

#### Data and connectivity

Course location/scorecard data continues to come from OpenGolfAPI when available. Current weather continues to use Open-Meteo. Detailed course geometry comes from OpenStreetMap through the Overpass API.

Map tiles and detailed map data require an internet connection. They are intentionally not bulk-downloaded or prefetched into the PWA cache.
