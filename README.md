## Version 0.11.2 — Mobile Scaling + GUIDE Launch Fix

- Sherpa Caddie now always opens on **GUIDE**, including when a round is already in progress. The active round remains preserved and appears when PLAY is selected.
- Added stronger responsive viewport rules for iPhone, Android phones, compact Android tablets, iPad portrait/landscape, and desktop/tablet browsers.
- Prevents wide grid/flex children from expanding the document beyond the viewport.
- Adds explicit horizontal-overflow protection and `min-width:0` handling throughout the app shell.
- Makes the five top navigation tabs fit the available phone width without requiring pinch-to-zoom.
- Tightens the active-round layout on narrow phones and keeps club/choice rows locally scrollable instead of widening the whole page.
- Increased splash-screen title, tagline, and loading caption size on phones while retaining the Sherpa Caddie logo.
- Bumped cache/version identifiers so iOS Safari and installed PWAs fetch the corrected responsive layout.

### Device targets checked in the responsive design
The CSS now explicitly covers:
- compact phones around 360–390 CSS px wide (common Android and iPhone mini/SE-class widths),
- iPhone 13-class widths around 390 CSS px,
- larger iPhones and Android phones,
- small/large Android tablets,
- iPad portrait and landscape,
- desktop/tablet widths.

Physical device testing is still recommended because Safari and Android browser UI can change the effective viewport height/width.

## Version 0.11.1 — Sherpa Live Connection Fix

- Restored the **canonical Sherpa Caddie logo** to the launch animation. Sage's realistic portrait remains limited to the Sherpa Live experience and transcript.
- Removed the stale D-ID client key that belonged to the previous Sage Agent.
- Added `did-config.json`, loaded network-first/no-store so the current Sage Agent key can be updated without another application-code release.
- Added the manual GitHub Action **Provision D-ID client key**. It uses the existing private `DID_API_USERNAME` / `DID_API_PASSWORD` repository secrets to create a current, agent-scoped D-ID client key restricted to `https://davidfliesen.github.io`, then commits that frontend-safe key into `did-config.json`.
- Sherpa Live now tries the current D-ID Client SDK from jsDelivr first, with esm.sh as a fallback, and reports a specific configuration/SDK/connection error instead of remaining indefinitely on Connecting.
- `did-config.json` is intentionally excluded from service-worker caching.

### One-time provisioning after installing v0.11.2
1. Upload the v0.11.2 changed files.
2. GitHub → Actions → **Provision D-ID client key** → Run workflow on `main`.
3. Wait for the resulting GitHub Pages deployment.
4. Fully close/reopen Sherpa Caddie and choose **Sherpa Live**.


# Sherpa Caddie
### Version 0.11.0

**PWA:**  
https://davidfliesen.github.io/SherpaCaddy

## Purpose

Sherpa Caddie combines the practical help of a caddie with the guidance and perspective of a Sherpa mentor. The core principle remains **one shot at a time**.

## v0.11.2 — Sherpa Live Client SDK

This release replaces the visible D-ID Embed with the D-ID Client SDK so Sage is integrated into Sherpa Caddie as part of the app rather than appearing as a third-party overlay.

### Sherpa experiences

- **Text** — quiet/local Sherpa guidance without D-ID streaming.
- **Voice** — hands-free local Sherpa without avatar video.
- **Sherpa Live** — Sage appears inside the native Sherpa dashboard, answers through D-ID streaming, and can use Sherpa Caddie client tools.

### Sherpa Live SDK

- Uses D-ID Agent `v2_agt_cPCRZyGW` through the Client SDK.
- D-ID is connected only when the golfer explicitly selects Sherpa Live.
- The app owns the video frame, transcript, connection indicators, controls, and golf dashboard.
- Browser speech recognition remains the microphone input layer for the V2 photo avatar; D-ID automatically speaks/animates Sage's replies.
- Hands-free listening pauses while Sage speaks and resumes afterward.

### Client tools

