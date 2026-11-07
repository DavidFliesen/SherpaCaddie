# Sage Local integration map

Baseline is the supplied Sherpa Caddie v0.12.11 (build 0142). It is a static PWA with no build step or automated tests in the source ZIP.

| Area | Baseline entry points | Phase 1 connection |
| --- | --- | --- |
| App shell and routing | `index.html` owns the live CSS, screens, tab routing via `show(view)`, and persistent Sage dock. The standalone `app.js` and `styles.css` are legacy files without references in the active HTML. | Add the flag, Settings ACA/DCA comparison, Local Sage controls, shared portrait placement, lifecycle hooks, and both footer version labels in `index.html`. |
| Text | `submitCompanionQuestion` → `askSherpaAI` → phone-safe deterministic answer or WebLLM on supported wider devices. | The existing Text card is the fallback for speech failure. |
| Voice | Same answer path, plus browser speech recognition, optional wake words, and `speakSherpa` with Kokoro or system speech. `arteziq-audio.js` and `arteziq-ui.js` provide volume and settings. | Local Sage uses the app's spoken-reply and volume settings with its own audio lifetime. |
| D-ID Video | `setSherpaMode`, `loadDidConfig`, `loadDidSdk`, `connectSherpaLive`, `sendSherpaLive`, and `resetDidTransport`. The optional SDK is imported on demand and sends messages over the D-ID session. The neutral poster remains up while the stream warms. | Keep Video selectable. Invalidate an outgoing connection, callbacks and tool handlers when leaving Video. Tear down transport on page hide and terminal error. |
| Tools | `registerSherpaLiveTools` registers nine client handlers. `detectSherpaToolIntent` and `trySherpaToolBridge` also dispatch supported intents directly. GUIDE diagnostics check SDK events and the browser handler. | Local Sage uses a separate gateway and a single read-only route query. |
| Saved data | Browser storage holds club carry yards by name, bag mode and post-game review records. Selected course, weather, strategy and pre-game plan are held in page state. Garmin imports feed REVIEW through `garmin-round-import.js`. The five files in `rag/` document golf guidance. | Read the active route only. |
| Shipping and cache | `sw.js` owns the cache namespace and offline shell. `manifest.webmanifest` sets the installed app entry. `did-config.json` and three GitHub workflows provision or attach the legacy integration. | Update `sw.js`, `manifest.webmanifest`, and `README.md`. New Phase 1 code is in `sage-local/` and `assets/sage-local/`, with checks in `tests/`. |

## Existing Video handlers

| Handler | Actual behavior in the supplied source |
| --- | --- |
| `get_round_context` | Reads selected course, pre-game plan and latest post-game review. Reports live tracking as disabled. |
| `get_shot_recommendation` | Returns planning context, strategy and general target advice. |
| `get_weather_context` | Reads loaded temperature, wind, gusts and direction. Fields can be unavailable. |
| `get_club_distances` | Reads the active bag and carry distances. |
| `set_strategy` | Validates smart, attack or layup and updates planner state and display. |
| `open_hole_planner` | Requires a selected course, activates PLAN and opens the Hole Planner. |
| `record_shot`, `finish_hole`, `next_hole` | Return disabled results during normal use. Diagnostic calls are dry runs. |

The nine workflow registrations still describe some retired live-round actions. Phase 1's experimental gateway exposes only `get_app_context({field: "tab"})` and returns the app's verified active tab. Local Sage uses the kickoff contracts with browser-native JavaScript modules so the PWA can still be deployed as static files.

## Files in this update

| Group | Files |
| --- | --- |
| Existing PWA files | `index.html`, `sw.js`, `manifest.webmanifest`, `README.md` |
| Phase 1 modules | `sage-local/index.mjs`, `sage-local/session-controller.mjs`, `sage-local/tool-registry.mjs`, `sage-local/portrait.mjs` |
| Clip and regeneration | `assets/sage-local/practice.mp3`, `sage-local/demo.mjs`, `sage-local/generate-demo.py` |
| Tests | `tests/sage-local.test.mjs`, `tests/sage-local.browser.mjs` |
| Notes | `docs/SAGE_LOCAL_INTEGRATION.md`, `docs/SAGE_LOCAL_TESTING.md`, `docs/SAGE_LOCAL_VOICE_PROVENANCE.md` |
