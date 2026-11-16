# Sherpa Caddie v0.13.3 — iPad Full GUIDE Layout Fix

Upload the contents of this changed-files package to the root of the `DavidFliesen/SherpaCaddie` repository.

## Replace these files

- `index.html`
- `sw.js`
- `swing-viewer.css`

The existing `swing-viewer.js` and all twenty swing-position images remain unchanged from v0.13.2.

## What this fixes

- Makes Sage's portrait and the full question-and-answer interface an even-height two-column row on iPad and larger screens.
- Reduces unused vertical space without removing Text, Voice, Video, question, answer, or hands-free controls.
- Compacts the P1–P10 viewer so the golfer, coaching panel, playback controls, slider, and every position button fit beneath Sage in the same screen view.
- Restores the complete Sherpa Caddie PWA instead of using a standalone swing-viewer page.
- Places the P1–P10 viewer below Sage on the GUIDE tab.
- Makes “The 10 Golf Swing Positions” the first GUIDE content beneath the navigation.
- Hides the redundant SHERPA AI card below the tabs; Sage’s Text, Voice, and Video controls remain in the top companion area.
- Rebuilds both views around a coherent right-handed swing, including corrected clubface-to-wrist relationships, body rotation, pressure shift, and footwork.
- Uses 20 isolated frame images so neighboring golfers and clubs cannot appear in the current frame.
- Places every pose on the same 620 × 620 canvas with a shared ground and stance anchor.
- Makes the golfer smaller within the first panel, matching the supplied mockup more closely.
- Adds Play, Reverse, Stop, Previous, Next, slider, and direct P1–P10 controls.
- Keeps both Front and 3/4 views.

## After uploading

Wait for GitHub Pages and Cloudflare Pages to finish deploying. Because this release changes the service-worker cache to `sherpa-caddie-v0.13.3`, reopen or refresh the installed PWA after deployment so the new cache can activate.