The nine attached D-ID client tools are registered inside the PWA: round context, shot recommendation, weather, club distances, record shot, finish hole, next hole, strategy, and Hole Planner. Deterministic golf data remains controlled by Sherpa Caddie rather than guessed by the Agent.

### Sage visual synchronization

- Added the redesigned modern golf-guide Sage portrait as an app asset.
- The same Sage identity appears in Sherpa Live, transcript imagery, and the launch animation.
- The formal/military-style presentation has been replaced with a cleaner forest-green golf quarter-zip look.

### Changed files in v0.11.2

- `index.html`
- `manifest.webmanifest`
- `sw.js`
- `README.md`
- `assets/sage-sherpa-live.webp` (new)

## v0.9.0 — Five-Tab Navigation + Beginner Setup

This release simplifies the app around five persistent top-level destinations and expands beginner guidance.

### Navigation

- **🏔️ Guide** — opening screen with Sherpa AI and hands-free voice guidance
- **🏌️ Play** — find a course, choose tees, check conditions, plan, and start a round
- **🏑 Clubs** — full bag or Sunday Bag setup with personal carry distances
- **🧭 Learn** — expanded golf learning hub
- **📒 Review** — saved rounds, summaries, import, and export

The old second row of Home-screen action cards has been removed so navigation is no longer duplicated.

### Tee guidance

- Forward/shortest tees are the default beginner setting.
- Common red, gold, white, and blue tee conventions are explained at the point where the player chooses tees.
- The app explicitly notes that tee colors are not universal and that players should choose by distance and comfort.

### Clubs

- Clubs is now a full tab instead of a modal overlay.
- Added **Full Bag** and **Sunday Bag** modes.
- The Sunday Bag starter preset uses Driver, 4 Hybrid, 7 Iron, Pitching Wedge, Sand Wedge, and Putter.
- Sherpa recommendations, planning strategy, AI context, and in-round club controls respect the selected bag.

### Learn

Learn now covers far more than the original six ideas, with expandable lessons for:

- getting started and tee selection
- club purposes and fundamentals
- course management, safe misses, wind, hazards, and layups
- chipping, pitching, bunkers, and putting
- scoring, pace of play, safety, courtesy, and course care
- mental-game resets and one-shot-at-a-time focus
- par-3, par-4, and par-5 strategy

### Changed files in v0.10.0

- `index.html`
- `manifest.webmanifest`
- `sw.js`
- `README.md`

## v0.8.0 — Natural Hands-Free Sherpa

This release fixes the splash-logo aspect ratio and substantially upgrades the hands-free conversation loop.

### Voice and AI changes

- Fixed the splash logo so its original aspect ratio is preserved; the circular Sherpa emblem is no longer intentionally stretched by the page layout.
- Sherpa AI now initializes automatically in the background. **Load Sherpa AI** is replaced by **Restart AI** as a recovery control rather than a required setup step.
- Uses **Qwen3 0.6B** as the preferred local WebLLM model when supported, with **Qwen2.5 0.5B** and the previous lightweight model as fallbacks.
- Added local **Kokoro-82M** TTS for more natural spoken replies, with selectable Sherpa voices and a carefully selected system-voice fallback.
- Hands-Free accepts **Sherpa**, **Hey Sherpa**, **Okay Sherpa**, and **Hi Sherpa**.
- Added a short wake window so the browser can recognize the wake phrase and the question as separate transcripts without dropping the question.
- When Spoken Replies is enabled, hands-free answers are spoken automatically and listening resumes after Sherpa finishes speaking.
- Deterministic commands such as yardage, club recommendation, target guidance, shot recording, and hole navigation remain ordinary app logic outside the LLM.
- Qwen thinking tags are stripped from visible/spoken answers and direct-answer prompting is strengthened.

### PWA speech-input note

