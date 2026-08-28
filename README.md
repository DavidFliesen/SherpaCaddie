# Sherpa Caddie
### Version 0.5.1

**PWA:**  
https://davidfliesen.github.io/SherpaCaddy

## Purpose

Sherpa Caddie combines the practical help of a **caddie** with the guidance and perspective of a **Sherpa mentor**. It is designed especially for new and recreational golfers who benefit more from one clear decision than from a screen full of statistics.

The core idea is simple: **one shot at a time.**

## Version 0.5.1

This release keeps the new Hole Planner and upgrades the branded Sherpa splash experience so the app launch feels more polished and intentional.

### New in v0.5.1

- Refined **5-second animated Sherpa splash screen** with a more deliberate app-like introduction
- Upgraded **Hole Planner** modal designed for tablet-first play
- Garmin-inspired **vertical hole view** generated from mapped hole geometry when available
- Right-side planning panel with:
  - focused hole summary
  - front / center / back target yardages
  - strategy modes: **Play Smart**, **Attack**, **Lay Up**
  - recommended club and carry distance
  - wind summary and **plays-like** distance
  - mapped hazard callouts
  - Sherpa strategy guidance
- Hole-to-hole navigation inside the planner
- Tap the map to place a **manual target**, then see the carry/leave distance update
- Planner now defaults to a specific hole instead of only a generic course overview

### Changed files in v0.5.1

- `index.html`
- `manifest.webmanifest`
- `sw.js`
- `README.md`

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

### v0.5.1 — Extended Animated Splash Screen
- Extended the Sherpa splash screen to stay on screen for about 5 seconds.
- Added a more deliberate logo-stage animation to better reinforce the Sherpa Caddie brand and app feel.
- Added a moving ball/path accent and staggered title/subtitle reveal.
- Updated versioning and service-worker cache values to **v0.5.1**.

### v0.5.0 — Hole Planner + Splash Screen
- Added a branded Sherpa splash/loading screen on app launch.
- Rebuilt the course planning modal into a full **Hole Planner** experience.
- Added a Garmin-inspired vertical hole visualization for mapped holes.
- Added front / center / back hole target yardages in the planner.
- Added strategy modes: **Play Smart**, **Attack**, and **Lay Up**.
- Added dynamic recommendation cards for target, club, carry, wind, and plays-like distance.
- Added mapped hazard callouts for bunkers and water when available from course geometry.
- Added previous / next hole navigation inside the planner.
- Added manual target selection from map taps with updated carry and leave distance.
- Updated app-shell versioning and PWA cache version to **v0.5.0**.


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


### v0.4.0 — Sherpa AI

This release replaces the old helper with a **real on-device generative AI assistant** and a cleaner voice workflow.

#### New Sherpa AI features

- **WebLLM** integration for local generative answers running in the browser
- Model selector with:
  - **Fast 1B** model
  - **Smarter 3B** model
- Permanent Sherpa system prompt focused on:
  - club choice
  - safe targets
  - course reading
  - beginner-friendly explanation
  - mental reset and focus
- Sherpa AI automatically receives live app context:
  - selected course
  - current weather
  - current hole and remaining distance
  - lie
  - current recommended club
  - safe target and reasoning
  - golfer's stored club distances
  - planning-map context
- **Improved voice flow**
  - local Whisper speech-to-text through Transformers.js
  - tap **Talk**, speak, tap again to stop, Sherpa transcribes and answers
  - automatic spoken answer using browser speech synthesis
- **On-device only** design:
  - no backend
  - no API key
  - no per-message cost

#### Important notes

- First use downloads model files and caches them in the browser.
- WebLLM requires a browser with **WebGPU** support.
- The smaller 1B model is faster and lighter; the 3B model can give richer answers but takes more memory and time.
- Deterministic app data such as scoring, yardages, saved club distances, and course/map facts remain ordinary app logic. The model interprets those facts rather than inventing them.

#### Changed files in v0.4.0

- `index.html`
- `README.md`
- `manifest.webmanifest`
- `sw.js`


### v0.4.1 — Sherpa AI Loading Fix

This release fixes the first Sherpa AI implementation.

#### Fixes

- Replaced the non-official `esm.sh` WebLLM import with WebLLM's documented direct CDN import:
  `https://esm.run/@mlc-ai/web-llm`
- Switched engine creation to the documented `CreateMLCEngine()` factory.
- Added a real WebGPU adapter test before model loading.
- Changed the default AI to **SmolLM2 360M Instruct**, which is much lighter for iPad-class devices.
- Added **Llama 3.2 1B Instruct** as the higher-quality option.
- Sherpa automatically chooses an `f16` model variant when `shader-f16` is supported, otherwise it uses the compatible `f32` variant.
- Added actual error details to the interface instead of only showing a generic "could not load" message.
- Simplified voice input to one-tap live speech recognition where the browser supports it.
- Voice now stops automatically after the golfer finishes speaking and submits the question.
- Fixed the service worker so it never intercepts or replaces cross-origin AI/model/map requests with the app's `index.html`.
- External AI model files remain online/download-on-first-use and are managed by the AI library/browser cache.

#### Changed files in v0.4.1

- `index.html`
- `README.md`
- `manifest.webmanifest`
- `sw.js`
