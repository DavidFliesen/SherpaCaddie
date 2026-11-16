# Sherpa Caddie v0.13.4 — Sage-Controlled Swing Positions

Upload the contents of this changed-files package to the root of the `DavidFliesen/SherpaCaddie` repository.

## Replace these files

- `index.html`
- `sw.js`
- `swing-viewer.js`
- `arteziq-ui.js`
- `README.md`
- `UPLOAD-INSTRUCTIONS.md`

The existing `swing-viewer.css` and all twenty swing-position images remain unchanged from v0.13.3.

## What this fixes

- Lets Sage show an individual P position through the native app bridge.
- Advances the viewer through P-position references during spoken explanations.
- Uses the same bridge for D-ID now and the future ARTEZIQ Conversational Avatar.
- Recognizes direct requests such as “Show P4” even if D-ID does not dispatch its configured tool.
- Removes the unused Music level setting while retaining Sage and interface sound volume.
- Restores the full README development record and places the current version at the top.
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

Wait for GitHub Pages and Cloudflare Pages to finish deploying. Because this release changes the service-worker cache to `sherpa-caddie-v0.13.4`, reopen or refresh the installed PWA after deployment so the new cache can activate.