The PWA continues to use the browser speech-recognition API for microphone transcription in this release. A full sherpa-onnx WebAssembly ASR package can add roughly hundreds of megabytes of speech-model data, which is not appropriate to force into the current GitHub Pages PWA without a separate model packaging/build step. The voice flow is now modular so sherpa-onnx ASR/KWS can replace browser recognition in the later native iOS/Android packages while keeping the same Hands-Free Sherpa interaction.

### Changed files in v0.8.0

- `index.html`
- `manifest.webmanifest`
- `sw.js`
- `README.md`

## Current retained features

- Guide | Play | Clubs | Learn | Review layout
- Branded splash and dark golf-app shell
- Full Bag / Sunday Bag selection with personal club distances
- One-Shot Sherpa shot guidance
- Weather and course search
- Hole Planner with map/schematic fallback
- Front / center / back planning yardages
- Play Smart / Attack / Lay Up strategies
- Local round storage and import/export
- Hands-Free Caddie controls on Guide and during a round

## Changelog

### v0.11.2 — Sherpa Live Client SDK
- Replaced the D-ID embed UI with the D-ID Client SDK.
- Added native Text / Voice / Sherpa Live experience modes.
- Registered all nine Sherpa client-tool handlers in the browser.
- Added native Sage video, golf-context, transcript, listening/speaking, and connection UI.
- Added the redesigned Sage portrait to Sherpa Live and the launch animation.
- D-ID connects only after Sherpa Live is explicitly selected.
- Updated PWA/cache versioning to **v0.11.2**.

### v0.10.0 — Sherpa Live D-ID Integration
- Added Text / Sherpa Live mode switching on the Guide screen.
- Integrated the supplied D-ID Agent using full mode with a dedicated in-app target container.
- D-ID is loaded on demand only when Sherpa Live is selected.
- Added clear internet/usage note and a Restart Live control.
- Updated PWA/cache versioning to **v0.10.0**.


### v0.9.0 — Five-Tab Navigation + Beginner Setup
- Added Guide / Play / Clubs / Learn / Review persistent navigation.
- Removed redundant home-screen action cards.
- Promoted Clubs to its own full page.
- Added Full Bag and Sunday Bag modes and made club recommendations bag-aware.
- Made forward/shortest tees the beginner default and added tee-color guidance.
- Expanded Learn into a multi-category golf learning hub.
- Updated PWA/cache versioning to **v0.9.0**.


### v0.8.0 — Natural Hands-Free Sherpa
- Corrected splash-logo aspect handling.
- Auto-started local AI in the background.
- Added Qwen3/Qwen2.5 local AI choices.
- Added local Kokoro natural TTS and voice selection.
- Added broader wake phrase handling and split wake/question flow.
- Made spoken hands-free replies automatic with listening resumed after speech.
- Updated PWA/cache versioning to v0.8.0.

## Version 0.6.4 — Course Search Repair

This release repairs the course-search path and makes the golf-course database the primary source of truth. It keeps the v0.6.3 fast logo work, v0.6.1 header contrast treatment, and the v0.6 Hole Planner redesign.

### Fixed in v0.6.4

- Corrected the OpenGolf nearby-search parameter from `radius` to the documented **`radius_mi`**.
- Made **OpenGolfAPI** the primary source for nearby and name-based course discovery.
- Added an **OpenGolf state-index fallback** for ZIP/city searches, then filters courses by actual distance from the resolved search point.
- Added alternate-name searching so older/common course names can resolve to current database names.
- Kept OpenStreetMap/Overpass only as a fallback instead of making it a critical dependency.
- Added a third Overpass endpoint for hole-geometry fallback.
- Fixed contradictory result messaging that could report successful sources but display no courses.
- Selected OpenGolf courses now load their full course detail/scorecard in the background.
- Hole-map geometry now cycles through multiple Overpass endpoints before falling back to Sherpa's schematic planner.

### Retained

- Optimized fast-loading Sherpa logo and branded splash screen.
- High-contrast logo plaque in the dark branded header.
- Home | Play | Learn | My Rounds navigation.
- Full Bag / Sunday Bag selection with personal club distances, weather, One-Shot Sherpa, local round storage, import/export, voice, and Sherpa AI.
- Hole Planner with front/center/back yardages, strategy modes, hazards, target planning, and schematic fallback.

### Changed files in v0.6.4

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

### v0.8.0 — Natural Hands-Free Sherpa
- Corrected splash-logo aspect ratio.
- Auto-started the local AI in the background.
- Added Qwen3 0.6B / Qwen2.5 0.5B model selection.
- Added local Kokoro natural speech synthesis.
- Added broader wake-phrase support and split wake/question handling.
- Made spoken hands-free replies automatic with listening resumed after speech.
- Updated PWA/cache versioning to **v0.8.0**.


### v0.7.0 — Hands-Free Sherpa AI
- Added Hands-Free Caddie mode with the “Sherpa” wake phrase.
- Added independent Spoken Replies toggle.
- Added local voice commands for common round actions so scoring and navigation can require fewer screen taps.
- Added AI echo detection, automatic retry, and deterministic fallback responses.
- Made the 1B model the recommended default while preserving the lightweight fallback.
- Prevented Sherpa speech output from feeding back into speech recognition.
- Added the voice-mode controls to the active-round screen.
- Updated PWA/cache versioning to **v0.7.0**.


### v0.6.4 — Course Search Repair
- Corrected the OpenGolf location parameter from `radius` to `radius_mi`.
- Made OpenGolf the primary course discovery source.
- Added OpenGolf state-index fallback for ZIP/city searches.
- Added alternate-name matching for renamed courses such as older country-club names.
- Kept OpenStreetMap/Overpass as fallback instead of a required dependency.
- Added full OpenGolf course-detail hydration after course selection.
- Updated PWA/cache versioning to **v0.6.4**.

### v0.6.3 — Fast Logo Loading Fix
- Replaced the large header/splash logo PNG requests with one 37 KB optimized WebP asset.
- Preloaded the logo so it is available immediately for the splash screen and header.
- Fixed the stale splash-logo `v060` URL that remained in later releases.
- Removed the two 535 KB logo PNGs from service-worker pre-caching.
- Changed the splash intro so the logo is visible from the first animation frame.
- Preserved the v0.6.2 course-search fixes and v0.6.1 header contrast improvements.
- Updated PWA/cache versioning to **v0.6.3**.

### v0.6.2 — Course Search Reliability Fix
- Fixed the regression that could return zero golf courses when OpenGolfAPI and the primary Overpass service were unavailable.
- Added OpenStreetMap/Nominatim bounded golf-course search as an independent primary fallback.
- Added ZIP-code area resolution and nearby course search.
- Added a second Overpass endpoint fallback.
- Added search-source diagnostics and clearer failure messages.
- Preserved the v0.6.1 logo/header improvement.
- Updated PWA/cache versioning to **v0.6.2**.

### v0.6.1 — Header Logo Contrast Fix
- Added a dedicated light plaque behind the Sherpa Caddie logo in the header.
- Increased contrast and separation so the logo no longer gets lost against the dark green branded top area.
- Slightly adjusted header sizing and responsive behavior to preserve the stronger brand presence on tablet and smaller screens.
- Updated PWA/cache versioning to **v0.6.1**.

### v0.6.0 — Visual Redesign + Course Location Fix
- Reworked the app shell to look substantially more like a dedicated golf app and less like white web cards.
- Added deep forest branded header and gold active navigation.
- Added richer course, AI, action-card, round, and learning-panel treatments.
- Rebuilt nearby course discovery around OpenStreetMap/Overpass plus OpenGolfAPI.
- Nearby results are sorted by actual distance from device GPS.
- Separated device location from selected-course location.
- Fixed typed-course handling so stale coordinates can no longer be reused.
- Typed course names are resolved against multiple sources before map planning is enabled.
- Added a labeled Sherpa schematic hole visual when exact numbered hole geometry is unavailable.
- Updated PWA/cache versioning to **v0.6.0**.

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
